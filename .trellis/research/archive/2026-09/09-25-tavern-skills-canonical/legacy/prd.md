# 酒馆 skill 正本化与补轨分发

> 独立任务（父任务 `09-25-tavern-project-bootstrap` 已归档，本任务不在其树下）
> **前置**：`09-25-trellis-tavern-template`（子任务 C）已完成并推送——本任务复用其市场布局结论，
> 但**不依赖**其产物，只依赖 `tavern-harness` 真源仓状态稳定（`--verify` 零漂移）。

## Goal

把「酒馆开发 skill」从**本机全局散装**升级为**真源仓纳管 + 补轨分发**，并补齐三处能力缺口：

1. **正本入库**：`tavern-harness/skills/` 成为 skill 唯一真源（L0-7 真源仓纪律），可版本化、可校验、可跨机器复现。
2. **补缺口**：新增 `TauriTavern` 宿主 skill 与「酒馆助手开发」skill（当前**均无**）。
3. **清版权面**：仓内 7 篇无许可素材移入不跟踪目录，知识内化进自撰正文，README 标注来源声明。

---

## Background

### 现状（2026-09-25 实测）

| 事实 | 证据 |
| --- | --- |
| 本机 5 个 tavern-* skill 位于 `~/.agents/skills/`，已提交并推送 `jiozhaoyue/agents.git`（`origin/master` = `e7a099b`，0/0） | `git rev-list --left-right --count origin/master...HEAD` |
| `~/.claude/skills/<name>` 是指向 `~/.agents/skills/<name>` 的**符号链接**（既有约定） | `ls -la ~/.claude/skills/` |
| `~/.agents` 长期带 **400 项未提交改动**（skills_disabled 迁移未收口） | `git status --porcelain \| wc -l` |
| **ST / TT / PT 无专属 skill**；`tavern-host-compat` 是「Authority 插件视角」的静态验证矩阵，非「各宿主如何写扩展」 | 读 `tavern-host-compat/SKILL.md` |
| **酒馆助手开发无 skill**；`tavern-harness/skills/` 那 7 篇是**散文教程不是 skill**（无 frontmatter，含 `{{ prolog }}` / `{doc}` Sphinx 占位符） | 读 `skills/00-*.md` 全文 |
| 上游 `StageDog/tavern_helper_template/.agents/skills/` **已有 4 个现成 skill** | GH API：`mvu-character-card` 14.7KB、`mvu-variable-framework` 9.9KB、`tavern-helper-frontend` 2.9KB、`tavern-helper-script` 4.1KB |
| 本地 `tavern_helper_template` clone 停在 **2026-06-07**，用 `.agent`（单数）+ `.codex`，**不含**这 4 个 skill | `ls` + `git log`；upstream HEAD = `f447e54` |
| 上游 `Darkatse/TauriTavern` 有 `ExtensionDEV.md` + `docs/{API,Agent,FrontendHostContract,FrontendGuide}.md` | GH API |
| **Trellis 0.6.16 的市场不支持 skill 类型** | `dist/utils/template-fetcher.js:840`：`// Only support spec type in MVP` + `Template type "X" is not supported yet (only "spec" is supported)` |

### 同源重复问题（本任务最关键的约束）

上游 `tavern-helper-frontend` 与本仓群规则块 **L1-JSR-2/3/4 逐条同源**；
`tavern-helper-script` 与 **L1-JSR-4 同源**；7 篇散文与上游 `mvu-*` 两个 skill 同主题同内容
（`skills/07-手写变量结构.md` 的 schema.ts / registerMvuSchema / zod 与 `mvu-variable-framework/SKILL.md` 重合）。

**用户裁定（2026-09-25）**：上游 4 个**原样收，一字不改**（保住日后对上游 diff 回灌的能力），
只在**头部加「来源与边界」节**——写明上游仓 + commit + 「与本仓群规则块重叠处，以规则块 `AGENTS.md` 为准」。
**不裁段**（裁了就丢回灌能力）；**不复制**（自撰 skill 里不得重述这些内容）。

### 7 篇素材的定性

7 篇出自 `StageDog/stagedog.github.io`（**该仓无 LICENSE 文件**）。逐字节核对：
`skills/00-手写mvu变量卡.md` 与上游 `络络/教程/手写mvu变量卡/index.md` **同为 3088 字节、逐字节一致**。

**用户裁定（2026-09-25）**：按无版权内容**直接内化**——知识归并进 skill 体系（上游 4 个已是同主题的 skill 化版本，
故「内化」= 归并进那 4 个的体系 + 必要时在自撰 skill 里以**自己的话**重述），
原件移入**不跟踪文件夹**（`skills-src/`），并在 README 标注来源声明。

---

## Requirements

### R1 · skill 正本入库（`tavern-harness/skills/`）

- R1.1 布局：每个 skill 一个目录，含 `SKILL.md`（YAML frontmatter：`name` / `description`）+ 可选 `references/*.md` + `agents/openai.yaml`（沿用既有三件套约定）。
- R1.2 迁入 5 个既有 `tavern-*`（`tavern-dev-workflow` / `tavern-host-compat` / `tavern-luker-plugin-dev` / `tavern-authority-integration` / `tavern-browser-automation`），
  迁入须**逐字节等同**后再由分发器接管，防"抄错覆盖掉能用的 skill"。
- R1.3 上游 4 个收进 `skills/upstream/<原名>/SKILL.md`（**原名不改**，保 diff 可回灌），
  头部加「来源与边界」节（上游仓 + commit + 边界声明）。**正文一字不改**。
- R1.4 目录名即 skill 名，全局唯一（分发时按 basename 落 `~/.agents/skills/<name>/`）。

### R2 · 新增 `tavern-ttavern-dev`（TauriTavern 扩展开发）

- R2.1 素材：上游 `ExtensionDEV.md` + `docs/FrontendHostContract.md` + `docs/API/`。**必须先取全文再写**，不得凭印象。
- R2.2 内容按**实测可查**标准：TT 专属 API 面（`findLastMessage()` / `searchMessages()` / `store.*` / `metadata.*`）、
  窗口化 payload 语义（`getContext().chat` 只反映窗口内消息）、扩展目录规则（local 优先于 global）。
- R2.3 须与 `tavern-host-compat` 分工明确：本 skill 管「TT 上怎么写扩展」，host-compat 管「跨宿主兼容判定」。
- R2.4 须声明**已知边界**：TT 无服务端插件机制（`tavern-host-compat` 的矩阵结论），
  故本 skill 只覆盖**纯前端扩展**形态。

### R3 · 新增 `tavern-helper-dev`（酒馆助手开发）

- R3.1 定位＝**路由/编排层**，与 `tavern-dev-workflow` 同性质：不复制正文，只指向。
- R3.2 指向对象：本仓群 `rules/groups/js-slash-runner.md` 的 **L1-JSR-1…20**（写条目号，不抄正文）+
  上游 4 个 skill 名（`tavern-helper-frontend` / `tavern-helper-script` / `mvu-*`）+ 上游文档 URL。
- R3.3 须含**判型流程**：给一个 `src/xxx` 目录，按「有 `index.ts`+`index.html` → 前端界面；仅有 `index.ts` → 脚本」判型并路由。
- R3.4 不得重述 `tavern-helper-frontend` / `tavern-helper-script` 的正文（同源重复）。

### R4 · 补强 `tavern-host-compat`

- R4.1 **消歧**：现有矩阵的 `PT/TT ❌ 不可用` **只指 Authority 服务端插件**，不指宿主本身；
  须在矩阵处显式标注，避免被读成「PT/TT 不能开发」。
- R4.2 补一节「扩展到四宿主的形态映射」：ST/Luker = 服务端插件 + 前端扩展；TT = 纯前端扩展（+ TT 专属 API）；PT = ？（**须实测，无据则写「未穷尽检索」**）。
- R4.3 不重复 `tavern-ttavern-dev` 的 TT 细节，只指向。

### R5 · 补轨分发器 `scripts/sync_tavern_skills.py`

- R5.1 契约**沿用** `sync_tavern_rules.py`：默认 `--dry-run`、写盘须显式 `--apply`、
  内容哈希幂等、`--verify` 零漂移、`--list`、备份**落仓外**（`.backups/`，`.gitignore` 已含）、
  入口加 `use_utf8_stdio()`（GBK 崩栈教训）。
- R5.2 目标：`~/.agents/skills/<name>/`（`--dest` / `TAVERN_SKILLS_DEST` 可覆盖）；
  并在 `~/.claude/skills/<name>` 维护**符号链接**（沿用既有约定）。
- R5.3 **不得沿用「工作区脏则拒绝写盘」**：`~/.agents` 长期带 400 项未提交改动，该门禁会恒真。
  改为：逐文件比对 + 只覆盖有差异的文件 + 写盘前备份到仓外 + `--verify` 可验。
  这条差异须在脚本 docstring 与本文件写明**为什么不一样**。
- R5.4 幂等判定只对 skill 正文计算哈希（不含生成时间戳），保证连续两次运行第二次全跳过。
- R5.5 回归测试 `scripts/test_sync_tavern_skills.py`：沙箱内断言幂等、块外零改动、`--verify` 检出人工篡改、备份落点、目标不存在时的行为。**不得触碰真实 `~/.agents`**。

### R6 · 素材处置与来源声明

- R6.1 新建 `skills-src/`（**不跟踪**，`.gitignore` 加一行），把现有 7 个 md **移动**（非删除）进去。
- R6.2 上游快照（`ExtensionDEV.md` 等 TT 素材、上游 4 个 skill 的原件）也放 `skills-src/upstream/`，供日后 diff。
- R6.3 `README.md` 加「来源声明」节：逐项列出来源仓 + 许可状态 + 本仓如何处置。**不得省略许可状态一列。**
- R6.4 `docs/skills.md`（新建）：skill 布局、命名、分发契约、与规则块/spec 的边界（对标 `docs/marketplace.md` 的写法）。
- R6.5 `docs/marketplace.md` 加一节：Trellis 0.6.16 市场**不支持 skill 类型**（附 `template-fetcher.js:840` 原文），故 skill 只能走补轨。
- R6.6 `CHANGELOG.md` 加节。

### R7 · 账本与推送

- R7.1 本任务的 `prd.md` / `design.md` / `implement.md` 随执行**实时勾选**（不得事后批量补勾）。
- R7.2 `tavern-harness` 提交推送 `origin`（L0-7）；`~/.agents` 也提交推送（skill 分发目标的版本化）。
- R7.3 **不得**因本任务改动 `rules/`（规则正文零改动 → `--verify` 须仍 14/14 零漂移）。
- R7.4 零 `upstream` 推送；`Instance/Real/**` 零操作。

---

## Acceptance Criteria

- [x] **AC-1**：`tavern-harness/skills/` 含 **11 个** skill 目录（5 迁入 + 1 TT + 1 helper + 4 上游），
      每个都有 `SKILL.md` 且 frontmatter 的 `name` 与目录名一致；`--list` 可枚举。
      → `--list` 输出 11 行、标注「自有 / 上游收录」；分发器对同名**报错中止**（不变式写进 docs/skills.md §2）。
- [x] **AC-2**：5 个迁入 skill 与 `~/.agents/skills/` 原件**逐字节一致**（迁移无损，有 diff 证据）。
      → 5 组 `diff -r` 全部 exit 0（"✓ 逐字节一致"），共 15 文件。
- [x] **AC-3**：上游 4 个**正文一字未改**（与上游逐字节 diff，差异**只在头部新增的「来源与边界」节**），
      且该节含上游仓名、commit 号、边界声明三要素。
      → 工作区：`删除/修改=0 新增=10`（×4）；仓库级（`git show :path` vs 上游原件）：上游内容新增=0、差异=10 行；索引 CRLF=0。
      → 收录工具 `--verify` 能检出并复原手改（已实测注入/复原）。
- [x] **AC-4**：`tavern-ttavern-dev` 存在，含 TT 专属 API 面与窗口化语义，且每条有上游文档出处；
      显式声明「只覆盖纯前端扩展形态」。
      → **订正了一处上游自相矛盾**：`ExtensionDEV.md` 的「窗口化聊天」§ 与权威文档
      `docs/CurrentState/ChatPayload.md`（不再提供 `chat_history_mode`、无前端 window state）
      及 `docs/API/Chat.md`（`windowInfo().mode` 恒 `'off'`）冲突 → 以订正形式写明。
- [x] **AC-5**：`tavern-helper-dev` 存在，只指向不复制。
      → **判据升级**：原「grep 零命中」太糙（点名 API 是事实、不是抄散文）。改用**最长公共子串**
      （剔除代码块、行内代码、URL、标点后比对）：与上游 4 个 skill 的 LCS = `PolyFormNoncommercial100`
      ——即**许可名本身**，**零散文复制**。
- [x] **AC-6**：`tavern-host-compat` 已消歧（PT/TT 的 ❌ 明确限定为"服务端插件不可用"），
      并有「扩展到四宿主的形态映射」节；不重复 TT 细节。
      → 矩阵改名为「**Authority 服务端插件视角**」+ 加读法约定；新增形态映射表（PT 一行标注**未穷尽检索**）；
      `references/host-matrix.md` 同步加读法约定。TT 细节只一句指向 [[tavern-ttavern-dev]]。
- [x] **AC-7**：`tavern-dev-workflow` 路由表已加入新 skill（`tavern-ttavern-dev` / `tavern-helper-dev` 及上游 4 个）。
      → 路由表 + 新增「skill 全景」表 + frontmatter description + `agents/openai.yaml` + `playbook §1.1` 四处同步。
- [x] **AC-8**：`python scripts/test_sync_tavern_skills.py` 全绿（exit=0），**不带** `PYTHONIOENCODING` 也全绿。
      → **37 项断言全绿**（测试内主动 `env.pop("PYTHONIOENCODING")`）；含 Windows junction 专项回归。
- [x] **AC-9**：`sync_tavern_skills.py --dry-run` 列出完整待写清单；**用户批准后**才 `--apply`；
      收尾 `--verify` 为零漂移（PARDON 门）。
      → 清单（10 新建 / 10 更新 / 6 新链接）已列出并获批准；另核查目标侧无未提交本地改动；
      `--apply` 后 `--verify` = `11 个与真源逐字节一致，0 个需处理`；备份 `.backups/skills/20260926-001634`。
- [x] **AC-10**：分发后 `~/.agents/skills/` 含全部 11 个；`~/.claude/skills/` 对应链接可解析。
      → 两侧各 11 个；**本机链接是目录 junction 而非 symlink**（新发现，已修）→ 创建用 `mklink /J`；
      新 skill 已当轮在会话内可用（可用 skill 列表出现 6 个新条目）。
- [x] **AC-11**：`skills-src/` 存在且被 git 忽略（`git check-ignore` 以**目录形式**验证，尾斜杠）；
      仓内无 7 篇的逐字副本残留。
      → `git check-ignore -v skills-src/` → `.gitignore:20`；7 篇移动后 sha256 逐一未变；
      `git status` 不含 `skills-src`；提交内 35 文件无那 7 个名字。
- [x] **AC-12**：README 有「来源声明」节，逐项含来源 + 许可状态 + 处置；`docs/skills.md`、`docs/marketplace.md` §11、CHANGELOG 均已更新。
      → 另加 `.gitattributes`（锁 LF，防 `autocrlf` 破坏字节级比对契约）；`docs/skills.md §8` 记跨机器限制。
- [~] **AC-13**：规则正文**零改动**（本任务成立），但 `--verify` 实测为 **13/14**——
      唯一漂移项 `ST-chatfilesys-rebuild/AGENTS.md` **由并发会话手改规则块正文造成**
      （该文件 mtime `2026-09-25 23:38:56`；本会话 `git status` 全在 `tavern-harness`，**未写任何目标仓**）。
      → 已登记 **N-13**；用户裁定**本轮零操作、先存证**。**未对该仓 `--apply`**（否则会抹掉用户手写的例外）。
- [x] **AC-14**：`tavern-harness` 与 `~/.agents` 均已提交推送 `origin`；零 `upstream` 推送；`Instance/Real/**` 零操作。
      → `bc4a34d`（35 文件）推送 `bfd5f10..bc4a34d`；`fdd23f1`（20 文件）推送 `e7a099b..fdd23f1`；
      两仓推送前均 `git remote -v` 审计；`~/.agents` **只 add 本批 20 文件**，其 400 项未提交改动未被牵连。

---

## Out of Scope

- **父任务遗留项 2**（L0-8 口径矛盾 → 15 仓重同步）：用户 2026-09-25 裁定**另开任务**（要改 `rules/` + 版本提升 + 大范围写盘）。
- **父任务遗留项 1**（跨机器复现）：需第二台机器，不做。
- **把 skill 纳入 Trellis 市场**：Trellis 0.6.16 原生不支持（`template-fetcher.js:840`），非本任务能解决。
- **把 tavern 模板装机到 9 个既有仓**：另一条独立工作流（PARDON 大范围写盘），另开任务。
- 修改 `rules/` 任何正文（本任务零改动，AC-13 钉住）。
- 修改 Trellis 上游源码或 `node_modules`。
- 7 篇素材的**逐字入库**。
