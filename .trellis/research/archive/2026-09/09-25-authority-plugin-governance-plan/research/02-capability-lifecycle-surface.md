# 02 · 能力演进生命周期：现状证据

> 任务：`09-25-authority-plugin-governance-plan` · 主题二证据

---

## 一、结论先行

Authority 的"能力"有三个并存的登记载体，**三者互不同步、无一有生命周期状态**：

| 载体 | 位置 | 内容 | 有版本维度？ | 有阶段标记？ |
| --- | --- | --- | --- | --- |
| 权限资源表 | `server-plugin/src/constants.ts` `SUPPORTED_RESOURCES` | 11 项资源字符串 | ❌ | ❌ |
| 能力布尔快照 | `shared-types/src/probe.ts` `AuthorityFeatureFlags` | 约 28 布尔 + 2 数字 + 1 数组 | ❌ | ❌ |
| 权威文档 | `docs/server/capabilities-and-isolation.md` §1/§2 | 8 项资源 + 风险表 | ❌ | ❌ |

**三者已经不一致**（见 §三 E-C3），而**没有任何机制能在它们漂移时报警**。

---

## 二、逐项证据

### E-C1 · Feature Flags 是硬编码常量，不是真实探测

```ts
// packages/server-plugin/src/constants.ts 末段
export function buildAuthorityFeatureFlags(isAdmin: boolean, moduleCount = 0): AuthorityFeatureFlags {
    return {
        securityCenter: true,
        admin: isAdmin,              // ← 唯一与调用者身份相关的项
        sql:   { queryPage: true, stat: true, migrations: true, schemaManifest: true },
        trivium: { resolveId: true, resolveMany: true, upsert: true, bulkMutations: true,
                   tql: true, tqlMut: true, propertyIndex: true, searchContext: true,
                   mappingPages: true, mappingIntegrity: true },
        transfers: { blob: true, fs: true, httpFetch: true },
        jobs:  { background: true, safeRequeue: true, builtinTypes: [...BUILTIN_JOB_TYPES] },
        diagnostics: { warnings: true, activityPages: true, jobsPage: true, benchmarkCore: true },
        modules: { enabled: true, registryVersion: AUTHORITY_MODULE_PROTOCOL_VERSION, count: moduleCount },
        host:  { bridgeProtocolVersion: 1, eventLedger: true, moduleContext: true },
    };
}
```

- **函数体内除 `admin` 与 `count` 外全部字面量 `true`** —— 没有任何条件分支、没有能力探测。
- 语义是「本 Authority 构建自身声明有什么」，**不是**「当前环境下你能不能用什么」。
- 结果：`features` 字段**无法用来做能力协商**。消费者即使读了它，也只能得到"全 true"，等同没读。
- 唯一动态项 `modules.registryVersion` 复用的是 `AUTHORITY_MODULE_PROTOCOL_VERSION`（=1），
  即「模块协议版本」被同时用作"注册表版本"，两个语义被压在一个字段上。

### E-C2 · 无任何"阶段 / 废弃"标记

在 `packages/shared-types/src`、`packages/server-plugin/src`、`docs/server/*.md` 全量检索
`deprecat|弃用|废弃|experimental|实验性` —— **零命中**（`stable` 的命中全是无关词：稳定排序、稳定 ID、稳定错误码）。

即：不存在 `experimental` / `beta` / `stable` / `deprecated` / `removed` 的五个阶段中的**任何一个**。
能力只有"存在"与"不存在"两态。

**后果推演**（无实证，属风险判断）：
- 新增能力无法标"实验性" → 消费者无法判断该不该依赖 → 要么全用（承担变更风险），要么全不用（能力白做）。
- 废弃能力无标记 → 只能靠 bump 版本号硬删，而删除是**破坏性变更无过渡期**。

### E-C3 · **三载体已不一致**（本主题最硬的证据）

`SUPPORTED_RESOURCES`（`constants.ts`）共 **11 项**：

```
storage.kv, storage.blob, fs.private, sql.private, trivium.private,
http.fetch, jobs.background, events.stream,
module.execute, agent.run, agent.browser        ← 后三项
```

`docs/server/capabilities-and-isolation.md`：
- §1「当前支持的权限资源」列 **8 项** —— 缺 `module.execute`、`agent.run`、`agent.browser`
- §2「风险等级与默认策略」表列 **8 项** —— 同上三者缺席
- 全文检索 `module.execute|agent.run|agent.browser` → **该文档零命中**

代码中这三项**是有完整登记的**（`RESOURCE_RISK` 给了 `module.execute: 'medium'`、`agent.run: 'high'`、
`agent.browser: 'high'`；`DEFAULT_POLICY_STATUS` 给了 `module.execute: 'granted'`、
`agent.run: 'prompt'`、`agent.browser: 'prompt'`）。

**漂移的具体后果**：这篇文档标题即「能力矩阵、权限模型与数据隔离」，是 AI 与人类接入者的权威入口
（CLAUDE.md 把它列为关键文档）。读者据它判断"Authority 支持什么"，会得出**少 3 项**的结论。
其中 `agent.run` / `agent.browser` 是**高风险（`high`）**能力 —— 漏登记的方向恰好是"用户最该知情的那一侧"。

补充：`module.execute` 在整个 `docs/server/` **全仓零命中**（另两项在 `agent-platform.md` 与
`http-api.md` 有描述）—— 即该项能力**完全没有文档**，却已进入权限系统且默认 `granted`。

### E-C4 · 能力演进的服务端出口只有"文档同步"这一步，且无门禁

- `docs/server/http-api.md` 有 registry 端点（L12 交付）能列出**已装扩展**与其依赖集 ——
  但这是**消费者视角**，不是**Authority 自身能力视角**。
- 没有"Authority 能力清单"的机器可读出口。`features` 是唯一近似物，但如 E-C1 所述是全 true 常量。
- **无门禁**：`npm run build` / `npm test` / `check:installable` **均不校验文档与代码的一致性**。
  E-C3 的不一致能被长期保留，正是因为没有任何检查会失败。

### E-C5 · 已存在可复用的"能力登记"范式（不必新造）

Authority 内部已有两个把"契约"显式登记为目的的数据结构，可直接借鉴：

1. **Job 注册表摘要**（`constants.ts` `BUILTIN_JOB_REGISTRY_SUMMARY`）——
   逐 job 类型登记 `description` + `defaultTimeoutMs` + `defaultMaxAttempts` + `cancellable`
   + `payloadFields[]` + `progressFields[]`，并随 `features.jobs.builtinTypes` 一起下发。
   **这是本项目内已有的"能力元数据 + 字段级契约"范式**，形态可直接用于能力生命周期登记。
2. **注册表冲突严重度**（L12 交付的 `extension-registry-service`）——
   `severity: 'error' | 'warning' | 'info'` + 稳定 `code` 字符串（`modules.ts:264`
   明注 "Codes are stable strings so frontends can branch on them without parsing"）。
   **"稳定 code + severity" 这一对范式已被本项目采纳**，可作为"能力阶段"的表达方式。

### E-C6 · **五套"能力词汇表"并存，无映射表**

| # | 词汇表 | 形态 | 基数 | 位置 |
| --- | --- | --- | --- | --- |
| ① | **权限资源** | 分层的点号串（`storage.kv`、`jobs.background`、`agent.browser`） | **11** | `server-plugin/src/constants.ts` `SUPPORTED_RESOURCES` |
| ② | **Feature Flags** | 嵌套对象（`sql.queryPage`、`trivium.tqlMut`、`transfers.httpFetch`） | **32**（28 布尔 + 4 非布尔） | `shared-types/src/probe.ts:7-52` |
| ③ | **Feature Path** | 扁平路径 union（`'sql.queryPage'`…） | **26**（缺 6 项，见 E-C7.3） | `sdk-extension/src/client/feature-flags.ts:3-29` |
| ④ | **注册表能力** | 扁平原语（`kv`、`jobs`、`agent`、`host-bridge`） | **10** | `shared-types/src/registry.ts:25-35` |
| ⑤ | **宿主可用性矩阵键** | 与 ④ 同形 | 9~10 | `server-plugin/src/services/host-capability-matrix.ts` |

- ④ 的类型注释自认是降维镜像：「Mirrors the permission resource families **without the per-target detail**」
  —— 即 ①→④ 是一次有意的信息损失，但**没有映射表**。
- ②→③ 是同一份信息的两种表达（嵌套对象 vs 扁平路径），**已经缺 6 项且无门禁**（E-C7.3）。
- 唯一的 ①→④ 映射实现是 `extension-registry-service.ts:390-424` 的
  `capabilitiesFromDeclaredPermissions()`，**逐项 `if` 硬编码在函数体内**，无数据表、无单测覆盖全部 11 项输入。
- 该函数对 `module.execute` 的处理是**空分支 + 注释**：

  ```ts
  if (declared.modules?.execute) {
      // module.execute maps to module hosting, not a registry capability
      // of its own; observed as trivium-agnostic and skipped.
  }
  ```

  ——**一项能力"为何不登记"的决策只存在于代码注释里**，不在任何登记表、不在任何文档。
  这是"能力演进生命周期"缺口的典型形态：决策发生了，但没有载体。

- **本项已解决 `§四 未验项 1`**：注册表确实覆盖了全部 11 项输入（含 `agent.run`/`agent.browser` 合并为
  单一 `agent`；`module.execute` 显式跳过并留注释），只是覆盖率靠函数体而非契约保证。

### E-C7 · 能力**门禁**存在，但**信号恒真**，且**路径清单已缺 6 项**（E0.5 已补证）

**先修正 E-C1 的一处初判**：`features` 并非无人消费——SDK 内部有门禁 API：

```ts
// packages/sdk-extension/src/client.ts:2408-2431
hasFeature(feature: AuthorityFeaturePath): boolean { ... }          // 公开方法
async requireFeature(feature: AuthorityFeaturePath, message?): Promise<void> {
    if (this.hasFeature(feature)) return;
    const probe = await this.ensureProbe();
    if (getFeatureAvailability(probe.features, feature)) return;
    throw new Error(message ?? `Authority feature not available: ${feature}`);
}
```

即 **SDK 已提供"问能力是否可用 / 强制要求能力"的公开 API**，消费者本可以用它做能力协商。但：

**E-C7.1 · 门禁恒真，问了也没有信息量。**
`buildAuthorityFeatureFlags()`（E-C1）把所有布尔硬编码为 `true`，故 `hasFeature()` 恒返回 `true`。
→ **能力门禁有 API、无信号**。消费者即使调用也无法发现能力缺失。

**E-C7.2 · 三家外部消费者零调用。**
`hasFeature` / `requireFeature` 在 `SillyTavern-Timelines` / `ST-BgLoader` / `ST-zip-converter` 中**零命中**
（E0 复检）。它们各自用自己的方式判定（状态机 / client 存在性 / 硬编码）。

**E-C7.3 · 路径清单与 flag 清单已缺 6 项。**

| 清单 | 成员数 | 位置 |
| --- | --- | --- |
| `AuthorityFeatureFlags`（嵌套对象） | **32**（含 28 布尔 + `jobs.builtinTypes` + `modules.registryVersion` + `modules.count` + `host.bridgeProtocolVersion`） | `shared-types/src/probe.ts:7-52` |
| `AuthorityFeaturePath`（扁平路径 union） | **26** | `sdk-extension/src/client/feature-flags.ts:3-29` |

在 Flags 中、但**在 Path 中不存在**的 6 项：
`jobs.builtinTypes`、`modules.registryVersion`、`modules.count`、
`host.bridgeProtocolVersion`、`host.eventLedger`、`host.moduleContext`。

**后果**：这 6 项能力**无法通过 `hasFeature` / `requireFeature` 查询**——
调用 `hasFeature('host.eventLedger')` 会被 TypeScript 拒绝（不是合法 union 成员）。
即 **Host Bridge 与模块宿主相关的全部能力，对消费者完全不可查询**。

**E-C7.4 · 缺省分支的防护状态（未验，不做断言）。**
`getFeatureAvailability()` 是 26 个 `case` 的 switch、**无 `default` 分支**。
若未来向 `AuthorityFeaturePath` 新增成员而漏加 `case`，会走到函数末尾隐式返回。
**是否会触发编译错误取决于 TS 的穷尽性分析**——`tsconfig.base.json` 启用了 `strict` 与
`noUncheckedIndexedAccess`，但**未显式启用 `noImplicitReturns`**。
本次**未实测**该场景，故不断言"编译期会拦住"或"不会拦住"。（列为未验项，见 §四）

**对设计的意义**：D1（机器可读清单为真源）+ D2（阶段枚举）恰好补上 E-C7.1 与 E-C7.3——
真源给出**真实信号**，阶段枚举给出**消费方式**，而门禁 API 已存在、无需新造。
这是"复用既有机制"原则在本主题的落点。

---

## 三、与既有规则的衔接

- **L1-MF-8**（八步顺序）规定了"新增公开能力"的流程，**但没有规定能力的生命周期阶段**，
  也没规定"第几步该把能力登记进 `capabilities-and-isolation.md`"。E-C3 的漂移就是在八步之内发生的。
- **L1-MF-9 ⑥**「不把 Trivium mapping integrity 路径当业务热路径」—— 是一条能力**使用边界**的规则，
  但它写在 `.trellis/tasks` 之外的规则块里，**不在任何能力登记表内**。同类边界规则散落多处。

---

## 四、本主题的未验项

1. ~~**未验**：L12 registry 的 `capabilitiesFromDeclaredPermissions` 是否覆盖全部 11 项资源~~
   → **已解决**，见 E-C6：覆盖 11 项，`module.execute` 显式跳过并留代码注释理由。
2. ~~**未验**：`features` 被哪些前端代码实际读取~~
   → **已解决**，见 E-C7：SDK 内有 `hasFeature` / `requireFeature` 门禁 API（`client.ts:2408-2431`），
   但三家外部消费者零调用，且信号恒真。
3. ~~**未验**：`docs/server/README.md` 的 10 篇文档索引是否与文档实际内容一致~~
   → **已解决（无漂移）**：README 索引列出 10 篇（`architecture` / `http-api` / `capabilities-and-isolation` /
   `core-runtime` / `install-update-release` / `admin-import-export` / `performance-benchmarks` /
   `ai-integration-guide` / `agent-platform` / `agent-session-runtime`），
   与 `docs/server/*.md` 实际文件**逐一对应，无缺无余**。
4. **未验（新增，E-C7.4）**：向 `AuthorityFeaturePath` 新增成员而漏加 switch `case` 时，
   TypeScript 是否会在编译期报错。`tsconfig.base.json` 启用 `strict` 与 `noUncheckedIndexedAccess`，
   **未显式启用 `noImplicitReturns`**；`getFeatureAvailability()` 无 `default` 分支。
   需实测确认——在确认前，文中不得断言"编译期会拦住"。
