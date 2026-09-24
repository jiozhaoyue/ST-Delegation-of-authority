# Database Guidelines — `@stdo/server-plugin`

> 本包**不做直接数据库访问**。总览见 [index](./index.md)。

---

## 本包的裁决：数据访问委托给 core

本包（Node adapter）**没有任何 SQL 连接、SQLite 文件读写或 Trivium 存储实现**。所有持久化能力都由 Rust core（`crates/authority-core`）通过内部 loopback `/v1/*` 提供；本包只做转发、参数校验、权限检查与审计。

- core 内部路由定义在 `crates/authority-core/src/main.rs:96` 起（`v1_routes = Router::new()` 挂接 `/sql/query`、`/sql/migrate`、`/trivium/*`、`/storage/kv/*`、`/fs/private/*` 等）。
- core 的 SQL 实现见 `crates/authority-core/src/sql.rs`（595 行）、Trivium 见 `crates/authority-core/src/trivium.rs`（1477 行）。
- 本包对应的代理层是 `services/core-service.ts`（core 传输见 `services/core-transport.ts`）。

因此本层没有 ORM / migration / 连接池规范可言——**数据库规范属于 `authority-core/backend` 层**（见 `../../authority-core/backend/index.md`）。

---

## 本包仍需遵守的持久化相关约定

1. **不要手写数据文件路径**：SQL 文件路径、`.tdb` 路径、Blob 内部布局都不是稳定合同。本包统一经 `store/authority-paths.ts` 做路径标准化与隔离解析。禁令原文：`docs/server/ai-integration-guide.md` §6.3（行 247-259）。
2. **分页用统一合同**：`CursorPageRequest` / `CursorPageInfo`（`packages/shared-types/src/common.ts`）。禁止为 audit / jobs / events / SQL / Trivium 发明新分页 envelope（`docs/server/ai-integration-guide.md` §2.6，行 104-116）。
3. **新增 core 能力走 `CoreService` 代理**：先在 core 加内部能力，再在 `services/core-service.ts` 加代理方法，然后才能在 route 暴露（8 步顺序的第 2-4 步，同文件 §7.1 行 306-317）。
4. **limits 语义**：core hard ceiling / adapter transport routing threshold（`effectiveInlineThresholdBytes`，当前真正生效）/ compatibility transfer-max（仅兼容保留）。常量定义在 `packages/server-plugin/src/constants.ts:14-25`。
