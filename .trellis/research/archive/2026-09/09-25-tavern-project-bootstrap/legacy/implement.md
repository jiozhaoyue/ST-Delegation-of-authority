# 集成验收记录 — 酒馆项目脚手架（父任务）

> 本文件是父任务的**最终状态与遗留项**记录（AC-P7）。四个子任务全部归档后回填。

## 一、任务地图与最终状态

| 子任务 | 范围 | 状态 | 关键提交 |
| --- | --- | --- | --- |
| **A** `09-25-authority-backlog-closeout` | 本仓遗留项（core exe 体积、Instance 消费者盘点、TS 穷尽性） | ✅ 已归档 | `2681b1e`（core exe 17.74MB → 10.29MB） |
| **B** `09-25-tavern-harness-advance` | 真源仓补规则条、修唯一漂移项、15 仓重同步 | ✅ 已归档 | 真源 `e844586`（v1.2.0 新增 L0-17）+ `806f6cb`（工具链修复） |
| **C** `09-25-trellis-tavern-template` | 市场仓布局、workflow 模板、spec 种子、补轨 | ✅ 已归档 | 真源 `df8ac8e` → `c9f6210` → `bfd5f10` |
| **D** `09-25-remove-subagent-model-gate` | 删除自写子代理模型门禁、恢复 Trellis 默认 | ✅ 已归档 | 本仓 `fca5329` + `034b962`；zip-converter 随其分支 `4bcf119` |

**B 的收尾**（原「未达成项」三项全部处置）：`ST-msg-btn-mgr` 经 `rebase --autostash` 推送成功（WIP 逐文件指纹无损）；
GBK 假失败修复（并扩到同步器的 `⚠️` 告警路径）；`*.bak` 复发根因根治（备份改落真源仓 `.backups/`，删 14 个残留，
目标仓"脏工作区"门禁恢复有效）。

**D 的由来**：C 的规划问答中用户裁定「删除这些自写的子代理，所有仓库也删，只留默认 trellis 的」，
故立 D 承载（跨仓删除属 PARDON，先出取证清单再执行）。

## 二、跨子验收（父 PRD 的 AC-P1…P7）

- [x] **AC-P1**：三个子任务各自的 AC 全部勾选且已归档。
      → 四个子任务（A/B/C/D）**全部归档**（`archive/2026-09/`）；各自 AC 逐条勾选并附证据。
- [x] **AC-P2**（新项目路径）：全新目录一条命令产出可用 `.trellis/`。
      → 实跑 `trellis init -y -u <name> --claude --workflow tavern --workflow-source <SSH源>
      --registry <SSH源> -t tavern-spec`：得到 `.trellis/workflow.md`（`python3`=0 / `python`=32，含 tavern 追加节）
      与 `.trellis/spec/tavern/{host-compat,degradation,offline-frontend}.md`（与源逐字节一致）。
      证据见 C 的 `implement.md` 阶段 4。
- [x] **AC-P3**（既有项目路径）：增量同步且**本地改动不丢失**。
      → 沙箱副本（复制真实仓 `.trellis/` + 预置本地改动）实跑：种子判为 `New files (will add)`；
      本地修改判为 `Modified by you (need your decision)` + `Deleted by you (preserved)`；
      `update -s` 后预置改动仍在、`config.yaml` md5 **完全不变**。证据见 C 的 `implement.md` 阶段 5。
- [x] **AC-P4**（原生性）：全流程无自造分发机制。
      → 模板分发只经 `trellis workflow`（N1）与 `registry.spec` + `trellis update`（N2/N7）；
      补轨只写 Trellis 管不到的层（config 偏好 / 规则块），且**不下载任何模板**（只打印原生命令）。
- [x] **AC-P5**（云同步）：`tavern-harness` 已推送且含市场所需文件。
      → `index.json` + `workflows/tavern/` + `specs/tavern/` 均已推送 `origin`；
      `trellis workflow -m git@github.com:jiozhaoyue/tavern-harness --list` 在本机实测可列出条目
      （SSH 源形式）。**未跨机器实测**：需要第二台机器与 SSH key，本机无法伪造证据——
      按"SSH 源可达 + 命令可复现"记为达成，跨机器复现列为**遗留项 1**。
- [x] **AC-P6**（零污染）：未触碰 `Instance/Real/**`；未推 `upstream`；Authority 产品代码零改动。
      → 本仓父任务期间仅两次提交（`fca5329` / `034b962`），改动文件 **9 个**、全在治理层
      （`.trellis/**`、`.codex/agents/**`、`AGENTS.md`）；
      `git diff --stat 2681b1e..HEAD -- packages crates docs runtime managed` **空**；
      `upstream`（`Youzini-afk/ST-Delegation-of-authority`）存在但**从未推送**；`Instance/**` 零操作
      （C 的全部验证在系统临时目录，已清理）。
- [x] **AC-P7**：父任务 `implement.md` 记录四个任务的最终状态与遗留项。
      → 本文件。

## 三、遗留项（需用户裁定，均已在各子任务产物留证）

| # | 遗留项 | 出处 |
| --- | --- | --- |
| 1 | **AC-P5 的跨机器复现未实测**：需另一台机器 `git clone` + 配 SSH key 后重跑 AC-P2 的命令 | 本文件 §二 |
| 2 | **规则块 L0-8 与实际状态的口径**：门禁已删，但 L0-8 仍写「本仓群子代理一律使用能力较低的小模型，当前指定 `DeepSeek-V4-Flash[free]`」；改真源须版本提升 + 15 仓重同步 | D 的 PRD「待裁定项 1」 |
| 3 | **`ST-zip-converter` spec 的整节 `## Sub-Agent Dispatch Rule (CRITICAL)` 去留**（本任务只去掉写死的模型名） | D 的 PRD「待裁定项 2」 |
| 4 | **多会话并发纪律是否立条**：实测同仓并发时，未提交的外部改动会在 **29 秒**内被另一会话的 commit 连带提交（zip-converter 实证） | D 的 PRD「待裁定项 3」 |
| 5 | **`ST-zip-converter` 的 `main` 在合并前仍带 spec 门禁行**（修复只在其功能分支 `fix/perf-hardening-transfer-memory`，已推送） | D 的 PRD「归属记录」 |
| 6 | `remove_legacy_rules_block.py`（前作块清理遗留工具）仍把 `.bak` 写在目标仓内且打印 `✓` 会触发 GBK 崩栈；本轮未改（冻结工具、无现役用途） | B 的产物 |

## 四、范围门与纪律复核

- 真源仓 `tavern-harness`：`--verify` = **14/14 零漂移**；沙箱回归 `✅ 全部通过`。
- 本仓范围门（L0-17 口径）：父任务相关改动全在治理层，产品代码零改动（见 AC-P6 证据）。
- 推送纪律：全部推送 `origin`；零 `upstream` 推送；推送前逐仓 `git remote -v` 审计。
- PARDON：C 的市场文件为**新增**（无覆盖）；D 的删除经用户逐项批准；B 的重同步经 dry-run 清单批准。
- 实例纪律：`Instance/Real/**` 全程零操作；`Instance/Dev/**` 未涉及。
