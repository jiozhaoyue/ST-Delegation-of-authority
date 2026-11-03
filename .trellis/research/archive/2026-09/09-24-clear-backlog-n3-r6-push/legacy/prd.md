# 在册缺陷与积压事项清零：N-3 恢复、R6 规则落盘、10 仓推送、登记册收尾

## Goal

把 tavern-harness 登记册的全部剩余在册项处置完毕（2026-09-24 用户四项裁定），使登记册回到「无待决事项」状态；10 个受同步仓的规则块提交完成远程化。

## Background（用户 2026-09-24 裁定）

- **N-3**：批准 `git restore`——Dev/TauriTavern 的 src-tauri 与 1289 个被跟踪文件是被从工作区删除（非缺克隆），
  两实例同指上游 `Darkatse/TauriTavern`、HEAD 同指 `3a8c5401`。恢复后 Dev/TT 具备构建条件（node_modules 仍需另行 pnpm install）。
- **N-4/N-5**：落盘规则层方案——不改任何实例配置（只读红线），把端口段位规则写进真源仓 rules/ 并同步分发。
- **N-6**：用户拍板**保留** Real/PureTavern——不再作为缺陷登记。
- **杂项三件全做**（用户明确指示不再逐项询问）：
  1. 10 个受同步仓推送（翻转 09-21「只提交不推送」裁定）；
  2. §4.5/§4.6 同步缺口口径修正（实测三处副本均已同步，缺口不存在）；
  3. R6 规则草案（G-1–G-6）落盘真源仓并全链同步分发。

## Requirements

- **R1（N-3 恢复）**：在 `Instance/Dev/TauriTavern` 执行 `git restore .`（或分批）恢复 1289 个被删除的被跟踪文件。
  恢复前后各取证一次（`git status -s | wc -l`）；恢复后 `git status` 的 D 计数归零。不做 pnpm install、不做构建（用户未批准安装依赖）。
- **R2（R6 落盘）**：按 `09-22-tavern-dev-env-rules/deliverables/04-test-dev-rules.md` §6.1 的 G-1…G-6，
  写入 `tavern-harness/rules/`（G-4 端口段位 → `L0-global.md`；G-5/P-14、P-15 与 G-6/P-16 → `pitfalls.md`；
  G-1/G-2/G-3 → `groups/myfork.md`）。**脱敏**：不含本机安全细节。落盘后跑同步器全链：
  `test_sync_tavern_rules.py` → `--dry-run` → `--apply` → `--verify` → commit + push（origin）。
- **R3（10 仓推送）**：遍历 targets.json 的 enabled 仓，凡有未推送提交的（09-21 规则块提交），为其建私有远程仓并推送。
  建仓前先 `git remote -v` 确认 origin 指向；缺 remote 的仓视为「未完成」，按 L0-7 建私有仓 `jiozhaoyue/<name>`。
- **R4（登记册收尾）**：
  - N-3 标完成（restore 已执行、构建条件具备、node_modules/install 留待后续按需执行）；
  - N-4/N-5 标完成（规则层已落盘；配置层维持现状，用户知情）；
  - N-6 标「用户裁定保留，关闭」；
  - §4.5/§4.6 缺口条目标「实测已同步，口径修正」；
  - 10 仓推送完成状态记入。
  commit + push origin。
- **R5（提交纪律）**：真源仓 tavern-harness 每次提交后推送 origin；受同步仓的规则块同步提交也逐仓推送。
- **R6（实清实结）**：收尾时若发现登记册还有未勾选/未决项，先完成或经用户确认挂起后才能归档任务。

## Acceptance Criteria

- [x] AC-1：Dev/TauriTavern `git status -s` 中 D 计数归零（实测 0）；src-tauri 目录恢复存在；恢复前后有取证记录（恢复前 1289 D / 恢复后 0）
- [x] AC-2：tavern-harness rules/ 落盘 G-1…G-6 六条目（L0-16 / L1-MF-15 / L1-MF-16 / P-14/15/16 + 已知缺陷节事实更新）；`test_sync_tavern_rules.py` 全绿；`--dry-run` 预览 13 仓 + 1 已知跳过；`--apply` 后 `--verify` 13/14 一致（唯一例外 ST-shujuku-rebuild 为既有 create_missing 配置，非漂移）
- [x] AC-3：10 仓本地 HEAD 与远程 HEAD 全部一致（终验 10/10 ✓：BgLoader 5350870 / Switcher 84b8b33 / PureTavern b44d163 / Timelines ace1e01 / PanelReset 6c97f11 / zip-converter b56b499 / chatfile-improve 1d269c3 / msg-btn-mgr ca8850d / shujuku-rebuild 681e31f / Authority a7e9d2a）
- [x] AC-4：登记册 N-3/N-4/N-5/N-6 全部标完成/关闭，§4.5/§4.6 口径修正，10 仓推送状态入册；tavern-harness commit `1beb71f` 已推送
- [x] AC-5：登记册「移交状态」节无遗留 ⏳/待决项（grep 待决标记 0 命中）；下一可用缺陷编号 N-12 已注明
- [x] AC-6：ST-Delegation-of-authority 本仓工作区收尾时干净（规则块已提交推送 a7e9d2a、.bak 已清）；journal 已记录本任务全程
