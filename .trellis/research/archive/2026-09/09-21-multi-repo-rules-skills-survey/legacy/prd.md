# 多仓规则提炼·全景调查·Skill 体系与需求整理

> 任务类型：**调查 + 规划为主，实施为辅**（父任务候选）
> 提出日期：2026-09-21
> 需求真源：[`research/00-requirements-inventory.md`](./research/00-requirements-inventory.md)

---

## Goal

跨 `My-repo` / `Myfork` / `JS-Slash-Runner` 三处仓库群（共 15 个仓库），以及本仓 `ST-Delegation-of-authority`，完成四件事：

1. **提炼**各仓中已有的**自定义规则**（排除 agent 工具自带与框架自带），产出可维护的统一规则集；
2. **建立规则同步机制**，把统一规则无损、幂等地落到全部 15 个仓库，且真源不得再次腐烂；
3. **产出 skill 体系**：基于 Luker 官方开发文档 + 本仓群开发经验，沉淀为可复用技能；
4. **整理用户全部草稿需求**为结构化的任务地图，供后续逐个开子任务。

---

## Background

### 已探明的事实（证据见 `research/`）

| 事实 | 证据 |
| --- | --- |
| 三处仓库群共 **15 个仓库** | `research/00-requirements-inventory.md`；目录扫描 |
| **曾经存在**一套统一规则系统（v1.0.0，2026-09-12，前作任务 `09-12-multi-repo-rules-dev-env`） | `research/08-prior-unified-rules-archaeology.md` |
| 该系统**已完全腐烂**：真源仓库 `Center` 与 `sync-rules.ps1` 均已消失；只有 3 个仓库残留内容相同、且被同步器截断的块 | 同上 |
| `.trellis/spec/**` 全部是**未填写的 Trellis 模板**（Status: To fill），无自定义内容 | `.trellis/spec/authority-core/backend/index.md` |
| 自定义规则实际散落在：`AGENTS.md`（TRELLIS 块**之外**）、`CLAUDE.md`、`GEMINI.md`、`.github/copilot-instructions.md`、`docs/`、`.trellis/workspace/*/journal*.md`、`.trellis/tasks/*/` | 同上 |
| 各平台目录（`.claude/`、`.cursor/`、`.codex/` 等约 28 个）**只含 Trellis 生成物**，非规则真源 | 目录内容清单 |
| `.gitignore` **未忽略** `.trellis/` 与各平台目录 → 提交会污染公开 fork | `.gitignore` |
| Authority 上游**仅官方支持 SillyTavern** | `research/04-plugin-authority.md` §4.1 |
| **C-08 已验毕**：Authority 在 **ST ✅ 完整可用**、**Luker ✅ 核心可用（Host Bridge 不可用）**、**PT ❌**、**TT ❌**。关键：**能力内核与宿主解耦**，Host Bridge 失败仅 `console.warn` 不阻断加载 | `research/07-authority-host-compat-verification.md` |
| Luker 的服务端插件加载契约与 ST **逐字节同形**（`loadPlugins`/`isValidPluginID`/`express.Router()` 挂载方式全部相同） | 同上 §2.1 |
| PureTavern / TauriTavern **无服务端插件基建**（无 `plugin-loader.js`、无 `/api/plugins/` 约定、无 `plugins/` 目录） | 同上 §2.5 |
| 用户自己的仓群中**同时存在两种规则分发范式，且均已腐烂**：前作「内嵌块」（真源消失+内容截断+条目过时）；JS-Slash-Runner「符号链接」（**5 个项目中 3 个真源缺失→引用悬空**） | `research/09-consolidated-rules-and-distribution-precedents.md` |
| JS-Slash-Runner 的规则真源是 `.cursor/rules/*.mdc` 八件套，`CLAUDE.md`/`AGENTS.md`/`GEMINI.md` 为 10 行 `@` 引用，其余平台目录为符号链接（25 条 mode `120000` 已入 git，`core.symlinks=true`） | 同上 |
| 本机**已有两套浏览器自动化**：Playwright **1.62.1** 与 `chrome-devtools-mcp`（`--autoConnect`，已在 2 仓配置）→ **无需新装** | 实测；`research/03` rule 19 |
| 实例端口实测 **8001–8004 顺序分配且无冲突**（Dev ST 8001 / Real ST 8002 / Dev Luker 8003 / Real Luker 8004）；Dev 与 Real 的**宿主版本完全一致** | 实测；`design.md` §4.1 |
| Authority 已提供官方的**插件互调契约 Companion Modules**（`.authority/module.json` + `client.modules.execute`）与 **Feature Flags 降级机制**（26 个特性路径） | `research/04-plugin-authority.md` §6.2 |
| 本地 Authority fork 与上游**完全同一 commit**（`4d449f7`），尚无本地改动；且**未配置 upstream remote** | `research/04-plugin-authority.md` §5 |
| `~/.agents/skills/` 是用户级 skill 落点（symlink 进 `~/.claude/skills`），目前**无任何酒馆相关 skill** | 目录清单 |

### 用户的核心主张（贯穿全部需求的指导思想）

> 「暴露 API，成为一个基础设施」；想要与别的插件**联动、打造生态，但又不耦合**。

派生出的四个待解问题：
1. 哪些要做成**插件**、哪些可以**提 PR 上游**？
2. 改了这么多，**怎么逐个提 PR**（必须功能单一、可 review）？
3. **后端插件策略**：直接用 Authority，还是必须自造插件？
4. 如何避免陷入**自己维护 + 提交 PR + 多方联动的地狱**？

---

## Requirements

### R1 — 自定义规则提炼（调查）

- [x] R1.1 对三处仓库群全部 15 个仓库，逐仓提炼**自定义规则**。（`research/01-03` 三份，各 36–42KB；空目录与非项目仓在 `research/11` 实勘标注）
- [x] R1.2 严格区分三类内容，**只保留第 3 类**：
  1. agent 工具自带/通用指令（丢弃）
  2. Trellis 等框架生成物，如 `AGENTS.md` 的 `<!-- TRELLIS:START/END -->` 块、各平台目录（丢弃）
  3. **仓库自有规则**：硬性约束、"踩过的坑/违反即返工"、架构分层边界、专属命令、用户工作流偏好、项目定位、端口/路径/环境约定（**保留**）
      （B-6 主代理抽查 + `grep "TRELLIS:START" research/*.md` 0 命中）
- [x] R1.3 每条规则必须附**证据**（文件相对路径 + 行号范围）；无法取证的条目须标注"未获取"而非臆测。（AC-1 抽查 7/7 通过，2 处偏差已修正）
- [x] R1.4 归纳**跨仓共性规则**（出现在 2 个以上仓库的）与**仓库特有规则**两个层次。（`research/09`：L0 共性 12 条 + 三组 L1）

### R2 — 统一规则集与同步机制（实施，需用户先裁定架构）

- [x] R2.1 建立**唯一真源**的《统一开发规则》。（`tavern-harness` 私有仓 v1.1.0，已推送）
- [x] R2.2 规则分 **MUST / SHOULD / MAY** 三级。
- [x] R2.3 提供**同步器**：无损写入各仓库。（`sync_tavern_rules.py`，块原样承载）
- [x] R2.4 同步器满足：幂等 / 只增不毁 / dry-run 预览 / 可校验。（沙箱 24 项断言 + 真机验证）
- [x] R2.5 同步块**不得依赖相对路径深度**引用真源。（块自包含，零外链）
- [x] R2.6 覆盖全部 15 个仓库；块内含**版本号 + 同步时间 + 真源标识**。（16 目标文件 / 11 仓；范围修正见 AC-2）
- [x] R2.7 保留**项目级覆盖机制**。（「项目覆盖」节；本仓 2026-09-23 子代理模型门禁即首例）
- [x] R2.8 **修正前作的过时条目**。（`CHANGELOG.md` 修正明细表）
- [x] R2.9 明确规则变更流程。（真源 README 八步；`tavern-dev-workflow` skill AC-4 程序化比对一致）

### R3 — 全景调查与意图陈述（调查）

- [x] R3.1 产出 15 个仓库 + Authority 插件的**全景地图**。（`09-22-tavern-repo-atlas/research/atlas-overview.md`，每仓标注【实测】/【材料】证据等级）
- [x] R3.2 明确哪些是**正在使用的扩展**、哪些是**正在开发的**。（同上 §四 L1–L12 业务线登记）
- [x] R3.3 基于调查**陈述用户意图**，并与用户确认理解是否一致。（intent-statement I1–I6，2026-09-24 用户回执「全部准确」）
- [x] R3.4 核实 Authority 对四个宿主的实际可用性。（`research/07`：ST ✅ / Luker ✅核心 / PT ❌ / TT ❌，残留未验项已标注）

### R4 — Skill 体系（实施）

- [x] R4.1 依据 Luker 官方开发文档产出开发类 skill。（`tavern-luker-plugin-dev`，quick_validate 通过）
- [x] R4.2 依据本仓群开发过程中积累的经验产出经验类 skill。（`tavern-dev-workflow`；另交付 `tavern-authority-integration` / `tavern-host-compat` / `tavern-browser-automation`）
- [x] R4.3 skill 落在 `~/.agents/skills/<name>/SKILL.md`（用户级），并按现有惯例 symlink 到 `~/.claude/skills/`。（本机惯例实为 Junction，5 个 skill 全部接线并验证可解析）
- [x] R4.4 每个 skill 必须：有明确的触发场景、自包含、不与其他 skill 重叠。（各 SKILL.md 含触发词面与「不适用/去处」边界表）
- [x] R4.5 先做**去重检查**。（各 skill 内边界表 + GitHub API 检索 0 命中同名）

### R5 — 统一开发/测试环境规则（调查 + 决策）

- [x] R5.1 摸清本机实例盘面。（`deliverables/01-instance-matrix.md`，全部回源 research/06）
- [x] R5.2 回答用户的三个开放问题。（Luker 进程端口 → `deliverables/02`；浏览器自动化 → `deliverables/03`（D5 裁定两者并用）；经验留存 → `deliverables/05`（四层载体））
- [x] R5.3 产出**端口分配方案**。（`deliverables/02`：D6 裁定维持 8001–8004 + 防误连标识，零实例改动）
- [x] R5.4 产出一套可执行的测试开发规则。（`deliverables/04`：E2E 只用 Dev、端口断言、产物留证路径）

### R6 — 需求整理与任务地图（规划）

- [x] R6.1 把用户全部草稿需求（B1–B10）整理为结构化清单。（`research/00-requirements-inventory.md`）
- [x] R6.2 产出**任务地图**。（`design.md` §5.2–§5.4：C-01…C-09 / L1…L12 / N-1…N-9；5 个子任务已建并完成）
- [x] R6.3 汇总**待用户决策的开放问题**，一次性提交用户裁定。（`research/12` §四；D1–D7 全部裁定完毕）

---

## Acceptance Criteria

### AC-1（对应 R1）
- [x] `research/` 下存在覆盖 15 个仓库的规则提炼文件，每仓一节（`01` My-repo 7 仓 / `02` Myfork 3 仓 / `03` JSSR 5 仓；
      `ST-Assets-Manger` 为空目录，`ST-Switcher`、`tavern_helper_workspace` 现状已在 `research/11` 实勘表标注）；
- [x] 抽查任意 5 条规则，均能按其所附证据路径与行号在源文件中找到原文（主代理抽查回源 **7/7 通过**，另于 `research/11` 复核 2 处偏差并修正）；
- [x] 提炼文件中**不含**任何出自 Trellis 块内或工具自带指令的条目（可 grep 校验）。

### AC-2（对应 R2）
- [x] 存在唯一真源文件与本仓工作区内可运行的同步器
      → 真源 `tavern-harness`（已推送私有远程）+ `scripts/sync_tavern_rules.py`；
- [x] 同步器 `dry-run` 输出可完整预览将写入 15 个仓库的全部变更
      → 全量 dry-run：21 个目标（新建 1 / 插入 17 / 拦截 3）；
- [x] 真机运行一次后：目标仓库均含统一规则块，块外内容零改动（`git diff` 可证）
      → **16 个目标文件 / 11 个仓**写入，各仓 `git diff --numstat` 均为 **N 增 / 0 删**；
      **范围修正**：`tavern_helper_template`（上游模板仓）按用户裁定排除，`tavern_helper_workspace` 非项目本体排除，
      `ST-chatfilesys-rebuild` / `ST-git-improve` 的 `AGENTS.md` 被其 `.gitignore` 有意忽略（块仅本地生效、尊重该约定）；
- [x] **连续运行两次，第二次 diff 为空**（幂等性）→ 沙箱与本仓均实测：第二次全部「跳过」、零写入；
- [x] 故意破坏一个仓库的块后重跑，能自愈 → 沙箱用例 repoB（过期块 + 覆盖节）验证通过；
- [x] 同步块内所有引用链接在**全部目标仓库中均可解析**（无死链）→ 块**自包含**，零外部路径引用（前作块曾引用已消失的 `../../Center/...`）。

### AC-3（对应 R3）
- [x] 全景地图覆盖 15 仓 + Authority，标明"在用/在开发/已废弃"；（`09-22-tavern-repo-atlas/research/atlas-overview.md`，每仓证据等级标注）
- [x] **Authority 对四宿主的可用性有明确结论**（ST ✅ / Luker ✅核心 / PT ❌ / TT ❌），并说明验证方法与证据 → `research/07`；
      残留未验项已如实标注（未实际启动宿主装载插件，因涉改实例配置须用户批准）；
- [x] 用户确认意图陈述无误。（2026-09-24 用户对 I1–I6 回执「全部准确」）

### AC-4（对应 R4）
- [x] 新增 skill 全部通过 skill 结构校验（frontmatter 完整、description 含触发场景）；（5 个 tavern-* skill 全过 `quick_validate.py`）
- [x] 与现有 skill 无功能重叠（列出比对结论）；（各 SKILL.md「不适用/去处」边界表 + GitHub API 检索 0 命中）
- [x] 至少各产出 1 个 Luker 文档类 skill 与 1 个经验类 skill。（`tavern-luker-plugin-dev` + `tavern-dev-workflow`；另 3 个：authority-integration / host-compat / browser-automation）

### AC-5（对应 R5）
- [x] 产出实例对照表（路径 / 类型 / 端口 / 数据目录 / 编译要求 / 数据敏感度）；（`deliverables/01-instance-matrix.md`）
- [x] 产出端口分配方案并显式列出冲突点；（`deliverables/02-ports-and-collisions.md`，D6 裁定维持现状）
- [x] 产出测试开发规则，明确"用哪个实例、用什么自动化、经验写哪里"；（`deliverables/03` + `04` + `05`）
- [x] **全程零实例数据改动**（可作为硬校验）。（只读取证：实例 mtime 与 git status 均早于本轮/历史既有）

### AC-6（对应 R6）
- [x] 任务地图含每个子任务的：范围、验收标准、依赖、建议优先级；（`design.md` §5.2–§5.4 + 5 个子任务 PRD 已回填）
- [x] 开放问题汇总为一份清单，且全部以可选项形式呈现给用户裁定。（`research/12` §四；D1–D7 全部裁定完毕）

### AC-7（全局约束）
- [x] **任何阶段都不得修改 `Instance/` 下的实例数据与配置**
      → 全程未对 `Instance/**` 执行任何写操作；`Instance/Dev/Luker` 现存 6 项未提交改动经时间戳核验为
      **2026-08-29 / 2026-05-10**（早于本次会话数周），与本轮无关；
- [x] 同步类写操作（对 15 个仓库）必须先出 dry-run 并获用户批准后执行
      → 全量 dry-run → 用户裁定「先灰度本仓一个」→ 灰度验证通过 → 用户批准「同步 12 个仓」→ 执行；
- [x] 子代理一律使用 `DeepSeek-V4-Flash[free]`（`claude-haiku-4-5-20251001`），禁止其他模型
      → 本阶段未派发子代理（主代理直接执行）；该约束已同步写入三处全局规则第 4 节，并收紧为
      「必须用最低档小模型、禁旗舰模型」。

---

## Constraints

1. **数据安全红线**：`Instance/Dev`、`Instance/Real` 下所有数据**只读**，禁止任何修改、删除、覆盖。
2. **实例更新只走 Git**：`git clone` / `git pull` / 酒馆原生扩展安装器 / 酒馆助手，禁止手工复制文件进实例。
3. **不擅自改配置**：端口调整等只出方案，落地需用户批准。
4. **公开仓库污染风险**：多仓库为公开 fork（含上游 `Youzini-afk/ST-Delegation-of-authority`）。任何提交前须确认 `.trellis/`、各平台目录是否应进版本库，避免污染对外 PR。
5. **上游对齐**：本地 Authority fork 与上游同 commit 且未配 `upstream` remote，涉及上游对比/PR 时需先补 remote。
6. **子代理模型固定**：仅 `claude-haiku-4-5-20251001`（显示名 `DeepSeek-V4-Flash[free]`）。
7. **检索先行**：实现类写操作前须完成 WebSearch/GitHub API 双通道检索（search-gate hook 强制）。
8. **中文**：文档、注释、回复一律中文（代码标识符、命令输出、专有名词除外）。

---

## Out of Scope

- 各业务项目（chatsys / timeline / zip-converter / shujuku / copilot 等）的**功能实现**——本任务只做需求整理与任务拆分，实现走后续子任务。
- 对酒馆宿主（SillyTavern / Luker / PureTavern / TauriTavern）源码的修改。
- 实例配置的实际调整（只出方案）。
- 向上游提 PR（本任务只做策略建议与拆分方案）。

---

## Open Decisions

> **裁定进度（2026-09-24 更新）**：**D1 / D2 / D4 / D7 已裁定**；**D3 已由执行解决**（全量同步已获批准并完成）。
> **D5 / D6 已裁定并落地**（D5 = Playwright + chrome-devtools-mcp 两者并用；D6 = 维持 8001–8004 + 防误连标识），
> 产出见 `09-22-tavern-dev-env-rules/deliverables/`。
> **N-1 已关闭**（用户裁定：`Instance/Dev/Luker` 为只读实例，仅允许 `git pull`，永不改动其 git 配置；
> 不再作为待修缺陷登记）；**N-9 已完成**（`upstream` remote 已配并验证）；**N-2 已落地单行加固**。
> 完整裁定内容、以及调查新发现的待办（现为 **N-2…N-8**），见
> [`research/10-trellis-integration-and-plugin-governance.md`](./research/10-trellis-integration-and-plugin-governance.md)。

### 已裁定（2026-09-21，用户口述）

| # | 决策点 | **裁定** | 落实要点 |
| --- | --- | --- | --- |
| **D1** | 统一规则真源落在哪 | **新建私有仓放 tavern harness，上传云端、每次推送** | ① `Tavern-repo/Center` **完全无关** → 其相关残留**全部删除**；② 真源 = 带 remote 的私有 Git 仓，承诺推送纪律；③ 并探索 Trellis 集成——结论见 `research/10` §A：Trellis **无预设机制**，但**保证 TRELLIS 标记块外内容永不被覆盖**，故「薄封装 `tavern-init` + 块外插入」即可达成"选 tavern 自动写入"体验，**不改 npm 包模板**（`npm update` 即丢失） |
| **D2** | 同步载体形式 | **AGENTS.md 自包含块** | 块内不引用任何外部路径；块外内容零改动；marker 唯一成对 |
| **D7** | 是否重复收录 L0 | **收录但标注「与全局 CLAUDE.md 同源」** | 理由：你使用 28 个平台目录 = 多 agent 并用，而全局 CLAUDE.md 只对 Claude 生效；标注来源便于日后检测漂移 |
| **D4** | Authority 后端路线 | **选「依赖 Authority 可用子集」，但暂不定论** | 理由：**当前是 fork 仓、将大量迭代**。前置动作：先补 `upstream` remote（现与上游同 commit `4d449f7`、零差异、无 upstream）。硬约束：跨宿主插件**禁用 Host Bridge** |

### 待裁定

| # | 决策点 | 候选方案 | 说明 |
| --- | --- | --- | --- |
| ~~D3~~ | ~~是否现在就同步到 15 仓~~ | ✅ **已解决（2026-09-21）** | 先 dry-run 全量预览 → 用户 review → **批准执行**；灰度本仓后全量写入 16 个目标文件（11 仓），校验零漂移 |
| D5 | 浏览器自动化选型 | (a) 复用 Playwright **1.62.1**（脚本化 E2E）；(b) 复用 `chrome-devtools-mcp`（`--autoConnect`，交互式诊断）；(c) **两者并用** | **本机两者均已存在**，`npx playwright --version` 成功；官方 playwright MCP 亦在 marketplace。缺的只是项目内依赖声明与 MCP 注册。详见 `research/06`。**仍待裁定** |
| D6 | 开发用实例端口分配 | (a) **维持现状 8001–8004**（实测无冲突）；(b) 分族可辨识方案（需动 Real 配置，与只读红线冲突） | 真实风险是**误连 Real**，建议优先做防误连标识。**仍待裁定** |

> 下表为**原始决策表，保留供追溯**（其中 D1/D2/D4/D7 的建议已被上表裁定取代）。

| # | 决策点 | 候选方案 | 说明 |
| --- | --- | --- | --- |
| D1 | **统一规则真源放在哪** | (a) 新建/重建 `Tavern-repo/Center` 仓并纳入 git 推送；(b) 放本仓 `ST-Delegation-of-authority` 的 `.trellis/spec/`；(c) 放用户级 `~/.agents/`（已有 git 但**无 remote**）+ 补 remote | 前作用 (a) 已腐烂，需用户确认是否重建并承诺推送。**设计推荐 (c) + 补 remote** |
| D2 | **同步载体形式** | (a) 各仓 `AGENTS.md` 追加**自包含块**；(b) 独立 `UNIFIED-RULES.md`；(c) 单一真源 + **符号链接**分发 | **已实证**：两种范式在用户自己的仓群中**均已腐烂**（见 `research/09`）。(a) 抗真源丢失，(c) 失效静默且 Windows 可移植性差 → **设计推荐 (a)** |
| D3 | **是否现在就同步** | (a) 先 dry-run 只出预览（推荐）；(b) 直接同步 | 涉及 **15 仓**写操作，建议先预览 |
| D4 | **Authority 后端路线** | (a) 直接依赖 Authority 可用子集；(b) 自造后端插件；(c) 二者并存 | **C-08 已验毕**：Luker ✅ 核心可用（Host Bridge 不可用）、ST ✅ 完整、PT/TT ❌。**设计推荐 (a)**，并新增硬约束「跨宿主插件禁用 Host Bridge」 |
| D5 | **浏览器自动化选型** | (a) 复用现成 Playwright 1.62.1（脚本化 E2E）；(b) 复用现成 `chrome-devtools-mcp`（交互式诊断）；(c) 两者并用（推荐）；(d) 新装其他 | **已探明本机现状**：Playwright 1.62.1 与 `chrome-devtools-mcp`（`--autoConnect`，已在 2 仓配置）**均已存在**，无需新装。`research/06` 将补全细节 |
| D6 | **开发用实例端口分配** | (a) 维持现状 **8001–8004**（无冲突，推荐）；(b) 改为分族可辨识方案 | **实测现状无冲突**（Dev ST 8001 / Real ST 8002 / Dev Luker 8003 / Real Luker 8004）。真正风险是**端口仅差 1 导致误连 Real**，而非冲突 → 设计建议优先做防误连标识，改端口需动 Real 配置（与只读红线冲突） |
| **D7** | **统一规则是否重复收录 L0**（新增，源自 `research/09` 发现） | (a) 统一规则**只收 L1**（仓群特有），L0 直接引用全局 `~/.claude/CLAUDE.md`；(b) 统一规则收 L0+L1 全文（自包含，但与全局配置重复）；(c) L0 收但标注「与全局同源」 | **发现**：抽出的 12 条 L0 中 **8 条与全局 CLAUDE.md 同源**。若全量收录，等于把全局配置复制 15 份并各自漂移。**设计倾向 (a) 或 (c)**，需用户裁定 |

---

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- 本任务为**复杂任务**，`task.py start` 前须补齐 `design.md` 与 `implement.md`。
- 本任务宜作为**父任务**，下挂独立可验收的子任务（见 `design.md` 的任务地图）。
