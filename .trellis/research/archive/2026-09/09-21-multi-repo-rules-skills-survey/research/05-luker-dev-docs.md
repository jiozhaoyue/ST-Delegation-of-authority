# Luker 开发文档调研

抓取时间：2026-09-21
站点：https://luker.cups.moe
站点生成器：VitePress v1.6.4（页面 URL 带 `.html` 后缀，**不带后缀会 404**）
GitHub 仓库：https://github.com/funnycups/Luker
站点定位：SillyTavern 的深度重写分支（"A deep rebuild of SillyTavern"），主打 knowledge-graph memory、multi-agent orchestration、AI-assisted character creation、incremental sync、preset decoupling。

## 抓取方法与可达性

| 尝试 | 结果 |
| --- | --- |
| `https://luker.cups.moe/sitemap.xml` | **404**，无 sitemap |
| `https://luker.cups.moe/zh-CN/development` | **404**（无 `.html` 后缀） |
| `https://luker.cups.moe/development/frontend-plugin.html` | 200 ✅ |
| `https://luker.cups.moe/zh-CN/development/frontend-plugin.html` | 200 ✅ |
| 站点首页 `__VP_HASH_MAP__` 内嵌 JSON | ✅ 一次性拿到全部 276 个页面 key（3 语言 × 92 页） |

有效方法：抓首页 HTML → 正则提取 `window.__VP_HASH_MAP__=JSON.parse("...")` → 得到全部页面清单。这比逐页爬 sidebar 高效得多。

**页面清单结论**：`development` 目录下共 **22 个页面**，三种语言（英文根路径 / `zh-CN/` / `zh-TW/`）各 22 页，内容一一对应。本次抓取 **全部 22 个英文页**（正文抽取为纯文本，共 343 KB）。

## 站点结构与页面清单

英文路径前缀为 `https://luker.cups.moe/development/`，下表 `路径` 列省略前缀；中文版把 `/development/` 换成 `/zh-CN/development/`（或 `zh-TW`）。

### Development 章节（本次调研目标，22 页）

| 路径 | 标题 | 内容类型 |
| --- | --- | --- |
| `frontend-plugin.html` | Frontend Plugin Development | 教程：插件文件结构 / manifest / 事件系统 / 调试 |
| `server-plugin.html` | Server Plugin Development | 教程：Node.js 服务端插件 / Express Router / 安全 |
| `contributing.html` | Contributing Guide | 流程：分支策略 / Conventional Commits / 代码风格 |
| `card-developers.html` | Character Card Developer Guide | 教程：卡扩展字段 / CardApp / Memory Graph schema |
| `extension-api/index.html` | Extension API Reference | 索引：API 总览 / 命名空间 / 与 ST 的差异对照表 |
| `extension-api/chat-and-state.html` | Chat & State | API 参考：Messages API / Chat State / Floor State / 角色状态 |
| `extension-api/characters.html` | Characters | API 参考：角色卡读写 / Proxy 语义 / 标签 / 导入导出 |
| `extension-api/world-info.html` | World Info | API 参考：lorebook CRUD / 激活扫描 / 角色辅助世界书 |
| `extension-api/presets-and-prompts.html` | Presets & Prompts | API 参考：presets.* / prompt 组装 / 信封检查 / reasoning |
| `extension-api/generation.html` | Generation | API 参考：generateTask / 工具注册 / 服务类 / 连接配置 |
| `extension-api/slash-commands.html` | Slash Commands | API 参考：注册与执行斜杠命令 / 参数类型 / 枚举 |
| `extension-api/macros-and-variables.html` | Macros & Variables | API 参考：宏注册 / 内置宏表 / 局部与全局变量 |
| `extension-api/skills.html` | Skills | API 参考：`context.skills.*` 技能包读写/安装/打包 |
| `extension-api/ui-and-popups.html` | UI & Popups | API 参考：Popup / loader / 模板 / 消息格式化 |
| `extension-api/iteration-studio.html` | Iteration Studio Framework | API 参考：AI 迭代编辑弹窗框架 / adapter 契约 |
| `extension-api/edits-lib.html` | Edits Library | API 参考：op 化结构化编辑 / 漂移检测 / 冲突 UI |
| `extension-api/plugin-integration.html` | Plugin Integration | API 参考：regex / searchTools / 扩展间通信 / i18n / 工具函数 |
| `extension-api/low-level-endpoints.html` | Low-Level Endpoint Reference | API 参考：原始 HTTP 路由（仅调试） |
| `extension-api/message-takeover.html` | Message Takeover | API 参考：插件直接产出 assistant 消息 |
| `extension-api/memory-graph.html` | Memory Graph Extension API | API 参考：记忆图谱 read/write API / 查询 / 订阅 |
| `extension-api/orchestrator-tools.html` | Orchestrator Tools API | API 参考：为编排器注册工具 |
| `extension-api/character-editor-assistant.html` | Character Editor Assistant Extension API | API 参考：CEA 助手工具跨插件复用 |

### 站点其他相关章节（未逐页抓取，仅从 sidebar 与哈希表确认存在）

| 路径前缀 | 标题 | 与开发的相关性 |
| --- | --- | --- |
| `/features/orchestrator/*` | Overview / Spec / Single / Agenda / Loop / Director / Presets / Iteration Studio / Skills / Notes / Custom Tools | 高——编排器是 Luker 核心差异化能力 |
| `/features/skills/{index,authoring,management,orchestrator-integration}.html` | Skills 概念/创作/管理/集成 | 高——skill 作者向文档 |
| `/features/card-editor/{index,popup,studio,walkthrough/*}.html` | CardApp Studio / 卡片编辑器 | 高——CardApp 开发主环境 |
| `/features/cardapp.html` | CardApp | 高——卡内嵌应用 |
| `/features/state-system.html` | State System | 中——状态机制概念 |
| `/features/hook-order.html` | Hook Order | 中——事件监听顺序 |
| `/features/regex-provider.html` | Plugin-Registered Regex | 中——插件注册 regex |
| `/features/variable-op-log.html` | Per-Message Variables | 中——floor 变量回滚 |
| `/features/memory-graph.html` | Memory Graph | 中 |
| `/features/search-tools.html` | Search Tools | 中 |
| `/features/storage-inspector.html` | Storage Inspector | 低-中（调试） |
| `/features/logging.html` | Logging | 低-中（调试） |
| `/improvements/*`（14 页） | Incremental Sync / Preset Decoupling / Function Call Runtime / Backend Storage / Request Inspector / Unified Generation Layer / Performance / LAN Sync / WS Proxy / Auth & Quota 等 | 中——架构差异说明，理解 Luker 为何不同于 ST |
| `/guide/*`（8 页） | Quick Start / Configuration / Authentication / Migration / Android | 低（用户向），但 Configuration 对插件开发有参考 |
| `/basics/*`（6 页） | Character Cards / World Info / Presets / Macros / Connections | 低（用户向） |
| `/recipes/*`（3 页） | agent-onboarding / card-customization-walkthrough / rp-skills-walkthrough | 中——实操示例 |
| `/changelog.html` | Changelog | 低-中（版本演进） |

---

## 逐页要点

### Frontend Plugin Development — https://luker.cups.moe/development/frontend-plugin.html

**核心内容摘要**

- 术语：Luker 中 "plugin" 与 "extension" 同义。内置扩展在 `public/scripts/extensions/`，第三方插件装在 `public/scripts/extensions/third-party/`。
- 插件文件结构（`third-party/my-plugin/`）：`manifest.json`（必需）、`index.js`（必需）、`style.css`（可选）、`settings.html`（可选）、`assets/`（可选）。
- `manifest.json` 字段：`display_name`、`loading_order`（数字小者先加载）、`requires`（依赖扩展数组）、`optional`、`js`、`css`、`author`、`version`、`homePage`、`auto_update`（布尔）。
- `index.js` 用 **ES Module 动态 import** 加载，入口须用 `import/export`。最小骨架：

```js
import { extension_settings, getContext } from '../../../extensions.js';
import { eventSource, event_types } from '../../../../script.js';
const EXTENSION_NAME = 'my-plugin';
jQuery(async () => {
  loadSettings();
  const settingsHtml = await $.get(`${extensionFolderPath}/settings.html`);
  $('#extensions_settings').append(settingsHtml);
  eventSource.on(event_types.CHAT_CHANGED, onChatChanged);
});
```

- CSS 建议用插件名前缀避免冲突；主题色变量 `var(--SmartThemeBodyColor)`。
- `settings.html` 用 `data-extension-name` 属性标识归属插件，配 `.inline-drawer` / `.inline-drawer-toggle` / `.inline-drawer-icon fa-solid fa-chevron-down` 结构。
- **全局入口**：`Luker.getContext()` 为推荐；`SillyTavern.getContext()` / `st.getContext()` 仅为迁移期兼容别名。
- context 主要类别：Chat Data、Messages（`addMessages()` / `updateMessages()` / `deleteMessages()` / `getMessage()` / `getMessageCount()`）、Chat Persistence（`saveChatMetadata()`；低层 `appendChatMessages()` / `patchChatMessages()` 已废弃）、Chat State、Presets（`context.presets.list()` / `resolve()`）、Prompt / World Info Assembly（`buildPresetAwarePromptMessages()` / `simulateWorldInfoActivation()`）、Event System、Character State、Inter-Extension Communication（`registerExtensionApi()`）。
- **事件系统**（插件开发核心机制）：

```js
const context = Luker.getContext();
context.eventSource.on(context.eventTypes.CHAT_CHANGED, (chatId) => {...});
context.eventSource.on(context.eventTypes.MESSAGE_RECEIVED, handler, { priority: 10 });
context.eventSource.makeFirst(context.eventTypes.CHAT_CHANGED, handler);
context.eventSource.makeLast(context.eventTypes.CHAT_CHANGED, handler);
```

- **监听器执行顺序**（串行，每个 listener 都被 await）：
  1. 显式插件排序（`pluginOrder`）——通过 `eventSource.setOrderConfig()` 或内置 Hook Order 扩展配置
  2. 监听器 `priority`——数字大者先执行
  3. 注册顺序——先注册先执行
- 聊天生命周期事件：`CHAT_CHANGED`(chatId)、`CHAT_CREATED`(chatId)、`GROUP_CHAT_CREATED`(chatId)、`CHAT_BRANCH_CREATED`(payload)。
- 消息事件：`USER_MESSAGE_RENDERED`、`CHARACTER_MESSAGE_RENDERED`、`MESSAGE_SENT`、`MESSAGE_RECEIVED`(messageId, type?)、`MESSAGE_EDITED`、`MESSAGE_UPDATED`、`MESSAGE_DELETED`(chatLength, meta?)、`MESSAGE_SWIPED`、`MESSAGE_SWIPE_DELETED`({messageId, swipeId, newSwipeId})。
- `MESSAGE_RECEIVED` 第二参数 `type` 表示来源：标准生成模式 `swipe` / `continue` / `append` / `appendfinal` 等。
- 生成钩子：`GENERATION_STARTED`、`GENERATION_CONTEXT_READY`、`GENERATION_BEFORE_WORLD_INFO_SCAN`、`GENERATION_BEFORE_API_REQUEST`、`GENERATION_ENDED`、`GENERATION_STOPPED`、`WORLD_INFO_ACTIVATED`。
- 应用级：`APP_READY`、`SETTINGS_LOADED_AFTER`、`EXTENSIONS_FIRST_LOAD`。
- 图像生成：`IMAGE_GENERATION_STARTED` / `IMAGE_GENERATION_ENDED`。

**可提炼为 skill 的知识点**：插件脚手架生成（manifest + index.js + settings.html 三件套模板）、事件名与回调签名速查表、监听顺序三原则（pluginOrder > priority > 注册顺序）、`Luker.getContext()` 优先于 ST 别名。

---

### Extension API Reference（索引） — https://luker.cups.moe/development/extension-api/index.html

**核心内容摘要**

- 命名空间速查表（定位 API 归属用）：

| 命名空间 | 内容 |
| --- | --- |
| `context.presets` | list, getSelected, getLive, getStored, save, resolve, readExtensions, writeExtensions, state.* |
| `context.connectionProfiles` | list, resolve（直接使用已废弃） |
| `context.variables.local` / `.global` | get, set, add, inc, dec, del, has |
| `context.swipe` | left, right, to, show, hide, refresh, isAllowed, state |
| `context.symbols` | ignore（IGNORE_SYMBOL 哨兵） |
| `context.constants` | unset, promptRoles, promptTypes, wiAnchor, wiPosition |
| `context.macros` | register, registerAlias, registry, engine, category, envBuilder |
| `context.loader` | show, hide, active, get, isBlocking, ToastMode, Handle |
| `context.skills` | list, get, readFile, listFiles, search, writeFile, editFile, deleteFile, install, delete, rename, moveScope, importBundled, listBundledManifest, packForEmbed, previewExtractEmbed, executeExtractEmbed, importFromUrl |
| `context.worldInfoEntry` | template, create, delete, setButtonClass, setGlobalSelection, getSorted |
| `context.chatWorldInfo` | getNames, setSelection, globalSelection |
| `context.openai` | proxies, ZAI_ENDPOINT, stripPresetConnectionFields |
| `context.textCompletion` | types |
| `context.secrets` | KEYS, state |
| `context.lib` | DOMPurify, lodash, DiffMatchPatch, showdown, yaml |

- **Luker vs SillyTavern 的 API 级差异对照表**（写 skill 时最关键的一张表）：

| 领域 | SillyTavern | Luker |
| --- | --- | --- |
| 聊天持久化 | 整文件覆写 | Patch-first（RFC 6902 增量更新） |
| 聊天绑定状态 | 仅 `chat_metadata` | 新增 Chat State 机制 + Floor State |
| 角色级状态 | 无 | `getCharacterState` / `setCharacterState`（独立于卡片 JSON） |
| 预设管理 | 直接 import 内部模块 | 统一 `context.presets.*` API |
| Prompt 组装 | 需手工拼接 | `buildPresetAwarePromptMessages()` |
| World Info 模拟 | 无 | `simulateWorldInfoActivation()` |
| 角色辅助世界书 | 无 | `getCharaAuxWorlds()` |
| 生成钩子 | 基础事件 | 新增细粒度钩子 `GENERATION_CONTEXT_READY`、`GENERATION_BEFORE_WORLD_INFO_SCAN` 等 |
| 事件顺序 | 注册顺序 | 支持 priority、pluginOrder、makeFirst/makeLast |
| Regex 运行时 | 无插件 API | `registerManagedRegexProvider()` |
| 搜索工具 | 无插件 API | `Luker.searchTools` 全局 API |
| 函数调用 | 基础 ToolManager | 纯文本模式 + 连接级开关 + `sendOpenAIRequest` preset override |
| 连接配置 | 单一全局配置 | `context.presets.resolve()` 支持按预设解析连接 |
| 宏引擎 | 字符串替换 | 结构化 `macros.register()`（带 handler context / args / categories） |
| 角色对象 | 纯 V1/V2 字段 | Proxy + V2 规范化 + legacy 写弃用警告 |

- **重要约束**：优先用 `Luker.getContext()` 的 API，而非直接调底层 HTTP 端点——Context API 封装了 patch-first 语义、冲突处理与重试逻辑。

**可提炼为 skill 的知识点**：ST → Luker 迁移对照表（写"从 ST 扩展迁移到 Luker"skill 的骨架）、命名空间速查。

---

### Server Plugin Development — https://luker.cups.moe/development/server-plugin.html

**核心内容摘要**

- 服务端插件是跑在 Luker 服务进程内的 Node.js 模块，能访问文件系统、调原生 Node 模块、代理外部 API——前端扩展做不到这些。
- **无沙箱隔离**，与 Luker 服务共享同一进程；路由自动挂载在 `/api/plugins/{plugin-id}/`。
- 前后端分工表：

| 场景 | 前端插件 | 服务端插件 |
| --- | --- | --- |
| 改 UI、加设置面板 | ✅ | ❌ |
| 监听聊天事件、拦截生成 | ✅ | ❌ |
| 读写服务端文件系统 | ❌ | ✅ |
| 代理外部 API（隐藏 key） | ❌ | ✅ |
| 用原生 Node 模块 | ❌ | ✅ |
| 安全存储凭据 | ❌ | ✅ |
| 跑 WebSocket 服务 | ❌ | ✅ |
| 跑长时后台任务 | ❌ | ✅ |

- **启用**：`config.yaml` 中 `enableServerPlugins: true`，重启生效。控制台日志：`[Plugin Loader] Loaded plugin: My Plugin (my-plugin)`。
- **文件结构**（`plugins/` 目录，项目根）：
  - 单文件：`my-plugin.js`（CJS）或 `my-plugin.mjs`（ESM）
  - 目录：`my-plugin/{package.json, index.js, index.cjs, index.mjs}`
  - **入口解析优先级**：`package.json` 的 `main` → `index.js` → `index.cjs` → `index.mjs`
- **模块接口**（必需）：

```ts
interface PluginInfo { id: string; name: string; description: string; }
interface Plugin {
  init: (router: Router) => Promise<void>;
  exit: () => Promise<void>;   // 可选
  info: PluginInfo;
}
```

- CJS 形态：`module.exports = { init, exit, info };`
- ESM 形态：`export const info = {...}; export async function init(router) {...}`
- **陷阱**：若 Luker 根 `package.json` 有 `"type": "module"`，CJS 插件必须在自己的插件目录放一个 `package.json` 并设 `"type": "commonjs"`，否则 `.js` 会被当 ESM。
- **路由注册必须同步**：路由要在 `init` 的第一次 `await` **之前**注册完。插件加载器只在 `router.stack.length > 0` 时把 router 挂到 app 上。

```js
// ✅ 正确：await 前注册
export async function init(router) {
  router.get('/status', (req, res) => {...});
  const data = await loadData();   // 异步在注册之后
}
// ❌ 错误：await 后才注册，可能挂不上
```

- **中间件**：可用 `router.use(express.json({ limit: '1mb' }))`、自定义日志中间件。服务端插件路由**自动继承 Luker 的认证中间件**（Basic Auth、CSRF、requireLogin 等），插件内不用自己实现认证。
- **插件 ID 规则**：只允许小写字母、数字、连字符、下划线；正则 `/^[a-z0-9_-]+$/`；必须唯一，重名时后加载者被跳过并打 warning。反例：`MyPlugin`（大写）、`my.plugin`（点）、`my plugin`（空格）。
- **安全**：
  - 无沙箱：插件可访问整个文件系统、调 `child_process`、改 Luker 运行时状态、访问其他插件数据 → 只装可信插件。
  - 路径穿越防护：加载器阻止用 `../../` 逃出 `plugins/`，但**插件自己的路由若把用户输入当文件路径，必须自行校验**（`path.resolve` + `startsWith(SAFE_DIR + path.sep)`）。
  - 凭据存储：API key 放服务端配置文件（`config.json`，加 `.gitignore`，提供 `config.json.example`），绝不返回给前端。
- **前后端通信**：前端 `fetch('/api/plugins/my-plugin/process', {...})`；错误约定 `res.status(500).json({ error: '...' })`，前端用 `response.ok` / `response.status` 判断。
- **安装与更新**：手动放入 `plugins/` 后重启；Git 自动更新用 `simple-git`（不可用时回退 `isomorphic-git`）跑 `git pull`；依赖在插件目录 `npm install`，也可复用 Luker 根 `node_modules`。
- **完整示例**：Hello World（`index.mjs` 单文件 + `/hello` 端点）、LLM API Proxy（`index.js` + `config.json.example` + `package.json`，含 `/status`、`/config`、`/chat` 三个路由，用 `AbortSignal.timeout(120_000)`、`Bearer` 鉴权、502/504/503 错误分类）。

**可提炼为 skill 的知识点**：服务端插件脚手架（CJS/ESM 双形态 + package.json 陷阱）、"路由必须同步注册"这条硬约束、凭据安全模板（config.json.example + gitignore）、路径穿越校验代码片段。

---

### Contributing Guide — https://luker.cups.moe/development/contributing.html

**核心内容摘要**

- 环境搭建：Fork → `git clone https://github.com/<your-username>/Luker.git` → `npm install` → `node server.js`（默认 `http://localhost:8000`，可用命令行参数或 `config.yaml` 改端口）。
- **分支策略**：`release` 是稳定分支（**所有 PR 都指向 release**），从 `release` 开 feature 分支。
- 分支命名前缀：`feat/`、`fix/`、`docs/`、`refactor/`、`chore/`。
- **提交规范**：Conventional Commits，格式 `<type>(<scope>): <description>`，type 取 `feat` / `fix` / `docs` / `style` / `refactor` / `perf` / `test` / `chore`。
  - 例：`feat(memory-graph): add hierarchical compression for event nodes`
- PR 流程：push → 开 PR 指向 `release` → 描述改动/动机/影响并引用 Issue → 代码审查 → 合并。
- **代码风格**：缩进 4 空格；JS 用单引号；必须有分号；**行尾 LF（禁用 CRLF）**；文件末尾保留一个换行。Windows 用户需 `git config core.autocrlf input` 或 `.gitattributes` 里 `* text=auto eol=lf`。
- 命名约定：变量/函数 camelCase（`loadSettings()`）；常量 UPPER_SNAKE_CASE（`DEFAULT_TIMEOUT`）；CSS 类 kebab-case（`chat-message-container`）；文件名 kebab-case（`preset-manager.js`）。
- 模块系统：前端与后端**都用 ES Modules**（import/export）。
- 注释：关键逻辑与公开 API 用 JSDoc；复杂算法写内联注释说明意图；避免无意义注释。
- 项目结构：

```
Luker/
├── server.js                 # 服务端入口
├── src/                      # 后端源码
│   ├── endpoints/            # API 路由
│   └── middleware/           # 中间件
├── public/                   # 前端资源
│   ├── scripts/
│   │   ├── extensions/       # 内置扩展
│   │   │   └── third-party/  # 第三方插件
│   │   └── ...
│   └── ...
├── docs/                     # 文档（英文在根）
│   ├── zh-CN/                # 简体中文
│   └── zh-TW/                # 繁体中文
└── config.yaml               # 服务端配置
```

- 文档贡献：英文放 `docs/` 根，中文放 `docs/zh-CN/`、`docs/zh-TW/`；术语准确；**代码与 API 名保持英文**；交叉引用英文用无前缀路径（如 `/development/contributing`），中文版加 `/zh-CN/` 或 `/zh-TW/` 前缀。

**可提炼为 skill 的知识点**：Luker 贡献流程 skill（分支/提交/风格三件套 + LF 硬约束）、文档三语目录约定。

---

### Character Card Developer Guide — https://luker.cups.moe/development/card-developers.html

**核心内容摘要**

- 保持与 SillyTavern 卡片格式完全兼容；扩展数据放 `data.extensions` 下的多个命名空间，ST 会忽略不认识的字段。
- 扩展字段结构：

```json
{
  "data": {
    "extensions": {
      "luker": { "memoryGraphSchema": { "nodeTypes": [{ "name": "string", "label": "string", "color": "#hex" }] } },
      "card_app": { "enabled": true, "entry": "index.js" }
    }
  }
}
```

| 字段路径 | 类型 | 说明 |
| --- | --- | --- |
| `luker.memoryGraphSchema` | object | Memory Graph 自定义节点类型 schema |
| `luker.memoryGraphSchema.nodeTypes[].name` | string | 节点类型标识（英文，内部引用用） |
| `luker.memoryGraphSchema.nodeTypes[].label` | string | 显示名 |
| `luker.memoryGraphSchema.nodeTypes[].color` | string | 十六进制颜色 |
| `card_app.enabled` | boolean | 是否启用 CardApp |
| `card_app.entry` | string | CardApp 目录内入口模块文件名，默认 `index.js`；入口必须导出 `init(ctx)`；CSS 按约定从同目录 `style.css` 自动加载 |

- **绑定预设与人设存放在角色卡的状态文件里，不在 `data.extensions` 中**——避免修改卡片自身 JSON。通过卡片编辑器助手的 "Bind Preset" 面板配置。
- Memory Graph 自定义 schema 会**覆盖**默认节点类型集。示例（奇幻卡）：`character` `#4A90D9`、`location` `#7ED321`、`quest` `#F5A623`、`magic` `#BD10E0`、`faction` `#D0021B`。
- **CardApp**：卡内嵌 JS 应用。用途：状态追踪（好感度/体力/背包）、交互元素（骰子/卡牌/小游戏）、可视化（关系图/时间线/地图）、自定义 UI。
- CardApp 运行时通过 `/api/card-app/<charId>/<entry>` 以 ES module 加载 `index.js`，并自动加载同目录 `style.css`（存在时）。**Studio 是推荐的编写/保存/版本管理方式**。
- 入口函数：`export async function init(ctx) {...}`。
- **CardApp ctx API 全表**：
  - 消息与生成：`ctx.container`、`ctx.charId`、`ctx.sendMessage(text, options?)`（内部调 `sendTextareaMessage`）、`ctx.stopGeneration()`、`ctx.continueGeneration()`、`ctx.getHistory(limit?, offset?)`、`ctx.editMessage(messageId, newText)`、`ctx.deleteMessage(messageId)`、`ctx.deleteLastMessage()`、`ctx.swipe()`、`ctx.regenerate()`（调 `Generate('regenerate')`）
  - 数据与状态：`ctx.getCharacterData()`、`ctx.updateCharacterFields(fields)`（支持 name/description/personality/scenario/first_mes/mes_example/system_prompt/post_history_instructions/creator_notes/creator/character_version/tags/talkativeness/depth_prompt 相关字段）、`ctx.getChatState(namespace, options?)`（**async**，服务端 `/api/chats/state/`）、`ctx.updateChatState(namespace, updater, options?)`（reducer 式，返回 `{ok, state, updated}`）、`ctx.patchChatState(namespace, operations, options?)`、`ctx.deleteChatState(namespace, options?)`、`ctx.getCharacterState(namespace)`（async，avatar 自动解析，跨该角色的所有聊天存活）、`ctx.setCharacterState(namespace, data)`（传 null 删除）、`ctx.getVariable(key)`（读 `chat_metadata.variables`，同 `{{getvar::key}}`）、`ctx.setVariable(key, value, options?)`（默认写 chat 作用域；传 `{ floor: <messageIndex> }` 通过 variable op-log 绑定到该 floor 当前 swipe，swipe-out/swipe-back/删除/分支都会经 rebuilder 协调回滚；floor 路径把 value 强制转字符串）
  - 聊天管理：`ctx.getChatList()`、`ctx.switchChat(chatName)`、`ctx.newChat()`、`ctx.closeChat()`
  - World Info：`ctx.getWorldBooks()`（传 `{ withSource: true }` 得带 `source: 'character' | 'character_aux' | 'chat' | 'global'` 标签的条目）、`ctx.getCharacterAuxWorldBooks()`、`ctx.getWorldBookEntries(bookName)`、`ctx.createWorldBookEntry(bookName, fields?)`、`ctx.updateWorldBookEntry(bookName, uid, patch)`（浅合并）、`ctx.deleteWorldBookEntry(bookName, uid)`
  - 事件与生命周期：`ctx.eventSource`（`on` / `off`；事件名在 `ctx.lukerContext.eventTypes`）、`ctx.addEventListener(target, event, handler, options?)`（DOM 事件，dispose 时自动移除）、`ctx.setInterval(fn, ms)` / `ctx.setTimeout(fn, ms)`（dispose 自动清理）、`ctx.onDispose(fn)`
  - **配对规则**：每个 `.on()` 都要配 `ctx.onDispose(() => ctx.eventSource.off(...))`，避免 CardApp 卸载后监听器残留。
- **安全准则**：✅ 在 `ctx.container` 内操作 DOM、✅ 通过 ctx API 读写聊天状态、✅ 通过 ctx 发消息与控制生成；❌ 避免直接操作容器外 DOM、❌ 避免直接发网络请求、❌ 避免直接访问其他扩展的数据。
- **CardApp Studio**：基于 CodeMirror 6 的代码编辑器 + 实时预览 + AI 辅助 + Git 版本历史。推荐用 Studio 而非手改 JSON。
- **World Info 最佳实践**：按主题分组条目；把 World Info 绑定到预设（切预设自动激活）；搜索工具可把搜索结果写进 World Info 条目；控制注入深度与顺序（`lorebookDepth`、`lorebookRole`、`lorebookEntryOrder`）；与 Memory Graph 互补（WI 管不变的世界设定，Memory Graph 管对话中产生的事件/情感/发现）。
- **分发注意**：`data.extensions.luker` 与 `data.extensions.card_app` 字段被 ST 忽略，不影响正常使用；绑定预设与人设存在状态文件、**不随卡片分发**；编排工作流需手动导入。建议在卡描述中注明推荐 Luker、若依赖 CardApp 则写明所需 Luker 版本、并提供不依赖 Luker 的基线体验。

**可提炼为 skill 的知识点**：CardApp 开发 skill（ctx API 全表 + init 契约 + dispose 配对 + 安全准则）、卡片扩展字段写入 skill（memoryGraphSchema / card_app 结构）、"状态存哪"决策表（扩展字段 vs 状态文件 vs chat state vs floor state）。

---

### Chat & State — https://luker.cups.moe/development/extension-api/chat-and-state.html

**核心内容摘要**

- 只读聊天属性：`context.chat`（ChatMessage[]）、`context.characters`、`context.groups`、`context.name1`、`context.name2`、`context.characterId`、`context.groupId`、`context.chat_metadata`、`context.online_status`。
- **`readPluginFloors`**（重要，避免手搓聊天历史）：

```ts
context.readPluginFloors(options?: {
  fromSeq?, toSeq?, fromDepth?, toDepth?, roles?  // 默认 ['user','assistant']
}): FloorRecord[]
```

  - 只走一遍 `context.chat`，每个 floor 经**插件 regex 通道**并按真实 depth-from-end 处理，使脚本的 `maxDepth` 与主管线语义一致。
  - 返回字段：`seq`（1-based 位置）、`sourceIndex`（0-based 索引）、`depth`（从尾部算的 0-based，跳过 system floor；system floor 为 `undefined`）、`is_user`、`is_system`、`mesRaw`（原始 `.mes`）、`mesCooked`（过插件 regex 通道后的文本，**通常你要的是这个**）。
  - **为什么不要自己遍历**：手搓的 depth 通常按数组位置算，与 regex 脚本 `minDepth`/`maxDepth` 的语义不同；且手搓会拿到原始 `.mes`，绕过 regex，而主聊天显示的是重写后的文本。
- **`floorRecordToTaskMessage(record)`** → `{ role, content, sourceFloorIndex }`，role 由 authorship 推导（`is_user` → 'user'，再 `is_system` → 'system'，否则 'assistant'），content 为 `mesCooked`。
- **Floor provenance（来源戳）**：`sourceFloorIndex` 是 provenance 戳，告诉分发层这段文本已被 `readPluginFloors` 处理过，其自身 regex pass 会跳过，避免二次应用。三部分契约：读取 API 给每条消息盖章（你从不自己算）；分发器识别戳、原样放行并在出网前剥掉标记；插件只需搬运带戳消息。**cooking 每个 floor 只发生一次**，无论数组被分发多少次。
- **工具载荷豁免**：分发层 regex pass 只处理 `role: 'user' | 'assistant'` 且 content 为字符串的消息；工具流量（`tool_result` 等）从不被修改。
- **regex 规则作用域三分**：`promptOnly` 规则永不出现在插件请求中（只在主生成管线）；`pluginOnly` 只出现在插件请求中；两者皆无的规则会重写存储的聊天历史本身（在消息编辑/保存时应用）。
- **Messages API**（每次操作都是完整管线：memory 更新 + DOM 渲染 + 事件发射 + 持久化）：
  - `addMessages(messages, options?: {scroll?, silent?})` → `Promise<number | number[]>`；自动 push 到 chat[]、渲染 DOM、发 `MESSAGE_SENT`/`MESSAGE_RECEIVED`/`MESSAGE_RENDERED`、持久化；数组批量时单次持久化。
  - `updateMessages(updates, options?: {rerender?, silent?})`；patch 字段合并进 `chat[index]`；发 `MESSAGE_EDITED`/`MESSAGE_UPDATED`；经 RFC 6902 增量 patch 持久化。
  - `deleteMessages(index | index[], options?: {swipe?, silent?})`；批量删除自动处理索引位移；`swipe` 选项只删该 swipe。
  - `getMessage(index)` → `Readonly<ChatMessage> | null`（返回 Proxy，写操作抛错，引导用 `updateMessages()`）。
  - `getMessageCount()`。
  - `sendTextareaMessage()` → `Promise<void>`；像用户按发送键一样触发用户发送管线（先 `$('#send_textarea').val(...)` 播种）。
  - **废弃低层 API**：`addOneMessage()` → `addMessages()`；`deleteLastMessage()` → `deleteMessages(chat.length - 1)`；`deleteMessage()` → `deleteMessages()`；`updateMessageBlock()` → `updateMessages()`；`patchChatMessages()` / `appendChatMessages()` → 用 Messages API。
- `saveChatMetadata(withMetadata?)` → `Promise<boolean>`。
- **Chat State**（Luker 新增的聊天绑定状态机制，替代往 `chat_metadata` 里塞数据）：
  - `getChatState(namespace, options?: {target?})` → `{ok:true, state} | {ok:false, state:null, reason, hint}`
  - `getChatStateBatch(namespaces, options?)`
  - `updateChatState(namespace, updater, options?)` → `{ok:true, state, updated} | {ok:false, reason, hint}`；**推荐的 read-modify-write**；自动处理并发冲突（默认 CONFLICT 重试一次）；永不抛异常（reducer 内异常被捕获为 `reason: 'VALIDATION_ARGS'`）。
  - `deleteChatState(namespace, options?)`
  - 最佳实践：用 `updateChatState()` 而非手动 `getChatState()` + `patchChatState()`；payload 保持 JSON 可序列化纯对象；**switch on `reason` 而不是翻译 `hint`**；大数据优先 Chat State 而非 `chat_metadata`；需要跟随 swipe/删除/切聊天的状态用 Floor State。
- **九个错误 reason 码**（贯穿 chat state / floor state / character state / preset state）：

| Reason | 触发时机 | 建议处理 |
| --- | --- | --- |
| `VALIDATION_ARGS` | 参数错（空 namespace、updater 非函数、reducer 抛错） | 改调用方——这是程序员 bug |
| `VALIDATION_TARGET` | 无活动聊天 | 静默跳过，等用户开聊天再重试 |
| `VALIDATION_COMMIT` | 仅 floor-state：override 违反单调性、commit 畸形、floor 越界 | 调用方 floor 参数错，重算重发 |
| `INSTANCE_DESTROYED` | floor-state 实例已销毁 | 重载聊天或重建实例 |
| `CONFLICT` | 重试后仍 HTTP 409 | 重读当前状态再试 |
| `HTTP_ERROR` | 其他非 2xx | 查 hint 里的状态码，可给用户 toast |
| `TRANSPORT_ERROR` | fetch 抛错（网络/CORS/abort） | 重试或向用户报网络错误 |
| `REPLAY_BROKEN` | floor-state 日志重放失败且恢复也失败 | 数据不可恢复，建议用户 Reset 重建 |
| `LOG_WRITE_FAILED` | floor-state 私有日志写入被拒 | 同 hint 内嵌的底层 chat-state 失败 |

  - `hint` 是英文、≤120 字符、含可操作诊断信息，**不做本地化**。
- **Floor State**（Chat State 之上的薄层，追踪 chat tail 的每次写入 `(floor index, swipe id)` 并在聊天结构变化时重放幸存 commit）：
  - 实例拥有一个 chat-state 命名空间 `<ns>` 和一个私有 commit log `<ns>__floor_log`。
  - 四个结构变迁由 core 在 `eventSource` 事件触发**之前**驱动所有注册实例处理完：`CHAT_CHANGED`（从本聊天日志重建数据）、`MESSAGE_SWIPED`（用新活动 swipe 重建）、`MESSAGE_DELETED`（丢弃 ≥ 新长度的 commit 后重建）、`MESSAGE_SWIPE_DELETED`（重编号受影响 floor 的 commit 后重建）。
  - `createFloorState({ namespace })` → `Promise<FloorStateInstance>`；实例方法：`update(reducer, options?)`（推荐写 API；`options = { floor, swipeId? }` 可把 commit 钉到显式 floor 而非 chat tail）、`patch(operations, options?)`（高级：追加你自己算好的 RFC 6902 增量 diff，**必须**是对 `await fs.get()` 的 diff）、`reset(commits)`（原子替换整个日志，用于导入/重建/重置；任一 commit 非法则整批拒绝）、`get()`、`ready()`（等无在途写）、`destroy(options?)`（`{purge: true}` 额外删盘上状态）。
  - **约束**：reducer 必须返回纯对象（数组/原始值/null/undefined 视为"无变化"，返回 `{ok:true, updated:false}`）。
  - **一个 namespace 一个 owner**：不要对同一 namespace 混用 `updateChatState(ns, ...)` 和 `floorState.update(...)`，floor 重建会覆盖裸写。以 `__floor_log` 结尾的 namespace 字符串保留给私有日志。
  - **行为变更（2026-06-28）**：`fs.update` reducer 内抛出的异常被捕获并表现为 `{ok:false, reason:'VALIDATION_ARGS', hint:'reducer threw: ...'}`，不再冒泡。
- **`context.buildObjectPatchOperationsAsync(previousState, nextState, options?)`** → `Promise<RFC6902Operation[]>`；驱动 Luker patch-first 持久化的 diff 引擎，返回把 previousState 变成 nextState 的最小 RFC 6902 操作集。
- **何时需要 `await ready()`**：四个结构变迁在匹配的 eventSource 事件触发前已由 core 同步结算，所以在 `MESSAGE_DELETED` / `MESSAGE_SWIPED` / `MESSAGE_SWIPE_DELETED` / `CHAT_CHANGED` / `CHAT_BRANCH_CREATED` 监听器里读 floor state 无需 `ready()`。`ready()` 用于与在途 `update`/`patch` 串行化。
- **Character State**（绑定到角色卡本身、跨该角色所有聊天共享）：
  - `getCharacterState(avatar, namespace)`、`getCharacterStateBatch(avatar, namespaces)`、`setCharacterState(avatar, namespace, data)`（整文档覆写，传 null 删除）、`updateCharacterState(avatar, namespace, updater, options?: {maxOperations?, maxRetries?, asyncDiff?})`（**推荐**；内部算最小增量 patch，409 自动重试，默认 `maxRetries: 1`）、`deleteCharacterState(avatar, namespace)`。
  - **行为变更（2026-06-28）**：不再抛 HTTP 异常，改回 `{ok, state, reason, hint}` 信封。旧的 `try {...} catch (e) {...}` 要迁到 `if (!result.ok) {...}`。
  - Character State vs Chat State：前者绑定角色卡、跨聊天共享、存在卡片旁的状态文件；后者绑定单个聊天、存在聊天元数据。
- **聊天生命周期 API**：`getCurrentChatId()`、`reloadCurrentChat()`（mutex 绑定，并发调用串行）、`renameChat(oldFileName, newName)`（newName 不带 `.jsonl`）、`openCharacterChat(fileName)`、`closeCurrentChat()`、`doNewChat(options?: {deleteCurrentChat?})`、`getPastCharacterChats(characterId?)`（返回 `file_name` / `file_id`（不带 `.jsonl`，`openCharacterChat` 要的形式）/ `file_size` / `mes` / `last_mes`）、`deleteCharacterChat(characterId, fileName)`、`openGroupChat(groupId, chatId)`、`saveChat()`、`saveChatDebounced()`（1 秒空闲后保存，突发编辑首选）、`printMessages(options?: {clear?})`、`clearChat(options?: {clearData?})`、`sendSystemMessage(type, text?, extra?)`（type 取 HELP / WELCOME / EMPTY / GENERIC / NARRATOR / COMMENT / SLASH_COMMANDS / FORMATTING / HOTKEYS / MACROS / WELCOME_PROMPT / ASSISTANT_NOTE / ASSISTANT_MESSAGE）。
- **Extension Prompts（深度注入）**：`setExtensionPrompt(key, value, position, depth, scan?, role?, filter?)`；`position` 0 = BEFORE_PROMPT（故事字符串后）、1 = IN_CHAT（聊天内 depth 处）、2 = IN_PROMPT（聊天后）；`depth` 为 1 时表示距 chat tail 的距离，0 = 最后一条消息之后；`scan: true` 让该 prompt 文本参与 World Info 扫描；`role` 0=system / 1=user / 2=assistant；传 `''` 移除。`context.extensionPrompts` 为只读视图，每次 `clearChat` 重置为 `{}`。
- **Swipe API**：`context.swipe.left(event?, options?)` / `.right()` / `.to(event, direction, options?)`（direction 为 `SWIPE_DIRECTION.LEFT/RIGHT`，支持 `forceMesId`/`forceSwipeId`/`forceDuration`）/ `.show()` / `.hide({hideCounters?})` / `.refresh(updateCounters?, fade?)` / `.isAllowed()` / `.state()`（返回 SWIPE_STATE）。
- **消息媒体助手**（操作 message 的 `extra.media` 与 `extra.files` 数组）：`appendMediaToMessage(messageObj, messageElement, scrollBehavior?)`、`ensureMessageMediaIsArray(messageObj)`（把 legacy 单项 `extra.media`/`extra.image` 原地迁成数组）、`getMediaDisplay(messageObj)`、`getMediaIndex(messageObj)`、`scrollChatToBottom({waitForFrame?})`、`scrollOnMediaLoad()`。

**可提炼为 skill 的知识点**：Messages API 迁移 skill（废弃 API → 新 API 映射表）、状态存储选型决策树（chat_metadata / Chat State / Floor State / Character State / extension field / 变量）、九个 reason 码的 switch 处理模板、`readPluginFloors` + provenance 契约（避免双重 regex 的坑）。

---

### Generation — https://luker.cups.moe/development/extension-api/generation.html

**核心内容摘要**

- **推荐 API 是 `context.generateTask`**——一站式处理 profile 解析、world-info 激活、prompt 组装、分发、响应归一化。内置扩展（search-tools、completion-preset-assistant、character-editor-assistant、memory-graph、orchestrator）全走它。第三方扩展也应如此，而不是自己拼 `sendOpenAIRequest` + `buildPresetAwarePromptMessages` + `connectionProfiles.resolve`。
- `generateTask` 选项全表：

```ts
context.generateTask({
  taskMessages,                          // 必需
  includeCharacterCard?: boolean = true,
  worldInfoSource?: 'none'|'task'|'chat'|'custom' = 'none',
  customWorldInfoMessages?: Array|null,
  runtimeWorldInfo?: object|null,        // 预解析快照，短路解析
  forceWorldInfoResimulate?: boolean = false,
  worldInfoType?: string = 'quiet',
  apiPresetName?: string = '',           // 连接配置名（如 'claude'）
  llmPresetName?: string = '',           // chat completion 预设名（如 'low-temp'）
  tools?: Array|null,                    // OpenAI 风格工具定义
  toolChoice?: 'auto'|'none'|object = 'auto',
  jsonSchema?: object|null,              // 结构化输出（与 tools 互斥）
  functionCallMode?: 'auto'|'native'|'prompt_xml'|'prompt_json' = 'auto',
  functionCallOptions?: object|null,     // 如 { protocolStyle, requiredFunctionName }
  abortSignal?: AbortSignal|null,
  substituteMacros?: boolean = true,
}): Promise<{ assistantText, toolCalls, jsonData, reasoning, finishReason, usage, raw }>
```

- `worldInfoSource` 四种模式：`'none'`（默认，跳过 WI 激活）、`'task'`（按 taskMessages 激活）、`'chat'`（按当前聊天历史激活，内部用 `fallbackToCurrentChat: true`）、`'custom'`（按你显式提供的 `customWorldInfoMessages`）。
- **宏替换**：`substituteMacros: true`（默认）时，`generateTask` 对每条 task message 的字符串 content 跑 `substituteParams`，解析与主聊天路径相同的 `{{...}}` 宏（`{{user}}`、`{{char}}`、`{{persona}}`、`{{datetime}}`、`{{random:a,b}}` 等）。**副作用宏**（`{{setvar::}}`、`{{addvar::}}`、`{{incvar::}}`、`{{decvar::}}`、`{{deletevar::}}`）通过 `skipSideEffects: true` 剥离——否则每次插件请求都会重放这些变更并污染 `chat_metadata.variables`。
- **何时 opt out**：AI 在阅读/编辑含字面 `{{...}}` 占位符的源文本时设 `substituteMacros: false`。经验法则：AI 产出给终端用户看的内容 → `true`；AI 读/编辑含占位符的源文本 → `false`。代码库中已有例子：角色卡编辑器（编辑含 `{{user}}`/`{{char}}` 的卡片字段）、lorebook diff 分析、预设编辑器、CardApp Studio AI。
- **工具调用**：`result.toolCalls` 始终是 `{ name, args, raw }[]`，`args` 已解析（不用 `JSON.parse`）。强制单个函数：`toolChoice: { type:'function', function:{ name:'my_fn' } }` + `functionCallOptions: { requiredFunctionName: 'my_fn' }`。
- `functionCallMode` 四值：`'auto'`（按活动连接配置决定）、`'native'`（强制原生 tool-calling）、`'prompt_xml'`（工具定义以 XML 嵌进 system prompt，给无原生工具调用的模型）、`'prompt_json'`。
- **结构化输出**：`jsonSchema` → `result.jsonData`。`tools` 与 `jsonSchema` 互斥。
- **错误**：全部抛 `GenerateTaskError`，暴露在 `context.GenerateTaskError`。`code` 取值：`aborted`、`network`、`auth_missing`、`rate_limit`、`invalid_input`、`unsupported_api`、`stream_unavailable`、`tool_call_parse`、`json_schema_violation`、`no_response`、`unknown`。`error.cause` 携带原始底层错误，`error.details` 携带诊断上下文。
- **传输层**：`generateTask` 按解析后预设的 `stream_openai` 标志选 SSE 还是 one-shot POST；返回形状相同。非 OpenAI 请求 API（kobold / koboldhorde / novel / textgenerationwebui）始终 one-shot POST。
- **流式**：`context.generateTaskStream(...)` 返回 `{ stream, result }`——`stream` 是 delta chunk 的 AsyncIterable，`result` 是同样的归一化终值 Promise。chunk 类型：`{ type:'text', delta }` 与 `{ type:'reasoning', delta }`。**始终用 OpenAI 系流式发送器**，不查预设的 `stream_openai`。用 `switch (chunk.type)` 加 default 分支忽略未知类型。兼容性：纯文本完全支持；tools 支持（模型直接发工具调用时 stream 通常无产出）；jsonSchema 支持（stream 出部分 JSON，不可中途解析）；`requestApi !== 'openai'` 抛 `stream_unavailable`。**break 出 for await 不取消底层 HTTP 请求**，要停上游必须触发 `abortSignal`。
- **工具注册（全局注册表）**：

```js
context.registerFunctionTool({ name, displayName, description, parameters, action, formatMessage, shouldRegister, stealth });
context.unregisterFunctionTool(name);
context.isToolCallingSupported();
context.canPerformToolCalls(type);
```

  全局 vs 每请求：`registerFunctionTool` 加进全局注册表（主聊天里模型可调）；`generateTask` 的 `tools` 参数只对该次请求有效。
- **迁移 cookbook**（旧 → 新）：

| 旧 | 新 |
| --- | --- |
| `import { sendOpenAIRequest } from '../../openai.js'` | 用 `context.generateTask`（无需 import） |
| `import { resolveChatCompletionRequestProfile }` | 删——给 `generateTask` 传 `apiPresetName` |
| `import { extractAllFunctionCalls, getResponseMessageContent }` | 删——读 `result.toolCalls` 与 `result.assistantText` |
| `context.buildPresetAwarePromptMessages({...})` | 删——`generateTask` 内部组装 |
| `extractAllFunctionCalls(responseData, allowedNames)` | `result.toolCalls.filter(c => allowedNames.has(c.name))` |
| `getResponseMessageContent(responseData)` | `result.assistantText` |

  注意：`generateTask` 内部始终设 `requestScope: 'extension_internal'`；传 `tools` 时隐含 `replaceTools: true`；旧的 `apiSettingsOverride` 路径已从推荐 API 移除。
- **低层 API**（`generateTask` 不适配时才直接用）：`connectionProfiles.list()`、`sendOpenAIRequest(type, messages, signal, options)`（首参 `'quiet'` 表示后台请求不出现在聊天 UI；选项 `llmPresetName` / `apiPresetName` / `apiSettingsOverride` / `requestScope` / `functionCallOptions`）、`buildPresetAwarePromptMessages`（仅组装信封不分发，用于"预览将发送什么"）、`generateRaw(params)`（发字面 prompt，不涉及聊天历史/WI/卡片/扩展 prompt，返回后处理文本，用于 titling/分类/改写）、`generateRawData`（同参但返回原始响应对象）、`generateQuietPrompt(params)`（复用实时聊天上下文但注入 `quietPrompt` 作为最终用户指令；参数 `quietPrompt` / `quietToLoud` / `skipWIAN` / `quietImage` / `quietName` / `responseLength` / `forceChId` / `jsonSchema` / `removeReasoning` / `trimToSentence`）、`sendStreamingRequest`、`sendGenerationRequest`、`stopGeneration()`、`context.streamingProcessor`。
- **服务类**（需要直接控制 chat-completion 或 text-completion 后端时用）：
  - `ChatCompletionService.createRequestData(custom)` / `.sendRequest(data, extractData?, signal?)` / `.processRequest(requestData, options, extractData?, signal?)`；`processRequest` 通过 `getPresetManager('openai')` 加命名预设。
  - `TextCompletionService.createRequestData` / `.sendRequest` / `.constructPrompt(prompt, instructPreset, instructSettings)` / `.processRequest`。
  - `ConnectionManagerRequestService.sendRequest(profileId, prompt, maxTokens, custom?, overridePayload?)` / `.constructPrompt(prompt, profileId, instructSettings?)` / `.getSupportedProfiles()` / `.getProfile(profileId)` / `.getProfileIcon(profileId?)` / `.getAllowedTypes()`。连接管理器扩展禁用时抛 `'Connection Manager is not available'`。
- 响应助手：`extractMessageFromData(data)`、`getChatCompletionModel()`。

**可提炼为 skill 的知识点**：generateTask 一站式 LLM 调用 skill（含 substituteMacros 的坑）、ST → Luker 生成层迁移 cookbook、流式 vs 非流式的选型与 chunk 处理。

---

### Presets & Prompts — https://luker.cups.moe/development/extension-api/presets-and-prompts.html

**核心内容摘要**

- `context.presets` 统一预设管理接口，替代直接 import `PresetManager` 内部模块。
- `presets.list(collection?)` → `PresetRef[]`；`presets.getSelected(collection?)` → `PresetRef | null`（当前选择是绑定到角色卡的运行时预设时返回 null）；`presets.getLive(collection?)` → `PresetBody | null`（UI 中正在编辑的、含未保存改动）；`presets.getStored(ref)` → `PresetBody | null`；`presets.save(ref, body)`；`presets.resolve(target?, options?)` → `{collection, name} | null`（**纯名字解析助手，不返回连接信息**——要解析连接配置用 `context.connectionProfiles.resolve`）。
- **`presets.state.*`**（绑定到预设的插件运行时/会话数据，sidecar 存在预设旁，**不随预设导出**）：
  - `state.get(namespace, options?)` / `getBatch(namespaces, options?)` / `update(namespace, updater, options?)`（**推荐**；`{maxOperations?, maxRetries?}`）/ `patch(namespace, operations, options?)` / `delete(namespace, options?)` / `deleteAll(target?)`。
  - 全部接受 `options.target`（PresetRef）与 `options.collection` 用于跨预设读写；两者都默认当前选中预设。
  - **行为变更（2026-06-28）**：不再抛 HTTP 异常，改回 `{ok, ...}` 信封。
  - 错误 reason 用与 Chat State 相同的词表（`VALIDATION_COMMIT` / `INSTANCE_DESTROYED` / `REPLAY_BROKEN` / `LOG_WRITE_FAILED` 对 preset state 不适用）。
- **使用规则**：`list()` 与 `getSelected()` 只返回已保存预设；用 `getLive()` 读正在编辑的预设；绑定到角色卡的运行时预设不算"已保存"（`getSelected()` 返回 null 但 `getLive()` 仍可读）；**不要把插件运行时数据塞进预设 body**，用 `presets.state.*`。
- **`buildPresetAwarePromptMessages`**：把插件消息按 prompt preset 的 ordering 组装成可发送的 prompt 消息列表。可选组装工具——简单 LLM 调用不需要它；只有要复用角色卡/世界书/prompt 模板时才需要。关键行为：保留活动预设中聊天历史之外的内容（system prompt、角色描述等），只替换聊天历史部分；提供 `runtimeWorldInfo` 时 WI 条目注入到对应位置；指定 `promptPresetName` 时用该预设的 prompt 模板。
- **`resolveWorldInfoForMessages(messages, options?)`**：对指定消息做 World Info 激活扫描，返回激活结果。选项：`type`（如 `'quiet'` 静默扫描不影响主对话）、`fallbackToCurrentChat`、**`postActivationHook`**（激活后、注入前对条目做任意修改——改内容、调注入位置与深度、甚至增删条目；接收完整归一化 WI payload 并返回修改版）。返回对象含 `worldInfoBeforeEntries`、`worldInfoAfterEntries`、`worldInfoDepth` 等字段，可直接传给 `buildPresetAwarePromptMessages` 的 `runtimeWorldInfo`。
- **推荐的独立 LLM 调用模式**（三步）：1) `resolveWorldInfoForMessages` → 2) `buildPresetAwarePromptMessages` → 3) `sendOpenAIRequest('quiet', ..., { requestScope: 'extension_internal' })`。
- **Prompt 信封检查**（诊断 UI / "预览将发送什么"）：
  - `getActivePromptPresetEnvelope(options?)` → 快照，含 `mainApi` / `completionApi`、`presetRefs`（resolved completion/context/instruct/sysprompt/reasoning 预设名）、`promptCore`、`promptLayout`（合并后的 Luker 布局，来自 `extensions.luker.prompt_layout`）、`promptCatalog`（`prompt.identifier → {name, role, content, marker, systemPrompt}`）、`characterCard`。
  - `getActivePromptLayout(options?)` → `PromptLayoutEntry[]`，每项含 `id`、`enabled`、`order`、`role`、`phase`、`source`、`content`、`path`、`promptIdentifier`、`tags`。
  - `formatPromptPresetEnvelope(envelope?, options?: {label?})` → 格式化成 `[[LABEL]]\n<json>`，用于嵌进另一个 prompt。
- **Reasoning 助手**（解析 `<thinking>...</thinking>` 风格块，支持 Claude reasoning / DeepSeek-R1 / o1）：`parseReasoningFromString(text, options?: {strict?}, template?)` → `{reasoning, content} | null`；`getReasoningTemplateByName(name)`（找不到抛 `Error('Unknown reasoning template name: "<name>"')`）；`updateReasoningUI(messageIdOrElement, options?: {reset?})`；`removeReasoningFromString(str)`。
- **只读设置视图**：`context.chatCompletionSettings`（即 `oai_settings`）、`context.textCompletionSettings`（即 `textgenerationwebui_settings`）、`context.powerUserSettings`（即 `power_user`）。**仅用于检查**——直接写会绕过 debounced 保存逻辑。
- **连接助手**：`context.openai.proxies`、`context.openai.ZAI_ENDPOINT`（智谱 / Z.AI 端点）、`context.openai.stripPresetConnectionFields(preset)`（去掉连接相关字段，导出可移植预设用）；`context.textCompletion.types`（OOBA / MANCER / APHRODITE / KOBOLDCPP 等）。

**可提炼为 skill 的知识点**：presets.state 与 chat/character state 的选型；postActivationHook 改写 WI 注入位置的高级用法；"预览 prompt 信封"调试 skill。

---

### Characters — https://luker.cups.moe/development/extension-api/characters.html

**核心内容摘要**

- 读取：`context.characters`（Character[]，包了 Proxy，同时支持 V2 `character.data.*` 与 legacy 根级字段）、`context.characterId`、`getOneCharacter(avatarUrl)`、`getCharacters()`。
  - `getOneCharacter(avatar)` 用于单张卡服务端被改后刷新；`getCharacters()` 用于批量导入/删除后刷新全部。
- `getCharacterCardFields(options?: {chid?})` → 宏替换与人设注入**之后**的已解析卡片字段（`system`、`mesExamples`、`description`、`personality`、`persona`、`scenario`、`jailbreak`、`version`、`charDepthPrompt`、`creatorNotes`、`firstMessage`、`alternateGreetings`）。需要为 prompt 组装准备的字段时用它，而不是直接读 `character.data.*`。
- `getCharacterSource(chId?)` → 规范来源 URL（chub / pygmalion / github / perchance / risuai 或 `data.extensions.source_url`）。
- `getCharaFilename(chid?, options?: {manualAvatarKey?})` → 不带扩展名的 avatar 文件名；`getThumbnailUrl(type, file, t?)`。
- 选择与加载：`selectCharacterById(id, options?: {switchMenu?})`（角色不存在或正在保存聊天时静默退出并 toast；`switchMenu` 默认 true，重选同一角色时打开编辑面板）、`unshallowCharacter(characterId)`（从列表端点拿到的浅记录要先调它再读 description / mes_example 等大字段）、`unshallowGroupMembers(groupId)`。
- **写卡片字段**：`writeExtensionField(characterId, key, value)` 写 `data.extensions[key]` 并持久化。
  - **替换语义**：整个 value 成为盘上新的 `data.extensions[key]`，**兄弟子键不保留**——要部分更新须自己读旧值、展开、覆盖。
  - 其他扩展键（别的插件的数据）永不被触碰。
  - 传 `context.constants.unset`（UNSET_VALUE 哨兵）删除整个键；传 `null` 写一个字面 null（键仍存在）。
  - 这是插件扩展字段的**安全路径**——绕过 `context.characters` Proxy。
- `writeExtensionFieldBulk(avatars, key, value, options?: {filterPath?})` → `{updated, skipped, failed}`；`avatars: null` 或 `[]` 针对所有角色。
- `context.createCharacterData`（"创建新角色"表单的实时可变缓冲）、`updateCharacterData(charId, patch, options?: {persist? = true, immediate? = false})`（点路径进 `character.data` 的表单级字段，中间对象自动创建；**以 `extensions.` 开头的点路径被拒绝**——用 `writeExtensionField`）。会发 `event_types.CHARACTER_FIELDS_UPDATED` 带 `{charId, keys}`。
- `persistCharacterData(charId)`（把内存数据序列化成 `/api/characters/edit` 期望的 multipart 形态并 POST；服务端与盘上 JSON 深合并）、`persistCharacterDataDebounced(charId)`（按角色防抖，不同卡的并发写不会合并成错误的单次保存）。
- 标签：`context.tags`（`{id, name, folder?, color?, color2?, create_date}`）、`context.tagMap`（avatar → tag ids）、`importTags(character, options?)`（上限 50 个标签防 troll 卡）。
- 导入导出：`importFromExternalUrl(url, options?: {preserveFileName?})`（服务端检查 Content-Type 路由到 `processDroppedFiles` 或 `importWorldInfo`）。
- **Proxy 语义**（重要）：
  - 读取：两条路径都可读，Proxy 解析到有数据的那条。`character.name`、`character.data.name`、`character.data.extensions.foo` 都 OK。`Object.keys()`、`for...in`、展开也看得到 legacy 键。
  - 写入 legacy 根字段**可用但会发弃用警告 + 一次性 toast**：`character.name = 'Bob'`（警告）vs `character.data.name = 'Bob'`（推荐，无警告）。
  - 弃用面精确覆盖：`name`→`data.name`、`description`→`data.description`、`personality`→`data.personality`、`scenario`→`data.scenario`、`first_mes`→`data.first_mes`、`mes_example`→`data.mes_example`、`creatorcomment`→`data.creator_notes`、`tags`→`data.tags`、`talkativeness`→`data.extensions.talkativeness`、`fav`→`data.extensions.fav`。
  - 镜像规则：经规范路径写会自动镜像回 legacy 字段，反之亦然。写时做字段规范化：文本字段 → string；`tags` → 去空去重数组（也接受逗号分隔字符串）；`talkativeness` → 有限数字，非数字默认 0.5；`fav` → 布尔（识别字符串 'true'/'false'）。
  - `writeExtensionField` 走底层 live `characters` 引用，**永不触发弃用 toast**。

**可提炼为 skill 的知识点**：卡片字段读写 skill（replace 语义 + Proxy 弃用面 + 哨兵删除）、`updateCharacterData` vs `writeExtensionField` 的边界（extensions 前缀被拒）。

---

### World Info — https://luker.cups.moe/development/extension-api/world-info.html

**核心内容摘要**

- 读取：`loadWorldInfo(name)`（大小写与重音不敏感；内部缓存）、`loadWorldInfoBatch(names)`（单次 HTTP 往返读多个，返回 Map）、`getWorldInfoNames()`、`getWorldInfoPrompt(chat, maxContext, isDryRun, globalScanData)`（低层扫描器；多数插件应改用 `resolveWorldInfoForMessages`）。
  - `WIPromptResult` 字段：`worldInfoString`、`worldInfoBeforeEntries`、`worldInfoAfterEntries`、`worldInfoExamples`（`{position, content}[]`）、`worldInfoDepth`（`{depth, role, entries}[]`）、`anBefore` / `anAfter`（作者注注入）、`outletEntries`。`isDryRun: false` 时会发 `event_types.WORLD_INFO_ACTIVATED`。
- 写入：`saveWorldInfo(name, data, immediately?, options?: {refreshEditor?})`（缓存同步更新，网络写默认走 debounce 队列；`refreshEditor: true` 在保存后刷新 world-info 抽屉——你的写入可能被用户打开着的抽屉看到时用它）、`updateWorldInfoList()`、`createWorldBook(name, options?: {interactive?})`（默认 `interactive: false` 跳过重名确认弹窗）、`importEmbeddedWorldInfo(skipPopup?)`（把第三方 PNG 卡里的 V2/V3 `data.character_book` 导入为真实世界书文件并绑为角色主世界）、`charUpdatePrimaryWorld(name)`（传 `''` 解绑）、`getCharacterEmbeddedWorld(charId)`（只读检查器：`present` / `name` / `entryCount` / `bound`）、`reloadWorldInfoEditor(file, loadIfNotSelected?)`。
- **激活扫描**：`simulateWorldInfoActivation(request)` → `WIPromptResult & {chatForWI, maxContext, globalScanData}`；参数 `coreChat`（`{name, mes, is_user, is_system}[]`）、`maxContext`、`dryRun`、`type`（`'normal'` / `'quiet'` / `'regenerate'` 等）、`chatForWI`（预构建扫描输入）、`includeNames`、`globalScanData`。这是 `resolveWorldInfoForMessages` 背后的原语。
- `buildWorldInfoChatInput(messages, includeNames?)` → 反向扫描字符串数组（每行 `"name: mes"` 或仅 mes）。
- `buildWorldInfoGlobalScanData(type, overrides?)` → 角色卡派生的扫描字段（`personaDescription`、`characterDescription`、`characterPersonality`、`characterDepthPrompt`、`scenario`、`creatorNotes`、`trigger`）。
- `getActiveWorldInfoPromptFields()` → 实时生成管线中最近捕获的 before/after 片段（无活动聊天或快照属于别的聊天时返回空数组）。
- **角色辅助世界书**：`getCharaAuxWorlds(charaFilename)` → 去重后的辅助 WI 名列表。解析规则：创建角色时（`menu_type === 'create'`）读在途新角色缓冲；否则读与 `charaFilename` 匹配的 `world_info.charLore` 持久条目。配 `getCharaFilename` 用。
- `convertCharacterBook(characterBook)` → `{entries, originalData}`（V2 卡 `character_book` → 内部 WI 形态）。
- **条目级助手**（`context.worldInfoEntry.*`）：`template`（规范默认条目形状，clone-and-modify）、`create(name, data)`（分配下一个空 uid、填默认、原地改 `data.entries`）、`delete(data, uid, options?: {silent?})`、`setButtonClass(chid, forceValue?)`、`setGlobalSelection(worldInfoName, selected, options?)`、`getSorted()`（所有当前活动世界书的条目，预合并并按注入顺序排序）。
- **聊天绑定 World Info**（`context.chatWorldInfo.*`，绑定存在 `chat_metadata.world_info` 随聊天走）：`getNames(metadata?, options?: {resolveNames? = true, onlyExisting? = true})`、`setSelection(names, metadata?)`（返回是否真的变了）、`globalSelection`（只读快照）。
- **位置常量**：`context.constants.wiAnchor` = `{before, after}`（示例对话条目的锚侧）；`context.constants.wiPosition` = `{before, after, ANTop, ANBottom, atDepth, EMTop, EMBottom, outlet}`。

**可提炼为 skill 的知识点**：lorebook 程序化读写 skill（含 uid 分配 + 条目模板 clone 模式）、"不改主聊天地扫描 WI" 的 dryRun 模式、角色辅助世界书机制。

---

### Macros & Variables — https://luker.cups.moe/development/extension-api/macros-and-variables.html

**核心内容摘要**

- `macros.register(name, options)`：选项含 `handler`（收 `MacroExecutionContext`）、`aliases`（`{alias, visible}[]`）、`category`、`unnamedArgs`（数量或 arg def 数组）、`list`（变长参数）、`strictArgs`（false 时 arity/type 不匹配只打 warning）、`description`、`returns`、`returnType`（`'string'|'integer'|'number'|'boolean'`）、`displayOverride`、`exampleUsage`、**`delayArgResolution`**（true 时 args 里的嵌套宏**不**预解析，handler 须自己调 `ctx.resolve(text)`；仅用于控制流宏）。
- Handler context（`MacroExecutionContext`）字段：`name`、`args`、`unnamedArgs`、`list`、`env`、`normalize(value)`、`trimContent(content, opts?)`、`resolve(text, opts?)`、`warn(message, error?)`。
- 注册后 `{{myStatus}}` 与 `{{greet::Bob}}` 都可用。
- 注销与检查：`ctx.macros.registry.unregisterMacro(name)` / `.hasMacro(name)` / `.getMacro(name)`。
- **内置宏表**（非穷尽，完整见 `public/scripts/macros/definitions/`）：
  - 人设/角色：`{{user}}`、`{{char}}`、`{{persona}}`、`{{charDescription}}`、`{{charPersonality}}`、`{{charScenario}}`、`{{charDepthPrompt}}`、`{{charCreatorNotes}}`、`{{charFirstMessage}}`、`{{charVersion}}`、`{{mesExamples}}`、`{{mesExamplesRaw}}`
  - 群组：`{{group}}`、`{{groupNotMuted}}`
  - 最近聊天：`{{lastMessage}}`、`{{lastMessageId}}`、`{{lastUserMessage}}`、`{{lastCharMessage}}`、`{{firstIncludedMessageId}}`、`{{firstDisplayedMessageId}}`
  - Swipe：`{{lastSwipeId}}`、`{{currentSwipeId}}`
  - 模型与预算：`{{model}}`、`{{maxPrompt}}`、`{{maxContext}}`、`{{maxResponse}}`
  - 时间：`{{time}}`、`{{date}}`、`{{weekday}}`、`{{isotime}}`、`{{isodate}}`、`{{datetimeformat::FORMAT}}`（moment.format）、`{{idleDuration}}`、`{{timeDiff}}`
  - 局部变量：`{{getvar::name}}`、`{{setvar::name::value}}`、`{{addvar::name::value}}`、`{{incvar::name}}`、`{{decvar::name}}`、`{{hasvar::name}}`、`{{deletevar::name}}`、`{{pushvar::name::value}}`、`{{popvar::name}}`（后两个自动创建 `[]`，支持点路径）
  - 全局变量：`{{getglobalvar::name}}`、`{{setglobalvar::name::value}}` 等
  - 控制流：`{{if::cond::then::else}}`、`{{else::...}}`、`{{each::...}}`
  - 空白：`{{trim}}`、`{{newline}}`、`{{space}}`、`{{noop}}`
  - 随机：`{{roll::XdY}}`、`{{random::a,b,c}}`、`{{pick::a,b,c}}`
  - 其他：`{{//comment}}`、`{{outlet::name}}`、`{{isMobile}}`、`{{hasExtension::name}}`、`{{lastGenerationType}}`、`{{systemPrompt}}`
- `MacrosParser`（**已废弃**）：`registerMacro(key, value | (nonce)=>string, description?)` / `unregisterMacro(key)`。迁移到 `macros.register({handler})`，或给 `substituteParams` 传 `dynamicMacros` 做一次性调用。
- `substituteParams(content, options?: {name1Override?, name2Override?, original?, groupOverride?, replaceCharacterCard?, dynamicMacros?, postProcessFn?})`；`substituteParamsExtended(content, additionalMacros?, postProcessFn?)`（`additionalMacros` 只在本次替换存在，不全局注册）。
- **变量**：两个作用域——local（每聊天，存 `chat_metadata.variables`）与 global（跨聊天，存 `extension_settings.variables.global`）。
  - Local 方法：`get`（数字字符串自动转数字，缺失返回 `''`）、`set`（返回 value）、`add`（都数字则数值加，已有是 JSON 数组则 push，否则字符串拼接）、`inc` / `dec`（`add(name, ±1)` 快捷）、`del`（返回 `''`）、`has`、`push`（push 到 JSON 数组，缺失自动创建 `[]`；宏形式 `{{pushvar::name::value}}`）、`pop`（空或缺失时 no-op；宏形式 `{{popvar::name}}`）。
  - **每个方法的 `name` 都接受点路径**（如 `roster.alice.hp`）读写结构化变量内的叶子；写方法原地改 `chat_metadata.variables[root]`，与宏侧 `{{setvar::roster.alice.hp::value}}` 一致；中间节点按需创建。
  - `get` / `set` 的可选 `args`：`args.key`（替代变量名）、`args.index`（索引进 JSON 列表/字典）、`args.as`（set 专属，强制转 `'string'|'number'|'boolean'`）。
- **Floor-bound 写入**：`context.setVariable(name, value, options?: {floor?})` → `Promise<any>`：
  - `await ctx.setVariable(k, v)` → 直接写 `chat_metadata.variables[k] = v`（同 `ctx.variables.local.set(k, v)`，但可 await）。
  - `await ctx.setVariable(k, v, {floor: N})` → 往 floor N 的 `extra.var_ops` 追加一条 setvar op，绑定到该 floor 当前 swipe。swipe 切换/消息删除/分支创建时，variable-op-log 与 floors 同步重放。
  - floor 模式细节：**value 被强制转字符串**（`extra.var_ops` 只携带字符串）；**是重放不是覆写**——重建时按写顺序重放每个幸存 var_op 涉及的键到 `chat_metadata.variables`，没被任何幸存 var_op 写的键（WI 副作用、斜杠命令、第三方扩展写入）保持不动；floor 必须在 `0 <= floor < chat.length` 否则抛错；点路径同样支持（`setVariable('roster.alice.hp', 50, {floor})` 在第一个 `.` 处切分，`op.key` 保持顶层变量名）。
  - **Floor write vs createFloorState**：

| | Floor write | createFloorState |
| --- | --- | --- |
| 数据形状 | 标量（string / number） | 结构化对象 |
| 桶 | 与 `{{getvar::k}}` 共享 `chat_metadata.variables` | 独立命名空间，永不触达宏 |
| Commit log | variable-op-log（floor `extra.var_ops`） | floor 结构化 commit log（`__floor_log`） |
| 用途 | 与 AI 写的 `{{setvar}}` 共存的、可回滚的标量 | 插件或 CardApp 管理的、可回滚的结构化状态 |

  - **两套机制有独立 commit log，不要从两边写同一个键**——重放顺序跨机制无保证，会互相覆盖。

**可提炼为 skill 的知识点**：自定义宏注册 skill（含 `delayArgResolution` 控制流陷阱）、变量作用域选型（local / global / floor-bound / floor state）、内置宏速查表。

---

### Slash Commands — https://luker.cups.moe/development/extension-api/slash-commands.html

**核心内容摘要**

- 当前入口：`SlashCommandParser.addCommandObject()`，接受 `SlashCommand.fromProps()` 构建的实例。
- 基础注册：

```js
ctx.SlashCommandParser.addCommandObject(ctx.SlashCommand.fromProps({
  name: 'mygreet',
  helpString: 'Print a friendly greeting.',
  callback: () => 'Hello from my plugin!',
  returns: ctx.ARGUMENT_TYPE.STRING,
}));
```

- 带命名与位置参数（调用形式 `/translate target=ja Hello, world!`）：`namedArgumentList` 用 `new ctx.SlashCommandNamedArgument(name, description, type, isRequired, acceptsMultiple, defaultValue, enumList)`；`unnamedArgumentList` 用 `new ctx.SlashCommandArgument(description, typeList, isRequired, acceptsMultiple, defaultValue, enumList)`。
- `SlashCommand.fromProps` 属性：`name`（不带前导 `/`）、`callback`（收 named args 含 `_scope` / `_parserFlags` / `_abortController` / `_hasUnnamedArgument`，与 unnamed arg）、`helpString`、`aliases`、`returns`、`namedArgumentList`、`unnamedArgumentList`、`splitUnnamedArgument`、`splitUnnamedArgumentCount`、`rawQuotes`。callback 可返回 `SlashCommandClosure` 以组合管线。
- `context.ARGUMENT_TYPE` 枚举：`STRING`、`NUMBER`、`RANGE`、`BOOLEAN`、`VARIABLE_NAME`、`CLOSURE`、`SUBCOMMAND`、`LIST`、`DICTIONARY`。
- `SlashCommandArgument.fromProps({description, typeList?, isRequired?, acceptsMultiple?, defaultValue?, enumList?, enumProvider?, forceEnum?})`。当 `typeList` 是 `[BOOLEAN]` 且未提供枚举时自动补 true/false 枚举。
- `SlashCommandNamedArgument.fromProps({...同上..., aliasList?})`。
- `SlashCommandEnumValue(value, description?, type?, typeIcon?, matchProvider?, valueProvider?, makeSelectable?)`；需要解析时计算选项（如从当前设置）时用 `enumProvider`。
- 执行：`executeSlashCommandsWithOptions(text, options?: {handleParserErrors?, scope?, handleExecutionErrors?, parserFlags?, abortController?, debugController?, onProgress?, source?})` → `SlashCommandClosureResult`。默认解析错误以 toast 呈现、执行错误抛出；`handleExecutionErrors: true` 让执行错误也变 toast。返回含 `pipe`（链中最后一个命令后的最终值）、`interrupt`、`isError`、`errorMessage`。
- **废弃**：`executeSlashCommands(text, handleParserErrors?, ...)` → 迁到 `executeSlashCommandsWithOptions`（options 作为单个对象传）；`registerSlashCommand(name, callback, aliases?, helpString?)` → 迁到 `SlashCommandParser.addCommandObject(SlashCommand.fromProps({...}))` 以获得完整命名参数支持、自动补全与正确的帮助渲染。

**可提炼为 skill 的知识点**：斜杠命令注册 skill（命名/位置参数 + 枚举 + 管线组合）、废弃 API 迁移。

---

### UI & Popups — https://luker.cups.moe/development/extension-api/ui-and-popups.html

**核心内容摘要**

- `new Popup(content, type, inputValue?, options?)`——全控制弹窗原语。`PopupOptions` 含 `okButton` / `cancelButton`（传 false 隐藏）、`rows`、`placeholder`、`tooltip`、`wide` / `wider` / `large`、`transparent`、`defaultResult`、`customButtons`（`{text, tooltip?, result?, classes?, icon?, action?, appendAtEnd?}[]`）、`customInputs`（`{id, label, tooltip?, defaultState?, type?, rows?, min?, max?, step?, disabled?}[]`）、`allowEscapeClose`、`onOpen` / `onClosing` / `onClose`、`cropAspect` / `cropImage`。
- 实例方法：`await popup.show()` → `Promise<string | number | boolean | null>`；`await popup.complete(result)`；`popup.completeAffirmative()` / `completeNegative()` / `completeCancelled()`。`popup.value` 存 INPUT 类型的输入字符串；`popup.cropData` 存 CROP 类型的 data URL。
- `context.POPUP_TYPE` = `{TEXT:1, CONFIRM:2, INPUT:3, DISPLAY:4, CROP:5}`；`context.POPUP_RESULT` = `{AFFIRMATIVE:1, NEGATIVE:0, CANCELLED:null, CUSTOM1:1001, ..., CUSTOM9:1009}`。省略 `result` 字段的自定义按钮自动分配 CUSTOM1–CUSTOM9。
- `callGenericPopup(content, type, inputValue?, popupOptions?)`——函数式快捷方式，等价 `new Popup(...).show()`。`callPopup` 已废弃（字符串键类型 → 迁到数字 `POPUP_TYPE`）。
- **Loader**（长操作阻塞 UI 的推荐 API）：`loader.show(options?)` → `ActionLoaderHandle`；`loader.hide(handle?)`（不带参隐藏所有）。`ActionLoaderOptions`：`blocking`（默认 true）、`toastMode`（`'none'|'static'|'stoppable'`，默认 `'stoppable'`）、`slug`、`message`（默认 `'Generating...'`）、`title`、`stopTooltip`、`overlayContent`、`onStop`、`onHide`。工具方法：`loader.active()`、`loader.get(id)`、`loader.isBlocking()`、`loader.ToastMode`、`loader.Handle`、`loader.createOverlay()`。`showLoader` / `hideLoader` 已废弃。
- **模板**：`renderExtensionTemplateAsync(extensionName, templateId, templateData?, sanitize?, localize?)`——从 `scripts/extensions/${extensionName}/${templateId}.html` 加载并返回渲染后 HTML，自动 DOMPurify 净化 + i18n 本地化。第三方示例：`ctx.renderExtensionTemplateAsync('third-party/MyExt', 'dialog', {...})`。`renderExtensionTemplate`（同步版）已废弃——底层 loader 是异步的，同步版会阻塞事件循环。
- **消息格式化**：`messageFormatting(mes, ch_name, isSystem, isUser, messageId, sanitizerOverrides?, isReasoning?)` → 渲染后 HTML，应用 markdown 渲染、自定义 CSS 类注入、代码语法高亮、宏替换、regex 管线（按 flag 决定 AI_OUTPUT / USER_INPUT 位置）。`context.markdownConverter`（共享 showdown.Converter，配置了 Luker 全项目 markdown 规则；live binding，每次访问读最新）。
- `ModuleWorkerWrapper`——周期性 worker 函数的互斥包装，防止上一次没跑完时的重叠 tick。
- **Toast**：用全局 `toastr` 库（不经 `getContext()` 暴露，因为已是全局）：`toastr.success(...)` / `.warning(...)` / `.error(...)`。
- **共享组件**（HTML 字符串构建器，三层 API 都暴露）：
  - `renderLukerTabs({id, scope, tabs, defaultTab?, moduleName})` → 标签面板 HTML；可见性由模块加载时安装的委托 click handler 切换；选择持久化到 `extension_settings[moduleName].tabState[scope]`。
  - `renderFieldHelpButton({title, bodyHtml, targetSelectId?})` → 小 "?" 图标按钮，点击开 title + body 弹窗。
  - 三层暴露形式：Layer 1 ESM `import { renderLukerTabs } from '/scripts/extensions/luker-tabs.js'`；Layer 2 `lukerContext.renderLukerTabs`；Layer 3 `SillyTavern.getContext().renderLukerTabs`。

**可提炼为 skill 的知识点**：插件 UI 构建 skill（Popup / loader / 模板 / 共享组件三件套）、三层 API 暴露惯例（Layer1 ESM / Layer2 lukerContext / Layer3 getContext）。

---

### Plugin Integration — https://luker.cups.moe/development/extension-api/plugin-integration.html

**核心内容摘要**

- **Regex Runtime API**：`registerManagedRegexProvider('my-plugin', {reloadOnChange: true})`（从 `regex/engine.js` 导出）→ 返回 handle，含 `upsertScript` / `removeScript` / `setScripts` / `clearScripts` / `unregister`。
- **Search Tools API**：`globalThis.Luker.searchTools` 暴露 `toolNames`、`getToolDefs()`、`isToolName('web_search')`。实际搜索执行走内部工具调用循环。
- **扩展间通信**：`context.registerExtensionApi('my-plugin', {doSomething, getData})`（重名时打 warning 并覆盖）；`context.getExtensionApi('other-plugin')`（无则返回 undefined）。典型用途是解耦——一方提供能力、另一方消费，无需硬编码 import 依赖。
- **事件系统**：`eventSource.on(eventName, handler, options?)` / `.off()` / `.makeFirst()` / `.makeLast()` / `.getListenersMeta(eventName)`（调试用）/ `.setOrderConfig(config)`。
- **i18n**：
  - `` t`Tag ${name} not found` ``——标签模板字面量，用模板形态 `'Tag ${0} not found'` 作查找键，再把 name 替换回结果。最符合人体工学的运行时翻译 API。
  - `translate(text, key?)`——查 `text`（或 `key`）；找不到原样返回。
  - `getCurrentLocale()`——返回启动时解析的小写 locale（`'en'`、`'zh-cn'`、`'zh-tw'`、`'ja-jp'` 等）。
  - `addLocaleData(localeId, data)`——合并插件提供的翻译。要在 i18n 系统启动后调用（如 `APP_READY` 时）。`localeId` 是主 locale 时条目总是覆盖；是 fallback locale 时只填缺失键。locale 数据在 `zh-CN ↔ zh-TW` 间有 fallback。
- **设置与存储**：
  - `context.extensionSettings`——全局纯对象，每个扩展用自己的命名空间键；改后调 `context.saveSettingsDebounced()`。
  - `context.saveSettings(loopCounter?, options?)`——可 await 版，绕过 debounce 队列并在网络往返完成后 resolve（罕用，几乎都应优先 debounced 形式）。
  - `context.saveMetadataDebounced()`——`chat_metadata` 变更的防抖包装。
  - `getExtensionManifest(name)`——返回命名扩展 manifest 的结构化克隆；接受短名（`SillyTavern-MyExt`）或内部键（`third-party/SillyTavern-MyExt`）；查找大小写与重音不敏感；找不到返回 null。
  - `openThirdPartyExtensionMenu(suggestUrl?)`——打开第三方扩展安装对话框。
  - `context.accountStorage`——账号作用域 KV 存储（`getItem` / `setItem` / `removeItem` / `getState`）；值被强制转字符串；经 `saveSettingsDebounced` 持久化。用于应跨聊天存活但不随角色卡导出的用户特定设置。
- **调试**：`registerDebugFunction(functionId, name, description, func)`——在用户设置调试菜单加按钮。
- **Data Bank 抓取器**：`registerDataBankScraper({id, name, description, iconClass, iconAvailable, init?, isAvailable, scrape})`。`id` 重复注册被拒；`scrape()` 返回的 `File[]` 加进 bank。
- **Tokenization**：`getTokenCountAsync(text, padding?)`（按 `${tokenizerType}-${hash}${modelHash}+${padding}` 缓存；空输入返回 0）、`getTextTokens(tokenizerType, text)` → token ID 数组（不支持编码的 tokenizer 返回 `[]`）、`getTokenizerModel()`、`context.tokenizers` = `{NONE, GPT2, OPENAI, LLAMA, LLAMA3, MISTRAL, GEMMA, CLAUDE, ...}`。
- **工具函数**：`uuidv4()`、`timestampToMoment(timestamp)`、`humanizedDateTime(timestamp?)`（`YYYY-MM-DD@HHhMMmSSsMSms` 文件名友好格式）、`isMobile()`、`shouldSendOnEnter()`、`context.escapeHtml(str)`、`context.download(content, fileName, contentType)`、`context.getFileText(file)`、`context.getStringHash(str, seed?)`（稳定 32 位 FNV-like 哈希，非加密）、`context.createThumbnail(dataUrl, maxWidth?, maxHeight?, type?)`、`context.isValidUrl(value)`、`context.performFuzzySearch(type, data, keys, searchValue, fuzzySearchCaches?)`（Fuse.js 模糊匹配，限定到命名索引 `'characters'` / `'groups'` / `'tags'` 等）。
- **Lib Bundle**：`context.lib` = `{DOMPurify, lodash, DiffMatchPatch, showdown, yaml}`——避免按插件重新打包或依赖全局。
- **Secrets**：`context.secrets.KEYS`（`OPENAI`、`CLAUDE`、`MISTRALAI` 等知名 secret 槽标识目录）；`context.secrets.state`（每个槽是否已填充的实时布尔映射，只读快照，变更不持久化）。
- **Embedding Service**：`context.embeddingService.embed(items, options?)` → `Promise<number[][]>`；vectors / memory-graph 子系统共享的向量嵌入服务。
- **符号与常量**：`context.symbols.ignore`（IGNORE_SYMBOL 哨兵，"别动这个值"）；`context.constants.unset`（UNSET_VALUE，传给 `writeExtensionField` / `writeExtensionFieldBulk` 时删除键而非设 null）；`context.constants.promptRoles` = `{SYSTEM, USER, ASSISTANT}`；`context.constants.promptTypes` = `{NONE, IN_PROMPT, IN_CHAT, BEFORE_PROMPT}`。
- `context.CONNECT_API_MAP`（支持的 API source 标识与 UI 元数据目录）；`context.createModelIcon(apiName, modelName?)`（返回内联 SVG 品牌图标）；`context.mainApi`（`'openai'|'kobold'|'novel'|'textgenerationwebui'`）、`context.maxContext`、`context.menuType`（`'characters'|'character_edit'|'create'|'group_create'|'group_edit'|''`）。

**可提炼为 skill 的知识点**：扩展间通信 skill（registerExtensionApi / getExtensionApi + 惰性解析 + 依赖缺失降级）、i18n 插件本地化 skill（`` t`` `` 模板 + addLocaleData 时机 + 中英 fallback）、插件设置持久化选型（extensionSettings / accountStorage / character state）。

---

### Low-Level Endpoint Reference — https://luker.cups.moe/development/extension-api/low-level-endpoints.html

**核心内容摘要**

- **警告**：这些端点仅作为高级调试与集成场景的参考，是**同源 Web 应用路由**，不是主要插件 API 契约。正常插件开发应使用 Context API。
- 角色聊天：`POST /api/chats/save`（patch-first）、`/api/chats/get`、`/api/chats/delete`、`/api/chats/rename`、`/api/chats/export`。
- 群聊：`POST /api/chats/group/save` / `/get` / `/delete`。
- Chat State：`POST /api/chats/state/get`（批量读）、`/state/patch`（增量更新）、`/state/delete`。
- 设置：`POST /api/settings/save`（patch-first）、`/api/settings/get`。
- World Info：`POST /api/worldinfo/save`（patch-first）、`/api/worldinfo/get`。
- 搜索/访问：`POST /api/plugins/search/search`、`/api/plugins/search/visit`（访问 URL 并抽取内容）。
- **Patch 操作格式**：消息 patch 用 RFC 6902 JSON Patch：

```json
[
  { "op": "replace", "path": "/4/mes", "value": "New content" },
  { "op": "add", "path": "/4/extra/note", "value": "Note" },
  { "op": "remove", "path": "/4/extra/old_field" }
]
```

  - 对象 patch（`meta/patch`、`state/patch`、`settings/patch`、`worldinfo/patch`）也用同一 RFC 6902 格式。
  - **冲突与完整性语义**：服务端校验 patch 路径是否存在——`replace` 要求目标路径已存在；`add` 创建不存在的路径；冲突时返回错误，客户端应重试或回退到全量保存。
- **Chat-Completions 请求体**：`{messages, model, secret_id}`——`secret_id` 允许在请求级覆盖使用的 API key，适合多智能体编排需要不同 key 的场景。

**可提炼为 skill 的知识点**：RFC 6902 patch 语义 skill（replace vs add 的存在性要求、冲突处理策略）、"优先 Context API 而非裸 HTTP" 的决策依据。

---

### Message Takeover — https://luker.cups.moe/development/extension-api/message-takeover.html

**核心内容摘要**

- 插件可为某个回合**声明接管**，主 LLM 完全不调用——插件把文本与 reasoning 写进 buffer-only 编辑器 handle，内核负责放进聊天、持久化、跑 regex/清理后处理、发生命周期事件、以及插件 discard 时回滚。
- **Buffer-only 内核**：handle 是纯文本/reasoning 缓冲，不碰 chat、不发 ST 事件、不渲染任何东西——那些是内核职责。更高级的编辑助手（增量追加、结构化 patch、流管道）在插件代码里。编排器扩展提供参考实现 `public/scripts/extensions/orchestrator/editor-ops.js`。
- **钩子事件**：core `Generate()` 路径在 LLM payload 完全组装后、任何分发**之前**发 `event_types.GENERATE_TAKEOVER_DISPATCH`。订阅者通过填充 `eventData.takeoverHandle` 声明接管：

```js
context.eventSource.on(context.eventTypes.GENERATE_TAKEOVER_DISPATCH, async (eventData) => {
  if (!shouldTakeover(eventData)) return;
  const { originalText, originalReasoning } = resolveOriginals(eventData.type, context.chat);
  const handle = context.createMessageEditorHandle({
    generationType: eventData.type, originalText, originalReasoning,
    abortSignal: eventData.abortSignal, owner: 'my-plugin',
  });
  eventData.takeoverHandle = handle;
  void (async () => {
    try {
      for await (const chunk of streamFromMyBackend(eventData)) handle.setText(handle.getText() + chunk);
      await handle.commit();
    } catch (err) {
      if (err.name === 'AbortError' || eventData.abortSignal.aborted) await handle.abort();
      else await handle.discard();
    }
  })();
});
```

- **事件 payload**（`DispatchEventData`）：`type`（`'normal'|'regenerate'|'swipe'|'continue'`；其他类型跳过该事件）、`isContinue`、`forceName2`、`isStreamingEnabled`（用户会话级偏好，同门控主 LLM 路径的 `isStreamingEnabled()`）、`finalPrompt`、`generateData`、`takeoverHandle`、`abortSignal`。无订阅者声明则正常 LLM 分发继续；多订阅者争抢时**第一个 claim 生效**，后续赋值打 warning 日志。**`quiet` 与 `impersonate` 生成类型不发此事件**。
- **三个终态**（互斥；一旦定型再调另两个会抛 `editor_committed` / `editor_aborted` / `editor_discarded`；重复调同一终态是 no-op）：

| 方法 | 插件何时调 | 内核响应 | `outcome.status` |
| --- | --- | --- | --- |
| `commit()` | 自然完成，插件产出最终输出 | 完整 finalize 管线：发 `MESSAGE_RECEIVED` / `CHARACTER_MESSAGE_RENDERED`、跑 regex/清理后处理、经 `appendChatMessages` / `saveChatConditional` 持久化、触发 auto-features（autoContinue、swipe init）、解阻塞 UI | `committed` |
| `abort()` | 用户回合中途取消——保留已流出的内容但不持久化 | 同步把部分内容写进 chat slot 并重绘；跳过 finalize 管线（不发事件、不保存、不 autoContinue）；有条件解阻塞 UI（仅当没有后续生成抢到锁） | `aborted` |
| `discard()` | 显式回滚，部分输出不可用 | 回滚：把占位符从 chat 中摘出（normal / regenerate）或恢复原 `mes` / `reasoning`（continue / swipe）；发 `GENERATION_STOPPED`；解阻塞 UI | `discarded` |

- **用户停止时优先 `abort()`**：用户点 stop 想保留部分输出可读，但不希望被固化——对已中止的部分输出跑完整 finalize 管线会与用户随后点的 regenerate 竞争（finalize 管线含多个 await yield，期间下一次 `Generate()` 可以启动）。仅当部分输出会主动误导时用 `discard()`。
- **职责划分**——插件负责：监听分发事件并决定是否接管；按 generation 类型构造带合适 `originalText` / `originalReasoning` 的 handle；经 `setText` / `setReasoning` 写入最终文本与 reasoning；调恰好一个 `commit()` / `abort()` / `discard()` 定型。内核负责：把占位消息推进 chat（normal）或复用现有 slot（regenerate / swipe / continue）；经 `addOneMessage` 渲染占位、经 `appendChatMessages` 持久化；订阅 handle 的节流 `onUpdate` 做实时重绘；handle 定型后路由到匹配的清理管线。**内核不会定时触发 abort**——用户点 stop 时 abort 信号经 `eventData.abortSignal` 传播，插件应遵守；忽略 abort 信号会让 handle 永久 pending（这是插件 bug）。
- **handle 接口**：`getText()` / `getReasoning()` / `setText(text)` / `setReasoning(text)` / `commit()` / `abort()` / `discard()` / `readonly complete`（→ `{status, finalText, finalReasoning}`）/ `readonly abortSignal` / `setOnUpdate(fn)`（内核面向，插件通常不需要）。`CreateOpts`：`generationType`、`originalText?`、`originalReasoning?`、`abortSignal?`、`flushIntervalMs?`（默认 33，onUpdate 节流窗口）、`owner?`。
- **continue 前缀不变式**：`opts.generationType === 'continue'` 时，若 `newText` 不以 `opts.originalText` 开头，`setText` 被拒并抛 `invalid_op_for_continue`。做 continue 的插件必须在前缀之上累积。
- **错误码**：`invalid_generation_type`、`invalid_argument`、`editor_committed`、`editor_aborted`、`editor_discarded`、`invalid_op_for_continue`。`TakeoverError` 携带 `code`、`message`、可选 `cause` / `details`。
- **更高级编辑模式**（内核刻意不提供，属策略而非状态管理）：编排器在 `editor-ops.js` 实现 `appendText` / `appendReasoning`、`insertAt` / `replaceRange` / `deleteRange`、`applyPatch`（kinds：`replace_range`、`insert_at`、`delete_range`、`context_replace`）、`patchBySemantic({find, replaceWith, occurrence?})`（git 风格 context_replace，Aider / Claude Code / Cursor 风格，字节精确匹配，无启发式恢复）、`pipeFrom(handle, stream, opts?)`（消费 `AsyncIterable<StreamChunk>`，`mode: 'append'|'replace'`）。
- **三层暴露**：Layer 1 `import { createMessageEditorHandle, GENERATE_TAKEOVER_DISPATCH, TakeoverError } from 'public/scripts/message-takeover.js'`；`getContext()` 层 `Luker.getContext().createMessageEditorHandle(...)` + `Luker.getContext().eventTypes.GENERATE_TAKEOVER_DISPATCH`；ext ctx 层 `ctx.lukerContext.createMessageEditorHandle(...)`。

**可提炼为 skill 的知识点**：Message Takeover skill（三终态选型 + 用户停止时 abort vs discard 的竞态论证 + continue 前缀不变式）。

---

### Orchestrator Tools API — https://luker.cups.moe/development/extension-api/orchestrator-tools.html

**核心内容摘要**

- 用途：你的扩展提供某种编排智能体可自主调用的能力（数据库查询、第三方 API、Stable Diffusion 图像生成等）。用户装了编排器扩展时，你的工具出现在编排编辑器的 **Custom tools → Extension (from other plugins)**，用户可按 profile 启停。
- **若用户没装编排器，register 调用是静默 no-op**，你的扩展独立仍可用。
- **三种等价入口**（解析到同一函数引用）：

```js
import { getExtensionApi } from '/scripts/extensions.js';
const orch = getExtensionApi('orchestrator');          // 1. 最常见
if (orch) orch.registerOrchestrationTool({...});
ctx.getExtensionApi('orchestrator')?.registerOrchestrationTool({...});  // 2. 经 ctx
import { registerOrchestrationTool } from '/scripts/extensions/orchestrator/register-custom-tool.js';  // 3. 直接 ESM（仅限 Luker 树内）
```

  **必须 guard 编排器不存在的情况**，让扩展保持独立可用。
- `registerOrchestrationTool(spec)`：

```ts
{
  name: string,          // /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/；不得与内置工具或其他扩展工具冲突
  description: string,   // 给 LLM 的，不是给用户的
  parameters: object,    // OpenAI 风格 JSON Schema
  exec: async (args, ctx) => any,
  mode: 'read' | 'write',// 必需。write 工具在模拟审查期间被隔离
  simulate?: async (args, ctx) => any,  // 可选。模拟审查期间代替 exec 被调；没有它则 write 工具返回占位结果 { ok: true, simulated: true, unvalidated: true }
  displayName?: string,
}
```

  `exec` 收到 LLM 解析后的参数与编排 ctx，返回值成为 LLM 看到的工具结果；抛错以暴露工具错误。
- **ctx 参数**：由 ST 的 `getContext()` 经原型继承构建，另挂几个编排专属字段为自有属性。
  - 继承自 ST：`ctx.chat`、`ctx.characters`、`ctx.characterId`、`ctx.groups`、`ctx.groupId`、`ctx.name1`、`ctx.name2`、`ctx.eventSource`、`ctx.eventTypes`、`ctx.getExtensionApi(name)`、`ctx.registerOrchestrationTool`、`ctx.bridgeSillyTavernTool` 等。
  - 编排运行时挂载（仅在活动编排内存在）：`ctx.__lukerRun`（per-run 状态；`__lukerRun.activatedEntryKeys` 是本回合已注入的 WI 条目键的 Set，作 lorebook 类工具的 dedup 提示；`__lukerRun.abortSignal` 是本 run 的 abort 信号，可取消工作须遵守）、`ctx.__floorStateForNotes`（`note_open` / `note_close` 背后的 floor-state 实例）、`ctx.__customToolRegistry`（per-run Layer-3 手写工具注册表，多数工具不需要）、`ctx.__memoryGraphSession`（本 run 首次 `memory_*` 工具调用时惰性打开，之前不存在）。
  - **命名约定**：ST 拥有顶层键，编排器只加 `__` 前缀字段，命名空间不冲突。保守使用——只依赖你的工具真正需要的字段。
- **错误**：`exec` 与 `simulate` 可抛错。普通 `Error` 可以；附加 `{code, hint}` 给出 LLM 可恢复的结构化失败：

```js
throw Object.assign(new Error('Database is read-only.'), {
  code: 'DB_READONLY', hint: 'Wait for the next write window or use a different store.',
});
```

  编排器把你的错误包进内部 `ToolError` 形态后以 `role: tool` 消息交回 LLM。
- `unregisterOrchestrationTool(name)`；`listExtensionTools()` → 每个已注册扩展工具的 `{name, mode, description, displayName, hasSimulate, source}`。
- **ST 函数工具桥**：若你的扩展已用 ST 的 `registerFunctionTool`，用户可通过编排编辑器的 "Bridge SillyTavern tools…" 选择器桥接。桥接工具取名 `st_<你的工具名>`，默认 `mode: 'write'`，你侧无需改代码。用 `registerOrchestrationTool` 包装则可控制 mode 与 simulate 语义。编程驱动桥接：`listAvailableSillyTavernTools()` / `bridgeSillyTavernTool(name, {mode})`。
- **per-character override 访问器**（`'orchestrator'` 扩展 api 发布的六个访问器 + 一个写助手）：`getCharacterOverrideByAvatar(ctx, avatar)`、`getCharacterIndexByAvatar(ctx, avatar)`（找不到返回 -1）、`getCharacterExtensionDataByAvatar(ctx, avatar)`（读完整 `character.data.extensions.orchestrator` blob；写时要展开以保留无关子键）、`normalizeCharacterOverrideMode(override)`（从现存子载荷 spec/agenda/loop/director 与最新 `updatedAt` 钉住 `override.mode`；原地改并返回）、`applyCharacterExecutionModeForAvatar(ctx, settings, avatar)`（把 `settings.executionMode` 重新同步到 per-character 保存的 mode；变了返回 true。**不做这一步，切换 mode 的 override 会被静默忽略**）、`persistOrchestratorCharacterExtension(ctx, characterIndex, modulePayload)`（经 `ctx.writeExtensionField` 持久化整个 `extensions.orchestrator` blob；传 null 删除 blob）。**这些访问器只碰角色卡，从不改全局编排设置**。
- **Iter-studio skill 工具目录**（三个属性）：`SKILL_ITER_STUDIO_TOOL_DEFS`（OpenAI 形态工具定义数组，即编排器 iter-studio 暴露的 17 个 `skill_*` 工具；按 `function.name` 过滤取子集）、`isSkillIterStudioTool(name)`、`runSkillIterStudioTool(call, mutationCtx)`（`mutationCtx = {getWorkingProfile}`；纯 inventory/authoring/migration handler 忽略它；policy-binding handler（`skill_bind_to_agent` / `skill_unbind_from_agent` / `skill_set_mode_defaults` / `skill_replace_in_systemprompt`）要求 `getWorkingProfile()` 返回可变的编排工作 profile）。无编排工作 profile 的兄弟弹窗传 `{getWorkingProfile: () => null}`，只暴露 profile 无关的 handler。
- 参考消费方：memory-graph 扩展通过该 API 发布其读写工具（`registerMemoryGraphOrchestrationTools()` 从 init handler 调一次）。

**可提炼为 skill 的知识点**：编排器工具注册 skill（三入口 + guard 降级 + mode/simulate 语义）、`__lukerRun` 等编排专属 ctx 字段用法、per-character override 的"必须重新同步 executionMode"陷阱。

---

### Memory Graph Extension API — https://luker.cups.moe/development/extension-api/memory-graph.html

**核心内容摘要**

- **状态：实验性**（按 spec §9，2-3 个 minor 版本内可能破坏性变更；字段语义会保留但字段名与签名可能变）。
- 入口：推荐 `getExtensionApi('memory-graph').openSession(context)`（session facade）；低层 `getMemoryGraphReadApi(store, context)`、`getMemoryGraphWriteApi(store, context, options?)`（`options.onCommit` 把变更刷到 floor-state）。
- **第三方扩展应始终走 `getExtensionApi('memory-graph')`，绝不直接 import `memory-graph/*.js`**。
- `openSession` 每次解析当前聊天的 store 快照；切聊天或想读到别处路径的在途编辑时再调一次（session 打开很廉价）。**空 store 也有可写 session**——读方法返回空数组，写方法填充 store 并走原生提取管线同样的 floor-state 路径持久化，所以新聊天首次写入无需任何前置设置。
- **`openSession` 返回 null 的三种情况**：memory-graph 扩展未加载；context 无法解析到 chat target（无 chatId，或缺 `createFloorState`——典型于没完全 mock ST context 的测试运行器）；运行时 store 从 floor-state 加载失败（罕见，打 `console.warn`）。编排器的 `memory_*` loop 工具把 null session 翻译成 `ToolError(MEMORY_DISABLED)`。
- **session 的 16 个方法**：

| 方法 | 返回 | 说明 |
| --- | --- | --- |
| `listVisibleCandidates(opts)` | NodeView[] | 原生 recall LLM 看到的池 |
| `getEdgeSummary(id, opts)` | EdgeSummaryView | 度数 + 关系 + 样本邻居 |
| `getNodeBrief(id, opts)` | NodeBriefView \| null | 完整 brief 含 fields + edges |
| `expandFromSeeds(ids, opts)` | NodeView[] | 对种子集做 BFS 扩展 |
| `getSchema()` | SchemaView | 活动节点类型 schema |
| `keywordSearch(opts)` | RankedView[] | 可见节点上的 token 重叠 |
| `vectorSearch(opts)` | Promise\<RankedView[]\> | 嵌入搜索；抛 `NO_EMBEDDING_PROFILE` |
| `findByName(opts)` | `{matches: NodeView[]}` | 精确/子串标题 + 主键匹配 |
| `compactionCandidates(opts)` | `{groups: ...}` | 可滚动的语义根 |
| `createNode(op)` | `{id}` | 创建节点 |
| `editNode(op)` | `{ok}` | patch 字段 / 改名 |
| `deleteNode(op)` | `{ok}` | 归档（软删除） |
| `upsertLinks(op)` | `{applied}` | 加/更新边 |
| `deleteLinks(op)` | `{removed}` | 删特定边 |
| `compactNodes(op)` | `{rollupNodeId}` | 把子节点滚进语义父节点 |
| `applyExtractionBatch(input)` | `{applied, rejected}` | 一次性多 op 批量 |

  **每个写方法都是 async，要 await**。
- **per-character override 访问器**（六个）：`getSchemaScopeInfo(ctx, settings?)` → `{avatar, hasAvatar, characterName, hasOverride, scope, schema}`（`scope` 区分 `'character'` override 与 `'global'` fallback）；`getAdvancedScopeInfo(ctx, settings?)`；`persistCharacterSchemaOverride(ctx, avatar, schema)`（经 `normalizeNodeTypeSchema` 消毒）；`removeCharacterSchemaOverride(ctx, avatar)`；`persistCharacterAdvancedOverride(ctx, avatar, advanced)`；`removeCharacterAdvancedOverride(ctx, avatar)`。**只碰 `character.data.extensions.memory_graph.{schemaOverride, advancedOverride}`，从不改全局 memory-graph 设置**。
- **Lookup API**（只读、冻结的节点/边访问，供外部前端如内联消息 UI、侧边栏查看器用，无需开完整 session）：`getNodeById(ctx, id)`、`getNodesByIds(ctx, ids)`（结果按输入顺序对齐，null 标记缺失/无效 id）、`findEventBySeq(ctx, seq)`（找 floorRange 覆盖 seq 的非归档 event 节点；重叠时 seqTo 最高者胜）、`findEventBundleBySeq(ctx, seq)` → `{event, location, characters}`（location 经 `occurred_at` 链、characters 经 `involved_in` 链）、`getAssistantSeqForMessageIndex(ctx, messageIndex)`、`getCurrentInjection(ctx)`、`getLastRecallProjection(ctx)`。每个 lookup 对活动 store 开一个短命 read-api 工厂；连续多次 lookup 应批量走 `openSession()`。
- **`getLastRecallProjection(ctx)`** 返回 "View Last Injection" UI 按钮可视化的同一份数据——memory-graph 上一次 recall pass 交给主聊天 prompt 的确切文本。`projection.blocks.corePacket`（始终注入的持久记忆文本）、`projection.blocks.focusPacket`（recall 选中的 markdown 表格文本）、`projection.at`（recall 落定的 ms 时间戳）。store 无法加载或本聊天还没跑过 recall 时返回 null。返回的是冻结的防御性副本；两个 blocks 字段总是字符串（空 packet 时是空字符串），绝不 undefined。
- **变更订阅**：`onStoreCommit(cb)`（cb 收 `{chatKey}`；在 session 写或 recall 重放 commit 落地后触发；返回幂等 unsubscribe）、`offStoreCommit(cb)`（对称移除，返回 boolean）、`onInjectionChanged(cb)`（cb 收 `InjectionState`；主流程 recall 管线落定新注入决策时触发）。**监听器错误被捕获并记日志，一个坏订阅者不会阻塞其他**。原始 store 引用不暴露。
- **Type Reference**（全部返回深冻结的纯对象，带 `ReadonlySet` 处为冻结 Set 包装）：
  - `NodeView`：`id`、`type`（`'event'` / `'character_sheet'` / ...）、`level`（`'episodic'|'semantic'`）、`title`、`fields`（与 schema 的 tableColumns 对齐的行载荷）、`seqTo`、`parentId`（无父为 `''`）、`childrenIds`、`archived`、`semanticRollup`、`semanticDepth`。
  - `EdgeView`：`from`、`to`、`type`（`'related'` / `'mentions'` / `'contains'` / `'semantic_contains'` / ...）、`weight?`（仅 `projectEdges()` 输出有）。原始边（`listEdges`、`getNeighbors`）从不带 weight；投影边（`projectEdges`）带聚合后的 weight。
  - `NeighborView`：`node`、`edgeType`、`direction`（`'in'|'out'`，相对于源节点）。
  - `EdgeSummaryView`：`degree`、`relations`（`{relation, direction, count}[]`）、`sample_neighbors`（`{id, type, title, to_seq}[]`，默认 8 个）。**字段名是 snake_case 以匹配原生 LLM prompt block**。
  - `InjectionState`：`alwaysInjectIds`（被其类型的 `alwaysInject` 标志钉住的节点）、`recallSelectedIds`（route LLM 上回合挑中的节点）、`visibleIds`（route LLM 看到的候选池；recall 管线至少跑过一次前为空）。
  - `LastRecallProjection`：`at`、`blocks.{corePacket, focusPacket}`。
  - `SchemaSpecView`：`type`、`tableName`、`tableColumns`、`requiredColumns`、`primaryKeyColumns`、`forceUpdate`、`alwaysInject`、`editable`、`compressionMode`（`'none'|'hierarchical'|string`）。
  - `SchemaView`：`{types: SchemaSpecView[]}`。
  - `NodeBriefView`：`id`、`level`、`type`、`tableName`、`title`、`summary`、`keyValues`（primaryKeyColumns 投影）、`rowValues`（其余投影列）、`toSeq`、`childCount`（活动的非归档子节点）、`exposure`（`'high_only'|'full'`）、`edgeSummary`、`alwaysInject`。
- **Layer A: Data Access**：
  - `listNodes(filter?)`——`filter = {types?, levels?, activeOnly?, seqRange?}`；默认 `activeOnly: true`（排除归档节点与 recall 诊断节点，同原生 `collectAlwaysInjectNodes` 的过滤）；按 `compareNodesByTimeline`（seqTo 升序，id 决平）排序，**与 `listVisibleCandidates`（按 `compareNodesByRecency`：seqTo 降、depth 降、id 字典序）不同**。用于离线扫描全 store——调试、一次性统计、穷举迭代。
  - `getNode(id)` → `NodeView | null`；**不过滤 archived**（归档节点返回时 `archived: true`）；空白/空 id 返回 null。
  - `listEdges(filter?)`——`filter = {from?, to?, types?, excludeInternal?}`；返回**原始存储侧边，非投影**（无 weight 聚合、无 rollup 替换）；`excludeInternal: true` 剥离层级簿记边 `contains` 与 `semantic_contains`。
  - `getSchema()` → 角色生效 schema（`getEffectiveNodeTypeSchema(context, settings)`，角色 override 已应用）。
- **Layer B: Topology Navigation**：
  - `getNeighbors(id, options?)`——`{edgeTypes?, direction? = 'both', projectTo? = 'raw'}`；`projectTo: 'raw'` 按存储原样；`'visible'` 把每个原始邻居 id 经 `getNearestVisibleAncestorId` 对当前 `visibleIds` 替换，滚不进可见集的邻居被丢弃；传 `string[]` 则对调用方给的可见集做同样替换。归档邻居总被过滤。按 `(neighborId, edgeType, direction)` 去重。
  - `getAncestor(id, options?)`——`{activeOnly? = true, predicate?}`；严格向上走 `parentId`（输入节点自身永不是结果）；默认 `activeOnly: true` 时遇到归档祖先返回 null；有 `predicate` 时返回第一个满足的祖先，无则返回直接父节点；**循环安全**（追踪已访问 id）。
  - `getDescendants(id, options?)`——`{activeOnly? = true, maxDepth? = Infinity}`；对 `childrenIds` 做 BFS；按 BFS 顺序返回；不含根节点自身。
- **Layer C / D / Write API**：后续章节（`compactionCandidates`、`compactNodes` 等）。`compactNodes(options)`：`{type, childIds, summary, fields?}` → `{rollupNodeId}`；创建更高层 rollup 节点、把给定 childIds 重新挂到它、加 `semantic_contains` 边；与内部压缩循环共享 `createRollupWithChildren`，所以智能体驱动与原生路径产生相同 rollup 形状。抛 `{code:'BAD_ARGS'}`（type 缺失、childIds 空、summary 空）、`{code:'CHILD_NOT_FOUND'}`、`{code:'CHILD_HAS_PARENT'}`（子节点已有同类型的 rollup 父）。
- **兼容性**：`external-api.js` 的 legacy 导出（`getCurrentlyInjectedNodeIds`、`__recordInjectedNodeIds`、`applyMemoryGraphInjectionUpdate`、`createEmptyInjectionState`）保留，现有插件无需改。两个工厂不污染 legacy 命名空间。
- **性能**：`listNodes` / `listEdges` 遍历全 store——仅用于离线/一次性分析，成本随节点/边数线性增长。`listVisibleCandidates` 是热路径等价物，等价于一次原生 `collectRootCandidates` 调用，预应用 recall 侧过滤。`getEdgeSummary` / `projectEdges` **不缓存**——每次从原始边重算（典型 recall 负载每回合 1-2 次可接受；若在热循环里逐候选调 `getEdgeSummary`，自行按可见 id 集缓存）。`keywordSearch` 是纯 token 重叠（同步、总可用、无 recency fallback）；`vectorSearch` 依赖向量索引已建且嵌入 profile 已配置，**抛 `NO_EMBEDDING_PROFILE` 而非静默回退**（调用方自己选 fallback，通常是 `keywordSearch`）。Write-API op 在批边界持久化 store 并重建下游索引（vector / edge summaries）——多个 op 属于同一逻辑动作时**优先 `applyExtractionBatch`** 而非一串原语调用。返回的 view 在构造时惰性冻结，重复冻结已冻结对象是 no-op。

**可提炼为 skill 的知识点**：Memory Graph 集成 skill（openSession 16 方法 + 空 store 可写 + null 的三种情形 + 冻结视图契约）、`getLastRecallProjection` 复用主 LLM 记忆上下文、性能注意（list* 离线用、vectorSearch 需 profile）。

---

### Character Editor Assistant Extension API — https://luker.cups.moe/development/extension-api/character-editor-assistant.html

**核心内容摘要**

- CEA 扩展通过 Luker 扩展注册表发布三个助手，让其他插件自有的 iteration studio 复用 CEA 的助手工具面，无需跨插件 import。
- **为什么存在**：CEA 拥有迭代弹窗读写角色卡及其 lorebook 所需的助手工具——`lorebook_query` / `lorebook_list` / `lorebook_get`（lorebook 读）、`world_book_list`（列出角色可见的世界书）、`simulate_prompt`（dry-run prompt 并捕获 prompt + WI 命中）、以及把 AI 提议翻译成可提交编辑的卡字段 + 条目写工具。兄弟 iter-studio 此前经直接 ES-module import 拉取它们，耦合到 CEA 内部文件路径并破坏插件↔插件边界；该扩展 api 取代了这种耦合。
- API 面：

```js
const cea = SillyTavern.getContext().getExtensionApi('character-editor-assistant');
if (!cea) {
  // CEA 未安装；依赖这些助手的 iter-studio 弹窗应拒绝打开并给出清晰的 "install CEA" 错误
  return;
}
const helperApis = cea.buildCharacterEditorHelperApis(context, { avatar });
const toolResult = await cea.runCharacterEditorHelperToolCall(call, helperApis);
await cea.applyCharacterEditorLorebookProposal(context, { kind, args });
```

- `buildCharacterEditorHelperApis(context, opts?: {avatar?})` → `Array<{isToolName: (n) => boolean, invoke: (call) => Promise<any>}>`。返回的数组**总是含四个助手**（lorebook 读、lorebook 写、simulate、world-book-list），另加当 `globalThis.Luker.searchTools` 接好时的可选第五个 web search 助手。`opts.avatar` 把 lorebook / world-book-list API 限定到正确的卡；弹窗是全局时省略。
- `runCharacterEditorHelperToolCall(call, helperApis)`——分发一次助手工具调用；按 `isToolName` 找匹配助手并转发；无匹配时抛 `Unsupported helper tool: <name>`。这是 iter-studio 弹窗注入到共享 `iteration-library/tools/lorebook-reads.js` 与 `lorebook-writes.js` 的分发器（那些模块插件无关，每次调用收到分发器）。
- `applyCharacterEditorLorebookProposal(context, {kind, args})`——**对条目的当前盘上状态重新推导 lorebook 提议的 after-image 并提交**。`kind` 是 `'update'` 或 `'str_replace'`。这样在不信任提议时捕获的快照的前提下提交 AI 提议的 lorebook 编辑——对当前状态重新推导让同一 `book#uid` 的多提议链能正确提交，并把并行会话漂移暴露为新的校验错误而非静默覆盖。
- **惰性解析 api**：弹窗应在**打开时**解析 api，而非模块加载时。CEA 可能比消费者的模块求值注册得晚；推迟查找也让弹窗在依赖缺失时向用户给出清晰的 "install CEA" 错误。

```js
function getCea() {
  const api = SillyTavern.getContext().getExtensionApi('character-editor-assistant');
  if (!api) throw new Error('This iteration popup requires the character-editor-assistant extension.');
  return api;
}
```

**可提炼为 skill 的知识点**：跨插件能力复用 skill（registerExtensionApi + 惰性解析 + 依赖缺失降级错误）、lorebook 提议的"重新推导 after-image"防漂移模式。

---

### Iteration Studio Framework — https://luker.cups.moe/development/extension-api/iteration-studio.html

**核心内容摘要**

- AI 驱动迭代编辑 adapter 提供制品的共享弹窗外壳。外壳驱动对话、工具分发、漂移感知 apply、历史列表与 approve/reject UI；插件（经 adapter）提供编辑什么、哪些工具提议改动、会话存哪。
- 树内两个参考 adapter：`orchestrator/iteration-adapter.js`（编辑编排 profile：spec / agenda / loop）、`memory-graph/schema-adapter.js`（编辑 memory-graph 节点类型 schema）。
- **每回合流程**：1) 用户输入请求点 Send；2) 外壳带 adapter 的工具目录（加 adapter 声明的外壳注入控制工具）问 LLM；3) 对每个返回的工具调用，adapter 归一化成 op 化的 `Edit` 列表（见 edits-lib）；4) 外壳经 edits 库对 `adapter.live()` 应用编辑，apply 时逐编辑检测漂移；5) 批准后的改动经 `adapter.commit(newLive)` 提交回去。**只要本轮发出任何工具调用，外壳就自动继续**（程序驱动，由工具调用存在性决定）；无工具调用的纯文本响应结束迭代并把控制权交回用户。
- **外壳不携带制品的工作副本**。`adapter.live()` 是唯一权威，外壳需要当前值时总是新鲜调用。
- **何时不用 iteration-studio**：若你的界面需要视口所有权（全屏 IDE、移动端接管），或已有想保留的成熟独立 UI，直接用 edits-lib——从 `/scripts/lib/edits/index.js` import `applyEdits` / `inverseEdit` / `showConflictResolution` 并自持 UI。树内参考是 CardApp Studio（`extensions/character-editor-assistant/studio/`）。
- **最小 adapter**（`defineAdapter` + `openIterationStudio`）字段：`id`、`title`、`mode`、`layout`（`'popup'|'split'`）、`i18n`、`i18nFormat`、`live()`、`commit(newLive)`、`sessionScope()`、`listSessions` / `loadSession` / `saveSession` / `deleteSession`、`buildSystemPrompt()`、`buildUserPrompt(session, userText)`、`buildToolCatalog()`、`normalizeToolCallToEdit(call)`、`renderMessageCard(message)`、`renderHistoryItem(meta)`。整个 adapter 就这些——外壳处理弹窗 chrome、对话渲染、历史列表、自动继续、abort 管线、LLM 重试/超时、漂移感知 apply、冲突 UI 与回滚。
- **权威模型**：`adapter.live()` 是唯一真源；外壳从不缓存工作 profile，每次渲染与每次 apply 都重读 `live()`；`adapter.commit(newLive)` 是唯一写路径（adapter 决定去哪：扩展设置、角色状态、IndexedDB、远程 API）；漂移检测在 apply 时逐编辑经 edits 库完成；回滚用 `inverseEdit(edit)` 对消息的 `appliedEdits` 数组逆序迭代再重新 commit。**制品在 studio 之外始终可编辑**——studio 只是众多编辑器之一。
- **工具分发**：`buildToolCatalog(session)` 返回 adapter 的可编辑 + 自定义控制工具。外壳**不注入任何 continue / finalize 控制工具**——多轮自动继续循环由工具调用存在性程序驱动。需要弹窗侧控制工具（如 reset-state 便利）的 adapter 在自己的目录里声明并像其他 adapter 专属控制工具一样经 `classifyToolCall` / `executeControlToolCall` 路由。
- 可编辑调用进 `normalizeToolCallToEdit(call, {session, live})` → `Edit[] | null | Promise<...>`；返回 null 跳过该调用。
- **Sandbox-diff 模式**（已有可用的原地 mutator 时的快速引导）：1) 把 live clone 成 sandbox profile；2) 对 sandbox 跑现有 mutator；3) 发一条粗粒度 `{op:'set', path:'', oldValue: live, newValue: sandbox}` 编辑。**两个参考 adapter 都用这个模式**——足以发布但会产生 profile 级冲突（任何并发改动都与整批碰撞）。生产级冲突解决要把每个工具调用归一化成逐字段 op（set / str_replace / list_insert 等）。
- adapter 声明的控制工具经 runner 的 `isControlCall` 谓词路由到 `onControlCall` handler，而非归一化到编辑路径；外壳把它们计为工具调用用于自动继续（任何控制工具发出仍触发下一轮）。
- **Runner 设置**（三个旋钮影响每次 LLM 往返：重试、每分钟请求上限、流式传输）：adapter 经 `getRunnerSettings(settings)` 选择加入 → `{toolCallRetryMax? = 0, rpmLimit? = 0（0 = 无上限）}`。返回 null/undefined/`{}` 保留两个默认。**外壳不读 settings blob 的原始字段——这个 hook 是唯一路径**，让每个 adapter 暴露自己的设置 UI（CPA 暴露两者，CardApp Studio 目前都不暴露）而外壳无需知道你的存储路径。传输选择（SSE vs one-shot POST）由 `generateTask` 按解析预设的 `stream_openai` 处理，adapter 不需要暴露开关。
- **会话存储**：adapter 拥有持久化，四个 hook：`listSessions(scope)`（最新在前）、`loadSession(scope, id)`、`saveSession(scope, session)`、`deleteSession(scope, id)`。`scope` 是 `sessionScope()` 返回的。常见模式：`'global'`、`'character_<avatar>'`、`'chat_<chatId>'`。典型存储位置：Global → 扩展设置桶 `extension_settings.my_extension.iterStudioSessions`；Per-character → `context.getCharacterState(avatar, 'my_ext_iter_sessions')`；Per-chat → 聊天元数据。会话形状由外壳定义（见 `public/scripts/iteration-studio/adapter.js` 的 JSDoc typedef）；adapter 可在 `session.surfaceState` 里塞任意 blob 数据。
- **布局**：`'popup'`（单列对话，composer + history 堆叠；用于制品预览短或 diff 已在消息卡里的 adapter）；`'split'`（两列对话 + 预览面板，右面板由 `renderPreviewPane(state)` 渲染；用于制品有有意义的规范视图时）。
- **外壳调用的 slot hook**：`renderMessageCard(message, state)`（每条对话消息，必需）、`renderHistoryItem(meta)`（历史列表每项，必需）、`renderPreviewPane(state)`（split 布局右面板，split 必需）、`renderToolbarSlots(state)`（额外 `{start, end}` 工具栏 HTML，可选）、`handleAction(actionId, ctx)`（弹窗内任何 `[data-iter-custom-action="<id>"]` 的 click/change，可选）。
- **预览面板**：`renderPreviewPane(state)` 返回右面板 HTML；**外壳在每次重渲染时整体替换预览面板**（每个 chat tick、busy 状态切换、AI 工具调用等）。适合：字段摘要、tab 占位、只读 diff 列表。持有需跨重渲染存活的 widget 状态（CodeMirror、图表等）的 adapter 应把那个界面放在 iteration-studio 外壳之外——直接用 edits-lib。
- **参考对比**：adapter 可提供 "Compare with..." 选择器，从别处拉快照并与 live 并排渲染。两个 hook：`listReferences(session)` → `{id, label}[]`、`loadReference(id)` → `Promise<any>`。外壳在工具栏显示下拉，用户选中时调 `loadReference(id)`，结果经 `state.reference` 传给渲染 hook。两个都省略则完全隐藏选择器。
- **自定义 op**：外壳每次 `openIterationStudio()` 调用时调 `adapter.registerCustomOps?.(registry)` 一次。registry 是包了 edits-lib 引擎 `registerOp` 的门面，带 `getRegisteredOp` guard，所以重开弹窗不会重复注册（也不会因重复失败）。引入 schema 专属 op 的 adapter 在这里注册。每个 handler 实现 `{apply, inverse, detectConflict}`。**当条目形状以数组索引以外的东西为键时用自定义 op**（如 lorebook uid），否则内置 `list_*` op 会在重排序时静默漂移。示例（CEA 的 lorebook 条目自定义 op）：`lorebook_entry_add` / `lorebook_entry_update` / `lorebook_entry_remove`。
- **迁移 hook**：`clearObsoleteSessions?(scope)`——外壳在升级后首次打开时对每个 adapter 调一次（外壳在 localStorage 追踪 per-adapter 清除标志，所以只跑一次）。用于清掉 legacy v1 存储键。无需迁移则省略。
- **三层 API 暴露**：Layer 1 `import { openIterationStudio, defineAdapter } from '/scripts/iteration-studio/index.js'`；Layer 2 `lukerContext.iterationStudio.{openIterationStudio, defineAdapter}`；Layer 3 `SillyTavern.getContext().iterationStudio.{open, defineAdapter}`（`open` 是 `openIterationStudio` 的短别名）。
- **参考 adapter 详单**：
  - `orchestrator/iteration-adapter.js`——用 sandbox-diff 模式包住编排器既有 mutator；split 布局、按 mode 的会话桶、运行时 world-info 解析、自定义控制工具名。
  - `memory-graph/schema-adapter.js`——直接建在 v2 契约上的节点类型 schema 编辑器；split 布局、仅全局会话、预览面板里的 apply-to-global / apply-to-character 动作按钮。
  - CEA Character Editor——`character-editor-assistant/character-editor-adapter.js`；split 布局、per-character 会话作用域 `char_<avatar>`；live 形状是 `{card, lorebook: {bookName, entries: {[uid]: entry}}}`；经 `mergeCharacterAttributes` 编辑卡字段、经 `context.saveWorldInfo` 编辑 lorebook；注册 3 个以条目 uid 为键的自定义 op。
  - CPA（Completion Preset Assistant）——`completion-preset-assistant/cpa-iteration/`（studio 经 `openCpaIterationStudio` 以弹窗挂载，独立于分层的 iterationStudio open/defineAdapter 契约）；per-preset 会话作用域 `preset_<name>`；live 目标是用户当前选中的 OpenAI 预设（经 `context.presets.get`），`commit()` 经 `context.presets.save(..., {select: true})` 写回；工具目录有 15 个可编辑预设编辑 op + 5 个只读检查工具 + 12 个 Skills 创作工具（当 session mode 是 `orchestrator-optimize` 时暴露，直接从编排器的 `skill-iter-studio-tools.js` 注册表拉取）；**无预览面板**——聊天里的 per-message 编辑摘要是 diff。
- adapter 契约 JSDoc 在 `public/scripts/iteration-studio/adapter.js`——该文件是必需 vs 可选字段与精确签名的规范来源。

**可提炼为 skill 的知识点**：Iteration Studio adapter 编写 skill（最小 adapter 模板 + slot hook 清单 + 权威模型）、何时改用 edits-lib 的判据、session 存储三模式（global / per-character / per-chat）。

---

### Edits Library — https://luker.cups.moe/development/extension-api/edits-lib.html

**核心内容摘要**

- **何时用**：插件形状满足——AI 工具调用对用户拥有的结构化对象（JSON、预设、角色卡、图等）提议改动；用户审查提议并决定是否应用；对象可在提议与应用之间被外部编辑。不用该库就得逐插件手工追踪基线、检测漂移、写自己的冲突 UI。
- **概念**：Edit（标记对象，描述单个 op 化改动；内置 op：`set`、`unset`、`str_replace`、`str_insert`、`str_delete`、`list_insert`、`list_remove`、`list_move`）；Apply（`applyEdits(edits, live)` → `{newLive, clean, conflicts, alreadyDone}`，引擎在变更前对每个编辑做漂移检查）；Inverse（`inverseEdit(edit)` 返回撤销它的编辑，适合回滚）；Custom op（`registerOp(name, handler)`）。
- 三层暴露：Layer 1 `import { applyEdits, inverseEdit, registerOp, getRegisteredOp, listRegisteredOps, showConflictResolution, BUILT_IN_OPS } from '/scripts/lib/edits/index.js'`；`lukerContext.edits.*`；`SillyTavern.getContext().edits.*`。`showConflictResolution` 也从 `/scripts/lib/edits/conflict-ui.js` 重新导出以向后兼容，但新代码应从 `index.js`（或用 lukerContext / getContext 层）import。
- `applyEdits(edits, live)` 返回：`newLive`（应用后）、`clean`（无冲突应用的编辑；**某些 op 会原地增强它以存 inverse 信息**）、`conflicts`（锚/基线不匹配当前 live 的编辑）、`alreadyDone`（效果已在当前 live 中的编辑）。`live` 内部深克隆，不被 mutate。
- `inverseEdit(edit)`——**对某些 op，`edit` 必须已经过 `applyEdits`**（这样内部锚上下文如 `_inserted_at` / `_anchor_context` 已填充）——引擎在你存 `result.clean` 而非原始编辑数组时替你做这件事。
- `registerOp(name, handler)`——`apply(deps, edit, live)`（必需；原地 mutate live 并返回）、`inverse(edit)`（必需）、`detectConflict(deps, edit, live)`（必需；clean 返回 null，冲突返回 `{reason, baseline?, current?}`，no-op 返回 `{reason: 'already_done'}`）、`renderConflict(entry)`（可选，自定义冲突 UI DOM）。`deps` 是 `{get, set, unset, isEqual, cloneDeep}`（lodash 方法）。**保留 op 名**：`set`、`unset`、`str_*`、`list_*`。自定义 op 用 `domain.action` 命名（如 `node.add`、`entry.update`）。
- **内置 op 参考**：
  - `{op:'set', path, oldValue, newValue}`——替换 lodash path 处的值。当前值既不等于 oldValue 也不等于 newValue 时冲突；等于 newValue 时 already-done。
  - `{op:'unset', path, expected_value?}`——删除键（区别于设为 undefined）。path 缺失时 already-done；`expected_value` 有设且当前深不等时冲突。
  - `{op:'str_replace', path, find, replace, expected_count?}`——替换 path 处字符串中所有 find 出现。`expected_count` 默认 1——AI 想替换多处时要显式设。冲突：`anchor_missing`（count 0）、`anchor_ambiguous`（count ≠ expected）。
  - `{op:'str_insert', path, after_text, insert_text}`——在 after_text 的唯一出现之后插入。冲突：锚缺失或歧义。
  - `{op:'str_delete', path, find}`——从字符串删唯一 find。**apply 时捕获周边上下文**，以便 inverse 的 `str_insert` 找到正确位置。
  - `{op:'list_insert', path, anchor: {before_index|after_index|after_value}, value}`——插入数组。**`after_value` 是最抗漂移的锚**（只要值仍唯一就能在重排序后存活）。
  - `{op:'list_remove', path, index, expected_value?}`——splice 掉 index 处元素。`expected_value` 防外部位移。
  - `{op:'list_move', path, from_index, to_index, expected_value?}`——移动元素；`from === to` 时 no-op。
- **冲突 UI**：`showConflictResolution(conflicts, opts?)` → `Promise<Resolution[] | null>`。`null` 表示用户取消了整个 apply。每个 Resolution 是 `{decision:'apply-mine', edit}`（用提议覆盖 live）、`{decision:'keep-theirs', edit}`（跳过此编辑）、`{decision:'manual', edit, newValue}`（用户给的值）。**要尊重用户决策，重建带已解析值的 edits 数组并再调一次 `applyEdits`**（用户选了确定性 resolution 时结果应无冲突）。
- **范围外提醒**：库**不**管理编辑历史、journal、undo 栈或会话——那是插件的职责，典型做法是把 `result.clean` 存到产生编辑的消息上，回滚时经 `inverseEdit` 逆序迭代。库**不**就冲突提示 AI——用户决定；想要 AI 驱动的协调，在插件里基于冲突结果实现。

**可提炼为 skill 的知识点**：AI 提议编辑 + 用户审查模式 skill（applyEdits/inverseEdit/冲突 UI 三步）、内置 8 个 op 的语义与冲突条件表、"存 result.clean 而非原始 edits" 这个必须遵守的约定。

---

## 可提炼为 Skill 的主题候选

| # | 主题 | 依据页面 | 适合的 skill 类型 |
| --- | --- | --- | --- |
| 1 | **Luker 前端插件脚手架与事件系统** | `development/frontend-plugin.html` | 生成型 skill：给一个插件名，产出 `manifest.json` + `index.js` + `settings.html` + `style.css` 四件套；内置事件名/回调签名速查表与监听顺序三原则 |
| 2 | **Luker 服务端插件开发** | `development/server-plugin.html` | 生成型 + 校验型 skill：产出 CJS/ESM 双形态插件骨架；强制"路由必须在首个 await 前注册"、ID 正则、凭据存服务端、路径穿越校验 |
| 3 | **Luker 扩展 API 速查与命名空间导航** | `extension-api/index.html` + 各 `extension-api/*` | 参考型 skill：命名空间速查表 + "要做什么 → 用哪个 API" 索引；含 ST vs Luker 差异对照表 |
| 4 | **Luker 状态存储选型与 patch-first 持久化** | `extension-api/chat-and-state.html`、`presets-and-prompts.html`、`characters.html`、`macros-and-variables.html`、`low-level-endpoints.html` | 决策型 skill：六种存储（chat_metadata / Chat State / Floor State / Character State / 扩展字段 / 变量）选型决策树 + 九个 `reason` 码 switch 模板 + RFC 6902 语义 |
| 5 | **Luker LLM 调用：generateTask 一站式接入** | `extension-api/generation.html` | 生成型 skill：generateTask 模板 + `substituteMacros` 的副作用宏陷阱 + 流式 vs 非流式选型 + ST → Luker 生成层迁移 cookbook |
| 6 | **CardApp 卡内嵌应用开发** | `development/card-developers.html` + `features/cardapp.html` + `features/card-editor/studio.html` | 生成型 skill：`init(ctx)` 契约 + ctx API 全表 + `onDispose` 配对规则 + 三条安全禁令 |
| 7 | **Character Card 扩展字段与 schema 定制** | `development/card-developers.html` | 生成型 skill：写入 `data.extensions.luker.memoryGraphSchema` / `card_app` 的正确结构 + 分发注意事项 |
| 8 | **自定义宏与变量注册** | `extension-api/macros-and-variables.html` | 生成型 skill：`macros.register()` 模板 + `delayArgResolution` 控制流陷阱 + 内置宏速查 + floor-bound 写入 vs createFloorState 选型 |
| 9 | **斜杠命令注册** | `extension-api/slash-commands.html` | 生成型 skill：`SlashCommand.fromProps` 模板（命名/位置参数 + 枚举 + 管线）+ 废弃 API 迁移映射 |
| 10 | **插件 UI 构建（Popup / Loader / 模板 / 共享组件）** | `extension-api/ui-and-popups.html` | 生成型 skill：四种弹窗类型 + loader 阻塞模式 + `renderLukerTabs` / `renderFieldHelpButton` + 三层 API 暴露惯例 |
| 11 | **扩展间通信与跨插件能力复用** | `extension-api/plugin-integration.html` + `extension-api/character-editor-assistant.html` | 模式型 skill：`registerExtensionApi` / `getExtensionApi` + 惰性解析 + 依赖缺失降级（"install X" 错误） |
| 12 | **插件 i18n 本地化** | `extension-api/plugin-integration.html` | 生成型 skill：`` t`` `` 标签模板 + `addLocaleData` 时机 + `zh-CN ↔ zh-TW` fallback |
| 13 | **Lorebook 程序化读写与 WI 激活扫描** | `extension-api/world-info.html` + `presets-and-prompts.html` | 生成型 skill：条目模板 clone + uid 分配 + dryRun 扫描 + `postActivationHook` 改写注入位置 |
| 14 | **Message Takeover（插件直接产出回复）** | `extension-api/message-takeover.html` | 模式型 skill：三终态选型决策 + 用户停止时 abort vs discard 的竞态论证 + continue 前缀不变式 |
| 15 | **AI 提议编辑 + 用户审查（edits-lib）** | `extension-api/edits-lib.html` + `extension-api/iteration-studio.html` | 模式型 skill：edits-lib 三步用法 + 8 个内置 op 冲突条件 + "存 result.clean" 约定 + 何时改用 iteration-studio adapter |
| 16 | **Iteration Studio adapter 编写** | `extension-api/iteration-studio.html` | 生成型 skill：最小 adapter 模板 + slot hook 清单 + 权威模型（live() 唯一真源）+ session 存储三模式 |
| 17 | **编排器工具注册（Orchestrator Tools）** | `extension-api/orchestrator-tools.html` | 生成型 skill：三入口 + guard 降级 + `mode: read/write` 与 simulate 语义 + `__lukerRun` 等编排 ctx 字段 |
| 18 | **Memory Graph 集成** | `extension-api/memory-graph.html` | 集成型 skill：`openSession` 16 方法 + 空 store 可写 + null 的三种情形 + 冻结视图契约 + `getLastRecallProjection` 复用 |
| 19 | **Luker 贡献流程（分支/提交/风格）** | `development/contributing.html` | 流程型 skill：`release` 为目标分支 + Conventional Commits + 4 空格/单引号/分号/LF 硬约束 + 三语文档目录约定 |
| 20 | **插件 Regex 注册与规则作用域** | `extension-api/plugin-integration.html` + `extension-api/chat-and-state.html` | 模式型 skill：`registerManagedRegexProvider` + `promptOnly` / `pluginOnly` / 无标志三态作用域 + `readPluginFloors` provenance 契约（防双重 cooking） |
| 21 | **插件设置持久化选型** | `extension-api/plugin-integration.html` | 决策型 skill：`extensionSettings` vs `accountStorage` vs Character State vs preset state 的选择依据 |
| 22 | **Luker 调试与诊断** | `extension-api/plugin-integration.html`（registerDebugFunction / tokenization / getListenersMeta）+ `features/logging.html` + `features/storage-inspector.html` + `features/world-info-trace.html` + `improvements/request-inspector.html` | 工具型 skill：调试函数注册 + 事件监听器检视 + token 计数 + 请求/存储/WI 检查器使用 |

---

## 抓取失败与限制记录

| 项 | 状态 | 说明 |
| --- | --- | --- |
| `https://luker.cups.moe/sitemap.xml` | 抓取失败（404） | 站点无 sitemap；改用首页 `__VP_HASH_MAP__` 内嵌 JSON 取得完整页面清单 |
| `https://luker.cups.moe/zh-CN/development` | 抓取失败（404） | 该路径不存在；正确形式是 `/zh-CN/development/frontend-plugin.html`（带 `.html` 后缀） |
| `https://luker.cups.moe/development` | 抓取失败（404，重定向到 `/development/`） | 无 `.html` 后缀一律 404 |
| `/features/*`、`/improvements/*`、`/guide/*`、`/basics/*`、`/recipes/*` 全部页面 | **未逐页抓取** | 仅从首页哈希表与 sidebar 确认存在（清单见上文"站点其他相关章节"）。其中 `/features/skills/*`（4 页）、`/features/orchestrator/*`（11 页）、`/features/card-editor/*`（6 页）、`/features/cardapp.html`、`/features/state-system.html`、`/features/hook-order.html`、`/features/regex-provider.html`、`/features/variable-op-log.html` 与开发 skill 高度相关，**建议后续补抓** |
| 三语言版本 | 英文版已全部抓取；`zh-CN` / `zh-TW` 版**未抓取** | 页面清单确认三语一一对应（各 22 页，中文版 URL 加 `/zh-CN/` 或 `/zh-TW/` 前缀）。中文版内容为英文版的翻译，术语与 API 名保持英文，抓取价值主要是中文表述参考 |
| `memory-graph.html` 的 Layer C / Layer D 章节 | **部分抓取** | 该页正文 51 KB，本次读取了开头至 Layer B（约 330 行）+ 尾部 Write API 与性能章节；Layer C（Recall Primitives）与 Layer D（Injection Observation）的完整方法签名未逐行读取 |

## 站点整体观察（供写 skill 时参考）

1. **三层 API 暴露是本项目的统一惯例**：Layer 1 直接 ESM import（树内扩展用）、Layer 2 `lukerContext` 属性（CardApp / 持有 context 句柄的扩展代码）、Layer 3 `SillyTavern.getContext()`（第三方扩展）。`renderLukerTabs`、`renderFieldHelpButton`、edits-lib、iteration-studio、message-takeover 都明确列出三层。写 skill 时应把这个模式作为规范。
2. **信封返回（`{ok, reason, hint}`）正在取代抛异常**：2026-06-28 的行为变更把 chat state / floor state / character state / preset state 统一到信封模式，九个 `reason` 码共用一套词表。旧文档中的 `try/catch` 写法已过时。
3. **patch-first 是贯穿性架构选择**：聊天持久化、chat state、settings、worldinfo 全部走 RFC 6902 增量；`buildObjectPatchOperationsAsync` 是共用 diff 引擎。这解释了为什么文档反复强调"优先 Context API 而非裸 HTTP"。
4. **文档明确标注了若干"陷阱"**：服务端插件路由必须同步注册；`substituteMacros` 的副作用宏会污染变量；`readPluginFloors` 的 provenance 戳防双重 regex；Floor State 与 `updateChatState` 不可混用同一 namespace；Message Takeover 用户停止时应用 `abort()` 而非 `commit()`；`presets.resolve` 不返回连接信息。这些是 skill 里最值得固化的"反直觉约束"。
5. **站点已有 `docs/` 三语目录约定**（英文在根、`zh-CN/`、`zh-TW/`），且贡献指南要求代码与 API 名保持英文——写 Luker 相关 skill 时应沿用。
