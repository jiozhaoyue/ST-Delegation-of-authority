# State Management — `@stdo/sdk-extension` frontend

> 主面板类状态机 + 视图模型模式。总览见 [index](./index.md)。

---

## 实际状态管理范式

Security Center **不使用全局状态库**（无 pinia/redux）。状态管理有两级：

### 1. 主面板类内聚状态（`security-center.ts`）

- 主类持有 `this.state`（如 `state.agent.sessions`、`state.agent.fileDiffs`，见 `packages/sdk-extension/src/security-center.ts:813,851`）。
- 游标分页的追加语义由调用点显式控制：`refreshAgentWorkbench({ cursor, append })`（:807-851）——`append: false` 清空后重建，`append: true` 续接（:1454）。
- **没有散落的模块级布尔标记**：生命周期与视图开关都在主类状态里。

### 2. 服务端状态为事实源

- Security Center 展示的一切授权/策略/诊断状态来自公开 API（probe / extensions / admin endpoints），本地 `state` 只是**投影**。
- 改状态的操作立即回读服务端确认，不做本地乐观更新为主的模式。

---

## 约定

1. 新增版块状态：先加到主类 `state` 的对应命名空间，再经 `view-models.ts` 映射展示。
2. 列表类状态必须带游标（`CursorPageInfo`），支持续读（参照 `refreshAgentWorkbench` 的 append 模式）。
3. 禁止把状态写到 `localStorage`/`sessionStorage`（数据源在服务端，见 [../backend/database-guidelines.md](../backend/database-guidelines.md)）。

---

## 验证

```bash
npx vitest run packages/sdk-extension/src/security-center.test.ts packages/sdk-extension/src/security-center/
```
