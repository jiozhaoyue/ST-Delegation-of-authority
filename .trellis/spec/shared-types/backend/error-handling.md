# Error Handling — `@stdo/shared-types`

> 本包定义错误合同本身（不含处理逻辑）。总览见 [index](./index.md)。

---

## `AuthorityErrorPayload` 合同（`src/common.ts`）

```ts
// 字段（语义见 docs/server/ai-integration-guide.md §3.1 前后文）
interface AuthorityErrorPayload {
    error: string;                      // 人类可读消息
    code?: AuthorityErrorCode;          // 机器码（如 core_unavailable / job_queue_full）
    category?: AuthorityErrorCategory;  // 大类：core / backpressure / permission / ...
    details?: ...;                      // 结构化细节（permission 类含资源与 target）
}
```

三方消费（改动此合同必须三层联动验证）：

1. **server-plugin**：`fail()` 统一出口（`packages/server-plugin/src/routes.ts:59-79`）。
2. **sdk-extension**：`AuthorityApiError` 按字段分类为子类（`packages/sdk-extension/src/api.ts:27-113`）。
3. **Security Center**：诊断展示（`packages/sdk-extension/src/security-center/`）。

## 约定

1. 新错误码先在 `src/common.ts` 的 `AuthorityErrorCode` / `AuthorityErrorCategory` 联合类型登记，再在服务端实现抛出——顺序不可反（否则 typecheck 不拦截拼写）。
2. permission 类错误的 details 结构（`AuthorityPermissionErrorDetails`，`src/permissions.ts`）与 `packages/server-plugin/src/routes.ts:81-86` 的消息正则 `Permission not granted: <resource>[ for <target>]` 互为表里，改其一必须同步另一个。
3. 禁止用 `error` 消息字符串做程序判断（ brittle ），一律判 `code`/`category`。
