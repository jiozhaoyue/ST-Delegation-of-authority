# 执行计划 · Authority 协同治理规划

> 任务：`09-25-authority-plugin-governance-plan`
> 全部主代理执行（用户 2026-09-25 裁定），**不派子代理**。
> 本任务是文档任务：**无产品代码改动**，因此质量门以"范围 + 回源 + AC 对照"为主，不跑 `npm test`。

---

## 一、执行顺序（含理由）

```
E0 证据补齐 ──→ E1 能力词汇表真源 ──→ E3 deliverables/03 生命周期
                                          │
                                          └──→ E2 deliverables/01 接入契约 ──→ E4 deliverables/02 版本绑定 ──→ E5 自检交接
```

**出稿顺序说明**：`deliverables/03` 先于 `deliverables/01` 成稿——因为 `01` 的 `declaredPermissions`
形态表必须**引用**而非复制 `03` 的真源（接缝 A）。故 E1 与 E3 连做，产出 `03`；
再据其真源写 `01`（E2）；最后写 `02`（E4，依赖 `03` 的词汇表与 `01` 的降级语义）。
E2 在 implement.md 中的编号早于 E3，仅表示其**内容逻辑**在 03 之后、与出稿顺序相反，特此注明。

### E0 · 证据补齐（关闭 `research/` 中可当场解决的未验项）

- [x] E0.1 核对 `packages/example-extension` 的 `init` 调用形态 → 补入 `research/00` §四。
      **重要发现**：官方示例在 SDK 缺失时**抛异常**（`index.ts:28-30`），违反 L0-11 的静默降级；
      且它是唯一用 `version.ts` 常量而非硬编码字面量的接入方。
- [x] E0.2 核对三家消费者声明的 `version` 字面量与其实际版本 →
      **2/3 已失真**（Timelines 声明 `2.4.0` vs `manifest.json` `1.2.0`；zip-converter 声明 `1.0.0` vs `package.json` `0.1.0`）。
      补入 `research/00` §五。
- [x] E0.3 查 `scripts/versioning.mjs` 与 `scripts/installable.mjs` →
      **推翻初判**：`plugin`/`sdk`/`core` 三套版本由同一次 `version:bump` 写入、**永远同值**；
      仅 `hostBridgeVersion` 独立。补入 `research/01` E-V8，并**从机制上排除 D3 候选 (a)/(c)**。
- [x] E0.4 核对 `docs/server/README.md` 索引与文档实际内容 → **无漂移**，10 篇逐一对应。
      补入 `research/02` §四 未验项 3。
- [x] E0.5 盘点 `features` 的消费点 → **修正 E-C1 初判**：SDK 内有 `hasFeature`/`requireFeature`
      门禁 API（`client.ts:2408-2431`），但**信号恒真**且三家外部消费者零调用；
      另发现 `AuthorityFeaturePath`（26）与 `AuthorityFeatureFlags`（32）**已缺 6 项**。
      补入 `research/02` E-C7。

**E0 产出**：`research/00`~`02` 三份文件的增量修订（原地补充，带 E 编号）。

### E1 · 能力词汇表真源（→ `deliverables/03` 的前半）

- [x] E1.1 裁定 `design.md` D1/D2/D3 三项（**需用户在开工前确认推荐方案**）。
- [x] E1.2 产出能力清单真源草案：权限资源 11 项 + 每项的阶段 / 风险 / 默认策略 / 文档锚点，
      与 `SUPPORTED_RESOURCES`、`RESOURCE_RISK`、`DEFAULT_POLICY_STATUS` 逐项对齐。
- [x] E1.3 解决四套词汇表（`research/02` E-C6）：给出 ①权限资源 → ③注册表能力的**显式映射表**
      （替代当前 `capabilitiesFromDeclaredPermissions` 的隐式 `if` 链），并说明 `module.execute` 的归属。
- [x] E1.4 明确 ②Feature Flags 与该真源的关系（是派生视图还是另立维度），避免新增第 5 套。

### E2 · `deliverables/01` 消费者盘点与接入契约

- [x] E2.1 盘点表（16 仓全量判定 + 3 真实消费者 + 1 在途 + 官方示例）。
- [x] E2.2 逐维对照表（六维：身份 / init 入参 / 权限形态 / 降级策略 / 返回形状解析 / 能力查询）。
- [x] E2.3 接入契约规范：可照抄的最小正确 `init` 示例；权限形态表（**引用 E1.2 真源，不复制**）；
      降级最小必需行为（含冷却与自愈要求，对治 BgLoader 的 `initPromise` 永久缓存）。
- [x] E2.4 已知偏离项清单（≥3 项，各带 file:line 与后果）。
- [x] E2.5 末尾未验项登记。

### E3 · `deliverables/03` 能力生命周期（后半）

- [x] E3.1 能力阶段模型（4 态 + 准入/退出条件 + 与 `code`+`severity` 范式的同形说明）。
- [x] E3.2 漂移防护：可执行断言条目（能捕获 E-C3 的 11 vs 8）+ 挂载的既有质量门 + 失败时的定位方式。
- [x] E3.3 能力废弃流程（通知载体 / 过渡期定义 / 硬删条件）。
- [x] E3.4 把 `module.execute` 的注释决策与 `agent.*` 的文档缺位复现为"规范化登记的首批输入"。
- [x] E3.5 末尾未验项登记。

### E4 · `deliverables/02` 版本绑定

- [x] E4.1 版本面现状图（四套版本号 + `protocolVersion` + `features.registryVersion` 的语义边界与 bump 纪律，
      未明的标"未明"）。
- [x] E4.2 版本绑定契约草案（字段级：新增字段名 / 类型 / 语义 / 不满足时双方行为），
      并显式区分"消费者自己的版本"与"所需 Authority 版本"。
- [x] E4.3 公开面返回形状固化清单（`storage.kv` get / `storage.blob` put / get 等），
      并解释 E-V6 的两家互斥结论在新契约下各自是否仍成立。
- [x] E4.4 `protocolVersion` 兼容窗口方案（对治精确相等导致的 bump 即全量失效）。
- [x] E4.5 三消费者改造点清单（逐条含位置与理由，不实施）。
- [x] E4.6 末尾未验项登记。

### E5 · 自检与交接

- [x] E5.1 AC-1 ~ AC-12 逐条对照，勾选并注明证据位置。
- [x] E5.2 回源抽查：每篇随机抽 3 条结论，验证能按 E 编号/file:line 回溯到 `research/`。
- [x] E5.3 接缝检查：01 与 03 的能力名清单是否同源（接缝 A）；02 的降级语义是否与 01 同源（接缝 C）。
- [x] E5.4 范围门（AC-11）：`git diff --stat` 确认改动仅位于本任务目录。
- [x] E5.5 **最小侵入门（R6 / AC-13 / AC-14）**：逐条过交付物中的每个契约方案，核验四要素齐备
      （纯增加点 / 零行为变更论证 / 单一 PR 边界一句话 / 回滚点）；
      凡需改动既有判定逻辑的方案，确认已给出「新增并行判定 + 保留旧判定」的过渡形态，
      否则移出建议清单并标注"需后续任务单独论证"。
- [x] E5.6 Phase 3：spec 更新（按 **D5 裁定**把已成文条文同步进 `.trellis/spec/`，落点见 `design.md` §二 D5）
      + 提交推送（L0-7）。

---

## 五、执行结果（2026-09-25 收口）

### 产出

| 类型 | 文件 | 状态 |
| --- | --- | --- |
| 规划 | `prd.md`（R1–R6 / AC-1–14）· `design.md`（D1–D5 + 接缝 + 最小侵入原则）· `implement.md` | 完成 |
| 研究 | `research/00`（消费者盘点）· `01`（版本与兼容面）· `02`（能力生命周期面） | 完成，9 项未验项 5 解决 / 3 挂起 / 1 转后续 |
| 交付物 | `deliverables/01`（接入契约）· `02`（版本绑定）· `03`（能力生命周期） | 完成 |
| **spec（唯一持久化路径）** | `.trellis/spec/sdk-extension/frontend/consumer-contract.md`<br>`.trellis/spec/server-plugin/backend/version-binding.md`<br>`.trellis/spec/shared-types/backend/capability-lifecycle.md` + 三处索引加行 | 完成 |

### 关键裁定记录

- D1 = 机器可读清单为真源（复用 `BUILTIN_JOB_REGISTRY_SUMMARY` 范式）
- D2 = 能力阶段 4 态（`experimental`/`stable`/`deprecated`/`removed`）
- D3 = 能力集声明为绑定主体；**E0.3 从机制上排除了版本区间方案**（`plugin`/`sdk`/`core` 永远同值）
- D5 = 任务目录 + `.trellis/spec/`；**E5 证明该裁定是必需项而非偏好**（`.trellis/tasks/` 被 gitignore）

### E5 发现的重要事实（影响后续所有同类任务）

**`.gitignore:18` 排除 `.trellis/tasks/`**（提交 `4f0193e`「公开 fork 防泄露」）——
即：**任务目录中的任何交付物都不会进 git、不会推送**。两个直接后果：

1. AC-11 原定的验证方式（`git diff --stat` 看改动是否只在任务目录）**不可用**，已修正为
   「`git status --short` 为空 == 零产品代码改动」+「交付物在 spec 中已入库」。
2. **spec 版规范页必须自包含**——若只写"详见 `deliverables/xx`"，在其他机器上就是**悬空引用**
   （P-4「引用分发失效是静默的」的同一形态）。本次三页均内联条文与 file:line 证据，不依赖任务目录。

**建议**：此事实应补进仓群规则块（真源 `tavern-harness`）——它是**跨仓通用**的，
且此前没有任何条目提示"任务目录交付物不进版本库"。已在 T3 交接中登记，不在本任务范围内实施。

---

## 二、校验命令

```bash
# AC-11 范围门：改动只应在任务目录内
git status --short
git diff --stat

# R4.1 回源抽查：交付物中的 E 编号必须在 research/ 中存在
rg -o 'E-[VC][0-9]+' .trellis/tasks/09-25-authority-plugin-governance-plan/deliverables/ | sort -u

# R1.1 消费者盘点覆盖度：16 仓应全部出现在 deliverables/01
rg -c 'ST-|PureTavern|tavern_helper' .trellis/tasks/09-25-authority-plugin-governance-plan/deliverables/01-consumer-inventory.md

# E3.2 漂移断言的可复核性：11 项资源是否全部出现在权威文档
rg -c 'module\.execute' docs/server/capabilities-and-isolation.md   # 当前期望：0（即漂移存在）
```

> 注：最后一条是**复现漂移**的取证命令，不是修复后的验收命令。修复属后续任务。

---

## 三、风险文件与回滚点

| 风险 | 触发条件 | 回滚点 |
| --- | --- | --- |
| **产物落点越界**（AC-11 失败） | 顺手改了 `docs/server/` 或消费者仓 | 全部改动集中在 `.trellis/tasks/09-25-*/`，`git checkout --` 即可整体回退 |
| **契约与既有实现冲突** | 设计的契约要求与某消费者现有行为不兼容 | 契约发布不改行为（`design.md` §三）；冲突项只进"已知偏离项清单" |
| **接缝 A 破裂**（第 5 套词汇表） | 01 复制粘贴了能力名而非引用真源 | E5.3 接缝检查；发现即回 E1 重做映射表 |
| **D1/D2/D3 裁定改变** | 用户不采纳推荐方案 | E1.1 是唯一裁定点，其后各步依赖它；改裁定只需重跑 E1 之后各步，E0 证据不受影响 |

---

## 四、`task.py start` 前的待办（review gate）

- [x] 用户已就 `design.md` §二 **D1**（真源层 = 机器可读清单）、**D3**（绑定 = 能力集声明）、
      **D5**（载体 = 任务目录 + `.trellis/spec/`）给出裁定。→ 2026-09-25 已裁定，均采纳推荐方案。
- [x] 用户已审阅本 `prd.md` / `design.md` / `implement.md` 并**明确批准开工**。
      → 2026-09-25 用户批准原话：「批准，一切都不改产品代码，只增加这些绑定等的声明，最小侵入，pr可控」
      （追加为 R6，D2 能力阶段 4 态推荐随之确认）。
- [ ] 若 D2 裁定改变，需重跑 E1 之后各步（见 §三 风险表）。
- [x] 子代理模式已由用户裁定关闭，故 `implement.jsonl` / `check.jsonl` 不在本任务的就绪门内。
