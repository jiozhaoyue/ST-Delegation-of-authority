# Quality Guidelines — `@stdo/sdk-extension` backend

> 接入层质量规范。总览见 [index](./index.md)。

---

## 写代码前检查清单

1. **只走公开 API**：一切请求经 `authorityRequest()`（`src/api.ts`）发往 `/api/plugins/authority/*`；禁止直连 `/v1/*`（禁区：`docs/server/ai-integration-guide.md` §6.1，行 231-237）。
2. **类型来自 shared-types**：import 面范例 `src/api.ts:2`、`src/sdk.ts:1`。
3. **init 语义保持幂等**：缓存 + 锁（`src/sdk.ts:14-38`）；新增入口不得破坏同 `extensionId` 复用。
4. **会话头不落日志**：`x-authority-session-token`（`src/api.ts:10`）不得打印。
5. **installable 同步**：本包源码一变即触发（`npm run sync:installable && npm run check:installable`）。
6. **版本单一来源**：`src/version.ts`（1 行，导出 `AUTHORITY_VERSION`），与 `packages/shared-types/src/version.ts` 及 `npm run version:sync` 链路联动；不要硬编码版本号。

---

## 六条禁区的本包映射

本包是第 ① 条（浏览器直连 core）与第 ④ 条（trivium 当 embedding）的**第一防线**：

- SDK 请求面只有 `/api/plugins/authority/*`——core 的 token/端口永远不会出现在本包代码里。
- `trivium.search*/upsert` 系列的 `vector` 参数由调用方提供；SDK 不做文本向量化、不内置 embedding 客户端（禁区原文：`docs/server/ai-integration-guide.md` §6.4，行 260-275）。

其余四条的落点在服务端（见 `../../server-plugin/backend/quality-guidelines.md`）。

---

## 反模式

- 在 SDK 里复制服务端能力逻辑（例如自己实现分页循环而不用 `client.sql.pageAll`）。
- 绕过 `client/` 子目录直接在 `client.ts` 内联大段纯算法（分块/编码应保持可单测）。
- 在能力方法里吞错：错误统一抛 `Authority*Error`，由调用方决定降级策略（见 `../backend/error-handling.md`）。

---

## 验证

```bash
npm run typecheck
npx vitest run packages/sdk-extension/src/api.test.ts packages/sdk-extension/src/client.test.ts
```
