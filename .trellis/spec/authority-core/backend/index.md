# Backend 规范 — `authority-core`（Rust 权威执行层）

> 本包是 Authority 的**权威执行层**（数据面 + 控制面）：axum loopback 服务 + SQLite + TriviumDB + Blob + 私有文件 + HTTP 代理 + Jobs。

---

## 职责边界

- **内部层**：core 只在 `127.0.0.1:<ephemeral-port>` 提供 `/v1/*` loopback API（`crates/authority-core/src/main.rs:96` 起 `v1_routes`），**不是前端稳定接口**。浏览器与第三方扩展只能经 `packages/server-plugin`（`/api/plugins/authority/*`）访问；`CoreService`（`packages/server-plugin/src/services/core-service.ts`）是唯一代理面。
- 路径判别通则：`/api/plugins/authority/...` = 公开 adapter 层；`/v1/...` = 本包内部层（`docs/server/ai-integration-guide.md` §3.2，行 171-190）。
- core 的健康信号：启动完成时向 stdout 输出 `AUTHORITY_CORE_READY <addr>`（`main.rs:190`），错误载荷走 JSON eprintln（`main.rs:4230`）。
- 技术栈（`crates/authority-core/Cargo.toml`）：edition **2024**、axum 0.8、rusqlite 0.31（bundled）、triviumdb v0.7.1（git tag）、ureq 2.12、tokio full。

---

## 目录与关键文件（行数为实测）

```
crates/authority-core/src/
├── main.rs           # 5670 行：/v1 路由（:96 起）+ 全部 handler + 就绪信号（:190）
├── core_types.rs     # 565 行：请求/响应结构与共享类型
├── db.rs             # 35 行：SQLite 连接工厂（WAL + busy_timeout，见 database-guidelines）
├── sql.rs            # 595 行：SQL 能力实现（query/exec/batch/transaction/migrate）
├── sql_types.rs      # 111 行：SQL 值类型映射
├── trivium.rs        # 1477 行：Trivium 图数据库能力
├── trivium_types.rs  # 402 行：Trivium 类型
├── storage_blob.rs   # 292 行：Blob 存储
├── http_fetch.rs     # 432 行：HTTP 代理（ureq）
├── pagination.rs     # 81 行：游标分页
├── runtime_state.rs  # 39 行：运行时状态
├── constants.rs      # 30 行：SQL_BUSY_TIMEOUT_MS 等常量
└── error.rs          # 17 行：ApiError
```

---

## 必须遵守的约定（带证据）

1. **core 端点只服务 adapter**：新增内部端点加进 `main.rs` 的 `v1_routes`（:96 起，现有挂接模式 `Router::new().route("/sql/query", post(v1_sql_query))`），然后在 `packages/server-plugin/src/services/core-service.ts` 加代理方法——8 步顺序的第 2-3 步（`docs/server/ai-integration-guide.md` §7.1，行 306-317）。core-only 改动的收尾清单见同文件 §7.3（行 328-337）。
2. **错误统一 `ApiError`**（`src/error.rs`）：`{status_code, message}`，经 `to_internal_error` / `to_sql_error` 等转换器收敛（`src/db.rs:8` 的 import 面）。
3. **分页**：新列表端点用 `pagination.rs`（81 行）的游标模式，与 DTO 层 `CursorPageRequest/CursorPageInfo`（`packages/shared-types/src/common.ts`）对齐。
4. **性能门槛**：SQL/分页基线 CI 门槛为平均延迟 ≤150ms、P95 ≤300ms（`npm run bench:core`）；性能敏感改动必须跑 `bench:core` + `bench:scale`（`docs/server/ai-integration-guide.md` §7.1 第 7 步）。
5. **core 变更必触发 installable**：产物落 `managed/core/<platform>/`（平台清单见 `scripts/installable.mjs:28-34`，当前 5 平台，**无 darwin-arm64**）+ `.authority-release.json` 更新 → `npm run sync:installable && npm run check:installable`。
6. **Rust 代码注释与文档**：本仓文档语言为中文（覆盖 Trellis 模板英文默认）；注释按 Rust 惯例与现有代码一致。

---

## 常见坑

- **core "看不见"的失败**：core 未起/崩溃时 adapter 返回 `503 core_unavailable`（category `core`）——先查 `probe.core.state` 与 `probe.core.lastError`（`docs/server/ai-integration-guide.md` §9，行 349-356）。
- **平台产物缺口**：预构建不含 `darwin-arm64`；Apple Silicon 需源码 `npm run build:core`（README 排障章）。
- **Trivium 能力边界**：`trivium.private` 不是 embedding 服务，`vector` 由调用方传入（禁区 §6.4，行 260-275）；mapping integrity 端点不是热路径（§6.6，行 288-302）。QuIVer 索引（节点 ≥10000 自动建）是派生数据，不入 portable package，导入后首查自动重建。
- **不要把 `/v1/*` 当公开 API 宣传**：对前端文档/示例只写 `/api/plugins/authority/*`。

---

## 验证命令

```bash
cargo test --manifest-path crates/authority-core/Cargo.toml   # Rust 全量测试（npm test 的组成部分）
npm run build:core                                            # 单独构建 core
npm run bench:core && npm run bench:scale                     # 性能门槛
npm run sync:installable && npm run check:installable         # core 变更后必跑
```

---

## 主题文件

| 文件 | 内容 | 状态 |
|------|------|------|
| [Directory Structure](./directory-structure.md) | Rust 模块布局 | 已填实 |
| [Database Guidelines](./database-guidelines.md) | SQLite/Trivium 实现规范 | 已填实 |
| [Error Handling](./error-handling.md) | `ApiError` 体系 | 已填实 |
| [Quality Guidelines](./quality-guidelines.md) | core 层质量规范 | 已填实 |
| [Logging Guidelines](./logging-guidelines.md) | stdout 协议与日志约定 | 已填实 |
