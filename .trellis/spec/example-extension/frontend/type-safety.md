# Type Safety — `@stdo/example-extension` frontend

> 接入类型规范。总览见 [index](./index.md)。

- **import type 自 `@stdo/shared-types`**：版本与 DTO 消费同其他包一致；类型真源在 `../../shared-types/backend/index.md`。
- 现状说明：示例的 `AuthoritySdkLike`（`packages/example-extension/src/index.ts:15-22`）与 `authorityClient: any`（:22）是**有意收窄的本地接口**——示例只依赖 init 签名与少量方法，避免与 SDK 全类型面耦合。真实扩展应直接 `import type { AuthorityClient, ... } from '@stdo/shared-types'` 并用 SDK 导出的类型（`packages/sdk-extension/src/index.ts:13-53` 的导出面）。
- 改示例类型时保持"最小依赖面"取向，不为了强类型把示例变成类型教科书。
