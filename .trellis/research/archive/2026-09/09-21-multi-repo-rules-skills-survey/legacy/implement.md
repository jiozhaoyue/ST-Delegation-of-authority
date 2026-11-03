# 执行计划：多仓规则体系 · Skill 体系 · 任务地图

> 配套：[`prd.md`](./prd.md) ｜ [`design.md`](./design.md)
> 执行须知：**Phase C 起涉及对 15 个仓库的写操作，必须先取得用户对 D1/D3 的裁定。**
> 复选框随执行**实时勾选**，禁止事后批量补勾。

---

## 交接状态（2026-09-22 更新）

| 项 | 状态 |
| --- | --- |
| 任务状态 | ✅ `task.py start` 已执行，status = **in_progress**（分支 main） |
| 规划件 | ✅ `prd.md` / `design.md` / `implement.md` 齐备，无 TBD |
| 子代理上下文 | ✅ `implement.jsonl` / `check.jsonl` 已 curate（零截断警告） |
| 研究产出 | ✅ `research/` **12 份**（`00`–`12`）+ `INDEX.md`；两处研究偏差已在 `11` 修正 |
| 关键路径 C-08 | ✅ 已完成（`research/07`） |
| Phase C / D / E | ✅ **已完成**（真源仓已建并推送私有远程；同步器 + 沙箱测试；全量同步 16 文件 / 11 仓；前作残留清理 3 仓） |
| Phase F / G | 🔄 **F 部分完成**（F-3/F-4/F-6/F-7 ✅ 交付 2 skill；F-1 部分完成；F-2/F-5 待做）；**G ✅ 完成**（2026-09-24 回填；D5/D6 已裁定） |
| Phase H | 🔄 收尾中：H-1/H-2/H-3 ✅；**H-4 ✅（2026-09-24 spec 回填 `27467d6` + bootstrap 归档）**；H-5/H-5b ✅ |
| Phase N | 🔄 N-1/N-2/N-7/N-9/N-10 ✅；**N-11/N-12 新登记**；N-3/N-4/N-5/N-6/N-8 待批准/待拍板 |
| 已裁定决策 | ✅ D1（私有仓 + 每次推送）、D2（自包含块）、D4（依赖 Authority 可用子集）、D7（L0 标注同源）、D3（已由执行解决）、**D5（自动化两者并用）**、**D6（维持 8001–8004）** |
| **待裁定** | ⏳ **各仓是否推送**（10 个受同步仓，当前仅本地提交）、**全局规则 §4.5/§4.6 缺口**（`.codex`/`.agents` 两处缺失）、**N-6 归档与否**、**N-12 建仓批准** |
| 交接文档 | ✅ 全部待办与开工方法见 [`research/12-backlog-and-handoff.md`](./research/12-backlog-and-handoff.md) |

---

## Phase A — 需求与历史（调查，已完成）

- [x] A-1 转录用户全部草稿需求 → `research/00-requirements-inventory.md`
- [x] A-2 前作「统一规则」考古（发现 `Center` 真源与 `sync-rules.ps1` 已腐烂）→ `research/08-prior-unified-rules-archaeology.md`
- [x] A-3 Authority 插件能力/生态调研 → `research/04-plugin-authority.md`
- [x] A-4 确认 `.trellis/spec/**` 为未填模板、平台目录为 Trellis 生成物（规则边界）
- [x] A-5 确认 `.gitignore` 未忽略 `.trellis/` 与平台目录（公开 fork 污染风险）

**Gate A**：需求真源存在且用户认可（✅ 已由用户口述提供）

---

## Phase B — 15 仓自定义规则提炼（调查）

- [x] B-1 `My-repo`（7 仓）→ `research/01-rules-my-repo.md`（42KB；12 条跨项目共性 + 6 个非空子项目明细 + 7 条存疑；ST-Assets-Manger 为空目录）
- [x] B-2 `Myfork`（3 仓）→ `research/02-rules-myfork.md`
- [x] B-3 `JS-Slash-Runner`（5 仓）→ `research/03-rules-js-slash-runner.md`（42KB；规则真源为 `.cursor/rules/*.mdc` 八件套；20 条共性；仅 2 项目真正生效）
- [x] B-4 `Instance` 环境与端口调研 → `research/06-dev-env-instances-ports.md`
- [x] B-5 Luker 官方开发文档调研 → `research/05-luker-dev-docs.md`（131KB；已抓全部 22 个开发页）
- [x] B-6 主代理复核：抽查每份产出 ≥5 条规则，按所附路径+行号回源核对
- [x] B-7 去重合并：归纳跨仓共性（L0）与仓群差异（L1）→ `research/09-consolidated-rules-and-distribution-precedents.md`
      （L0 抽出 12 条，其中 **8 条与全局 `~/.claude/CLAUDE.md` 同源** → 新增决策点；
      并实证对比了两种分发范式**均已腐烂**，为 D2 提供依据。L1-Myfork 待 `02` 补齐）
- [x] B-8 **C-08 关键路径**：Authority 四宿主可用性验证 → `research/07-authority-host-compat-verification.md`
      （结论：ST ✅ 完整；**Luker ✅ 核心可用 / ⚠️ Host Bridge 不可用**；PT ❌；TT ❌。据此 D4 得以裁定）
      **残留未验项**：未实际启动宿主装载插件（涉改实例配置，须用户批准）

**验证命令**：
```bash
# 产出齐备性
ls .trellis/tasks/09-21-multi-repo-rules-skills-survey/research/
# 抽查证据可回源（示例：验证某条规则的确存在于所声称的文件与行号）
sed -n '<行号起>,<行号止>p' 'D:/Repo/Tavern-repo/<仓>/<文件>'
# 反查：确保提炼文件没有把 Trellis 块内容当自定义规则收进来
grep -n "TRELLIS:START" .trellis/tasks/09-21-multi-repo-rules-skills-survey/research/*.md
```

**Gate B**：三份规则提炼文件齐备 + 主代理抽查通过 + 无 Trellis 块内容混入

**回滚点**：本阶段只写 `research/`，无破坏性，无需回滚。

---

## Phase C — 统一规则真源建立 ✅ D1 已裁定：新建私有仓

> **落点**：`D:\Repo\Tavern-repo\tavern-harness`（2026-09-21 新建，已 `git init` + 首次提交 `d739541`）

- [x] C-1 新建**私有 Git 仓**承载 tavern harness（统一规则 + 同步器 + 薄封装 CLI）
      已完成本地建仓：`rules/`（L0+3 组 L1+坑与教训）、`scripts/`（同步器 / 回归测试 / tavern-init）、`targets.json`、`README.md`、`CHANGELOG.md`
- [x] C-2 **配置 remote 并首次推送**——这是本方案成立的前提（前作腐烂的根因正是"不在任何会被推送的版本库里"）
      ✅ **已完成（2026-09-22 回源核实）**：`origin = https://github.com/jiozhaoyue/tavern-harness.git`（**私有**，经 `gh repo view` 确认）；
      `git log origin/main..main` 输出为空 → 本地与远端完全一致（HEAD `f68be5e`）
- [x] C-2b 确认 `Tavern-repo/Center` 已不存在（考古确认，无需删除）；其**残留块**清除归入 E-7（N-7）
- [x] C-3 编写真源 `unified-development-rules.md`：**L0+L1 全文**，MUST/SHOULD/MAY 分级，
      **L0 每条标注「与全局 CLAUDE.md §X 同源」**（D7 裁定）
      → 实际拆分为 `rules/L0-global.md`（15 条）+ `rules/groups/*.md`（3 组）+ `rules/pitfalls.md`（13 条），同步时拼装成单一块
- [x] C-4 并入前作 v1.0.0 的 12 节框架（交互/编辑/实例隔离/推送/子代理/检索先行/构建测试/文档先行/覆盖机制/变更流程/FAQ/资源）
      → L0 按主题覆盖：交互与决策 / 编辑与变更 / 实例隔离 / Git 与推送 / 子代理 / 检索先行 / 测试 / 文档 / 安全门禁 / 计划先行
- [x] C-5 **修正前作过时条目**：实例路径（`Instance/Real`、`Instance/Dev`，无 `Test`）、子代理模型（`DeepSeek-V4-Flash[free]` / `claude-haiku-4-5-20251001`）
      → 见 `CHANGELOG.md`「修正明细」表
- [x] C-6 每条规则补齐"原因 + 违反后果"（前作大量规则只剩标题，本次禁止重现）
      → L0 15 条 + L1（14+14+20）条**逐条**带原因与后果；坑与教训 13 条**逐条**带真实案例
- [x] C-7 **新增硬约束**：跨宿主插件**禁用 Host Bridge**（C-08 结论）→ 落为 `L0-12`
- [x] C-8 版本号定为 `v1.1.0`，记录变更说明 → `CHANGELOG.md` + `targets.json:version`
- [x] C-9 **薄封装 `tavern-init`**：`trellis init` → 写入规则块 → 校验，达成「选 tavern 即写入」体验
      （**不改 npm 包模板**——`npm update` 即丢失，是前作腐烂的翻版。依据见 `research/10` §A）
      → `scripts/tavern-init.mjs`，已 dry-run 验证

**补充执行项（本次新增）**：

- [x] C-10 **脱敏**：把本机实例安全细节（`securityOverride` / `whitelistMode` / 出厂密码 / `cors: ["*"]` 等）
      从规则块移入**不同步**的 `docs/environment-defects.md`——规则块将写入多个公开仓库，
      含上游模板仓 `tavern_helper_template`，不得泄露本机安全姿态
- [x] C-11 **检索先行双通道**（AC-7/约束 7）：GitHub API 命中 `intellectronica/ruler`（2933★）、
      `dyoshikawa/rulesync`（1456★）、`PanisHandsome/ai-rules-sync`（119★）。
      结论：现有工具均为**单仓内跨格式**同步（AGENTS.md ↔ CLAUDE.md ↔ .cursor/rules），
      **无跨仓幂等分发**能力 → 与本设计核心需求不重合，自建同步器成立；但 marker 块范式被其验证
- [x] C-12 **目标仓库实勘**：15 仓扫描完成——12 个是 Git 仓、2 个非 Git（`ST-Switcher`、
      `tavern_helper_workspace`）、1 个空目录（`ST-Assets-Manger`）；并实测修正两处研究偏差（见下）

**验证命令**：
```bash
# 真源存在且非空占位
wc -l <真源路径>
# 无 TBD 占位残留
grep -n "TBD\|待填\|To fill" <真源路径>   # 期望：无输出
# 无外部相对路径引用
grep -nE '\]\(\.\./|\.\./\.\./' <真源路径>  # 期望：无输出
```

**Gate C**：真源内容完整、无占位、无外链、每条规则带原因与后果

**回滚点**：真源为新增文件，删除即回滚。

---

## Phase D — 同步器实现与灰度

- [x] D-1 实现 `sync-tavern-rules.py`（`--list`/`--dry-run`/`--apply`/`--verify`/`--repo`）
      → `tavern-harness/scripts/sync_tavern_rules.py`；另加 `--targets`（沙箱）与 `--path/--group/--file`（供 tavern-init）
- [x] D-2 实现块渲染：原样承载正文、marker 唯一成对、哈希只对正文计算、保留「项目覆盖」节
- [x] D-3 实现插入锚点：紧随 `<!-- TRELLIS:END -->`；无则追加文件末尾
- [x] D-4 实现安全护栏：默认 dry-run、写前 `.bak`、异常结构报错中止
      另加：Git 工作区不干净拒写（`--allow-dirty` 可放开）、非 Git 目录需 `--allow-non-git`、
      检测到前作 `UNIFIED-RULES` 残留时**拒写**（强制先走 E-7 清理）
- [x] D-5 **单仓灰度**：先对 1 个仓库（建议 `JS-Slash-Runner/ST-PanelReset`，最小）跑 `--dry-run` → 人工 review → `--apply`
      ⚠️ **据实勾选 + 偏差记录（2026-09-22 回源核实）**：**"先单仓灰度"这一步实际未做**。
      实际路径是：dry-run 全量预览（21 个目标）→ 用户批准 → **E-2 一次性全量 apply**。
      偏差证据：跨仓规则块提交时间戳**完全相同**（本仓与 `SillyTavern-Timelines` 均为 `2026-09-21 22:25:13`），
      说明是同批次写入，不存在"先一个仓灰度、再铺开其余"的中间态。
      写入路径的正确性由 `D-6`（沙箱 24 项断言）与用户对全量 diff 的人工 review 共同担保；
      `E-3`（`--verify` 零漂移）与 `E-4`（块外零改动）事后复核未发现实际损害。
      **判定：目的达成、步骤有偏差——据实勾选，但不作为后续批量写入的先例。**
- [x] D-6 幂等验证：连续 `--apply` 两次，第二次应全部 skip
      → `scripts/test_sync_tavern_rules.py` 沙箱回归 **24 项断言全部通过**：
      锚点插入位置、块外逐字保留、覆盖节保留、marker 成对、异常中止不写盘、
      **第二次 apply 零写入**、`--verify` 零漂移、真源变更可被检测

**沙箱测试暴露并已修复的真实缺陷**（记录以备复现）：

- 块头部与正文之间**缺空行分隔** → `split_block` 把正文标题行误判为头部 → **幂等性不成立**
  （第二次 apply 仍判定为"更新"）。修复：头部与正文间固定保留一个空行作为确定性解析边界。
- 更新块时在 `END_MARK` 后**多加了一个换行** → 块后内容每次被推移一行。修复：`text[e:]` 自带换行，不再额外追加。

**验证命令**：
```bash
# 干跑预览
python scripts/sync-tavern-rules.py --dry-run
# 灰度
python scripts/sync-tavern-rules.py --dry-run --repo ST-PanelReset
python scripts/sync-tavern-rules.py --apply  --repo ST-PanelReset
# 幂等：第二次不应有新变更
python scripts/sync-tavern-rules.py --dry-run --repo ST-PanelReset
# 校验漂移
python scripts/sync-tavern-rules.py --verify
# 块外零改动
git -C 'D:/Repo/Tavern-repo/JS-Slash-Runner/ST-PanelReset' diff --stat
```

**Gate D**：单仓灰度通过 + 幂等成立 + `--verify` 无漂移

**回滚点**：`git checkout -- <目标文件>` 或恢复 `.bak`。

---

## Phase E — 全仓同步 ✅ 已由用户批准并执行（2026-09-21）

- [x] E-1 `--dry-run` 全量预览，导出变更清单交用户 review（21 个目标：新建 1 / 插入 17 / 拦截 3）
- [x] E-2 用户批准后 `--apply` 全量执行 → **16 个目标文件（11 个仓），纯新增、块外零改动**
- [x] E-3 `--verify` 全量校验零漂移 → **14/14 与真源一致**（JSSR 两仓的 3 个符号链接已合并为 1 个物理目标）
- [x] E-4 逐仓确认"块外内容零改动"：`git diff --numstat` 各仓目标文件均为 **N 增 / 0 删**（唯一例外 `PureTavern` 因原文件末行无换行符被 git 记为 1 行修改，内容逐字未变）
- [x] E-5 检查块内引用无死链：块**自包含**，零外部路径引用（前作块曾引用已消失的 `../../Center/...`）
- [x] E-6 处理公开 fork 污染问题：**已脱敏**——本机实例安全细节移入不同步的 `docs/environment-defects.md`；上游模板仓 `tavern_helper_template` 按用户裁定**本轮排除**
- [x] E-7 **清除腐烂残留（N-7）**：3 仓（`ST-BgLoader` / `ST-shujuku-rebuild` / `ST-zip-converter`）各删除 284 行，
      `git diff` 证实 **284 deletions / 0 insertions**；执行前已逐仓列出范围并获用户确认

**执行中发现并修复的真实缺陷（符号链接叠块，已记入真源 `pitfalls.md` 与 `CHANGELOG.md`）**：

`JS-Slash-Runner` 仓群的 `AGENTS.md` 与 `GEMINI.md` **是指向 `CLAUDE.md` 的符号链接**。
同步器按文件名逐个写入 → **同一物理文件被写 3 次、叠出 3 个规则块**（6 个目标报"marker 不成对"）。
修复：新增 `dedupe_symlinked_targets()` 按 `os.path.realpath` 去重、优先保留实体文件名；
受损的 2 个 `CLAUDE.md` 已用 `git checkout` 精确还原后重新同步。回归测试新增符号链接用例。

**范围说明**：`ST-chatfilesys-rebuild` 与 `ST-git-improve` 的 `.gitignore` **有意忽略 `AGENTS.md`**
（其注释写明"公开发布仓库不含 AI 协作产物"）→ 这两仓的块**仅本地生效、不入版本库**，同步器尊重其约定。

**提交**：10 个仓已提交（用户裁定「只提交，不推送」）；真源仓 4 次提交已全部推送 `origin`。
`ST-Switcher` 另按要求建立版本控制并推送私有远程 `jiozhaoyue/ST-Switcher`。

**回滚点**：逐仓 `git checkout -- <目标文件>`；真源仓 `git revert <commit>`。

**验证命令**：
```bash
python scripts/sync-tavern-rules.py --verify
# 逐仓检查 diff 范围
for r in <15 个仓库路径>; do echo "== $r"; git -C "$r" diff --stat; done
```

**Gate E**：15 仓全部命中、零漂移、块外零改动、无死链（= AC-2 全部通过）

**回滚点**：逐仓 `git checkout -- .`；跨仓无原子性，故必须逐仓可回滚。

---

## Phase F — Skill 体系 🔄 部分完成（F-2/F-5 待做）

> **已交付 2 个 skill**（经子任务执行，2026-09-24 完成并验证）：
> `tavern-luker-plugin-dev`、`tavern-dev-workflow`（落点 `~/.agents/skills/`，Junction 至 `~/.claude/skills/`）。
> **F-5 合拆判定已定稿**（`09-22-tavern-dev-env-rules/deliverables/06`）：`tavern-host-compat` 与
> `tavern-browser-automation` **拆分**为两个独立 skill，尚未编写。
> ⚠️ **P-1 风险（2026-09-24 新发现）**：`~/.agents` 仓**无 remote**，两个已交付 skill 仅存本地盘（见 N-12）。

- [x] F-1 去重检查：与 `fe-offline-design`、`fe-ui-inspect`、`trellis-*`、`lark-*` 逐一比对
      （两个子任务内完成 luker/workflow 的比对；2026-09-24 主会话为三个新 skill 补齐：
      每个 SKILL.md 内置「不适用/去处」边界表，GitHub API 检索 0 命中同名 skill）
- [x] F-2 编写 `tavern-authority-integration` ✅ **2026-09-24 完成（主会话直接编写）**
      （素材 = `research/04` §3/§6 + `docs/server/ai-integration-guide.md`；含 references/permissions.md；
      quick_validate 通过；Junction 验证可解析；已提交推送 `~/.agents` 仓 `e7a099b`）
- [x] F-3 编写 `tavern-luker-plugin-dev` → 子任务 `09-22-luker-dev-skill` 交付
      （`quick_validate.py` 通过；AC-3 抽查 5 条结论按 `research/05` 行号回源核对）
- [x] F-4 编写 `tavern-dev-workflow` → 子任务 `09-22-tavern-workflow-skill` 交付
      （8 步规则变更流程与真源仓 README 程序化比对一致，差异已记录）
- [x] F-5 编写 `tavern-host-compat` / `tavern-browser-automation` ✅ **2026-09-24 完成（主会话直接编写）**
      （**判定：拆分**，依 `09-22-tavern-dev-env-rules/deliverables/06`；S3 ← `research/07`，S6 ← `deliverables/03`+`04`；
      host-compat 含四宿主矩阵 + L0-12 判定流程 + 残留未验项标注；browser-automation 含 D5 分工矩阵 + 五条反模式；
      两 skill quick_validate 通过、Junction 验证、已提交推送 `e7a099b`）
      ⚠️ 过程记录：haiku 子代理派发后反复停在「写文件前」（4 轮恢复无效，疑似后台子代理对工作区外路径的 Write 被权限卡死，
      目录骨架由子代理的 Bash 建成但文件未落盘）；改由主会话直接编写完成。F-4 的 S4（tavern-instance-safety）仍未建。
- [x] F-6 按惯例 symlink 到 `~/.claude/skills/` → 本机惯例实为 **Junction**，两个均已建立并验证可解析
- [x] F-7 结构校验 → 两个 skill 均过 `quick_validate.py`（"Skill is valid!"，exit 0）

**验证命令**：
```bash
ls -la "C:/Users/caocaobi/.agents/skills" | grep tavern
ls -la "C:/Users/caocaobi/.claude/skills" | grep tavern
# frontmatter 校验
for f in "C:/Users/caocaobi/.agents/skills"/tavern-*/SKILL.md; do head -5 "$f"; echo "---"; done
```

**Gate F**：每个 skill 有 name/description、无与现有 skill 重叠、symlink 生效

**回滚点**：删除新增 skill 目录与 symlink。

---

## Phase G — 统一开发/测试环境规则 ✅ 已完成（2026-09-24 回填）

> **已由子任务 `09-22-tavern-dev-env-rules` 交付**（6 个 deliverable 齐 + 5 条抽查回源）。
> D5/D6 已裁定（2026-09-22）：**D5 = 两者并用**（回归 Playwright 1.62.1 / 诊断 chrome-devtools-mcp，均不新装）；
> **D6 = 维持 8001–8004 + 防误连标识**（不改 Real）。R6 的真源落盘以**草案 + dry-run 计划**形式完成，
> 实际落盘 `tavern-harness` 待用户批准后另行派发（见 `deliverables/04` §6）。

- [x] G-1 汇总实例矩阵（路径/类型/端口/数据目录/编译要求/敏感度）→ `deliverables/01-instance-matrix.md`
- [x] G-2 输出端口分配方案（D6：维持 8001–8004）+ 决策记录（`8000` 六处默认值、`3000` 撞车并入）→ `deliverables/02`
- [x] G-3 输出端口改动 **diff 预览**（不实施——D6 裁定维持现状，Real 配置零触碰）→ `deliverables/02` §3
- [x] G-4 确定浏览器自动化方案（D5：两者并用，均不新装）→ `deliverables/03`
- [x] G-5 输出测试开发规则（E2E 只用 Dev 实例、产物留证路径、经验留存四层载体）→ `deliverables/04` + `05`
- [x] G-6 红线复核：全程零实例数据改动 → 只读取证（`Real\Luker` mtime=2026-09-07、`Dev\Luker` mtime=2026-08-28，均早于本轮）

**验证命令**：
```bash
# 确认未改动实例（对实例目录跑 git status，或比对 mtime）
git -C 'D:/Repo/Tavern-repo/Instance/Dev/Luker' status --short
```

**Gate G**：产出实例对照表 + 端口方案 + 自动化选型 + 测试规则；实例零改动

**回滚点**：本阶段不写实例，无需回滚。

---

## Phase H — 任务地图定稿与移交

- [x] H-1 定稿任务地图（`design.md` §5.2 的 C-01…C-09 + §5.3 的 L1…L12 + §5.4 的 N-1…N-9 均已登记）
- [x] H-2 汇总 D1–D7 待决策项，以**可选项形式**提交用户裁定（D1/D2/D3/D4/D7 已裁定；D5/D6 + 3 项新增仍待裁定）
- [x] H-3 依用户裁定创建子任务（`task.py create --parent`）→ **已建 5 个**：
      `09-22-luker-dev-skill`(C-04) / `09-22-tavern-workflow-skill`(C-05) / `09-22-tavern-dev-env-rules`(C-06) /
      `09-22-tavern-repo-atlas`(C-07) / `09-22-authority-ecosystem-pr-strategy`(C-09)，**各已回填 PRD**
- [x] H-4 更新 `.trellis/spec/` 中与本次相关的约定
      ✅ **已完成（2026-09-24，经 bootstrap 任务 Batch 4-A 执行）**：`.trellis/spec/**` 10 索引 + 62 主题文件
      灌入本仓实证规范（含 guides 跨层触发点 7 条），已随 commit `27467d6` 入库并推送 origin。
      边界按用户选项 (a)：spec 承载各包操作规范，跨仓通则一句话引用 `AGENTS.md` 规则块，零整段复制。
      bootstrap 任务已归档（archive/2026-09），职责冲突解除。
- [x] H-5 提交变更
      ✅ **已完成（2026-09-22 收尾核实，据实回填；原为 ⏸ 阻塞）**：实质采纳了原选项 (a)「不入库敏感部分」，
      但做得比逐文件排除更稳——**整个 `tasks/`、`workspace/` 目录排除**，新增研究文件自动受保护。

      | 提交 | 动作 |
      | --- | --- |
      | `4f0193e` | `.gitignore` 新增 8 行：`.trellis/tasks/`、`.trellis/workspace/`、`.history/`（含注释说明"含本机实例安全细节，不随公开 fork 发布"） |
      | `0d2d39e` | 把**非敏感**的 Trellis 载体（`.trellis/scripts/`、`spec/`、`agents/`、`workflow.md` 等）纳入版本库 → `git ls-files .trellis` 计 **96 个文件** |

      **验证证据**：
      ```bash
      git check-ignore -v ".trellis/tasks/09-21-multi-repo-rules-skills-survey/research/06-dev-env-instances-ports.md"
      # → .gitignore:18:.trellis/tasks/   命中（敏感研究文件确认被忽略）
      git status        # → nothing to commit, working tree clean（无未跟踪泄露路径）
      ```
      **保留纪律**：`.trellis/tasks/**` 含本机安全细节，**永不入库**；跨机复用时只搬运脱敏版本
      （分层参照：真源仓 `tavern-harness` 为私有，其 `docs/environment-defects.md` 可安全承载同类细节）。
- [x] H-5b 未推送提交 **已清零**：`0d2d39e` 同时为 `HEAD` / `origin/main` / `origin/HEAD`
      → 本仓规则块相关提交（`0bc9e94`、`6ba30f5`、`4f0193e`、`0d2d39e`）**均已推送 origin**。
      ⚠️ **范围澄清**：本条只覆盖**本仓**；**其余 10 个受同步仓**是否推送仍属待裁定项
      （E 阶段用户裁定为「只提交，不推送」）——该决策依然有效、未被本条解决。
- [x] H-6 结束提醒：本任务归档前提 = 全部 Gate 通过
      ✅ **Gate A–H 全部通过（2026-09-24）**：A/B（调查+抽查）、C/D/E（真源+同步器+全仓同步）、
      F（5 skill 交付）、G（6 deliverable）、H（任务地图+决策 D1–D7 全裁定）。
      PRD R1–R6 与 AC-1…AC-7 全勾。剩余 6 个 N 项环境缺陷（N-3/N-4/N-5/N-6/N-8/N-11）为**独立事项**，
      按用户裁定（2026-09-24）移交 backlog 交接文档（真源仓 `tavern-harness/docs/backlog-tasks.md`），
      不阻塞本任务归档。

**⚠️ 发现的职责冲突（✅ 已于 2026-09-24 解除，按选项 (a) 执行）**：
`00-bootstrap-guidelines`（Trellis 自带首次装填任务）的职责是**填充 `.trellis/spec/`**，与本任务 R1（规则提炼）
高度重叠。实际执行：spec 回填由 bootstrap 任务以 **Batch 4-A** 承担（产出已随 `27467d6` 入库），
边界为「spec 承载各包操作规范、跨仓通则一句话引用规则块、零整段复制」；bootstrap 任务已完成并归档
（`archive/2026-09/00-bootstrap-guidelines`），PRD 6 项全勾。

**Gate H**：任务地图 + 决策清单交付，用户确认

---

## Phase N — 本次调查新发现的待办（原草稿需求中没有）

> 完整清单见 `design.md` §5.4 与 `research/10` §C.3，**交接版见 `research/12` §三**。
> **N-7（前作残留块）已在 Phase E 完成**（3 仓各删 284 行）。
> **N-1 / N-2 仍是最高优先**——它们是随时可能触发的实际损害，但都需改 `Instance/**` 内配置，
> 与"实例只读"红线冲突 → **必须用户逐条批准**后才可执行；批准前请遵守 L1-MF-1 / L1-MF-10 的纪律。

- [x] ~~N-1~~ ✅ **已关闭（2026-09-22 用户裁定；2026-09-24 落文）**：`Instance/Dev/Luker` 为**只读实例**，
      除 `git pull` 外**不触发任何操作** → 「`git push origin` 误推上游」属**伪风险**；已裁定**永不改动**其 git 配置，
      不再作为待修缺陷登记。关闭说明已写入 `prd.md` / `research/12` / 真源仓 `docs/environment-defects.md`；
      新增纪律「**实例目录只读，仅允许 `git pull`（含 `--ff-only`）**」→ 已并入 `09-22-tavern-dev-env-rules` 环境规则
- [x] N-2 🔴 **Real\Luker 单行加固 → 已完成（2026-09-24，用户单独批准）**：
      仅改第 218 行 `enableServerPluginsAutoUpdate: true` → **`false`**（其余安全项用户选择不动）。
      备份 `config.yaml.bak-20260922-autoupdate`；真实 diff **1 增 1 删**（用备份比对——该文件被 `.gitignore:23` 忽略，**仓内 diff 必为空**）。
      记录已写入真源仓 `docs/environment-defects.md`。**需重启才生效，未代用户重启。**
- [ ] N-3 🟠 **Dev\TauriTavern 缺 `src-tauri/` 无法构建** → 与"E2E 只用 Dev 实例"红线冲突，需定方案
      （补克隆 / 或改为特批使用 Real 做 TT 侧只读测试）
- [ ] N-4 🟠 端口 **3000 三方撞车**（Tavern-Viewer + TavernHeadless 均默认 3000，且被 svchost PID 5908 实占）
- [ ] N-5 🟡 **`8000` 默认值重灾区**（6 处：Luker 两份 compose、ST/Luker 两份 `default/config.yaml`、PT remote-server、TT default）
- [ ] N-6 🟡 **Real\PureTavern 疑似冗余**（与 Dev 版 diff 为空、均无 `data/`）→ **需用户拍板是否归档**（属删除范畴）
- [ ] N-8 🟠 **JS-Slash-Runner 3 仓规则引用悬空**（`ST-PanelReset`/`tavern_helper_template`/`tavern_helper_workspace`
      的 `@.cursor/rules/*.mdc` 全部指向不存在文件 → agent 静默拿不到规则）
- [x] N-9 🟠 **Authority fork 补 `upstream` remote → 已完成（2026-09-24 回源核实）**：
      `upstream = https://github.com/Youzini-afk/ST-Delegation-of-authority.git`；
      `git fetch upstream --dry-run` 通过（exit 0，已见 `main`/`dev`/`agent-platform` 等分支）。
      `origin` 仍为本 fork `jiozhaoyue/ST-Delegation-of-authority`（推送只走 `origin`）。
- [x] N-10 🔴 **本仓（DoA）公开 fork × `.trellis/` 未跟踪 = 本机安全姿态可被一次 `git add -A` 泄露**
      ✅ **已实质解决（2026-09-24 复核 + 提交落地）**：`.gitignore` 已排除 `.trellis/tasks/` 与 `.trellis/workspace/`
      （commit `4f0193e`），敏感研究文件（`research/06` 等）经 `git check-ignore` 验证命中忽略规则；
      2026-09-24 会话按「先分组、逐批 `git add <明确路径>`」提交 spec 回填（`27467d6`）与模型门禁（`edc78ae`），
      提交前做了敏感信息 grep 自查（0 命中）。剩余纪律：继续避免在本仓执行 `git add -A` / `git add .trellis`。
- [ ] N-11 🟠 **`tavern_helper_template` git 仓损坏**（2026-09-24 由 `09-22-tavern-repo-atlas` 实测新发现，
      以「建议 N-10」登记，编号顺延为 N-11 防与父任务 N-10 撞号）：具体损坏形态与证据见
      `09-22-tavern-repo-atlas/research/atlas-overview.md` §〇/§五。注意该仓是**上游模板仓**
      （`StageDog/tavern_helper_template`），修复动作涉及上游对齐，须用户批准后执行。
- [x] N-12 🟠 **`~/.agents` 仓无 remote**（2026-09-24 本轮复核新发现）：两个已交付 skill
      ✅ **已完成（2026-09-24 用户裁定「建私有仓并推送」后执行）**：私有仓 `jiozhaoyue/agents` 已建
      （`gh repo create --private`，`isPrivate: true` 经 API 复核）；5 个 tavern skill 全部提交推送
      （`deedd9d` 2 个 + `e7a099b` 3 个），未推送清零。用户自有技能清理批次（约 400 文件删除）不在本轮范围、保留未动。

**回滚点**：N-1/N-9 为 remote 配置，`git remote set-url` 可逆；N-2/N-4/N-5 改配置前须先 `diff` 预览 + 备份。

---

## 关键路径与并行度

```
A ──┬─→ B (15仓提炼，可并行) ──┐
    │                          ├─→ C ─→ D ─→ E
    ├─→ (Authority 调研 ✅)    │        ↑
    │                          │     需 D1
    ├─→ (前作考古 ✅)          │
    │                          │
    └─→ R5 调查 ───────────────┴─→ F, G
                ↑
        C-08 Authority 四宿主验证（独立，建议尽早并行）
```

- **最高优先**：`C-08`（Authority 是否支持 Luker）——它决定 B4/B5/B2 三条业务线的技术路线是否成立。
- **可完全并行**：B-1/B-2/B-3 三份提炼；F 与 G 相对独立。
- **必须串行**：C → D → E（真源先行，同步器再跑，最后全量落）。

---

## 环境与工具约束（执行时遵守）

| 项 | 约束 |
| --- | --- |
| 子代理模型 | 一律 `claude-haiku-4-5-20251001`（`DeepSeek-V4-Flash[free]`），禁止其他 |
| 并发度 | 免费端点易熔断（本次实测 6 并发即 502），**子代理并发控制在 ≤3**，失败即落盘部分结果后重试 |
| 检索先行 | 实现类写操作前完成 WebSearch/GitHub API 双通道检索 |
| 实例纪律 | `Instance/**` 全程只读；E2E 只用 `Instance/Dev/**` |
| 中文 | 文档/注释/回复全中文 |
