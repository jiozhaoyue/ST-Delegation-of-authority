# 01 · 跨仓兼容与版本绑定：现状证据

> 任务：`09-25-authority-plugin-governance-plan` · 主题一证据
> 方法：静态检索 `packages/shared-types/src`、`packages/sdk-extension/src`、`packages/server-plugin/src`、`docs/server/`

---

## 一、结论先行

**Authority 目前没有任何"版本绑定"机制。** 消费者无法声明「我需要 Authority ≥ X」，也无法在运行时得知「我连的是哪个版本的 Authority」。
现存唯一有版本语义的是 Companion Module 的 `protocolVersion`，而它是**整数精确相等**判定，不是兼容区间。

---

## 二、逐项证据

### E-V1 · `init` 契约里没有"所需版本"字段

```ts
// packages/shared-types/src/session.ts:5-12
export interface AuthorityInitConfig {
    extensionId: string;
    displayName: string;
    version: string;          // ← 消费者自己的版本
    installType: InstallType;
    declaredPermissions: DeclaredPermissions;
    uiLabel?: string;
}
```

- `version` 语义是**消费者上报自己的版本**（用于 Security Center 显示），不是需求声明。
- **无 `requiredAuthorityVersion` / `minPluginVersion` / `requiredFeatures` 之类字段。**
- 三家真实消费者（`authority-adapter.js:141-147`、`AuthorityBridge.ts:175-188`、`authority-store.js:32-41`）
  均只填自家版本号，无一家有能力表达版本需求 —— 因为契约没给位置。

### E-V2 · 会话响应不回传 Authority 自身版本

```ts
// packages/shared-types/src/session.ts:27-36
export interface SessionInitResponse {
    sessionToken: string;
    user: SessionUserInfo;
    extension: SessionExtensionInfo;
    grants: AuthorityGrant[];
    policies: AuthorityPolicyEntry[];
    limits: AuthoritySessionLimits;
    features: AuthorityFeatureFlags;
}
```

- **无 `pluginVersion` / `authorityVersion` / `apiVersion` 字段。**
- 消费者 `init` 成功后**拿不到"对面是谁"** —— 只能假定是自己测试时那个版本。
- 版本信息在 `probe` 响应里存在（`probe.ts:105-106` 的 `apiVersion`/`version`、`probe.ts:151-154` 的
  `pluginVersion`/`sdkBundledVersion`/`sdkDeployedVersion`/`coreBundledVersion`），但 **`probe` 是安装态诊断端点，
  不是会话握手的一部分**；三家消费者无一家调用 `probe`。

### E-V3 · SDK 侧 `version` 只有一处使用（纯透传）

- `packages/sdk-extension/src/client.ts` 全文 **154 KB / 3300+ 行**，`version` 仅命中 **1 处**：
  `client.ts:3299` 的 `version: config.version` —— 即 `cloneInitConfig` 的字段拷贝。
- **无版本比较、无特性探测、无降级分支。** 版本在 SDK 内部是死数据。

### E-V4 · 唯一的版本门禁：`protocolVersion` 精确相等

```ts
// packages/server-plugin/src/constants.ts（末段）
/** Authority module host protocol version. Bump when manifest/handler contract changes. */
export const AUTHORITY_MODULE_PROTOCOL_VERSION = 1;
```

两处判定点（`extension-registry-service.ts`）——**均为 `!==` 精确相等**：

- L247-255：不等 → 记 `protocol_mismatch` **warning** diagnostic（不阻断）
- L325-332：不等 → 记 `protocol_mismatch` **warning** conflict（不阻断）

同时 `companion-module-loader-service.ts` 对**加载**路径也做门禁（其测试
`companion-module-loader-service.test.ts:685` 用 `protocolVersion: 999` 构造"不兼容记录"）。

**风险**：`AUTHORITY_MODULE_PROTOCOL_VERSION` 一旦因 manifest/handler 契约变更而 bump，
**全部现存 Companion Module 会在同一刻被判为不匹配**，无兼容窗口、无灰度、无 `>=` 区间。
注释写的是"Bump when manifest/handler contract changes"，但没有规定 bump 后旧模块怎么办。

### E-V5 · 版本号的唯一权威来源是 `.authority-release.json`

```json
// .authority-release.json（当前值）
pluginVersion:       "1.6.8"
sdkVersion:          "1.6.8"
coreVersion:         "1.6.8"
coreArtifactPlatforms: ["android-arm64","linux-arm64","linux-x64","linux-x64-musl","win32-x64"]
hostBridgeVersion:   "1.1.1"
```

- ~~四套版本号（plugin / sdk / core / hostBridge）各自独立~~ → **已由 E-V8 推翻**：
  `plugin` / `sdk` / `core` 三者**永远同值**，只有 `hostBridgeVersion` 独立。
- `packages/sdk-extension/src/version.ts` 仅一行常量：`export const AUTHORITY_VERSION = '1.6.8'`。
- **不存在"API 版本"** —— 消费者能绑定的语义版本号只有上述四套，且没有一套描述**公开 HTTP/SDK 面**的兼容性。

### E-V6 · 公开面契约的固化程度

| 面 | 有无权威契约文件 | 消费者实际遭遇 |
| --- | --- | --- |
| `init` 入参 | `shared-types/src/session.ts`（TypeScript 类型） | ✅ 三家形态一致（除 `uiLabel` 可选性被 BgLoader 误读为必填，见 `00` §2.1） |
| `storage.kv` 返回形状 | **无** | ❌ zip-converter 写 3 路分支容错（`{value}`/直值/`{data}`），自注"未在 README 固化" |
| `storage.blob.put` 返回形状 | **无** | ❌ zip-converter 写 `put.id ?? put.blobId` 回退（自注"未固化"） |
| `storage.blob.get` 返回形状 | **无** | ❌ zip-converter 写 7 路分支；BgLoader 反其道写**强类型断言** `{record, content, encoding}` |
| `getCapabilities()` 语义 | **无** | ❌ 零消费（见 `02` §二） |
| 端点路由与鉴权 | `docs/server/http-api.md` | ✅ 已固化 |

**核心矛盾（E-V6）**：同一份 SDK 的两个消费者对同一返回形状得出**互斥结论**——
一家写 7 路容错，一家写单路断言。两者不可能同时正确。**这不是消费者的问题，是契约缺位。**
契约一旦缺位，消费者只能各自防御，而防御策略无法被 review、无法随 Authority 升级而收敛。

### E-V8 · **"四套版本号"实际只有两套独立**（E0.3 已补证 · 原 §四 未验项 1 的答案）

```js
// scripts/installable.mjs:105,167-177
const pluginVersion = readAuthorityVersion();      // ← 读根 package.json
...
    pluginVersion,
    sdkVersion:  pluginVersion,                     // ← 同一个值
    coreVersion: pluginVersion,                     // ← 同一个值
    hostBridgeVersion: hostBridgeManifest.bridgeVersion,  // ← 唯一独立来源
```

辅证：`scripts/versioning.mjs:93-98` 的 `syncVersionModules()` 把**同一个版本号**写进
`shared-types` / `server-plugin` / `sdk-extension` / `example-extension` 四个包的 `version.ts`；
`syncCargoVersion()` 同步写 `Cargo.toml` + `Cargo.lock`。

**结论**：
- `pluginVersion` / `sdkVersion` / `coreVersion` **永远同值**（同一次 `version:bump` 写入），
  `.authority-release.json` 中三者相等不是巧合而是机制使然。
- **只有 `hostBridgeVersion` 是独立版本线**（来自 host-bridge manifest，当前 `1.1.1`）。
- **不存在"API 面版本"**，也**不存在独立的 bump 纪律**——一个版本号统管全部公开面与执行层。

**对 D3 的直接支撑**：既然 `plugin/sdk/core` 三条版本线永远同值，
**用它们做"兼容区间绑定"没有可绑定的语义**——区间判定会退化为整体相等判定，
即今天的 `protocolVersion` 精确相等的翻版。这从机制上排除了 D3 候选 (a)/(c)。

### E-V7 · 跨宿主可用性登记已建，但未与版本绑定挂钩

- L12 已交付 `host-capability-matrix.ts`（四宿主 × 能力静态矩阵）与
  `extension-registry-service` 的跨宿主推算（每扩展依赖集 × 宿主矩阵 → 可用/降级/不可用）。
- 但该矩阵描述的是 **宿主（ST/Luker/PT/TT）** 维度，**不是 Authority 版本**维度。
- 两者需要结合才有意义：「在 Luker 上 + Authority 1.7 上，我的依赖集是否可用」——
  当前只能回答前半句。

---

## 三、代表性消费模式（供契约设计参照）

三家消费者的共同形态：

```
① 探测 window.STAuthority?.AuthoritySDK         ← 无版本信息
② sdk.init({extensionId, displayName, version: <自家版本>, declaredPermissions})
③ 成功 → 当作"全能力可用"；失败 → 整体降级
```

**「全能力可用」这一假设没有被任何一家的代码验证过**（BgLoader 甚至硬编码
`agentTools:true`，而它从未声明 `agent.browser`，见 `00` §2.5）。
根因是 `features` 虽在 `SessionInitResponse` 里返回，却**没有消费者读**——
因为契约既没说明它稳定，也没给出按它分支的示例。

---

## 四、本主题的未验项

1. ~~**未验**：`.authority-release.json` 的四套版本号是否有既定的 bump 纪律~~
   → **已解决**，见 E-V8：不存在独立 bump 纪律，`plugin`/`sdk`/`core` 由同一次 `version:bump` 写入、永远同值；
   唯一独立的是 `hostBridgeVersion`。
2. **未验**：`probe` 端点是否需要会话鉴权（若无需鉴权，可作消费者做版本预检的低成本入口）。
3. **未验**：SDK 与 plugin 是否可能版本错配（`.authority-release.json` 有
   `sdkBundledVersion` / `sdkDeployedVersion` 两个字段，说明部署态可能与捆绑态不一致）——
   此路径的后果未评估。
