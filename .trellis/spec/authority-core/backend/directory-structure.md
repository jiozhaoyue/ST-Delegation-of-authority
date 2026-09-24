# Directory Structure — `authority-core`

> Rust 模块布局。总览见 [index](./index.md)。

---

## 布局（实测行数）

```
crates/authority-core/
├── Cargo.toml            # edition 2024；axum 0.8 / rusqlite 0.31 (bundled) / triviumdb v0.7.1 / ureq 2.12
└── src/
    ├── main.rs           # 5670 行：axum 组装 + /v1 路由（:96 起）+ 全部 handler
    ├── core_types.rs     # 565 行：跨 handler 共享类型
    ├── db.rs             # 35 行：SQLite 连接工厂 open_connection()
    ├── sql.rs            # 595 行：SQL 能力（query/exec/batch/transaction/migrate）
    ├── sql_types.rs      # 111 行：SQL 值类型映射
    ├── trivium.rs        # 1477 行：Trivium 能力（tql/upsert/link/search/index…）
    ├── trivium_types.rs  # 402 行
    ├── storage_blob.rs   # 292 行：Blob 存储布局
    ├── http_fetch.rs     # 432 行：ureq HTTP 代理
    ├── pagination.rs     # 81 行：游标分页
    ├── runtime_state.rs  # 39 行
    ├── constants.rs      # 30 行（SQL_BUSY_TIMEOUT_MS 等）
    └── error.rs          # 17 行（ApiError）
```

## 模块组织规则

1. **handler 与路由集中在 `main.rs`**：现有模式是 `v1_routes = Router::new().route("/<域>/<动作>", post(v1_<域>_<动作>))`（`main.rs:96-125` 起连续挂接 storage/fs/http/sql/trivium 各域）。新增端点沿用 `v1_` 前缀命名。
2. **能力实现在域文件**：SQL 逻辑进 `sql.rs`（不写进 handler）、Trivium 进 `trivium.rs`、Blob 进 `storage_blob.rs`；handler 只做解析-调用-响应。
3. **类型**：跨 handler 共享的结构进 `core_types.rs` / `sql_types.rs` / `trivium_types.rs`；这些类型与 `packages/shared-types/src/*.ts` 的 DTO 语义对齐（TS 侧是真源合同，Rust 侧必须同构）。
4. **依赖纪律**：新增 crate 依赖前先确认必要性；当前运行时 HTTP 用 `ureq`（同步），异步面用 tokio（`Cargo.toml`）。

---

## 命名约定

- 文件：蛇形小写（`storage_blob.rs` / `trivium_types.rs`）；handler 函数 `v1_<域>_<动作>`；能力函数与域文件同名域。
- 路径：`/<域>/<动作>`（`/sql/query`、`/storage/kv/get`，见 `main.rs:97-125`）。
- 错误：`to_<来源>_error` 转换器（`to_sql_error`、`to_internal_error`，见 `db.rs:6-7`）。

## 参考范例

- 路由挂接：`main.rs:96-125`（`v1_routes` 连续 `route()` 链）。
- 连接工厂：`db.rs:10-34`（PRAGMA 固定面 + 防御性路径校验）。
- 大域实现：`trivium.rs`（1477 行）与 `sql.rs`（595 行）——handler 薄、域文件厚的分工样板。
