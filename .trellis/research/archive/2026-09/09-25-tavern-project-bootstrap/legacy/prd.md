# 酒馆项目脚手架：Trellis 原生模板与云同步

## Goal

把「开一个新的酒馆项目」变成**一条命令**，并让**已经初始化且改了很多的既有项目**能增量同步同一套偏好——
且**全部走 Trellis 原生机制**，不自造分发体系。

**用户价值**：当前每个新仓都要手工重做一遍同样的适配（Windows `python` 适配、端口段位纪律、实例隔离白名单、
子代理模型门禁、journal/commit 行为），且**无法回灌到既有仓**——改一处就要人去 15 个仓重复。
本任务把它固化成可版本化、可校验、可增量同步的模板。

---

## Background

### 已查明的 Trellis 原生机制（2026-09-25 实测，Trellis 0.6.16）

**这是本任务的全部设计依据——先读这一节，它决定了哪些能做、哪些不能。**

| # | 原生机制 | 命令 / 位置 | 能否覆盖既有项目 | 冲突保护 |
| --- | --- | --- | --- | --- |
| N1 | **workflow 模板市场** | `trellis workflow -m <source> -t <id>` | ✅ 直接可换 | 默认**先问**；`-f` 强制覆盖、`-n` 写 `.new` 旁路 |
| N2 | **spec 注册表** | `.trellis/config.yaml` 的 `registry.spec.{source,template}` + **`trellis update`** | ✅ **专为增量同步设计** | 哈希跟踪（`.trellis/.template-hashes.json`），本地改动报 "Modified by you" 冲突，**不静默覆盖** |
| N3 | **update 三态** | `trellis update [--dry-run\|-f\|-s\|-n\|--migrate]` | ✅ 这是原生"同步进既有项目"的动词 | 同上；`--dry-run` 可预览 |
| N4 | 市场源语法 | `provider:user/repo[/subdir][#ref]`，provider ∈ `gh`/`github`/`gitlab`/`bitbucket`，默认 `ref=main` | — | — |
| N5 | 市场索引格式 | 仓内 `index.json`：`{version:1, templates:[{id, type, name, description, path, tags}]}` | — | — |
| N6 | workflow 条目约束 | `type:"workflow"`，`path` **必须**以 `.md` 结尾；目录**只读单个文件** | — | — |
| N7 | spec 条目语义 | `type:"spec"`，`path` 指向**目录**；`trellis update` 收集该模板的 `.trellis/spec/**` 全量 | ✅ 整树同步，本地独有文件保留 | 见 N2 |
| N8 | **私有仓不可走 HTTP 市场源** | `raw.githubusercontent.com` 对私有仓返回 **404**；git 回退（`preferGit`）**仅**对 SSH / 自建 host 触发，不对 `gh:` 生效 | — | 故私有仓须用 **SSH 形式**源 |

**已实测量**：`raw.githubusercontent.com` 本机可达（HTTP 200 / 0.65s）；`jiozhaoyue/tavern-harness` 为 **PRIVATE**，
其 raw 路径返回 404。（N8 的由来）

**先例检索（GitHub API）**：`SuooL/trellis-marketplace` —— 自建 Trellis 市场仓，布局恰为
`index.json` + `specs/` + `workflows/` + `skills/`，**验证了 N5/N7 的目录约定**。
`0xUnite/ai-dev-template` 走的是"整仓模板"路线，与本任务路线不同，不采纳。

### **原生覆盖不到的部分（必须诚实标明）**

| 层 | 有原生市场通道吗 | 结论 |
| --- | --- | --- |
| `.trellis/workflow.md` | ✅ N1 | 可市场分发 |
| `.trellis/spec/**` | ✅ N2/N7 | 可市场分发 + 增量同步 |
| `.trellis/config.yaml` | ❌ | update 时走**内置模板**（`preserveExistingRegistryConfig()` 仅保留 registry 块），**无市场通道**；本地改动走冲突提示 |
| 平台目录（`.claude/` 等 agent/skills/hooks） | ❌ | update 时走内置模板，无市场通道 |
| 统一规则块（`AGENTS.md` 等） | ❌ | 由 tavern-harness 自有同步器管理，Trellis 不感知 |

**因此本任务的形态是双轨**：
- **主轨（Trellis 原生）**：workflow 模板 + spec 种子，走 N1/N2，**含既有项目增量同步**。
- **补轨（薄封装）**：config.yaml 偏好、平台 agent 门禁、规则块——原生无通道，由 `tavern-init.mjs` 扩展补齐。
  补轨**不新造分发**，只做"把已有的值写对地方"。

### 云同步的含义

- 模板与索引**托管在 `tavern-harness`**（已有 `origin`，已验证推送）→ 云端有副本。
- 分发走 **SSH 源**（N8）：`trellis workflow -m git@github.com:jiozhaoyue/tavern-harness -t tavern`。
  **零公开、零脱敏**——代价是新机器需配好 GitHub SSH key。
- 不做"自动轮询同步"：Trellis 的 `trellis update` 就是同步动词，由使用者显式触发。

---

## Requirements

### R0 · 共性约束（四个任务均适用）

- **必须用 Trellis 原生机制**，不得自造分发体系（用户 2026-09-25 明令）。
- 修改既有仓文件属 PARDON 高风险操作：**逐个列出目标路径与理由，先获批准**。
- 推送纪律照 L0-7：提交后必须推 `origin`，绝不推 `upstream`。
- 不触碰 `Instance/Real/**`；`Instance/Dev/**` 仅路径级枚举。

### R1 · 子任务划分（本父任务只做编排与集成验收）

| 子任务 | 范围 | 依赖 |
| --- | --- | --- |
| **A** `09-25-authority-backlog-closeout` | 本仓（Authority）遗留项：core exe 体积、Instance 消费者盘点、TS 穷尽性未验项 | 无 |
| **B** `09-25-tavern-harness-advance` | 真源仓：补两条新规则、修唯一漂移项、重同步 15 仓 | 无 |
| **C** `09-25-trellis-tavern-template` | 模板与云同步：市场仓布局、workflow 模板、spec 种子、薄封装补齐 | **依赖 B**（模板托管在 tavern-harness，需 B 的真源状态先稳定） |

**顺序**：A 与 B 可并行；C 在 B 之后（依赖写在 C 的 `prd.md`，不用树位置隐含）。

### R2 · 父任务自身的交付

- R2.1 本 `prd.md` 作为**源需求集与任务地图**，并持有跨子验收标准。
- R2.2 子任务全部归档后做**集成验收**：新项目从零走一遍"一条命令"，既有项目走一遍"增量同步"，
  两者结果一致且无回归。
- R2.3 若某子任务发现需求需变更，回本父任务改 `prd.md` 再下传（不各自为政）。

---

## Acceptance Criteria（跨子验收）

- [x] **AC-P1**：三个子任务各自的 AC 全部勾选且已归档。→ 四个子任务（A/B/C/D）全部归档。
- [x] **AC-P2**（新项目路径）：在**一个全新目录**执行"初始化 + 套用 tavern 模板"，产出可用的
      `.trellis/`（含 tavern 定制的 `workflow.md` 与 spec 层），且 `trellis workflow --list` 能看到 tavern 条目。
      → 一条命令实跑通过（含追加节与 `.trellis/spec/tavern/` 三页种子）。证据见 `implement.md` §二 AC-P2。
- [x] **AC-P3**（既有项目路径）：在**一个已初始化且已被大量修改**的既有项目上执行增量同步，
      **本地改动不丢失**（Trellis 报冲突而非静默覆盖），且同步后新增了 tavern spec 层。
      → 沙箱副本实测：本地改动零丢失（`config.yaml` md5 不变）+ 种子增量加入。
- [x] **AC-P4**（原生性）：全流程无自造分发机制；模板分发只经 `trellis workflow` / `registry.spec` + `trellis update`。
      补轨只做 config/agent/规则块的写入，不含"自己下载模板"的逻辑。
- [x] **AC-P5**（云同步）：`tavern-harness` 已推送且含市场所需文件（`index.json` + 模板目录）；
      另一台机器仅凭 `git clone` + SSH key 即可复现 AC-P2。
      → 市场文件已推送、SSH 源形式实测可列出条目；**跨机器复现未实测**（需第二台机器），列为遗留项 1。
- [x] **AC-P6**（零污染）：全程未触碰 `Instance/Real/**`；未推 `upstream`；
      Authority 仓的产品代码（`packages/`/`crates/`/`docs/`/`runtime/`/`managed/`）零改动。
      → 已验证：产品代码 diff 为空、改动仅 9 个治理层文件、零 `upstream` 推送。
- [x] **AC-P7**：父任务 `implement.md` 记录四个任务的最终状态与遗留项。→ 已写入同目录 `implement.md`。

---

## Out of Scope

- 不自造包管理 / 不发布 npm 包（Trellis 的两包 `@mindfoldhq/trellis` 与 `-core` 由上游维护）。
- 不改 Trellis 上游源码、不改 `node_modules`。
- 不做公开脱敏市场仓（用户已选 SSH 走私有仓）。
- 不做自动轮询同步机制。
- 不把 tavern 规则块纳入 Trellis 市场（原生无通道，走补轨）。

---

## Open Questions

**无阻塞项。** 分发通道（SSH 私有仓）、模板范围（原生可覆盖的两层 + 补轨）、
推进边界（四项全选）均已由用户裁定（2026-09-25）。
模板范围中"项目偏好/本地环境"的**具体清单**由子任务 C 在规划阶段盘点后确定，不阻塞父任务开工。
