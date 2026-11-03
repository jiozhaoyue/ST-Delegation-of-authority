# Authority Postgres 后端（schema+role 隔离 · 真 GRANT/REVOKE · 连接池 · 不可用回落 SQLite）

## Goal

在 Authority fork 内建 Postgres 后端：schema-per-tenant + role-per-tenant 隔离、真 DB 权限管理、连接池、PG 不可用静默回落 SQLite；SDK client.sql.* 契约不变。首波不含限容与审计。加密隐私要求作为 schema 设计约束预留。

## Requirements

R1 **真实数据库后端（PostgreSQL + MySQL 双引擎）**：按 (用户 × 扩展) 分配**独立命名空间**与**专属数据库账号**，
实现 **DB 层强隔离**（由数据库自己拒绝，不是应用层 `if`）。

R1.1 **存储跟随宿主引擎**（用户 2026-09-26 裁定）：Authority 的存储形态**跟随宿主 Luker 的 `storage.mode`**——
不另立一套与宿主无关的存储栈。宿主的四档见 `default/config.yaml`：

| 宿主 `storage.mode` | Authority 该怎么做 |
| --- | --- |
| `fs`（默认） | 保持现状（`DATA_ROOT` 下的文件 + 本地 SQLite），与宿主一致 |
| `sqlite` | 同上（本地 SQLite），与宿主一致 |
| `postgres` | **复用宿主那一台服务器的连接信息**（读宿主 `config.yaml` 的 `storage.postgres.url`），Authority 用自己的命名空间 |
| `mysql` | 同上（`storage.mysql.url`） |

**必须避免的形态**（用户明确拒绝）：宿主已上 DB、而 Authority 还在磁盘上写文件 → **文件孤岛**；
以及让管理员**配两台 PG**（宿主一台 + Authority 一台）→ 双重配置。
**边界**：复用的是**连接信息（服务器/凭据）**，不是宿主的库表结构——Authority 在自己的命名空间里建表，
**不碰宿主的 `chats` / `chat_states` 等表**。
**集成方式**：读宿主 `config.yaml` 的**配置项**，**不 import 宿主内部模块**（避免违反 `L1-MR-5`「把内部实现当公开 API」）。

R1.2 **MySQL 的隔离模型与 PG 不同**（架构决定，理由见 `design.md` §2）：
PG 用 **schema-per-tenant + role-per-tenant**；MySQL 的「schema」就是 database，故用
**database-per-tenant + user-per-tenant**。两者语义等价、都由数据库强制。

R2 **真权限管理**：role 仅被 GRANT 到自己 schema 的所需权限；提供「授予 / 收回 / 查看」三面；
`CONNECTION LIMIT` 与 `statement_timeout` 走 PG 原生——**这是 PG 真能给的那部分限制**（磁盘配额 PG 无原生形式，见 R9）。

R3 **契约零改**：`packages/shared-types/src/sql.ts` 既有字段不删、不改语义、不新增必填字段；
SDK `client.sql.*` 签名不变 → 3 个真实消费者**零改代码**。

R4 **最小侵入**：未分配 PG 的 (用户 × 扩展) 行为与今天**逐字节一致**（继续 SQLite）。
凡改动既有判定，必须走「新增并行判定 + 保留旧判定」的过渡形态（依据 `spec/server-plugin/backend/version-binding.md` §4）。

R5 **静默降级 + 归因**：PG 已分配但不可达 / 认证失败 / 超时 → 回落 SQLite，
且**回执如实标出这次走了哪条路与原因**——不许只剩一个泛化标记（这是 B3 实测踩出来的规矩：
回落原因若只交给回调，worker 里没人接就等于静默）。

R6 **不静默吞错**：PG 侧错误把真实原因带回调用方（连接串脱敏后）。

R7 **连接管理**：连接池；每 role 的连接数与语句超时受 PG 原生限制约束；
池耗尽 / 超时必须**有界等待**（不许悬挂——`L1-MR-7` 同形纪律）。

R8 **加密约束预留**：用户 2026-09-26 裁定（**两轮，后者覆盖前者**）——
**归档保密**（历史归档客户端加密；运行期明文仍过服务器，这是酒馆架构决定的，如实声明）+
**只在纯库模式下加密，与后端 SQLite/PG 正交** + **口令派生 KEK 包裹 DEK（无感）**。
威胁模型只承诺**静态层**（防拷库/备份/跨用户）；**恶意管理员原理上防不了**（浏览器里的 JS 是服务器发的），
**删除与篡改管理员永远有权**——不许可在 README 里吹成「管理员完全看不到」。
**本任务不实现加密**，只保证 schema 与契约不挡它（见 `design.md` §8）。
另：README 与 `docs/` 需**鼓励云酒馆所有者启用后端插件、鼓励用户使用纯库模式**（G2 文档范围）。

R9 **非目标（明确不做）**：限容 / 配额执行、访问审计、PG 实例进程 provisioning（起进程是运维不是插件）、
jsonl 加密（**宿主自己要读 jsonl 才能渲染聊天**，加密即打不开）、客户端 E2E 加密（B 方案）、写路径改造。

## Acceptance Criteria

- [ ] AC1 **契约同构**：`sql.ts` 每个 DTO 在 PG 后端的返回形状与 SQLite 后端逐字段同构
      （含 SQLite 专属字段的 PG 等价值映射，见 `design.md` §4），单测逐项钉住。
- [ ] AC2 **隔离可证伪**：扩展 A 的 role 读扩展 B 的 schema **被 PG 拒绝**（断言报错来自 PG 权限层，
      不是应用层判断）；跨用户同理。
- [ ] AC3 **零回归**：未分配 PG 时，既有 SQL 相关 e2e 与 `npm test` 全绿；
      `git diff packages/shared-types/src/sql.ts` 为**空**。
- [ ] AC4 **降级可断言**：真机用例——分配 PG → 断开 PG → 断言回落 SQLite **且**回执含 `via` 与真原因。
- [ ] AC5 **并发承受力（必须能抗）**：用户 2026-09-26 定调「多并发写聊天**总之会有，我们插件可以抗**」。
      给出实测数字：N 并发写同一库，在 **SQLite / PG / MySQL 三种后端**下的对照
      （成功数 / 冲突数 / 耗时 / **有无错写与丢失**）。**没有数字不算交付。**
- [ ] AC7 **跟随宿主引擎**：宿主 `storage.mode=postgres`（或 `mysql`）时，Authority **不写 SQLite 文件**、
      复用宿主配置里的连接信息、且**不碰宿主的表**；宿主 `mode=fs/sqlite` 时行为与今天一致。
      两个方向都要有真机证据（`config.yaml` 两种模式下各跑一遍）。
- [ ] AC6 **构建全绿**：core 5 平台产物构建通过 + `npm run check:installable` 通过；
      若某平台因 TLS 无法支持 PG/MySQL，**如实标注该平台不支持**（不吹全平台）。

## 中止判据

- **若 PG 驱动在 `android-arm64` 或 `linux-x64-musl` 交叉编译不过**（TLS 依赖为主要风险）
  → 改为可选编译 feature，这两个平台**明确声明不支持 PG**。
- **若方言差异使既有消费者的迁移脚本在 PG 上跑不通**
  → 中止该路径，改为「扩展必须显式声明 PG 兼容（新增 `sql.postgres` 权限资源）」的双钥匙模型（见 `design.md` §3）。

## Notes

- 依据：`design.md`（技术设计）+ `implement.md`（执行计划）。
- 本仓既有规范必读：`spec/authority-core/backend/database-guidelines.md`（新增 SQL 能力落点）、
  `spec/server-plugin/backend/version-binding.md`（最小侵入纪律）、
  `spec/shared-types/backend/capability-lifecycle.md`（能力真源**尚未落地**，本任务不依赖它）。
- 上游现状（2026-09-26 取证）：`Youzini-afk/ST-Delegation-of-authority` 最后 push **2026-07-31**，
  8 星 / 2 fork / 0 open issue；本 fork 已领先 16 个提交。**不走上游 PR 路线**（用户 2026-09-26 裁定）。

