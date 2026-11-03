# C-08 关键路径验证：Authority 四宿主可用性

> 调查日期：2026-09-21
> 结论性质：**基于源码与实机文件系统的静态验证**（未实际启动宿主装载插件；该步需用户批准后另做）
> 重要性：本结论决定 **D4（后端路线）** 与 **B2/B4/B5 三条业务线的技术路线是否成立**

---

## 一、结论速览

| 宿主 | 版本 | 服务端插件机制 | Host Bridge 补丁层 | 综合可用性 |
| --- | --- | --- | --- | --- |
| **SillyTavern** | 1.18.0 | ✅ 有 | ✅ 版本命中 `["1.18.0"]` | **✅ 完整可用（官方支持路径）** |
| **Luker** | 2.7.0 | ✅ 有（与 ST 逐字节同形） | ❌ 版本门禁拒绝 + 补丁面不匹配 | **✅ 核心可用 / ⚠️ 桥接层不可用** |
| **PureTavern** | 0.1.12 | ❌ 无 | ❌ 无补丁目标文件 | **❌ 不可用** |
| **TauriTavern** | 2.2.0 | ❌ 无 | ❌ 无补丁目标文件 | **❌ 不可用** |

**一句话**：Authority 的**能力内核（SQL/KV/Blob/fs/http/jobs/events/permissions）与宿主解耦**，可在 Luker 上运行；其**Host Bridge 补丁层只认 SillyTavern 1.18.0 的源码文本**，在 Luker 上会被版本门禁挡下，但**失败被降级为 `console.warn`，不阻断插件加载**。PureTavern / TauriTavern 连服务端插件基建都不具备，**彻底不支持**。

---

## 二、验证证据链

### 2.1 服务端插件加载契约：Luker ≡ SillyTavern（逐字节同形）

| 证据点 | SillyTavern 1.18.0 | Luker 2.7.0 |
| --- | --- | --- |
| 导出函数 | `src/plugin-loader.js:40` `export async function loadPlugins(app, pluginsPath)` | `src/plugin-loader.js:596` 同签名 |
| 开关配置 | `enableServerPlugins` | 同（`src/plugin-loader.js:12`） |
| 插件 ID 校验 | `:167` `return /^[a-z0-9_-]+$/.test(id);` | `:723` **正则逐字符相同** |
| 重复 ID 拒绝 | `:208` `plugin ID '${id}' is already in use` | `:764` 相同 |
| 路由注册 | `:213-222` `const router = express.Router(); await init(router); if (router.stack.length > 0) app.use('/api/plugins/${id}', router);` | `:769-778` **同形同序** |
| 退出钩子 | `plugin.exit \|\| plugin.default?.exit` | 相同 |

**判定**：Authority 的 `runtime/index.cjs` 导出 `info = { id: 'authority', ... }`（`packages/server-plugin/src/index.ts:15-19`，`AUTHORITY_PLUGIN_ID = 'authority'`，见 `constants.ts:3`）与 `init(router)`（同文件 `:23`），**完全满足 Luker 的装载契约**：
- `'authority'` 通过 `/^[a-z0-9_-]+$/` ✅
- `init(router)` 注册路由 → `router.stack.length > 0` → 挂载到 `/api/plugins/authority` ✅

### 2.2 Host Bridge 版本门禁：只作用于桥接层，且失败仅告警

**门禁位置**（仅一处生效路径）：
```
packages/server-plugin/src/services/host-bridge-service.ts:236-252  resolveContext()
  :239  manifest.host !== 'sillytavern'            → throw
  :249  !supportedPackageVersions.includes(hostPackageVersion) → throw
```
`host-bridge/manifest.json`（与 `managed/host-bridge/manifest.json` 同内容）：
```json
{ "host": "sillytavern", "supportedPackageVersions": ["1.18.0"], "patchModule": "patch.cjs", "bridgeVersion": "1.1.1" }
```
→ 在 Luker（2.7.0）上，`resolveContext()` **必然抛错**。

**但该抛错被调用方吞掉**：
```
packages/server-plugin/src/index.ts:23-32
  export async function init(router: any): Promise<void> {
      runtime ??= createAuthorityRuntime();
      registerRoutes(router, runtime);
      await runtime.install.bootstrap();
      const hostBridgeStatus = await runtime.hostBridge.bootstrap();
      if (hostBridgeStatus.requiresRestart) { console.warn(...); }
      else if (hostBridgeStatus.status === 'conflict' || 'error') { console.warn(...); }   // ← 仅告警
```
**判定**：Host Bridge 不可用 ⇒ 插件照常加载，只在启动日志留一条 warning。这正是用户全局规则 §4.6 要求的「特性检测 + 静默降级」，**Authority 原生具备**。

### 2.3 宿主根目录解析：按结构判定，Luker 通过

```
packages/server-plugin/src/services/install-service.ts:731-734
  function isSillyTavernRoot(candidate: string): boolean {
      return fs.existsSync(path.join(candidate, 'plugins'))
          && fs.existsSync(path.join(candidate, 'public', 'scripts', 'extensions'));
  }
```
（`module-discovery-service.ts:976` 有同源副本）

实机判定（基于目录存在性）：

| 宿主 | `plugins/` | `public/scripts/extensions/` | `isSillyTavernRoot` |
| --- | --- | --- | --- |
| Dev Luker | ✅ | ✅ | **true** |
| Dev SillyTavern | ✅ | ✅ | true |
| Dev PureTavern | ❌ | ❌ | **false** |
| Dev TauriTavern | ❌ | ❌ | **false** |

→ Luker 的 ST 根可被正确解析；`ensureDefaultAgentWorkspace()` 不会落入 `'SillyTavern root could not be resolved'` 分支（`index.ts:33-38`）。

### 2.4 Host Bridge 补丁面在 Luker 上的适配余量

`manifest.json` 的 `syntaxCheckTargets` 列出补丁改写的宿主文件；`patch.cjs` 的 `targetFiles` 为其真子集。逐文件核对：

| 补丁目标文件 | ST 1.18.0 | Luker 2.7.0 |
| --- | --- | --- |
| `public/lib/eventemitter.js` | ✅ | ✅ |
| `public/scripts/extensions.js` | ✅ | ✅ |
| `public/scripts/events.js` | ✅ | ✅ |
| `public/script.js` | ✅ | ✅ |
| `public/scripts/group-chats.js` | ✅ | ✅ |
| `src/endpoints/chats.js` | ✅ | ✅ |

**判定**：六个目标文件在 Luker 中**全部存在**（Luker 是 ST 的 fork，保留了同构文件布局）→ **理论上可为 Luker 另写一套 manifest + patch**。但**当前 patch.cjs 是按 ST 1.18.0 的源码文本打的**，Luker 2.7.0 源码已分叉，直接绕过门禁强行安装会撞上补丁不匹配（`conflict`）或产出语法错误（`syntaxCheckTargets` 即为此设的护栏）。

### 2.5 PureTavern / TauriTavern：无服务端插件基建

检索 `enableServerPlugins|loadPlugins|/api/plugins/`（排除 `node_modules`）在两宿主全仓的命中：

| 宿主 | 命中文件 | 性质 |
| --- | --- | --- |
| PureTavern 0.1.12 | `apps/web/.generated/public/scripts/{scrapers,utils}.js`、`apps/web/legacy/upstream/public/scripts/extensions/tts/edge.js` | **上游 ST 客户端脚本残留**，非服务端插件基建 |
| TauriTavern 2.2.0 | `src/scripts/{scrapers,utils}.js`、`src/scripts/extensions/tts/edge.js` | 同上 |

两宿主均为 pnpm monorepo（PT：`apps/{desktop,harmony,mobile,remote-server,vscode-extension,web}` + `packages/{contracts,shared}`；TT：根级 `src/` + `src-tauri` 类结构），**无 `src/plugin-loader.js`，无 `/api/plugins/` 路由约定，无 `plugins/` 目录**。

**判定**：**纯前端扩展是这两宿主上唯一的接入形态**。任何依赖 Authority 服务端后端的能力，在这两宿主上必须走设计稿所要求的「不可用即纯前端路径」降级分支。

---

## 三、对 D4 与业务线的直接推论

### 3.1 D4（Authority 后端路线）的可行域

| 宿主 | 可用能力 | 建议路线 |
| --- | --- | --- |
| SillyTavern | 全套 + Host Bridge（聊天修订/事务语义） | 直接依赖 Authority |
| **Luker** | **全套后端能力**（存储/FS/SQL/HTTP/任务/事件/权限/模块互调），**无 Host Bridge** | **直接依赖 Authority**（避开 Host Bridge 依赖即可） |
| PureTavern | 无 | 纯前端降级 |
| TauriTavern | 无 | 纯前端降级 |

**结论**：用户「用 Authority 增强」的主线在 **Luker 上成立**（这是主战场），在 ST 上完整成立，在 PT/TT 上必须降级。**B2/B4/B5 三条业务线不需要改路线**，但设计文档必须显式写明"不得依赖 Host Bridge"。

### 3.2 必须新增的约束（写入统一规则与 skill）

1. **禁止依赖 Host Bridge**：统一规则须列明 Authority 的「可移植子集」（server plugin + SDK + 各 namespace）与「不可移植子集」（Host Bridge 提供的聊天修订/事务语义），跨宿主插件只允许用前者。
2. **PT/TT 必须有纯前端路径**：任何 Authority 接入都必须包在特性检测里，不可用时不报错、不阻塞（用户全局规则 §4.6）。
3. **Luker 需自建 Host Bridge 才可获得事务语义**：若将来确需在 Luker 上使用聊天修订/乐观锁语义，须独立立项为 Luker 编写 `manifest.json` + `patch.cjs`，跟随 Luker 版本维护——**成本与持续性风险高，建议默认不做**。

---

## 四、残留不确定性（未验证项，须如实标注）

| 项 | 状态 | 补齐方式 |
| --- | --- | --- |
| Authority 是否在 Luker 上**实际启动并注册路由** | **未实测** | 需在 `Instance/Dev/Luker` 开启 `enableServerPlugins` 并装入插件；**涉及改实例配置，须用户批准** |
| Luker 的 `enableServerPlugins` 当前值 | `default/config.yaml:435` 为 `false`（默认模板值） | 需读实例实际 `config.yaml`（**本次未读，属只读操作，可补**） |
| Authority 服务端是否调用了 Luker 不存在的 ST 内部 API | **未穷尽检索** | 建议对 `packages/server-plugin/src` 全量比对 Luker 的 `src/` 导出面 |
| PureTavern / TauriTavern 是否有**非 ST 同源**的插件机制 | **未穷尽检索**（仅按 ST 惯例关键词检索） | 建议读 PT/TT 官方扩展开发文档确认 |

> **注**：本次验证全部为只读操作，**未修改 `Instance/` 下任何内容**（AC-7 红线遵守）。

---

## 五、证据来源

| 文件 | 用途 |
| --- | --- |
| `D:/Repo/Tavern-repo/Instance/Dev/{Luker,SillyTavern}/src/plugin-loader.js` | 装载契约比对 |
| `D:/Repo/Tavern-repo/Instance/Dev/{Luker,SillyTavern,PureTavern,TauriTavern}` 目录结构 | 宿主根判定、插件基建有无 |
| `D:/Repo/Tavern-repo/Myfork/ST-Delegation-of-authority/host-bridge/manifest.json` | 版本门禁与补丁面 |
| `.../packages/server-plugin/src/index.ts` | 插件入口与降级行为 |
| `.../packages/server-plugin/src/services/host-bridge-service.ts` | 门禁实现 |
| `.../packages/server-plugin/src/services/install-service.ts` | 宿主根解析 |
| `.../packages/server-plugin/src/constants.ts` | 插件 ID |
| `.../research/04-plugin-authority.md` | Authority 能力契约（上游仅官方支持 ST） |
