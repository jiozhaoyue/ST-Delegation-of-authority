# 实施清单 — 规则层 v1.4.0

> 复选框随执行**实时勾选**（全局规则 §4.5）。每阶段末尾附证据行。
> **PARDON 门**：阶段 4（分发写盘 `--apply`）与阶段 5（跨仓提交推送）均先出清单获用户批准。
> **本任务自身即新条目的第一个实践者**：全程 `git add <显式文件>`，提交前校验暂存区。

## 阶段 0 — 起点取证

- [x] `--verify` 起点：14/14 零漂移（本任务开工前状态）
- [x] `remove_legacy_rules_block.py` dry-run：**0 个文件**含前作残留块 → 登记册 N-7 条目已过时（另案记账修正）
- [x] 确认无活动任务；上一个任务 `09-25-tavern-skills-canonical` 已归档
- [x] 检索先行（双通道）：WebSearch 被本机代理拦（thinking 模式冲突）→ 走 GitHub API 检索，命中 `yjk72091/git-agent-workflow`；官方文档核对子代理能力

**证据**：`校验完成：14 个目标，14 个与真源一致，0 个需处理`；legacy 清理器 `0 个文件`

## 阶段 1 — 待裁定两点（先问，不猜）

- [x] 问用户：`L0-8` 并发上限数值 → **交给宿主默认**（不写死数值）
- [x] 问用户：`P-18` 是否随规则入库分发 → **入库并分发**

## 阶段 2 — 规则正文改动

- [x] `rules/L0-global.md`：`L0-7` 新增「(2) 多会话共享工作区的提交边界」（R1.1–R1.5）
- [x] `rules/L0-global.md`：`L0-8` 重写（R2.1–R2.7），标题更名
- [x] `rules/pitfalls.md`：新增 `P-18`（R3）+ 变更记录 v1.4.0 行
- [x] `targets.json`：`version` `1.3.0` → `1.4.0`
- [x] `README.md`：L0 条数记账修正（`15 条` → `17 条`，实测）
- [x] **P-17 自检**：本机路径扫描，除既有 `L0-1` 外零新增命中（AC-4）

**证据**：`git diff --stat` = 4 文件（L0-global 77+/−、pitfalls 30+、targets 1 行、README 1 行）；
路径扫描命中项全部为**既有**条目（`L0-1` 实例事实、`P-3`/`P-17` 案例文本）与 URL 误报，**零新增**。
**踩坑记录**：首版 L0-7 正文写了逐字标题 → 被回归测试「「项目覆盖」标题唯一」拦下（该标题是块解析边界），已改写。

## 阶段 3 — 回归与 dry-run

- [x] `python scripts/test_sync_tavern_rules.py` → **✅ 全部通过**
- [x] `python scripts/sync_tavern_rules.py --dry-run` → **14 个目标全部「更新：正文哈希变化 → 重建块」**
- [x] 漂移项分析：起点 `--verify` = 14/14 零漂移 → **无意外漂移**；`ST-chatfilesys-rebuild` 标注「**保留「项目覆盖」区内容**」
- [x] 写盘前置核查：12 个受管仓的目标文件工作区**全部 CLEAN**（无未提交本地改动会被覆盖）

**证据**：dry-run 统计 `更新=14`；逐仓 `git status --short -- <files>` 全空

## 阶段 4 — 分发写盘（PARDON 门）

- [x] 把 dry-run 清单完整列给用户
- [x] 用户**批准**后 `--apply`：首批写 **6** 个；余 **8** 个被「工作区不干净」门禁拦下
- [x] 诊断拦下原因 → **8 仓的目标文件本身全部 CLEAN**，脏的是**别的会话的在途工作**（整仓级门禁）→ 用户裁定**逐仓 `--allow-dirty`** 补写
- [x] 逐仓补写 7 仓 / 8 文件（每仓单独执行、单独留记录）
- [x] `--verify` → **14 个目标，14 个与真源一致，0 个需处理**（AC-7）
- [x] 抽样 3 仓实测（`ST-chatfilesys-rebuild` / `PureTavern` / `ST-msg-btn-mgr`，覆盖 3 个仓群）：
      `TAVERN-RULES:START v1.4.0`、新 L0-7 / L0-8 标题、`P-18` 均在；`PO-1` / `PO-2` **存活**（AC-8）
- [x] 旧模型名残留检查（`DeepSeek-V4-Flash` / `Kimi K3`）→ **零残留**

**证据**：`校验完成：14 个目标，14 个与真源一致，0 个需处理`；
备份落 `tavern-harness/.backups/<仓名>/<文件名>.<时间戳>.bak`；
3 仓群抽样行号：chatfilesys `:23/:705/:717`、PureTavern `:2/:97/:681`、msg-btn-mgr `:12/:107/:720`

**证据**：待填

## 阶段 5 — 提交与推送（PARDON 门）

- [x] 提交清单（真源 + 10 目标仓，含 2 个功能分支）完整列给用户并**获批准**
- [x] 真源仓 `tavern-harness`：显式 pathspec 提交 → 推送 `origin`（`05a6f7a` 规则层；`6de1201` 记账收口）
- [x] 逐仓提交推送目标仓（显式 pathspec + **暂存区集合断言**；被 gitignore 的仓如实记录）
- [x] 逐仓 `git remote -v` 审计：**零 `upstream` 推送**（全部 `git push origin <当前分支>`）
- [x] `Instance/**` 零操作取证

**证据（提交号）**：
BgLoader `cad4935`、Switcher `48e9a58`、shujuku-rebuild `715b2a3`、zip-converter `733c510`、
PureTavern `452f8cd`、Authority `dee60ba`、PanelReset `269235b`、Timelines `da7180b`（功能分支）、
chatfile-improve `8d92827`（功能分支）、msg-btn-mgr `6d922af`。
`ST-chatfilesys-rebuild` / `ST-git-improve`：目标文件被 `.gitignore` 忽略 → **无可提交**。
`Instance/**` 取证：`Real/Luker/config.yaml` mtime `2026-09-25 21:52`、`Dev/Luker` 改动文件 mtime `2026-08-29` / `2026-09-25 19:31`，**均早于本会话起点 01:06**。

**途中三处纠正（均已处理，无遗留）**：
① 脚本里两条硬编码路径写错（`shujuku-rebuild` 实为 `Myfork/`、`PanelReset` 实为 `JS-Slash-Runner/`）→ 按 `targets.json` 实际路径补做；
② `ST-chatfile-improve` 的分支**无 upstream**，推送成功但 `rev-parse @{u}` 报错 → 脚本误报失败，**实测远程 ref 已等于本地 HEAD**，已核实；
③ 目标仓目标文件**全部 CLEAN**、仅 `AGENTS.md`/`GEMINI.md` 是符号链接者按「跟随」处理。

## 阶段 6 — 记账收口

- [x] `docs/environment-defects.md`：N-13 / N-14 结案；父任务遗留项 **2** 与 **4** 关闭（并说明其余 4 项仍开）
- [x] `docs/environment-defects.md`：N-7 记账修正（实测 0 残留）
- [x] `CHANGELOG.md` v1.4.0 节（改动 + 依据 + 分发 + 途中被拦下的缺陷 + 明确边界）
- [x] `README.md` 记账修正（L0 条数 `15`→`17`）
- [x] 回填本文件与 `prd.md` 的 AC 勾选（实时）

**证据**：真源第二次提交 `6de1201`（2 文件 / 73 增 2 删）已推送

## 阶段 7 — 终态自检与收口

- [x] 全量自检四连：规则块 `--verify` **14/14 零漂移** ✅、规则同步器回归 **✅ 全部通过** ✅、
      真源仓工作区**干净** ✅、`main...origin/main` **已同步** ✅
- [x] `task.py finish`（活动任务已清空）
- [ ] `task.py archive`（待用户确认后执行）
