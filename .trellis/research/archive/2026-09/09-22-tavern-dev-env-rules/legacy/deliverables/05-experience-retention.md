# R5 · 经验留存四层载体约定（定稿）

> 数据源：统一规则块「坑与教训」收录标准（本仓 `AGENTS.md:387-388`）、父任务 `design.md` §3.1–3.3（skill 落点与模板，:189–210）、父任务队列红线 5/6（`research/13` §三）。
> 现状取证（2026-09-24，只读）：真源仓 `D:\Repo\Tavern-repo\tavern-harness\rules\` 实际存在 `pitfalls.md`、`L0-global.md`、`groups\`；用户级 `~/.agents/skills/` 实际存在 `tavern-dev-workflow`、`tavern-luker-plugin-dev`（其余 tavern-* 均为拟议，未创建）。

---

## 1. 四层载体总览（自下而上：证据 → 单仓 → 跨仓 → 可执行流程）

| 层 | 载体位置 | 收什么 | 不收什么 | 写入权限与流程 |
|---|---|---|---|---|
| **L0 证据层** | 当前任务的 `<task>/research/*.md` | 一次性调查的**原始实测数据**（含"未获取"项及原因、取证命令与输出）；只在产生该数据的任务内有效 | 任何"结论性规则"（结论须晋升到上层后才可被引用为依据） | 任务执行者随做随写；**`.trellis/tasks/**` 永不入库**（父队列红线 6，含本机安全细节） |
| **L1 单仓层** | ① 该仓 `AGENTS.md` 统一规则块**之外**的自有区域；② 该仓 `.trellis/spec/<package>/<layer>/` | **只影响单仓**的坑与约定（收录标准见 `AGENTS.md:388`："只影响单仓的坑留在该仓 AGENTS.md 的自有区域（块外）"）；层/包级编码规范 | 跨仓通则（写了也会被下次同步覆盖，见 P-2/P-4 教训）；与统一规则块重复的内容 | 仓内直接编辑（块级替换，L0-4）；spec 面向 sub-agent，与统一规则块**分工不重复**（父队列 Batch 4-A 边界） |
| **L2 跨仓真源层** | 真源仓 `tavern-harness/rules/`：`pitfalls.md`（坑）、`L0-global.md` 与 `rules/groups/<仓群>.md`（规则） | **影响多个仓**的坑（三段式：案例/后果/防护，`AGENTS.md:387`）与跨仓 MUST/SHOULD 规则 | 本机实例路径、安全配置细节（属 `docs/environment-defects.md`，**不同步、不公开**） | **只改真源再同步**（红线 5）；同步必须走 `test_sync_tavern_rules.py → --dry-run → --apply → --verify → commit → push origin`（R6 草案已列于 `04-test-dev-rules.md` §6.2） |
| **L3 可执行流程层** | `~/.agents/skills/tavern-*/SKILL.md`（+ symlink 到 `~/.claude/skills/<name>`） | 当经验从"陈述性规则"升级为**重复出现的可执行操作流程**（何时用/前置条件/操作步骤/常见坑/验证方式，模板见父 `design.md:200-210`） | 一次性结论、单仓细节、没有操作步骤的纯知识（那些留 L1/L2） | 用户级目录，遵循父任务 `design.md` §3.1–3.3：`tavern-` 前缀 + kebab-case，frontmatter `description` 必须含触发场景 |

---

## 2. 晋升判定（经验在哪一层落地）

一条新经验产生后，按顺序问三个问题：

1. **是"原始证据"还是"结论"？** 原始实测数据 → 留 L0（任务 `research/`），不直接进上层。
2. **影响范围是单仓还是跨仓？** 单仓 → L1；跨仓 → L2（坑进 `pitfalls.md`，规则进 `L0-global.md` / `groups/`）。
3. **是"约定"还是"可执行流程"？** 若同一流程已在 ≥2 个任务/会话中重复执行（人肉重复），则再复制一份到 L3 做成 skill；否则停在 L2/L1。

**降级与回收**：
- L3 skill 中过时的操作步骤 → 回溯 L0/L2 重新取证后修订；无法取证的条目删除并记录。
- L2 条目若发现只影响单仓 → 移回该仓 L1，真源侧删除（真源瘦身，避免"规则失去权威性"的 P-3 教训）。
- L1 内容若被统一规则新版本覆盖 → 以统一规则块为准，L1 只留仓内特有增量。

**去重铁律（继承 P-3）**：同一事实只允许**一处权威表述**；其余位置只放引用（"见真源 pitfalls.md P-x"），不放复制正文。

---

## 3. 本任务产出的四层落点映射（示例：经验怎么留）

| 本任务结论 | 层 | 落点 | 状态 |
|---|---|---|---|
| 实例矩阵、端口对照原始实测 | L0 | 父任务 `research/06`（已完成） | ✅ |
| E2E 只对 Dev、Real 只读、禁拷 `data/` | L2 | 真源 `rules/groups/myfork.md`（G-1/G-2，**草案**见 `04-test-dev-rules.md` §6.1，本轮不落盘） | ⏳ 待批准 |
| 8000 六处默认 / 3000 三方撞车案例 | L2 | 真源 `rules/pitfalls.md`（拟 P-14/P-15，草案同上） | ⏳ 待批准 |
| 浏览器自动化分工（Playwright/MCP） | L2→L3 | 规则条目 G-3（L2）；流程沉淀入拟议 `tavern-browser-automation`（判定见 `06-skill-merge-decision.md`） | ⏳ 待批准 |
| 端口断言参考实现（`e2e/guard.ts`） | L1 | 各仓 `.trellis/spec/` 测试层 + 本任务 `deliverables/04` §2（不写进统一规则块——代码片段不属于规则正文） | ✅（留本任务） |
| 本机实例安全细节（Real/Luker 放宽项） | 专档 | 真源 `docs/environment-defects.md`（**不入 rules/、不同步、不公开**） | 沿用既有约定 |

---

## 4. 反模式（违反即审查不通过）

- ❌ 把跨仓通则写进某仓 `AGENTS.md` 的统一规则**块内**（下次同步即被覆盖，且造成块间漂移——P-2/P-4 同源教训）。
- ❌ 绕过真源仓直接改各仓规则块（红线 5：改规则必须改真源再同步）。
- ❌ 把本机实例路径、端口安全细节、`cookie-secret` 类信息写进 L2 `rules/`（不同步的 `docs/environment-defects.md` 才是它们的家）。
- ❌ 在 L0 `research/` 之外复制原始数据副本（两处"真源"必然漂移；要引用就写相对路径引用）。
- ❌ 没有触发场景描述的 skill（`description` 缺触发词 = agent 永远不会加载它，等于 P-4 的静默失效）。
- ❌ 凭记忆批量补勾 `implement.md`（L0-2：复选框随执行实时勾选）。

---

## 5. 回源索引

| 本文结论 | 回源位置 |
|---|---|
| 收录标准：跨仓进统一块、单仓留块外自有区域 | 本仓 `AGENTS.md:387-388` |
| skill 落点 / symlink 惯例 / SKILL.md 模板 | 父任务 `design.md:189-210`（§3.1–3.3） |
| 真源 `pitfalls.md` / `L0-global.md` / `groups/` 实际存在 | `tavern-harness\rules\` 目录列举（2026-09-24） |
| 用户级 tavern-* skill 现状（2 个已存在） | `~/.agents/skills/` 目录列举（2026-09-24） |
| `.trellis/tasks/**` 永不入库、红线 5/6 | `research/13` §三（第 5、6 条） |
| 同步流程命令序 | `04-test-dev-rules.md` §6.2（引自 `research/12` §五） |
| 同一事实一处权威表述（P-3） | 本仓 `AGENTS.md`「坑与教训」P-3 节 |
