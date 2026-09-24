# Frontend 规范 — `@stdo/shared-types`：类型被前端消费的方式

> 本包**没有任何前端运行时代码**（无 UI、无 DOM、无浏览器 API）。本层说明"前端如何正确消费本包类型"，以及与 UI 层的联动规则。

---

## 消费方式（实测）

1. **仅 `import type`**：UI 层（`packages/sdk-extension/src/security-center/`）与服务端（`packages/server-plugin`）一律 `import type { ... } from '@stdo/shared-types'`——本包经 workspace 引用（根 `package.json` `workspaces: ["packages/*"]`），编译期即校验。
2. **UI 私有类型不进本包**：展示模型（视图模型）、格式化后字符串、UI 状态枚举留在 `packages/sdk-extension/src/security-center/view-models.ts` 与 `security-center/types.ts`（见 `../../sdk-extension/frontend/type-safety.md`）。
3. **DTO 变更的 UI 联动链**：本包改字段 → `npm run typecheck` 暴露 SDK 侧受影响点 → `view-models.ts` 同步映射 → `npm run sync:installable && npm run check:installable`（触发条件：`docs/server/ai-integration-guide.md` §5，行 208-227）。

---

## 给 sub-agent 的指引

- 任务若只涉及"改一个 UI 展示"，优先检查是否只是 `view-models.ts` 的映射问题，不要先动本包——改本包类型是跨层合同变更，须按 [../backend/index.md](../backend/index.md) 的联动规则执行。
- 本层各主题文件为不适用/指引声明，唯一入口是本文件。
