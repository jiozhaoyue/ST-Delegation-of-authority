# 设计 — 酒馆 skill 正本化与补轨分发

## 1. 为什么是「正本入库 + 补轨」，而不是走 Trellis 市场

**已实测的硬约束**：Trellis 0.6.16 的市场只支持 `type: "spec"`。

`dist/utils/template-fetcher.js:840`：

```js
// Only support spec type in MVP
if (resolved.type !== "spec") {
    return { success: false,
      message: `Template type "${resolved.type}" is not supported yet (only "spec" is supported)` };
}
```

`workflow` 走独立 resolver（`dist/utils/workflow-resolver.js`），`skill` **没有任何市场通道**。
先例仓 `SuooL/trellis-marketplace` 布局里有 `skills/` 目录，但那**不是可用通道**——只是仓布局的装饰。

→ 故 skill 与规则块同命运：**只能走补轨**（薄封装写入 Trellis 管不到的层）。
`AC-P4`（原生性）在本层不适用——原生**没有**这一层。

## 2. 目录布局

```
tavern-harness/
├─ skills/                                  # ★ 正本（入库、版本控制）
│  ├─ tavern-dev-workflow/                  # 迁入 + 路由表更新
│  │  ├─ SKILL.md
│  │  ├─ references/workflow-playbook.md
│  │  └─ agents/openai.yaml
│  ├─ tavern-host-compat/                   # 迁入 + 补强（消歧 + 形态映射）
│  ├─ tavern-luker-plugin-dev/              # 迁入（正文不动）
│  ├─ tavern-authority-integration/         # 迁入（正文不动）
│  ├─ tavern-browser-automation/            # 迁入（正文不动）
│  ├─ tavern-ttavern-dev/                   # ★ 新
│  │  ├─ SKILL.md
│  │  ├─ references/ttavern-api.md
│  │  └─ agents/openai.yaml
│  ├─ tavern-helper-dev/                    # ★ 新
│  │  ├─ SKILL.md
│  │  ├─ references/tooling-index.md
│  │  └─ agents/openai.yaml
│  └─ upstream/                             # ★ 收：原样 + 头部边界声明
│     ├─ tavern-helper-frontend/SKILL.md
│     ├─ tavern-helper-script/SKILL.md
│     ├─ mvu-character-card/SKILL.md
│     └─ mvu-variable-framework/SKILL.md
├─ skills-src/                              # ☆ 不跟踪素材（.gitignore）
│  ├─ docs/                                 #  7 篇散文原件（移动而来）
│  └─ upstream/                             #  上游快照：TT 文档、上游 4 skill 原件
└─ scripts/
   ├─ sync_tavern_skills.py                 # ★ 补轨分发器
   └─ test_sync_tavern_skills.py            # ★ 沙箱回归
```

**为什么上游 4 个放 `skills/upstream/` 而不是散在 `skills/` 下**：
一棵子树即"上游来源"的物理边界，日后 `git diff` / 回灌上游只需看这一目录；分发时按 **basename 展平**。

**为什么目录名 = skill 名**：分发目标 `~/.agents/skills/<name>/` 直接取 basename，零映射表（映射表是漂移源）。

## 3. 同源重复的处理（本任务最易出错处）

| 重复对 | 处理 |
| --- | --- |
| `tavern-helper-frontend` ↔ 规则块 L1-JSR-2/3/4 | 上游 skill **原样收**，头部加边界声明「与本仓群规则块重叠处，以规则块为准」 |
| `tavern-helper-script` ↔ 规则块 L1-JSR-4 | 同上 |
| 7 篇散文 ↔ `mvu-*` 两个上游 skill | 散文**不入库**；知识归并进 `mvu-*` 体系；`tavern-helper-dev` 只指向 |

**边界声明的固定形态**（四份逐字一致，改则四份同改）：

```markdown
<!-- 来源与边界（由 tavern-harness 添加，正文一字未改） -->
> **来源**：`StageDog/tavern_helper_template` · `.agents/skills/<名>/SKILL.md` · commit `<sha>`
> 许可：PolyForm Noncommercial 1.0.0（见上游 `LICENSE`）
> **边界**：本 skill 与 `tavern-harness` 规则块（各仓 `AGENTS.md` 的 `TAVERN-RULES` 块）存在同源内容；
> 重叠处**以规则块为准**，本 skill 提供上下文与细节，不构成第二条权威来源。
> 本项目群的**增量**约定（构建、加载时机、样式分叉等）见规则块 `L1-JSR-*`，不在本 skill 内重述。
```

声明插在 frontmatter **之后**、正文**之前**——`---` 分隔的 frontmatter 必须保持在文件首行，
否则 skill 加载器解析不到 `name`/`description`。

## 4. 补轨分发器契约

### 4.1 与 `sync_tavern_rules.py` 的异同

| 项 | 规则同步器 | skill 分发器 | 为什么不同 |
| --- | --- | --- | --- |
| 默认行为 | `--dry-run` | **同** | 安全默认一致 |
| 幂等 | 正文哈希 | **同**（按文件哈希，不含时间戳） | 同一教训 |
| 备份落点 | 仓外 `.backups/` | **同** | 同一教训（仓内 `.bak` 会顶开脏门禁） |
| `--verify` | 有 | **同** | 漂移可检 |
| **脏工作区门禁** | 脏则拒绝写盘 | **不用** | ★ `~/.agents` 长期带 400 项未提交改动（skills_disabled 迁移未收口）→ 该门禁会**恒真**，等于永久需要 `--allow-dirty`。改用「逐文件比对 + 只写有差异的文件 + 写盘前备份」 |
| 目标 | 15 仓的 `AGENTS.md` | 1 个目录（`~/.agents/skills/`） | skill 是全局资源，不分仓 |

### 4.2 四个动作

```
--list                     枚举正本里的 skill（名 / 文件数 / 哈希）
--dry-run  （默认）         列出将新建/更新/删除的目标文件 + 差异摘要
--apply                    写盘（有差异才写；写前备份到 .backups/skills/<ts>/）
--verify                   正本 vs 目标逐文件哈希比对，报漂移（只读）
```

**删除语义**：正本里没有的 skill **不删**目标（`~/.agents/skills/` 还装着 118 个非本仓群 skill）。
`--prune` 需显式给出且只作用于**正本曾纳管过**的名字（记录在 `.backups/skills-manifest.json`）。

### 4.3 符号链接

`~/.claude/skills/<name>` → `~/.agents/skills/<name>`（沿用既有约定，`ls -la` 已证）。
分发器负责：目标链接不存在则创建；存在但不是链接指向正确位置则**报错不改**（人工确认）。

> 注意与规则块的区别：规则分发**禁止**符号链接（P-4，失效是静默的）。
> skill 这里可以用，是因为**本机 Claude Code 只扫 `~/.claude/skills/`**，
> 而 `~/.agents/skills/` 是跨平台（Codex/Gemini）的公共真源——符号链接是既成约定，且 `--verify` 可检出断裂。

## 5. `tavern-ttavern-dev` 内容骨架

素材（先取全文再写）：`Darkatse/TauriTavern` 的 `ExtensionDEV.md`、`docs/FrontendHostContract.md`、`docs/FrontendGuide.md`、`docs/API/`。

| 节 | 内容 | 出处 |
| --- | --- | --- |
| 何时用 / 不适用 | TT 上的**纯前端扩展**开发；服务端插件不适用（指向 host-compat） | — |
| 与 ST 扩展的关系 | third-party 目录兼容、local 优先于 global | `ExtensionDEV.md` §1.1 |
| 窗口化 payload | `getContext().chat` 只反映窗口内消息；`findLastMessage()` / `searchMessages()` / `history.*` 透明处理窗口边界 | `ExtensionDEV.md` 开头 |
| 专属 API 面 | `findLastMessage()` / `searchMessages()`（CJK 优化）/ `store.*` / `metadata.*` | `ExtensionDEV.md` |
| 与 ST 原生的取舍 | 用了 TT 专属 API ⇒ 该扩展**不再跨宿主**（L0-12 判定入口） | 推导，须标注 |
| 已知边界 | TT 无服务端插件机制；本 skill 只覆盖纯前端 | `tavern-host-compat` 矩阵 |

## 6. `tavern-helper-dev` 内容骨架

**纯路由，零正文复制**：

| 节 | 内容 |
| --- | --- |
| 判型流程 | `src/xxx`：有 `index.ts`+`index.html` → 前端界面；仅 `index.ts` → 脚本 |
| 路由表 | 写前端界面 → `tavern-helper-frontend`；写脚本 → `tavern-helper-script`；涉及 MVU 变量 → `mvu-variable-framework`；写 MVU 角色卡 → `mvu-character-card` |
| 本仓群增量约定 | 只写条目号：`L1-JSR-1`（加载时机）、`L1-JSR-2`（index.html）、`L1-JSR-3`（iframe 高度）、`L1-JSR-4`（样式分叉）、`L1-JSR-5`（接口优先级）、`L1-JSR-6`（技术栈）、`L1-JSR-7`（klona）… |
| 上游文档 | URL 列表（JS-Slash-Runner 文档站、`tavern_helper_template`、`stagedog.github.io`） |
| 硬边界 | **不重述**上游 skill 正文；改产物形态的规则以规则块为准 |

**自检**（AC-5）：`grep -E "vh|min-height|teleportStyle|createScriptIdIframe"` 必须零命中。

## 7. 风险与反制

| 风险 | 反制 |
| --- | --- |
| 迁移抄错 → 覆盖掉本机能用的 skill | 迁移后**逐字节 diff**（AC-2）；分发器写盘前备份到仓外 |
| 上游 skill 被"顺手改好" → 丢回灌能力 | AC-3 用逐字节 diff 钉死「差异只在头部声明节」 |
| `~/.agents` 的 400 项未提交改动被误提交 | 分发只写 `skills/<name>/` 子树；提交时只 `git add` 该子树 |
| 自撰 skill 里无意抄了上游正文 | AC-5 的 grep 自检 + 人工复核 |
| 7 篇原件"移动"实为删除 | 移动后断言目标存在且字节数一致；`skills-src/` 被 `git check-ignore` 确认忽略 |
| 规则正文被误改 | AC-13：收尾 `sync_tavern_rules.py --verify` 必须仍 14/14 |
