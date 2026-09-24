# Error Handling — `authority-core`

> core 层错误体系。总览见 [index](./index.md)。

---

## `ApiError`（`src/error.rs`，17 行）

```rust
pub struct ApiError {
    pub status_code: u16,
    pub message: String,
}
```

- 语义最小：HTTP status + 消息。转换器收敛各类底层错误：`to_internal_error` / `to_sql_error`（`src/db.rs:6-7` 的 import 面，实现在 `main.rs`/域文件中）。
- handler 返回 `Result<_, ApiError>`，由 axum 统一序列化。

## 错误语义与 adapter 的衔接

1. core 侧**不区分** `category: core|backpressure`——那是 adapter（`packages/server-plugin`）对 core 不可达/过载的归类；core 只需正确返回 status 与消息。
2. core 不可达时，adapter 对外返回 `503 core_unavailable`（category `core`）；调用方退避重试（语义表见 `../../server-plugin/backend/error-handling.md`）。
3. 权限裁决**不发生在 core**：core 收到的请求已经过 adapter 的 `PermissionService` 授权；core 不重复实现权限语义（禁区「不绕过 PermissionService」的另一面：core 也不得自建授权）。
4. 参数校验失败的既有风格：`status_code: 400` + 明确字段名消息（参照 `db.rs:11-19` "dbPath must not be empty"）。

---

## 验证

```bash
cargo test --manifest-path crates/authority-core/Cargo.toml
```
