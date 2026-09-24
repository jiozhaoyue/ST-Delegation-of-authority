# Error Handling — `@stdo/server-plugin`

> 统一错误合同。总览见 [index](./index.md)。

---

## 统一错误模型

- 跨层错误载荷：`AuthorityErrorPayload`（`packages/shared-types/src/common.ts`），字段为 `error`（消息）、`code`（机器码）、`category`（错误大类）、`details`。
- 本包内部异常类型：`AuthorityServiceError`（`packages/server-plugin/src/utils.ts`），携带 HTTP status 与错误载荷；`asErrorMessage()` 做消息安全提取。
- 客户端侧对应分类类：`AuthorityApiError` 及子类（`AuthorityAuthError` / `AuthoritySessionError` / `AuthorityValidationError` / `AuthorityLimitError` / `AuthorityTimeoutError` / `AuthorityCoreError`，见 `packages/sdk-extension/src/api.ts:27-113`）。本包返回的 payload 必须能被这些子类按 `code`/`category` 正确归类。

---

## Route 层的统一出口：`fail()`

所有 route 异常必须走 `fail(runtime, req, res, extensionId, error)`（`packages/server-plugin/src/routes.ts:59-79`）：

1. `normalizeAuthorityError()` 把任意异常规范化为 `{status, payload}`；
2. permission 类错误（`category === 'permission'` 且 details 匹配）写 `runtime.audit.logPermission(...)`；
3. 其余写 `runtime.audit.logError(...)`；
4. 审计失败静默吞掉（`catch(() => undefined)`），**审计故障不改变对调用方的响应**；
5. 最后 `res.status(...).json(payload)`。

**禁止**：在 route 里裸 `res.status(...).json({...})` 抛错——会绕过审计与错误分类，Security Center 的诊断链路会失真。现有范例：`routes.ts:59-79`；权限错误消息与 details 的正则解析见 `routes.ts:81-86`（`buildPermissionErrorPayload`，匹配 `Permission not granted: <resource>[ for <target>]`）。

---

## 语义化错误类（不要发明新的）

| 场景 | category / code | 说明 |
|------|-----------------|------|
| core 不可达 / 未运行 | `core` / `core_unavailable` | 调用方应退避重试 |
| job 队列满 | `backpressure` / `job_queue_full` | 同上 |
| 并发超限 | `backpressure` / `concurrency_limit_exceeded` | 同上 |
| 权限未授予 | `permission` + `Permission not granted: ...` 消息 | 触发 `logPermission` |

调试视角的完整优先级（先 probe 再看 core.state）见 `docs/server/ai-integration-guide.md` §9（行 349-365）。

---

## 验证

```bash
npx vitest run packages/server-plugin/src/utils.test.ts          # 错误规范化单测
npx vitest run packages/server-plugin/src/routes/routes.test.ts  # route 层行为
```
