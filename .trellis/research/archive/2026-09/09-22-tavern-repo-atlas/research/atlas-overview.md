# Research: 酒馆仓群全景地图（R1 / R2 / R4）

- **Query**: 15 仓 + Authority 插件的全景地图（定位 / 技术栈 / 当前状态），区分「在用」与「在开发」，登记 L1…L12 业务线与 N-1…N-9 缺陷
- **Scope**: mixed（内部实测 + 父任务 research 材料）
- **Date**: 2026-09-24
- **证据等级图例**: 【实测】= 本轮只读命令直接验证（git log / git remote / git status / git fsck / 目录列表）；【材料】= 父任务 research 文件记载；【材料+实测】= 两者互证

---

## 〇、口径修正（先于地图，必读）

1. **15 仓的仓群归属与父任务记载有一处偏差**：`ST-shujuku-rebuild` 实测位于
   `D:\Repo\Tavern-repo\Myfork\ST-shujuku-rebuild`（remote `jiozhaoyue/ST-shujuku-rebuild.git`），
   而 `research/00`（B4）与 `research/01` §ST-shujuku-rebuild 均按 **My-repo** 登记。
   **以实测为准**。因此实际分组为：My-repo 6（含空目录 ST-Assets-Manger）/ Myfork 4 / JS-Slash-Runner 5 = 15。
2. **tavern-harness（统一规则真源仓）不在 15 仓口径内**，但它是仓群基础设施，附于 §三 登记备查。
3. 父任务 `research/11` 的目标仓实勘表同样把 ST-shujuku-rebuild 记在 My-repo 组——同一偏差，一并修正。

---

## 一、R1：15 仓全景地图

### 1.1 My-repo 群（酒馆扩展/工具插件形态，6 个目录）

| # | 仓 | 定位 | 技术栈 | 当前状态 | 状态依据 |
|---|---|---|---|---|---|
| 1 | `ST-Assets-Manger` | 空目录（无代码、无 git，用途未落地） | — | **已废弃 / 占位** | 【实测】非 git 仓；【材料】`research/01` §306「空目录，跳过」、`research/11`「空目录，已禁用」 |
| 2 | `ST-BgLoader` | 次世代富媒体背景与沉浸氛围插件（零转码直放 / 硬件解码 / 微粒天气 / 音频律动 / 2.5D 视差），替代官方视频插件 CPU 软解痛点 | TypeScript + Vite + Puppeteer(E2E 24 项)；**运行时零依赖** | **已交付、在用**（近期活跃：09-19 刚交付服务端持久化） | 【实测】git log：`cfa6cb4 2026-09-19 feat: persist the full settings object on the server`、`98bb6a7 2026-09-19 archive 09-19-server-settings-persistence`；【材料】`research/01` §75（三层持久化、存储倒置重构） |
| 3 | `ST-chatfilesys-rebuild` | 接管酒馆聊天文件系统：真楼层分支、SVG 分支树、零复制切换；**标准 JSONL 双向无损、零核心修改** | 前端扩展 JS + node:test + Python E2E（对 Dev/Luker 8003） | **一、二期已交付**；三期重构（chatsys 线 = L1/L2）**规划中未开工** | 【实测】git log：`249944a 2026-09-06 ChatFilesys 聊天文件系统：一期+二期完整交付`；未提交改动仅 `.agents/.codex`（Trellis 载体）；【材料】`research/00` B2（重构需求与开放问题） |
| 4 | `ST-git-improve` | ST/Luker **服务端插件**：私有 git 源登录、认证安装、重建式更新、npm 依赖修复、扩展诊断（纯补充面板，不接管原生扩展管理） | Node 服务端插件 + isomorphic-git（零系统 git 依赖） | **已交付（MVP），维护态** | 【实测】git log：`efbe194 2026-09-06 feat: st-git-improve 服务端插件（…完整交付）`；【材料】`research/01` §217（已知边界：单用户、SSH 二期） |
| 5 | `ST-Switcher` | ST/Luker 多会话秒切 + 原生双栏独立输入分屏 + 后台流式生成解耦；**为向 Luker 官方仓提交核心 PR 奠定纯 TS 架构底座** | 纯 TypeScript 类架构（SessionManager/FloorLockEngine 等）+ Vitest/JSDOM | **在用 / 开发中**（2026-09-21 补建私有仓入库） | 【实测】git log：`921f34b 2026-09-21 chore: 首次入库（此前该目录未纳入版本控制）`；remote `jiozhaoyue/ST-Switcher`；【材料】`research/01` §119、`research/11` 裁定 4（用户要求建私有仓推送、统一走 git） |
| 6 | `ST-zip-converter` | 四酒馆（ST/Luker/TT/PT）**数据包互转工作站**；纯前端为主 + Authority 服务端为可选增强层 | JS + Vite + Vitest（187 用例/30 文件）+ zip.js/fzstd 本地 vendored（免构建开箱即用） | **正在开发（当前最活跃仓）** | 【实测】git log：`3a98fb3 2026-09-24 chore(trellis): 预置两项 09-24 任务…`；未提交改动含 2 个任务目录 `09-23-perf-security-audit/`、`09-23-security-injection-hardening/`；【材料】`research/01` §29 |

### 1.2 Myfork 群（宿主 fork 与插件形态，4 个仓）

| # | 仓 | 定位 | 技术栈 | 当前状态 | 状态依据 |
|---|---|---|---|---|---|
| 7 | `PureTavern` | 跨平台酒馆宿主 fork（Android/Harmony/Desktop/Web/VSCode 多端；Legacy-first UI：根入口由上游原版页面负责，Vue 只做 `/modern.html` 与新页面） | pnpm monorepo（Vue3 + 上游 ST 快照 `apps/web/legacy/upstream/**`） | **宿主 fork 在用**（被动维护：CI 每 6 小时自动合并上游）；用户持有 PT 安装版实例 | 【实测】remote `jiozhaoyue/PureTavern`；【材料】`research/02` §103（`.github/workflows/sync-upstream.yml` 每 6h merge 上游） |
| 8 | `SillyTavern-Timelines` | 聊天时间线图谱插件：分支树可视化、书签、记忆里程碑；**原生 `chat.jsonl`/`message.extra` 为唯一数据源、零私有数据库** | JS 前端扩展 + Cytoscape/Dagre（Worker 布局）+ node --test（118+ 用例） | **已交付、在用**（Authority 集成已归档完成） | 【实测】remote `jiozhaoyue/SillyTavern-Timelines`；【材料】`research/02` §156（`.trellis/tasks/archive/2026-09/09-12-authority-integration/` 已归档；`window.TimelinesExtensionApi` 微内核总线） |
| 9 | `ST-shujuku-rebuild` | Luker/TT 宿主**数据库插件**：上游 `shuiyue-cmyk/shujuku-rebuild` v9.1.9 适配 fork；SQL 表格持久化到聊天消息 `TavernDB_ACU_*` 字段 | TS + rollup + sql.js(wasm 内联) + vitest（约 7700 用例）；仓库根=分发产物、`source/`=工程 | **已交付大版本，维护态**（CI 每日自动合并上游 master） | 【实测】位于 Myfork（修正 §〇 口径）；【材料】`research/01` §259（`UNIQUE_SCRIPT_ID=shujuku_v120` 存储身份铁律、救援方法论） |
| 10 | `ST-Delegation-of-authority` | **Authority：服务端基础插件（基础设施底座）**——为第三方扩展统一提供后端能力 + 权限治理（SQL/KV/Blob/私有文件/HTTP/Jobs/Events/Trivium 图数据库/Agent Runtime + Companion Modules 互调） | Node adapter（TS + webpack）+ Rust core（axum + rusqlite + triviumdb）+ 浏览器 SDK 扩展 + installable 产物链 | **正在开发（核心底座，本任务宿主仓）** | 【实测】git log：`0d2d39e 2026-09-22 纳入 Trellis 运行时与平台协作载体`；origin `jiozhaoyue/ST-Delegation-of-authority` + upstream `Youzini-afk/ST-Delegation-of-authority`（N-9 已完成）；【材料】`research/04` 全篇、`research/07` 四宿主实测 |

### 1.3 JS-Slash-Runner 群（酒馆助手脚本/工作区形态，5 个仓）

| # | 仓 | 定位 | 技术栈 | 当前状态 | 状态依据 |
|---|---|---|---|---|---|
| 11 | `ST-chatfile-improve` | 基于 tavern_helper_template 的聊天文件增强扩展（模板同步工具链完备：`protectedPaths` 只同步脚手架永不同步 src/dist） | TS + webpack + node:test（继承模板规则八件套） | **停滞**（最后业务提交 2026-06-08） | 【实测】git log：`ad256a4 2026-06-08 Add template sync tooling`（其后仅 09-21 规则块提交） |
| 12 | `ST-msg-btn-mgr` | 消息按钮管理脚本（Tavern Helper `type:"script"` 形态；swipe 归一化；tag 与版本严格相等才发布） | TS + webpack + Tavern Helper script JSON（release 双形态：远程引用版/内联版） | **停滞**（最后业务提交 2026-06-07 v1.0） | 【实测】git log：`fe33faa 2026-06-07 v1.0`（其后仅 09-21 规则块提交） |
| 13 | `ST-PanelReset` | 酒馆面板回正脚本（最小化脱离模板的项目：无上游规则八件套，入口一行转发） | TS + webpack（`package.json` 无 scripts 字段，产物外部流程生成） | **已发布、低频维护**（v1.1.0，2026-07-08） | 【实测】git log：`c3d6a67 2026-07-08 chore: publish ST-PanelReset 1.1.0`；【材料】`research/03` §57 |
| 14 | `tavern_helper_template` | 酒馆助手**脚手架模板**：上游 StageDog 官方模板原件 + 本地二改（`build:js`/`package:script`/`release:script` 打包发布链） | TS + webpack + pnpm（typescript 6.0.3 / jquery 4 等预发布代差依赖） | **git 仓损坏**（HEAD 与全部 refs 指向丢失对象）；上游模板仓身份不变 | 【实测】`git fsck`：`refs/heads/main: invalid sha1 pointer 9167e77f…`、`error: HEAD: invalid sha1 pointer`、`error in blob …gitattributesMissing`；remote 配置完好（`jiozhaoyue/tavern_helper_template`）→ 可从远程恢复；【材料】`research/03` §144（上游/二改双轨判定） |
| 15 | `tavern_helper_workspace` | 多扩展工作区**脚手架**（`projects.json` 注册表 + `export` 产出纯 Luker 扩展仓），尚未成型 | 待成型（仅 1 个契约测试文件，实现文件缺失） | **未成型**（非 git 仓、无 package.json、无可运行实现） | 【实测】非 git 仓；【材料】`research/03` §183（测试引用的 `scripts/project-workflow.mjs` 不存在，测试不可直接运行） |

### 1.4 附加登记：仓群基础设施

| 仓 | 定位 | 技术栈 | 当前状态 | 状态依据 |
|---|---|---|---|---|
| `D:\Repo\Tavern-repo\tavern-harness` | **统一规则真源仓**：L0 15 条 + L1 三组（14/14/20）+ 坑与教训 13 条 + 幂等同步器 + 薄封装 `tavern-init` | Python 同步器（`--dry-run/--apply/--verify`）+ Markdown 自包含块 | **在用**（私有远程已推送；规则块已落 11 仓、`--verify` 14/14 零漂移） | 【实测】git log：`f68be5e 2026-09-21 fix(scripts): 按物理路径去重目标，修复符号链接叠块事故`；remote `jiozhaoyue/tavern-harness`；【材料】`research/11` §一/§七 |

---

## 二、Authority 插件专项（15 仓中第 10 仓的展开）

- **定位一句话**【材料】（`research/04` §一，源自 README/docs）：ST **服务端插件**（装 `plugins/authority`），为第三方扩展统一提供「后端能力 + 权限治理」，替代每个扩展各自造轮子。**基础型（foundational）**——本身不是终端功能插件，而是给别的插件用的底座。
- **三层架构**【材料】：SDK 扩展（`window.STAuthority`）→ Node adapter 公开层（`/api/plugins/authority/*`）→ Rust core 内部层（`/v1/*`，loopback）。
- **四宿主可用性**【材料】（`research/07`，静态验证）：
  - SillyTavern 1.18.0 ✅ 完整可用（Host Bridge 版本命中 `["1.18.0"]`）
  - Luker 2.7.0 ✅ 核心可用 / ⚠️ Host Bridge 不可用（版本门禁拒绝；失败仅 `console.warn` 不阻断加载）
  - PureTavern 0.1.12 ❌ / TauriTavern 2.2.0 ❌（无服务端插件基建，只能纯前端降级）
  - **与已裁定事实一致**：ST ✅ 完整 / Luker ✅ 核心可用（Host Bridge ❌）/ PT ❌ / TT ❌
- **能力治理四层原语**【材料】（`research/10` §B.1）：①权限与隔离（8 资源 + 7 级判定序）②Feature Flags（26 条特性路径 = 官方降级契约）③**Companion Modules**（`.authority/module.json` 声明事务 + `client.tx()` 互调 = 「联动但不耦合」的机制化落地）④Agent 工具注册（插件反哺 Agent）。
- **边界**【材料】（`research/10` §B.2）：Authority 与宿主「**并存而非替代**」——只治理「用 Authority 能力的扩展」，不接管其它插件的路由/生命周期；**能力治理 ≠ 插件管理**（清单/依赖矩阵/冲突检测缺口 → L12）。

---

## 三、R2：可直接消费的结论（不是文件清单）

### 3.1 正在开发的（4 项）

| 对象 | 一句话现状 | 下一步焦点 |
|---|---|---|
| **Authority（ST-Delegation-of-authority）** | 核心底座，2026-09-22 起纳入 Trellis 任务流；upstream 已配（可拆单一功能 PR） | C-09 生态与 PR 策略裁定后的 PR 拆分；L12 插件注册表 |
| **ST-zip-converter** | 当前最活跃业务仓：09-23/09-24 两个任务在跑（性能与安全审计、注入加固） | L6 增强（408/100MB/流量优化）+ B5 开放决策（p2p vs 中转格式） |
| **ST-Switcher** | 2026-09-21 补建私有仓入库；纯 TS 架构已为剥离解耦 | 向 Luker 官方仓提交核心 PR（其存在的首要目的） |
| **chatsys 重构线（L1/L2/L3）** | 概念定稿未完成（分支分组/绑定/切分支联动/模式命名 4 个开放问题），**尚未开工写码** | L1 grill-me 概念定稿（须出 demo + 举例 + 画图） |

### 3.2 已交付且在用的（6 个）

| 扩展 | 用户视角角色 | 依据 |
|---|---|---|
| **SillyTavern-Timelines** | 日常使用的聊天图谱（分支树/书签/记忆里程碑） | Authority 集成 09-12 已归档；`research/02` §156 |
| **ST-shujuku-rebuild** | 日常使用的数据库插件（Luker/TT），发版口径 ~7700 用例零回退 | `research/01` §259；L1-MF-7 测试命令 |
| **ST-BgLoader** | 日常使用的背景/氛围插件；09-19 刚完成「设置全量服务端持久化」 | 【实测】git log `cfa6cb4`；`research/01` §75 |
| **ST-chatfilesys-rebuild** | 已交付一、二期的聊天文件系统扩展（分支树/零复制切换） | 【实测】git log `249944a 2026-09-06 一期+二期完整交付` |
| **ST-git-improve** | 已交付 MVP 的 git 服务端插件（私有源安装/重建式更新） | 【实测】git log `efbe194 2026-09-06 完整交付` |
| **ST-PanelReset** | 已发布 v1.1.0 的小工具脚本 | 【实测】git log `c3d6a67 2026-07-08 publish 1.1.0` |

### 3.3 停滞 / 非仓 / 待决（5 个）

| 对象 | 结论 |
|---|---|
| `ST-chatfile-improve` | **停滞**（>3 个月无业务提交，最后 2026-06-08）；脚手架/模板同步链路完好 |
| `ST-msg-btn-mgr` | **停滞**（>3 个月无业务提交，最后 2026-06-07 v1.0）；发布工作流完备 |
| `ST-Assets-Manger` | **空目录**，从未起步，无 git |
| `tavern_helper_template` | **上游模板仓 + 本地二改**；git 仓对象损坏（新发现，见 §四 N-10），remote 完好可恢复 |
| `tavern_helper_workspace` | **未成型脚手架**（仅契约测试先行，实现缺失、非 git 仓） |

### 3.4 一句话总结（供主代理直接引用）

> 15 仓 = **2 个正在开发的重型仓**（Authority 底座、zip-converter）+ **1 个为提 PR 而生的架构底座**（Switcher）+ **1 条规划中的重构主线**（chatsys）+ **6 个已交付在用的扩展** + **2 个停滞仓** + **3 个非仓/损坏/未成型**；另有 1 个仓群基础设施（tavern-harness 规则真源）。所有业务仓共享同一架构哲学：**纯前端可独立运行 + Authority 可选增强 + 不可用即静默降级**（Timelines/zip-converter/BgLoader 三仓独立收敛到同一模式）。

---

## 四、R4：缺陷登记 N-1…N-9（含处置状态与前置依赖）

> 登记基准：父任务 `design.md` §5.4（**N-9 以该版为准**：Authority fork 未配 upstream）。
> `research/10` §C.3 的 N-9 是早期定义（L0 重复问题，已被 D7 裁定吸收），**不再单独登记**，此处注明以防重复。
> N-1/N-2/N-7/N-9 按任务裁定与核实结果登记为已关闭/已落地/已完成。

| # | 事项（缺陷本体） | 状态（2026-09-24） | 前置依赖 | 证据 |
|---|---|---|---|---|
| **N-1** | `Instance/Dev/Luker` 的 `origin` 误指上游 `SillyTavern/SillyTavern` | ✅ **已关闭**（2026-09-22 用户裁定：只读实例，除 `git pull` 外不触发任何操作，误推属伪风险；永不改动其 git 配置） | 无 | 任务裁定；`research/12` §三 P0 表 |
| **N-2** | `Instance/Real/Luker` 安全开关放宽 + basicAuth 出厂明文 | ✅ **已落地**（2026-09-24：`config.yaml` 第 218 行 `enableServerPluginsAutoUpdate: true → false`，用户单独批准的唯一实例写操作） | 无 | 任务裁定；`research/12` §三 |
| **N-3** | `Instance/Dev/TauriTavern` 缺 `src-tauri/` 无法构建，与「E2E 只用 Dev 实例」红线直接冲突 | ⏳ 待处理 | 需用户批准（补克隆 or 特批只读使用 Real） | `research/06` §5.3；`research/12` §三 P2 |
| **N-4** | 端口 `3000` 三方撞车（Tavern-Viewer + TavernHeadless 均默认 3000，且被系统 svchost 实占） | ⏳ 待处理 | 并入 C-06（统一开发/测试环境规则） | `research/06`；`research/12` §三 P2 |
| **N-5** | `8000` 出厂默认值重灾区（6 处：Luker 两份 compose、ST/Luker 两份 `default/config.yaml`、PT remote-server、TT default） | ⏳ 待处理 | 并入 C-06 | `research/06`；`research/12` §三 P2 |
| **N-6** | `Instance/Real/PureTavern` 疑似冗余（与 Dev 版 diff 为空、均无 `data/`） | ⏳ 待用户拍板 | 属删除范畴，需用户批准 | `research/06`；`research/12` §三 P2 |
| **N-7** | 清除 My-repo 仓内前作 `UNIFIED-RULES` 腐烂残留块 | ✅ **已完成**（3 仓各删 284 行，`git diff` 纯删除） | 无 | `research/11` §七裁定 3 |
| **N-8** | JS-Slash-Runner 仓群规则引用悬空（`ST-msg-btn-mgr`、`tavern_helper_template` 的 `@.cursor/rules/*.mdc` 指向不存在文件） | ⏳ 待处理 | 独立小任务；注意 `tavern_helper_template` 是上游模板仓（写入会与上游分叉） | `research/03`；`research/12` §三 P2 |
| **N-9** | Authority fork 未配 `upstream` remote，阻塞上游对齐与 PR 拆分 | ✅ **已完成**（2026-09-24 回源核实：`upstream = https://github.com/Youzini-afk/ST-Delegation-of-authority.git`，`git fetch upstream --dry-run` 通过） | 无 | 任务裁定；【实测】`git remote -v` 含 upstream |
| **新发现（建议编号 N-10，待父任务确认收录）** | `JS-Slash-Runner/tavern_helper_template` **git 仓对象损坏**：`refs/heads/main`、`refs/remotes/origin/*` 与 HEAD 全部指向丢失对象 `9167e77f…`，且 `.gitattributes` blob 缺失 → 本地仓不可读历史、不可提交 | 🆕 本轮实测新发现 | 需用户批准处置（remote 完好 → 可 `re-clone` 或从远程重建本地分支）；**属 git 写操作，本任务禁做** | 【实测】`git fsck --no-progress` 输出 4 条 `invalid sha1 pointer` + 1 条 `gitattributesMissing`；`git log` 报 `fatal: bad object HEAD` |

### N-1…N-9 登记完整性自查（对应 AC-4）

- ✅ N-1…N-9 九条全部登记，一条一行，无重复编号。
- ✅ N-1/N-7/N-9 = 已关闭/已完成；N-2 = 已落地；其余 5 条（N-3/N-4/N-5/N-6/N-8）= 待处理，均标明前置。
- ✅ N-9 采用 `design.md` §5.4 定义（research/10 §C.3 旧定义已被 D7 吸收，已注明防重复）。
- ⚠️ 新发现 1 条（tavern_helper_template git 损坏）**不占用** N-1…N-9 编号，以「建议 N-10」待父任务确认，避免登记表双写。

---

## 五、R4：业务线登记 L1…L12

> 登记基准：父任务 `design.md` §5.3（原文转录），本任务补齐「关联仓」与「与缺陷/裁定关系」两列。**本任务不实施任何业务线。**

| 线 | 内容 | 关键前置 | 关联仓 / 载体 | 备注 |
|---|---|---|---|---|
| **L1** | chatsys 概念定稿（分支分组/绑定/切分支联动/模式命名） | **需 grill-me**；开放问题最多（❓切换分支联动怎么描述、❓两种模式命名） | `ST-chatfilesys-rebuild`（三期） | 必须出 demo + 举例 + 画图 |
| **L2** | chatsys-frontend 重构（摒弃现有实现后切换） | **L1** | `ST-chatfilesys-rebuild` | 默认：转换聊天记录、保留原 jsonl、库与 jsonl 同步；**与 L4 互不替代** |
| **L3** | chatsys-backend（通用后端，暴露的 API 都可接） | **L1**；后端路线已裁（D4：依赖 Authority 可用子集） | Authority 或新仓 | timeline 也可获增强 |
| **L4** | timeline jsonl「屎上雕花」线（一点不改 jsonl） | — | `SillyTavern-Timelines` | 面向「不想改聊天文件」的用户 |
| **L5** | shujuku-rebuild：前端插件能力极限 + 识别到后端才转交 | 调研课题（为何设置项多却不智能） | `ST-shujuku-rebuild` | 酒馆原生风格 + API 设置页允许不安全地址 |
| **L6** | zip-converter 增强（导入不触发 408 / 云 Luker 100MB 限制 / 流量优化 / git 浅层化 / 多包后台导入） | ❓ 数据包转换决策（p2p vs 中转格式；修 tt→pt vs 兼容插件） | `ST-zip-converter` | 与 09-23/09-24 安全审计任务并行 |
| **L7** | 隐藏助手二开（从 x 楼开始保留 / 每 y 楼后从 z 楼开始保留） | ❓ 语义待澄清 | 宿主内置助手二开 | 用户自述描述不清 |
| **L8** | 酒馆美化（仿 agent desktop） | — | （未建仓） | |
| **L9** | 酒馆助手脚本一键导入导出 + 智能深色模式 | — | （未建仓，JSSR 群形态） | |
| **L10** | ST-copilot（侧边栏 / 多实例 / 分屏 / 同时保存） | — | （未建仓） | |
| **L11** | luker DEV PR 三件套（数据库设置全遮罩+手势回退 / 拖拽预设+智能分类 / 扩展页懒扫描更新） | 走 `Instance/Dev/Luker` 仓交付（**只读实例，仅 git pull**，见 N-1 裁定） | Instance/Dev/Luker | 附带：宿主备份 zipLevel 一行改造方案（`backups.zipLevel`）已在 `research/00` B10 记录，属宿主仓交付非插件 |
| **L12** | **插件注册表 / 统一调控台**（调查新发现缺口：插件清单/依赖矩阵/冲突检测/跨宿主可用性登记） | C-08 已完成（四宿主实测）；基于 `module-discovery-service` **只读发现**，不新造机制 | `ST-Delegation-of-authority` | Authority 已有四层能力治理（权限/Flags/Companion/Agent 工具），缺的是「插件管理」而非「能力治理」 |

### L1…L12 登记完整性自查（对应 AC-4）

- ✅ L1…L12 十二条全部登记，无重复；每条有前置依赖或显式标「—」。
- ✅ L11 的载体已按 N-1 裁定更新（只读实例纪律），与 design.md 原文一致。
- ✅ L1→L2→L3 依赖链、L6↔B5 决策依赖已显式化。

---

## 六、证据等级汇总

| 结论类别 | 等级 |
|---|---|
| 15 仓的存在性、git remote、最后提交时间、未提交改动、tavern_helper_template 损坏 | **实测**（本轮只读命令） |
| 各仓定位/技术栈/硬约束 | **材料**（父任务 research/01-03 的规则提炼，其本身含文件行号级证据） |
| Authority 定位、四宿主可用性、Companion Modules 机制 | **材料**（research/04、07、10；07 为源码级静态验证） |
| N-3…N-6/N-8 缺陷现状 | **材料**（research/06/12，父任务实测转录；本轮未复核实例目录——遵守「不碰 Instance」约束） |
| ST-shujuku-rebuild 仓群归属修正 | **实测**（目录列表 + remote） |
| 「正在使用的扩展」中各扩展的**实例安装状态** | **材料推断**（Real 实例装了哪些扩展无直接记录，判定依据是各仓交付/使用痕迹与用户口述；未做实例目录只读核查） |

## 七、Caveats / Not Found

1. **未核查 `Instance/**`**：任务约束「不碰 Instance」，故 N-3…N-6 现状沿用父任务 `research/06` 的实测转录，未二次验证。
2. **「在用」与「实例在装」是两个断言**：本地图的「已交付且在用」= 仓有近期业务活动 + 材料记载的使用痕迹；**不代表** Real 实例当前安装清单（该清单无任何材料记录）。
3. tavern_helper_template 的远程仓是否健康（GitHub 侧对象是否完整）未验证——本地 fsck 只能证明本地 `.git` 损坏。
4. 父任务 `research/11` 表格与 `research/00` B4 的「ST-shujuku-rebuild ∈ My-repo」均与实测不符，已按 §〇 修正；若父任务后续引用需同步勘误（属父任务文件，本任务不改）。
