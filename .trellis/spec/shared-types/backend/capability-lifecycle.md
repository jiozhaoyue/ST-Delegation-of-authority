# 能力生命周期与登记真源（跨层规范）

> **本页自包含**：规范条文与证据均内联，不依赖被 `.gitignore` 排除的任务目录。
> 适用对象：任何**新增、修改或移除 Authority 公开能力**的改动。

---

## 1. 问题陈述（2026-09-25 实测）

能力的存在、阶段、边界三者**没有任何单一载体**，登记面已碎成五套且**两两之间已经漂移**：

| # | 词汇表 | 形态 | 基数 | 位置 |
| --- | --- | --- | --- | --- |
| ① | 权限资源 | 分层点号串（`storage.kv`） | **11** | `packages/server-plugin/src/constants.ts`（`SUPPORTED_RESOURCES`） |
| ② | Feature Flags | 嵌套对象 | **32**（28 布尔 + 4 非布尔） | `packages/shared-types/src/probe.ts:7-52` |
| ③ | Feature Path | 扁平路径 union | **26** | `packages/sdk-extension/src/client/feature-flags.ts:3-29` |
| ④ | 注册表能力 | 扁平原语（`kv`/`jobs`/`agent`/`host-bridge`） | **10** | `packages/shared-types/src/registry.ts:25-35` |
| ⑤ | 宿主可用性矩阵键 | 与 ④ 同形 | 9~10 | `packages/server-plugin/src/services/host-capability-matrix.ts` |

### 1.1 已发生的漂移（三条，均为实测）

- **代码 vs 权威文档**：① 有 11 项资源并配了风险等级与默认策略，而
  `docs/server/capabilities-and-isolation.md` §1–§2 **只登记 8 项**；
  `module.execute`、`agent.run`、`agent.browser` 在该文档**零命中**，
  其中 `module.execute` **在整个 `docs/server/` 无任何文档**，却默认 `granted`。
- **② vs ③**：`AuthorityFeaturePath` 缺 6 项——`jobs.builtinTypes`、`modules.registryVersion`、
  `modules.count`、`host.bridgeProtocolVersion`、`host.eventLedger`、`host.moduleContext`。
  即 **Host Bridge 与模块宿主相关的全部能力无法通过门禁 API 查询**。
- **能力门禁存在但信号恒真**：`packages/sdk-extension/src/client.ts:2408-2431` 提供
  `hasFeature()` / `requireFeature()`，但 `buildAuthorityFeatureFlags()`
  （`packages/server-plugin/src/constants.ts`）把所有布尔**硬编码为 `true`**，
  故门禁恒真；三家真实消费者**零调用**。

### 1.2 决策散落（无载体）

`packages/server-plugin/src/services/extension-registry-service.ts:416-419`：

```ts
if (declared.modules?.execute) {
    // module.execute maps to module hosting, not a registry capability
    // of its own; observed as trivium-agnostic and skipped.
}
```

**一项能力"为何不登记"的决策只存在于代码注释里**——不在登记表、不在文档。

### 1.3 无门禁

`npm run build` / `npm test` / `npm run check:installable` **均不校验文档与代码的一致性**，
故上述漂移能被长期保留。

---

## 2. 能力阶段模型

### 2.1 阶段枚举（4 态，不引入 beta/rc/preview）

```ts
type AuthorityCapabilityStage =
    | 'experimental'   // 已实现可用，契约可能变
    | 'stable'         // 契约冻结，破坏性变更须走废弃流程
    | 'deprecated'     // 仍可用，但已宣告将移除
    | 'removed';       // 已移除（保留在真源里）
```

**表达方式**：稳定字符串 union，与项目内既有的 `severity: 'error'|'warning'|'info'`
（`packages/shared-types/src/modules.ts`）同形；`modules.ts:264` 已自注
「Codes are stable strings so frontends can branch on them **without parsing**」。

### 2.2 准入与退出条件（可判定）

| 阶段 | 消费者可否依赖 | 准入条件 | 退出条件 |
| --- | --- | --- | --- |
| `experimental` | 可以，但**须容忍破坏性变更** | 代码已合并 + 有测试覆盖 | 出现 ≥1 真实消费者稳定使用 → `stable`；或直接 → `removed` |
| `stable` | 可以 | 从 `experimental` 转正，**且已有真实消费者** | 决定移除 → `deprecated` |
| `deprecated` | 可以，但**应迁移** | 决定移除 + **给出过渡期时长** | 过渡期满 → `removed` |
| `removed` | **不可** | 过渡期已满 | — |

**三条硬约束（防止阶段成为摆设）**：
1. `stable` 的准入**必须**含"已有真实消费者"——否则冻结的是空契约。
2. `deprecated` 的准入**必须**含"过渡期时长"——不允许无限期 `deprecated`。
3. `removed` **保留在真源里**，不删除——这是漂移检查能识别**反向漂移**（代码删了但文档还写着）的前提。

---

## 3. 登记真源与派生视图

### 3.1 真源形态

在 `packages/shared-types/src/` 新增一个**只读常量**，每能力一条：

```ts
interface AuthorityCapabilityEntry {
    resource: PermissionResource;                 // ① 与 SUPPORTED_RESOURCES 逐字一致
    registryName: AuthorityCapability | null;     // ④ 投影名；null = 不投影
    featurePath: AuthorityFeaturePath | null;     // ③ 门禁路径；null = 无对应路径
    stage: AuthorityCapabilityStage;              // 新增：生命周期阶段
    risk: RiskLevel;                              // 取自 RESOURCE_RISK，不重复定义
    docAnchor: string | null;                     // 新增：权威文档章节号；null = 尚未登记
    projectionNote: string | null;                // 不投影的理由（承接 §1.2 的代码注释）
}
```

**设计要点**：
- 真源**不重复定义** `risk` 与资源顺序，只**新增它独有的两列**：`stage` 与 `docAnchor`。
- `docAnchor: null` **是有意义的取值**，精确表达"该能力尚未进入权威文档"（§1.1 的漂移被**显式登记**而非隐藏）。
- `projectionNote` 把 §1.2 那条只存在于代码注释里的决策**提升为数据**。

### 3.2 五套词汇表的收敛

| 词汇表 | 收敛方式 | 是否改行为 |
| --- | --- | --- |
| ① 权限资源 | **保持为真源的键空间** | 否 |
| ② Feature Flags | 改为**由真源派生** | **否**——派生结果每个值仍是 `true`，逐字节不变（§3.3） |
| ③ Feature Path | 改为**由真源派生** | **否**——补齐 6 项是**放宽**（原先编译不过的调用现在编译得过） |
| ④ 注册表能力 | `capabilitiesFromDeclaredPermissions()` 的 `if` 链改为**查真源** | **否**——输出逐项对拍相同 |
| ⑤ 宿主矩阵键 | **不动**（宿主维度，非 Authority 能力维度）；仅要求键集与 ④ 对齐 | 否 |

**唯一实质新增**：`stage` 与 `docAnchor` 两列。其余四套全部变为**派生视图**。

### 3.3 为什么"派生"是零行为变更

- **② 不改值**：真源首次落地时是**照现状逐项抄录**的，派生结果与今天的手写字面量逐项相同。
  派生收益**不在值，在结构**：新增能力若不在真源登记，`features` 里就**不会出现**它，
  任何读 `features` 的代码会立刻发现字段是 `undefined`——**漂移被结构性消除**。
- **③ 是放宽**：union 从 26 扩到 32，只影响**原先不合法**的调用。已通过编译的代码不受影响
  （唯一消费方是 SDK 自己的 `getFeatureAvailability`，补 `case` 即可）。
- **④ 的等价性可对拍**：见 §4 断言 A2。

---

## 4. 漂移防护（三条断言）

| # | 断言 | 捕获的漂移 |
| --- | --- | --- |
| **A1** | 真源中 `docAnchor: null` 的条目数 == 0（或全部在显式豁免清单内） | **§1.1 的既有漂移**（11 vs 8；`module.execute` 零文档） |
| **A2** | 对全部 11 项 `PermissionResource` 构造 `DeclaredPermissions`，断言 `capabilitiesFromDeclaredPermissions()` 输出 == 真源的 `registryName` 投影 | ④ 的映射与真源脱节 |
| **A3** | 真源的 `featurePath` 集合（去 null）== `AuthorityFeaturePath` union 成员集合 | **§1.1 的既有漂移**（26 vs 32 缺 6 项） |

> **A3 的定位（2026-09-25 实测后修正）**：A3 是**双保险**，不是唯一防线。
> 实测：向 `AuthorityFeaturePath` 新增成员而漏加 `getFeatureAvailability()` 的 switch `case` 时，
> `tsc -b packages/sdk-extension` 报 **`error TS2366: Function lacks ending return statement and return type
> does not include 'undefined'`** ——**编译期已能拦住**"漏加 case"（不依赖 `noImplicitReturns`，
> 因为函数声明返回 `boolean`、union 未全覆盖时 TS 判定末尾可达）。
> A3 补的是编译期抓不到的形态：**加了 `case` 但路径名与真源不一致**（如真源 `host.eventLedger`
> vs switch `host.event-ledger`）。

### 4.1 挂载位置（复用既有质量门，不新建管线）

作为 `packages/shared-types` 或 `packages/server-plugin` 的**既有测试文件内的新 `it()`**。
`npm test`（`vitest run`）已包含它，**无需改 CI、无需改 `package.json`**。

**有意为之的代价**：文档成为构建依赖——改真源不改文档会**测试失败**。
这正是 §1.3 的漂移能长期存活的解药；该代价是方案要买的东西，不是副作用。

**回滚点**：三条 `it()` 各自独立，可单独跳过或删除。

### 4.2 不做的检查（及其理由）

| 未采纳 | 理由 |
| --- | --- |
| schema 校验库校验真源 | 引入外部依赖；真源是静态常量，TS 类型已足够 |
| 把 `features` 改为**真实运行时探测** | 会改变现有消费者行为（今天恒真的门禁会突然返回 false）——只能作为后续独立任务论证 |
| CI 扫描中文文档抓取能力名做交叉校验 | 新管线 + 散文抓取脆弱；A1 用显式 `docAnchor` 更可靠 |

---

## 5. 能力废弃流程

```
experimental ──(有真实消费者)──→ stable ──(决定移除)──→ deprecated ──(过渡期满)──→ removed
      │                                                                              ▲
      └────────────────────(从未有消费者，可直接删)──────────────────────────────────┘
```

### 5.1 通知载体（复用既有，不新增通道）

| 环节 | 载体 |
| --- | --- |
| 宣告即将废弃 | 真源 `stage: 'deprecated'` + `docAnchor` 指向文档废弃说明节 |
| 消费者**运行时**得知 | 会话回执的能力集声明（见 `.trellis/spec/server-plugin/backend/version-binding.md` §2） |
| 人读 | `docs/server/capabilities-and-isolation.md` 对应条目标注（由 A1 保证不漏） |
| 变更日志 | 既有 release 流程 |

**不做运行时推送通知**：废弃是**月级**节奏，消费者在 `init` 时读取回执已足够；
推送需新增事件通道与订阅机制。

### 5.2 过渡期定义

- **粒度**：按**次版本**（`version:bump` 的 minor）计，不按日历。
  `plugin`/`sdk`/`core` 三版本由同一次 `version:bump` 写入、永远同值（`scripts/installable.mjs:167-171`）。
- `deprecated` → `removed`：**至少 1 个 minor**。
- `stable` 能力：**至少 2 个 minor**（契约已冻结，给更长迁移窗口）。
- `experimental` 能力：**可直接 removed**，无过渡期（这正是 `experimental` 的含义）。

### 5.3 硬删条件（须同时满足）

1. 已 `deprecated` 且过渡期已满；
2. 真源条目的 `stage` 已更新为 `removed`（**保留条目**）；
3. 权威文档对应节已标注移除（A1 覆盖）；
4. **真实消费者数 == 0**（由 L12 注册表的依赖矩阵交叉确认，
   `docs/server/http-api.md` §3.2/§4.8 提供该视图）。
