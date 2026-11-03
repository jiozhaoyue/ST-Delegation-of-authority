# 02 · 跨仓库兼容与版本绑定（规范）

> 任务：`09-25-authority-plugin-governance-plan` · 对应 `prd.md` R2 · `design.md` D3
> 证据：`research/01-version-and-compat-surface.md`
> 能力名与阶段以 [`deliverables/03`](03-capability-lifecycle.md) 的真源为准；降级语义与
> [`deliverables/01`](01-consumer-inventory.md) §3.3 同源（`design.md` 接缝 B/C）。

---

## 〇、结论先行

1. **当前没有任何版本绑定机制。** 消费者无法声明"我需要什么"，Authority 不回传"我是谁"。
   （`research/01` E-V1/V2）
2. **"四套版本号"是个误解**——`plugin`/`sdk`/`core` 由同一次 `version:bump` 写入、**永远同值**，
   只有 `hostBridgeVersion` 独立。故**没有可用于兼容区间的版本线**。（`research/01` E-V8）
3. 唯一的版本门禁是 Companion Module `protocolVersion` 的**整数精确相等**判定
   ——**bump 即全量失效**，无兼容窗口。（`research/01` E-V4）
4. **公开面返回形状大量未固化**，导致同一份 SDK 的两家消费者得出互斥结论。
   （`research/01` E-V6）
5. 因此本契约的绑定方式**不用版本区间，用能力集声明**（D3 裁定）——
   辅以 Authority 自身标识的回传（供排障，不供判定）。

---

## 一、版本面现状图（R2.1）

| 标识 | 当前值 | 语义边界 | bump 纪律 |
| --- | --- | --- | --- |
| `pluginVersion` | `1.6.8` | Authority 插件整体版本 | **与下两项同源**：同一次 `node scripts/installable.mjs sync` 写入（`scripts/installable.mjs:167-171`） |
| `sdkVersion` | `1.6.8` | SDK 捆绑版本 | 同上（值取自 `pluginVersion`） |
| `coreVersion` | `1.6.8` | Rust core 版本 | 同上（值取自 `pluginVersion`） |
| `hostBridgeVersion` | `1.1.1` | Host Bridge 补丁版本 | **独立**（取自 host-bridge manifest）；受 L0-12 约束，跨宿主插件不得依赖 |
| `AUTHORITY_MODULE_PROTOCOL_VERSION` | `1` | Companion Module manifest/handler 契约版本 | 注释规定「Bump when manifest/handler contract changes」，**但未规定 bump 后旧模块如何处理** |
| `features.registryVersion` | `1` | 复用上述同一常量 | **语义被压在一个字段上**（既是模块协议版本又是注册表版本）——见 `03` §七 未验项 3 |
| `AUTHORITY_VERSION`（各包 `version.ts`） | `1.6.8` | 由 `version:sync` 生成 | 生成物，不手改 |

**关键结论**：**不存在"API 面版本"**，也不存在独立的 bump 纪律。
`plugin`/`sdk`/`core` 三条线永远同值，故**无法用它们表达"公开 API 兼容区间"**。
这从机制上排除了「语义版本区间」方案（`design.md` D3 候选 a/c）。

---

## 二、版本绑定契约草案（R2.2 · 字段级）

### 2.1 绑定方式：**能力集声明**（而非版本区间）

消费者声明"我需要哪些能力、且要到什么阶段"，Authority 回执"哪些满足、哪些不满足"。

**理由**：消费者真正关心的不是"对面是 1.6.8 还是 1.7.0"，而是"我要用的那几个能力现在能不能用"。
且 §一 已证明版本号没有可绑定的语义。

### 2.2 字段设计（全部为**新增可选字段** → R6.1 纯增加）

**消费者 → Authority**（`AuthorityInitConfig` 新增 1 个可选字段）：

```ts
// packages/shared-types/src/session.ts —— AuthorityInitConfig 新增
export interface AuthorityCapabilityRequirement {
    /** 能力名，取自 deliverables/03 的真源（registryName 或 resource） */
    capability: string;
    /** 消费者要求的最低阶段；缺省 'stable' */
    minStage?: AuthorityCapabilityStage;
}

export interface AuthorityInitConfig {
    // ...既有 6 个字段保持不变...
    /** 新增（可选）：本扩展声明的最低能力要求。缺省 = 不声明 = 不做任何检查。 */
    requiredCapabilities?: AuthorityCapabilityRequirement[];
}
```

**Authority → 消费者**（`SessionInitResponse` 新增 2 个可选字段）：

```ts
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
    /** 'satisfied' | 'below-required' | 'unknown' */
    status: 'satisfied' | 'below-required' | 'unknown';
}
```

### 2.3 语义与降级（normative）

| 情形 | Authority 行为 | 消费者**必须**的行为 |
| --- | --- | --- |
| 未声明 `requiredCapabilities` | 回执字段缺省（不生成 `capabilityReport`） | 与今天完全一致（**向后兼容**） |
| 声明且全部 `satisfied` | 正常建立会话 | 正常使用 |
| 声明但有 `below-required` / `unknown` | **仍然成功建立会话**（不阻断），回执如实报告 | **必须显式降级**：禁用依赖该能力的功能，并走 `01` §3.3 的降级路径 |
| Authority 版本过旧、不识别 `requiredCapabilities` | 忽略该字段（TS 可选字段天然兼容） | 回执字段缺失时，**按"无法确认"处理**，等同于声明未满足 |

**核心纪律（R2.2 要求）**：**不满足时不允许静默失效**。
`below-required` / `unknown` 必须导致消费者**显式降级**——这与 `research/01` E-V6 揭示的
"两家消费者对同一形状得出互斥结论"是同一类问题的解药：**把不确定性变成回执里的确定取值**。

**为什么不阻断会话**：阻断会违反 R6.2（改变了现有行为——今天的 `init` 从不因能力不足而失败）。
回执式设计让消费者自己决定降级粒度，Authority 只做如实报告。

---

## 三、公开面返回形状固化清单（R2.3）

下表逐条给出应固化的形状与载体。**固化本身不属本任务**（R5 不改产品代码），
本清单是后续任务的输入。

| # | 面 | 当前状态 | 应固化的形状 | 固化载体 |
| --- | --- | --- | --- | --- |
| 1 | `storage.kv.get` | zip-converter 兼容 `{value}` / 直值 / `{data}` 三种形状，自注"未在 README 固化"（`authority-store.js:66-73`） | **`{ value: unknown \| null }`**（单一形状） | `shared-types` 类型 + `http-api.md` 字段表 |
| 2 | `storage.blob.put` | zip-converter 写 `put.id ?? put.blobId` 回退（`:184`） | **`{ id: string }`**（`id` 为唯一标识字段） | 同上 |
| 3 | `storage.blob.get` | zip-converter 7 路分支（`:267-288`）；BgLoader 单路断言 `{record, content, encoding}`（`AuthorityBridge.ts:24`） | **`{ record, content: string, encoding: 'base64' }`**（BgLoader 的断言即正解，zip-converter 的容错多余） | 同上 |
| 4 | `client.getCapabilities()` | 存在但**零外部消费**；返回会话自省快照（`client.ts:2476-2489`） | 明确其**非能力查询**语义，改由 §二 的 `capabilityReport` 承担能力查询 | `http-api.md` 说明节 + 类型注释 |
| 5 | `hasFeature` / `requireFeature` | 存在，但信号恒真（`03` §〇.1） | 保持签名不变；其可靠性取决于 `03` 的能力真源落地 | `03` §二 |

**对 `research/01` E-V6 互斥结论的裁定**：在新契约下，
- **`ST-BgLoader` 的单路强类型断言将变得正确**（形状被固化，断言不再是赌博）；
- **`ST-zip-converter` 的 7 路容错将变得多余**（不再是错误，但可以安全简化）。

两者在固化后**不再互斥**——这正是"契约缺位"被消除的验证标志。

---

## 四、`protocolVersion` 兼容窗口方案（R2.4）

### 4.1 问题

`companion-module-loader-service.ts` 与 `extension-registry-service.ts`（两处）
均以 `protocolVersion !== AUTHORITY_MODULE_PROTOCOL_VERSION` **精确相等**判定。
常量注释规定「Bump when manifest/handler contract changes」——
**一旦 bump，全部现存 Companion Module 在同一刻被判不匹配**，无灰度、无兼容窗口。

### 4.2 R6 约束下的唯一可行形态：**新增并行判定，旧判定一字不改**

（`design.md` §1.3 明确要求：凡需改动既有判定逻辑的方案，必须给出「新增并行判定 + 保留旧判定」的过渡形态。）

```
新增：manifest 可【可选】声明 protocolVersionRange（缺省 = 不声明 = 完全走旧路径）
旧判定：protocolVersion !== AUTHORITY_MODULE_PROTOCOL_VERSION
        → 【原样保留、原样告警】，不删除、不修改
新判定：仅在 manifest【声明了】protocolVersionRange 时生效
        → 且只把告警【降级为 info】，不提升为阻断
```

**形式化**（新增，不改既有）：

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

### 4.3 为什么这是最小侵入（R6 论证）

| 判定 | 核验 |
| --- | --- |
| **纯增加** | 新增 1 个可选 manifest 字段 + 1 个并行判定分支；**不删不改**既有判定 |
| **零行为变更** | 不声明 `protocolVersionRange` 的模块（即今天**全部**现存模块）走旧路径，行为逐字节一致 |
| **单一 PR** | "为 Companion Module 增加可选的协议版本区间声明" —— 一句话边界清晰 |
| **可独立回滚** | 删除新增分支与字段即可，旧判定从未被动过 |

**若最终无法构造出上述并行形态**（例如无法在不改旧判定的前提下表达区间），
则该方案**移出建议清单**，标为"需后续任务单独论证"（AC-14）。
本文的方案**已满足**并行要求，故保留在清单内。

---

## 五、三消费者改造点清单（R2.5 · 只出清单，不实施）

| # | 仓 | 改造点 | 位置 | 理由 |
| --- | --- | --- | --- | --- |
| 1 | `SillyTavern-Timelines` | 版本改从单一来源读 | `authority-adapter.js:110,143` | 声明 `2.4.0` vs `manifest.json:9` `1.2.0`，**已失真** |
| 2 | `ST-zip-converter` | 版本改从单一来源读 | `authority-store.js:35` | 声明 `1.0.0` vs `package.json` `0.1.0`，**已失真** |
| 3 | `ST-zip-converter` | 收窄返回形状解析（可选） | `authority-store.js:66-73,184,267-288` | §三 固化后可简化；**非必需**，容错不构成错误 |
| 4 | `ST-BgLoader` | 修正 `uiLabel` 必填性 | `AuthorityBridge.ts:90` | 契约中 `uiLabel` 可选（`session.ts:11`） |
| 5 | `ST-BgLoader` | `agentTools` 不再硬编码 | `AuthorityBridge.ts:190-195` | 未声明 `agent.browser` 却标记可用 |
| 6 | `ST-BgLoader` | `initPromise` 失败后清空 | `AuthorityBridge.ts:148-152` | 违反 `01` §3.3 D3（无法自愈） |
| 7 | **本仓官方示例** | SDK 缺失时改为静默降级 | `packages/example-extension/src/index.ts:28-30` | 违反 L0-11；是被照抄的样板 |
| 8 | 三家 | 采纳 `requiredCapabilities` 声明（可选） | 各自 `sdk.init` 调用处 | 本契约的新能力，**可选**采纳 |

**排序建议**：#7 优先（影响面最大——它是样板），其次 #1/#2（已是事实错误），
再次 #4/#6（影响可用性），最后 #3/#5/#8（改进项）。

---

## 六、R6 合规表（最小侵入自证）

| 方案 | ① 纯增加点 | ② 零行为变更论证 | ③ 单一 PR 边界 | ④ 回滚点 |
| --- | --- | --- | --- | --- |
| **`requiredCapabilities` 入参** | `AuthorityInitConfig` +1 可选字段 | 缺省即不声明，走现状 | "允许扩展声明所需能力集" | 删除字段，无消费方依赖 |
| **`capabilityReport` 回执** | `SessionInitResponse` +2 可选字段 | 缺省不生成，旧消费者读不到也无需读 | "会话回执报告能力满足情况" | 删除字段 |
| **`authority` 标识回传** | `SessionInitResponse` +1 可选字段 | 纯附加信息 | "会话回传 Authority 自身版本标识" | 删除字段 |
| **`protocolVersionRange`** | manifest +1 可选字段 + 1 个并行判定 | 不声明 range 的模块走旧路径，逐字节一致（§4.3） | "Companion Module 可声明协议版本区间" | 删除并行分支，旧判定从未改动 |
| **返回形状固化** | **无代码**（本任务只出清单） | 无代码即无行为变更 | "固化存储 API 的返回形状"（后续任务） | — |

**五个方案全部通过四道判定。** 其中前四个需要改 Authority 代码（属后续任务的实施范围），
第五个是纯清单。

---

## 七、未验项

| # | 未验内容 | 影响 | 处置 |
| --- | --- | --- | --- |
| 1 | `probe` 端点是否需要会话鉴权 | 若无需鉴权，可作消费者做**低成本预检**的入口（在 `init` 之前就知道够不够） | 后续任务核对 |
| 2 | `sdkBundledVersion` / `sdkDeployedVersion` 错配的后果 | `.authority-release.json` 有这两个字段，说明部署态可能滞后于捆绑态 | **挂起**：本节未评估，需单独论证 |
| 3 | `satisfiesRange()` 的具体实现（本文只给形态，未给区间语法） | 影响 §四 的可实施性 | **挂起**：本任务只论证"并行判定形态可行"，具体区间语法属实施阶段的选型 |
| 4 | 三家消费者是否愿意采纳 `requiredCapabilities` | 契约的实际采纳率 | 后续任务观察 |
