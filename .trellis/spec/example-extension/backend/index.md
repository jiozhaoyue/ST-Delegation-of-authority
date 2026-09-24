# Backend 规范 — `@stdo/example-extension`：**本层不适用**

> 结论：示例扩展是**纯浏览器扩展**，没有任何后端代码；本层不适用，唯一入口是本文件。

---

## 依据（代码取证）

- `packages/example-extension/src/index.ts`（90+ 行）全部运行在浏览器：从宿主导入 `renderExtensionTemplateAsync` / `Popup`（`src/index.ts:1-2`），经 `window.STAuthority.AuthoritySDK.init()`（:33）接入能力——**它没有自己的服务端**，其后端能力全部来自 Authority（`/api/plugins/authority/*`）。
- 该包的定位是**官方接入示范**：演示 `declaredPermissions` 最小声明、KV/Blob/HTTP/Jobs/Events 全流程。
- 目录证据：`packages/example-extension/` 下无任何 Node 端代码（无 routes/services）；`static/` 为浏览器静态资源。

---

## 给 sub-agent 的指引

- 若任务涉及"给示例扩展加能力演示"，按 [../frontend/index.md](../frontend/index.md) 的接入规范执行。
- 若任务需要真正的服务端行为，那不属于本包——服务端能力在 `packages/server-plugin`（adapter）与 `crates/authority-core`（core）；接入方式见 `../../sdk-extension/backend/index.md`。
- 权限声明的最小化要求见 [../frontend/quality-guidelines.md](../frontend/quality-guidelines.md)。

---

## 主题文件说明

本层各主题文件均为不适用声明，指向本文件或 frontend 层。
