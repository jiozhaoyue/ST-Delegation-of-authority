# implement.md — Authority Postgres 后端：执行计划

> 依据 `prd.md`（R1–R9 / AC1–AC6）+ `design.md`（§1 基线 / §2 隔离 / §3 两把钥匙 / §4 契约映射 /
> §5 驱动与 TLS / §6 凭据 / §7 降级归因 / §8 加密约束 / §9 风险回滚）。
> **评审门**：本三件套经用户评审后才 `task.py start`（complex 任务规矩）。
> **复选框随执行实时勾选**，禁止事后凭记忆批量补勾（`L0-2`）。

---

## 波次 0：就绪（**已完成，留档**）

- [x] W0.1 现场取证：core 依赖（`rusqlite` 唯一 DB / `tokio full` 已在 / **零加密实现**）、
      契约面（`shared-types/src/sql.ts` 152 行 19 类型）、隔离强制点在 Node 层（`sql-routes.ts:122`）
- [x] W0.2 双通道检索：GitHub API（多租户 PG 现成方案：aws-saas-factory **RLS** /
      citus **schema-per-tenant** / supavisor **连接池**）；WebSearch 通道零结果（本机国际搜索受限）
- [x] W0.3 官方文档核实三件事：**PG 无内建 TDE**；`pgcrypto` 密钥在服务端（官方自认可被管理员截获）；
      **PG 无按角色磁盘配额**（只有 `CONNECTION LIMIT` 与 `VALID UNTIL`）
- [x] W0.4 上游现状：`Youzini-afk` 最后 push **2026-07-31**、8 星、0 open issue；本 fork 领先 16 提交
      → **不走上游 PR 路线**（用户裁定）
- [x] W0.5 用户裁定四件事：① 落点=fork 内建 ② 首波=只做 PG 后端 ③ 加密=**C 分列** ④ 密钥根=
      **口令派生 KEK + 设备密钥兜底** ⑤ jsonl=**接受只保护库内并明写**
- [x] W0.6 本文件与 `prd.md` / `design.md` 落盘
- [ ] W0.7 **用户评审**（评审门）→ 过后 `task.py start`

---

## 波次 1：先取事实（**不得跳过**——本仓文化：先取事实再改）

| # | 事项 | 产出 |
| --- | --- | --- |
| W1.1 | Docker 起**两个**测试库：PG（端口 **3040**，用户已定）+ MySQL（端口 **3050**，同按 `L0-16` 段位间隔 10）；**都不用出厂默认 5432/3306** | `tests/db/docker-compose.yml` |
| W1.2 | **契约探针**：把 `sql.ts` 的 19 个类型在 **PG 与 MySQL 两个引擎**上逐个实测，重点三处—— `lastInsertRowid`（PG 用 `RETURNING`/`lastval()`；MySQL 用 `LAST_INSERT_ID()`）、参数占位符方言（PG `$n` / MySQL `?`）、`listSchema` 的 trigger 与 `information_schema` 差异 | `research/contract-mapping-pg-mysql.md`（**探针结果，不是设计推测**） |
| W1.3 | **宿主引擎对接探针**：确认宿主 `config.yaml` 的 `storage.{mode,postgres.url,mysql.url}` 在 Node 侧怎么读到（**只读配置项，不 import 宿主内部模块**）；确认宿主 `mode=postgres` 时 `DATA_ROOT` 是否仍可写 | 同上 research 文件 |
| W1.4 | **并发基线**：用既有 `scripts/benchmark-core.mjs` / `benchmark-scale.mjs` 量 SQLite 在 N 并发写下的墙 | 数字进同一份 research |
| W1.5 | 确认 MySQL 驱动 `mysql_async` 的**纯 Rust 属性**（不绑 libmysqlclient）——交叉编译成败取决于此 | 同上 |

**为什么必须有 W1**：`design.md` §4 那张映射表目前是**设计推定**。本仓已吃过一次教训——
「新写的判据喂的是**编造契约**」（B1 的 F2：群聊判据读的字段在宿主响应里根本不存在）。
**探针跑出来的才算事实。**

**回滚点**：纯新增 `tests/pg/` 与 `research/`，删目录即回滚。

---

## 波次 2：core（Rust）

| # | 事项 | 落点 |
| --- | --- | --- |
| W2.1 | **两个引擎**的驱动 + 连接池：PG `tokio-postgres`（池 `deadpool-postgres`）、MySQL `mysql_async`；**有界等待**（R7） | `crates/authority-core/src/rdb/{pg,mysql}/`（新增） |
| W2.2 | 方言转译：占位符（PG `$n` / MySQL `?` / SQLite `?`）——**正确处理字符串字面量内的占位符**，不许正则盲替；标识符引用差异（PG 双引号 / MySQL 反引号）+ 单测 | `rdb/placeholders.rs`、`rdb/ident.rs` |
| W2.3 | 后端抽象：`SqlBackend` trait，**SQLite 实现逐字保留原逻辑**，PG 与 MySQL 实现并列新增（R4 最小侵入） | `sql.rs` 不改既有分支；新增 `rdb/sql_pg.rs`、`rdb/sql_mysql.rs` |
| W2.4 | §4 映射表逐项实现（**两个引擎各一份**，差异处如实标出）；**取不到的取 `null` 并在文档写明，不许回填假值** | `rdb/{sql_pg,sql_mysql}.rs` + `rdb_types.rs` |

**验证**：`cargo test --manifest-path crates/authority-core/Cargo.toml`

---

## 波次 3：Node 层（后端选择与权限）

| # | 事项 | 落点 |
| --- | --- | --- |
| W3.1 | 新增权限资源 `sql.postgres`（第 12 项，「兼容声明」语义） | `packages/server-plugin/src/constants.ts`（`SUPPORTED_RESOURCES` + `RESOURCE_RISK`） |
| W3.2 | `backendResolver`：per (用户 × 扩展) 分配；**缺省 = SQLite = 今天的行为**；两把钥匙缺一即 SQLite | `packages/server-plugin/src/store/backend-resolver.ts`（新增） |
| W3.3 | 管理员分配面：授予 / 收回 / 查看（复用既有 admin 路由风格与 Security Center） | `src/routes/admin-*.ts`（**新增并列路由，不改既有**） |
| W3.4 | 每 role 凭据生成与轮换（随机密码，存控制面，**日志脱敏**） | `src/services/` |
| W3.5 | `sql-routes.ts` 接入：**在算 `db_path` 之前**问 resolver；SQLite 分支代码一字不改 | `src/routes/sql-routes.ts` |

**验证**：`npm run typecheck && npm test`
**断言（AC3）**：`git diff packages/shared-types/src/sql.ts` 必须为**空**

---

## 波次 4：降级与归因

| # | 事项 |
| --- | --- |
| W4.1 | 回执新增**可选** `via: 'sqlite'\|'postgres'` 与 `degraded: {from,to,reason}`（纯新增字段） |
| W4.2 | PG 不可达 / 认证失败 / 超时 / 池耗尽 → 回落 SQLite，**原因随返回值回到调用方**（不许只挂回调） |
| W4.3 | 超长原因截断到 500 字并**写明截断**（同 `clipReason`） |
| W4.4 | 连接串 / 密码在错误信息与日志中**脱敏** |

**验证（AC4）**：真机用例——分配 PG → 断 PG → 断言 `via==='sqlite'` **且** `degraded.reason` 非空。
**变形实测**：临时撤掉 `degraded` → 该用例必须**单独变红**（本仓 B2/B3 的硬要求：断言灵敏度要变异证明）。

---

## 波次 5：真机、并发数字与构建矩阵

| # | 事项 |
| --- | --- |
| W5.1 | **并发承受力数字（AC5）**：用既有 `npm run bench:core` / `bench:scale`，量 N 并发写在 **SQLite / PG / MySQL 三种后端**下的对照（成功数 / 冲突数 / 耗时 / 有无错写与丢失）→ 写进 `docs/server/performance-benchmarks.md`。用户定调：**「多并发写聊天总之会有，我们插件可以抗」** |
| W5.2 | 隔离实测（AC2）：租户 A 的账号读租户 B 的命名空间，断言报错来自**数据库权限层**（PG 与 MySQL 各一遍） |
| W5.3 | **跟随宿主引擎实测（AC7）**：宿主 `config.yaml` 分别设 `storage.mode=fs` 与 `=postgres`（如环境允许再加 `mysql`），各跑一遍——断言 PG 模式下 Authority **不写 SQLite 文件**、复用宿主连接信息、**不碰宿主的表**；fs 模式下行为与今天一致 |
| W5.4 | **MySQL 隔离档位如实显示**：管理员给的是「可建库账号」还是「库内账号」，Security Center 要显示当前处在**真库级隔离**还是**库内表级授权**——不许含糊成"已隔离" |
| W5.5 | 构建矩阵（AC6）：`npm run build` + `npm run check:installable` + 5 平台 core 产物；**不支持的平台如实标注** |
| W5.6 | 文档：`docs/server/` 增「数据库后端」节（含 §4 字段语义边界、§2.1 的连接来源与两种 MySQL 档位、§8 **能力上限如实声明**、回滚需先导出） |

---

## 收尾

- [ ] G1 spec 沉淀：把 W1 的探针结论 + §4 映射表落 `spec/authority-core/backend/database-guidelines.md`
      （**写进 spec 才算跨任务存活**——任务目录会被 archive）
- [ ] G2 `docs/server/capabilities-and-isolation.md` 补 `sql.postgres`（该文档当前只登记 8 项，
      而 code 有 11 项——**加第 12 项前先把这条既存漂移如实处理**）
- [ ] G3 提交 + 推送 `origin`（**只推 fork，绝不推 upstream**）；提交用显式 pathspec（`L0-7` 第 2 条）

---

## 验证命令（全任务通用，取自实测的 `package.json`）

```bash
# 单测主门禁（**已含 cargo test**，无需分开跑）
npm test

# 类型与构建
npm run typecheck
npm run build
npm run check:installable        # 产物一致性

# 基准（AC5 用的既有工具，不另造轮子）
npm run bench:core
npm run bench:scale
```

---

## 风险与中止判据（与 `prd.md` 一致，此处给操作面）

- **TLS 在 `android-arm64` / `linux-x64-musl` 交叉编译失败** → TLS 降为可选 feature，
  这两平台**如实声明不支持 PG**（禁止为了「全平台」把声明写虚）。
- **方言差异使既有消费者迁移脚本在 PG 上跑不通** → 转双钥匙：扩展必须显式声明 `sql.postgres`。
- **回滚**：删 PG 模块 + 撤回分配 → 立即回纯 SQLite。**PG 侧已建数据不自动回收，需先导出**
  ——这条必须进操作文档，否则是一次静默数据丢失。

## 需要用户的事项

- **测试库端口登记**：PG 用 `3040`（已定）；MySQL 按同样间隔取 `3050`，待你确认后**一并登记进统一规则表**
  （`L0-16` 段位纪律：先申请再登记；两个都不用出厂默认 5432/3306）。
- 评审门 W0.7：本三件套通过后才 `task.py start`。
