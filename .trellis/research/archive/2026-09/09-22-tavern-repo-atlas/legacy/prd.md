# 全景地图与意图确认

> 父任务：[`09-21-multi-repo-rules-skills-survey`](../09-21-multi-repo-rules-skills-survey/prd.md)（对应 C-07 / R3）
> 素材：[`research/00-requirements-inventory.md`](../09-21-multi-repo-rules-skills-survey/research/00-requirements-inventory.md)、[`04`](../09-21-multi-repo-rules-skills-survey/research/04-plugin-authority.md)、各仓扫描

## Goal

产出 **15 个仓库 + Authority 插件**的全景地图（定位 / 技术栈 / 当前状态），
并基于调查**陈述用户意图**、与用户确认理解是否一致。这是"确认我在做对的事"的前置。

## Background

- 三处仓群共 15 个仓（My-repo 7 / Myfork 3 / JS-Slash-Runner 5），其中 `ST-Assets-Manger` 为空目录、
  `ST-Switcher` 与 `tavern_helper_workspace` 此前无版本控制（`ST-Switcher` 已于 2026-09-21 补建私有仓）。
- 用户核心主张：**「暴露 API，成为一个基础设施」；想与别的插件联动、打造生态，但又不耦合**。
- Authority 已实测四宿主可用性（`research/07`）：ST ✅ 完整 / Luker ✅ 核心可用（Host Bridge 不可用）/ PT ❌ / TT ❌。

## Requirements

- [x] R1 产出全景地图：每个仓的**定位、技术栈、当前状态（在用 / 在开发 / 已废弃）**。（→ `research/atlas-overview.md` §一，2026-09-24）
- [x] R2 明确哪些是**正在使用的扩展**、哪些是**正在开发的**（用户可直接消费的结论，不是文件清单）。（→ `research/atlas-overview.md` §三）
- [x] R3 基于调查**陈述用户意图**，写成可被用户一句"对/不对"确认的陈述。（→ `research/intent-statement.md` I1–I6，**待用户确认**）
- [x] R4 登记 `L1…L12` 业务线与 `N-1…N-9` 缺陷，标明各自的前置依赖。（→ `research/atlas-overview.md` §四/§五；另实测新发现 tavern_helper_template git 仓损坏，以「建议 N-10」登记待父任务确认）
- [x] R5 与用户确认意图陈述（`AskUserQuestion`），把确认结果写入任务文档。
      ✅ **已完成（2026-09-24）**：主代理以交互问答提交 I1–I6，用户回执 **「全部准确」**；确认结果已回写本文件与 `implement.md` S14。（**主代理职责，本子代理不执行**）

## Acceptance Criteria

- [x] AC-1 地图覆盖 15 仓 + Authority，每仓有明确状态标注。（15 仓 = My-repo 6（含空目录）/ Myfork 4 / JSSR 5，Authority 即第 10 仓并另有专项展开；仓群归属修正见 atlas-overview §〇）
- [x] AC-2 每个状态结论可回源（文件/提交/依赖证据），无"看起来像"式的猜测。（每仓标注【实测】git log/remote/fsck 或【材料】research 文件，证据等级汇总见 atlas-overview §六）
- [x] AC-3 用户书面确认意图陈述无误（或按更正修订后再次确认）。
      ✅ **已完成（2026-09-24）**：用户对 I1–I6 六条意图陈述回执 **「全部准确」**（无需修订），确认载体 = 本文件 R5 行 + `implement.md` S14 行。（**未勾选：由主代理执行**——陈述已写成可逐条确认形式，见 `research/intent-statement.md`；本子代理按任务约束不得向用户提问）
- [x] AC-4 `L1…L12` / `N-1…N-9` 全部登记且无重复。（自查见 atlas-overview §四/§五末尾；N-9 以 design.md §5.4 定义为准，research/10 旧定义已注明防重复）

## Constraints

- **本任务不改任何业务代码**（纯调查与确认）。
- 涉及 `Instance/**` 的部分只读。
- 中文。

## 开工前须知

1. 主要证据来源：`research/00`（需求真源）、`research/01-03`（三群规则提炼，含各仓定位）、`research/10`（治理与任务全集）。
2. 父任务 `design.md` §5.3 已登记 `L1…L12` 业务线、§5.4 已登记 `N-1…N-9`——本任务负责**确认与补齐**，不是从零开始。
3. 与 `authority-ecosystem-pr-strategy` 的边界：本任务讲"有什么、在哪、什么状态"，
   后者讲"该怎么处置（插件化 / 提 PR / 拆分）"。
