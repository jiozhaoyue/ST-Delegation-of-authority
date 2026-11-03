# 修复 tavern_helper_template 仓损坏并补齐 JSSR 悬空规则引用

## Goal

修复 `tavern_helper_template` 的 git 对象库损坏（N-11），随后补齐 JS-Slash-Runner 仓群的悬空规则引用（N-8），使 agent 规则文件恢复可用；据实修正缺陷登记册的口径偏差。

## Background（2026-09-24 现场取证）

- **N-11 损坏形态**：`.git/objects` 仅剩 69 个对象（30 blob / 26 tree / 12 commit）。
  HEAD 与 `refs/heads/main`、`refs/remotes/origin/*` 全部指向丢失对象 `9167e77f`。
  reflog 中出现过的全部 HEAD（9167e77f / c47c18ea / 15d05140 / 014be825 / a2fed28 / 716861bb / 21399cec / cf036de / e9d55f5）均可在远程 fork 的提交列表中找到
  → **本地存在未推送提交的丢失为零**，历史可从远程完整恢复。
- **工作区现状**：文件基本齐全（含 src/、scripts/、初始模板/、示例/），但 `.agent/`、`.codex/`、
  CLAUDE.md / AGENTS.md / GEMINI.md 在 index 中记录的 blob 已全部丢失（文件本身还在磁盘上）。
- **AGENTS.md 与 GEMINI.md 是指向 CLAUDE.md 的符号链接**（三文件物理同体，P-4 坑活体案例）——
  修引用时只改物理文件 CLAUDE.md，不碰链接。
- **远程健康**：origin（jiozhaoyue fork，main=`21424f3`，09-22 bot Bump deps，含 `.agent/` `.codex/` 目录）与
  upstream（StageDog）均可达。fork 上有 9 条 jiozhaoyue 提交（最后 9167e77f 2026-07-05）。
- **N-8 实际分化**（据实修正登记口径）：
  - `ST-chatfile-improve`：**无缺陷**——`.cursor/rules/` 在工作区实际存在，引用可解析（原登记口径偏大）。
  - `ST-msg-btn-mgr`：真缺陷——`.agent/rules/` 八件套在工作区且已入库
    （fe33faa v1.0 起跟踪），但 CLAUDE.md 引用仍写 `@.cursor/rules/`（06-07「/cursor文件夹改名」后未更新）。
  - `tavern_helper_template`：同缺陷且更严重——引用指向 `.cursor/rules/`，文件本体已不在本地（只在远程）。
- **约束**：`tavern_helper_template` 是**上游模板仓**（StageDog upstream），修复写操作须与上游对齐意识：
  修复动作只动 `.git` 内部与恢复丢失文件，不做业务改动、不向 upstream 推送。

## Requirements

- **R1（N-11 修复）**：tavern_helper_template 本地仓恢复到可读历史、可提交状态，且**零工作区丢失**：
  - R1.1 备份 `.git` 目录后再动手（回滚点）。
  - R1.2 `git fetch origin`（及 upstream）追加远程对象，重建 refs 指向 `9167e77f`（用户本地最后操作点）。
  - R1.3 用 `git status` + `git diff` 对照 index 恢复丢失文件（`.agent/`、`.codex/`、CLAUDE.md 系、以及 fsck 报告的其他丢失项）。
  - R1.4 修复后 `git fsck` 无 invalid sha1 pointer 错误；`git log` 可读全史。
- **R2（N-8 修复）**：
  - R2.1 ST-msg-btn-mgr：CLAUDE.md 中 8 条 `@.cursor/rules/*.mdc` 引用改为 `@.agent/rules/*.mdc`
    （只改物理文件；AGENTS/GEMINI 是符号链接自动跟随）。
  - R2.2 tavern_helper_template：恢复文件后同步修正引用路径（`.cursor/rules/` → `.agent/rules/`）。
  - R2.3 ST-chatfile-improve：不改动（无缺陷）；在登记册口径中修正。
- **R3（登记册更新）**：tavern-harness `docs/environment-defects.md`：
  - N-11 标记已完成（含实测证据摘要）。
  - N-8 标记已完成，注明三仓分化结论（msg-btn-mgr 改引用 / template 修复+改引用 / chatfile-improve 无缺陷）。
- **R4（推送纪律）**：msg-btn-mgr 的引用修复提交后推送 origin（L0-7：每次提交必推送）。

## Acceptance Criteria

- [x] AC-1：tavern_helper_template `git fsck --no-progress` 无 error（invalid sha1 pointer 类清零），`git log --oneline` 全史可读（实测 522 提交）
- [x] AC-2：tavern_helper_template `git status` 干净；`git diff origin/main --stat` 为空（工作区与远程零差异）；`.agent/rules/` 八件套、`.codex/skills/`、CLAUDE.md 系文件均已恢复
- [x] AC-3：ST-msg-btn-mgr 与 tavern_helper_template 的 CLAUDE.md 中 `@.agent/rules` 引用各 8 条、`@.cursor/rules` 活引用清零（msg-btn-mgr 剩余 1 处 `.cursor` 字样为统一规则块内 P-4 坑案例的历史事实描述文字，非活引用，不属悬空）；ST-chatfile-improve 保持原状（无改动）
- [x] AC-4：tavern-harness 登记册 N-11 / N-8 标完成 + chatfile-improve 口径修正，commit `54ff5c8` 已推送
- [x] AC-3.5：tavern_helper_template 修复后工作区无业务内容损失（14 个丢失文件经 `git restore` 全部恢复，工作区与远程零差异，ff 同步至 09-22 最新）

## Notes

- 轻量任务：PRD-only。执行顺序：R1（N-11 修复）→ R2.2（template 引用修正）→ R2.1（msg-btn-mgr）→ R3（登记册）→ R4（推送）。
- 修复动作对 template 仓 `.git` 的写入属「git 修复操作」，已获用户批准的 N-11 处置范围；不做任何业务代码改动。
- 对上游意识：fork 的 `.cursor → .agent` 改名是用户本地二改（fork 上已存在的提交），修复仅恢复原状，不产生与上游的新分叉。
- 符号链接注意（P-4）：三仓的 AGENTS.md/GEMINI.md 均为指向 CLAUDE.md 的符号链接；所有引用修改只对物理文件 CLAUDE.md 做 Edit。
