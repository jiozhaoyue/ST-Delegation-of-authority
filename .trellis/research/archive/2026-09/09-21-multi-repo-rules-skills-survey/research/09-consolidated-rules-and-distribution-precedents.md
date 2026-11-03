# 规则分层合并（B-7）与两种分发范式的先例对比（D2 关键输入）

> 调查日期：2026-09-21
> 素材来源：`research/01-rules-my-repo.md`、`research/03-rules-js-slash-runner.md`、`research/08-prior-unified-rules-archaeology.md`、全局 `~/.claude/CLAUDE.md`
> 状态：Myfork 群（`research/02`）尚未返回，本文的 L1-Myfork 节待补

---

## 第一部分：规则分层合并

### L0 — 跨仓群共性规则（出现在 ≥2 个仓群，或与全局规则同源）

| # | 规则 | 分级 | 出现范围 | 证据 |
| --- | --- | --- | --- | --- |
| L0-1 | **实例隔离铁律**：开发/测试只在代码库工作区内；严禁向本地酒馆实例目录复制/写入任何文件；实例更新只走 Git / 原生安装器 / 酒馆助手 | MUST | My-repo 全部 6 个非空项目；全局约束 | `01` §汇总 1；`ST-zip-converter/CLAUDE.md:58` 一带 |
| L0-2 | **计划先行铁律**：Trellis `task.py start` 前必须回填 `prd.md`（不得为 TBD）；复杂任务另需 `design.md`+`implement.md`；`implement.md` 复选框实时勾选 | MUST | My-repo；全局 §4.5 | `01` §汇总 2；全局 CLAUDE.md §4.5 |
| L0-3 | **检索先行（双通道）**：实现前必须先检索现成方案；WebSearch/WebFetch + GitHub API 双通道；**国际搜索被屏蔽时用 `api.github.com` 替代** | MUST | My-repo；全局 §1 | `01` §汇总 6；全局 CLAUDE.md §1 |
| L0-4 | **强制 diff 工具 + 禁整文件覆盖**：比较变更一律用 diff 类工具；改现有文件必须块级替换（`Edit`），禁止 `Write` 整文件覆盖；禁止用 shell 重定向/`node -e`/`echo` 直接改写源码与数据 | MUST | My-repo；全局 §2 | `01` §汇总 4；全局 CLAUDE.md §2 |
| L0-5 | **交互问答规范**：需用户决策时必须用交互式问答工具，**严禁正文提问结束回合**；每次聚合 ≥2 问；重大方向性决策（架构取舍/重构 vs 重写/技术选型）必须先列候选方案与利弊、给推荐、经用户选定 | MUST | My-repo；全局 §3 | `01` §汇总 5；全局 CLAUDE.md §3 |
| L0-6 | **宿主 CSS 作用域纪律**：注入宿主的样式严禁全局选择器泄漏（`*`/`body`/`:root`/裸酒馆原生类）；配色一律继承宿主变量（`--SmartTheme*`）+ 回退值，禁止硬编码 | MUST | My-repo（双前缀铁律，有真实事故）；JS-Slash-Runner（iframe 适配禁令） | `01` §汇总 8；`ST-zip-converter/AGENTS.md:51`（"2026-09 已发生并修复过"）；`03` §汇总 3 |
| L0-7 | **宿主适配只许进桥接层**：平台差异（ST/Luker/PT/TT）集中在单一 host-bridge 模块，不许散落业务层 | MUST | My-repo 4 项目；**Authority 自身即此模式的样板** | `01` §汇总 9；`research/07` §2.2 |
| L0-8 | **测试即质量门、零回归**：发版前测试全绿，不接受回退 | MUST | My-repo 全部 6 项目 | `01` §汇总 7（ST-shujuku-rebuild ~7700 用例零回退） |
| L0-9 | **文档先行 + 完成即推送**：改动前先读 `.trellis/spec/` 对应层；复杂功能需设计文档；每阶段完成并通过测试后 `git push` | SHOULD | My-repo | `01` §汇总 3、10 |
| L0-10 | **纯前端项目引入服务端能力走「适配器 + 特性检测 + 静默降级」** | MUST | 全局 §4.6；**Authority 已原生实现**（Host Bridge 失败仅 `console.warn`） | 全局 CLAUDE.md §4.6；`research/07` §2.2 |
| L0-11 | **中文**：文档/注释/回复全中文（代码标识符、命令输出、专有名词除外） | SHOULD | 全局 §5.1 | 全局 CLAUDE.md §5.1 |
| L0-12 | **高风险操作安全门禁**：删除/覆盖已有文件、安装包、大规模重构与分支清理，必须先列目标与理由、获批准 | MUST | 全局 §6 | 全局 CLAUDE.md §6（CyberDomain PARDON） |

> **重要观察**：L0 中 8/12 条与全局 `~/.claude/CLAUDE.md` **同源**。这说明用户的"自定义规则"其实有**两个真源**：全局 agent 配置（已存在、已生效）与各仓内嵌块（腐烂中）。统一规则的真正增量价值在于 **L1 层（仓群特有）**，L0 层很大程度是在重复全局配置。

### L1-My-repo — 酒馆扩展/工具插件形态

来源：`research/01-rules-my-repo.md`（12 条共性 + 6 项目明细）

要点：插件须可独立运行；后端增强走 Authority 且必须可降级；`style.css` 双前缀 + CI grep 自查；事实源必须在服务器端（原生目录/聊天 JSONL），浏览器存储只做缓存（**ST-BgLoader 曾被用户纠正"浏览器优先"是错的**）；扩展设置页只放设置、复杂 UI 用官方 Popup、消息旁注入挂官方 RENDERED 事件——**"不在官方文档里的位置就是禁止的"**；API 事实以官方文档为准、禁止翻源码找 API。

### L1-JS-Slash-Runner — 酒馆助手脚本/工作区形态

来源：`research/03-rules-js-slash-runner.md`（20 条共性）

要点：禁 `DOMContentLoaded`（用 `$(() => {})` / `pagehide`）；`index.html` 只写静态 `<body>`；iframe 禁 `vh`/`position:absolute`/横向滚动；`teleportStyle()` 路径**禁 tailwindcss**、iframe 路径**优先 tailwindcss**（互斥）；接口优先级「酒馆助手高层 API > 原生/STScript」；技术栈 TS + vue + pinia + zod + jquery + tailwindcss，**禁 nodejs 库**；写回酒馆前必须 `klona()` 去 proxy；`createRouter()` 不得写在 `$(() => {})` 内且必须 `createMemoryHistory()`；MVU 需 `await waitGlobalInitialized('Mvu')`；zod 4 **禁 `passthrough`/`strict`**；MVU 目录约定；`dist/** merge=ours`；`.vscode/launch.json` 用 `skip-worktree` 防泄漏云酒馆地址。

### L1-Myfork — 宿主 fork 与插件形态

来源：`research/02-rules-myfork.md`（10 条共性 + 逐项目明细）

要点：提交必须推送远程；三仓同属 jiozhaoyue fork 群，上游一律只读；计划先行 / Trellis 任务制；中文文档 / 中文注释；“能力嗅探 + 可选降级”适配器模式（零硬依赖）；非破坏性 / 原生数据源唯一原则；禁止直接编辑上游快照目录；端口/路径约定固定、不自动回退；最小权限声明；测试命令固定为 `node --test tests/*.test.mjs`（Timelines）与 `npm test`（ST-DoA）。

---

## 第二部分：两种分发范式的先例对比（D2 关键输入）

用户自己的仓库群里**已经同时存在两种规则分发范式**，且**两种都在腐烂**。这为 D2 提供了实证依据而非猜测。

### 范式甲：内嵌块分发（前作 `UNIFIED-RULES:START`）

| 项 | 实测 |
| --- | --- |
| 机制 | `sync-rules.ps1` 把 `Center/unified-development-rules.md` 全文写进各仓 `AGENTS.md` 的 marker 块 |
| 覆盖 | My-repo 6 个非空项目中的 5 个内嵌了**同一份**块 |
| 腐烂表现 | ① 真源仓 `Center/` 与脚本**均已消失**；② 块内**大量章节只剩标题**（"**禁止的命令**:" 后为空、FAQ 只剩 "A:"）→ 同步器**截断有损**；③ §5 子代理模型写 `gemini-3-flash-preview`，§9 又写"本项目用 `claude-sonnet-4`"，**自相矛盾**；④ 实例路径写 `D:\Repo\Instance\Real\Luker`（真实为 `D:\Repo\Tavern-repo\Instance\Real\Luker`），**过时** |
| 根因 | 真源不在任何会被推送的版本库中 + 同步器有损 + 覆盖面不全 |
| 证据 | `research/08-prior-unified-rules-archaeology.md`；`01` §汇总 1、11、12 |

### 范式乙：单一真源 + 符号链接分发（JS-Slash-Runner 现行）

| 项 | 实测 |
| --- | --- |
| 机制 | 真源 `.cursor/rules/*.mdc`（8 件套）；`CLAUDE.md`/`AGENTS.md`/`GEMINI.md` 三份 10 行 `@` 引用**完全相同**；`.clinerules/*.md`、`.augment/rules/*.md`、`.kilocode/mcp.json`、`.roo/mcp.json` 均是指向真源的**符号链接** |
| 入库状态 | **已入 git**：`git ls-files -s` 显示 25 条 mode `120000`（符号链接），且 `core.symlinks=true` |
| 理论上限 | 改真源一处，其余自动同步；**结构上不可能出现内容截断** |
| 腐烂表现 | **真源实体只在 5 个项目中的 1 个存在**：<br>• `ST-chatfile-improve` → `.cursor/rules` ✅（8 项实体）<br>• `ST-msg-btn-mgr` → 实体为 `.agent/rules`<br>• `ST-PanelReset` → **无 `.cursor`** ❌<br>• `tavern_helper_template`（上游模板！）→ **无 `.cursor`** ❌<br>• `tavern_helper_workspace` → **无 `.cursor`** ❌ |
| 腐烂后果 | 上述 3 个项目的 `CLAUDE.md`/`AGENTS.md` 中 8 行 `@.cursor/rules/*.mdc` **全部悬空**。agent 读取时**静默拿不到任何规则**——比范式甲的"内容截断"更隐蔽，因为文件本身看起来完好 |
| 证据 | `git ls-files -s .clinerules/`；`ls -la .clinerules/`（8 条 link）；各项目 `.cursor` 存在性实测；`03` §存疑条目 2 |

### 对比结论与 D2 建议

| 维度 | 范式甲（内嵌块） | 范式乙（符号链接） |
| --- | --- | --- |
| 副本自包含（P3 不耦合） | ✅ 是（真源丢失副本仍可用） | ❌ 否（真源丢失即全部失效） |
| 抗内容截断 | ⚠️ 取决于同步器正确性 | ✅ 结构上不可能截断 |
| 跨平台可移植 | ✅ 纯文本，任何平台任何 editor 可读 | ❌ Windows 需 `core.symlinks=true` + 开发者模式；无此则 checkout 成普通文件或失败 |
| 静默失效风险 | 中（可见的截断/矛盾） | **高**（悬空引用完全不可见） |
| 新增仓库成本 | 同步器跑一次 | 每个新仓需重建全部符号链接 |
| 实测腐烂状态 | 真源消失 + 内容截断 + 条目过时 | **3/5 项目真源缺失 → 引用悬空** |

**建议（供 D2 裁定）**：

1. **主方案取范式甲的「自包含块」**，但必须修掉前作三个致命伤——这已在 `design.md` §2.3/§2.4 落地：
   - 真源落在**会推送的 git 仓**（解决"真源消失"）
   - 块 **原样承载全文、禁止有损摘要**（解决"内容截断"）
   - 哈希只算正文以确保幂等（解决"时间戳破坏幂等"）
2. **不采用符号链接作为跨仓群分发手段**——它的失效是静默的，且 Windows 可移植性差。
3. **但可借鉴范式乙的一个优点**：真源文件的**内部分层**（JS-Slash-Runner 把规则拆成 8 个主题文件 `.mdc` 而非单一大文件）值得吸收 → 建议真源按主题分文件组织，同步时**拼装**成单一块，既保持主题可维护性，又保证副本自包含。
4. **范式乙的悬空问题应单独登记为待修项**（属 JS-Slash-Runner 仓群自身缺陷，不在本任务同步范围内，但应写入 L1 规则作为警示）。

---

## 附：本次合并仍未解决的空缺

| 空缺 | 影响 | 补齐方式 |
| --- | --- | --- |
| Myfork 群规则未提炼 | L1-Myfork 空白；L0 可能仍有遗漏 | 等 `research/02` 返回 |
| L0 与全局 `~/.claude/CLAUDE.md` 高度重叠 | 统一规则可能只是重复劳动 | **需用户裁定**：统一规则是否只收 L1，L0 直接引用全局配置？（新增决策点，建议并入 D1） |
| 两处"统一的统一规则"同步块内容逐字相同但**未按项目定制** | 说明前作同步器的"项目覆盖"节形同虚设 | 已在 `design.md` §2.3 设计「项目覆盖」豁免区，需在 Phase D 验证其真的保留 |
