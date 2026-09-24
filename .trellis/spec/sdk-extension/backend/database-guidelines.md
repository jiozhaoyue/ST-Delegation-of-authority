# Database Guidelines — `@stdo/sdk-extension` backend

> **本包不适用数据库规范**。总览见 [index](./index.md)。

---

## 裁决

本包（浏览器 SDK）**没有任何本地持久化设施**：无 IndexedDB / OPFS / localStorage 依赖、无私有数据库。所有数据能力（KV / Blob / SQL / Trivium / 私有文件）都通过 Authority 公开 API 存到服务端，按**用户 + 扩展**隔离——这正是本仓"数据事实源在服务端、浏览器只做接入"的架构取向。

本仓对"纯前端项目引入服务端能力"的通则是「适配器 + 特性检测 + 静默降级」，条目：本仓 `AGENTS.md` 统一规则块 L0-11；本仓自身的样板实现即本 SDK（Host Bridge 失败仅 `console.warn` 不阻断加载）。

---

## 相关约定（数据接入视角）

1. **大 payload 走分块通道**：inline 阈值 256KiB（`packages/server-plugin/src/constants.ts:18`）；超过则用 `transfers` 命名空间（`client.ts:614`）或 `storage.blob.putJsonLarge()`。分块实现见 `src/client/chunking.js`。
2. **数据隔离是服务端语义**：SDK 不做任何本地"隔离模拟"；扩展只能看到自己命名空间下的数据（隔离模型：`docs/server/capabilities-and-isolation.md` §5-§7，行 96-347）。
3. **不要在本包引入存储库**（IndexedDB / idb / Dexie 等）——若某任务要求离线能力，先停下与用户确认，因为这与本仓数据源架构相悖（同类教训案例：本仓群 `ST-BgLoader` 曾因"浏览器优先"存储设计返工，见统一规则块 P-9 案例条目）。
