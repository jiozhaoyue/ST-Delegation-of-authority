# 生态与 PR 策略

> 父任务：[`09-21-multi-repo-rules-skills-survey`](../09-21-multi-repo-rules-skills-survey/prd.md)（对应 C-09）
> 素材：[`research/04-plugin-authority.md`](../09-21-multi-repo-rules-skills-survey/research/04-plugin-authority.md)、[`07-authority-host-compat-verification.md`](../09-21-multi-repo-rules-skills-survey/research/07-authority-host-compat-verification.md)、[`10-trellis-integration-and-plugin-governance.md`](../09-21-multi-repo-rules-skills-survey/research/10-trellis-integration-and-plugin-governance.md)

## Goal

直接回答用户的四个问题，并产出**可执行的拆分清单**：

1. 哪些要做成**插件**、哪些可以**提 PR 上游**？
2. 改了这么多，**怎么逐个提 PR**（必须功能单一、可 review）？
3. **后端插件策略**：直接用 Authority 的可用子集，还是必须自造插件？
4. 如何避免陷入**自己维护 + 提交 PR + 多方联动的地狱**？

## Background

- 用户主张：**「暴露 API，成为一个基础设施」；想联动打造生态，但又不耦合**。
- Authority 已提供四层治理原语（权限隔离 / Feature Flags 26 路径 / **Companion Modules 互调契约** / Agent 工具注册），
  但**缺"插件注册表层"**（清单、依赖矩阵、冲突检测、跨宿主可用性登记）→ 已登记为 `L12`。
- 关键实测：Authority 的**能力内核与宿主解耦**——Host Bridge 失败仅 `console.warn`，不阻断插件加载；
  Luker 的插件契约与 ST **逐字节同形**。因此「用 Authority 增强」在 Luker 上**成立**。
- Authority fork 与上游同 commit 且**未配 `upstream` remote**（`N-9`）——这是拆 PR 的前置障碍。

## Requirements

- [x] R1 产出**插件 vs PR 的判定准则**（什么特征该做插件、什么特征该提 PR），并给出**逐项清单**。→ `deliverables/01-plugin-vs-pr-criteria.md`（六维判据 + 判定树 + B1–B10/L1–L12 逐项表）
- [x] R2 产出**PR 拆分方案**：每个 PR 的单一功能边界、依赖顺序、可 review 的验收点。→ `deliverables/02-pr-split-plan.md`（5+1 条台账，逐条含/不含/验收）
- [x] R3 产出**后端插件路线结论**：直接用 Authority 可用子集 / 自造 / 并存，并写明理由与代价。→ `deliverables/03-backend-route.md`
- [x] R4 产出 **Authority「可移植子集 / 不可移植子集」清单**（跨宿主插件只能依赖前者）。→ `deliverables/04-portable-subset.md`（P1–P16 / N1–N5，逐条回源）
- [x] R5 产出**维护成本控制策略**：如何避免"自己维护 + 提 PR + 多方联动"的死循环。→ `deliverables/05-maintenance-cost.md`（S1–S8 + 拒收预案）
- [x] R6 前置动作：补 `upstream` remote（`N-9`），使上游对齐与 PR 拆分可执行。→ ✅ 已完成（2026-09-24）：`upstream=Youzini-afk/…`、`origin=jiozhaoyue/…`、`git fetch upstream --dry-run` exit 0；证据见 `deliverables/05-maintenance-cost.md` §四

## Acceptance Criteria

- [x] AC-1 产出可执行的拆分清单（每项含：范围、验收标准、依赖、优先级）。→ `deliverables/02-pr-split-plan.md` §二/§五验收总表
- [x] AC-2 后端路线的结论有实测证据支撑（`research/07`），并明确标注**残留未验项**
      （未实际启动宿主装载插件——涉改实例配置，须用户批准）。→ `deliverables/03-backend-route.md` §二（证据链）+ §五（5 项残留未验项）
- [x] AC-3 可移植/不可移植子集清单能逐条回源到 `research/04` §6.2 与 `research/07`。→ `deliverables/04-portable-subset.md` §六自查
- [x] AC-4 用户确认清单可执行。→ ✅ **已确认（2026-09-24 用户裁定「确认可执行」）**

## Constraints

- **不向上游提任何 PR**（本任务只出策略与拆分方案；实际提请另开任务）。
- 改 `Instance/**` 或 Authority 的 remote 配置须用户批准（`N-9` 加 remote 可逆，仍需报备）。
- 跨宿主插件**禁用 Host Bridge**——这是 v1.1.0 统一规则 L0-12 的硬约束，本任务的方案不得违反。

## 开工前须知

1. 先读 `research/07`（C-08 关键路径结论，10 KB，已内联）+ `research/10` §B（治理原语与注册表缺口）。
2. `research/04`（24 KB）按 §6.2 定位 Companion Modules 与 Feature Flags 细节。
3. `N-9`（补 upstream remote）是可逆动作且已登记，但改动 Git 配置前仍应向用户报备。
4. 本任务的结论会影响 `L12`（插件注册表/统一调控台）是否立项——给出明确建议。
