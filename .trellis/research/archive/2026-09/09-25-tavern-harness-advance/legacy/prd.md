# tavern-harness 统一推进：规则补条与全仓重同步

> 父任务：`09-25-tavern-project-bootstrap` · 子任务 B（无依赖，可与 A 并行；**是 C 的前置**）

## Goal

把 2026-09-25 新获得的两条跨仓事实补进规则真源，修复真源校验发现的唯一漂移项，
并把新版本规则块重新同步到 15 个目标仓——使真源与全仓群回到零漂移。

---

## Background

### 真源现状（2026-09-25 实测）

`python scripts/sync_tavern_rules.py --verify` 结果：**14 个目标，13 个与真源一致，1 个待处理**。

| 项 | 状态 |
| --- | --- |
| `ST-shujuku-rebuild/AGENTS.md` | **[缺失文件]** 目标文件不存在，且未声明 `create_missing` |
| `ST-chatfile-improve` 的 `AGENTS.md`/`GEMINI.md` | 提示为指向 `CLAUDE.md` 的符号链接 → 已按物理路径去重合并（P-4 修复在生效） |
| 其余 12 个目标文件 | 零漂移 |

### 待补的两条新规则（均为 2026-09-25 实测所得，跨仓通用）

**F1 · 任务目录不进版本库**
- 事实：`.gitignore` 排除 `.trellis/tasks/` 与 `.trellis/workspace/`（提交 `4f0193e`「公开 fork 防泄露」），
  **保留** `.trellis/spec/`。
- 后果一：任务目录中的交付物**不进 git、不推送**，随归档不可见——与 P-1 同形。
- 后果二：用 `git diff --stat` 验证"改动是否只在任务目录"**永远为空**，不能作范围门。
- 后果三：若 spec 页只写"详见任务目录的 deliverables"，在其他机器上即**悬空引用**（P-4 同形）。
- 应立规则：**任务收口把规范条文落 `.trellis/spec/`；spec 页须自包含（内联证据），不得引用任务目录路径；
  范围门改用 `git status --short` 为空。**

**F2 · 私有仓不可作 Trellis 市场源（HTTP 路径）**
- 事实：Trellis 的模板/工作流市场源语法为 `provider:user/repo[/subdir][#ref]`；
  `gh:`/`github:` 前缀走 `raw.githubusercontent.com`，**私有仓返回 404**；
  git 回退（`preferGit`）**仅**对 SSH / 自建 host 触发。
- 应立规则：**本仓群私有仓若需作 Trellis 市场源，必须用 SSH 形式
  （`git@github.com:<owner>/<repo>`），或以公开脱敏仓承载。**

两条均属"跨仓通用"（影响全部 15 仓），故进 L0 或"坑与教训"节；具体归属由实施时按现有章节结构判定。

---

## Requirements

### R1 · 补规则条

- R1.1 把 F1 补进真源（判据：跨仓通用 → 进 `rules/L0-global.md` 或 `rules/pitfalls.md`）。
  若进 pitfalls，须遵守该文件"每条必须带真实案例与后果"的收录标准——本案有（前序任务的 E5 实测）。
- R1.2 把 F2 补进真源（同上判据）。
- R1.3 两条均须写清：规则内容、原因、违反后果；**不得只写标题**（P-2 的教训：有损摘要比不同步更糟）。
- R1.4 版本号提升（`targets.json` 的 `version` + `CHANGELOG.md`），并在块头体现。

### R2 · 修复唯一漂移项

- R2.1 `ST-shujuku-rebuild/AGENTS.md` 缺失：确认该仓是否应纳入（`enabled` 当前为 `true` 但文件不存在）。
  两种处置：补 `create_missing: true` 后写入，或将该仓 `enabled` 置 `false` 并说明理由。
- R2.2 该仓当时被从工作区删除过 1289 个被跟踪文件（P-16 记录的 TauriTavern 倒挂是同类现象）——
  实施前**先现场取证**该仓的 `git status` 与文件清单，不以目录名推断。

### R3 · 全仓重同步（**PARDON 高风险门**）

- R3.1 **先 `--dry-run` 出完整将写入清单**（逐仓逐文件），**列出目标路径与理由，等用户批准后才 `--apply`**。
- R3.2 同步器既有护栏必须全开：Git 工作区不干净时拒绝写盘、写盘前生成 `.bak`、
  marker 不成对或含前作残留时报错中止。
- R3.3 逐仓提交推送 `origin`（L0-7）；**绝不推 `upstream`**；推送前 `git remote -v` 确认 `origin` 归属（L1-MF-1 / P-12）。
- R3.4 真源仓自身提交推送。
- R3.5 收尾 `--verify` 须为**零漂移**。

---

## Acceptance Criteria

- [x] **AC-B1**：F1、F2 已进真源，各含内容/原因/真实案例/违反后果（非仅标题）。
      → **合并为一条 L0-17「Trellis 工程纪律（交付物落点 · 市场源）」**（同主题，避免新增两条近空规则），
      含 (1) 交付物落点与范围门、(2) 市场源须 SSH 两小节，每节均带规则/原因（含实测出处与提交号）/违反后果。
- [x] **AC-B2**：`version` 与 `CHANGELOG.md` 已更新，块头版本号一致。
      → `targets.json` version `1.1.0→1.2.0`；`CHANGELOG.md` 新增 v1.2.0 节（含新增规则表 + 记账修正表）；
      `pitfalls.md` 变更记录加 v1.2.0 行；同步后的块头实测为 `TAVERN-RULES:START v1.2.0` + `统一开发规则（v1.2.0）`。
- [x] **AC-B3**：`ST-shujuku-rebuild` 的漂移已处置，处置前有现场取证。
      → **真因是记账错误而非文件缺失**：`targets.json` 记的 `D:/Repo/Tavern-repo/My-repo/ST-shujuku-rebuild`
      **已不存在**，仓实际在 `Myfork/` 下；其 `AGENTS.md` 完好（含 v1.1.0 块 + 块外 41 行手写前言）。
      取证：`git remote -v`（origin=jiozhaoyue 自有）、分支 `master`、`manifest.json` v9.4.0。
      **只改 `path` 一行；`group` 保持 `my-repo`**——依据 `rules/groups/my-repo.md` 开篇明确列举该仓
      （分组按**形态**判定，不按目录位置）。
- [x] **AC-B4**：`--dry-run` 的完整写入清单已列给用户并**获明确批准**后才 `--apply`。
      → dry-run 清单（14 文件 / 12 仓，全为 `[更新]`、无 `[新建]`）已列给用户；
      用户 2026-09-25 批准「全部 12 仓一次写完」。另发现 6 仓工作区不干净，
      **逐个核实其脏文件均非目标规则文件**（脏的是 `.trellis/tasks/`、`apps/web` 代码、`.codex/` 等），
      故 `--allow-dirty` 不会覆盖任何未提交工作——该推理已随清单报给用户。
- [x] **AC-B5**：`python scripts/test_sync_tavern_rules.py` 沙箱回归全绿。
      → `✅ 全部通过`，exit=0。**注意**：该测试在 GBK 控制台会因无法打印 `✓`/`✗` 而崩栈报**假失败**，
      必须 `PYTHONIOENCODING=utf-8`（已记为待办，见下）。
- [x] **AC-B6**：`--verify` 收尾为**零漂移**。
      → `校验完成：14 个目标，14 个与真源一致，0 个需处理`。
- [x] **AC-B7**：所有被改动的仓与其真源仓均已提交推送 `origin`；零 `upstream` 推送。
      → **真源仓已推送**（`e844586` → origin/main）。
      → **12 仓中 9 仓已提交推送成功**；**2 仓按其自身约定不提交**（`ST-chatfilesys-rebuild` `.gitignore:10`、
      `ST-git-improve` `.gitignore:18` 均有意忽略 `AGENTS.md` → 规则块仅本地生效）；
      **1 仓推送被拒**（见下方「收尾补记」）→ **该仓已于 2026-09-25 续会话推送成功**。
      → 推送前已对 12 仓逐个做 `git remote -v` 审计，**全部 origin 均为 `jiozhaoyue/` 自有仓**，无 P-12 风险；
      零 `upstream` 推送。
- [x] **AC-B8**：子任务 C 可基于本任务推送后的状态开始。
      → 真源已推送且 `--verify` 零漂移；新增 `index.json` 等市场文件不会影响规则块正文哈希（R1.2 依据成立）。
- [x] **AC-B9**（续会话追加）：首轮遗漏的三项已处置并推送。
      → ① `ST-msg-btn-mgr` 推送（`79b1a43..54f0802`）② GBK 假失败修复 ③ `*.bak` 复发根因根治；
      真源仓修复提交 `806f6cb` 已推送。详见下方「收尾补记」。

### 收尾补记（2026-09-25 续会话，三项均经用户裁定后执行）

用户裁定：① `rebase --autostash` ② 删除 + 根治备份落点 ③ 修 GBK 假失败 ④ 收口后立即开子任务 C。

| # | 原未达成项 | 处置 | 证据 |
| --- | --- | --- | --- |
| 1 | `ST-msg-btn-mgr` 推送被拒（远程 `79b1a43 [bot] Bump deps` 与本仓未提交的 `package.json` 相遇） | `git pull --rebase --autostash origin main` → 自动 pop 无冲突 → `git push origin main`。**未用 reset/force**；推送前 `git remote -v` 确认为 `jiozhaoyue/ST-msg-btn-mgr` | `79b1a43..54f0802 main -> main`，分支回 `[origin/main]` 同步。用户 WIP 指纹逐个复核：`bundle.yaml`/`.gitignore`/`release-script-json.yaml` md5 **不变**；`package.json` md5 变化系 bot 的 devDependencies 改版并入所致（预期），相对新 HEAD 的 diff **只剩用户自己的 scripts 段**（`lint`/`lint:fix`/`dump`/`sync`），未提交状态保持 |
| 2 | `test_sync_tavern_rules.py` GBK 假失败 | 两脚本入口加 `use_utf8_stdio()`（stdout/stderr reconfigure UTF-8 + `errors="replace"`）。复现取证：`stdout.encoding=gbk`，脚本在**第一条断言**处 `UnicodeEncodeError` 崩栈、exit=1（比"看起来像失败"更严重：测试根本没跑完）。**同步器同源问题一并修**（范围外追加，已如实标注）：`⚠️` 走「工作区不干净／marker 不成对／存在前作块」三条**告警路径**，恰在最需要这条消息时崩栈 | 不带 `PYTHONIOENCODING` 直接跑：`✅ 全部通过`、exit=0 |
| 3 | **新发现：`*.bak` 复发根因**（本次取证时发现） | 同步器 `shutil.copy2(path, path+".bak")` 把备份留在目标仓内，而门禁 `is_dirty()` 用 `git status --porcelain`（含未跟踪项）→ **同步器自己的产物让每个目标仓恒为"脏"**，「不干净时拒绝写盘」失效、`--allow-dirty` 沦为常态（9-24 已手工清过 11 个 → 属复发）。处置：备份改落真源仓 `.backups/<仓名>/<文件名>.<时间戳>.bak`（`TAVERN_RULES_BACKUP_DIR` 可覆盖），`.backups/` 入 `.gitignore`；测试断言改钉新契约 | 删除 14 个残留 `*.bak`（用户批准）后，12 个目标仓对规则块**零残留**，9 仓 `git status --porcelain` 为空（余 3 个 JSSR 仓的脏项是用户自身在途工作）。真源仓提交 `806f6cb` 已推送 |

---

## Out of Scope

- Trellis 模板与市场仓布局 → 子任务 C。
- 修改规则块之外的文件（如各仓源码）。
- `Instance/**` 任何操作。
