# Database Guidelines — `@stdo/shared-types`

> **不适用**。本包是纯类型包，无数据库访问、无 ORM、无 migration、无运行时代码。

- 数据库真实规范在 Rust 层：`../../authority-core/backend/database-guidelines.md`。
- 本包与持久化唯一的交集是**描述合同**：分页（`CursorPageRequest`/`CursorPageInfo`，`src/common.ts`）、limits 字段（`src/common.ts` 与各域 DTO）、storage/transfers DTO（`src/storage.ts`、`src/transfers.ts`）——改这些字段等于改跨层合同，见 [index](./index.md) 约定第 2、4 条。
