# Logging Guidelines — `@stdo/server-plugin`

> 本包的日志/审计约定。总览见 [index](./index.md)。

---

## 两条通道

本包的"日志"分两条独立通道，**不可混用**：

### 1. 审计日志（结构化，面向 Security Center / control audit）

- 实现：`services/audit-service.ts`；调用入口 `runtime.audit`。
- 关键方法：`audit.logPermission(user, extensionId, message, details)`（permission 类事件）、`audit.logError(user, extensionId, message)`。
- 统一挂接点：route 错误出口 `fail()`（`packages/server-plugin/src/routes.ts:59-79`）——permission 类错误自动走 `logPermission`，其余走 `logError`。
- 诊断线索在 Security Center / control audit 视图可见，是排障链路的第 6 环（`docs/server/ai-integration-guide.md` §9，行 349-365）。

### 2. 启动/生命周期诊断（非结构化，面向控制台）

- 约定前缀 `[authority]` + `console.warn`，例如 `packages/server-plugin/src/index.ts:29,33,36,43,46`。
- 语义：**非关键启动步骤失败绝不抛出、绝不阻断插件加载**，只 `console.warn` 记录（host bridge 冲突、默认 Agent scope 注册失败、companion module 发现失败、agent session 恢复跳过）。
- core 就绪信号由 Rust 侧输出：`crates/authority-core/src/main.rs:190`（`AUTHORITY_CORE_READY <addr>`）、错误载荷走 eprintln JSON（`main.rs:4230`）。

---

## 约定

1. 新增 route 的错误处理**不需要**（也不允许）手写审计调用——统一由 `fail()` 兜底；只有 route 之外的 service 层关键写操作才显式调 `runtime.audit`。
2. `console.log` 仅用于一次性脚本/CLI 输出；插件运行路径上一律 `console.warn` 带 `[authority]` 前缀，不使用 `console.error` 抛出式日志（错误进审计通道）。
3. 不要把敏感值（session token、API key）写进任何日志；API key 只暴露 mask 与 fingerprint（模型约定见 `docs/server/agent-platform.md`，SDK 侧只读状态）。
4. Agent Session 的执行日志有独立机制（`journal*.jsonl` append-only + SHA-256 前向链，单 writer 锁），位于 `services/agent-session-journal-service.ts`；**不要**把普通审计写进该通道，也不要手改 journal 文件。规范原文：`docs/server/agent-platform.md` §Session 日志与恢复（行 43-69）。
