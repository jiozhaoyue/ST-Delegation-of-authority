# 04 · Authority 可移植子集 / 不可移植子集清单（R4）

> 任务：`09-22-authority-ecosystem-pr-strategy`（父任务 C-09）
> 回答：**Authority 哪些能力跨宿主插件可以依赖、哪些禁止依赖**（硬约束 L0-12）。
> 每条均带回源指针（AC-3）；本清单**不含任何"依赖 Host Bridge"的可移植条目**（自查见 §六）。

---

## 一、判定口径

- **可移植** = 能力只依赖「宿主服务端插件装载契约（`plugin-loader` + `plugins/` + `/api/plugins/*`）+ Authority 自身（SDK / server-plugin / core）」，**不依赖 Host Bridge 补丁层**、不依赖宿主非公开内部 API。
- **不可移植** = 能力经由 Host Bridge 补丁（版本门禁 `host=sillytavern` / `supportedPackageVersions=["1.18.0"]`）或宿主内部实现提供。

三条判定性证据（总源）：

| 证据 | 内容 | 回源 |
| --- | --- | --- |
| 装载契约同形 | Luker 与 ST 的 `plugin-loader.js` 六证据点逐字节同形 → 服务端插件基建可移植 | `research/07` §2.1 |
| 桥接层与内核解耦 | `host-bridge-service.ts:236-252` 版本门禁抛错被 `index.ts:23-32` 吞为 `console.warn`，内核能力不受影响 | `research/07` §2.2 |
| 命名空间归属 | `client.host.*` 是 Host Bridge 消费面（桥不可用时 `captureContext` 返回 `null`，`client.ts:3232`） | `research/04` §3.2、§6.2(d) |

---

## 二、可移植子集（跨宿主插件允许依赖）

> 宿主可用性统一口径：**ST ✅ / Luker ✅（静态验证；运行时装载未实测，见 `03-backend-route.md` §五）/ PT ❌ / TT ❌**（后两者无服务端插件基建，走纯前端降级）。回源：`research/07` §一结论表 + §2.5。

| # | 能力 | SDK 入口 | 可用性 | 回源指针 | 备注 / 禁区 |
| --- | --- | --- | --- | --- | --- |
| P1 | 探测与会话 | `AuthoritySDK.probe/init/getClient`；会话头 `x-authority-session-token`；端点基址 `/api/plugins/authority` | ST✅ L✅ PT❌ TT❌ | `research/04` §3.1（`api.ts:5,10`）、§3.2；`research/07` §2.1 | probe 是一切降级分支的判据 |
| P2 | **Feature Flags** | `hasFeature(path)` / `requireFeature(path,msg?)`，26 特性路径 | 同上 | `research/04` §6.2(a)（`feature-flags.ts:3-30`）；`research/10` §B.1 第 2 层 | **跨宿主插件强制姿势**：先检测后调用 |
| P3 | KV 存储 | `client.storage.kv.{get,set,delete,list}` | 同上 | `research/04` §3.2 命名空间表 | — |
| P4 | Blob 存储 | `client.storage.blob.{put,putJsonLarge,get,delete,list}` | 同上 | `research/04` §3.2 | — |
| P5 | 大 payload 分块传输 | `client.transfers.{init,status,manifest,append,read,discard}`；inline 阈值 256 KB | 同上 | `research/04` §3.2 + §6.1 第 7 条（`client.ts:526`） | B5 导入流量优化的落点 |
| P6 | 私有文件系统 | `client.fs.{mkdir,readDir,writeFile,writeJson,readFile,delete,stat}` | 同上 | `research/04` §3.2 | 禁区③：不手写路径碰数据文件（`ai-integration-guide` §6.3） |
| P7 | SQL（私有库） | `client.sql.{query,pageAll,exec,batch,transaction,migrate,stat,...}` | 同上 | `research/04` §3.2 | B4 后端转交落点；禁区③同上 |
| P8 | Trivium 图库 | `client.trivium.{tql,tqlPage,tqlMut,upsert,bulkUpsert(Chunked),link,neighbors,search,searchAdvanced,...}` | 同上 | `research/04` §3.2 | 禁区④：**调用方自传 `vector`**（§6.4）；禁区⑥：`checkMappingsIntegrity`/`deleteOrphanMappings` 非热路径（§6.6）；≥10000 节点时 `.tdb.quiver` 派生索引、导入后首次查询自动重建（可 `forceBruteForce` 换 100% 召回） |
| P9 | HTTP 代理 | `client.http.fetch(AuthorityHttpRequest)`（域名白名单声明） | 同上 | `research/04` §3.2 | — |
| P10 | 后台任务 | `client.jobs.{create,get,list,listPage,cancel,requeue,waitForCompletion,subscribe}` | 同上 | `research/04` §3.2 | 禁区⑤：**仅内置 `delay` / `sql.backup` / `trivium.flush` / `fs.import-jsonl`**，不是代码执行平台（§6.5） |
| P11 | 事件流 | `client.events.subscribe(channelOrOptions, handler?)`（SSE，`extension:<extensionId>` channel） | 同上 | `research/04` §3.2 | SSE-only，无 WebSocket/跨用户广播 |
| P12 | 权限评估 | `client.permissions.{evaluate,evaluateBatch,explain}` + `ensurePermission/requestPermission` | 同上 | `research/04` §3.2 + §3.6（7 级判定顺序、6 维隔离） | 最小声明（L1-MF-5）；不绕 PermissionService（禁区②） |
| P13 | **Companion Modules 互调** | `client.modules.{list,get,execute}` + `client.tx('<moduleId>:<txName>')` 语法糖 | 同上 | `research/04` §6.2(e)（`module-discovery-service.ts:1-50`、`companion-capabilities.ts:1-60`） | **"联动但不耦合"的正式契约**；约束：`MODULE_ID_PATTERN`、`AUTHORITY_MODULE_SCHEMA_VERSION=1`、inline 上限 256 MiB（超出走 transfer）、发现阶段不执行 companion 代码、不跟随符号链接 |
| P14 | Agent 平台 | `client.agent.{listTools, sessions.*, browser.{registerTools,claim,submitResult}, admin.*}` | 同上 | `research/04` §3.2；`research/07` §2.3（`isSillyTavernRoot` 在 Luker 上 true → `ensureDefaultAgentWorkspace()` 不落入失败分支） | ⚠️ 默认 `workspaceId: 'sillytavern'` 在 Luker 上的运行时行为未实测（`03-backend-route.md` §五#5） |
| P15 | 错误分类与退避契约 | `AuthorityApiError` 按 category 分派（auth/session/validation/limit/timeout/core/backpressure） | 同上 | `research/04` §3.5（`api.ts:174-208`） | `core_unavailable`/`job_queue_full` 等须退避重试 |
| P16 | Security Center 入口 | `window.STAuthority.openSecurityCenter()` | 同上 | `research/04` §3.1（`index.ts:7-10`） | — |

---

## 三、不可移植子集（跨宿主插件**禁止**依赖）

| # | 能力 | 为什么不可移植 | 回源指针 |
| --- | --- | --- | --- |
| N1 | **`client.host.*` 全命名空间**（`captureContext` / `recordCommit` / `getEvent` / `getConversation` / `listEvents`） | 聊天修订号 + 事务上下文由 Host Bridge 补丁提供；桥不可用时 `captureContext()` 静默返回 `null`（`client.ts:3232`）→ 语义静默丢失，产生**难以排查的数据不一致**（L0-12 列明的违反后果） | `research/04` §3.2 host 行、§6.2(d)；`research/07` §2.2、§3.2 约束 1 |
| N2 | **`host-bridge/` 机制本体**（`manifest.json` + `patch.cjs`） | 版本门禁 `host=sillytavern` / `supportedPackageVersions=["1.18.0"]`，Luker 2.7.0 上 `resolveContext()` 必然抛错；且 patch 按 ST 1.18.0 源码文本打，Luker 已分叉，绕门禁强装会 `conflict` / 语法错误 | `research/07` §2.2、§2.4（六目标文件存在但文本分叉）；`host-bridge/manifest.json` |
| N3 | **补丁写入的宿主数据**：`chat_metadata.authority`、`message.authority`（`messageUid`/`swipeUid`） | 属 Host Bridge 补丁产物，Luker 上不存在；依赖它 = 跨宿主行为分叉 | `research/04` §4.2 第 5 条；`research/07` §3.2 |
| N4 | 直连 `/v1/*`、`x-authority-core-token` | 本属全局禁区①（非公开层），且绕过权限模型 | `research/04` §6.1 第 1 条（`ai-integration-guide` §6.1） |
| N5 | 宿主内部 API / 内部函数 | 非公开契约，随版本可改，升级后静默失效 | `research/04` §6.3；统一规则坑册 P-13 |

---

## 四、Luker 上放弃的能力与替代

| 放弃 | 替代 |
| --- | --- |
| 聊天修订 / 事务乐观锁语义（N1） | 插件用可移植子集自持确定性状态（KV/SQL 记录自己的内容指纹与版本，参考 L1-MF-13"内容指纹不用时间戳"），或该功能在 Luker 降级为无修订检测 |
| 若将来确需在 Luker 上获得事务语义 | 独立立项为 Luker 编写 `manifest.json` + `patch.cjs` 并跟随 Luker 版本维护——成本与持续性风险高，**默认不做**（`research/07` §3.2） |

---

## 五、跨宿主插件作者使用规则（5 条）

1. 一切能力调用前 `hasFeature` / probe 分支（P2）；不可用时纯前端路径全功能（L0-11）。
2. `declaredPermissions` 最小声明，只声明实际用到的资源与 target（L1-MF-5）。
3. **禁止 import / 依赖任何 `host-bridge` 产物与 `client.host.*`**；插件仓 CI 自查 `client\.host\.|host-bridge` 命中必须为 0。
4. PT/TT 分支必须有纯前端降级且不报错不阻塞（L0-11）。
5. 使用 P14（agent 能力）须在文档标注"workspaceId 运行时行为未实测"（`03-backend-route.md` §五#5）。

---

## 六、自查结论（AC-3 / 约束核查）

- ✅ 可移植表 P1–P16 中**无任何 Host Bridge 依赖条目**；N1–N3 已把桥接面完整隔离进不可移植侧。
- ✅ 每条均带 `research/04` / `research/07` 回源指针（P 列指向 §3.2 / §6.2 / §6.1；N 列指向 §6.2(d) / §4.2 / §2.2 / §2.4 / §3.2）。
- ✅ 判定口径与 L0-12 一致：跨宿主插件只依赖可移植子集。
