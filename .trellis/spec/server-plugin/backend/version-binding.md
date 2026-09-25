# 版本绑定与公开面兼容（跨仓规范）

> **本页自包含**：规范条文与证据均内联，不依赖被 `.gitignore` 排除的任务目录。
> 能力名与阶段以 `../../shared-types/backend/capability-lifecycle.md` 的真源为准；
> 降级语义与 `../../sdk-extension/frontend/consumer-contract.md` §2.3 同源。

---

## 1. 版本面现状（2026-09-25 实测）

| 标识 | 语义边界 | bump 纪律 |
| --- | --- | --- |
| `pluginVersion` | Authority 插件整体版本 | **与下两项同源**：同一次 `node scripts/installable.mjs sync` 写入（`scripts/installable.mjs:167-171`） |
| `sdkVersion` | SDK 捆绑版本 | 同上（值取自 `pluginVersion`） |
| `coreVersion` | Rust core 版本 | 同上（值取自 `pluginVersion`） |
| `hostBridgeVersion` | Host Bridge 补丁版本 | **独立**（取自 host-bridge manifest）；跨宿主插件不得依赖（统一规则 L0-12） |
| `AUTHORITY_MODULE_PROTOCOL_VERSION` | Companion Module manifest/handler 契约版本 | `packages/server-plugin/src/constants.ts`；注释规定「Bump when manifest/handler contract changes」，**未规定 bump 后旧模块如何处理** |
| `features.registryVersion` | 复用上述同一常量 | **语义被压在一个字段上** |
| 各包 `version.ts` 的 `AUTHORITY_VERSION` | 由 `npm run version:sync` 生成 | 生成物，不手改 |

### 1.1 关键结论

1. **"四套版本号"是误解**：`plugin`/`sdk`/`core` **永远同值**，只有 `hostBridgeVersion` 独立。
   故**没有可用于兼容区间的版本线**——无法用它们表达"公开 API 兼容区间"。
2. **不存在"API 面版本"**，也不存在独立的 bump 纪律。
3. **消费者无法声明需求、Authority 不回传身份**：
   - `AuthorityInitConfig`（`packages/shared-types/src/session.ts:5-12`）无"所需版本"字段；
   - `SessionInitResponse`（同文件 `:27-36`）无 Authority 自身版本字段；
   - `packages/sdk-extension/src/client.ts` 全文 154KB，`version` 仅 **1 处**使用（`:3299` 字段拷贝），
     无版本比较、无特性探测、无降级分支。

---

## 2. 绑定契约：能力集声明（**不用版本区间**）

### 2.1 理由

消费者真正关心的是"我要用的那几个能力现在能不能用"，而非"对面是 1.6.8 还是 1.7.0"。
§1.1 已证明版本号没有可绑定的语义。

### 2.2 字段设计（全部为**新增可选字段**）

```ts
// packages/shared-types/src/session.ts —— AuthorityInitConfig 新增
export interface AuthorityCapabilityRequirement {
    /** 能力名，取自 capability-lifecycle.md 的真源 */
    capability: string;
    /** 要求的最低阶段；缺省 'stable' */
    minStage?: AuthorityCapabilityStage;
}

export interface AuthorityInitConfig {
    // ...既有 6 个字段保持不变...
    /** 新增（可选）：本扩展声明的最低能力要求。缺省 = 不声明 = 不做任何检查。 */
    requiredCapabilities?: AuthorityCapabilityRequirement[];
}

// packages/shared-types/src/session.ts —— SessionInitResponse 新增
export interface SessionInitResponse {
    // ...既有 7 个字段保持不变...
    /** 新增：Authority 自身标识，仅供排障与展示，【不得】用于判定 */
    authority?: {
        pluginVersion: string;
        moduleProtocolVersion: number;
        hostBridgeVersion: string | null;
    };
    /** 新增：对 requiredCapabilities 的逐项回执 */
    capabilityReport?: AuthorityCapabilityReportEntry[];
}

export interface AuthorityCapabilityReportEntry {
    capability: string;
    /** Authority 侧该能力的真实阶段；未知能力为 null */
    stage: AuthorityCapabilityStage | null;
    status: 'satisfied' | 'below-required' | 'unknown';
}
```

### 2.3 语义与降级（normative）

| 情形 | Authority 行为 | 消费者**必须**的行为 |
| --- | --- | --- |
| 未声明 `requiredCapabilities` | 回执字段缺省（不生成 `capabilityReport`） | 与今天完全一致（**向后兼容**） |
| 声明且全部 `satisfied` | 正常建立会话 | 正常使用 |
| 声明但有 `below-required` / `unknown` | **仍然成功建立会话**（不阻断），回执如实报告 | **必须显式降级**：禁用依赖该能力的功能，走 `../../sdk-extension/frontend/consumer-contract.md` §2.3 的降级路径 |
| Authority 版本过旧、不识别该字段 | 忽略（TS 可选字段天然兼容） | 回执缺失时**按"无法确认"处理**，等同于未满足 |

**核心纪律**：**不满足时不允许静默失效**。`below-required` / `unknown` 必须导致消费者**显式降级**。

**为什么不阻断会话**：阻断会改变现有行为（今天的 `init` 从不因能力不足而失败）。
回执式设计让消费者自己决定降级粒度，Authority 只做如实报告。

---

## 3. 公开面返回形状固化清单

| # | 面 | 当前状态 | 应固化的形状 | 载体 |
| --- | --- | --- | --- | --- |
| 1 | `storage.kv.get` | `ST-zip-converter` 兼容 `{value}` / 直值 / `{data}` 三种形状，自注"未在 README 固化"（`authority-store.js:66-73`） | **`{ value: unknown \| null }`**（单一形状） | `shared-types` 类型 + `docs/server/http-api.md` 字段表 |
| 2 | `storage.blob.put` | 同上仓写 `put.id ?? put.blobId` 回退（`:184`） | **`{ id: string }`** | 同上 |
| 3 | `storage.blob.get` | 同上仓 7 路分支（`:267-288`）；`ST-BgLoader` 单路强类型断言 `{record, content, encoding}`（`AuthorityBridge.ts:24`） | **`{ record, content: string, encoding: 'base64' }`**（**BgLoader 的断言即正解**） | 同上 |
| 4 | `client.getCapabilities()` | 存在但零外部消费；返回会话自省快照（`client.ts:2476-2489`） | 明确其**非能力查询**语义；能力查询由 §2 的 `capabilityReport` 承担 | `docs/server/http-api.md` 说明节 + 类型注释 |
| 5 | `hasFeature` / `requireFeature` | 存在，但信号恒真（见 `../../shared-types/backend/capability-lifecycle.md` §1.1） | 保持签名不变；其可靠性取决于能力真源落地 | `../../shared-types/backend/capability-lifecycle.md` §3 |

**对"两家消费者互斥结论"的裁定**：固化后，
`ST-BgLoader` 的单路强类型断言**变为正确**，`ST-zip-converter` 的 7 路容错**变为多余**
（不再是错误，但可安全简化）。两者**不再互斥**——这是"契约缺位"被消除的验证标志。

---

## 4. `protocolVersion` 兼容窗口

### 4.1 问题

`packages/server-plugin/src/services/companion-module-loader-service.ts` 与
`extension-registry-service.ts`（两处：`:247-255`、`:325-332`）均以
`protocolVersion !== AUTHORITY_MODULE_PROTOCOL_VERSION` **精确相等**判定。
一旦常量 bump，**全部现存 Companion Module 在同一刻被判不匹配**，无灰度、无兼容窗口。

### 4.2 唯一可行形态：**新增并行判定，旧判定一字不改**

```
新增：manifest 可【可选】声明 protocolVersionRange（缺省 = 不声明 = 完全走旧路径）
旧判定：protocolVersion !== AUTHORITY_MODULE_PROTOCOL_VERSION
        → 【原样保留、原样告警】，不删除、不修改
新判定：仅在 manifest【声明了】protocolVersionRange 时生效
        → 且只把告警【降级为 info】，不提升为阻断
```

```ts
// 既有（保持不变）
if (manifest.protocolVersion !== AUTHORITY_MODULE_PROTOCOL_VERSION) {
    diagnostics.push({ severity: 'warning', code: 'protocol_mismatch', message: ... });
}

// 新增（并行），仅在声明了 range 时抑制上述告警
if (manifest.protocolVersionRange
    && satisfiesRange(manifest.protocolVersion, manifest.protocolVersionRange)) {
    // 把上一条 warning 降级为 info，不新增阻断
} else {
    // 不声明 range 的模块：行为与今天逐字节一致
}
```

**为什么不直接改成区间判定**：那会改动既有判定逻辑，从而改变现有模块的行为。
本仓的最小侵入纪律要求：凡需改动既有判定，必须给出「新增并行判定 + 保留旧判定」的过渡形态。

---

## 5. 消费者改造点清单（只出清单，不实施）

| # | 仓 | 改造点 | 位置 |
| --- | --- | --- | --- |
| 1 | **本仓官方示例** | SDK 缺失时改为静默降级（**优先**，它是被照抄的样板） | `packages/example-extension/src/index.ts:28-30` |
| 2 | `SillyTavern-Timelines` | 版本改从单一来源读 | `src/adapters/authority-adapter.js:110,143` |
| 3 | `ST-zip-converter` | 版本改从单一来源读 | `src/storage/authority-store.js:35` |
| 4 | `ST-BgLoader` | 修正 `uiLabel` 必填性 | `src/backend/AuthorityBridge.ts:90` |
| 5 | `ST-BgLoader` | `initPromise` 失败后清空（恢复自愈） | `AuthorityBridge.ts:148-152` |
| 6 | `ST-BgLoader` | `agentTools` 不再硬编码 | `AuthorityBridge.ts:190-195` |
| 7 | `ST-zip-converter` | 收窄返回形状解析（可选，非必需） | `authority-store.js:66-73,184,267-288` |
| 8 | 三家 | 采纳 `requiredCapabilities` 声明（可选） | 各自 `sdk.init` 调用处 |

---

## 6. 验证方式

```bash
# ① 确认新增字段是纯增加（既有字段未被改动）
git diff packages/shared-types/src/session.ts

# ② 确认 protocolVersion 旧判定未被删改
rg -n "protocolVersion !== AUTHORITY_MODULE_PROTOCOL_VERSION" packages/server-plugin/src/

# ③ 确认不声明 range 的模块行为未变（既有测试应全绿）
npm test
```
