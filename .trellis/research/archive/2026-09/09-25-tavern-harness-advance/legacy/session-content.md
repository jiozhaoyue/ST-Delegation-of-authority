# 子任务 B 会话详录（2026-09-25）

## 一、任务范围与首轮成果

真源仓 `tavern-harness` 补两条新规则 + 修唯一漂移项 + 全仓重同步。

- 真源提交 **`e844586`**（v1.2.0）新增 **L0-17「Trellis 工程纪律（交付物落点 · 市场源）」**：
  ①**交付物落点与范围门**——规范条文落 `.trellis/spec/`、spec 页须自包含不得引用任务目录、
  范围门用 `git status --short`（**不得**用 `git diff --stat`：被忽略目录根本不出现在 diff 里）；
  ②**市场源须 SSH 形式**——`gh:` 前缀走 `raw.githubusercontent.com`，私有仓返回 404 且不自动回退 git。
- 同提交修正记账错误：`ST-shujuku-rebuild` 的 `path` 记在 `My-repo/`，实为 `Myfork/`。
  原先 `--verify` 报的"[缺失文件]"是**路径错**，不是文件缺失（其 `AGENTS.md` 完好）。
- R3 全仓重同步走 **PARDON 门**：dry-run 清单（14 文件 / 12 仓，全 `[更新]`）先报用户批准后才 `--apply`。
  6 仓工作区不干净，逐个核实其脏文件均非目标规则文件。
- 首轮推送：12 仓中 9 仓成功、2 仓按其 `.gitignore` 有意不提交（`ST-chatfilesys-rebuild` /
  `ST-git-improve` 的 `AGENTS.md` 属有意忽略 → 规则块仅本地生效）、1 仓推送被拒。
- `--verify` 收尾 **14/14 零漂移**。

## 二、续会话处置（三项，均经用户裁定）

用户 2026-09-25 裁定：① `rebase --autostash` ② 删除 + 根治备份落点 ③ 修 GBK 假失败 ④ 收口后立即开子任务 C。

### 1. `ST-msg-btn-mgr` 推送被拒 → 已推送

- 处境：本地规则块提交 `93e1299` 待推；`origin/main` 多出 `79b1a43 [bot] Bump deps`
  （改 `package.json` 的 devDependencies + `pnpm-lock.yaml`）；该仓工作区另有**用户自身在途工作**
  （`package.json` 的 scripts 段、`.github/workflows/bundle.yaml`、`.gitignore`、未跟踪的 `release-script-json.yaml`）。
- 处置：`git pull --rebase --autostash origin main` → 自动 pop 无冲突 → `git push origin main`。
  **未用 reset/force**（遵 L0-7）；推送前 `git remote -v` 确认 `origin` = `jiozhaoyue/ST-msg-btn-mgr`（无 P-12 风险）。
- 结果：`79b1a43..54f0802 main -> main`，分支回到 `[origin/main]` 同步态。
- **WIP 完整性复核**（逐文件 md5）：`bundle.yaml` / `.gitignore` / `release-script-json.yaml` **指纹不变**；
  `package.json` 指纹变化系 bot 的 devDependencies 改版一并入所致（**预期**），相对新 HEAD 的 diff
  **只剩用户自己的 scripts 段**（`lint` / `lint:fix` / `dump` / `sync`），未提交状态保持。

### 2. GBK 假失败 → 已修（并扩到同步器同源问题）

- 复现取证：`python -c "print(sys.stdout.encoding)"` → **gbk**；不带 `PYTHONIOENCODING=utf-8` 直接跑沙箱测试，
  在**第一条断言**处抛 `UnicodeEncodeError: 'gbk' codec can't encode character '✗'`、**exit=1**。
  即：比"看起来像失败"更严重——**测试根本没跑完**。
- 不可编码符号实测（cp936/gbk 全部 FAIL）：`✓`(U+2713) `✗`(U+2717) `⚠`(U+26A0) `⚠️` 变体选择符(U+FE0F)
  `✅`(U+2705) `❌`(U+274C)。
- 处置：两脚本入口加 `use_utf8_stdio()`（stdout/stderr `reconfigure(encoding="utf-8", errors="replace")`）。
  **同步器同源问题一并修**（属 B 声明范围外，已如实标注）：`⚠️` 走「工作区不干净」「marker 不成对」
  「存在前作块」三条**告警路径**，恰在最需要这条消息时崩栈。
- 验证：不带 `PYTHONIOENCODING` 直接跑 → `✅ 全部通过`、exit=0。

### 3. `*.bak` 复发根因 → 已根治（本次取证新发现）

- 根因：同步器 `shutil.copy2(path, str(path) + ".bak")` 把备份留在**目标仓内**；而门禁
  `is_dirty()` 用 `git status --porcelain`（**含未跟踪项**）判定 → **同步器自己的产物让每个目标仓恒为"脏"**，
  「工作区不干净时拒绝写盘」失效、`--allow-dirty` 沦为常态。9-24 已手工清过 11 个 → 本次又残留
  **14 个跨 12 仓**，属复发。
- 处置：备份改落真源仓 **`.backups/<仓名>/<文件名>.<时间戳>.bak`**（在各目标仓**之外**），
  落点可用 `TAVERN_RULES_BACKUP_DIR` 覆盖（测试即用它指向沙箱）；`.backups/` 入 `.gitignore`。
- 删除取证（用户批准后删 14 个）：12 个的旧内容在各仓自身 git 历史内；2 个被 `.gitignore` 有意忽略的
  （`ST-chatfilesys-rebuild` / `ST-git-improve`）块外**无任何独有手写内容**（块前 22 行是 Trellis 模板块、
  块后 0 行），旧块可由真源仓历史重建。
- 验证：删后 12 个目标仓对规则块**零残留**，其中 9 仓 `git status --porcelain` 为空
  （余 3 个 JSSR 仓的脏项是用户自身在途工作，与规则块无关）；`--dry-run` 幂等仍为 `跳过=14`、未写盘。
- 真源仓提交 **`806f6cb`** 已推送（`e844586..806f6cb`），含同步器/测试/README/CHANGELOG/.gitignore 五文件。

## 三、验收与范围门

- B 的 **AC-B1 ~ AC-B9** 全部勾选（AC-B9 为续会话追加，记录上述三项处置）。
- 范围门（**L0-17 口径**）：本仓 `git status --short` **为空** → Authority 产品代码零改动。
- **spec 无新增**（Phase 3.3 的结论）：L0-17 已在规则块内且本项目 `AGENTS.md`/`CLAUDE.md` 随 `9f2be80`
  落 v1.2.0；本项目 spec 页既有的引用样式是「统一规则块 L0-x / P-x」，新增一份即与真源仓重复，
  违真源 P1（唯一真源、单向分发）。

## 四、遗留与交接

- **归档时的 branch 校验**：`task.py archive` 因 `branch` 与 `base_branch` 同为 `main` 而拒绝，
  需 `--skip-branch-validation`（本仓群任务多在 `main` 上直接落地、非 PR 流）。
  属**跨仓通用**的 Trellis 用法知识，尚未进真源规则——若要立条需改 `rules/` → 版本提升 → 全仓重同步，
  故留作候选，交由用户裁定（可并入子任务 C 或另开小任务）。
- **Trellis 的自动提交警告**：`.trellis/tasks/` 被 `.gitignore` 排除（提交 `4f0193e`「公开 fork 防泄露」，
  即 L0-17 的事实来源），故 `task.py archive` / `add_session.py` 的 auto-commit 会被跳过并告警。
  这是**有意设计**（任务目录不入版本库），非缺陷；如需消警可在 `.trellis/config.yaml` 设
  `session_auto_commit: false`。
- **`remove_legacy_rules_block.py`**（前作块清理脚本，已用完的遗留工具）仍在其 `shutil.copy2(p, p + ".bak")`
  处把备份写在目标仓内，且打印 `✓` 会触发同类 GBK 崩栈。本轮**未改**（冻结的遗留工具、无现役用途），
  留作已知项。
- 子任务 C 前置已满足（真源稳定 + 零漂移），下一步开 **C：Trellis tavern 模板与云同步**。
