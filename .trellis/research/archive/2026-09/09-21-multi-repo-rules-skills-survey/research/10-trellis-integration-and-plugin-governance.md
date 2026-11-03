# Trellis 集成可行性 · 插件统一调控方案 · 任务全集

> 生成日期：2026-09-21
> 对应你的两个提问：「能否注册 Trellis，初始化时选 tavern 就写入这套 AGENTS.md」、以及「所有插件的统一调控呢？所有的任务呢？」
> 全部结论均有证据，证据见各节末尾

---

## A. Trellis 集成：能否做成「选 tavern 就写入规则」

### A.1 结论

**Trellis 没有预设/配置档机制**，但**也不需要**——因为 Trellis 从设计上就保证「标记块外的内容永不被覆盖」。因此可以做到你要的效果，只是落点不是"Trellis 预设"而是"薄封装 + 块外插入"。

### A.2 证据

| 检查项 | 结果 |
| --- | --- |
| CLI 位置 | `@mindfoldhq/trellis@0.6.16`，全局装于 `C:\nvm4w\nodejs\node_modules\@mindfoldhq\trellis` |
| 模板目录 | `dist/templates/{claude,codex,cursor,gemini,kiro,kimi,qoder,...}` + `dist/templates/markdown/` |
| 预设机制检索 | `preset\|profile\|customTemplate\|custom_template\|extraRules\|extra_rules\|userTemplate` → **零命中** |
| `task.py` 子命令 | create/add-context/validate/…/archive，**无 init 或 template 命令**（init 属 CLI，不属 task.py） |
| 模板管理 | `.trellis/.template-hashes.json` 记录 **985 个受管文件**的哈希（含 `.claude/agents/*`、各平台目录） |

### A.3 关键机制：Trellis 的块保护承诺

`dist/templates/markdown/agents.md` 模板正文的结尾原话：

> Managed by Trellis. **Edits outside this block are preserved; edits inside may be overwritten by a future `trellis update`.**

配套实现（`dist/utils/managed-paths.js:4-5`）：
```js
export const TRELLIS_BLOCK_START = "<!-- TRELLIS:START -->";
export const TRELLIS_BLOCK_END   = "<!-- TRELLIS:END -->";
```
配合 `isManagedPath()` / `isManagedRootDir()` 判定受管范围。

**推论**：我们的规则块只要落在 `<!-- TRELLIS:END -->` **之后**，就获得了 Trellis 的官方兼容承诺——`trellis init`、`trellis update` 都不会动它。这与我 `design.md` §2.4 已定的插入锚点（紧跟 TRELLIS 块之后）**完全一致**，无需改动设计。

### A.4 落地形态（三选一，推荐前两者组合）

| 方案 | 做法 | 评价 |
| --- | --- | --- |
| **① 块外插入（基础，必做）** | 同步器在 TRELLIS 块后写入自包含规则块 | ✅ 已获 Trellis 承诺保护；零侵入；无新依赖 |
| **② 薄封装 CLI（推荐补充）** | 自建 `tavern-init`：内部依次执行 `trellis init` → 写入规则块 → 校验。用户体验即「选 tavern 就全自动」 | ✅ 不改 Trellis 一行代码，`npm update` 不受影响 |
| ③ 改 npm 包模板 | 直接改 `dist/templates/markdown/agents.md` | ❌ **不做**：`npm update @mindfoldhq/trellis` 即被覆盖，是前作「真源腐烂」的翻版 |

---

## B. 插件统一调控：Authority 已经给了四层原语

你问「所有插件的统一调控」——Authority 现有的治理面**比预期完整**，但存在一个真实缺口。分层说明。

### B.1 已有的四层治理原语

**第 1 层｜权限与隔离**
- 资源：`storage.kv`、`storage.blob`、`fs.private`、`sql.private`、`trivium.private`、`http.fetch`、`jobs.background`、`events.stream`（+ `agent.run`/`agent.browser`）
- 判定顺序（高→低）：`声明门控 > 管理员扩展覆盖 > 管理员默认(granted/denied/blocked) > 持久授权 > 会话授权 > 管理员默认(prompt) > 系统默认(granted)`
- 隔离维度（6 维）：ST 用户 / 扩展 ID / 资源 target / 数据库名 / channel / hostname / job type
- **含义**：每个插件拿不到越权的数据，无需插件自己实现隔离

**第 2 层｜Feature Flags（官方降级契约）**
- `client.hasFeature(path)` 同步查快照；`client.requireFeature(path, msg?)` 异步查、缺失即抛
- 共 **26 个特性路径**，覆盖 `securityCenter`/`admin`/`sql.*`/`trivium.*`/`transfers.*`/`jobs.*`/`diagnostics.*`/`modules.enabled`
- **官方推荐用法**：先判 `hasFeature` 再决定走新路径或旧路径——**这正是你全局规则 §4.6 要求的「适配器 + 特性检测 + 静默降级」，且是官方强制的接入姿势**

**第 3 层｜Companion Modules（插件互调正式契约）★ 这是"联动但不耦合"的答案**
- 插件在自己目录放 `.authority/module.json` 声明事务（transaction）
- 其他插件通过 `client.modules.execute(moduleId, txName, input)` 调用，或用语法糖 `client.tx('<moduleId>:<txName>')`
- 约束：`MODULE_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/`、`AUTHORITY_MODULE_SCHEMA_VERSION = 1`、inline 上限 256 MiB（超出必须走 transfer）
- 安全设计：发现阶段**不执行任何 companion 代码**、**不跟随符号链接**
- **含义**：插件之间**只通过声明的 transaction 契约通信，绝不 import 对方内部实现** → 这就是「暴露 API、成为基础设施、联动但解耦」的机制化落地

**第 4 层｜Agent 工具注册（插件反哺 Agent）**
- `client.agent.browser.registerTools(...)` 让前端插件把自身领域能力注册为 Agent 可调用工具，再由 `claim` / `submitResult` 完成回路

### B.2 一条必须澄清的边界

> **Authority 是「并存」，不是「替代」。**
> 它自己就是 `plugins/` 下的一个 ST 服务端插件，与其它 server plugin 同级；它只规定「使用 Authority 能力的扩展」要走它的 SDK，**不接管其它插件的路由或生命周期**。

这直接回答你「所有插件的统一调控」——**Authority 提供的是「能力治理」而非「插件管理」**。它管的是"谁能访问什么资源"，不管"谁装了、谁在跑、谁依赖谁"。

### B.3 真实缺口：缺一层「插件注册表 / 目录」

| 能力 | 现状 |
| --- | --- |
| 能力治理（权限/隔离/降级/互调） | ✅ Authority 已有 |
| 插件**清单**（装了哪些、各版本） | ❌ 无 |
| 插件**依赖与兼容矩阵**（谁依赖谁的哪个 version） | ❌ 无（Companion Modules 有 schemaVersion 但无版本协商） |
| 插件**健康与冲突检测**（两个插件 hook 同一事件、改同一 DOM） | ❌ 无 |
| 跨宿主**可用性登记**（哪个插件在 PT/TT 上不可用） | ❌ 无（本次 C-08 是人工做的，非机制） |

**建议**：这不属于本任务（本任务是调查+规划），应**新开一条业务线**（见 §C 的 L12），以 Companion Modules 为基础做只读发现（Authority 的 `module-discovery-service` 已能发现 `.authority/module.json`），**不必新造机制**。

### B.4 与 D4 的关系（你已裁定选 1，但要求暂不定论）

你选择「依赖 Authority 可用子集」，同时指出**当前是 fork 仓、会大量迭代，先不着急定论**。据此记录两条约束：
1. **本地 Authority fork 与上游同 commit `4d449f7`、零差异、且未配 `upstream` remote** → 大量迭代前应先补 `upstream` remote，否则无法跟踪上游、无法拆单一功能 PR（这与你 `research/02` 中 Myfork 群的 Git 政策「绝不推 upstream」一致）。
2. **跨宿主插件禁用 Host Bridge**（C-08 结论）→ 写进统一规则，避免迭代中无意引入。

---

## C. 所有任务：全集清单

### C.1 元任务线（本任务产出的子任务）

见 `design.md` §5.2（C-01…C-09）。**C-08 已完成**。其中 **C-01/C-02/C-03** 现已被 D1/D2/D3/D7 裁定**解除阻塞**。

### C.2 业务线（你的草稿需求，L1–L11）

见 `design.md` §5.3。来源全部转录在 `research/00-requirements-inventory.md`。

### C.3 本次调查**新发现**的待办（原草稿需求中没有，但必须处理）

这些是"所有你的任务"里原本缺失、但调查证明必须存在的一项：

| # | 事项 | 证据 | 性质 | 紧急度 |
| --- | --- | --- | --- | --- |
| **N-1** | **Dev\Luker 的 `origin` 误指上游 `SillyTavern/SillyTavern`**（Luker 自身 remote 名为 `luker`）→ 在此仓执行 `git push origin` **会误推上游** | `research/06` | Git 配置缺陷 | 🔴 高（一次误操作即对外污染） |
| **N-2** | **Real\Luker 安全开关全面放宽**：`whitelistMode: false`、`securityOverride: true`、`cors.origin: ["*"]`+全方法、`listen: true` 且 `0.0.0.0:8004`；**basicAuth 密码仍是出厂明文 `password`** | `research/06` | 安全风险 | 🔴 高 |
| **N-3** | **Dev\TauriTavern 缺 `src-tauri/`，无法构建** → 实际只能用 Real\TauriTavern 做 TT 侧开发，与"E2E 只用 Dev 实例"红线**直接冲突** | `research/06` | 环境缺失 | 🟠 中（阻塞 TT 侧一切开发） |
| **N-4** | **端口 3000 三方撞车**：`Tavern-Viewer` + `TavernHeadless` 默认均 3000，且**当前被系统 svchost(PID 5908) 实占** → 按默认配置启动必然失败 | `research/06` | 端口冲突 | 🟠 中 |
| **N-5** | **`8000` 是默认值重灾区**（6 处）：Luker 两份 compose、ST/Luker 两份 `default/config.yaml`、PureTavern remote-server、TauriTavern default | `research/06` | 配置隐患 | 🟡 低 |
| **N-6** | **Real\PureTavern 疑似冗余**：与 Dev 版同上游同 commit、`diff` 为空、均无 `data/` | `research/06` | 待归档决策 | 🟡 低 |
| **N-7** | **清理前作 `UNIFIED-RULES` 残留块**：My-repo 5 个仓的 `AGENTS.md` 内仍嵌有腐烂的同步块（真源已消失、内容被截断、条目过时） | `research/01`、`08` | 清理 | 🟡 低（但你已明确指示"完全删除相关的"） |
| **N-8** | **JS-Slash-Runner 3 个仓的规则引用悬空**：`ST-PanelReset`、`tavern_helper_template`、`tavern_helper_workspace` 的 `@.cursor/rules/*.mdc` 全部指向不存在的文件 | `research/09` | 缺陷 | 🟠 中（agent 静默拿不到规则） |
| **N-9** | **统一规则本身的 L0 重复问题**已由 D7 裁定（收录但标注同源），需在 C-01 落实 | 本任务 | 已决策 | — |

### C.4 你已裁定的四项（本次）

| 决策 | 裁定 |
| --- | --- |
| **D1** | `Tavern-repo/Center` 完全无关 → 相关残留**全部删除**；真源改为**建私有仓放 tavern harness，上传云端、每次推送**；并探索 Trellis 集成（见 §A） |
| **D2** | **AGENTS.md 自包含块** |
| **D7** | **L0 收录但标注同源** |
| **D4** | 选「依赖 Authority 可用子集」，但**因 fork 将大量迭代，暂不定论**；需先补 `upstream` remote |

---

## D. 证据来源

| 来源 | 内容 |
| --- | --- |
| `C:\nvm4w\nodejs\node_modules\@mindfoldhq\trellis\dist\templates\markdown\agents.md` | Trellis 块保护承诺原文 |
| `...\trellis\dist\utils\managed-paths.js:4-5` | `TRELLIS_BLOCK_START/END` 常量 |
| `...\.trellis\.template-hashes.json` | 985 个受管文件清单 |
| `research/04-plugin-authority.md` §3.6、§6.2、§6.3 | 权限判定顺序、四层降级原语、并存非替代 |
| `research/06-dev-env-instances-ports.md` | 端口实测、Real\Luker 安全现状、N-1..N-6 |
| `research/09-consolidated-rules-and-distribution-precedents.md` | N-8 悬空引用、D2 依据 |
