# Database Guidelines — `authority-core`

> SQLite / TriviumDB 实现规范。总览见 [index](./index.md)。

---

## SQLite（`src/db.rs` + `src/sql.rs`）

连接工厂 `open_connection(db_path)`（`crates/authority-core/src/db.rs:10-34`）的固定 PRAGMA 面：

- `busy_timeout(SQL_BUSY_TIMEOUT_MS)`（`db.rs:26-27`，常量在 `src/constants.rs`）；
- `PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA foreign_keys = ON;`（`db.rs:28-30`，`execute_batch` 一次性设置）；
- 打开前 `fs::create_dir_all(parent)` 保证父目录存在（`db.rs:21-23`）。

**新增 SQL 能力的规则**：

1. 实现进 `sql.rs`（当前 595 行：query / exec / batch / transaction / migrate），handler 只转发（`main.rs` 的 `/sql/*` 路由）。
2. 值类型经 `sql_types.rs`（111 行）映射，保持与 `packages/shared-types/src/sql.ts` 的 DTO 同构。
3. 参数校验失败返回 400 级 `ApiError`（参照 `db.rs:11-19` 的空路径校验写法）。
4. 迁移合同由 TS 层 `client.sql.migrate()`（`packages/sdk-extension/src/client.ts:555` 起 `sql` 命名空间）驱动，core 只执行。

---

## TriviumDB（`src/trivium.rs`）

- 依赖为 git tag 固定版：`triviumdb = { git = "https://github.com/YoKONCy/TriviumDB", tag = "v0.7.1" }`（`crates/authority-core/Cargo.toml`）——升级 tag 属于合同变更，需三层联动与文档更新。
- 能力实现 1477 行（tql / tqlMut / upsert / bulkUpsert / link / search 系列 / index / compact / flush），类型在 `trivium_types.rs`（402 行）。
- **能力边界**（禁令原文：`docs/server/ai-integration-guide.md` §6.4/§6.6，行 260-302）：向量由调用方传入（不是 embedding 服务）；mapping integrity 路径（`stat({includeMappingIntegrity})` / `checkMappingsIntegrity` / `deleteOrphanMappings`）仅限诊断维护。
- QuIVer 图索引（节点 ≥10000 自动构建，`<name>.tdb.quiver`）是派生数据：portable package 不导出、导入后首查自动重建（数百 ms 至几秒）；`forceBruteForce: true` 可换取 100% 召回（README「当前限制」节）。

---

## 数据布局纪律

1. **文件布局不是公开合同**：SQL 文件、`.tdb`、Blob 布局只在 core 内实现；adapter/SDK/前端不得假设（禁令：同文件 §6.3，行 247-259）。
2. 路径进入 core 前已在 adapter 经 `packages/server-plugin/src/store/authority-paths.ts` 标准化；core 仍需做防御性校验（参照 `db.rs:11-19`）。
3. 限额（KV 128KiB / Blob 16MiB 等）定义在 `packages/server-plugin/src/constants.ts:14-25`，core 的 hard ceiling 与之对齐——改任何一侧都要跑 `npm test` 全量回归。
