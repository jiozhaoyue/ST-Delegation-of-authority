# 执行计划：tavern-dev-env-rules

## 1. 资料核对

- [x] 从 `research/06` 提取实例矩阵、端口占用、浏览器自动化现状。
- [x] 从 `research/13-next-session-auto-queue.md` 提取 D5/D6 裁定与 N-2 当前授权状态。
- [x] 明确本轮不修改 `Instance/Real/Luker/config.yaml`。（写前 mtime 快照已取证）

## 2. 规则定稿

- [x] 产出实例对照表，包含路径、类型、端口、数据目录、编译要求、数据敏感度。→ `deliverables/01-instance-matrix.md`
- [x] 产出端口分配方案与冲突点清单。→ `deliverables/02-ports-and-collisions.md` §1–§2
- [x] 产出端口改动 diff 预览，但不得实施。→ `deliverables/02-ports-and-collisions.md` §3（仅预览文本，零写入）
- [x] 产出浏览器自动化分工：Playwright 用于回归，`chrome-devtools-mcp` 用于交互诊断。→ `deliverables/03-browser-automation.md`
- [x] （派发补充项 R4）产出测试开发规则：E2E 只允许 `Instance/Dev/**`、禁止指向 Real、产物留证路径。→ `deliverables/04-test-dev-rules.md` §1–§5（含端口断言参考实现）
- [x] （派发补充项 R6）跨仓通则草案与 dry-run 计划（不落盘真源仓）。→ `deliverables/04-test-dev-rules.md` §6
- [x] 产出经验留存四层载体约定。→ `deliverables/05-experience-retention.md`（L0 证据 / L1 单仓 / L2 真源 / L3 skill 四层 + 晋升判定 + 反模式）
- [x] 判断 `tavern-host-compat` 与 `tavern-browser-automation` 的合并或拆分方案。→ `deliverables/06-skill-merge-decision.md`（结论：**拆分**，四条理由 + 重新评估触发条件）

## 3. 校验

- [x] 抽查五条环境结论并记录回源位置。（5 条抽查见最终报告：research/06 :13/:46/:61/:98/:124 行）
- [x] 检查 `Instance/**` 未被写入。（2026-09-24 只读取证：Dev\Luker `git status --short` 仅历史既有改动（bak 文件时间戳 2026-08-29）；Real\Luker `config.yaml` mtime=2026-09-07 03:42、Dev\Luker `config.yaml` mtime=2026-08-28 16:26，均早于本轮）
- [x] 检查规则不鼓励新端口静默回退，不把 Real 作为 E2E 目标。（`02` :14/:16 标 8002/8004「❌ 禁止」、:22/:115 禁改 Real；`03` §4、`04` §2 明令禁止静默回退并给断言实现）
- [x] 输出新增文件清单与未完成/待用户批准项；不提交、不推送。（见最终报告①⑤）

## 风险与停止条件

- 若需要修改实例配置才能继续：停止并报告。
- 若需要安装浏览器、MCP 或 npm 包：停止并报告。
- 若真源仓规则需要同步：只先出草案与 dry-run 计划，不自动全仓落盘。
