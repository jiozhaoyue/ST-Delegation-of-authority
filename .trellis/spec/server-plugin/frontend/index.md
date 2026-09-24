# Frontend 规范 — `@stdo/server-plugin`：**本层不适用**

> 结论：本包（`packages/server-plugin`）**没有任何前端代码**，本层不适用。本文件是唯一入口，无需展开主题文件。

---

## 依据（代码取证）

- `packages/server-plugin/src/` 全部内容为 Node adapter 后端：入口 `index.ts`（`init(router)` / `exit()`）、routes、services、events/SSE broker、store——无 DOM、无浏览器 API、无 UI 静态资源（`packages/server-plugin/` 下无 `static/` 目录；有 `static/` 的是 `packages/sdk-extension/` 与 `packages/example-extension/`）。
- 构建产物经 webpack 打包为服务端 bundle，由 `runtime/index.cjs`（`package.json` 的 `main`）以 Node 插件形式加载——见根 `package.json` 的 `main` 字段与 `scripts/copy-static.mjs` 分发链。
- 本仓的**前端层**真实存在，但都在别的包里：
  - 浏览器 SDK 与 Security Center UI → `packages/sdk-extension`（见 `../../sdk-extension/frontend/index.md`）
  - 示例扩展 UI → `packages/example-extension`（见 `../../example-extension/frontend/index.md`）

---

## 给 sub-agent 的指引

- 若任务涉及"前端看到 Authority 的行为"，改 `packages/sdk-extension`，不是本包；层间联动规则见 `../../server-plugin/backend/index.md`。
- 若任务要求给本包"加前端"，先停下确认需求——大概率是把 UI 落到 SDK 包的 Security Center（现有先例：权限弹窗与总览面板都在 `packages/sdk-extension/src/security-center/`）。

---

## 主题文件说明

本层各主题文件（directory-structure / component-guidelines / hook-guidelines / state-management / quality-guidelines / type-safety）均为**不适用声明**，指向本文件，不另立内容。
