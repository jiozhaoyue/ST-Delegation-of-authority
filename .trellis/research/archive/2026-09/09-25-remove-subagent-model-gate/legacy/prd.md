# 移除各仓自写的子代理模型门禁并恢复 Trellis 默认

> 父任务：`09-25-tavern-project-bootstrap` · 子任务 D
> **用户裁定（2026-09-25）**：「删除这些自写的子代理，所有仓库也删，只留默认 trellis 的」；
> 细化选择四项：① 门禁**全删 8 项** ② 旧版 codex 代理文件**也恢复为默认** ③ `workflow.md` 的
> `python3→python` 适配**保留** ④ **新建子任务 D** 承载。

## Goal

删除本仓群里 2026-09-23 自写的**子代理模型门禁**（把 `glm-5.3-flash` 写死进 Trellis 管理文件与规则块
「项目覆盖」区），使这些文件回到 Trellis 默认；并把两个仓的**旧版** `.codex/agents/*.toml` 恢复为
Trellis 0.6.16 默认内容。

---

## Background（全部实测取证）

### 门禁的分布：只在两个仓

| 仓 | 文件 | 形态 |
| --- | --- | --- |
| `ST-Delegation-of-authority` | `.trellis/agents/{check,implement}.md` | 各多 1 段 Model gate（与模板差 3 行） |
| 同上 | `.trellis/workflow.md` | 第 236 行整段 Model gate（与模板差 101 行，其余 98 行是 `python3→python` 适配） |
| 同上 | `.codex/agents/trellis-{check,implement,research}.toml` | 各多 1 段 Model gate（与模板差 3 行） |
| 同上 | `AGENTS.md` | 「项目覆盖」区整节「子代理模型门禁（2026-09-23）」（第 628–638 行） |
| `ST-zip-converter` | `.trellis/spec/guides/index.md:99` | 1 行门禁表述 |

**全仓普查口径**：`grep -rl "glm-5.3-flash"` 覆盖 15 仓（排除 `node_modules`、`.history/` VSCode 快照）→
命中仅上述两仓。另用 `trellis update --dry-run` 的官方 "Modified by you" 交叉验证：
本仓 7 个文件命中；`ST-Codex-theme` 的 `.codex/config.toml`、`ST-chatfilesys-rebuild` 的
`.github/copilot-instructions.md`、`PureTavern` 的 `AGENTS.md` 也被标记，但**与子代理无关** → 本任务不动（见「明确不做」）。

### 本任务的直接动因：门禁在**永久阻塞子代理派发**

`.trellis/workflow.md:236` 的门禁段会被 Trellis 的 SessionStart 注入到每一轮上下文，要求
「子代理只能用 `glm-5.3-flash`，否则停止派发」。而本平台可用子代理模型列表（`sonnet` / `opus` /
`haiku` / `fable`）**不含该名称** → 按门禁字面执行则**任何派发都被禁止**。本会话实测：Trellis 的
SessionStart 原文即含该指令；子任务 B 的 check 步骤因此无法派发子代理。

### manifest 语义（决定「恢复默认」后 Trellis 会不会仍标"已改"）

`.trellis/.template-hashes.json` 的 `hashes[路径]` 记录的是**模板内容**的 sha256，不是安装时文件内容。
取证：本仓 `.trellis/agents/check.md` 的条目哈希 == 模板 `trellis/agents/check.md` 的哈希，
而工作区文件是**带门禁版**（哈希不同）→ 因此**把文件恢复成模板内容后，文件与 manifest 重新一致**，
Trellis 会判为 "unchanged"，**无需手改 manifest**。

### 旧版 codex 代理文件（R2 的对象）

`ST-zip-converter` 与 `ST-chatfilesys-rebuild` 的 `.codex/agents/trellis-{check,implement,research}.toml`
与 0.6.16 模板差 **164/140/201 行**：内容是**更早一版 Trellis 模板**（含 `# Check Agent`、
`## Recursion Guard`、`## Trellis Context Loading Protocol` 等节），**不含门禁**。
`trellis update --dry-run` 不把它们列为 "Modified by you"（manifest 记的就是那一版的模板哈希）→
**只能以 0.6.16 模板内容整体替换**来"只留默认"。

---

## Requirements

### R1 · 删除本仓 8 处门禁（用户已批准）

1. `.trellis/agents/check.md` — 删 Model gate 段（含其后空行）
2. `.trellis/agents/implement.md` — 同上
3. `.trellis/workflow.md` — 删该段；**保留**同文件的 `python3→python` 适配
4. `.codex/agents/trellis-check.toml` — 删 Model gate 段
5. `.codex/agents/trellis-implement.toml` — 同上
6. `.codex/agents/trellis-research.toml` — 同上
7. `AGENTS.md` — 删「项目覆盖」区该节，恢复为标准空节形态（`## 项目覆盖` + 空行 + `<!-- TAVERN-RULES:END -->`）
8. `ST-zip-converter/.trellis/spec/guides/index.md` — 删第 99 行门禁表述

### R2 · 旧版 codex 代理文件恢复为 0.6.16 默认（用户已批准）

- `ST-zip-converter/.codex/agents/trellis-{check,implement,research}.toml`（3 个）
- `ST-chatfilesys-rebuild/.codex/agents/trellis-{check,implement,research}.toml`（3 个）
- 方式：以模板内容（`dist/templates/codex/agents/*.toml`）整体替换目标文件。
  **L0-4 例外声明**：本条为**整体替换**而非块级编辑。理由：① 用户已明确批准"恢复为默认"；
  ② 旧内容即**旧版模板**，其中无可保留的本地改动（已逐文件核对，含门禁=0）；
  ③ 逐块改写成新模板等于手抄，反而引入偏差。替换后以 `diff 模板 文件 == 0` 作为验收断言。

### R3 · 验收与留证

- R3.1 每个被改文件都要有**与模板的对差证据**：R1 的 6 个 Trellis 管理文件应 `diff == 0`；
  `workflow.md` 应**只剩** `python3→python` 的差异（无门禁）。
- R3.2 `AGENTS.md` 改动后，规则块同步器 `--verify` 仍须**零漂移**（门禁在「项目覆盖」区，
  不参与正文哈希 → 预期不受影响，须实测确认）。
- R3.3 全仓复查 `glm-5.3-flash` 在受管文件（排除 `.history/`、任务目录、journal）中**零命中**。
- R3.4 各被改仓提交推送 `origin`（L0-7）；推送前 `git remote -v` 确认 origin 归属（P-12）。

---

## Acceptance Criteria（执行后勾选，证据随注）

- [x] **AC-D1**：本仓 8 处门禁全部删除；6 个 Trellis 管理文件与 0.6.16 模板 `diff == 0`。
      → 本仓 7 处已删（第 8 处属 `ST-zip-converter`，见归属记录）。实测 `.trellis/agents/check.md`、
      `.trellis/agents/implement.md`、`.codex/agents/trellis-{check,implement,research}.toml` **五文件差异 = 0 行**且逐字节一致。
      提交 `fca5329` 已推 `origin/main`。
- [x] **AC-D2**：`.trellis/workflow.md` 保留 `python3→python` 适配。
      → 断言实测：门禁命中 `0`、`python3` 残留 `0`、`python ./.trellis` 适配行 `28` 处；
      与模板的**非 python 差异行数 = 0**（剩余差异 100% 为该项）。
- [x] **AC-D3**：`AGENTS.md`「项目覆盖」区恢复空节标准形态；规则块 `--verify` 零漂移。
      → 改为 `## 项目覆盖` + 空行 + `<!-- TAVERN-RULES:END -->`（与无覆盖仓 `ST-BgLoader` 形态一致）；
      `--verify` → `校验完成：14 个目标，14 个与真源一致，0 个需处理`。
- [x] **AC-D4**：R2 的 6 个旧版 codex 代理文件与模板 `diff == 0`。
      → `ST-chatfilesys-rebuild` 3 个：**差异 = 0 行**、逐字节一致；该仓 `.gitignore:9` 整体忽略 `.codex/`
      → **只本地生效、无需提交**（与其 `AGENTS.md`（`.gitignore:10`）同待遇，追踪面未新增改动）。
      → `ST-zip-converter` 3 个：内容已为逐字节一致的默认版，但该改动**由另一会话的提交连带提交**，见归属记录。
- [x] **AC-D5**：全仓 `glm-5.3-flash` 零命中（受管文件口径：排除 `node_modules`、`.history/`、`.trellis/tasks/`、`.trellis/workspace/`）。
      → **零命中**。注：`ST-zip-converter` 的 **`main` 上仍有该行**（修复只在其功能分支），
      其工作区因检出该分支故显示已修复。
- [x] **AC-D6**：改动仓已提交推送 `origin`，零 `upstream` 推送，`Instance/Real/**` 零操作。
      → 本仓 `fca5329` → `origin/main`（推送前 `git remote -v` 审计为 `jiozhaoyue/ST-Delegation-of-authority`）；
      `chatfilesys-rebuild` 无需提交（忽略面）；`zip-converter` 未由本任务提交（见归属记录）。零 `upstream` 推送；未触碰 `Instance/**`。

### 归属记录（如实记账）

**`ST-zip-converter` 的改动被另一会话的提交连带提交。** 时间戳实测：本任务写入该仓 4 个文件的时间为
`2026-09-25 17:53:13`；另一会话的提交 `4bcf119 docs(spec): 拆分超限 spec 文件 + T4 验收回填 + 修复 T3 遗留的列表割裂`
为 `17:53:42`（**29 秒后**），其 stat 含 `.codex/agents/trellis-{check,implement,research}.toml`（156/132/178 行）
与 `.trellis/spec/guides/index.md`（2 行）。

- 该仓当时处在**另一会话的功能分支** `fix/perf-hardening-transfer-memory`（非 `main`），该分支已推送（`f12eaa2`）。
- 发现后本任务**立即撤回**工作区写入（`git checkout --`），但撤回时已被提交 → 撤回未生效（patch 生成为 0 行即证据）。
- **处置（用户 2026-09-25 裁定）：接受现状**——改动随该 PR 合并进 `main`；**不改写他人分支历史**。
- 影响：合并前 `ST-zip-converter` 的 `main` 仍带 spec 里的门禁行，其 R2「恢复默认」亦同。
- 教训（候选进真源规则，见「待裁定项」）：**多会话并发改同一仓时，未提交的外部改动会被另一会话的
  commit 连带提交**——写盘与提交之间的窗口实测可短至 29 秒。

---

## 明确不做（附理由）

| 项 | 理由 |
| --- | --- |
| `ST-Codex-theme/.codex/config.toml`（`[shell_environment_policy]`，与模板差 44 行） | **非子代理相关内容**，是 shell 环境策略（`CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR = "1"`），多仓统一存在。要不要回默认属另一件事 |
| `ST-chatfilesys-rebuild/.github/copilot-instructions.md` | 被 Trellis 标为已改，但**非子代理**；未在本任务批准范围内 |
| `PureTavern/AGENTS.md` | 同上；且该文件是**规则块同步器**的写入目标（块内 `TAVERN-RULES` 与 Trellis 块共存），回默认会**清掉规则块**——绝不可做 |
| 规则块 L0-8 的「项目约定 DeepSeek-V4-Flash」表述 | 真源 `rules/L0-global.md` 的改动需**版本提升 + 15 仓重同步**，超出本任务；且用户级全局规则 §4「子代理用最低档小模型」仍有效。**列为待裁定项**（见下） |

---

## 待裁定项（不在本任务执行范围）

1. **L0-8 与实际状态的口径**：门禁删除后，规则块 L0-8 仍写「本仓群子代理一律使用能力较低的小模型，
   当前指定 `DeepSeek-V4-Flash[free]`（模型 ID `claude-haiku-4-5-20251001`）」。删门禁不等于删这条规则，
   但「指定具体模型名」与「全部默认」在字面上有张力。若要改真源须另立任务（改 `rules/` → 版本提升 →
   全仓重同步）。
2. **`ST-zip-converter/.trellis/spec/guides/index.md` 的门禁行**：本仓群 spec 页是否应统一不留模型名？
   （本任务只去掉该行写死的模型名，整节 `## Sub-Agent Dispatch Rule (CRITICAL)` 的去留待你定。）
3. **多会话并发纪律**（候选进真源规则）：同仓并发时，**未提交的外部改动会被另一会话的 commit 连带提交**
   （本案实测窗口 29 秒）。可选防护：跨仓写入改为"写盘与提交同批完成"；或并发会话开工前先认领仓库。
   若要立条须改 `tavern-harness/rules/` → 版本提升 → 15 仓重同步，故本任务不擅自动真源。

---

## Out of Scope

- 修改 Trellis 上游源码 / `node_modules`。
- 规则真源（`tavern-harness/rules/**`）的任何改动。
- 子任务 B / C 的范围。
- `Instance/**` 任何操作。
