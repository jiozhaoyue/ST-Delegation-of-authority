# Type Safety — `@stdo/sdk-extension` frontend

> DTO → 视图模型的类型链。总览见 [index](./index.md)。

---

## 类型链（实测）

```
packages/shared-types/src/*.ts     # 唯一类型真源（DTO）
        ↓ import type
packages/sdk-extension/src/*.ts    # api.ts / client.ts / sdk.ts 的 import 面见 backend 层
        ↓
packages/sdk-extension/src/security-center/view-models.ts   # DTO → 展示模型（UI 内聚类型）
packages/sdk-extension/src/security-center/types.ts         # 版块私有 UI 类型
```

## 约定

1. **服务端数据类型一律 `import type { ... } from '@stdo/shared-types'`**（范例：`src/index.ts:43-50` 从 shared-types 转出 `AuthorityHost*` 类型族；`security-center/` 模块同构）。禁止在 UI 层重新描述服务端响应结构。
2. **展示模型在 `view-models.ts` 定义**：格式化后的字符串、状态徽标枚举、UI 专用聚合结构放这里；`security-center/types.ts` 只放版块私有类型。
3. **DTO 结构变更时**：先改 shared-types（8 步顺序第 1 步），本包的引用会在 `npm run typecheck` 暴露所有需联动点。
4. 运行时判别（如 `isAuthorityErrorPayload`，`src/api.ts:29-47` 附近）集中在 api/client 层，UI 层不做 payload 结构猜测。

---

## 验证

```bash
npm run typecheck    # version:sync && tsc -b，覆盖本包与 shared-types 的类型联动
```
