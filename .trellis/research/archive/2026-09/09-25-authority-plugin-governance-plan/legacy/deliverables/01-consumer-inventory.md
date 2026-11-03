# 01 · 消费者盘点与接入契约（规范）

> 任务：`09-25-authority-plugin-governance-plan` · 对应 `prd.md` R1
> 证据：`research/00-consumer-inventory.md`（全部结论带 file:line 回源）
> **本契约的能力名与阶段一律以 [`deliverables/03`](03-capability-lifecycle.md) 的真源为准**
> （`design.md` 接缝 A）。本文不复制能力清单。

---

## 〇、结论先行

1. 仓群 16 仓中，**真实消费者 3 个**（`SillyTavern-Timelines` / `ST-BgLoader` / `ST-zip-converter`）、
   **在途 1 个**（`ST-chatfilesys-rebuild`，仅有设计文档）、**官方示例 1 个**（本仓 `packages/example-extension`）。
   其余 11 仓零命中。（`research/00` §一）
2. **三家真实消费者的接入形态三家三样**，契约在被各自仓内的适配器**隐式定义**——
   同一份 SDK 的两个消费者对同一返回形状得出**互斥结论**（一家 7 路容错，一家单路强类型断言）。
   （`research/01` E-V6）
3. **官方示例提供了危险的样板**：SDK 缺失时 `throw new Error(...)`，**违反 L0-11 的静默降级**
   （`research/00` §四）。照抄它的第三方插件在未装 Authority 的宿主上会直接不可用。
4. 本契约的作用不是发明新形态，而是**把三家事实上的最优实践提升为规范**，
   并提供一个**可照抄的正确样板**。

---

## 一、消费者盘点（16 仓全量）

| 仓 | 判定 | 证据 |
| --- | --- | --- |
| `Myfork/SillyTavern-Timelines` | **真实消费者** | `src/adapters/authority-adapter.js`（222 行）+ `tests/authority-adapter.test.mjs` |
| `My-repo/ST-BgLoader` | **真实消费者** | `src/backend/AuthorityBridge.ts`（259 行）+ `tests/authority.mjs` |
| `My-repo/ST-zip-converter` | **真实消费者** | `src/storage/authority-store.js`（324 行） |
| `My-repo/ST-chatfilesys-rebuild` | **在途**（仅设计文档，未落代码） | `backend-plugin-spec.md`（93 行） |
| 本仓 `packages/example-extension` | **官方示例** | `src/index.ts` + `src/version.ts` |
| `Myfork/PureTavern` | 零命中（仅 `AGENTS.md` 规则提及） | — |
| `Myfork/ST-shujuku-rebuild` · `My-repo/ST-Assets-Manger` · `ST-Codex-theme` · `ST-Switcher` · `ST-git-improve` · `JS-Slash-Runner/ST-PanelReset` · `ST-chatfile-improve` · `ST-msg-btn-mgr` · `tavern_helper_template` · `tavern_helper_workspace` | 零命中（10 仓） | — |

**未覆盖**：`Instance/**` 内实际安装的第三方扩展（受 L1-MF-15 ④ 限制）；
仓群之外的消费者（**无登记载体**——这本身是治理缺口，见 `03` §四 的通知载体设计）。

---

## 二、逐维对照表（三家真实消费者 + 官方示例）

| 维 | Timelines | ST-BgLoader | zip-converter | 官方示例 |
| --- | --- | --- | --- | --- |
| **扩展身份** | `third-party/sillytavern-timelines` | `third-party/ST-BgLoader` | `third-party/st-zip-converter` | `third-party/st-authority-example` |
| **`init` 入参** | 不传 `uiLabel` | 传 `uiLabel` | 不传 `uiLabel` | 传 `uiLabel` |
| **版本来源** | 硬编码 `2.4.0` ❌ | 硬编码 `1.0.0` ✅ | 硬编码 `1.0.0` ❌ | **`version.ts` 常量** ✅ |
| **权限形态** | `trivium`/`sql`/`storage.kv`/`jobs` | `storage`/`sql`/`http.allow`/`jobs`/`events.channels` | `fs`/`storage.kv+blob` | `storage`/`http.allow`/`jobs`/`events.channels` |
| **降级策略** | 5 态状态机 + 60s 冷却 | 3 值 reason 枚举，`initPromise` **永久缓存** | 每次探测，`console.warn` | **`throw`，不降级** ❌ |
| **返回形状解析** | — | **单路强类型断言** | **7 路分支容错** | — |
| **能力查询** | 不调用 | **硬编码** `agentTools:true` ❌ | 只探测 client 存在性 | 不调用 |

（出处逐项见 `research/00` §2.1–§2.5。）

---

## 三、接入契约（normative）

### 3.1 最小正确示例（**可照抄**）

```js
// ① 身份：命名规范 third-party/<name>
const EXTENSION_ID = 'third-party/my-plugin';

// ② 版本：从单一来源读，禁止硬编码字面量（理由见 §四 偏离项 2）
import { AUTHORITY_VERSION } from './version.js';

// ③ 探测：SDK 不存在时【静默降级】，禁止 throw（L0-11）
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
            declaredPermissions: {               // ← 只声明实际用到的（L1-MF-5）
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

### 3.2 `declaredPermissions` 合法形态表

**能力名与阶段以 [`03` 的真源](03-capability-lifecycle.md) 为准**；下表只规定**声明语法形态**。
形态分两类：**布尔式**（开/关）与**带参式**（白名单/名单）。

> **接缝 A 声明**：本表的**行集**是从 `03` §二 的能力真源**派生**的，不是独立维护的清单。
> 真源新增/移除能力时本表须同步——由 `03` §三 的 **A1 断言**（真源条目 `docAnchor` 非空）间接覆盖。
> 本表**只额外承载"声明语法"这一列信息**，不承载能力的存在性、阶段或风险等级。

| 声明路径 | 形态 | 取值示例 | 说明 |
| --- | --- | --- | --- |
| `storage.kv` | 布尔 | `true` | KV 存储 |
| `storage.blob` | 布尔 | `true` | Blob 存储 |
| `fs.private` | 布尔 | `true` | 私有文件系统 |
| `sql.private` | 布尔 | `true` | 私有 SQL |
| `trivium.private` | 布尔 | `true` | Trivium 图数据库 |
| `http.fetch` | **带参** | `{ allow: ['api.example.com'] }` | 声明可访问的**主机名白名单**（不带协议、不带端口） |
| `jobs.background` | **带参** | `{ background: ['delay', 'sql.backup'] }` | 声明可创建的**内置 job 类型**（内置类型清单随 `features.jobs.builtinTypes` 下发） |
| `events.stream` | **带参** | `{ channels: ['extension:third-party/my-plugin'] }` | 声明可订阅的**频道名**；扩展自身的默认频道为 `extension:<extensionId>` |
| `module.execute` | 布尔 | `true` | Companion Module 互调（**不投影到注册表能力**，理由见 `03` §五 #1） |
| `agent.run` / `agent.browser` | 布尔 | `true` | 高风险（`high`），系统默认策略为 `prompt` |

**声明纪律（L1-MF-5）**：**只声明实际用到的**。`agent.*` / `fs.*` / `http.*` 不得顺手声明——
它们在用户授权弹窗里是可见的风险项。

**`http.allow` 与 `events.channels` 的带参形态是本契约的强制要求**（不是可选风格）：
两者的服务端校验读的就是数组内容；声明为 `true` 不会生效。

### 3.3 降级最小必需行为（normative）

降级不是"随便处理一下"，以下四条是**必需**的：

| # | 要求 | 理由 |
| --- | --- | --- |
| **D1** | SDK 不存在或 `init` 失败时，**主功能必须完整可用**（走本地路径：IndexedDB / OPFS / 内存） | L0-11；插件独立运行的产品定位 |
| **D2** | **禁止 `throw` 中断插件加载** | 官方示例违反此项（`research/00` §四）——照抄会导致插件在未装 Authority 的宿主上完全不可用 |
| **D3** | 必须记录**失败时刻**，冷却期内不重试，冷却后**允许自愈** | 对治 `ST-BgLoader` 的 `initPromise` 永久缓存：用户在运行中途启用 Authority 后，该页面**不会**恢复，须刷新 |
| **D4** | 降级不得静默无声：至少一次 `console.info`/`warn`；面向用户的提示应为**一次性**（去重） | 避免错误风暴；`ST-BgLoader` 的 `localStorage` 去重是可取的范式 |

**状态机（推荐形态，非强制）**：`absent / disabled / connecting / ready / error` 五态，
非法转移静默忽略，错误态冷却 60s —— 即 **L1-MF-12 已确立的约定**。
`SillyTavern-Timelines` 的 `authority-adapter.js` 是当前唯一符合该约定的实现，可作为参考样板。

---

## 四、已知偏离项清单（供后续改造参考，本任务不改消费者仓）

| # | 偏离项 | 位置 | 后果 |
| --- | --- | --- | --- |
| 1 | **官方示例 SDK 缺失时抛异常** | `packages/example-extension/src/index.ts:28-30` | 违反 L0-11；作为被照抄的样板，会把问题扩散到第三方插件 |
| 2 | **版本上报已失真** | `SillyTavern-Timelines/src/adapters/authority-adapter.js:110,143`（声明 `2.4.0` vs `manifest.json:9` `1.2.0`）；`ST-zip-converter/src/storage/authority-store.js:35`（声明 `1.0.0` vs `package.json` `0.1.0`） | 3 家中 2 家失真；`version` 当前**不可作为任何判定依据** |
| 3 | **`uiLabel` 被误读为必填** | `ST-BgLoader/src/backend/AuthorityBridge.ts:90`（本地镜像类型标 `uiLabel: string` 必填） | 实际契约中 `uiLabel` 可选（`shared-types/src/session.ts:11`）；镜像类型与真实契约不符 |
| 4 | **`agentTools` 硬编码为 true** | `AuthorityBridge.ts:190-195` | 该插件**从未声明 `agent.browser`**，却把能力标记为可用 → 上层代码会以为能注册 Agent 工具 |
| 5 | **`initPromise` 永久缓存导致无法自愈** | `AuthorityBridge.ts:148-152`（`if (this.initPromise) return this.initPromise`，失败后不清空） | 运行中途启用 Authority 后须刷新页面才生效（违反本契约 D3） |
| 6 | **返回形状解析两家互斥** | `authority-store.js:66-73,184,267-288`（7 路容错）vs `AuthorityBridge.ts:22-27`（单路断言 `{record, content, encoding}`） | 两者不可能同时正确；根因是契约缺位，见 `02` §三 的固化清单 |

**注意 #6 的归属**：它不是任何一方的"错误"，而是**契约缺位**的表现。
修复方式在 `deliverables/02`（公开面返回形状固化），不在本文。

---

## 五、R6 合规表（最小侵入自证）

| 方案 | ① 纯增加点 | ② 零行为变更论证 | ③ 单一 PR 边界 | ④ 回滚点 |
| --- | --- | --- | --- | --- |
| **接入契约规范（本文）** | 纯文档，零代码 | 无代码即无行为变更 | "发布消费者接入契约规范" | 本文作废即可 |
| **§3.1 最小正确示例** | 新增文档示例 | 不改变任何既有插件 | 同上 | 同上 |
| **§3.3 降级最小必需行为** | 新增规范条文 | 现存的 Timelines 已满足；另两家不满足但**不追溯** | "定义降级的最小必需行为" | 删除该节即可 |

**本文件不含任何需要改动 Authority 代码的提案**，故全部通过四道判定。

---

## 六、未验项

| # | 未验内容 | 影响 | 处置 |
| --- | --- | --- | --- |
| 1 | `Instance/**` 内已安装的第三方扩展是否还有 Authority 消费者 | 盘点完整性 | **挂起**：受 L1-MF-15 ④ 限制，需用户单独批准后走路径级判断 |
| 2 | 仓群外的消费者（GitHub 上其他 fork / 第三方作者） | 同上；且**无登记载体** | **挂起**：本身即治理缺口，登记载体设计见 `03` §四 |
| 3 | `ST-chatfilesys-rebuild` 动工后是否采纳本契约 | 契约的实际采纳率 | 后续任务观察；其 `backend-plugin-spec.md` 未见核对 |
| 4 | 三家消费者的 `declaredPermissions` 是否与各自**实际调用面**完全一致 | 影响 L1-MF-5 的落实核查 | 后续任务；需逐仓比对调用点与声明，本任务未做 |
