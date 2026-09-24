# Frontend 规范 — `@stdo/sdk-extension`（Security Center UI 层）

> 本层覆盖本包的 UI 面：Security Center 总面板与权限弹窗。数据接入层规范见 [../backend/index.md](../backend/index.md)。

---

## 职责边界

本层是 Authority 的**控制面 UI**：总览、扩展详情、数据资产、活动与排障、Agent 工作台、管理员策略、运维面板。入口两条：`window.STAuthority.openSecurityCenter()` 与 SDK 引导时自动 `bootstrapSecurityCenter()`（`packages/sdk-extension/src/index.ts:1,7-10`）。

UI 是**原生 DOM + 单类状态机**模式（非 React/Vue）：`security-center.ts`（2769 行）持有 `this.state` 并直接操作 DOM；`security-center/` 子目录按版块拆分逻辑。

静态资源（`packages/sdk-extension/static/`）：`security-center.html`、`permission-dialog.html`、`style.css`、`manifest.json`——经构建落入 `managed/sdk-extension/`（installable）。

---

## 目录与关键文件

```
packages/sdk-extension/src/
├── security-center.ts        # 引导 + 主面板类（状态 + DOM 渲染 + 事件）
├── security-center/
│   ├── components.ts         # DOM 构件工厂
│   ├── view-models.ts        # 视图模型（服务端数据 → 展示模型）
│   ├── host.ts               # 宿主面板版块（host.test.ts 伴测）
│   ├── governance-workbench.ts / system-workbench.ts / agent-workbench.ts
│   │                         #   治理 / 运维 / Agent 三大工作台
│   ├── agent-settings.ts     # Agent 设置版块
│   ├── impact-confirmation.ts # 高影响操作确认
│   ├── mobile-presentation.ts # 移动端呈现适配
│   ├── workspace-diff-view.ts # 工作区差异视图
│   ├── st-manager-bridge.ts / st-manager-control.ts # ST 管理桥
│   ├── formatters.ts / options.ts / constants.ts / types.ts
│   └── *.test.ts             # 每个版块同目录伴测
└── permission-prompt.ts      # 权限弹窗逻辑（backend 层已述，UI 部分与本层联动）
```

---

## 必须遵守的约定（带证据）

1. **CSS 容器作用域隔离**：`packages/sdk-extension/static/style.css:3-5` 以 `.authority-panel` / `.authority-permission-dialog` / `.authority-impact-dialog` 三个根容器承载全部规则（如 `.authority-panel *` :39-41、`.authority-panel button` :147）；本地变量一律 `--authority-*` 前缀（:31 `--authority-font`）。配色继承宿主变量并带回退：`var(--mainFontFamily, system-ui)` :31、`var(--mainFontSize, 14px)` :35。**禁止裸 `body`/`:root`/酒馆原生类名选择器、禁止硬编码颜色**。跨仓通则（双前缀铁律，有真实事故案例）：本仓 `AGENTS.md` 统一规则块 L0-10 / P-5。
2. **视图模型分层**：服务端 DTO → `security-center/view-models.ts` 转为展示模型 → `components.ts` 渲染。禁止在渲染代码里直接解析服务端原始 payload 字段（跨层思维触发点见 `../../guides/index.md`）。
3. **分页 UI 复用统一合同**：长列表（扩展、事件、审计、agent sessions）用游标分页（`CursorPageRequest/CursorPageInfo`），现有范例 `security-center.ts:807,1454`（`refreshAgentWorkbench({ cursor, append })`）。
4. **每版块伴测**：`security-center/*.test.ts` 与实现同目录（`governance-workbench.test.ts`、`agent-workbench.test.ts` 等 7 个）。
5. **静态资源变更也要 installable 同步**：`static/` 变更经构建进 `managed/sdk-extension/`，触发 `npm run sync:installable && npm run check:installable`。

---

## 常见坑

- **改了 UI 没生效**：静态资源与编译产物都落 `managed/sdk-extension/`；先确认 installable 已同步、宿主已重启（`docs/server/ai-integration-guide.md` §9，行 357-365）。
- **样式污染宿主**：本包 UI 注入宿主页面，任何选择器泄漏都会破坏整个酒馆界面。新增规则必须落在三个根容器作用域内。
- **移动端**：小屏行为集中在 `mobile-presentation.ts`，不要在各版块散写媒体查询。

---

## 验证命令

```bash
npm run typecheck
npx vitest run packages/sdk-extension/src/security-center.test.ts packages/sdk-extension/src/security-center/
npm run sync:installable && npm run check:installable
```

---

## 主题文件

| 文件 | 内容 | 状态 |
|------|------|------|
| [Directory Structure](./directory-structure.md) | UI 模块布局 | 已填实 |
| [Component Guidelines](./component-guidelines.md) | 组件/版块模式 | 已填实 |
| [Hook Guidelines](./hook-guidelines.md) | 不适用声明（无 React） | 已填实 |
| [State Management](./state-management.md) | 主类状态 + 视图模型 | 已填实 |
| [Quality Guidelines](./quality-guidelines.md) | CSS 作用域与 UI 质量规范 | 已填实 |
| [Type Safety](./type-safety.md) | DTO 到视图模型的类型链 | 已填实 |
