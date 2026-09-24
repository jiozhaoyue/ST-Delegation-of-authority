# Quality Guidelines — `@stdo/example-extension` frontend

> 接入质量规范，核心是最小权限。总览见 [index](./index.md)。

---

## 接入检查清单（新扩展照此自查）

1. [ ] `window.STAuthority?.AuthoritySDK` 探测 + 明确报错（`packages/example-extension/src/index.ts:25-31` 模式）。
2. [ ] `extensionId` 与扩展目录 ID 完全一致（:12）。
3. [ ] `declaredPermissions` **只含实际用到的能力**（:40-52 样板）；高危资源（`agent.*` / `fs.*` / `sql.private` / `trivium.private` / 宽域 `http.*`）未用到就不声明。风险等级表：`docs/server/capabilities-and-isolation.md` §1-§2（行 11-40）。
4. [ ] `events.channels` 用 `extension:<自身ID>` 自有频道（:50-52），不订阅他人频道。
5. [ ] `http.allow` 精确到域名（:47-49），不开宽域。
6. [ ] UI 只用宿主公开锚点与 Popup（见 [component-guidelines.md](./component-guidelines.md)）。
7. [ ] 版本号复用 `AUTHORITY_VERSION`（:4）。
8. [ ] installable 同步：`npm run sync:installable && npm run check:installable`。

---

## 常见坑

- **授权被拒后的行为**：权限未授予时能力调用抛 `AuthorityPermissionError`——示例未演示降级路径；真实扩展应捕获并提示用户去 Security Center 授权（错误类见 `../../sdk-extension/backend/error-handling.md`）。
- **声明与使用不一致**：声明了 `sql.private` 却从未调用，或反过来调用未声明能力（会被 declaration gate 直接拦下，权限判定顺序第一条：`docs/server/capabilities-and-isolation.md` §3，行 42-64）。

---

## 验证

```bash
npm run typecheck
npm run build && npm run sync:installable && npm run check:installable
```
