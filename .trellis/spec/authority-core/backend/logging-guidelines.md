# Logging Guidelines — `authority-core`

> core 与外界的 stdout/stderr 协议。总览见 [index](./index.md)。

---

## 实际协议（无日志框架）

core **不引入 tracing/log 框架**，与外界的信息交换只有两条协议通道：

1. **就绪信号（stdout）**：监听器绑定成功后输出一行 `AUTHORITY_CORE_READY <addr>`（`crates/authority-core/src/main.rs:190`，`println!`）。adapter 靠解析它确认 core 可用（`core.state: running` 的依据之一）。
2. **结构化错误载荷（stderr）**：`eprintln!("{}", JsonValue::Object(payload))`（`main.rs:4230`）——错误以 JSON 行输出，供 adapter 采集进诊断（`probe.core.lastError` 等）。

---

## 约定

1. **保持 stdout 通道纯净**：除 `AUTHORITY_CORE_READY` 一行外，不得向 stdout 打印任何内容（会破坏 adapter 的就绪解析）。
2. 新增诊断信息走 stderr JSON 行，字段命名与 `AuthorityErrorPayload`（`packages/shared-types/src/common.ts`）语义对齐。
3. **不要在本层新增日志框架依赖**：可观测性需求优先在 adapter 审计层实现（`packages/server-plugin/src/services/audit-service.ts`），core 保持最小运行时。
4. Agent 执行日志的 append-only/SHA-256 链机制在 adapter 层（`docs/server/agent-platform.md` §Session 日志与恢复，行 43-69），core 不参与。
