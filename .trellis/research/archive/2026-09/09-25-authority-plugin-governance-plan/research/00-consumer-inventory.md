# 00 · 消费者盘点与接入契约（证据台账）

> 任务：`09-25-authority-plugin-governance-plan`
> 方法：对 `D:\Repo\Tavern-repo\` 下 **16 个仓**（My-repo 7 + Myfork 4 + JS-Slash-Runner 5）做全量静态检索，
> 检索词 `STAuthority|AuthoritySDK|api/plugins/authority|ST-Authority|st-authority`，排除 `node_modules`/`dist`/`*.min.js`。
> **未遍历 `Instance/**`**（L1-MF-15 ④：实例聊天内容与 `data/` 不读）。

---

## 一、盘点结果：16 仓中 5 仓有 Authority 消费痕迹

| 仓 | 命中文件 | 同类 | 实证消费者？ |
| --- | --- | --- | --- |
| `Myfork/SillyTavern-Timelines` | `src/adapters/authority-adapter.js`（222 行）、`tests/authority-adapter.test.mjs`、`settings.html`、`AGENTS.md` | **真实接入** | ✅ 有代码 + 有单测 |
| `My-repo/ST-BgLoader` | `src/backend/AuthorityBridge.ts`（259 行）、`tests/authority.mjs` | **真实接入** | ✅ 有代码 + 有测试 |
| `My-repo/ST-zip-converter` | `src/storage/authority-store.js`（324 行）、`CLAUDE.md` | **真实接入** | ✅ 有代码（无测试断言文件命中） |
| `My-repo/ST-chatfilesys-rebuild` | `backend-plugin-spec.md`（93 行） | **仅有设计文档** | ⚠️ 未接入 |
| `Myfork/PureTavern` | `AGENTS.md` | **仅规则提及** | ❌ 无消费 |

其余 11 仓零命中：`ST-shujuku-rebuild`、`ST-Assets-Manger`、`ST-Codex-theme`、`ST-Switcher`、`ST-git-improve`、
`ST-PanelReset`、`ST-chatfile-improve`、`ST-msg-btn-mgr`、`tavern_helper_template`、`tavern_helper_workspace`。

**结论**：真实消费者 **3 个**（Timelines / BgLoader / zip-converter），1 个在途（chatfilesys-rebuild），
加上本仓 `packages/example-extension`（官方示例）。**规模小、可一次性收敛** —— 这是制定契约的窗口期，
契约一旦发布，消费者数量仍可控。

---

## 二、三家消费者的接入契约差异（逐维对照）

### 2.1 扩展身份与 `init` 入参

| 维 | Timelines | ST-BgLoader | ST-zip-converter |
| --- | --- | --- | --- |
| `extensionId` | `third-party/sillytavern-timelines` | `third-party/ST-BgLoader` | `third-party/st-zip-converter` |
| `displayName` | `SillyTavern Timelines` | `ST-BgLoader` | `酒馆数据包互转工坊` |
| `version` | `2.4.0`（**硬编码字面量**，非从 package.json 取） | `1.0.0`（同上） | `1.0.0`（同上） |
| `installType` | `local` | `local` | `local` |
| `uiLabel` | **未传** | 传（`ST-BgLoader`） | **未传** |
| 声明"所需 Authority 版本" | **无此字段** | **无此字段** | **无此字段** |

- 契约依据：`packages/shared-types/src/session.ts:5-12` —— `AuthorityInitConfig` 仅
  `{extensionId, displayName, version, installType, declaredPermissions, uiLabel?}`。
- **`uiLabel` 实际可选，但 `AuthorityBridge.ts:90` 的本地结构类型把它标为必填**
  （`AuthoritySdkLike.init` 的 config 里 `uiLabel: string`）。三家中只有一家传 —— 说明契约形态在消费者侧已被各自解读。
- **`version` 是"消费者自己的版本"，不是"所需 Authority 版本"**。三家都硬编码字面量，
  与各自 `package.json` 无联动，可能随包升级而静默失真（Timelines 声明的 `2.4.0` 是否等于其实际发布版本，未验）。

### 2.2 `declaredPermissions` 形态

| 仓 | 声明内容 | 出处 |
| --- | --- | --- |
| Timelines | `{trivium:{private:true}, sql:{private:true}, storage:{kv:true}, jobs:{background:['sql.backup','trivium.flush']}}` | `authority-adapter.js:21-26` |
| ST-BgLoader | `{storage:{kv:true,blob:true}, sql:{private:true}, http:{allow:[...]}, jobs:{background:['delay','sql.backup']}, events:{channels:[CHANNEL]}}` | `AuthorityBridge.ts:181-187` |
| ST-zip-converter | `{fs:{private:true}, storage:{kv:true,blob:true}}` | `authority-store.js:37-40` |

- 服务端公开资源清单（`docs/server/capabilities-and-isolation.md` §1）：`storage.kv`、`storage.blob`、
  `fs.private`、`sql.private`、`trivium.private`、`http.fetch`、`jobs.background`、`events.stream` —— 共 **8 项**。
- 三家合计覆盖其中 7 项（`storage.kv`/`storage.blob`/`fs.private`/`sql.private`/`trivium.private`/`http.fetch`/`jobs.background`/`events.stream`），
  **`agent.*` 零声明**。
- `http.fetch` 的声明形态是 `{allow:[hostname...]}`（白名单式），`events.stream` 是 `{channels:[...]}` —— 两者是**带参数的声明**，
  其余是布尔式。契约文档未把这些形态差异集中表述，消费者只能照抄示例。

### 2.3 降级策略形态

| 仓 | 形态 | 冷却 | 用户可见 |
| --- | --- | --- | --- |
| Timelines | **5 态状态机** `absent/disabled/connecting/ready/error`，非法转移静默忽略；单一 `reason` 字符串 | 失败后 **60s** 冷却（`INIT_RETRY_COOLDOWN_MS`） | 设置面板总开关可停用 |
| ST-BgLoader | **3 值 reason 枚举** `sdk-missing`/`init-failed`/`permission-denied` + `degradedMessage` 中文文案 | 无（`initPromise` 单飞） | 一次性 `toastr` 提示，`localStorage` 去重（键 `st_bgloader_cloud_notice_v1`） |
| ST-zip-converter | **无状态机**：`getAuthorityClient()` 每次探测，成功返 client / 失败返 `null`，`console.warn` | 无 | 仅控制台 |

- Timelines 的 5 态形态**正是 L1-MF-12 规定的统一约定**（`absent/disabled/connecting/ready/error` + 非法转移静默忽略 + 错误态 60s 冷却）。
- 另两家**没有遵循 L1-MF-12**。差别的实际后果：BgLoader 的 `initPromise` 一旦失败会**永久缓存失败的 Promise** ——
  用户在运行中途安装/启用 Authority 后，该页面不会自动恢复（需刷新）；Timelines 的 60s 冷却则能在同页内自愈。

### 2.4 客户端返回形状的防御性解析（**契约缺失的实证**）

`ST-zip-converter/src/storage/authority-store.js` 三处显式写下"形状未固化"：

| 位置 | 防御写法 | 原注释 |
| --- | --- | --- |
| `kvGet` L66-73 | 依次尝试 `{value}` → `{data}` → 直接值 | 「SDK 返回形状未在 README 固化：兼容 { value } / 直接值 / { data }」（L68） |
| `putArtifact` L184 | `put.id ?? put.blobId`，都没有则回退用自己起的 `partName` | 「put 返回形状未固化：优先用返回 id，否则按名读取」（L183） |
| `getArtifact` L267-288 | 依次尝试 `string` → `{content}` → `{data}` → `{bytes}` → `Blob` → `ArrayBuffer` → TypedArray | 「兼容多种返回形状：base64 字符串 / { content } / ArrayBuffer\|Uint8Array / Blob」（L268） |

- `ST-BgLoader` 走**另一条路**：用本地镜像的强类型（`AuthorityBridge.ts:7-102`，注释「Verified against
  packages/sdk-extension/src/client.ts」）**断言**精确形状（如 `blob.get(id): Promise<{record, content, encoding}>`）。
- **同一份 SDK，两家消费者得出相反的兼容结论** —— 一家写 7 路分支容错，一家信强类型直取。
  这是"契约未固化"最硬的证据：消费者无法从公开文档判定哪个形状是承诺。

### 2.5 能力可用性查询：有接口，零消费

- `client.getCapabilities()`（`client.ts:2476-2489`）返回
  `{declaredPermissions, features, grants, policies, probe}` —— 这是**会话自省快照**，不是"某能力现在能不能用"的查询。
- **三家消费者无一家调用它**（Timelines 只看状态机；zip-converter 只探测 client 是否存在；BgLoader 完全不调）。
- **BgLoader 反而硬编码结论**：`AuthorityBridge.ts:190-195` 在 `init` 成功后无条件置
  `{available:true, sync:true, serverFetch:true, agentTools:true}`，而其 `declaredPermissions` 里**根本没有 `agent` 项**，
  且 `http.allow` 可能为空数组 —— 即 `agentTools`/`serverFetch:true` 缺依据。**这是"能力可用性无权威来源"导致的实证缺陷**。

---

## 四、本仓官方示例（E0 已补证）

`packages/example-extension/src/index.ts` —— **官方示例与三家真实消费者在两处形态相反**：

```ts
// index.ts:3,7            ← 版本来自常量模块，不是字面量
import { AUTHORITY_VERSION } from './version.js';
const VERSION = AUTHORITY_VERSION;

// index.ts:27-30          ← SDK 缺失时【抛异常】，不降级
const sdk = window.STAuthority?.AuthoritySDK as AuthoritySdkLike | undefined;
if (!sdk) {
    throw new Error('Authority SDK extension is not loaded');
}

// index.ts:32-53          ← 传 uiLabel；声明形态与 BgLoader 同族
authorityClient = await sdk.init({ extensionId, displayName, version: VERSION,
    installType: 'local', uiLabel: 'Authority Example',
    declaredPermissions: { storage:{kv:true,blob:true}, http:{allow:[...]},
                           jobs:{background:['delay']}, events:{channels:[`extension:${EXTENSION_NAME}`]} } });
```

| 维 | 官方示例 | 三家真实消费者 |
| --- | --- | --- |
| 版本来源 | `AUTHORITY_VERSION` 常量（由 `version:sync` 写入） | **硬编码字面量**（三家皆然） |
| SDK 缺失时 | **`throw new Error(...)`** | 静默降级为本地模式（三家皆然） |
| `uiLabel` | 传 | 2 家不传 |

**E0.1 结论（本主题最重要的新增证据）**：**官方示例违反了 L0-11「纯前端优先 + 静默降级」**——
它是其他作者抄写接入代码的第一来源，却给出了"SDK 缺失即抛异常"的样板。
若照抄，插件在未装 Authority 的宿主上**直接不可用**，正是 L0-11 要防的形态。
这直接论证了 R1.3「降级最小必需行为须写进契约规范」的必要性：**契约必须提供一个可照抄的正确样板**。

---

## 五、版本上报的可靠性（E0.2 已补证 · 原 §五 未验项 1 的答案）

| 消费者 | 向 Authority 声明的 `version` | 实际版本 | 一致 |
| --- | --- | --- | --- |
| `SillyTavern-Timelines` | `2.4.0`（`authority-adapter.js:110` 默认参 + `:143`） | `manifest.json:9` = **1.2.0** | ❌ **差 1.2.0** |
| `ST-BgLoader` | `1.0.0`（`AuthorityBridge.ts:178`） | `package.json` = `1.0.0` | ✅ |
| `ST-zip-converter` | `1.0.0`（`authority-store.js:35`） | `package.json` = **`0.1.0`** | ❌ |
| 官方示例 | `AUTHORITY_VERSION`（`version.ts`） | `package.json` = `1.6.8`（同源） | ✅ |

**结论**：**3 家真实消费者中 2 家的上报版本已失真**，且两家都是用硬编码字面量。
唯一做对的官方示例靠的是一条既有机制（`version:sync` 生成 `version.ts` 常量），**无需新造机制**。
→ 对 R2 的直接推论：**`version` 字段当前不可作为任何判定的依据**；
若契约要使用它，必须先要求消费者从单一来源读取（官方示例已是正确范式）。

---

## 六、在途消费者（设计文档阶段）

`My-repo/ST-chatfilesys-rebuild/backend-plugin-spec.md`（93 行）—— 检索命中的唯一相关文件，属**设计规划**，
尚未落代码。契约应在其动工前先行发布，否则将新增第 4 种自解读形态。

---

## 七、本盘点的边界（明确未覆盖）

1. **未覆盖**：`Instance/Dev/**` 下实际安装的第三方扩展中是否还有 Authority 消费者
   （L1-MF-15 ④ 禁止遍历实例 `data/`；如需覆盖，须用户批准后走路径级判断）。
2. **未覆盖**：仓群之外（GitHub 上其他 fork / 第三方作者）的消费者 —— 无登记载体，本次无法盘点。
   此项本身即是治理缺口：**无任何机制能让仓群外的消费者被登记**（见 `01` §三）。
