# Component Guidelines — `@stdo/example-extension` frontend

> 宿主 UI 注入模式（原生 DOM，无框架）。总览见 [index](./index.md)。

---

## 既有模式（`packages/example-extension/src/index.ts`）

1. **菜单按钮**：`#extensionsMenu` 查找 + 去重（已有 `#authority-example-button` 则跳过，:54-57）→ 宿主模板 `renderExtensionTemplateAsync(EXTENSION_NAME, 'menu-button', ...)`（:59）→ `template.content.firstElementChild`（:63）→ `click` 监听开 demo 面板（:68-70）。
2. **复杂交互用宿主 Popup**：`import { Popup, POPUP_TYPE } from '/scripts/popup.js'`（:2）；`POPUP_TYPE.TEXT ?? 0` 的回退写法（:8）防宿主枚举变更。
3. **模板缺失容错**：模板渲染结果非 HTMLElement 时抛明确错误（:64-66）。

## 禁止

- 自建全局浮层/iframe 绕过宿主 UI 体系（宿主适配只走公开锚点；通则：本仓 `AGENTS.md` 统一规则块 L0-9）。
- 直接操作宿主内部 DOM 结构（API 事实以官方文档为准，统一规则块 P-13）。

---

## 验证

```bash
npm run typecheck
npm run build
```
