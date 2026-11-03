# 设计 — Trellis tavern 模板与云同步（子任务 C）

> 上游依据：父任务 `prd.md` 的 N1–N8（原生机制实测）；本文件只写**怎么做**。
> 本文件的每条"契约"都附实测出处（Trellis 0.6.16 全局包 `dist/` 内的代码路径）。

---

## 1. 分工边界（本设计的总纲）

| 层 | 谁管 | 依据 |
| --- | --- | --- |
| `.trellis/workflow.md` | **Trellis 原生市场**（`trellis workflow -m <src> -t tavern`） | `N1` |
| `.trellis/spec/**` 的 tavern 种子 | **Trellis 原生注册表**（`registry.spec` + `trellis update`） | `N2/N7` |
| `.trellis/config.yaml` 偏好、`registry.spec` 自举 | **补轨** `tavern-init.mjs` | 原生无市场通道（父 PRD「覆盖不到的部分」） |
| 规则块（`AGENTS.md`） | **既有同步器** `sync_tavern_rules.py`（补轨调用） | 同上 |
| 平台 agent 的模型定制 | **不做**（用户 2026-09-25 裁定：删除自写门禁，全部默认） | 子任务 D |

**不变量**：补轨**不自造下载逻辑**——模板内容一律由 `trellis workflow` / `trellis update` 拉取（AC-P4）。

---

## 2. 市场仓布局（`tavern-harness`）

```
tavern-harness/
├─ index.json                        # 市场索引（新增）
├─ workflows/tavern/workflow.md      # type:"workflow" → path 必须是**单文件**（N6）
├─ specs/tavern/                     # type:"spec" → path 是**目录**
│  └─ tavern/                        # → 目标仓落为 .trellis/spec/tavern/（见 2.2）
│     ├─ host-compat.md
│     ├─ degradation.md
│     └─ offline-frontend.md
└─ rules/ scripts/ targets.json …    # 既有，不动
```

### 2.1 `index.json` 契约（实测）

`dist/utils/workflow-resolver.js:102-116`：只取 `type === "workflow"` 的条目，且跳过 `id === "native"`；
`dist/utils/template-fetcher.js` 的 `downloadTemplateById` 明确 **`type !== "spec"` 直接拒绝**（"only 'spec' is supported"）。
故索引至少两条：

```json
{
  "version": 1,
  "templates": [
    { "id": "tavern", "type": "workflow",
      "name": "Tavern (SillyTavern repo group)",
      "description": "native workflow + Windows python adaptation",
      "path": "workflows/tavern/workflow.md",
      "tags": ["tavern", "sillytavern"] },
    { "id": "tavern-spec", "type": "spec",
      "name": "Tavern spec seeds",
      "description": "cross-host compatibility / degradation / offline-frontend checks",
      "path": "specs/tavern",
      "tags": ["tavern", "spec"] }
  ]
}
```

> **两个 id 必须不同**：`workflow` 与 `spec` 是两套独立的查找（前者按 id 命中 `type:"workflow"`，
> 后者由 `registry.spec.template` 指定并校验 `type:"spec"`）。同名会让两处语义打架。

### 2.2 spec 目录如何映射到目标仓（实测推导，**关键**）

`dist/commands/update.js` 的 `collectRegistrySpecTemplates()`：

```js
const result = await downloadTemplateById(tempRoot, config.template, "overwrite", template, registry, undefined, probe.backend);
return collectDirectoryFiles(path.join(tempRoot, PATHS.SPEC), PATHS.SPEC);
```

`downloadTemplateById` 的落点 `destDir = getInstallPath(cwd, "spec")` = `<cwd>/.trellis/spec`，
即：**索引条目的 `path` 目录内容被下载进 `<temp>/.trellis/spec/`，随后整目录收集映射为 `.trellis/spec/`。**

→ 结论：**索引 `path` 指向的目录内部，要再放一个 `tavern/` 子目录**，目标仓才会得到
`.trellis/spec/tavern/*.md`（本设计选定的命名空间，用户 2026-09-25 裁定）。

> 备选（未采用）：把 spec 树放在**仓根** `.trellis/spec/**`，走 `fetchRegistrySpecTemplates()`
> 的整仓下载分支。该分支仅在"注册表无 index.json"时触发（`probe.isNotFound`），
> 与本仓有 `index.json` 的事实冲突，故不可用。

### 2.3 源形式（N8 + 实测）

`dist/utils/template-fetcher.js:116-123` 的映射表明确：`git@github.com:org/repo` 属
**Public SSH → native（giget）后端、无需自建 host**。故市场源写：

```
git@github.com:jiozhaoyue/tavern-harness
```

`gh:jiozhaoyue/tavern-harness` 走 `raw.githubusercontent.com`，对本私有仓返回 **404**（N8 实测）→ 禁用。

---

## 3. workflow 模板内容（`workflows/tavern/workflow.md`）

**最终做法（经两次实测修正）**：**原生模板逐字节原样** + **末尾纯追加一节** `## Tavern Repo Group Additions`（24 行）。
对原生侧的删除/修改行数 = **0**（断言：`diff <native> <template> | grep -c '^<'` = 0）。

### 3.1 为什么**不**自带 `python3→python` 适配（原设计已修正）

实测（对照实验）：
- `trellis init --workflow native` 的新项目 → `workflow.md` 中 `python3` = **0**、`python` = **32**
- 同机上 `trellis init --workflow tavern -m <ssh源>` → 落盘同样 `python3` = 0、`python` = 32

→ CLI 在 Windows 上会**渲染生成物**里的 `python3` 为 `python`（init 输出原话：
"Windows detected: Trellis rendered Python commands as 'python' in generated hooks, settings, and help text"）。

**故模板自带该适配是有害的**：会让非 Windows 使用者拿到未定义的 `python` 命令。
改为保持 `python3`（原生原样），由 CLI 按平台渲染 → 跨平台正确。

### 3.2 追加节的必要性（PRD R2.1 的落实）

先前设计为求极简省略了这节，属对 PRD R2.1 的偏差（R2.1 明列"端口段位纪律与实例隔离的**指向性提示**"）。
现补上，内容是**只给条目号指向**、零正文复制：

| 指向 | 条目 |
| --- | --- |
| 端口段位 / 实例隔离 | L0-16 / L1-MF-15 |
| 规则块入口与"改规则去真源仓" | `TAVERN_RULES` 块 + `sync_tavern_rules.py` |
| 本仓群特有纪律 | L0-9 / L0-10 / L0-11 / L0-12 |
| Windows 命令渲染说明 | 见 3.1 |

并**显式写明本模板刻意不做的事**（不写模型名门禁、不复制规则正文）及理由——把"为什么没有"也变成可读的约定。

### 3.3 可合并性（R2.3）

- 纯追加 → 上游 `native` 更新时，任何改动都落在追加节**之前**，不产生冲突。
- 非 `native` id 的 workflow 属**用户管理内容**：`dist/commands/workflow.js:103-118` 的 `applyHashContract`
  对非 native 模板**删除哈希条目**，即 `trellis update` 不会覆盖它。

---

## 4. spec 种子（`specs/tavern/tavern/*.md`）

### 4.1 划界（用户裁定：按「可执行层内约定」切）

| 层 | 承担什么 | 判据 |
| --- | --- | --- |
| 规则块（`AGENTS.md`） | 强制规则清单：短、跨平台、所有 agent 必读 | 违反即审查不通过 |
| **spec 种子（本设计）** | **层内可执行约定**：能写成命令/断言/grep 的检查项，带证据锚点 | 能被机械检查 |
| skill（`tavern-*`） | 跨项目**流程编排**与经验路由 | 触发式加载、含多步流程 |

spec 页**显式指向** skill 与规则条目，**不复制其正文**（AC-C4 的判据）。

### 4.2 三页种子（每条都可执行）

| 页 | 内容（可执行项举例） | 指向 |
| --- | --- | --- |
| `host-compat.md` | 跨宿主能力判定：用到某能力前先查该能力在本宿主的可用性；**禁止**翻宿主源码找内部函数（API 事实以官方文档为准）；宿主差异必须集中在单一 host-bridge 模块 | skill `tavern-host-compat`、规则 L0-9 / L0-12 / P-13 |
| `degradation.md` | 适配器 + 特性检测 + 静默降级：后端不可用时纯前端路径**必须全功能**；后端调用 fire-and-forget 或显式降级；核心层不感知后端 | 规则 L0-11、P-9 |
| `offline-frontend.md` | 零外部依赖（无 `http(s)://` 外链资源）、单文件自包含、`file://` 可运行（无相对网络请求） | 用户级偏好（不在规则块内，故无重复风险） |

每页格式：**判据（命令/断言）→ 允许 → 禁止 → 证据锚点 → 相关规则/skill 指针**，且**不引用任何任务目录路径**（L0-17）。

---

## 5. 补轨设计（`scripts/tavern-init.mjs` 扩展）

### 5.1 新增步骤（插在规则块同步之前）

`ensureTrellisPrefs(dir, {dryRun})`：

1. 若 `.trellis/` 不存在 → **跳过**并提示（补轨只在 Trellis 项目内有意义）。
2. 读 `.trellis/config.yaml`（不存在则按最小骨架创建）。
3. **幂等合并**（只增不改）：`registry.spec` 自举块
   ```yaml
   registry:
     spec:
       source: git@github.com:jiozhaoyue/tavern-harness
       template: tavern-spec
   ```
   已存在同键则**不覆盖**（`loadSpecRegistryConfig` 会读它，人工改过的值必须保留）。
4. **条件写** `session_auto_commit: false`：仅当 `.trellis/tasks` 或 `.trellis/workspace` 被 `.gitignore`
   排除时写（此时自动提交只会刷 WARN）；否则不动（保持 Trellis 默认 true）。
   实测依据：本仓群仓的 `.gitignore` 普遍排除 `.trellis/tasks/`，`task.py archive` 每次都打
   "git add failed because .trellis/ paths are ignored… Skipping auto-commit" 的长 WARN。
5. **写盘前 `.bak`**（与同步器同风格）；`--dry-run` 只打印将写入的键；任何异常只 `console.warn`，**不阻断**主流程。

### 5.2 命令行表面（向后兼容）

新增参数：`--skip-prefs`（跳过本步）、复用既有 `--dry-run` / `--dir` / `--harness`。

收尾提示追加两条**原生通道**命令（补轨不代劳）：

```
trellis workflow -m git@github.com:jiozhaoyue/tavern-harness -t tavern
trellis update          # 拉取 spec 种子（registry.spec 已写入）
```

---

## 6. 双路径验证设计

| 路径 | 落点（用户裁定） | 断言 |
| --- | --- | --- |
| **新项目** | **全新临时目录**（`mktemp -d`） | `trellis init` → `trellis workflow -m … --list` 列出 tavern 条目 → `-t tavern` 写入后 `.trellis/workflow.md` 含 `python`（无 `python3`）→ `trellis update` 后 `.trellis/spec/tavern/` 三页齐全 |
| **既有项目** | **沙箱副本**（复制本仓 `.trellis/` 结构与若干"本地改动"到临时目录） | 预置的本地改动**仍在**，且 Trellis 报冲突/"Modified by you"而非静默覆盖；同时新增 `.trellis/spec/tavern/` |

留证：命令 + 输出原文；临时目录**用完删除**（R6.4）。`Instance/**` 全程零操作。

> 沙箱副本的构造：从本仓复制 `.trellis/`（含被本地改过的 `workflow.md` 的 python 适配与
> `.codex/config.toml` 的 shell 策略），并在副本里额外改一个 spec 文件当作"用户的本地改动"。

---

## 7. 兼容性与回滚

| 项 | 处置 |
| --- | --- |
| 规则块同步器 | 新增市场文件**不触碰** `rules/`、`targets.json` → `--verify` 必须仍 14/14 零漂移（R1.2，实测断言） |
| 既有仓的 `workflow.md` | 暂不强制替换（`trellis workflow` 默认先问）；本设计只保证"可被选用" |
| 回滚 | 全部改动集中在真源仓 `tavern-harness` 的新增文件 + `tavern-init.mjs` 扩展；`git revert` 即回滚。**不对任何目标仓做写入**（验证只在临时目录） |
| 私有仓可达性 | 依赖本机 GitHub SSH key；README 写明前置条件与替代（公开脱敏仓，属 Out of Scope） |

---

## 8. 明确不做（附理由）

| 项 | 理由 |
| --- | --- |
| 自动轮询同步 | `trellis update` 即同步动词，由使用者显式触发（父 PRD 已定） |
| 公开脱敏市场仓 | 用户已选 SSH 走私有仓 |
| 把规则块纳入市场 | 原生无通道，走补轨（既有同步器） |
| 平台 agent 模型门禁 | 用户 2026-09-25 裁定：全部默认（子任务 D 已删） |
| 改 Trellis 上游 / `node_modules` | 会被 `npm update` 冲掉——前作腐烂的翻版 |
| 用 `-f` 强推 workflow 到既有仓 | 会覆盖各仓本地 python 适配之外的任何自有改动；破坏"本地改动不丢"的验收命题 |
