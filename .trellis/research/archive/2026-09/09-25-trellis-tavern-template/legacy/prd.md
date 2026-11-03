# Trellis tavern 模板与云同步

> 父任务：`09-25-tavern-project-bootstrap` · 子任务 C
> **前置依赖**：子任务 B `09-25-tavern-harness-advance` 完成后才能开工——
> 模板托管在 `tavern-harness`，需其真源状态先稳定并推送（依赖写在本文，不靠树位置隐含）。

## Goal

用 **Trellis 原生机制**把「酒馆项目偏好 + 本地环境适配」固化成可分发模板，使：
① **新项目**一条命令套用；② **已初始化且改了很多的既有项目**能增量同步且**本地改动不丢**；③ 模板云同步。

---

## Background

### 原生机制清单

**完整表见父任务 `09-25-tavern-project-bootstrap/prd.md` § Background（N1–N8）。**
本文只重述结论，不复制表格（避免同源内容两处漂移）：

- `.trellis/workflow.md` → **可市场分发**（`trellis workflow -m <source> -t <id>`），默认先问，`-f` 覆盖、`-n` 写 `.new`。
- `.trellis/spec/**` → **可市场分发 + 增量同步**（`registry.spec.source` + `registry.spec.template` + `trellis update`），
  哈希跟踪、本地改动报 "Modified by you" 冲突、**不静默覆盖**。
- `.trellis/config.yaml`、平台目录、规则块 → **原生无市场通道**，需补轨。
- 私有仓作市场源**必须用 SSH 形式**（`gh:` 前缀走 raw HTTP，私有仓 404）。

### 对用户关键问题的直接回答

> **"这些 Trellis 是否提供原生办法去同步到已初始化并改了很多的项目？"**

**部分提供，且关键在于"部分"的边界：**

| 层 | 能增量同步进既有项目吗 | 机制与安全模型 |
| --- | --- | --- |
| `.trellis/workflow.md` | ✅ **能** | `trellis workflow -t -m`；若本地已改，**默认先问**，也可 `-n` 写 `.new` 旁路，`-f` 才覆盖 |
| `.trellis/spec/**` | ✅ **能，且这是原生最擅长的** | 设 `registry.spec.*` 后 `trellis update`；逐文件哈希比对，本地改过的报冲突，**不静默覆盖** |
| `.trellis/config.yaml` | ⚠️ **不能** | update 时模板侧是**内置默认**（`preserveExistingRegistryConfig()` 仅保留 registry 块）；本地改动走冲突提示可保，但**没有市场通道** |
| 平台目录（`.claude/` 等） | ⚠️ **不能** | 同上，模板侧是内置的 |
| 规则块（`AGENTS.md`） | ❌ Trellis 不感知 | 由 tavern-harness 自有同步器管理 |

**结论**：**"改了很多的既有项目"是安全的**——Trellis 的冲突流不会静默覆盖。
但**只有 workflow 与 spec 两层走原生市场通道**；其余三层必须由薄封装补齐。

### 先例

`SuooL/trellis-marketplace`（GitHub 检索所得）确认市场仓约定布局：
`index.json` + `specs/` + `workflows/` + `skills/`。

---

## Requirements

### R1 · 市场仓布局（落在 tavern-harness）

- R1.1 在 `tavern-harness` 增加市场所需文件，**按先例约定**：
  - `index.json`：`{version:1, templates:[…]}`，含 `type:"workflow"` 与 `type:"spec"` 各一条（N5/N6/N7）
  - `workflows/tavern/workflow.md`（**单文件**，path 必须以 `.md` 结尾——N6 的硬约束）
  - `specs/tavern/**`（目录树，`trellis update` 会收集其下的 `.trellis/spec` 结构——N7）
- R1.2 **不破坏现有同步器**：新增市场文件不得影响规则块内容哈希（`--verify` 须仍为零漂移）。
- R1.3 index.json 的条目须含 `id`/`type`/`name`/`path`，可选 `description`/`tags`（N5 的必填字段校验）。

### R2 · workflow 模板内容（`type:"workflow"`）

- R2.1 以 `native` 模板为基底，叠加酒馆定制。已知需定制项（本仓实证）：
  - **Windows 命令适配**：`python3` → `python`（本仓 `.trellis/workflow.md` 已人工改过，属可固化的偏好）
  - 端口段位纪律在场（L0-16）与实例隔离（L1-MF-15）的**指向性提示**——不在 workflow 里复制规则正文，只指出"见规则块"
- R2.2 定制项须**逐条有据**：每条改动写明"本仓实证出处"或"规则条目编号"，不得凭感觉加。
- R2.3 模板须与 `native` 保持可合并性（Trellis 的 `trellis update` 会按哈希处理 workflow.md）。

### R3 · spec 种子内容（`type:"spec"`）

- R3.1 **与规则块的分工必须明确，不得重复**（否则立刻制造两处同源内容 → 漂移）：
  - **规则块（`AGENTS.md`）**＝ 强制规则清单，短、跨平台、所有 agent 必读
  - **spec 种子**＝ 可执行的**工程约定**，按层组织，Trellis 在 Phase 2 按需注入
- R3.2 种子内容建议（实施时按证据确定）：酒馆插件**接入契约**（宿主 API 面差异、降级纪律）、
  **跨宿主可用性**判定表、**端口与实例**约定的可执行检查项、**前端离线化**约定（零 CDN / 单文件 / `file://`）。
- R3.3 每条须**可执行**（能写成断言或检查项的优先），不写泛泛最佳实践。
- R3.4 种子须**不引用任务目录路径**（F1 规则），自带证据锚点。

### R4 · 项目偏好与本地环境清单（用户明令："你做整理"）

- R4.1 产出**盘点表**：逐项列出「偏好 / 本地环境事实 → 应落层 → 该层有无原生市场通道」。
  已知候选（实施时逐项核实，不得照抄本列表）：

| 候选偏好/环境事实 | 应落层 | 原生市场通道 |
| --- | --- | --- |
| Windows `python` 命令适配 | `.trellis/workflow.md` | ✅ |
| 端口段位（8001–8004 实例段 / 8000 禁用 / 3000 保留 / 3010+ 周边） | 规则块 + spec 种子 | 部分（spec 传规范正文；执行值靠规则块） |
| 实例隔离与 E2E 白名单（Dev/Real 仅差 1 端口） | 规则块 + spec 种子 | 部分 |
| 子代理模型门禁 | 平台 agent 文件 | ❌ → 补轨 |
| journal/commit 行为（`.trellis` 部分 gitignore ⇒ `session_auto_commit: false`） | `.trellis/config.yaml` | ❌ → 补轨 |
| `registry.spec.*` 自身指向 tavern-harness | `.trellis/config.yaml` | ❌ → 补轨（自举） |
| 真源仓路径探测（`TAVERN_HARNESS`） | 环境变量 / 补轨脚本默认值 | ❌ → 补轨 |
| 规则块引入（`AGENTS.md`） | 规则块 | ❌ → 补轨（既有 `tavern-init.mjs`） |

- R4.2 该表是后续实现的**唯一输入清单**；表中每一项须落到"已实现 / 明确不做（附理由）"之一。

### R5 · 补轨：把原生覆盖不到的三层补齐

- R5.1 扩展 `tavern-harness/scripts/tavern-init.mjs`（既有薄封装），使其在 `trellis init` 之后额外完成：
  - 写 `.trellis/config.yaml` 的 tavern 偏好项（journal/commit 行为等）**与 `registry.spec` 自举块**
  - 应用平台 agent 的模型门禁
  - 调用既有 `sync_tavern_rules.py` 写规则块
- R5.2 **薄封装的设计原则沿用既有注释的立场**：不改 Trellis npm 包、不碰 `node_modules`，
  只写 Trellis 管不到的层（改 npm 包模板会在 update 时被冲掉——前作腐烂的翻版）。
- R5.3 补轨须**幂等**（可重复运行）、**有 `--dry-run`**、**写盘前 `.bak`**、**失败不阻断**（与既有同步器风格一致）。
- R5.4 补轨**不得自造模板下载逻辑**——模板下载交给 `trellis workflow` / `trellis update`（AC-P4）。

### R6 · 云同步与双路径验证

- R6.1 `tavern-harness` 推送 `origin`；市场源用 **SSH 形式**（`git@github.com:jiozhaoyue/tavern-harness`）。
- R6.2 **新项目路径验证**：全新目录 → `trellis init` → 套用 tavern 模板 → 产出可用 `.trellis/`，
  `trellis workflow --list` 可见 tavern 条目。
- R6.3 **既有项目路径验证**：在**已初始化且已大量修改**的项目上跑增量同步，确认
  **本地改动不丢失**（报冲突而非静默覆盖）且新增了 tavern spec 层。
- R6.4 验证必须**留证**（命令 + 输出），且验证用的临时目录用完清理。
- R6.5 ssh 源依赖本机 GitHub SSH key——须在 README 写明该前置条件与替代方案。

---

## Acceptance Criteria（执行后勾选，证据见 `implement.md` 与 `session-content.md`）

- [x] **AC-C1**：`tavern-harness` 含 `index.json` + workflow 模板 + spec 种子；`--verify` 仍零漂移。
      → 提交 `df8ac8e`；布局为 `index.json` + `workflows/tavern/workflow.md` + `specs/tavern/tavern/*.md`
      （先例约定的 `specs/` 形态；`workflows/` 单文件）；`--verify` = `14 个目标，14 个与真源一致，0 个需处理`。
- [x] **AC-C2**：`trellis workflow -m git@github.com:jiozhaoyue/tavern-harness --list` 能列出 tavern 条目。
      → 实测列出 `tavern (marketplace) — Tavern workflow (SillyTavern repo group)`；反向验证 `gh:` 形式
      报 `⚠ No marketplace index.json found at the configured source`（私有仓 404 复现，证明必须用 SSH 形式）。
- [x] **AC-C3**：workflow 模板的每条定制都有据，无凭感觉改动。
      → 最终形态 = 原生模板**逐字节原样** + 末尾**纯追加 24 行**（原生侧删除/修改行 = **0**）。
      追加节内容逐条为规则条目号指向（L0-16 / L1-MF-15 / L0-9 / L0-10 / L0-11 / L0-12）或实测事实
      （Windows 渲染行为）；**删除了**原设计的 python 适配（对照实验证明 CLI 自己会渲染，模板自带反而有害）。
- [x] **AC-C4**：spec 种子与规则块无重复内容，且每条可执行、不引用任务目录路径。
      → 三页只含「判据（grep/断言）/ 允许 / 禁止 / 证据锚点 / 相关（规则条目号 + skill 名）」；
      零正文复制；无任务目录引用。边界表见 `docs/marketplace.md` §9。
- [x] **AC-C5**：R4.1 盘点表完成，每项落到"已实现 / 明确不做（附理由）"。
      → 已实现：workflow 模板（市场）、spec 种子（市场）、`registry.spec` 自举与 `session_auto_commit`
      （补轨）、规则块（既有同步器）、真源仓路径探测（`TAVERN_HARNESS` 环境变量 + `--harness`）。
      **明确不做**：平台 agent 模型门禁——用户 2026-09-25 裁定「全部默认」，由子任务 D 删除自写门禁。
- [x] **AC-C6**：补轨脚本幂等 + 有 `--dry-run` + 写盘前 `.bak`；重复运行第二次判定为跳过。
      → 第二次运行 `✓ 已是最新，无需改动` 且 `config.yaml` md5 不变；`.bak` 已生成；
      人工已写同键时**零覆盖**（文件 md5 不变、人工值仍在）；`--dry-run` 只打印将追加内容。
- [x] **AC-C7**：**R6.2 新项目路径**验证通过并留证。
      → 全新临时目录实跑 `trellis init -y -u … --workflow tavern --workflow-source <SSH> --registry <SSH> -t tavern-spec`：
      落盘 `python3` = 0 / `python` = 32、追加节在场、种子落 `.trellis/spec/tavern/` 三页且与源**逐字节一致**。
- [x] **AC-C8**：**R6.3 既有项目路径**验证通过并留证——重点证明**本地改动未丢失**。
      → 沙箱副本干跑分区：`New files (will add)` 三页种子 + `Modified by you (need your decision): ? .trellis/config.yaml`
      + `Deleted by you (preserved)`；`update -s` 后预置锚点仍在、本地 registry 块仍在、
      `config.yaml` **md5 完全不变**、种子增量加入且逐字节一致、`update` 自留 `.backup-<时间戳>/`；真实仓全程 0 项脏。
- [x] **AC-C9**：`tavern-harness` 已推送 `origin`；README 写明 SSH 前置条件。
      → 三次提交推送 `df8ac8e` → `c9f6210` → `bfd5f10`；README 新增「Trellis 市场模板」节 +
      `docs/marketplace.md` §4 写明 SSH key 前置条件与替代方案。
- [x] **AC-C10**：未触碰 Trellis 上游源码与 `node_modules`；未推 `upstream`；`Instance/Real/**` 零操作。
      → 仅读 `dist/` 与模板；零 `upstream` 推送；全部验证在系统临时目录内完成（已清理）。

---

## Out of Scope

- 公开脱敏市场仓（用户已选 SSH 走私有仓）。
- 自动轮询同步机制（`trellis update` 即同步动词，显式触发）。
- 把规则块纳入 Trellis 市场（原生无通道，走补轨）。
- 修改 Trellis 上游或发布 npm 包。
- 子任务 A/B 的范围。

---

## 待规划阶段确定的事项（不阻塞开工）

- R3.2 的 spec 种子**具体条目清单**（需先盘 15 仓现有 spec 内容，避免与各仓自有 spec 重复）。
- R5.1 中平台 agent 模型门禁的**目标平台范围**（当前仓群主要用 Claude Code / Codex）。
