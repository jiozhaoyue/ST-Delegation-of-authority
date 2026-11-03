# 技术设计：tavern-dev-env-rules

## 目标与边界

把父任务 `research/06-dev-env-instances-ports.md` 的实测环境数据定稿为一套可执行的开发与测试规则，
回答三个问题：调用哪个实例和端口、用什么浏览器自动化、经验写到哪里。

本任务产出规则文档与必要 Skill 方案；**不修改任何实例文件**。所有实例配置变化只能形成 diff 预览，
待用户逐条批准后才能另行执行。

## 已裁定输入

- D5 浏览器自动化：采用 Playwright 1.62.1 与 `chrome-devtools-mcp` 两者并用。
- D6 端口分配：维持 `8001–8004`，增加防误连标识与断言建议。
- 当前用户约束：`Instance/Real/Luker/config.yaml` 暂不授权改动。

## 交付形态

1. 任务研究产出：实例对照表、端口分配与冲突点、浏览器自动化边界、经验留存四层载体。
2. 若形成跨仓通则，写入真源仓规则草案，并走 `test → dry-run → apply → verify` 的既定流程；
   本任务自身不直接执行同步。
3. 判断 `tavern-host-compat` 与 `tavern-browser-automation` 是否合并为一个 Skill 或拆分。

## 核心规则

- E2E 只允许指向 `Instance/Dev/**`。
- `Instance/Real/**` 全程只读；不代用户重启 Real 实例。
- `Instance/Dev/Luker` 按 N-1 裁定视为只读，只允许 `git pull`。
- 脚本目标端口必须显式断言为 `8001` 或 `8003`；禁止静默回退到其他端口。
- 防误连标识（如 `INSTANCE-ROLE.txt`）只作为方案与 diff 预览，不落地。

## 端口结论

- `8001`：Dev SillyTavern
- `8002`：Real SillyTavern（只读）
- `8003`：Dev Luker
- `8004`：Real Luker（只读）
- `8000`：出厂默认值重灾区，标记为禁止直接使用。
- `3000`：系统保留冲突点，建议 Tavern-Viewer / TavernHeadless 改为 `3010` / `3020`，仅出预览。

## 浏览器自动化结论

- 可重复回归与 CI：使用 Playwright 1.62.1。
- 一次性交互诊断：使用 `chrome-devtools-mcp --autoConnect`。
- 两者均不新装；项目内需要依赖时只写入该项目 `devDependencies`。

## 验证与回滚

- 所有数字必须能回源到 `research/06` 或父任务裁定记录。
- 校验 `Instance/**` 无本轮写操作。
- 输出文件只限任务目录、真源仓草案或用户级 Skill 方案；不提交、不推送。
