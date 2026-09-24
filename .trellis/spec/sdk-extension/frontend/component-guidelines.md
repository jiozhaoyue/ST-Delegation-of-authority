# Component Guidelines — `@stdo/sdk-extension` frontend

> 本仓前端**不使用 React/Vue 组件框架**，本文件的"组件"= 原生 DOM 版块模块。总览见 [index](./index.md)。

---

## 版块模式（真实代码范式）

Security Center 的可复用单元是 `security-center/` 下的**版块模块**，统一模式：

1. **入口函数**：版块导出一个渲染/刷新函数，接收主类实例或上下文对象（参照 `security-center/governance-workbench.ts`、`system-workbench.ts`、`agent-workbench.ts` 的导出面）。
2. **构件工厂**：DOM 构造经 `security-center/components.ts` 的工厂函数，不手写内联 HTML 字符串拼装大块结构。
3. **格式化集中**：时间/字节/状态文案经 `security-center/formatters.ts`。
4. **高影响操作必须二次确认**：破坏性操作走 `security-center/impact-confirmation.ts`（例如管理员策略变更、工作区回滚）。
5. **移动端一致性**：版块样式与交互在 `security-center/mobile-presentation.ts` 统一适配，禁止版块内私写媒体查询。

---

## 权限弹窗

`permission-prompt.ts`（122 行）与 `static/permission-dialog.html` 构成授权 UX；弹窗展示名由扩展声明的 `uiLabel` 提供（接入示例：`packages/example-extension/src/index.ts:37`）。改弹窗文案/布局时同步检查后端 `PermissionEvaluateResponse` 字段（`packages/shared-types/src/permissions.ts`）。

---

## 禁止

- 在版块里直接 `fetch`（数据一律走 [backend 层](../backend/index.md) 的 `authorityRequest`）。
- 全局事件监听不清理（版块刷新时须解绑自身监听）。
- 绕过 `components.ts` 手拼 HTML（XSS 风险面）。

---

## 验证

```bash
npx vitest run packages/sdk-extension/src/security-center/
```
