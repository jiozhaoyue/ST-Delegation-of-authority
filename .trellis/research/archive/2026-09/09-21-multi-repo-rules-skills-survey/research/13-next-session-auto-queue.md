# 下一轮自动执行队列（Zero-Question Contract）

> 生成：2026-09-22 ｜ 对应任务 `09-21-multi-repo-rules-skills-survey`（父任务）
> **本文是"继续 trelli 任务"的唯一入口。** 接手者读到此文即视为**已获得全部必要授权**，无需再向用户提问。
> 上游：`12-backlog-and-handoff.md`（历史待办全集）｜`prd.md`（需求与验收）｜`implement.md`（执行计划）

---

## 零、契约（用户 2026-09-22 明确授权）

用户原话：

> 「我新会话写**继续 trelli 任务**，这些就全部自动做了，**不用问我**。本轮什么都不要做，只写文档。」

**因此本队列的执行规则是：**

| 规则 | 说明 |
| --- | --- |
| ✅ **不再提问** | 本队列全部条目视为已裁定。**禁止**再用 `AskUserQuestion` 询问方向、选型、优先级 |
| ✅ **自动执行** | 按 Batch 0 → 5 顺序推进，遇阻塞则跳过并记录，继续下一个 |
| ✅ **自动勾选** | 执行时**实时**更新 `implement.md` 与子任务 `prd.md` 的复选框，禁止事后批量补勾 |
| ⚠️ **三条例外仍需一次确认** | ① **删除**已有文件/目录；② **不可逆**操作（改 remote URL、推上游、`reset --hard`）；③ **对外发布**（push 到公开 fork）。除此之外一律自动做 |
| 🚫 **红线不变** | `Instance/Real/**` 及 `Instance/Dev/**` 除本队列 **N-2 单项**外仍为只读；E2E 只允许 Dev 实例 |

---

## 一、本轮（2026-09-22）新增裁定汇总

| # | 决策点 | **用户裁定** | 落实位置 |
| --- | --- | --- | --- |
| **N-1** | Dev/Luker `origin` 误指上游 | 🔒 **「此仓库为只读，不会触发除了拉取（pull）以外的任何操作；将相关的任务和提示删除，永不改动」** | 本队列 **Batch 1-A**（= **关闭该待办**，不做任何 git 配置改动） |
| **N-2** | Real/Luker 安全姿态 | 仅关 **`enableServerPluginsAutoUpdate`**（其余项不动） | 本队列 **Batch 1-B** |
| **推送** | 各仓规则块是否上云 | **保持仅本地提交**（维持 E 阶段裁定，不推送） | 本队列 **Batch 5-A** |
| **D5** | 浏览器自动化选型 | 用户选择"先裁定 D5/D6" + 授权自动执行 → **按设计推荐案 (c) 两者并用** | 本队列 **Batch 2-A** |
| **D6** | 端口分配 | 用户选择"先裁定 D5/D6" + 授权自动执行 → **按设计推荐案 (a) 维持 8001–8004 + 防误连标识** | 本队列 **Batch 2-B** |
| **进阶** | 本轮优先事项 | **全选**：4 个子任务 + P0 清障 + 先裁定 D5/D6 | 本队列 **Batch 3** |

> **D5/D6 的性质说明**：用户未逐条点选具体选项，而是勾选"先裁定 D5/D6"并同时给出"不用问我"的总授权。
> 故此处采用**已充分论证的设计推荐案**，并在 Batch 2 中把依据与可回退路径一并落文——
> 若执行后用户不认可，回退成本为**零**（两项都是"写文档/加标识"，不涉及实例配置改动）。

### N-1 的处置细节（重要）

用户裁定核心：**该目录永不改动，相关任务与提示一并删除**。因此：

- ❌ **不要**执行 `git remote rename` / `git remote remove` / `git remote set-url`
- ❌ **不要**再在任何文档中把它列为"待修复缺陷"
- ✅ **要做**：从 `prd.md` / `implement.md` / `12-backlog-and-handoff.md` / 真源仓 `docs/environment-defects.md` 中**删除 N-1 条目**，替换为一句已关闭说明
- ✅ **要做**：把"该实例只读、仅 pull"写入环境纪律（并入 C-06 的环境规则）

**理由（用户口径）**：该操作从设计上就是只读的——除 `git pull` 外不会触发任何写操作，故"误推上游"是**伪风险**，无需以改配置来防。

---

## 二、执行队列

### Batch 0 — 会话启动自检（只读，约 1 分钟）

```powershell
# 0-1 当前任务指针（若为空则设为本任务的父任务）
python ./.trellis/scripts/task.py current
python ./.trellis/scripts/task.py start .trellis/research/archive/2026-09/09-21-multi-repo-rules-skills-survey

# 0-2 工作区必须干净（不干净先查清来源，勿盲目清理）
git status --short

# 0-3 任务清单
python ./.trellis/scripts/task.py list --mine
```

**判定**：本任务 7 个（1 父 + 5 子 + 1 Trellis 自带）。父任务 `in_progress`；5 个子任务 `planning` 且 PRD 已回填（零 `TBD`）。

---

### Batch 1 — 清障（已获批准，可自动执行）

#### 1-A　关闭 N-1（**删除条目，不做改动**）

- [x] 在以下 4 处删除 N-1 条目，并写入一句关闭说明：
  - [x] `prd.md`（若有 N-1 提及）→ 已更新 Open Decisions 段
  - [x] `implement.md` → Phase N 的 N-1 复选框 → 已改为 `[x]` 关闭行
  - [x] `research/12-backlog-and-handoff.md` → §三 P0 表 → 已改为关闭行
  - [x] 真源仓 `D:\Repo\Tavern-repo\tavern-harness\docs\environment-defects.md`（**私有、不同步**）→ 已改为关闭行
- [x] 关闭说明统一文案：

  > **N-1 已关闭（2026-09-22，用户裁定）**：`Instance/Dev/Luker` 为**只读实例**，除 `git pull` 外
  > **不触发任何操作**，故"`git push origin` 误推上游"属**伪风险**。已裁定**永不改动**该目录的 git 配置，
  > 并从此不再作为待修缺陷登记。

- [x] 在 C-06 环境规则中新增一条纪律：「**实例目录只读，仅允许 `git pull`（含 `--ff-only`）**」
      → 已写入 `09-22-tavern-dev-env-rules` 的 `deliverables/04-test-dev-rules.md`（并已同步进 `tavern-harness` 的 L1-MF-10 表述）

#### 1-B　N-2：仅关 `enableServerPluginsAutoUpdate`（**唯一获准的实例写操作**）

**目标文件**：`D:\Repo\Tavern-repo\Instance\Real\Luker\config.yaml`
**目标行**：**第 218 行**，`enableServerPluginsAutoUpdate: true` → `false`
**理由**：服务端插件**自动更新**可能覆盖 Authority 的本地改动（本仓正在大量迭代）。**其余安全项（`listen` / `cors` / `whitelistMode` / `securityOverride` / `basicAuthMode`）用户选择不动。**

执行前（强制）：

```powershell
# ① 确认目标行当前值（防文件已被改动）
Select-String -LiteralPath 'D:\Repo\Tavern-repo\Instance\Real\Luker\config.yaml' -Pattern 'enableServerPluginsAutoUpdate'
# ② 该实例 git 状态快照（只读）
git -C 'D:\Repo\Tavern-repo\Instance\Real\Luker' status --short
```

执行：

- [x] 备份：复制为 `config.yaml.bak-20260922-autoupdate`（**同目录**，便于回滚）
      ✅ 已建（4140 字节，与原文一致）
- [x] **块级替换**（禁止整文件覆盖）：定位第 217–218 行上下文
      （`enableServerPlugins: true` / `enableServerPluginsAutoUpdate: true`），**只改后者的 `true` → `false`**
      ✅ 已执行（用块级替换工具，非整文件覆盖）
- [x] 复核 diff：仅 **1 行**变化，其余逐字未动
      ✅ 实测 `git diff --no-index --numstat <备份> <现文件>` = **1 增 1 删**，内容只该行
- [x] 记录：把此次改动写入真源仓 `docs/environment-defects.md`（含日期、行号、理由、回滚方法）
      ✅ 已写入「本轮变更记录（2026-09-24）」节

执行后验证：

```powershell
Select-String -LiteralPath 'D:\Repo\Tavern-repo\Instance\Real\Luker\config.yaml' -Pattern 'enableServerPlugins'
# 实测：217 = enableServerPlugins: true / 218 = enableServerPluginsAutoUpdate: false  ✅
# ⚠️ 下方仓内 diff 命令**必为空**（该文件被 .gitignore:23 忽略），已改用备份比对取证：
git diff --no-index --numstat 'D:\Repo\Tavern-repo\Instance\Real\Luker\config.yaml.bak-20260922-autoupdate' 'D:\Repo\Tavern-repo\Instance\Real\Luker\config.yaml'
# 实测：1 增 1 删（单行）  ✅
```

**回滚**：`Copy-Item config.yaml.bak-20260922-autoupdate config.yaml -Force`

> ⚠️ **重启才生效**，但**不要**代用户重启 Real 实例（`Instance/Real/**` 除本项外仍只读）。

#### 1-C　N-9：补 `upstream` remote（可逆，便于后续拆 PR）

```powershell
# 先解析准确 URL（勿猜）
gh repo view Youzini-afk/ST-Delegation-of-authority --json url
# 确认当前 remote 归属（推送前必做，见统一规则 L1-MF-1 / P-12）
git remote -v
# 补 upstream（只读用途）
git remote add upstream <上一步得到的 URL>
git remote -v   # 复核：origin = 本 fork；upstream = Youzini-afk/...
```

- [x] `upstream` 已添加且 `git fetch upstream --dry-run` 通过
      ✅ 实测：`upstream = https://github.com/Youzini-afk/ST-Delegation-of-authority.git`；dry-run exit 0（已见 main/dev/agent-platform）
- [x] 在 `research/12-backlog-and-handoff.md` 中把 N-9 标记为已完成
- [x] **绝不** `git push upstream`（本轮零 upstream 推送）

> 注：本项属"改 Git 配置"，虽有可逆性，但按三条例外仍**先报告一次**再执行（或在执行后立即报告）。

---

### Batch 2 — D5 / D6 裁定落地（自动执行，零实例改动）

#### 2-A　D5 → 采用「(c) 两者并用」

| 用途 | 工具 | 现状 |
| --- | --- | --- |
| **脚本化 E2E**（可重复、可回归、可入 CI） | **Playwright 1.62.1** | 本机已存在（`npx playwright --version` 成功），**无需新装** |
| **交互式诊断**（看 DOM/网络/控制台，一次性排查） | **`chrome-devtools-mcp`**（`--autoConnect`） | 本机已存在，已在 2 仓配置 |

- [ ] 把上述结论写入 `09-22-tavern-dev-env-rules` 的产出（R4 测试开发规则）
- [ ] 边界写清：**可重复的回归用 Playwright；一次性排障用 MCP**；两者都不新装依赖
- [ ] 若需在具体项目内声明依赖，**只在该项目 `devDependencies` 内声明**，不全局安装

#### 2-B　D6 → 采用「(a) 维持 8001–8004 + 防误连标识」

**维持现状（实测无冲突）**：

| 实例 | 端口 | 敏感度 |
| --- | --- | --- |
| `Instance/Dev/SillyTavern` | 8001 | 🟡 |
| `Instance/Real/SillyTavern` | 8002 | 🔴 只读 |
| `Instance/Dev/Luker` | 8003 | 🟡 |
| `Instance/Real/Luker` | 8004 | 🔴 只读 |

**为何不改端口**：改端口必须动 Real 实例配置 → 与只读红线冲突；且真实风险是**误连**，不是冲突。

- [ ] 产出**防误连标识**方案（不实施到实例，只写规则/脚本建议）：
  - 建议在 `Instance/Dev/**` 与 `Instance/Real/**` 各放一个**只读标识文件**（如 `INSTANCE-ROLE.txt`，内容 `DEV` / `REAL-READONLY`），
    由脚本在操作前读取校验；**落地前须逐条批准**（属实例写操作）
  - 建议 E2E 脚本启动时**断言**目标端口 ∈ {8001, 8003}，否则**显式失败**（禁止静默回退——统一规则 L1-MF-6）
- [ ] 把 N-4（端口 3000 三方撞车）与 N-5（`8000` 六处出厂默认）并入本任务产出，给出建议值（3000 划归系统保留，两项目改 3010/3020）

---

### Batch 3 — 5 个子任务（D5/D6 落地后全部解锁）

> 每个子任务的 PRD 均已回填、零 `TBD`、素材齐备。开工即 `task.py start`，完成后走 `trellis-check` → `finish` → `archive`。
> **子代理纪律**（统一规则 L0-8）：一律用最低档小模型（`claude-haiku-4-5-20251001` / `DeepSeek-V4-Flash[free]`），
> **禁止旗舰模型、禁止 Kimi K3**；并发 **≤3**；失败先落盘部分结果再重试。

| 序 | 子任务 | 对应 | 阻塞 | 建议 |
| --- | --- | --- | --- | --- |
| 3-1 | `09-22-luker-dev-skill` | C-04 | 无 | **先做**（素材最齐：`research/05` 131KB，22 页官方文档） |
| 3-2 | `09-22-tavern-workflow-skill` | C-05 | 无 | 与 3-1 无冲突，可并行 |
| 3-3 | `09-22-tavern-repo-atlas` | C-07 | 无 | 需与用户确认意图陈述（**唯一需要用户回话的一项**，走 `AskUserQuestion`） |
| 3-4 | `09-22-authority-ecosystem-pr-strategy` | C-09 | 弱依赖 N-9（Batch 1-C） | 拆分清单产出后**不实际提 PR** |
| 3-5 | `09-22-tavern-dev-env-rules` | C-06 | **已解除**（D5/D6 见 Batch 2） | 承接 Batch 1-A/B 的纪律条目 |

**共同验收**（子任务 PRD 内已写明，此处汇总）：
- [ ] skill 类（3-1 / 3-2）：frontmatter 完整、`description` 含触发场景、**symlink 到 `~/.claude/skills/`** 生效、与现有 skill 无重叠
- [ ] 全部产出**中文**、可回源（抽查 5 条）、无占位符

**注**：3-3（atlas）的 R5/AC-3 要求"用户书面确认意图陈述"——这是**子任务自身的交付要求**，
不属于本队列的"方向性提问"，执行时按原 PRD 走一次确认即可。

---

### Batch 4 — 两项遗留（自动处置）

#### 4-A　`00-bootstrap-guidelines` 职责冲突 → 采用选项 **(a)**

用户未单独点选此项，但已授权"不用问我"。采用设计上最合理、且**不丢工作**的 (a)：

- [ ] 把本任务的提炼成果（`research/01`–`03` 的三群规则 + `research/09` 的 L0/L1 归纳）
      作为**来源**灌入 `.trellis/spec/` 相应索引（逐包 `index.md`），完成 bootstrap 的核心诉求
- [ ] 明确边界：**`.trellis/spec/` 面向 sub-agent 的层/包规范**；**统一规则块面向人工约定的跨仓通则**（两者不重复同一内容）
- [ ] 完成后 `python ./.trellis/scripts/task.py finish` + `archive 00-bootstrap-guidelines`
- [ ] 同步勾选 `implement.md` 的 **H-4**

> 若执行时发现 spec 内容与规则块**必然重复**，则改走选项 (c)（`archive` 承认其被吸收）——二选一，**不要再问用户**。

#### 4-B　全局规则三处不同步 → 补齐

`~/.claude/CLAUDE.md` 有 **§4.5（计划先行）** 与 **§4.6（可选后端适配器模式）**，
而 `~/.codex/AGENTS.md`、`~/.agents/AGENTS.md` **缺失**——与三文件自身声明的"三处同步"不符。

- [ ] 把 §4.5 / §4.6 两节内容同步写入 `~/.codex/AGENTS.md` 与 `~/.agents/AGENTS.md`
- [ ] ⚠️ 这三个文件在**工作区之外**（`C:\Users\caocaobi\.claude\` 等），写入需要非沙箱权限
- [ ] 写入前**备份**，写入后**逐节 diff** 确认三处一致
- [ ] 本项属"用户级配置文件"，如遇权限受阻 → **跳过并记录**，不要反复重试

---

### Batch 5 — 收尾

#### 5-A　推送纪律（已裁定：保持仅本地提交）

- [ ] **10 个受同步仓的规则块：不推送**，维持 E 阶段裁定（用户 2026-09-22 复选"保持仅本地提交"）
- [ ] 本仓（DoA）与真源仓（`tavern-harness`）：**按常规推送 `origin`**
- [ ] 真源仓若有规则改动：必须走完整流程
      `test_sync_tavern_rules.py` → `--dry-run` → `--apply` → `--verify` → `git commit` → `git push origin main`

#### 5-B　归档前提检查

父任务归档需全部 Gate 通过。执行完 Batch 1–4 后逐项复核：

- [ ] **Gate F**（skill 体系）← Batch 3-1 / 3-2 完成
- [ ] **Gate G**（环境与测试规则）← Batch 2 + Batch 3-5 完成
- [ ] **Gate N**（缺陷）← Batch 1 完成（N-1 关闭 / N-2 落地 / N-9 完成）
- [ ] **AC-3 / AC-6**（全景地图 + 意图确认）← Batch 3-3 完成
- [ ] `implement.md` 的 H-4 / H-6 勾选
- [ ] 全部通过后：`python ./.trellis/scripts/task.py finish` → `archive`（逐个子任务先归档）

---

## 三、红线（执行全程适用，逐条不可破）

1. **`Instance/**` 只读**——唯一例外是 Batch 1-B 的**单行**改动。此外**零写操作**。
2. **E2E 只允许对 `Instance/Dev/**`**；端口 8001–8004 仅差 1，**最大风险是误连 Real**。
3. **`Instance/Dev/Luker` 永不改动**（N-1 裁定）。
4. **跨宿主插件禁用 Host Bridge**（统一规则 L0-12）。
5. **改各仓规则必须改真源再同步**——禁止直接改各仓规则块（会被下次同步覆盖）。
6. **`.trellis/tasks/**` 永不入库**（含本机安全细节）；本仓为 **PUBLIC fork**，**禁止 `git add -A`**。
7. **子代理**：最低档小模型、并发 ≤3、禁止旗舰模型与 Kimi K3。
8. **推上游**：任何情况下 `git push upstream` 都是禁止动作。

---

## 四、接手者速查（复制即用）

```powershell
# 1. 定位
cd D:\Repo\Tavern-repo\Myfork\ST-Delegation-of-authority
python ./.trellis/scripts/task.py current
python ./.trellis/scripts/task.py start .trellis/research/archive/2026-09/09-21-multi-repo-rules-skills-survey
Get-Content .trellis/research/archive/2026-09/09-21-multi-repo-rules-skills-survey/research/13-next-session-auto-queue.md

# 2. 真源仓（改动规则时）
cd D:\Repo\Tavern-repo\tavern-harness
python scripts/test_sync_tavern_rules.py
python scripts/sync_tavern_rules.py --verify

# 3. 子任务
python ./.trellis/scripts/task.py start .trellis/research/archive/2026-09/09-22-luker-dev-skill
```

**完成标准**：Batch 0–5 全部勾选，Gate F/G/N 全绿，`implement.md` 无未完成复选框，子任务已归档。

---

## 五、变更记录

| 日期 | 变更 |
| --- | --- |
| 2026-09-22 | 本文建立。记录用户 5 项裁定（N-1 关闭 / N-2 单项加固 / D5 / D6 / 不推送）、零提问契约、Batch 0–5 执行队列与三条例外 |
