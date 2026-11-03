# 执行清单（implement）

> 勾选纪律（L0-2）：随执行**实时勾选**，禁止任务结束后凭记忆批量补勾。
> 写入路径红线：本任务只允许写 `deliverables/*.md`、本文件、`prd.md`（勾选）。

## 前置

- [x] 读 `prd.md`（R1–R6 / AC-1–AC-4 / Constraints）
- [x] 读 `implement.jsonl` 登记的两份素材
- [x] 读 `research/07`（全文，C-08 结论）
- [x] 读 `research/04` §6.2（Companion Modules / Feature Flags / 降级层次）及 §3.2、§6.1、§6.3
- [x] 读 `research/10` §B（治理原语与注册表缺口）+ 父任务 `design.md` §5.3 业务线登记
- [x] 读 `research/00` B0–B12 需求真源（清单判定的对象来源）
- [x] N-9 现场复核：`git remote -v` → upstream=Youzini-afk（fetch 通过）、origin=jiozhaoyue（2026-09-24）

## 交付物

- [x] D1 `deliverables/01-plugin-vs-pr-criteria.md`（R1 判定准则 + 逐项清单 + L12 立项建议）
- [x] D2 `deliverables/02-pr-split-plan.md`（R2 PR 拆分方案，逐 PR 单一功能边界/依赖/验收点）
- [x] D3 `deliverables/03-backend-route.md`（R3 后端路线结论 + 实测证据 + 残留未验项）
- [x] D4 `deliverables/04-portable-subset.md`（R4 可移植/不可移植子集，逐条回源）
- [x] D5 `deliverables/05-maintenance-cost.md`（R5 维护成本控制策略 + R6 N-9 状态）

## 收尾

- [x] 勾选 `prd.md` R1–R6 与 AC-1–AC-4 中确实达成项（AC-4 需用户确认，不勾）
- [x] 自查：每个 AC 可指出证据位置；可移植清单逐条带回源指针；清单无任何 Host Bridge 依赖条目（`04-portable-subset.md` §六自查通过）
- [x] 输出最终报告（① 文件+行数 ② 四问结论摘要 ③ 回源证据 ④ L12 建议 ⑤ 残留未验项 ⑥ 未完成/阻塞 ⑦ 勾选情况）
