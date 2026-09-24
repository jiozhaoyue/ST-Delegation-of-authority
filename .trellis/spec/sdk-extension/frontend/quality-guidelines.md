# Quality Guidelines — `@stdo/sdk-extension` frontend

> UI 质量规范，核心是 CSS 作用域纪律。总览见 [index](./index.md)。

---

## CSS 作用域纪律（本仓有真实事故教训）

`packages/sdk-extension/static/style.css` 的现行范式：

1. **三个根容器**承载全部规则：`.authority-panel` / `.authority-permission-dialog` / `.authority-impact-dialog`（`style.css:3-5`）。
2. **容器内通配**只允许出现在容器作用域下（`.authority-panel *` :39-41、`.authority-panel button/input/select/textarea` :147-154）。
3. **本地变量 `--authority-*` 前缀**（:31 起），配色继承宿主变量并带回退：`var(--mainFontFamily, system-ui)` :31、`var(--mainFontSize, 14px)` :35。
4. **禁止**：裸 `body` / `:root` / `*` 顶层选择器、酒馆原生类名（`.menu_button` / `.inline-drawer` 等）、硬编码颜色值。

> 跨仓通则与事故案例：本仓 `AGENTS.md` 统一规则块 L0-10（双前缀铁律）与 P-5（2026-09 实际发生过的 UI 污染事故）。本仓的落地方式如上（`.authority-` 根容器 + 作用域内通配），**新增样式必须沿用该范式**。

---

## UI 质量检查清单

- [ ] 新样式全部在三个根容器作用域内（grep 自查：`grep -n "^body\|^:root\|^\*" packages/sdk-extension/static/style.css` 应为 0 命中）。
- [ ] 新颜色经 `--authority-*` 变量或宿主变量 + 回退值，无硬编码。
- [ ] 长列表支持游标分页（见 [state-management.md](./state-management.md)）。
- [ ] 破坏性操作接 `impact-confirmation.ts`。
- [ ] 移动端行为进 `mobile-presentation.ts`。
- [ ] 每个新模块有同目录伴测。
- [ ] installable 已同步（`npm run sync:installable && npm run check:installable`）。

---

## 验证

```bash
npm run typecheck
npx vitest run packages/sdk-extension/src/security-center.test.ts packages/sdk-extension/src/security-center/
```
