# 消费者接入契约（跨仓规范）

> **本页自包含**：规范条文与证据均内联，不依赖任何任务目录或研究目录（那些路径已被 `.gitignore` 排除，
> 引用它们会变成静默悬空的 P-4 形态）。本页是 **Authority 消费者（第三方插件）接入的唯一权威规范**。
> 适用对象：仓群内任何调用 `window.STAuthority.AuthoritySDK` 的插件，以及仓群外的第三方作者。

---

## 1. 现状盘点（2026-09-25 实测）

仓群 16 仓全量检索（词：`STAuthority|AuthoritySDK|api/plugins/authority|ST-Authority|st-authority`，
排除 `node_modules`/`dist`/`*.min.js`）结果：

| 类别 | 仓 | 证据 |
| --- | --- | --- |
| **真实消费者（3）** | `SillyTavern-Timelines` | `src/adapters/authority-adapter.js`（222 行）+ 单测 |
| | `ST-BgLoader` | `src/backend/AuthorityBridge.ts`（259 行）+ 测试 |
| | `ST-zip-converter` | `src/storage/authority-store.js`（324 行） |
| **在途（1）** | `ST-chatfilesys-rebuild` | 仅有 `My-repo/ST-chatfilesys-rebuild/backend-plugin-spec.md`（仓外路径），未落代码 |
| **官方示例（1）** | 本仓 `packages/example-extension` | `src/index.ts` + `src/version.ts` |
| **零命中（11）** | `PureTavern`、`ST-shujuku-rebuild`、`ST-Assets-Manger`、`ST-Codex-theme`、`ST-Switcher`、`ST-git-improve`、`ST-PanelReset`、`ST-chatfile-improve`、`ST-msg-btn-mgr`、`tavern_helper_template`、`tavern_helper_workspace` | — |

**未盘点**：`Instance/**` 内已安装的第三方扩展（受实例隔离铁律限制，禁止遍历实例 `data/`）；
仓群外的消费者（**无登记载体**）。

---

## 2. 接入契约（normative）

### 2.1 最小正确示例（**照抄此段**）

```js
// ① 身份：命名规范 third-party/<name>
const EXTENSION_ID = 'third-party/my-plugin';

// ② 版本：从单一来源读，禁止硬编码字面量（见 §3 偏离项 2）
import { AUTHORITY_VERSION } from './version.js';

// ③ 探测：SDK 不存在时【静默降级】，禁止 throw
function detectSdk() {
    const host = typeof window !== 'undefined' ? window : globalThis;
    return host?.STAuthority?.AuthoritySDK ?? null;
}

let client = null;
let lastFailureAt = 0;
const RETRY_COOLDOWN_MS = 60_000;

async function initAuthority() {
    const sdk = detectSdk();
    if (!sdk || typeof sdk.init !== 'function') return null;   // 未装 Authority：静默休眠

    if (Date.now() - lastFailureAt < RETRY_COOLDOWN_MS) return null;  // 冷却期内不重试

    try {
        client = await sdk.init({
            extensionId: EXTENSION_ID,
            displayName: 'My Plugin',
            version: AUTHORITY_VERSION,          // ← 单一来源
            installType: 'local',
            declaredPermissions: {               // ← 只声明实际用到的
                storage: { kv: true },
            },
        });
        return client;
    } catch (err) {
        client = null;
        lastFailureAt = Date.now();              // ← 记录失败时刻，允许冷却后自愈
        console.warn('[my-plugin] Authority 不可用，降级本地模式:', err);
        return null;
    }
}
```

### 2.2 `declaredPermissions` 合法形态表

**能力名与生命周期阶段以 `.trellis/spec/shared-types/backend/capability-lifecycle.md` 的真源为准**；
下表只规定**声明语法形态**（布尔式 / 带参式）。

| 声明路径 | 形态 | 取值示例 | 说明 |
| --- | --- | --- | --- |
| `storage.kv` | 布尔 | `true` | KV 存储 |
| `storage.blob` | 布尔 | `true` | Blob 存储 |
| `fs.private` | 布尔 | `true` | 私有文件系统 |
| `sql.private` | 布尔 | `true` | 私有 SQL |
| `trivium.private` | 布尔 | `true` | Trivium 图数据库 |
| `http.fetch` | **带参** | `{ allow: ['api.example.com'] }` | 可访问的**主机名白名单**（不带协议、不带端口） |
| `jobs.background` | **带参** | `{ background: ['delay', 'sql.backup'] }` | 可创建的**内置 job 类型**（清单随 `features.jobs.builtinTypes` 下发） |
| `events.stream` | **带参** | `{ channels: ['extension:third-party/my-plugin'] }` | 可订阅的**频道名**；扩展自身默认频道为 `extension:<extensionId>` |
| `module.execute` | 布尔 | `true` | Companion Module 互调（**不投影到注册表能力**） |
| `agent.run` / `agent.browser` | 布尔 | `true` | 风险等级 `high`，系统默认策略 `prompt` |

上表 10 行覆盖 `packages/server-plugin/src/constants.ts` 中 `SUPPORTED_RESOURCES` 的全部 11 项
（`agent.run` 与 `agent.browser` 合并为一行）。风险等级与默认策略的权威定义在
`docs/server/capabilities-and-isolation.md` §1–§2。

**声明纪律**：**只声明实际用到的**。`agent.*` / `fs.*` / `http.*` 不得顺手声明——
它们在用户授权弹窗里是可见的风险项。

**`http.allow` 与 `events.channels` 的带参形态是强制要求**：服务端校验读的就是数组内容；
声明为 `true` 不会生效。

### 2.3 降级最小必需行为（normative）

以下四条是**必需**的，不是建议：

| # | 要求 | 理由 |
| --- | --- | --- |
| **D1** | SDK 不存在或 `init` 失败时，**主功能必须完整可用**（走本地路径：IndexedDB / OPFS / 内存） | 纯前端优先；插件必须能独立运行 |
| **D2** | **禁止 `throw` 中断插件加载** | 违反者会让插件在未装 Authority 的宿主上**完全不可用** |
| **D3** | 必须记录**失败时刻**，冷却期内不重试，冷却后**允许自愈** | 对治"失败后被永久缓存、须刷新页面"的缺陷 |
| **D4** | 降级不得静默无声：至少一次 `console.info`/`warn`；面向用户的提示应为**一次性**（去重） | 避免错误风暴 |

**推荐状态机形态**：`absent / disabled / connecting / ready / error` 五态，
非法转移静默忽略，错误态冷却 **60s**。
`SillyTavern-Timelines` 的 `src/adapters/authority-adapter.js` 是当前唯一符合该约定的实现，可作参考样板。

---

## 3. 已知偏离项（2026-09-25；本规范发布**不追溯**改造）

| # | 偏离项 | 位置 | 后果 |
| --- | --- | --- | --- |
| 1 | **官方示例 SDK 缺失时抛异常** | `packages/example-extension/src/index.ts:28-30`（`throw new Error('Authority SDK extension is not loaded')`） | 违反 D2；作为被照抄的样板，会把问题扩散到第三方插件 |
| 2 | **版本上报已失真** | `SillyTavern-Timelines/src/adapters/authority-adapter.js:110,143` 声明 `2.4.0`，而 `manifest.json:9` 为 `1.2.0`；`ST-zip-converter/src/storage/authority-store.js:35` 声明 `1.0.0`，而 `package.json` 为 `0.1.0` | 3 家中 2 家失真；`version` 当前**不可作为任何判定依据** |
| 3 | **`uiLabel` 被误读为必填** | `ST-BgLoader/src/backend/AuthorityBridge.ts:90` | 真实契约中 `uiLabel` **可选**（`packages/shared-types/src/session.ts:11`） |
| 4 | **`agentTools` 硬编码为 true** | `AuthorityBridge.ts:190-195` | 该插件**从未声明 `agent.browser`**，却把能力标记为可用 |
| 5 | **`initPromise` 永久缓存导致无法自愈** | `AuthorityBridge.ts:148-152`（`if (this.initPromise) return this.initPromise`，失败后不清空） | 违反 D3；运行中途启用 Authority 后须刷新页面 |
| 6 | **返回形状解析两家互斥** | `authority-store.js:66-73,184,267-288`（7 路容错）vs `AuthorityBridge.ts:22-27`（单路强类型断言 `{record, content, encoding}`） | 两者不可能同时正确；根因是契约缺位，修复见 `.trellis/spec/server-plugin/backend/version-binding.md` §3 |

**改造优先级建议**：#1（影响面最大，它是样板）→ #2（已是事实错误）→ #4/#5（影响可用性）→ #3/#6。

---

## 4. 验证方式

接入方自查：

```bash
# ① 确认没有硬编码字面量版本
rg -n "version:\s*'[0-9]+\.[0-9]+\.[0-9]+'" src/

# ② 确认没有 throw 在 SDK 探测路径上
rg -n "throw new Error\('Authority SDK" src/

# ③ 确认声明面与调用面一致（人工比对）
rg -n "client\.(storage|sql|fs|trivium|http|jobs|events|modules|agent)" src/
```
