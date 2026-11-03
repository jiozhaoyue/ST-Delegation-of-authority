# ST-Delegation-of-authority 插件调研

调研时间：2026-09-21
上游：https://github.com/Youzini-afk/ST-Delegation-of-authority
本地 fork：`D:\Repo\Tavern-repo\Myfork\ST-Delegation-of-authority`（origin = https://github.com/jiozhaoyue/ST-Delegation-of-authority）

---

## 一、定位与解决的问题

**一句话**：Authority 是一个 SillyTavern **服务端插件**（server plugin，装在 `plugins/authority`），为第三方扩展统一提供「后端能力 + 权限治理」，替代每个扩展各自造轮子。

**展开**：
- 传统 ST 扩展（`public/scripts/extensions/third-party/*`）运行在浏览器里，没有服务端持久化、数据库、文件系统、后台任务、事件推送能力。想要这些能力，每个扩展只能各自想办法（滥用 localStorage、让用户手填 API、直连外部服务）。
- Authority 把「数据面」（SQL/KV/Blob/私有文件/HTTP/Jobs/事件流/Agent Runtime）收敛到一个本地 Rust core，再在其上盖一层「控制面」：扩展**先声明后使用**，用户可以 `allow-once/allow-session/allow-always/deny`，管理员可统一收口策略。
- 定位关键词：**基础型（foundational）**——它本身不是给终端用户的功能插件，而是给别的插件用的底座。

来源：README.md 第 1-8 行；`docs/server/architecture.md` 第 1-25 行。

---

## 二、架构与目录

### 三层架构（README「架构」节 + `docs/server/architecture.md` §1）

```text
SillyTavern 前端
  → window.STAuthority / AuthoritySDK           （SDK 接入层）
  → /api/plugins/authority/*                     （公开 API，Node adapter）
  → http://127.0.0.1:<ephemeral-port>/v1/*       （内部 loopback）
  → Rust authority-core                          （权威执行层）
  → SQLite + Blob 文件 + 私有文件
```

> 关键边界（`docs/server/ai-integration-guide.md` §1）：**公开 API 在 Node adapter，不在 Rust core**；`/api/plugins/authority/...` 是公开层，`/v1/...` 是内部层，前端只应碰前者。

### 目录职责表

| 目录 | 职责 |
|---|---|
| `crates/authority-core/` | Rust 权威执行层（数据面+控制面）：`sql.rs` / `trivium.rs` / `storage_blob.rs` / `http_fetch.rs` / `db.rs` / `pagination.rs` / `runtime_state.rs`。内部 loopback 服务，**不是前端稳定接口** |
| `packages/server-plugin/` | Node adapter = **真正的公开服务端 API 层**。`routes.ts` + `routes/*`（sql/storage/trivium/jobs-events/http/host/agent/st-manager/module）、`services/*`（core-service、permission-service、install-service、agent-session-*、module-host-service、host-bridge-service 等）、`events/sse-broker.ts`。负责插件生命周期、路由、会话、权限决策、审计、SDK 自动部署、core 进程管理 |
| `packages/sdk-extension/` | 浏览器 SDK 扩展（`third-party/st-authority-sdk`）。`sdk.ts`（AuthoritySDK）、`client.ts`（3439 行，AuthorityClient 全部方法）、`api.ts`（HTTP 封装与错误分类）、`security-center/*`（控制面 UI）、`permission-prompt.ts` |
| `packages/shared-types/` | 跨层 DTO / 类型单一真源（所有 DTO 必须经过这里，见 ai-integration-guide §8） |
| `packages/example-extension/` | 官方示例接入扩展（`third-party/st-authority-example`），演示 KV/Blob/HTTP/Jobs/Events 全流程 |
| `runtime/` | 构建产物入口 `index.cjs`（Node 插件入口，`package.json main`）与 `agent.cjs`（独立恢复 CLI） |
| `managed/` | **installable 产物**（真正运行时加载的东西）：`core/<platform>/authority-core[.exe]`、`sdk-extension/*`（编译后的 JS）、`host-bridge/*`。改源码后必须 `npm run sync:installable` |
| `host-bridge/` | 对 SillyTavern 宿主源码的补丁桥（`patch.cjs` + `authority-host-bridge.js`），用于聊天记录级事务/修订号语义，见第四节 |
| `stubs/` | TS 类型桩（`globals.d.ts`、`script.js.d.ts`、`scripts/`），供离线类型检查 |
| `scripts/` | 构建与发布脚本：`build-core.mjs`、`installable.mjs`、`link-dev.mjs`（本地联调）、`benchmark-core.mjs`、`versioning.mjs` |
| `docs/server/` | 11 篇服务端文档（架构/HTTP API/能力隔离/core 运行时/Agent 平台/安装发布/基准/给 AI 的集成指南） |

### 运行时启动顺序（`packages/server-plugin/src/index.ts`）

1. `createAuthorityRuntime()` 创建 runtime
2. `registerRoutes(router, runtime)` 注册公开路由
3. `runtime.install.bootstrap()` 部署 SDK + 校验 core
4. `runtime.core.start()` 启动 Rust core

来源：`docs/server/architecture.md` §3。

---

## 三、对外能力契约（SDK / API）

### 3.1 全局对象与初始化

**全局对象名**：`window.STAuthority`，仅两个成员（`packages/sdk-extension/src/index.ts:7-10`）：

```js
window.STAuthority = {
    AuthoritySDK,
    openSecurityCenter,
};
```

**初始化**（README「SDK 接入」+ `packages/example-extension/src/index.ts:26-56`）：

```js
const client = await window.STAuthority.AuthoritySDK.init({
  extensionId: 'third-party/your-extension',   // 必须与扩展目录 ID 一致
  displayName: 'Your Extension',
  version: '1.0.0',
  installType: 'local',
  uiLabel: 'Your Extension',                    // 可选，权限弹窗展示名
  declaredPermissions: {
    storage: { kv: true, blob: true },
    sql: { private: true },
    trivium: { private: true },
    fs: { private: true },
    http: { allow: ['jsonplaceholder.typicode.com'] },
    jobs: { background: ['delay'] },
    events: { channels: ['extension:third-party/your-extension'] },
  }
});
```

`AuthoritySDK` 静态方法（`packages/sdk-extension/src/sdk.ts`）：
- `AuthoritySDK.probe(): Promise<AuthorityProbeResponse>`
- `AuthoritySDK.init(config): Promise<AuthorityClient>`（按 `extensionId` 去重缓存 + initLock 并发去重）
- `AuthoritySDK.getClient(extensionId): AuthorityClient | null`

**HTTP 端点基址**：`/api/plugins/authority`（`packages/sdk-extension/src/api.ts:5`）
**会话头**：`x-authority-session-token`（`api.ts:10`）

### 3.2 AuthorityClient 主要命名空间（`packages/sdk-extension/src/client.ts:528-705`）

| 命名空间 | 方法（签名要点） |
|---|---|
| `client.storage.kv` | `get(key)` / `set(key, value)` / `delete(key)` / `list()` |
| `client.storage.blob` | `put(BlobPutRequest)` / `putJsonLarge()` / `get(id)` / `delete(id)` / `list()` |
| `client.fs` | `mkdir` / `readDir` / `writeFile` / `writeJson` / `readFile` / `delete` / `stat`（按用户+扩展隔离） |
| `client.sql` | `query` / `pageAll` / `exec` / `batch` / `transaction` / `migrate` / `stat` / `listMigrationsPage` / `listSchemaPage` / `listDatabases` |
| `client.trivium` | `tql` / `tqlPage` / `tqlMut` / `upsert` / `bulkUpsert(Chunked)` / `link` / `unlink` / `neighbors` / `search` / `searchAdvanced` / `searchHybrid` / `searchHybridWithContext` / `createIndex` / `dropIndex` / `indexText` / `stat` / `compact` / `flush` / `checkMappingsIntegrity` / `deleteOrphanMappings` |
| `client.http` | `fetch(AuthorityHttpRequest)` |
| `client.transfers` | `init` / `status` / `manifest` / `append` / `read` / `discard`（大 payload 分块传输） |
| `client.permissions` | `evaluate` / `evaluateBatch` / `explain` |
| `client.jobs` | `create(type, payload, options)` / `get` / `list` / `listPage` / `cancel` / `requeue` / `waitForCompletion` / `subscribe` |
| `client.events` | `subscribe(channelOrOptions, handler?)` → `AuthorityEventsSubscription`（SSE） |
| `client.modules` | `list` / `get(moduleId)` / `execute(moduleId, transactionName, input, options)` |
| `client.host` | `captureContext` / `recordCommit` / `getEvent` / `getConversation` / `listEvents`（聊天记录事务） |
| `client.agent` | `listTools` / `sessions.{create,listPage,get,update,send,cancelRun,resumeRun,continueFailedRun,waitForRun,subscribe}` / `browser.{registerTools,claim,submitResult}` / `admin.{profiles,sessions,workspaces}` |

客户端级方法：`init(force?)` / `probe(force?)` / `getProbe()` / `hasFeature(path)` / `requireFeature(path, message?)` / `getSession()` / `getCapabilities()` / `ensurePermission(req)` / `requestPermission(req, evaluation?)` / `evaluatePermissions(reqs)` / `explainPermission(req)` / `openSecurityCenter()` / `tx('<moduleId>:<transactionName>', input)`。

### 3.3 代码片段

```js
// SQL：migration + 查询
await client.sql.migrate({
  database: 'main',
  migrations: [{ id: '001_create_notes', statement: 'CREATE TABLE notes (id INTEGER PRIMARY KEY, title TEXT NOT NULL)' }]
});
const result = await client.sql.query({ database: 'main', statement: 'SELECT id, title FROM notes', params: [] });

// Trivium 图数据库
await client.trivium.tqlMut({ database: 'graph', query: 'CREATE (a {name: "Alice"})' });
const page = await client.trivium.tqlPage({ database: 'graph', query: 'MATCH (n) RETURN n', page: { limit: 50 } });

// 事件流（SSE）
const sub = await client.events.subscribe(
  { channel: 'extension:third-party/your-extension', onEvent: e => console.log(e.name, e.data) }
);
sub.close();

// Agent 持久会话
const session = await client.agent.sessions.create({ workspaceId: 'sillytavern', title: '排查插件冲突', mode: 'ask' });
const accepted = await client.agent.sessions.send(session.session.id, { content: '定位并修复插件冲突' });
```

来源：README「SDK 接入」全节；`packages/example-extension/src/index.ts` 全文。

### 3.4 公开 HTTP 路由（`docs/server/http-api.md` §3）

- 诊断/会话：`POST /probe`、`POST /session/init`、`GET /session/current`、`POST /permissions/evaluate(-batch|/resolve)`
- 控制面视图：`GET /extensions`、`GET /extensions/:id`、`POST /extensions/:id/grants/reset`
- KV/Blob/Transfers、私有文件、SQL、Trivium、HTTP/Jobs/Events、Agent、管理员接口共约 **120+ 路由**
- 除 `/probe` 与管理员接口外，**全部需要有效 session**；`/admin/agent/*` 额外要求 ST 用户是 admin

### 3.5 错误分类（`packages/sdk-extension/src/api.ts:174-208`）

`AuthorityApiError` 子类按 `category` 分派：`permission` → 基类、`auth` → `AuthorityAuthError`、`session` → `AuthoritySessionError`、`validation` → `AuthorityValidationError`、`limit` → `AuthorityLimitError`、`timeout` → `AuthorityTimeoutError`、`core` → `AuthorityCoreError`。回退规则：401→Auth，408/504→Timeout，413/429→Limit，其他 4xx→Validation。

### 3.6 权限资源与默认策略（`docs/server/capabilities-and-isolation.md` §1-2）

资源：`storage.kv`、`storage.blob`、`fs.private`、`sql.private`、`trivium.private`、`http.fetch`、`jobs.background`、`events.stream`（+ `agent.run` / `agent.browser`，默认 `prompt`）。

判定顺序（从高到低）：
```
声明门控 > 管理员扩展覆盖 > 管理员默认(granted/denied/blocked) > 持久授权 > 会话授权 > 管理员默认(prompt) > 系统默认(granted)
```

数据隔离维度：ST 用户 / 扩展 ID / 资源 target / 数据库名 / channel / hostname / job type。每用户数据根：`<user.rootDir>/extensions-data/authority`。

---

## 四、支持的宿主与集成方式

### 4.1 宿主支持现状

**明确证据支持的宿主：仅 SillyTavern 一个。**

- `host-bridge/manifest.json`：`"host": "sillytavern"`，`"supportedPackageVersions": ["1.18.0"]`，并列出被 patch 的 ST 源文件（`public/script.js`、`public/scripts/events.js`、`src/endpoints/chats.js` 等）
- 全仓 grep `luker|puretavern|pure tavern|tauri` 在 `docs/`、`packages/`、`host-bridge/`、`crates/` 中**零命中**（唯一命中是 `.trellis/research/archive/2026-09/09-21-multi-repo-rules-skills-survey` 下的本次调研任务文件本身）
- SDK manifest `packages/sdk-extension/static/manifest.json` 无宿主声明，`loading_order: 1`，`author: "OpenAI Codex"`

**结论**：Luker / PureTavern / TauriTavern 支持情况——**未获取**。上游 README、docs、源码均未提及这些宿主。若 Luker 等是 ST 的 fork 且兼容 `plugins/` + `/api/plugins/*` 路由，理论上可能工作，但**无上游证据，不可假定**。

### 4.2 集成方式（SillyTavern）

1. **安装位置**：`SillyTavern/plugins/authority`（**服务端插件目录**，非 `extensions/`）。目录名不强制等于插件 ID，ST 按 `info.id = authority` 识别。
2. **前置**：`enableServerPlugins: true`；建议 `enableServerPluginsAutoUpdate: false`（本地联调时）。
3. **自动部署**：插件启动时自动把 SDK 部署到 `SillyTavern/public/scripts/extensions/third-party/st-authority-sdk`，并启动 Rust core。用户无需手动复制。
4. **卸载**：删 `plugins/authority`；如需彻底清除再删 SDK 扩展目录。
5. **host-bridge 机制**：`patch.cjs` 对 ST 宿主源码打补丁，向 chat 元数据写入 `chat_metadata.authority` 与每条消息的 `message.authority`（含 `messageUid`/`swipeUid`），实现「会话修订号 + 事务上下文」，支持 `AuthorityRevisionMismatchError` 检测。桥版本 `1.1.1`（`.authority-release.json`）。

来源：README「快速开始」；`host-bridge/manifest.json`；`host-bridge/assets/src/authority-host-bridge.js:1-80`。

---

## 五、本地 fork 与上游的差异

### 结论：本地 fork 与上游 main **完全一致，零差异**。

证据：
- 本地 `HEAD` = `4d449f7`（`build: synchronize multi-platform installable artifacts [skip ci]`，2026-07-31 21:35:12 +0000）
- 上游 GitHub API `commits/main` 最新 sha = `4d449f73f9bb532c73e00ed28cbcdffe947bd2b4` —— **同一 commit**
- 本地 `package.json` version = `1.6.8`；上游 `raw/main/package.json` version = `1.6.8` —— 一致
- README 对比：本地与上游逐字节差异仅在**行尾符**（CRLF vs LF）；规范化后 `diff` 完全一致（`README IDENTICAL (only line endings differ)`）
- `git rev-list --left-right --count origin/main...HEAD` = `0  0`（与自身 origin 无分歧）
- `git tag` 为空（上游也未发布 GitHub Release，API `/releases` 返回空）

### 唯一注意点：remote 指向

本地 `origin` 指向 **`https://github.com/jiozhaoyue/ST-Delegation-of-authority`**（个人 fork），**未配置 upstream remote** 指向 `Youzini-afk/ST-Delegation-of-authority`。因此「fork 相对上游改了什么」的答案是：**没有改，是上游同一 commit 的镜像**；但如果后续要对比上游新提交，需先 `git remote add upstream https://github.com/Youzini-afk/ST-Delegation-of-authority`。

### 本地额外内容（非上游代码改动）

仓库根多了 Trellis 与多平台 agent 规则目录（`.trellis/`、`.claude/`、`.agents/`、`.codex/`、`.cursor/` 等 ~28 个平台目录 + `AGENTS.md`），这些是本地工作流脚手架，**不在上游仓库中**（上游文件树 API 无这些路径）。`.gitignore` 未忽略它们，故 `git status` 显示为 untracked。

来源：本地 `git log -1`、`git remote -v`、`git tag`、`diff` 结果；上游 API `/commits/main`、`/releases`、`/git/trees/main?recursive=1`。

---

## 六、其他插件接入约定

### 6.1 硬性约定（来自 README + `docs/server/ai-integration-guide.md`）

1. **只走 SDK，不直连 core**：前端优先 `window.STAuthority.AuthoritySDK.init(...)` + `AuthorityClient.*`。**禁止**直接 fetch `/v1/*`、假设 core 端口、手拼 `x-authority-core-token`（ai-integration-guide §3.1、§6.1）。
2. **声明式权限**：`init()` 时必须 `declaredPermissions` 覆盖要用到的每个资源与 target（数据库名 / hostname / channel / job type）。**没声明 = 在 declaration gate 被拦下**，即使管理员默认 granted。
3. **数据隔离自证**：`extensionId` 决定隔离域，扩展不能访问其他扩展的数据。不要手写路径碰 SQL 文件 / `.tdb` / Blob 内部布局（§6.3）。
4. **Trivium 不生成 embedding**：必须由调用方（或 BME）提供 `vector`（§6.4）。
5. **Jobs 不是任意代码执行**：仅内置 `delay` / `sql.backup` / `trivium.flush` / `fs.import-jsonl`（§6.5）。
6. **mapping integrity 路径不做热路径**：`checkMappingsIntegrity` / `deleteOrphanMappings` 仅供诊断维护（§6.6）。
7. **数据量大的走 transfers**：SDK inline 阈值 `SDK_TRANSFER_INLINE_THRESHOLD_BYTES = 256 * 1024`（`client.ts:526`），超出走 `client.transfers.*` 或 `putJsonLarge` / `bulkUpsertChunked`。

### 6.2 「适配器 + 特性检测 + 静默降级」模式——**存在，且有多个层次**

**（a）特性检测（Feature Flags）**：这是 Authority 官方给接入方的降级机制。
- `client.hasFeature(feature: AuthorityFeaturePath): boolean` —— 同步查 probe/session 的 features 快照
- `client.requireFeature(feature, message?)` —— 异步，先查本地再查 probe，缺失则抛错
- `AuthorityFeaturePath` 共 26 个路径，覆盖 `securityCenter` / `admin` / `sql.*` / `trivium.*` / `transfers.*` / `jobs.*` / `diagnostics.*` / `modules.enabled`（`packages/sdk-extension/src/client/feature-flags.ts:3-30`）
- **接入方推荐用法**：先 `hasFeature('trivium.tql')` 判断，再决定走新路径还是旧路径——即「可用时增强，不可用时降级」。

**（b）传输层降级**：inline vs transfer 双路径。`effectiveInlineThresholdBytes` 决定内联还是分块；大 body 自动走 `client.transfers.*`（README「当前限制」+ ai-integration-guide §2.7）。

**（c）宿主适配层**：Node adapter 本身就是「适配器」——它对前端暴露稳定的 `/api/plugins/authority/*`，内部再适配 Rust core 的 `/v1/*`。core 不可用时返回 `503 core_unavailable` + `category: core`，`job_queue_full` / `concurrency_limit_exceeded` + `category: backpressure`，**要求调用方退避重试**（README「排障」）。

**（d）宿主桥降级**：`host-bridge` 的 `captureTransactionContext()` 在桥不可用时返回 `null`，`client.host.captureContext()` 随之返回 `null`（`client.ts:3232`：`if (typeof bridge?.captureTransactionContext !== 'function') return null;`）——**典型的特性检测 + 静默降级**。

**（e）模块系统（Companion Modules）**：`packages/server-plugin/src/services/module-discovery-service.ts` + `module-host-service.ts`。其他扩展可在自己目录下放 `.authority/module.json` 声明事务（transaction），由 Authority 的 `client.modules.execute(moduleId, transactionName, input)` 调用；配套 `client.tx('<moduleId>:<transactionName>')` 语法糖。这是**扩展间互相调用能力的正式契约**。约束：`MODULE_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/`，`AUTHORITY_MODULE_SCHEMA_VERSION = 1`，inline 上限 256 MiB（超出必须走 transfer），发现阶段**不执行任何 companion 代码**、不跟随符号链接。

**（f）Agent 浏览器工具注册**：`client.agent.browser.registerTools(...)` 让前端插件把自己领域的能力注册成 Agent 可调用的工具，再由 `claim` / `submitResult` 完成回路。这是「插件反哺 Agent」的接入点。

### 6.3 不适用 / 未确认

- **传统 ST 服务端插件是否被替代**：**并存，不是替代**。Authority 自己就是一个 `plugins/` 下的 ST 服务端插件，与其它 server plugin 同级；它只规定「用 Authority 能力的扩展」要走它的 SDK，不接管其它插件的路由或生命周期。
- **装在哪里**：服务端部分在 `plugins/authority`；前端 SDK 被自动部署到 `extensions/third-party/st-authority-sdk`。**两者都装**，不是二选一。

来源：`docs/server/ai-integration-guide.md` §3/§6/§8；`packages/sdk-extension/src/client/feature-flags.ts`；`packages/sdk-extension/src/client.ts:526,3232`；`packages/server-plugin/src/services/module-discovery-service.ts:1-50`；`packages/server-plugin/src/services/companion-capabilities.ts:1-60`；README「当前限制」。

---

## 七、证据与来源

### 上游（GitHub）
- README：https://raw.githubusercontent.com/Youzini-afk/ST-Delegation-of-authority/main/README.md （全文抓取，352 行）
- 文件树：https://api.github.com/repos/Youzini-afk/ST-Delegation-of-authority/git/trees/main?recursive=1
- 仓库元数据：https://api.github.com/repos/Youzini-afk/ST-Delegation-of-authority （description：「面向 SillyTavern 的基础型服务端能力与权限治理项目」，stars=8，archived=false，default_branch=main，pushed_at=2026-07-31T21:35:23Z）
- 最新提交：https://api.github.com/repos/Youzini-afk/ST-Delegation-of-authority/commits/main → sha `4d449f73f9bb532c73e00ed28cbcdffe947bd2b4`
- Releases：https://api.github.com/repos/Youzini-afk/ST-Delegation-of-authority/releases → **空**（无 GitHub Release）

### 本地仓库（绝对路径）
- `D:\Repo\Tavern-repo\Myfork\ST-Delegation-of-authority\README.md`（352 行，与上游仅行尾符差异）
- `D:\Repo\Tavern-repo\Myfork\ST-Delegation-of-authority\package.json`（version 1.6.8，workspaces: packages/*）
- `D:\Repo\Tavern-repo\Myfork\ST-Delegation-of-authority\.authority-release.json`（pluginId=authority, sdkExtensionId=third-party/st-authority-sdk, coreArtifactPlatforms=[android-arm64, linux-arm64, linux-x64, linux-x64-musl, win32-x64], hostBridgeVersion=1.1.1）
- `D:\Repo\Tavern-repo\Myfork\ST-Delegation-of-authority\docs\server\architecture.md`（§1 三层架构、§2 职责边界、§3 启动顺序）
- `D:\Repo\Tavern-repo\Myfork\ST-Delegation-of-authority\docs\server\http-api.md`（§3 路由分组全清单、§2 会话认证）
- `D:\Repo\Tavern-repo\Myfork\ST-Delegation-of-authority\docs\server\capabilities-and-isolation.md`（§1 权限资源、§2 风险等级、§3 判定顺序、§5 隔离维度、§6 路径布局）
- `D:\Repo\Tavern-repo\Myfork\ST-Delegation-of-authority\docs\server\ai-integration-guide.md`（§1 心智模型、§3 接口边界、§6 禁止事项、§8 生成代码原则）
- `D:\Repo\Tavern-repo\Myfork\ST-Delegation-of-authority\packages\sdk-extension\src\index.ts`（:7-10 全局对象）
- `D:\Repo\Tavern-repo\Myfork\ST-Delegation-of-authority\packages\sdk-extension\src\sdk.ts`（AuthoritySDK 静态方法）
- `D:\Repo\Tavern-repo\Myfork\ST-Delegation-of-authority\packages\sdk-extension\src\api.ts`（:5 API base、:10 session header、:174-208 错误分类）
- `D:\Repo\Tavern-repo\Myfork\ST-Delegation-of-authority\packages\sdk-extension\src\client.ts`（:526 inline 阈值、:528-705 全命名空间签名、:3232 桥降级）
- `D:\Repo\Tavern-repo\Myfork\ST-Delegation-of-authority\packages\sdk-extension\src\client\feature-flags.ts`（:3-30 26 个特性路径）
- `D:\Repo\Tavern-repo\Myfork\ST-Delegation-of-authority\packages\example-extension\src\index.ts`（完整接入范例）
- `D:\Repo\Tavern-repo\Myfork\ST-Delegation-of-authority\packages\server-plugin\src\services\module-discovery-service.ts`（:1-50 companion 模块发现约束）
- `D:\Repo\Tavern-repo\Myfork\ST-Delegation-of-authority\packages\server-plugin\src\services\companion-capabilities.ts`（:1-60 companion 边界契约）
- `D:\Repo\Tavern-repo\Myfork\ST-Delegation-of-authority\host-bridge\manifest.json`（host=sillytavern, supportedPackageVersions=[1.18.0]）
- `D:\Repo\Tavern-repo\Myfork\ST-Delegation-of-authority\host-bridge\assets\src\authority-host-bridge.js`（:1-80 修订号/事务上下文）
- `D:\Repo\Tavern-repo\Myfork\ST-Delegation-of-authority\packages\sdk-extension\static\manifest.json`（display_name「扩展权限中心」, loading_order 1）

### 未获取项
- **Luker / PureTavern / TauriTavern 宿主支持**：未获取。原因：上游 README、全部 `docs/server/*.md`、`packages/`、`host-bridge/`、`crates/` 中 grep 这些关键词零命中；本地 fork 亦无。**不可假定兼容**。
- **上游 GitHub Release 记录**：未获取（API 返回空数组）。上游用「CI 生成 installable 产物 + git tag 式版本号」而非 GitHub Release，`git tag` 亦为空。
