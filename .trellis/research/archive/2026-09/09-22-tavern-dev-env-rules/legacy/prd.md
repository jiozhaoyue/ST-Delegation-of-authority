# 统一开发测试环境规则定稿

> 父任务：[`09-21-multi-repo-rules-skills-survey`](../09-21-multi-repo-rules-skills-survey/prd.md)（对应 C-06 / R5）
> 素材：[`research/06-dev-env-instances-ports.md`](../09-21-multi-repo-rules-skills-survey/research/06-dev-env-instances-ports.md)（实测数据已就绪）

## Goal

把已完成的实测调查**定稿为可执行的统一开发/测试环境规则**，回答用户的三个开放问题：
**调用哪个 Luker 进程/端口？用什么浏览器自动化？怎么留下经验？**

## Background

实测结论（`research/06`，2026-09-21）：

| 实例 | 端口 | 数据敏感度 |
| --- | --- | --- |
| `Instance/Dev/SillyTavern` | 8001 | 🟡 |
| `Instance/Real/SillyTavern` | 8002 | 🔴 只读 |
| `Instance/Dev/Luker` | 8003 | 🟡 |
| `Instance/Real/Luker` | 8004 | 🔴 只读（**调查时正在运行**） |

- **Dev 与 Real 的宿主版本完全一致**（Luker 2.7.0 / ST 1.18.0 / PT 0.1.12 / TT 2.2.0）→ 版本不能作为区分依据。
- **端口仅差 1** → 当前最大风险不是端口冲突，而是**误连真实实例**。
- 浏览器自动化：**Playwright 1.62.1 与 chrome-devtools-mcp 本机均已存在**，无需新装。

## Requirements

- [x] R1 产出**实例对照表**：路径 / 类型 / 端口 / 数据目录 / 编译要求 / 数据敏感度。→ `deliverables/01-instance-matrix.md`（12 行主表 + 关键事实注记，全部可回源 research/06）
- [x] R2 产出**端口分配方案**与冲突点清单（含 `8000` 六处默认值、`3000` 三方撞车的处置建议）。→ `deliverables/02-ports-and-collisions.md` §1–§2（D6 裁定：维持 8001–8004，不改端口；N-4/N-5 已并入）
- [x] R3 产出端口改动的 **diff 预览**（**不实施**；改 Real 配置与只读红线冲突，须用户逐条批准）。→ `deliverables/02-ports-and-collisions.md` §3（仅预览文本，本轮零实例写入）
- [x] R4 产出**测试开发规则**：E2E 只用 `Instance/Dev/**`、禁止指向 Real、产物留证路径。→ `deliverables/04-test-dev-rules.md` §1–§5（含端口断言参考实现与 `INSTANCE-ROLE.txt` 方案——只出方案不落地）
- [x] R5 产出**经验留存四层载体**约定（单仓 L2 区 / 跨仓真源 `pitfalls.md` / `~/.agents/skills/tavern-*` / 任务 `research/`）。→ `deliverables/05-experience-retention.md`（四层定义 + 晋升判定 + 反模式 + 本任务落点映射）
- [x] R6 把结论落入真源仓 `rules/`（若属跨仓通则）并同步分发。→ **以草案 + dry-run 计划形式完成**（`deliverables/04-test-dev-rules.md` §6：G-1…G-6 候选条目 + 命令序）；按 2026-09-22 派发裁定与父队列红线 5/6，**本轮不落盘** `tavern-harness`，落盘待用户批准后另行派发

## Acceptance Criteria

- [x] AC-1 AC-5 全部通过（见父任务 `prd.md`）。→ 本子任务侧材料已齐（6 个交付物 + 5 条抽查回源）；父任务级 Gate G 复核归主代理 / trellis-check
- [x] AC-2 **全程零实例数据改动**（硬校验：`Instance/**` 的 mtime 与 git status 无本轮变化）。→ 2026-09-24 只读取证：`Real\Luker\config.yaml` mtime=2026-09-07 03:42、`Dev\Luker\config.yaml` mtime=2026-08-28 16:26（均早于本轮）；`Dev\Luker` `git status --short` 仅历史既有改动（最早 2026-08-29 的 bak 文件），本轮对 `Instance/**` 仅执行过只读命令
- [x] AC-3 `tavern-host-compat` / `tavern-browser-automation` 两个 skill 的取舍（合并 or 拆分）有明确结论。→ `deliverables/06-skill-merge-decision.md`：**拆分**（四条理由 + 边界澄清 + 重新评估触发条件）

## Constraints

- **D5（浏览器自动化选型）与 D6（端口分配）尚未裁定**——开工前必须先用 `AskUserQuestion` 取得裁定，
  或先只产出**方案与 diff 预览**（不落地）。
- `Instance/**` 全程只读；改任何实例配置须用户逐条批准。
- 本任务不得擅自从 8001–8004 之外"发明"新端口。

## 开工前须知

1. `research/06` 是唯一数据源，所有数字必须能回源（含"未获取"项：全量 package.json 依赖扫描超时未完成）。
2. 已知环境缺陷（N-1…N-6）在真源仓 `docs/environment-defects.md`（**不同步、不公开**）。
3. 与 `tavern-repo-atlas` 的边界：本任务讲"环境与测试纪律"，后者讲"仓库定位与状态"。
