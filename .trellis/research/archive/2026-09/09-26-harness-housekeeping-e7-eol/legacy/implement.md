# 实施清单 — 真源仓内务收口

> 复选框随执行**实时勾选**（全局规则 §4.5）。证据行附在每阶段末尾。
> 本任务**不改 `rules/` 正文** → `--verify` 必须仍为 14/14（越界判据）。

## 阶段 0 — 起点取证 ✅

- [x] `git ls-files --eol` 全仓审计：**40 `i/lf w/lf` / 10 `i/lf w/crlf` / 零 `i/crlf`**
- [x] 定位 E-7 工具缺陷：D1 `str(p) + ".bak"`（第 110 行）、D2 `✓`/`⚠️` 打印（第 87–114 行）
- [x] 确认工具**无现役用途**：N-7 dry-run 报「0 个文件」
- [x] 检索先行：WebSearch 不可用（本机代理拦）→ GitHub API 检索（无同题先例）+ git 官方文档核对 `text`/`eol`/`renormalize` 语义
- [x] 边界基线：`--verify` = 14/14 零漂移

**证据**：见 PRD「起点取证」节；`校验完成：14 个目标，14 个与真源一致，0 个需处理`

## 阶段 1 — 待裁定三项（先问，不猜）✅

- [x] 问用户：E-7 工具 修复 vs 退役 → **修复并保留**
- [x] 问用户：陈旧工作区行尾 是否刷新 → **刷新为 LF**
- [x] 问用户：`targets.json` 是否一并锁 → **一并锁**
- [x] （实施中追加）刷新后暴露 skill 目标副本 CRLF → 再次问用户 → **重写目标为 LF**

## 阶段 2 — 修复 E-7 工具 ✅

- [x] 备份改落**仓外**（`.backups/<仓名>/<文件名>.<时间戳>.bak`，`TAVERN_RULES_BACKUP_DIR` 可覆盖）
- [x] `main()` 开头 `use_utf8_stdio()`（消除 `✓`/`⚠️` 的 cp936 崩栈）
- [x] 加 `--targets`（沙箱验证用，与同步器同形）
- [x] docstring 记两个缺陷的成因与修法 + 「一次性迁移工具」定位
- [x] 新增沙箱回归 `scripts/test_remove_legacy_rules_block.py`：**8 组 / 21 项断言**
- [x] 回归实测：`--apply` 后**目标仓内零 `*.bak`**、仓外备份 4 个且内容 = 清理前原始字节

**证据**：`✅ 全部通过`（21 项）；首轮 4 项失败**全是我测试自身写错**（比对基准用错行尾形态、断言了脚本未打印的标题、
末尾块的期望与「保守语义」不符）→ 修测试而非改产品语义。

## 阶段 3 — 行尾锁与刷新 ✅

- [x] `.gitattributes` 追加 `rules/** text eol=lf` 与 `targets.json text eol=lf`（+ 踩坑警告注释）
- [x] `git ls-files --eol -- rules targets.json` 取证：`attr/` 列全为 `text eol=lf`
- [x] 断言零内容变更：`git status --short -- rules/ targets.json` 为空
- [x] 刷新 10 个陈旧工作区为 LF
- [x] `git checkout-index -f` **实测不生效**（静默跳过）→ 改用「先断言工作区归一化后 == 索引 blob，再 `rm` + `git checkout --`」
- [x] 复核：刷新后 `git status` 仍干净、`w/crlf` **归零**

**证据**：`git ls-files --eol | grep w/crlf` → **无**；每个文件刷新前均通过「内容与索引一致」断言（零内容丢失）

## 阶段 4 — 刷新暴露的连带问题：skill 目标副本 ✅

- [x] 刷新后 `sync_tavern_skills.py --verify` 报 3 个 skill / 6 个文件「不同」
- [x] **逐字节验证差异仅行尾**（归一化后 6/6 完全相同，无内容差异）
- [x] 问用户 → 批准 `--apply` 按 LF 重写目标
- [x] `--apply` 写入 6 个文件（备份 `.backups/skills/20260926-014648`）
- [x] 复核：skill 分发 **11/11 逐字节一致**（真 LF↔LF）

**证据**：`校验：11 个 skill，11 个与真源逐字节一致，0 个需处理`

## 阶段 5 — 终态自检 ✅

| 检查 | 结果 |
| --- | --- |
| 规则块漂移 | **14/14 零漂移**（未越界） |
| skill 分发 | **11/11 逐字节一致** |
| 上游收录字节一致 | **4/4** |
| 规则同步器回归 | ✅ 全部通过 |
| skill 沙箱回归 | ✅ 全部通过 |
| E-7 工具沙箱回归 | ✅ 全部通过（新增） |
| 仓内 `w/crlf` | **0** |

## 阶段 6 — 记账与提交 ✅

- [x] `CHANGELOG.md` 新节（含 N-15 的成因/风险/修法）
- [x] `docs/skills.md` §8.1 重写（把「本机 ✅ 一致」修正为**「曾经是假绿」**+ 成因 + 处置）
- [x] `docs/environment-defects.md`：遗留项 **6** 结案 + **新增 N-15 并即时修复**
- [x] 回填本文件与 `prd.md` 的 AC 勾选（实时）
- [x] 显式 pathspec 提交（7 文件，暂存区集合已校验）→ 推送 `origin`：**`2977946`**（`6de1201..2977946`）

**证据**：`7 files changed, 363 insertions(+), 16 deletions(-)`；`main...origin/main` 已同步

## 阶段 7 — 终态自检 ✅

- [x] 提交后再跑全部回归：规则 ✅ / skill ✅ / E-7 ✅ **三套全绿**
- [x] 三条契约：规则块 **14/14**、skill 分发 **11/11 逐字节**、上游收录 **4/4 字节**
- [x] `git ls-files --eol`：仓内 **`w/crlf` = 0**
- [x] 提交后工作区**干净**（跑完回归也不再有假 M —— N-15 已修）
- [ ] `task.py finish` → `task.py archive`（待用户确认）
