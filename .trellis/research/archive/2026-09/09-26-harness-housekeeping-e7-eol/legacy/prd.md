# 真源仓内务收口：E-7 工具处置 + `rules` 行尾锁补齐

## Goal

清掉 v1.4.0 任务里**明确列入「未做 / 仍开」的两项真源仓内务**：

1. **冻结工具 `scripts/remove_legacy_rules_block.py`（E-7）的两个缺陷**——修复或退役（按用户裁定）。
2. **补齐 `.gitattributes` 对 `rules/**` 的 `eol=lf` 锁**，并用 `git ls-files --eol` 取证到位。

**边界**：不改任何规则正文 → **不触发规则重同步**（`rules/` 内容不变，块哈希不变）。

## 起点取证（2026-09-26，实测）

### 一、E-7 工具的两个缺陷（both 在册：登记册遗留项 6）

| # | 缺陷 | 行 | 实际后果 |
| --- | --- | --- | --- |
| D1 | `shutil.copy2(p, str(p) + ".bak")` —— **备份写进目标仓** | `scripts/remove_legacy_rules_block.py` 第 110 行（真源仓内） | 每个被清理的仓都会多出一个 `*.bak` → **弄脏目标仓工作区**，并把后续同步器的「脏工作区门禁」顶开。**这正是当年 14 个残留 `*.bak` 跨 12 仓的成因**（`sync_tavern_rules.py` 的注释里记着这条教训） |
| D2 | `print(f"✓ 已清理 …")` 含 `✓`（U+2713） | 第 114 行（同类：第 87/92/95/96/97/99/101/105 行的 `⚠️`） | 在 Windows **cp936（GBK）控制台**上抛 `UnicodeEncodeError` → **崩栈**。同类假失败在同步器上已修（加 UTF-8 stdio 护栏），本工具未修 |

**现役用途 = 无**：N-7 实测残留 **0**（`--dry-run` 报「0 个文件」）。工具自 2026-09-21 起未再改动。

### 二、行尾锁的真实缺口（`git ls-files --eol` 实测）

全仓 50 个受跟踪文件：**40 个 `i/lf w/lf`、10 个 `i/lf w/crlf`**（**无一例 `i/crlf`** → 仓库内本就是 LF，加锁不产生内容变更）。

10 个 `w/crlf` 里：

- **7 个已经声明了 `attr/text eol=lf`，但工作区仍是 CRLF**（`skills/**` 6 个 + `docs/environment-defects.md`）——
  说明**声明不会回头改写已检出的工作区文件**，要等下一次 checkout 才生效。
- **2 个连声明都没有**：`rules/L0-global.md`、`targets.json`。
- 1 个：`scripts/test_sync_tavern_skills.py`（已声明，同上）。

> ⚠️ **由此得出一条对既有结论的修正**：上一轮（v1.4.0）我写「`rules/**` 未纳入行尾锁」是对的，
> 但**「已锁的路径就没问题」是错的**——7 个已锁文件的工作区仍是 CRLF。
> 这不破坏契约（仓库内是 LF，跨机器 checkout 一致），但**本机的字节级比对测试实际跑的是 CRLF↔CRLF**，
> 没有覆盖真正的 LF 路径。

## Requirements

### R1 — E-7 工具处置（**按用户裁定**，二选一）

- **R1.a 修复**（保留工具）：
  - D1 → 备份改落**仓外**（沿用同类做法：真源仓的 `.backups/<仓名>/<文件名>.<时间戳>.bak`，
    与 `sync_tavern_rules.py` / `sync_tavern_skills.py` 一致），**不再往目标仓写 `.bak`**；
  - D2 → 加 UTF-8 stdio 护栏（与 `sync_tavern_rules.py` 的 `use_utf8_stdio()` 同法），消除 GBK 崩栈；
  - 补一个沙箱回归（T 项）覆盖「备份落仓外」与「无 `UnicodeEncodeError`」。
- **R1.b 退役**（删除工具）：
  - 删除 `scripts/remove_legacy_rules_block.py`；
  - 在 `CHANGELOG.md` 与登记册记录**退役理由**（N-7 残留 0 + 前作系统已消失 + 工具带两个已知缺陷）；
  - 保留其历史在 git log 中可查（不写"墓碑"文件）。
- **PARDON**：R1.b 涉**删除文件**，须先出清单获批准；R1.a 改脚本正文亦须先出 diff 清单。

### R2 — `rules/**` 行尾锁补齐

- `.gitattributes` 新增 `rules/** text eol=lf`（追加在既有三条之后，同体例附一行理由注释）。
- **验收用 `git ls-files --eol` 取证**，不用"看起来对"。
- 预期：`rules/*.md` 的 `attr/` 列出现 `text eol=lf`；**索引侧零内容变更**（`git status` 提交前为空）。

### R3 — 工作区陈旧行尾的处置（**按用户裁定**）

7 个「已声明 eol=lf 但工作区仍 CRLF」的文件是否**就地刷新**为 LF（`git checkout-index -f -- <paths>`）？
- **刷新**：本机字节级比对开始真正覆盖 LF 路径；代价是 7 个文件的**工作区**字节变化（**索引不变、无内容变更**）。
- **不刷新**：契约不受影响，留待日后自然 checkout 生效。

### R4 — 记账

- `CHANGELOG.md`：新增一节（本任务改动 + 取证）。
- `docs/environment-defects.md`：遗留项 **6** 结案（修复或退役）；补记「已锁路径工作区仍 CRLF」这条修正。

### R5 — 纪律边界

- **不改 `rules/` 任何正文** → `--verify` 必须仍为 **14/14 零漂移**（这是本任务"未越界"的判据）。
- 提交只用**显式 pathspec** + 暂存区集合断言（L0-7 新条目）；推 `origin`，**零 `upstream`**。
- `Instance/**` 零操作。

## Acceptance Criteria（实施后回填，2026-09-26）

- [x] **AC-1** E-7 工具按裁定**修复保留**，两个缺陷都不再存在：
      - 源码内**不再有** `str(p) + ".bak"`；备份落 `<真源仓>/.backups/<仓名>/<文件名>.<时间戳>.bak`。
      - `PYTHONIOENCODING=cp936` 下实测 **exit=0 且无 `UnicodeEncodeError` / `Traceback`**（回归 T4）。
      - 回归实测：目标仓内 `*.bak` = **0**，仓外备份 4 个且内容 = 清理前原始字节（回归 T3）。
- [x] **AC-2** `.gitattributes` 含 `rules/** text eol=lf`（与 `targets.json text eol=lf`）；
      `git ls-files --eol -- rules targets.json` 的 `attr/` 列**全部**为 `text eol=lf`。
- [x] **AC-3** 加锁**零内容变更**：`git status --short -- rules/ targets.json` 为空。
- [x] **AC-4** 规则块 `--verify` = **14 个目标 / 14 个与真源一致 / 0 个需处理**（未越界）。
- [x] **AC-5** 按裁定刷新 → `git ls-files --eol` 中 `w/crlf` **归零**；`git status` 仍干净
      （每个文件刷新前均断言「归一化后 == 索引 blob」，零内容丢失）。
- [x] **AC-6** `CHANGELOG.md` 新节 + `docs/environment-defects.md` 遗留项 6 结案 +
      `docs/skills.md` §8.1 的「假绿」修正。
- [x] **AC-7** 真源仓提交推送 `origin`；零 `upstream`；`Instance/**` 零操作（本任务未触及任何实例路径）。
- [x] **AC-8** 新增沙箱回归 `scripts/test_remove_legacy_rules_block.py` **全绿**（8 组 / 21 项断言，不触碰真实仓库）。

### 追加项（实施中发现，同经用户批准）

- [x] **AC-9** 刷新后暴露的 skill 目标副本行尾问题：逐字节确认**差异仅行尾** → `--apply` 按 LF 重写 6 个文件
      → skill 分发 `--verify` = **11/11 逐字节一致**（真 LF↔LF）。
- [x] **AC-10** 连带回归全绿：规则同步器 ✅ / skill 沙箱 ✅ / 上游收录字节一致 **4/4** ✅。

## 已裁定（2026-09-26，用户选定）

| # | 事项 | 裁定 |
| --- | --- | --- |
| 1 | E-7 工具：修复还是退役 | **修复并保留**（两缺陷都修 + 加沙箱回归；工具留备将来新纳入的老仓） |
| 2 | 7 个陈旧工作区行尾是否就地刷新 | **刷新为 LF**（并连带处理了刷新后暴露的 skill 目标副本问题） |
| 3 | `targets.json` 是否一并锁 `eol=lf` | **一并锁** |
| 4 | （实施中追加）skill 目标副本 6 个文件与真源行尾不一致 | **重写目标为 LF**（逐字节确认差异仅行尾后进行） |

## 实施中的额外发现（对既有结论的修正）

- **`git checkout-index -f` 实测不生效**：对「工作区 CRLF / 索引 LF」且已声明 `eol=lf` 的文件，
  它会**静默跳过**（mtime 与字节均不变）。可行做法是**先断言**「工作区内容按行尾归一化后与索引 blob
  完全相同」，再 `rm` + `git checkout --` 重写。此法已用于本次 10 个文件，逐个断言零内容丢失。
- **「本机 ✅ 一致」曾经是假绿**：真源与目标**两侧都是 CRLF** 时字节比对照样通过，
  「11/11 零漂移」比的是 CRLF，**LF 路径从没被跑过**。刷新真源后立刻暴露 `~/.agents` 侧 6 个目标副本是 CRLF。
- **E-7 回归首轮 4 项失败全是我测试自身写错**（比对基准用了错误的行尾形态、断言了脚本并未打印的小节标题、
  末尾块的期望与「保守语义」不符）→ 修测试，不改产品语义。

## 依据来源（检索先行，2026-09-26）

- **WebSearch 不可用**（本机代理对 search 摘要模型返回 `Thinking mode does not support this tool_choice`）→ 走**替代通道 GitHub API 检索**：`search/repositories` 多组查询无同题先例（返回为无关高星仓）→ 该领域**无现成轮子可复用**，按本仓既有模式（`.backups/<仓名>/…`）自办。
- **官方文档核对**：<https://git-scm.com/docs/gitattributes>（`text` / `eol` / `core.autocrlf` 的交互，
  `eol=lf` 原文 "uses the same line endings in the working directory as in the index when the file is checked out"；
  以及 `git add --renormalize` 的适用场景）——本任务的 R2/R3 直接依据此文档。
- **本机实测**：`git ls-files --eol`（40 `i/lf w/lf` / 10 `i/lf w/crlf`，零 `i/crlf`）。

## 非目标

- 不动 `rules/` 的任何正文（含不加、不删、不改条目）。
- 不动同步器 `sync_tavern_rules.py` / `sync_tavern_skills.py` / `vendor_upstream_skills.py`。
- 不动任何目标仓（本任务全在真源仓内）。
- 不为 `skills/**` 的设计打分或重排；只在 R3 范围内刷新其工作区行尾。
