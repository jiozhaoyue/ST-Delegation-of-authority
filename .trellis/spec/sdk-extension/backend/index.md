# Backend 规范 — `@stdo/sdk-extension`（浏览器侧数据接入层）

> 本包分层口径：**"backend"= 浏览器侧的 API 接入与数据通道**（HTTP 封装、会话、错误分类、权限协商、事件订阅）；**"frontend"= Security Center 等 UI**（见 [../frontend/index.md](../frontend/index.md)）。这是本包内部的切分，不是服务端分层——服务端公开 API 在 `packages/server-plugin`。

---

## 职责边界

本包是 Authority 的**浏览器接入层**，部署为 `third-party/st-authority-sdk` 扩展。它对外只暴露**两个全局成员**（`packages/sdk-extension/src/index.ts:7-10`）：

```js
window.STAuthority = { AuthoritySDK, openSecurityCenter };
```

- **AuthoritySDK**（`src/sdk.ts`，37 行）：`probe()` / `init(config)` / `getClient(extensionId)`。`init` 按 `extensionId` 去重缓存 + `initLocks` 并发去重（`sdk.ts:14-38`）。
- **AuthorityClient**（`src/client.ts`，3222 行）：全部能力命名空间，见下表。
- 错误类导出：`AuthorityApiError` 及 6 个子类（`src/index.ts:13-21`）。

**硬边界**：本包只与 `/api/plugins/authority/*`（公开 adapter 层）通信；**严禁**直连 Rust core 的 `/v1/*` loopback。端点基址 `AUTHORITY_API_BASE = '/api/plugins/authority'`（`src/api.ts:5`），会话头 `SESSION_HEADER = 'x-authority-session-token'`（`src/api.ts:10`）。禁区原文：`docs/server/ai-integration-guide.md` §6.1（行 231-237）；路径判别 §3.2（行 171-190）。

---

## 目录与关键文件

```
packages/sdk-extension/src/
├── index.ts              # 全局对象挂载 + 对外导出面（54 行）
├── sdk.ts                # AuthoritySDK：probe/init 去重（37 行）
├── api.ts                # HTTP 封装：端点基址、会话头、错误分类（176 行）
├── client.ts             # AuthorityClient 全部方法（3222 行；client.test.ts 2472 行）
├── client/               # 客户端支撑：chunking.js / encoding.js / feature-flags.js / permission-messages.js
├── permission-prompt.ts  # 权限弹窗协商（122 行）
├── host-event-recorder.ts # 宿主事件记录（145 行）
├── dom.ts                # DOM 工具（47 行）
├── security-center/      # Security Center UI 模块（见 frontend 层）
├── security-center.ts    # bootstrapSecurityCenter / openSecurityCenter（2769 行）
└── version.ts
```

### AuthorityClient 命名空间（`src/client.ts` 行号实测）

| 命名空间 | 行号 | 要点 |
|---|---|---|
| `storage` | :529 | kv / blob |
| `fs` | :545 | 私有文件（按用户+扩展隔离） |
| `sql` | :555 | query / pageAll / exec / batch / transaction / migrate |
| `trivium` | :568 | tql / tqlMut / search 系列 / index 系列 |
| `http` | :610 | fetch（走 Authority 代理） |
| `transfers` | :614 | 大 payload 分块传输 |
| `permissions` | :623 | evaluate / evaluateBatch / explain |
| `jobs` | :629 | create / get / listPage / waitForCompletion / subscribe |
| `events` | :640 | subscribe(channelOrOptions, handler) → SSE |
| `modules` | :644 | list / execute / 客户端级 `tx()` 快捷方式 |
| `host` | :650 | 聊天记录事务：captureContext / recordCommit / getConversation |
| `agent` | :658 | sessions / browser / admin |

---

## 必须遵守的约定（带证据）

1. **所有请求走 `authorityRequest()`**（`src/api.ts`）：统一附带会话头与 `AUTHORITY_VERSION`；禁止绕过它裸 `fetch`。
2. **所有 DTO 引用 `@stdo/shared-types`**（`src/api.ts:2`、`src/sdk.ts:1` 的 import 面是范例）；禁止在本包重新声明跨层类型。
3. **权限协商**：能力调用前可用 `client.hasFeature(path)` / `client.requireFeature(path)` / `client.ensurePermission(req)`（client 级方法）；权限不足抛 `AuthorityPermissionError`（`src/index.ts:13` 导出）。新扩展的接入方式（`declaredPermissions` 声明 → 授权）以 `packages/example-extension/src/index.ts:33-52` 为权威示例。
4. **最小权限声明**：只声明实际用到的权限（示例只声明 `storage.kv/blob`、`http.allow`、`jobs.background:['delay']`、`events.channels`），绝不顺手声明 `agent.*` / `fs.*` / `http.*` 高危能力。跨仓通则条目：本仓 `AGENTS.md` 统一规则块 L1-MF-5。
5. **init 幂等**：同 `extensionId` 复用缓存实例（`src/sdk.ts:14-17`）；并发 init 走 `initLocks`（:19-23）。新增入口逻辑必须保持该语义。
6. **新增公开能力时本包是第 5 步**：在 SDK client 暴露前端方法（8 步顺序原文：`docs/server/ai-integration-guide.md` §7.1 行 306-317）。SDK 源码一变，**必须**跑 `npm run sync:installable && npm run check:installable`（触发条件 §5，行 208-227）。
7. **测试与实现同目录**：`api.test.ts` / `client.test.ts` / `security-center.test.ts` / `security-center/*.test.ts` / `host-event-recorder.test.ts`；由仓根 Vitest 统一收集（`vitest.config.ts:6-11`）。

---

## 常见坑

- **"前端看起来没更新"**：本包编译产物落 `managed/sdk-extension/`。改了 `src/` 而没同步 installable 时用户端无变化。排查顺序：`managed/sdk-extension/*` 是否同步 → `.authority-release.json` 是否更新 → 是否需要重启宿主（`docs/server/ai-integration-guide.md` §9，行 357-365）。
- **SDK 目录冲突**：宿主里 `third-party/st-authority-sdk` 若被旧目录占用，probe 会报 installStatus 异常——由 install-service 重新部署（服务端逻辑在 `packages/server-plugin/src/services/install-service.ts`）。
- **events.subscribe 泄漏**：订阅返回 `AuthorityEventsSubscription`，不用时必须 `close()`；SSE 是唯一事件通道，无 WebSocket。
- **大 payload**：超过 inline 阈值（`DATA_TRANSFER_INLINE_THRESHOLD_BYTES = 256KiB`，`packages/server-plugin/src/constants.ts:18`）必须走 `transfers` 分块通道或 `putJsonLarge`。

---

## 验证命令

```bash
npm run typecheck
npx vitest run packages/sdk-extension/src/client.test.ts
npm test                          # 全量（含 cargo test）
npm run sync:installable && npm run check:installable   # 本包源码变更后必跑
```

---

## 主题文件

| 文件 | 内容 | 状态 |
|------|------|------|
| [Directory Structure](./directory-structure.md) | 接入层目录布局 | 已填实 |
| [Database Guidelines](./database-guidelines.md) | 不适用声明（本包无本地存储） | 已填实 |
| [Error Handling](./error-handling.md) | 客户端错误分类体系 | 已填实 |
| [Quality Guidelines](./quality-guidelines.md) | 接入层质量规范 | 已填实 |
| [Logging Guidelines](./logging-guidelines.md) | 控制台日志约定 | 已填实 |
