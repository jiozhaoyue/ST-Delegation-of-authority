# 03 · 能力演进生命周期（规范）

> 任务：`09-25-authority-plugin-governance-plan` · 对应 `prd.md` R3 · `design.md` D1/D2
> **本文是能力词汇表的真源规范。** `deliverables/01` 的权限形态表与 `deliverables/02` 的能力名清单
> **一律引用本文，不得复制**（`design.md` 接缝 A/B）。
> 阅读顺序：本文写完后 `01`、`02` 才成立。

---

## 〇、结论先行

1. 能力**门禁 API 已经存在**（`hasFeature` / `requireFeature`），但**信号恒真**——`buildAuthorityFeatureFlags()`
   把所有布尔硬编码为 `true`。消费者即使调用也问不出任何信息。（`research/02` E-C7.1）
2. 能力的**登记面已经碎成五套**，且其中两套之间**已经漂移**（`AuthorityFeaturePath` 26 项
   vs `AuthorityFeatureFlags` 32 项，**缺 6 项**）。（`research/02` E-C6 / E-C7.3）
3. 权威文档与代码**已经漂移**：`SUPPORTED_RESOURCES` 有 11 项资源，标题即「能力矩阵」的
   `capabilities-and-isolation.md` 只登记 8 项；`module.execute` 全仓无文档却默认 `granted`。
   （`research/02` E-C3）
4. 以上三点的共同根因：**能力的存在、阶段、边界三者没有任何单一载体**，
   决策散落在代码常量、类型 union、函数体 `if`、代码注释、以及一份会漂的文档里。
5. 本文的方案**全部是"新增声明 + 新增断言"**，不改任何既有字段的语义、不改任何判定逻辑、
   不改任何消费者行为（R6）。

---

## 一、能力阶段模型（D2）

### 1.1 阶段枚举（4 态）

```ts
type AuthorityCapabilityStage =
    | 'experimental'   // 已实现可用，契约可能变
    | 'stable'         // 契约冻结，破坏性变更须走废弃流程
    | 'deprecated'     // 仍可用，但已宣告将移除
    | 'removed';       // 已移除（保留在真源里，作为历史与漂移检查依据）
```

**不引入 `beta` / `rc` / `preview`**：这些阶段无法给出**可判定的**准入/退出条件，
会成为"永远停在 beta"的借口，也无法让消费者写出确定的分支。

### 1.2 准入与退出条件（可判定）

| 阶段 | 含义 | 消费者可否依赖 | **准入条件** | **退出条件** |
| --- | --- | --- | --- | --- |
| `experimental` | 可用，契约可能变 | 可以，但**须容忍破坏性变更** | 代码已合并 + 有测试覆盖 | 出现 ≥1 个真实消费者稳定使用 → `stable`；或直接 → `removed` |
| `stable` | 契约冻结 | 可以 | 从 `experimental` 转正，**且已有真实消费者** | 决定移除 → `deprecated` |
| `deprecated` | 可用但将移除 | 可以，但**应迁移** | 决定移除 + 给出过渡期时长 | 过渡期满 → `removed` |
| `removed` | 已移除 | **不可** | 过渡期已满 | — |

**硬约束（防止阶段成为摆设）**：
- `stable` 的准入条件里**必须**有"已有真实消费者"——不允许把无人使用的能力直接标 `stable`
  （否则冻结的是空契约）。
- `deprecated` 的准入条件里**必须**有"过渡期时长"——不允许无限期 `deprecated`。
- `removed` **保留在真源里**，不删除。这是漂移检查能识别**反向漂移**
  （"代码删了但文档还写着"）的前提。

### 1.3 表达方式：复用既有范式，不新造

阶段是**稳定字符串 union**，与项目内既有的两个范式同形：

| 既有范式 | 出处 | 形态 |
| --- | --- | --- |
| `severity: 'error' \| 'warning' \| 'info'` | `shared-types/src/modules.ts` | 稳定字符串 union |
| 冲突码 `code` 为稳定字符串 | `modules.ts:264` 自注 "Codes are stable strings so frontends can branch on them **without parsing**" | 稳定字符串 |
| Job 注册表元数据（`description` / `payloadFields[]` / `progressFields[]`） | `server-plugin/src/constants.ts` `BUILTIN_JOB_REGISTRY_SUMMARY` | **字段级能力元数据** |

**结论**：阶段字段直接采用同形 union，TS 消费者可编译期穷尽，JS 消费者可字符串比较。
`BUILTIN_JOB_REGISTRY_SUMMARY` 已证明"把能力元数据写在代码常量里、随 `features` 下发、又被文档引用"
这条路在本项目走得通——**本方案只是把它从"仅 jobs 一个维度"扩展到"全部能力维度"**。

---

## 二、单一真源与派生视图（D1）

### 2.1 真源形态

**新增一个只读常量**（落在 `packages/shared-types/src/`，与 `probe.ts` 同层），
每个能力一条记录：

```ts
interface AuthorityCapabilityEntry {
    /** ① 权限资源名（与 SUPPORTED_RESOURCES 逐字一致） */
    resource: PermissionResource;
    /** 消费侧扁平名（与 AuthorityCapability 一致）；null = 不投影到注册表 */
    registryName: AuthorityCapability | null;
    /** ② Feature Flags 里的扁平路径；null = 无对应门禁路径 */
    featurePath: AuthorityFeaturePath | null;
    /** ③ 生命周期阶段 */
    stage: AuthorityCapabilityStage;
    /** 风险等级（与 RESOURCE_RISK 一致，不重复定义，见 §2.2） */
    risk: RiskLevel;
    /** ④ 权威文档锚点：capabilities-and-isolation.md 的章节号；null = 尚未登记（见 §三） */
    docAnchor: string | null;
    /** 不投影到注册表的理由（如 module.execute）；null = 正常投影 */
    projectionNote: string | null;
}
```

**关键设计点**：

- 这张表**不重复定义** `risk` 与 `SUPPORTED_RESOURCES` 的顺序，而是**引用**它们
  （`risk` 直接取 `RESOURCE_RISK[resource]`）。真源只新增它独有的一列：`stage` 与 `docAnchor`。
- `docAnchor: null` **是有意义的取值**，不是缺省占位——它精确表达"该能力尚未进入权威文档"，
  正是 `research/02` E-C3 的漂移被**显式登记**而非隐藏的形态。
- `projectionNote` 承接 `module.execute` 那条**只存在于代码注释里的决策**（`research/02` E-C6），
  把它从注释提升为数据。

### 2.2 五套词汇表的收敛方案

| 词汇表 | 现状 | 收敛方式 | 是否改行为 |
| --- | --- | --- | --- |
| ① 权限资源（11） | `SUPPORTED_RESOURCES` | **保持为真源的键空间**（真源以它为准逐项建条目） | 否 |
| ② Feature Flags（32） | `buildAuthorityFeatureFlags()` 手写 | 改为**由真源派生**：遍历真源、按 `featurePath` 生成 | **否**——派生结果的每个值仍是 `true`，逐字节不变（见 §2.3） |
| ③ Feature Path（26） | `AuthorityFeaturePath` 手写 union | 改为**由真源派生**：`type AuthorityFeaturePath = NonNullable<Entry['featurePath']>` 的联合 | **否**——补齐 6 项是**放宽**（原先编译不过的调用现在编译得过），不改变任何既有通过编译的代码 |
| ④ 注册表能力（10） | `AuthorityCapability` + 函数体 `if` 链 | `capabilitiesFromDeclaredPermissions()` 的 `if` 链改为**查真源的 `registryName`** | **否**——映射结果逐项相同（含 `module.execute` 的跳过，由 `projectionNote` 表达） |
| ⑤ 宿主矩阵键（9~10） | `host-capability-matrix.ts` 手写 | **本次不动**（它是宿主维度，不是 Authority 能力维度）；仅要求其键集与 ④ 对齐，纳入§三 的断言 | 否 |

**唯一实质新增**：真源里的 `stage` 与 `docAnchor` 两列。其余四套全部变为**派生视图**。

### 2.3 为什么"派生"是零行为变更（R6.2 论证）

这是本方案最容易被误读的一点，特此论证：

- **② 的派生不改值**：`buildAuthorityFeatureFlags()` 现在返回 28 个 `true` + 4 个非布尔。
  派生实现同样返回这些值——因为真源在**首次落地时**就是照现状逐项抄录的。
  派生的**收益不在值，在结构**：此后新增一项能力，若不在真源里登记，`features` 里就**不会出现**它，
  于是任何读 `features` 的代码会立刻发现"我期待的字段是 undefined"。**漂移被结构性消除，而非被断言捕获。**
- **③ 的派生是放宽**：union 从 26 项扩到 32 项，只影响**原先不合法**的调用（现在合法了）。
  已通过编译的代码不会因为 union 变宽而失败（TS 的结构化联合在加成员时对**消费方**
  只在穷尽 switch 场景收紧，而 `AuthorityFeaturePath` 的唯一消费方是 SDK 自己的
  `getFeatureAvailability`，补 case 即可）。
- **④ 的派生等价性可验证**：`capabilitiesFromDeclaredPermissions()` 的输入是 `DeclaredPermissions`，
  真源提供 `resource → registryName` 映射；对全部 11 项输入的输出与现状**逐项可对拍**（见 §三 断言 A2）。

---

## 三、漂移防护（R3.3）

### 3.1 三条断言（可直接写成测试）

| # | 断言 | 捕获的漂移 | 失败时的定位信息 |
| --- | --- | --- | --- |
| **A1** | 真源中 `docAnchor: null` 的条目数 **== 0**（或全部在显式豁免清单内） | **`research/02` E-C3 的既有漂移**（11 vs 8）：`module.execute` / `agent.run` / `agent.browser` 三项无文档 | 打印缺文档的 `resource` 名 |
| **A2** | 对全部 11 项 `PermissionResource` 构造 `DeclaredPermissions`，断言 `capabilitiesFromDeclaredPermissions()` 的输出 == 真源的 `registryName` 投影 | ④ 的映射与真源脱节 | 打印不一致的 `resource` 与两侧取值 |
| **A3** | 真源的 `featurePath` 集合（去 null）== `AuthorityFeaturePath` union 的成员集合 | **E-C7.3 的既有漂移**（26 vs 32 缺 6 项） | 打印缺的路径名 |

**A1 是唯一需要"人写文档"的断言**；A2/A3 是纯代码对拍，一旦真源落地即永久生效。

### 3.2 挂载位置：复用既有质量门，不新建管线

- **推荐**：作为 `packages/shared-types` 或 `packages/server-plugin` 的**既有测试文件内的新 `it()`**
  （例如并入 `extension-registry-service.test.ts` 或新建同目录的 `capability-registry.test.ts`）。
- **理由**：`npm test` 已包含 `vitest run`，故断言自动进入既有质量门，
  **无需改 CI、无需改 `package.json`**——符合 R6.1「不新增管线」。
- **有意为之的代价**：文档成为构建依赖——改真源不改文档会**测试失败**。
  这正是 E-C3 的漂移能长期存活的解药；该代价是方案要买的东西，不是副作用。
- **回滚点**：三条 `it()` 各自独立，可单独跳过或删除而不影响其他测试与产品行为。

### 3.3 为什么不做"更强的"检查

| 未采纳的方案 | 不采纳理由 |
| --- | --- |
| 用 schema 校验库校验真源 | 违反 R6：引入外部依赖，且真源是静态常量、TS 类型已足够 |
| 让 `features` 返回**真实**的能力探测（把 `true` 改为运行时判定） | **违反 R6.2**：那会改变现有消费者的行为（今天恒真的门禁会突然返回 false）。此项只能作为后续独立任务论证 |
| 在 CI 里扫描 `docs/server/*.md` 抓取能力名做交叉校验 | 违反 R6.1（新管线），且文档为中文散文，抓取脆弱；A1 用显式 `docAnchor` 更可靠 |

---

## 四、能力废弃流程（R3.4）

```
experimental ──(有真实消费者)──→ stable ──(决定移除)──→ deprecated ──(过渡期满)──→ removed
      │                                                                              ▲
      └────────────────────(从未有消费者，可直接删)──────────────────────────────────┘
```

### 4.1 通知载体（复用既有，不新造）

| 环节 | 载体 | 说明 |
| --- | --- | --- |
| 宣告即将废弃 | 真源的 `stage: 'deprecated'` + `docAnchor` 指向文档中的废弃说明节 | 真源是机器可读的**唯一**权威源 |
| 消费者**运行时**得知 | 新增只读字段（见 `deliverables/02` §二 的能力集声明回执） | 消费者 `init` 后即可读到"我依赖的 X 已 deprecated" |
| 人读 | `docs/server/capabilities-and-isolation.md` 对应条目标注 deprecated | 由 A1 断言保证不漏 |
| 变更日志 | 既有 release 流程 | 不新增载体 |

**关键：不做运行时推送通知。** 理由：违反 R6（需新增事件通道与订阅机制），
且消费者在 `init` 时读取的能力集声明已足够——废弃是**月级**节奏，不需要实时推送。

### 4.2 过渡期定义

- **粒度**：按**次版本**（`version:bump` 的 minor）计，不按日历。
  理由：`plugin`/`sdk`/`core` 三版本同源 bump（`research/01` E-V8），按版本计数比按日历可判定。
- **最短过渡期**：`deprecated` 后**至少 1 个 minor 版本**方可 `removed`。
- **`stable` 能力**：过渡期**至少 2 个 minor 版本**（契约已冻结，给消费者更长的迁移窗口）。
- **`experimental` 能力**：可**直接 `removed`**，无过渡期——这正是 `experimental` 的含义，
  消费者依赖它就等于接受此风险（§1.2 已写明"须容忍破坏性变更"）。

### 4.3 硬删条件

同时满足才可 `removed`：
1. 已 `deprecated` 且过渡期已满；
2. 真源条目的 `stage` 已更新为 `removed`（**保留条目，不删除**）；
3. 权威文档对应节已标注移除（由 A1 覆盖）；
4. **真实消费者数 == 0**（由 `deliverables/01` 的消费者登记与 L12 registry 的依赖矩阵交叉确认）。

条件 4 是本流程唯一需要"人工判断 + 机械辅助"的一环：L12 registry 已能列出各扩展的能力依赖集
（`docs/server/http-api.md` §3.2/§4.8），故可机械确认。

---

## 五、首批规范化登记输入（R3.5）

以下三项是**当前已发生、但无载体**的决策，作为真源落地的第一批输入：

| # | 事实 | 当前载体 | 规范化后 |
| --- | --- | --- | --- |
| 1 | `module.execute` 不投影到注册表能力 | **仅一句代码注释**（`extension-registry-service.ts:416-419`） | 真源条目 `registryName: null` + `projectionNote: 'module hosting 维度，不属注册表能力'` |
| 2 | `module.execute` / `agent.run` / `agent.browser` 未进权威文档 | **无载体**（文档零命中） | 真源条目 `docAnchor: null` → 被 A1 断言**立即捕获**，成为待补文档的工单 |
| 3 | `host.*` 三项 + `jobs.builtinTypes` + `modules.registryVersion/count` 无法通过门禁查询 | **无载体** | 真源条目补 `featurePath`；若确无对应路径则显式 `featurePath: null` 并被 A3 覆盖 |

**注意 #2 的处置方式**：本任务**不补文档**（R5 / AC-11 要求不动 `docs/server/`），
**只让漂移变成"断言失败"**——即把不可见的漂移转成可见的工单。补文档属后续任务。

---

## 六、R6 合规表（最小侵入自证）

| 方案 | ① 纯增加点 | ② 零行为变更论证 | ③ 单一 PR 边界（一句话） | ④ 回滚点 |
| --- | --- | --- | --- | --- |
| **能力真源常量** | 新增 1 个只读常量 + 1 个接口 | 无任何既有代码读它 | "新增能力生命周期的只读真源清单" | 删除该文件即可，无引用方 |
| **② Feature Flags 改派生** | 改 `buildAuthorityFeatureFlags()` 内部实现 | 返回值逐项不变（§2.3 论证） | "让 feature flags 由能力真源派生" | 恢复手写字面量，行为回到现状 |
| **③ Feature Path 补齐 6 项** | union 加 6 个成员 + switch 加 6 个 case | 只放宽编译，不改变已通过的调用 | "补齐能力门禁路径的缺失 6 项" | 移除 6 个成员与 case |
| **④ 注册表映射改查表** | 改 `capabilitiesFromDeclaredPermissions()` 内部 | 输出逐项对拍相同（A2 断言） | "注册表能力映射改由真源驱动" | 恢复 `if` 链 |
| **三条漂移断言** | 新增 3 个 `it()` | 不参与产品运行 | "新增能力登记一致性的防漂移断言" | 单独删除该 `it()`，无副作用 |
| **废弃流程** | 纯流程规范，零代码 | 无代码即无行为变更 | "定义能力废弃流程与过渡期" | 本文档作废即可 |

**唯二需要"改既有实现"的是 ② 与 ④，但两者的输出被论证为逐项等价，且各有对拍断言兜底。**
其余四条是纯新增。基于 `design.md` §1.3 的四道判定，六条全部通过。

---

## 七、未验项

| # | 未验内容 | 影响 | 处置 |
| --- | --- | --- | --- |
| 1 | 向 `AuthorityFeaturePath` 新增成员而漏加 switch `case` 时，TS 是否报错（`noImplicitReturns` 未启用，`getFeatureAvailability` 无 `default` 分支） | 决定 §3.1 A3 是否为**必需**（若编译期已能拦住，A3 是双保险；若不能，A3 是唯一防线） | 实测后回填；**实测前不得断言"编译期会拦住"** |
| 2 | 宿主矩阵键集与 ④ 注册表能力是否已完全对齐 | 影响 §2.2 ⑤ 的断言设计 | 后续任务；本任务不写该断言 |
| 3 | `host.bridgeProtocolVersion` 是否应纳入能力阶段（它描述的是 Host Bridge 协议，受 L0-12 约束） | 影响真源条目数（11 vs 13） | 挂起：L0-12 已禁止跨宿主插件依赖 Host Bridge，本任务不为其设计生命周期 |
