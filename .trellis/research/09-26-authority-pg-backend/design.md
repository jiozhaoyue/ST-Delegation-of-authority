# design.md — Authority Postgres 后端

> 依据 `prd.md` R1–R9 / AC1–AC6。**本页自包含**：条文与证据（file:line）均内联。
> 全部现状结论为 2026-09-26 在 fork `jiozhaoyue/ST-Delegation-of-authority` 现场取证所得，非凭记忆。

---

## 1. 事实基线（取证结果）

| 事实 | 证据 |
| --- | --- |
| 唯一 DB 依赖是嵌入式 SQLite | `crates/authority-core/Cargo.toml:10` — `rusqlite = { version = "0.31.0", features = ["bundled"] }`；全仓 code 内 `postgres\|mysql` **零命中** |
| **异步运行时已经在**（加异步 PG 驱动无需引入运行时） | 同文件 — `tokio = { version = "1", features = ["full"] }` |
| **core 内零加密实现** | `crates/authority-core/src/*.rs` 搜 `encrypt\|decrypt\|aes\|cipher\|kdf` = **0 处** |
| 无 TLS crate | Cargo.toml 无 `rustls` / `native-tls`；HTTP 走 `ureq 2.12.1`（自带其 TLS） |
| SQL 契约面 | `packages/shared-types/src/sql.ts`（152 行，19 个 DTO/类型） |
| 隔离强制点在 **Node 层**，不在 core | `resolvePrivateSqlDatabasePath(user, extensionId, database)`（`packages/server-plugin/src/routes/sql-routes.ts:122`）；core 只认传进来的路径（`crates/authority-core/src/sql.rs:29` `open_connection(&request.db_path)`） |
| 能力真源**尚未落地**（本任务不依赖） | `packages/shared-types/src/` 搜 `AuthorityCapabilityStage` = **0 命中**（该规范仍是 spec-only） |

**由基线直接推定的两条设计边界**：

1. **后端选择天然属于 Node 层**——core 是「按路径干活的执行器」，它不该知道也不该猜后端。
2. **文件布局不是公开合同**（`spec/authority-core/backend/database-guidelines.md` §「数据布局纪律」1）
   → 在**同一份 DTO 契约**背后换一个存储引擎，是这套架构明确允许的改动。

---

## 2. 隔离模型（**双引擎，各按自己的语义等价物**）

用户 2026-09-26 裁定：**PG + MySQL 都做**，且**存储跟随宿主引擎**（`prd.md` R1.1）。
两个引擎的「schema 等价物」不同，故隔离单位不同，但**语义等价**：每租户一个命名空间 + 一个专属账号。

| | PostgreSQL | MySQL |
| --- | --- | --- |
| 命名空间 | **schema**（同一库内多 schema） | **database**（MySQL 的 schema 就是 database） |
| 账号 | role（`LOGIN` + 随机密码） | user（`user@host` + 随机密码） |
| 授权 | `GRANT USAGE, CREATE ON SCHEMA <own>` | `GRANT ALL ON <own>.* ` |
| 每租户限制 | `CONNECTION LIMIT` + `ALTER ROLE SET statement_timeout/lock_timeout` | `MAX_USER_CONNECTIONS` + `SET SESSION max_execution_time` |

命名由 (user, ext) **不可逆 hash** 派生：避免把用户名/扩展名写进数据库目录，且长度可控。
每租户账号**只**拿到自己命名空间上的权限，**不给** `CREATEDB` / `CREATEROLE` / 任何全局权限。

### 2.1 连接从哪来（跟随宿主引擎，不另立一套）

`storage.mode` 在宿主 `default/config.yaml` 里有四档（**实测原文**）：

```
# - 'fs' (default): 每聊天一个文件
# - 'sqlite': 每用户一个 SQLite（<dataRoot>/<handle>/luker-storage.sqlite）
# - 'mysql':  共享 MySQL 8.0+；所有用户一个 schema，靠 handle 列隔离
# - 'postgres': 共享 PostgreSQL 14+；所有用户一个 schema，靠 handle 列隔离
storage:
  mysql:    { url: mysql://user:pass@host:3306/luker }
  postgres: { url: postgresql://user:pass@host:5432/luker }
```

映射规则：

| 宿主 `storage.mode` | Authority |
| --- | --- |
| `fs`（默认）/ `sqlite` | 保持现状：`DATA_ROOT` 下文件 + 本地 SQLite（`authority-paths.ts` 不变） |
| `postgres` / `mysql` | **复用宿主那台服务器**（读 `storage.<engine>.url` 取连接信息），Authority 建自己的命名空间 |

**两处边界（必须守住）**：

1. **复用连接信息，不复用库表**。宿主的 `chats` / `chat_states` 等表**一律不碰**
   —— 那是宿主的内部结构，且 `src/storage/README.md` 明确「endpoints 不得直接 `fs.*`」、
   存储语义归宿主 Repo 层所有。
2. **读配置项，不 import 宿主内部模块**。宿主的 `src/storage/**` 是**内部实现**，
   依赖它就等于把内部实现当公开 API（违反 `L1-MR-5`）。只读 `config.yaml` 的**配置项**。

**MySQL 下一个必须承认的取舍**：宿主的连接串指向它的 `luker` 库，用它只能在该库内建表。
要在 MySQL 下拿到**真 DB 级隔离**（database-per-tenant），管理员需给一个**可建库**的账号；
若只给库内权限，则退化为「同库表前缀 + 每租户账号的表级 `GRANT`」——**隔离仍在数据库层强制，但粒度更粗**。
两者都要支持，并在 Security Center 里如实显示当前处在哪一种（不许含糊成"已隔离"）。

### 2.2 被否决的路及理由

| 方案 | 否决理由 |
| --- | --- |
| **PG 下用 CREATE DATABASE-per-tenant** | 建销成本高、每库连接开销大、库数量有实践上限；PG 的 schema 本就是干这个的。**注**：MySQL 下无法这样否决——MySQL 的 schema 就是 database，故那边**就是这么做的**（§2 的上表） |
| **单库单表 + 租户列做隔离**（宿主 `chats.handle` 就是这个形态） | 隔离靠**每一处查询都记得带 `WHERE handle=?`**，一处漏写即跨租户泄漏、且泄漏是静默的；且全租户共用一个数据库账号 → **拿不到 DB 级权限隔离**，而「真权限管理」正是本任务的 R2。**可选叠加 RLS 作纵深防御，但不作主隔离机制** |

---

## 3. 后端选择（两把钥匙 + 缺省零变更）

**两把钥匙**（沿用 Authority 既有的「先声明后用 + 管理员收口」模型）：

1. **扩展声明**：新增权限资源 `sql.postgres`，语义 = 「我的 SQL 能在 PG 方言上跑」。
   这是**兼容声明**，不是授权（照抄 `SUPPORTED_RESOURCES` 现有 11 项的写法，成第 12 项）。
2. **管理员分配**：控制面记录 per (用户 × 扩展) 的 `backend: 'sqlite' | 'postgres'`。

**缺省 = 无分配记录 = SQLite** → 未分配的调用路径**逐字节同今天**（R4）。

### 3.1 路由落点

`packages/server-plugin/src/routes/sql-routes.ts` 的每个 handler 在**算 `db_path` 之前**先问 `backendResolver`：

```
backendResolver.resolve(user, extensionId, database)
  → { backend: 'sqlite', dbPath }                       // 今天的行为，代码路径不变
  → { backend: 'postgres', schema, roleRef }            // 新分支
```

**最小侵入纪律（version-binding.md §4）**：既有 SQLite 分支的判定与代码**一字不改**，
PG 分支是**并列新增**；任何「把旧判定改成区间/复合判定」的写法都不接受。

---

## 4. 契约映射（本设计的硬骨头）

`sql.ts` 的 19 个类型必须逐个在 PG 后端下有**确定的实现或等价值**。三处是真差异，不能糊：

### 4.1 `SqlExecResult.lastInsertRowid: number | null`

SQLite 有 `last_insert_rowid()`；**PG 没有等价函数**。定案：
- 语句含 `RETURNING` 时取返回首行首列；
- 否则取 `lastval()`——但 `lastval()` 在同一连接上会被后续语句覆盖，**仅在 `exec` 单语句请求内取值**，多语句批量下返回 `null`；
- **绝不编造**：取不到就 `null`，并在 `docs/server/` 写明该字段在 PG 下的语义边界。

### 4.2 参数占位符方言

SQLite `?` / `?N` ↔ PG `$1..$n`。**必须转译**，且转译器要正确处理字符串字面量里的 `?`
（不许用正则盲替）。转译算法与用例进 `pg_placeholders` 模块，单独单测。

### 4.3 SQLite 专属字段（**不改 DTO**，填真实等价值）

| 字段 | SQLite 取值 | PG 下填什么（必须是**真实读到**的，不许编造） |
| --- | --- | --- |
| `SqlDatabaseRecord.fileName` / `SqlStatResponse.filePath` | 真实文件路径 | 逻辑标识（schema 全名）+ `docs/server/` 写明「PG 后端下语义为逻辑标识，非文件路径」 |
| `runtimeConfig.journalMode` | `wal` | `pg_settings.wal_level` 实际值 |
| `runtimeConfig.synchronous` | `NORMAL` | `pg_settings.synchronous_commit` 实际值 |
| `runtimeConfig.foreignKeys` | `true` | `true`（PG 恒强制外键，无开关） |
| `runtimeConfig.busyTimeoutMs` | `5000` | role 的 `lock_timeout` 实际值（`0`/未设时如实为 `0`） |
| `runtimeConfig.pagedQueryRequiresOrderBy` | `true` | `true`（PG 同样要求 ORDER BY 才有稳定分页） |
| `SqlDatabaseRecord.sizeBytes` | 文件大小 | `sum(pg_total_relation_size(...))` over 该 schema 全部表 |
| `SqlDatabaseRecord.updatedAt` | 文件 mtime | 该 schema 内对象的最近修改时间 |
| `SqlListSchemaResponse.objects[].type` | `table\|index\|view\|trigger` | `information_schema` / `pg_catalog` 映射（PG 的 trigger 在 `pg_trigger`，需专门映射表） |

> **纪律**：这张表每一行都必须有**单测**（AC1）。凡是 PG 给不出的，取 `null` 并在文档写明，
> **不允许**为了「看起来同构」而回填假值——本仓已有过一次「喂不可达形状」的教训（B2 F4）。

---

## 5. 驱动、连接池与 TLS（**最大构建风险**）

- **驱动**（两个引擎各一个，都要求纯 Rust）：
  - PG：`tokio-postgres`（异步；与既有 `tokio full` 同源，零新运行时）。
  - MySQL：候选 `mysql_async`（**纯 Rust，不依赖 libmysqlclient**）。
    **不取 `mysql` crate**——它绑 C 库 `libmysqlclient`，5 平台交叉编译会直接崩。
    `mysql_async` 的纯 Rust 属性**须在 W1 实测确认**，不凭印象采信。
- **连接池**：每引擎一池；优先现成池（PG: `deadpool-postgres`），若依赖树过大则自建
  （`Vec<Client>` + `tokio::sync::Semaphore` + 有界获取超时）——**有界等待**是 R7 的硬要求。
- **为何不用 `sqlx`**：编译期宏 + 依赖树显著更大，会把 5 平台交叉编译面放大；
  且本任务只需要「执行 SQL + 事务」，不需要 sqlx 的编译期校验。
- **TLS（真风险）**：PG 可能要求 SSL；`rustls` + `ring`/`aws-lc-rs` 在
  `android-arm64` 与 `linux-x64-musl` 上交叉编译是已知难点。
  **定案：TLS 作为可选编译 feature**。默认产物支持本机 socket 与内网明文（`sslmode=disable`），
  需要 TLS 的部署用带 feature 的构建。**如实声明支持矩阵**，不吹全平台全功能（对应 AC6 与中止判据）。

---

## 6. 凭据与密钥（谁能碰什么）

| 材料 | 存放 | 约束 |
| --- | --- | --- |
| PG 管理员连接串（建 schema/role 用） | **控制面**（与 `controlDbFile` 同级的 admin 配置） | 不得进扩展可见目录；不得经 `/sql/*` 或 SDK 暴露；日志脱敏 |
| 每 role 随机密码 | 控制面 | 轮换由管理员操作 |
| `wrapped_dek`（每用户，R8 预留） | 控制面 | **只存包裹态**；KEK 由用户口令派生（Argon2id），服务端拿不到 KEK |

---

## 7. 降级与归因（沿用 B3 立下的规矩）

回执新增**可选字段**（R3 允许，因为是纯新增）：

```ts
via?: 'sqlite' | 'postgres';
degraded?: { from: 'postgres'; to: 'sqlite'; reason: string };
```

- `via`：让真机用例能断言「这次**真的**走了 PG」——对应 TL 那个「worker 从未生效却没人知道」的坑。
- `degraded.reason`：**原因必须随返回值回到调用方**。只挂回调不算数
  （worker/异步路径里回调可能没有接收者——这正是 B3 实测抓到的那类静默回落）。
- 超长原因截断到 500 字并**写明截断**（同 B3 的 `clipReason`）。

---

## 8. 加密约束（R8：本任务只留位，不实现）

用户 2026-09-26 裁定（**两轮，后者覆盖前者**）：
**归档保密**（历史归档客户端加密，运行期不保密）+ **只在纯库模式下加密** +
**口令派生 KEK 包裹 DEK（无感）** + **README 要鼓励云酒馆主启用后端插件、鼓励用户使用纯库模式**。

### 8.0 威胁模型（用户目标：管理员最多只能删，不能读）

分三层，结论不同——**必须如实声明，不许含糊**：

| 层 | 能否排除管理员 | 说明 |
| --- | --- | --- |
| **静态数据**（库文件 / 备份 / dump / 同机其他用户） | **能** | 加解密全在客户端，服务端只存密文、拿不到密钥 |
| **运行中的明文** | **部分能** | 三条明文必经之路：① 磁盘 jsonl（宿主自己要读）② 发给 LLM 的提示词（浏览器组好 → 服务器代发）③ 渲染。**归档保密方案下，第 ② 条不绕开**（继续对话时那一段明文仍过服务器） |
| **恶意管理员** | **原理上不能** | **浏览器里跑的 JS 是服务器发的**——改一版页面即可偷密钥。这是网页应用形态的边界，不是实现缺陷。**完整性与可用性（删除/篡改）永远在管理员手里**，可争取的只有机密性 |

**因此本任务与后续加密任务都只承诺第一层**；第二、三层写进文档，不许在 README 里吹成「管理员完全看不到」。

### 8.1 加密与后端的关系

- 加密由「**纯库模式**」触发，与后端（SQLite / PG）**正交**——**不是 PG 专属**。
- 用户要求：`README` 与 `docs/` 需**鼓励云酒馆所有者启用后端插件、鼓励用户使用纯库模式**
  （这是本能力落地的前提，属 G2 文档范围）。

因此本任务的 schema 设计必须满足：

1. **正文列与结构列分开**：消息正文（`mes` 等）将来存密文；层号/分支/时间/指纹/指针**保持明文**
   → 图、分支、楼层类查询与排序**不受影响**。
2. **不许**把结构信息塞进正文列，**不许**依赖正文列做索引或排序（否则加密后直接失效）。
3. 将来用的加密是 **AEAD**（AES-GCM 或 XChaCha20-Poly1305）；**不做确定性加密用于检索**
   （确定性加密泄漏相等性，且我们已接受「丢正文检索」这个代价）。
4. **如实边界**（必须进文档，不许含糊）：
   - 只保护库内；**磁盘上的标准 jsonl 仍是明文**——宿主自己要读它才能渲染聊天，加密即打不开；
     静态防护靠 OS 层磁盘加密。用户已裁定「接受，明写」。
   - 口令/密钥丢失 = **数据永久不可解**（「只有用户能解」与「可恢复」本质互斥）。
   - 该方案**不防运行期管理员**（PG 官方文档原文即承认此边界：解密密钥与明文在解密期间短暂存在于服务器上）。

> **PG 侧事实（官方文档核实，2026-09-26）**：core PostgreSQL **无内建 TDE**；`pgcrypto` 是扩展、
> 只做列级且密钥在服务端——**不满足本仓要求**；唯一能排除服务端的是客户端加密。

---

## 9. 风险、回滚与不做

| 风险 | 处置 |
| --- | --- |
| 5 平台交叉编译（TLS） | TLS 走可选 feature；不支持则如实标注（PRD 中止判据） |
| 方言差异（`lastInsertRowid` / 占位符 / trigger 映射） | §4 逐项定案 + 单测；跑不通则转双钥匙模型（PRD 中止判据） |
| 连接池压力（多租户） | 每 role `CONNECTION LIMIT` + 池有界等待 + 池指标进 `usage-summary` |
| 数据从 SQLite 迁到 PG | **本任务不做自动迁移**（迁移是独立能力）；切后端前需自定义导出/导入 |

**回滚**：删 PG 模块 + 撤回 backend 分配 → 立即回到纯 SQLite（**PG 侧已建的数据不自动回收**，
需先导出——这条必须写进操作文档，否则是一次静默数据丢失）。

**明确不做**（R9）：限容/配额、审计、实例 provisioning、jsonl 加密、客户端 E2E 加密、写路径改造、
能力真源（`capability-lifecycle.md`）的落地。
