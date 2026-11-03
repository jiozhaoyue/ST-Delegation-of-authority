# 技术设计：多仓规则体系 · Skill 体系 · 任务地图

> 配套：[`prd.md`](./prd.md) ｜ 需求真源：[`research/00-requirements-inventory.md`](./research/00-requirements-inventory.md)
> 前作考古：[`research/08-prior-unified-rules-archaeology.md`](./research/08-prior-unified-rules-archaeology.md)
> 状态：**待用户裁定 D1–D6 后方可实施**（见 `prd.md` Open Decisions）

---

## 一、设计哲学

本任务的所有设计都服从用户的一句话主张：

> **「暴露 API，成为一个基础设施」；联动打造生态，但又不耦合。**

落到本任务，翻译为三条设计原则：

| 原则 | 含义 | 在本任务的体现 |
| --- | --- | --- |
| **P1 唯一真源，单向分发** | 同一份知识只允许存在一处权威副本，其余都是生成物 | 规则真源 → 同步器 → 15 仓块 |
| **P2 无损且可校验** | 分发过程不得改变语义，且任何时刻可验证副本是否漂移 | 原样搬运 + 内容哈希 + `--verify` |
| **P3 不耦合** | 副本必须自包含；真源不可用时不导致副本失效 | 块内不引用外部路径；纯文本，无运行时依赖 |

---

## 二、规则体系架构

### 2.1 真源落点（决策 D1）

前作把真源放在 `Tavern-repo/Center/`（同级目录、**不属任何仓库、从未推送**），结果整个目录消失、脚本丢失。**腐烂的根因不是位置，而是"不在任何会被推送的版本库里"。**

候选方案对比：

| 方案 | 位置 | 优点 | 缺点 | 耐久性 |
| --- | --- | --- | --- | --- |
| **A** | 重建 `D:\Repo\Tavern-repo\Center\`，`git init` + **必须配 GitHub remote 并推送** | 贴近前作心智；与 15 仓同盘同级，同步路径直观 | 需用户承诺持续推送；若不推 → 重蹈覆辙 | 中（取决于推送纪律） |
| **B** | 本仓 `ST-Delegation-of-authority/.trellis/spec/tavern-rules/` | 天然在 git 内；Trellis 全平台自动读取 | 污染公开 fork；规则与 Authority 业务无关；其余 14 仓跨仓引用困难 | 高（但污染对外仓） |
| **C** | 用户级 `C:\Users\caocaobi\.agents\`（已是 git 仓库） | **已有版本控制**；天然跨项目；agent 原生可读；skill 也落这里，规则与 skill 同居一处 | **当前无 remote**（`git remote -v` 为空）→ 同样有丢失风险 | 高（若补 remote） |
| **D** | 新建独立规则仓（如 GitHub 上的 `tavern-dev-rules`），各处引用 URL | 公开可分享；彻底避免本地丢失 | 规则含本地私有路径（实例路径等），公开需脱敏 | 最高 |

**✅ 已裁定（2026-09-21）：方案 A′ — 新建私有仓放 tavern harness**

用户裁定原文要点：「`Tavern-repo/Center` 完全无关，完全删除相关的。……可以建立私有仓库放 tavern 的 harness，然后上传至云端，每次都推送。」

据此定稿：

| 项 | 定稿 |
| --- | --- |
| **真源形态** | **新建私有 Git 仓**承载 tavern harness（统一规则 + 同步器 + 薄封装 CLI） |
| **必须带 remote** | 是。**带 remote 是本方案成立的前提**——前作腐烂的根因不是位置，而是"不在任何会被推送的版本库里" |
| **推送纪律** | 每次变更后推送（与 `research/02` 中 Timelines 的成文 Git 政策"提交必须立即 push origin"一致） |
| **副本耦合性** | 同步进 15 仓的块**自包含全文**（不引用真源路径）→ **即使真源丢失，副本不失效**（满足 P3） |
| **Center 残留处理** | `Tavern-repo/Center` **已不存在**（考古确认）；My-repo 5 仓内腐烂的 `UNIFIED-RULES` 残留块按裁定**一并清除**（登记为 N-7） |
| **Trellis 集成** | 见 `research/10` §A：Trellis 无预设机制，但**承诺 TRELLIS 标记块外内容不被覆盖**（模板原文 + `managed-paths.js:4-5`）。故采用「**薄封装 `tavern-init` + 块外插入**」达成"选 tavern 即写入"的体验，**不改 npm 包模板**（否则 `npm update` 即丢失，是前作腐烂的翻版） |

> **不做**：把真源放 `Tavern-repo/Center`（前作已验证会被遗忘）；放本仓 `.trellis/spec/`（污染公开 fork，且规则与 Authority 业务无关）。

### 2.2 规则分层

```
L0 全局通用规则（跨全部 15 仓 + 本仓）
   ├─ 交互、编辑、实例隔离、推送、检索先行、子代理、文档语言
L1 仓库群规则（三个仓群各自的框架/构建约定）
   ├─ My-repo 群：酒馆扩展插件形态（不依赖宿主编译）
   ├─ Myfork 群：宿主 fork 形态（需跟随上游）
   └─ JS-Slash-Runner 群：酒馆助手脚本/工作区形态
L2 单仓特有规则（项目定位、专属命令、坑）
   └─ 只存在于该仓 AGENTS.md 的 TRELLIS 块之外，不参与同步
```

**关键设计**：统一规则块**只承载 L0**（+ 可选 L1）。L2 永远留在各仓自有区域，**同步器永不触碰**——这是"块外内容零改动"承诺的边界。

### 2.3 同步块格式（定稿）

```markdown
<!-- TAVERN-RULES:START v1.1.0 -->
<!-- 本块由 sync-tavern-rules 自动生成，请勿手动编辑（TRELLIS 块外内容不受影响） -->
<!-- 真源: unified-development-rules.md @ v1.1.0 -->
<!-- 同步时间: 2026-09-21T16:40:00+08:00 -->
<!-- 内容哈希: sha256:9f2c1a4e7b30 -->
<!-- 覆盖声明: 本仓若需覆盖某条规则，在下方「项目覆盖」节声明并说明理由 -->

# 统一开发规则（v1.1.0）

> 本块为**自包含全文**，不依赖任何外部路径。

## 规则层级
- **MUST** 硬性要求，违反即审查不通过
- **SHOULD** 强烈建议，除非有充分理由
- **MAY** 可选实践

## L0 全局规则（跨仓群通用）

### 1. 交互规范 (MUST)  ｜来源：与全局 CLAUDE.md §3 同源
（完整正文，原样）

### 2. 检索先行 (MUST)  ｜来源：与全局 CLAUDE.md §1 同源
（完整正文，原样）

...

## L1 仓群规则（本仓所属仓群特有）

### N. My-repo 群：扩展插件形态 (MUST)
（完整正文，原样）

...

## N. 项目覆盖
<!-- 各仓可在此声明覆盖；同步器保留本节的仓库自有内容 -->
<!-- TAVERN-RULES:END -->
```

> **D7 裁定落实**：L0 各条**标注「与全局 CLAUDE.md 同源」**。
> 理由：用户使用约 28 个平台目录 = 多 agent 并用，而全局 CLAUDE.md 只对 Claude 生效，
> L0 进仓块可让 Codex / Cursor / Gemini 等一并读到；标注来源使**日后漂移可被检测**（`--verify` 可扩展为同时比对全局文件）。
> 标注格式：`｜来源：与全局 CLAUDE.md §X 同源`；本仓群特有规则标注 `｜来源：本仓群`。

**格式硬约束**：
1. **原样承载完整正文**——禁止任何摘要、缩写、省略。前作的内容丢失（考古报告问题 2）即由此而来。
2. **不出现任何相对/绝对外部路径引用**（考古报告问题 4）。
3. 块以 `TAVERN-RULES:START <版本>` 起、`TAVERN-RULES:END` 止，**marker 必须唯一且成对**。
4. 「项目覆盖」节是**块内唯一豁免区**：同步器保留该节各仓自有内容，只重建其余部分。

### 2.4 同步器设计

**实现语言**：**Python 3**（非 PowerShell）。理由：Trellis 已依赖 Python；哈希/文本处理/跨平台更稳；且用户环境已验证 `python` 可用。
**位置**：真源仓 `scripts/sync-tavern-rules.py`。

**命令接口**：

| 命令 | 作用 |
| --- | --- |
| `--list` | 列出全部目标仓库与目标文件 |
| `--dry-run` | **默认行为**。打印将发生的全部变更（新建/更新/跳过 + 行数增减 + 首末差异行），**不写盘** |
| `--apply` | 真正写盘（需显式指定） |
| `--verify` | 只读遍历目标，比对块哈希 vs 真源，报告漂移与缺失 |
| `--repo <name>` | 限定单个仓库（便于灰度试跑） |

**算法**：
```
读真源 → 渲染块文本 → 计算 sha256(块正文) → 得到 H
对每个目标仓的每个目标文件:
    若文件不存在 → 记录「新建」
    若存在且有 TAVERN-RULES 块:
        提取现有块 → 算其哈希 H'
        若 H' == H → 跳过（幂等）
        否则 → 保留「项目覆盖」节内容 → 替换整块 → 记录「更新」
    若存在但无块:
        按锚点插入（紧跟 TRELLIS 块之后；无 TRELLIS 块则追加到文件末尾）→ 记录「插入」
    其余内容一律不动
```

**幂等性保证**：块中「同步时间」会使文本变化，但**哈希只对块正文计算**（不含时间戳行），因此第二次运行 `H' == H` → 跳过。这同时满足 AC-2 的"连续两次 diff 为空"。

**安全保证**：
- 默认 `--dry-run`，`--apply` 必须显式给出（防止误写 15 仓）
- 写盘前对原文件生成 `.bak`（或在纯净 git 工作区下运行，用 git 兜底）
- 任何目标文件若**不含 marker 但含疑似规则内容** → 报错中止而非盲目追加

### 2.5 前作过时条目的修正（R2.8）

| 条目 | 前作原文 | 修正为 |
| --- | --- | --- |
| 实例路径 | `D:\Repo\Instance\Real\Luker\*`、`D:\Repo\Instance\Test\SillyTavern\*` | `D:\Repo\Tavern-repo\Instance\Real\*`、`D:\Repo\Tavern-repo\Instance\Dev\*`（**无 `Test` 目录**） |
| 子代理模型 | 固定 `gemini-3-flash-preview` | 本项目一律 `DeepSeek-V4-Flash[free]`（`claude-haiku-4-5-20251001`），禁止其他 |
| 真源链接 | `../../Center/...` | 移除（块自包含） |
| 实例更新方式 | 正确，保留 | 保留 |

### 2.6 三个仓群的差异（L1）

| 仓群 | 仓库数 | 形态 | L1 要点 | 数据来源（已交付） |
| --- | --- | --- | --- | --- |
| `My-repo` | 7 | 酒馆扩展/工具插件（`manifest.json` + `index.js` 单文件产物为主） | 前端插件须可独立运行；后端增强走 Authority 且**必须可降级**；事实源在服务端原生目录；CSS 双前缀 | ✅ `research/01`（42KB，12 条共性）→ 真源 `rules/groups/my-repo.md`（14 条） |
| `Myfork` | 3 | 宿主 fork（PureTavern）+ 插件（Timelines、Authority） | 需跟随上游；改上游需拆单一功能 PR；原生数据源唯一；Dev/Real 只靠端口与路径区分 | ✅ `research/02`（36KB，10 条共性）→ 真源 `rules/groups/myfork.md`（14 条） |
| `JS-Slash-Runner` | 5 | 酒馆助手脚本 + 工作区模板 | 遵守酒馆助手宿主 API 约定；禁 `DOMContentLoaded`；iframe 布局禁令；zod 4 约定 | ✅ `research/03`（42KB，20 条共性）→ 真源 `rules/groups/js-slash-runner.md`（20 条） |

---

## 三、Skill 体系设计

### 3.1 落点与命名

- **落点**：`C:\Users\caocaobi\.agents\skills\<name>\SKILL.md`（用户级）
- **接通**：symlink `C:\Users\caocaobi\.claude\skills\<name>` → `C:\Users\caocaobi\.agents\skills\<name>`（沿用该目录现有惯例）
- **命名**：统一 `tavern-` 前缀 + kebab-case，与本机已有的 `lark-*` 系列同构，避免与通用 skill 撞名。

### 3.2 候选 skill 清单

| # | 名称 | 触发场景 | 素材来源 | 依赖 |
| --- | --- | --- | --- | --- |
| S1 | `tavern-luker-plugin-dev` | 开发/调试 Luker 扩展或服务端插件时 | Luker 官方开发文档 | R4.1 |
| S2 | `tavern-authority-integration` | 让插件接入 Authority 后端增强时 | `research/04-plugin-authority.md` | 已有 |
| S3 | `tavern-host-compat` | 处理 ST/Luker/PT/TT 四宿主差异时 | B5 实测记录 + 各仓 host-bridge | 部分已有 |
| S4 | `tavern-instance-safety` | 涉及本地实例、端口、E2E 测试时 | R5 调查结论 | R5 |
| S5 | `tavern-dev-workflow` | 在本仓群开任务、提 PR、拆分变更时 | R1 提炼结果 + Trellis 经验 | R1 |
| S6 | `tavern-browser-automation` | 需要浏览器自动化验证插件 UI 时 | R5.2 结论 | R5 |

> S3 与 S6 可能重叠，合并与否在 R5 结论出来后判定。
> **S2 可立即编写**（素材已齐备）；S1/S4/S5/S6 待对应调查完成。

### 3.3 SKILL.md 模板

```markdown
---
name: tavern-xxx
description: <一句话说明做什么 + 明确触发场景，供 agent 判断何时加载>
---

# <标题>

## 何时用
## 前置条件
## 操作步骤
## 常见坑（含真实案例与后果）
## 验证方式
## 相关
- [[tavern-yyy]]  ← 用双链互指
```

### 3.4 去重检查（R4.5）

现有与本主题**可能**相近的 skill，需逐一比对：

| 现有 skill | 是否重叠 | 处置 |
| --- | --- | --- |
| `fe-offline-design`（零外部依赖/单文件原型/双击即运行） | 部分重叠（前端插件也可适用） | 只在 `tavern-dev-workflow` 中**引用**，不复制 |
| `fe-ui-inspect`（DOM 计算样式与布局盒模型诊断） | 与 S6 相关 | S6 应**引用**它而非重写 |
| `trellis-*`（工作流） | 不重叠 | 在 S5 中引用 |
| `lark-*` | 不重叠 | — |

**结论**：S5/S6 必须写成"**编排器**"（何时用哪个已有 skill），而非重复其内容。

---

## 四、统一开发 / 测试环境规则设计

> 具体实例与端口数据由 R5 调查（`research/06-dev-env-instances-ports.md`）提供；本节只定**规则形态**。

### 4.1 实例矩阵（实测，2026-09-21）

| 实例 | 路径 | 版本 | 类型 | 编译要求 | 实测端口 | 数据敏感度 |
| --- | --- | --- | --- | --- | --- | --- |
| Dev SillyTavern | `Instance/Dev/SillyTavern` | 1.18.0 | clone | 否 | **8001** | 🟡 |
| Real SillyTavern | `Instance/Real/SillyTavern` | 1.18.0 | **安装版（真实数据）** | 否 | **8002** | 🔴 **只读，绝对禁止改动** |
| Dev Luker | `Instance/Dev/Luker` | 2.7.0 | 源码 clone | 否 | **8003** | 🟡 |
| Real Luker | `Instance/Real/Luker` | 2.7.0 | **安装版（真实数据）** | 否 | **8004** | 🔴 **只读，绝对禁止改动** |
| Dev PureTavern | `Instance/Dev/PureTavern` | 0.1.12 | pnpm monorepo clone | 待核 | 未采集 | 🟡 |
| Real PureTavern | `Instance/Real/PureTavern` | 0.1.12 | 安装版 | 待核 | 未采集 | 🔴 |
| Dev TauriTavern | `Instance/Dev/TauriTavern` | 2.2.0 | clone（**无 `node_modules`**） | **是** | 未采集 | 🟡 |
| Real TauriTavern | `Instance/Real/TauriTavern` | 2.2.0 | 安装版（**含 `node_modules`**） | **是** | 未采集 | 🔴 |
| Dev `nocturne_memory` / `Tavern-Viewer` / `TavernHeadless` | `Instance/Dev/*` | — | 辅助项目 | — | — | 🟡 |

**关键实测发现**：
- **Dev 与 Real 各宿主版本完全一致**（Luker 同为 2.7.0、ST 同为 1.18.0、PT 同为 0.1.12、TT 同为 2.2.0）→ 版本不能作为区分 Dev/Real 的依据，**只能靠端口与路径**。
- **TauriTavern 是唯一需要编译的宿主**：Dev 侧缺 `node_modules`，克隆后不可直接运行；Real 侧含 `node_modules`。
- `Instance/Dev` 另有 `Tavern-Viewer`、`TavernHeadless`、`nocturne_memory` 三个辅助项目（Real 侧无）。
- 数据佐证：`酒馆项目性能分析报告.md`（2026-08-28）统计 Real Luker `data` ≈ 2.20GB / 1024 个聊天，Dev Luker `data` ≈ 1.32GB / 633 个聊天，且**两者 Git 来源不同**。

### 4.2 端口分配设计（原则）

> **重要更正**：设计初稿曾假设"端口分段分配（8x00 ST / 8x1x Luker）"。**实测表明现状并非分段，而是 8001→8004 顺序分配**，且 **Dev/Real 成对错开、四者互不冲突**：

```
8001 Dev SillyTavern     8002 Real SillyTavern
8003 Dev Luker           8004 Real Luker
```

**因此"防止冲突"的原始需求实际上已被满足**——现状无冲突。真正需要解决的问题降级为：

1. **可辨识性**：8001/8002 相差 1、8003/8004 相差 1，人眼极易把 Real 误当 Dev 操作。**风险不在冲突，在误连真实实例。**
2. **PT/TT 尚未分配固定端口**（本次未采集到），未来新增实例有冲突可能。

**修正后的建议**（仍属原则，落地需批准）：
- **优先做"防误连"而非"防冲突"**：为 Real 实例配置显眼的前缀标识或被禁止的开发期访问手段，比改端口号更直接有效。
- 若要改端口，采用**分族可辨识**方案：`8x00/8x01` 段给 ST、`8x1x` 段给 Luker、`8x2x` 段给 PT、`8x3x` 段给 TT，族内 Dev 为 +0、Real 为 +1（例：Dev Luker 8011 / Real Luker 8012）。此方案**会改动 Real 实例配置**，与"实例只读"红线冲突，**故默认不实施**，仅在用户明确要求时执行。
- **只出方案 + 具体 diff 预览**，由用户逐条批准后再改。

### 4.3 浏览器自动化设计（原则）

1. **优先复用已有能力**：先探测本机是否已装 Playwright / Puppeteer / MCP 浏览器服务，有则复用，不新装（检索先行）。
2. **测试实例隔离**：E2E 一律对 `Instance/Dev/*` 运行，**禁止对 `Instance/Real/*`**（该实例含真实数据）。
3. **脚本与断言入库**：自动化脚本放在被测插件仓的 `test/e2e/` 下，与单测同源管理。
4. **产物留证**：失败时保留截图 / console 日志 / DOM 快照，路径写入任务 `research/`。

### 4.4 经验留存设计

回答用户的"怎么留下经验"：

| 层级 | 载体 | 内容 |
| --- | --- | --- |
| **单仓** | 该仓 `AGENTS.md` 的 L2 区（TRELLIS 块外） | 项目特有坑与命令 |
| **跨仓** | 统一规则真源的 `## 坑与教训` 节 | 影响多仓的坑；**每条必须含真实案例与后果** |
| **可复用操作** | `~/.agents/skills/tavern-*` | 成体系的操作流程 |
| **任务级** | `.trellis/tasks/<id>/research/` | 一次性调查结论，随任务归档 |

**硬规则**：经验必须**带证据与后果**（"违反会怎样"），否则不进规则——这是从前作"规则只有标题没有正文"的失败中反推的。

---

## 五、任务地图

### 5.1 父任务

**`09-21-multi-repo-rules-skills-survey`（本任务）** — 持有需求真源、任务地图、跨子任务验收标准；**自身不直接实现业务功能**。

### 5.2 子任务拆分建议（元任务线）

| 子任务 | 范围 | 依赖 | 优先级 | 可独立验收 |
| --- | --- | --- | --- | --- |
| **C-01 统一规则真源建立** | 依 D1 裁定落真源；MUST/SHOULD/MAY 三级；修正前作过时条目 | **D1** | P0 | ✅ 真源文件存在且内容完整 |
| **C-02 规则同步器** | Python 同步器；`--dry-run`/`--apply`/`--verify`；幂等、无损、自包含 | C-01 | P0 | ✅ 单仓灰度跑通 + 幂等验证 |
| **C-03 全仓同步与校验** | 对 15 仓执行并验证（块外零改动、无死链） | C-02 + **D3** | P0 | ✅ AC-2 全部通过 |
| **C-04 Luker 开发文档 skill 化** | S1（+ S6 素材） | R4.1 | P1 | ✅ skill 通过结构校验 |
| **C-05 仓库经验 skill 化** | S5（+ 按需 S3） | R1 结果 | P1 | ✅ 无重叠且可触发 |
| **C-06 统一开发/测试环境规则** | S4 + 端口方案 + 自动化选型 + 经验留存 | R5 调查 + **D5/D6** | P1 | ✅ AC-5 全部通过 |
| **C-07 全景地图与意图确认** | 15 仓 + Authority 全景；在用/在开发标注 | R3 | P1 | ✅ 用户确认 |
| **C-08 Authority 四宿主可用性验证** | 实测 ST/Luker/PT/TT 装 Authority 是否可用 | — | **P0** | ✅ **已完成**（`research/07`） |
| **C-09 生态与 PR 策略** | 哪些插件化/哪些提 PR/后端插件路线/PR 拆分 | C-08 + **D4** | **P0** | ✅ 产出可执行拆分清单 |

> **C-08 已验毕（`research/07`）**：ST ✅ 完整可用；**Luker ✅ 核心可用 / ⚠️ Host Bridge 不可用**；PT ❌；TT ❌。
> 关键结论：Authority 的**能力内核与宿主解耦**（Host Bridge 失败仅 `console.warn`，不阻断加载），
> 因此「用 Authority 增强」的主线在 Luker 上**成立**，B2/B4/B5 三条业务线**不需改路线**；
> 但须新增硬约束「跨宿主插件禁止依赖 Host Bridge」，且 PT/TT 必须走纯前端降级。

### 5.3 业务线登记（**不在本任务范围**，仅登记供后续开任务）

| 线 | 对应需求 | 关键前置 | 备注 |
| --- | --- | --- | --- |
| L1 | chatsys 概念定稿（分支分组/绑定/切分支/模式命名） | **需 grill-me**；❓开放问题最多 | 必须出 demo + 举例 + 画图 |
| L2 | chatsys-frontend 重构（摒弃现有实现） | L1 | 默认：转换聊天记录、保留原 jsonl、库与 jsonl 同步 |
| L3 | chatsys-backend（通用后端） | L1 | timeline 也可获增强 |
| L4 | timeline（jsonl 屎山雕花线） | — | **与 L2 互不替代**，面向"不改聊天文件"的用户 |
| L5 | shujuku-rebuild 前端极限 + 后端转交 | — | 含"为何设置项多却不智能"调研课题 |
| L6 | zip-converter 增强 | ❓p2p vs 中转格式决策 | 含 git 浅层化、多包后台导入 |
| L7 | 隐藏助手二开（从 x 楼保留 / 每 y 楼从 z 楼保留） | ❓语义待澄清 | |
| L8 | 酒馆美化（仿 agent desktop） | — | |
| L9 | 酒馆助手脚本一键导入导出 + 智能深色模式 | — | |
| L10 | ST-copilot（侧边栏、多实例、分屏） | — | |
| L11 | luker DEV PR 三件套（数据库设置遮罩/拖拽预设/扩展页懒扫描） | — | 走 `Dev/Luker` 仓交付 |
| **L12** | **插件注册表 / 统一调控台**（新发现缺口） | 需 C-08 结论 | 回答用户"所有插件的统一调控"：Authority 已有**能力治理**四层（权限/隔离、Feature Flags、Companion Modules、Agent 工具注册），但**缺"插件清单/依赖矩阵/冲突检测/跨宿主可用性登记"**。建议以现有 `module-discovery-service` 为基础做**只读发现**，不新造机制。详见 `research/10` §B.3 |

### 5.4 本次调查新发现的待办（原草稿需求中缺失，但不做会持续踩坑）

| # | 事项 | 性质 | 建议归属 |
| --- | --- | --- | --- |
| **N-1** | **Dev\Luker 的 `origin` 误指上游 `SillyTavern/SillyTavern`**——在此仓 `git push origin` **会误推上游** | 🔴 Git 配置缺陷 | 独立小任务，优先做 |
| **N-2** | **Real\Luker 安全开关全面放宽**（`whitelistMode:false`、`securityOverride:true`、`cors:["*"]`、`0.0.0.0:8004`）+ basicAuth 仍是出厂明文 `password` | 🔴 安全风险 | 独立任务 |
| **N-3** | **Dev\TauriTavern 缺 `src-tauri/` 无法构建**，与"E2E 只用 Dev 实例"红线**直接冲突** | 🟠 阻塞 TT 侧开发 | 独立任务 |
| **N-4** | **端口 3000 三方撞车**（Tavern-Viewer + TavernHeadless）且被系统 svchost(PID 5908) 实占 | 🟠 端口冲突 | 并入 C-06 |
| **N-5** | **`8000` 默认值重灾区**（6 处） | 🟡 配置隐患 | 并入 C-06 |
| **N-6** | **Real\PureTavern 疑似冗余**（与 Dev 版 diff 为空、均无 `data/`） | 🟡 待归档决策 | 需你拍板（属删除范畴） |
| **N-7** | 清除 My-repo 5 仓内腐烂的 `UNIFIED-RULES` 残留块 | 🟡 清理 | 并入 C-03（**你已指示删除**） |
| **N-8** | JS-Slash-Runner **3 个仓的 `@.cursor/rules/*.mdc` 引用全部悬空** | 🟠 agent 静默拿不到规则 | 并入 C-06 或独立 |
| **N-9** | Authority fork **未配 `upstream` remote** | 🟠 阻塞上游对齐与 PR 拆分 | 并入 C-09（D4 前置） |

---

## 六、风险与回滚

| 风险 | 影响 | 缓解 | 回滚 |
| --- | --- | --- | --- |
| 真源再次腐烂 | 规则体系失效 | 落 `~/.agents`（已 git）+ 补 remote；块自包含（真源丢失副本仍可用） | 从任一副本块反重建真源 |
| 同步器误写 15 仓 | 大面积污染 | 默认 dry-run；`--apply` 显式；写前 `.bak`；要求干净 git 工作区 | `git checkout -- .` 逐仓回滚 |
| 块外内容被覆盖 | 丢失项目自有规则 | marker 定位替换；写前断言"仅替换块内区间" | 同上 |
| 污染公开 fork | 对外 PR 被拒/泄露 | 同步前确认目标文件是否已进版本库；必要时先补 `.gitignore` | 从暂存区移除 |
| Authority 不支持 Luker | 主线方案崩塌 | **C-08 已验毕**：Luker 支持服务端插件（与 ST 逐字节同形）；仅 Host Bridge 不可用且**不影响内核** | 仍保留纯前端降级路径 |
| **插件误依赖 Host Bridge** | 在 Luker 上静默失去聊天修订/事务语义，出现难排查的数据不一致 | 统一规则新增硬约束：**跨宿主插件禁用 Host Bridge**；须明确列出 Authority 的「可移植子集 / 不可移植子集」 | 改用 Kernel API 自行实现 |
| **误连 Real 实例** | 真实数据被测试污染 | 端口仅差 1，辨识度低是**当前最大风险点**；建议优先做防误连标识而非改端口 | 无（不可逆，列红线） |
| 子代理端点熔断 | 调查中断 | 降并发、失败即落盘部分结果、重试 | — |
| 实例数据被误改 | 用户真实数据丢失 | 硬红线：实例只读；E2E 只用 Dev | 无（不可逆，故列为红线） |

---

## 七、执行结果与剩余裁定

### 7.1 已建成（2026-09-21/22）

真源仓 `D:\Repo\Tavern-repo\tavern-harness`（远程 `github.com/jiozhaoyue/tavern-harness`，**私有**）：

| 目录 | 内容 |
| --- | --- |
| `rules/L0-global.md` | L0 全局规则 **15 条**，每条带「原因 + 违反后果」 |
| `rules/groups/{my-repo,myfork,js-slash-runner}.md` | L1 仓群规则 **14 / 14 / 20 条** |
| `rules/pitfalls.md` | 坑与教训 **13 条**（每条带真实案例与后果） |
| `scripts/sync_tavern_rules.py` | 同步器：幂等（哈希只算正文）、无损、块外零改动、`--dry-run/--apply/--verify` |
| `scripts/test_sync_tavern_rules.py` | 沙箱回归 **24 项断言** |
| `scripts/remove_legacy_rules_block.py` | 前作残留块清理（默认 dry-run） |
| `scripts/tavern-init.mjs` | 新项目初始化薄封装（**不改 Trellis npm 包模板**） |
| `docs/environment-defects.md` | 本机缺陷清单，**不同步、不公开** |
| `targets.json` | 15 仓登记（分组 / 目标文件 / Git 状态 / 上游派生标记） |

**同步落地**：16 个目标文件、11 个仓，纯新增、块外零改动；`--verify` 14/14 零漂移；前作残留块 3 仓各删 284 行纯删除。

**设计修正（实测驱动）**：§2.3 的块格式增加「头部与正文之间必须有空行」这条硬约束——
首版缺该空行导致 `split_block` 把正文标题误判为头部，**幂等性不成立**（沙箱测试暴露）。
另新增「按 `realpath` 去重目标文件」——JSSR 仓群的 `AGENTS.md`/`GEMINI.md` 是指向 `CLAUDE.md` 的符号链接，
按文件名逐个写入会叠出三个块（详见 `research/11` §六 与真源 `pitfalls.md` P-4）。

### 7.2 剩余待裁定

| # | 事项 | 影响 |
| --- | --- | --- |
| D5 | 浏览器自动化选型（Playwright / chrome-devtools-mcp / 两者并用） | 阻塞 C-06 与 `tavern-browser-automation` skill |
| D6 | 端口分配（维持 8001–8004 + 防误连标识 / 分族改造） | 阻塞 C-06 |
| — | 各仓规则块是否推送到云端（当前仅本地提交） | 不推送则规则只在本地生效 |
| — | `00-bootstrap-guidelines` 职责冲突（填充 `.trellis/spec/`） | 阻塞 H-4 |
| — | 全局规则 §4.5/§4.6 在 `.codex`/`.agents` 缺失 | 与「三处同步」声明不符 |

完整待办与开工方法见 [`research/12-backlog-and-handoff.md`](./research/12-backlog-and-handoff.md)。
