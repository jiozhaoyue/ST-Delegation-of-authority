# Logging Guidelines — `@stdo/sdk-extension` backend

> 本包控制台日志约定。总览见 [index](./index.md)。

---

## 现状（代码取证）

- 本包**没有结构化日志框架**，也没有服务端那样的审计通道。浏览器侧诊断主要靠：
  1. `AuthoritySDK.probe()` 返回的 `AuthorityProbeResponse`（install 状态、core 状态、诊断信息）——这是排障第一入口（`docs/server/ai-integration-guide.md` §9，行 349-356）；
  2. 服务端 control audit（`packages/server-plugin/src/services/audit-service.ts`）与 Security Center 的「活动与排障」视图；
  3. Security Center 的诊断快照（`AuthorityDiagnosticExtensionSnapshot` DTO，`packages/shared-types/src/diagnostics.ts`）。

---

## 约定

1. **敏感值零打印**：session token（`src/api.ts:10`）、API key（只存在服务端，前端仅见 mask/fingerprint）、core 地址与端口——一律不出现在本包任何日志/异常消息里。
2. **错误对象优先于字符串**：抛 `Authority*Error` 携带结构化 payload；需要现场日志时用 `console.warn`，不抛 `console.error` 中断型输出。
3. **不要为"排查方便"新增常驻日志**：需要可观测性时优先扩展 probe/诊断 DTO（走 shared-types → server-plugin → SDK 的联动链），而不是散落 console。
4. Agent 执行类日志有独立通道（服务端 `journal*.jsonl`），本包只负责订阅展示（`client.agent.sessions.subscribe`，`client.ts:658`），**不要**在浏览器侧复制/缓存执行日志。
