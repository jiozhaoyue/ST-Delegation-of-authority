# D5 落地 · 浏览器自动化分工（定稿）

> **D5 已裁定（2026-09-22）**：两者并用——可重复回归/CI 用 **Playwright 1.62.1**，一次性交互诊断用 **`chrome-devtools-mcp --autoConnect`**。**都不新装**；项目内确需依赖只写该项目 `devDependencies`，禁止全局安装。
> 数据源：`research/06-dev-env-instances-ports.md` §4（浏览器自动化可用性）。
> 检索先行（L0-3）取证：GitHub API `search/repositories?q=chrome-devtools-mcp` 首位命中 **`ChromeDevTools/chrome-devtools-mcp`**（约 52.5k★，ChromeDevTools 官方仓）→ 现成方案确认，不自研。

---

## 1. 分工矩阵（写进规则的核心约定）

| 场景 | 工具 | 启动方式 | 目标实例 |
|---|---|---|---|
| **可重复回归 / CI / E2E 断言** | Playwright 1.62.1 | `npx --no-install playwright test`（脚本化、可留 trace/截图） | 仅 `8001` / `8003` / `8899` |
| **一次性交互诊断**（看 DOM / 网络 / 控制台、排障） | `chrome-devtools-mcp` | 项目级 `.mcp.json`：`pnpx chrome-devtools-mcp@latest --autoConnect` | 仅 `8001` / `8003`（诊断 Real = 红线违规） |

**边界写死**：
1. **可重复的回归 → 必须是 Playwright**（可入库、可重跑、可断言）；MCP 会话是一次性的，**不得**作为回归资产。
2. **一次性排障 → 优先 MCP**（免写脚本）；若同一排障结论需要复现 ≥2 次，改写为 Playwright 用例沉淀下来。
3. 两者都**不新装**：Playwright 本机已存在（`C:\nvm4w\nodejs\node_modules\playwright`，v1.62.1，`npx --no-install playwright --version` 成功）；chrome-devtools-mcp 已在 JS-Slash-Runner 仓群 2 个项目有 `.mcp.json` 配置（research/06 §4）。
4. 具体项目确需声明依赖时，**只写该项目 `devDependencies`**（锁定版本），禁止 `npm i -g` / 全局摆弄。
5. MCP 注册复用 JS-Slash-Runner 已有写法（项目级 `.mcp.json`），不注册到全局 `~/.claude.json`。

---

## 2. 本机可用性基线（回源 research/06 §4）

| 资源 | 状态 | 证据 |
|---|---|---|
| Playwright 包 | ✅ 1.62.1 全局可用 | `C:\nvm4w\nodejs\node_modules\playwright\package.json` |
| Playwright 内核 | ✅ 已下载至 `chromium-1234`（含 `INSTALLATION_COMPLETE`） | `%LOCALAPPDATA%\ms-playwright\` |
| 系统浏览器 | ✅ Chrome（`C:\Program Files\Google\...`）+ Edge（在用，约 60 进程） | research/06 §4 |
| chrome-devtools-mcp | ✅ 可用（未全局注册） | JS-Slash-Runner 2 仓 `.mcp.json`（`pnpx chrome-devtools-mcp@latest --autoConnect`） |
| MCP 曾实际驱动过浏览器的痕迹 | ✅ `ms-playwright\mcp-chrome-*` 完整 Chromium 配置目录（2026-03-05） | research/06 §4 |
| Puppeteer | ⚠️ 只有内核缓存、无包 | research/06 §4（**不纳入**分工，避免第三套工具面） |

---

## 3. 与实例纪律的衔接（硬约束）

1. **只连 Dev**：自动化目标端口必须 ∈ `{8001, 8003, 8899}` 且经 `04-test-dev-rules.md` §2 的启动断言；`8002` / `8004` 一出现即显式失败。
2. **profile 隔离**：Playwright 用 `test.use({ ... })` / 独立 `userDataDir`；MCP 的持久 profile（`ms-playwright\mcp-chrome-*`）只用于诊断会话，**不得**让诊断 profile 与任何实例共享登录态后把 cookie 带回 Real。
3. **只读交互**：诊断/测试会话对实例页面的操作不得触发"保存聊天 / 写 data 目录"类动作；禁止在自动化会话中修改实例配置面板。
4. **Dev 的 CORS 形态保持不动**：Dev 实例 `cors.origin: ["null"]` + 仅 `[OPTIONS]` 对 `file://` 自动化友好（research/06 §5.4 末条）；禁止为自动化改 Real 的 CORS（Real 本就禁触）。

---

## 4. 反模式（违反即审查不通过）

- ❌ 为跑 E2E 全局安装新版 Playwright / 覆盖 1.62.1。
- ❌ 把 chrome-devtools-mcp 注册成全局 MCP 后跨项目常驻。
- ❌ 用 MCP 交互诊断**代替**回归测试（一次性结论不入 CI）。
- ❌ 自动化脚本里硬编码 `localhost:8002/8004` 或从环境变量"静默回退"到任何非 Dev 端口。
- ❌ 把测试产生的 trace / 截图 / har 写进 `Instance\**`（产物落证路径见 `04-test-dev-rules.md` §4）。

---

## 5. 回源索引

| 本文结论 | 回源位置 |
|---|---|
| Playwright 1.62.1 + 内核 + 系统 Chrome/Edge 齐备 | `research/06` §4 表 |
| chrome-devtools-mcp 已有配置写法 | `research/06` §4 表（chrome-devtools-mcp 行） |
| MCP 未全局注册 / 官方 playwright MCP 未启用 | `research/06` §4 表（末两行） |
| 两者并用为设计推荐并被用户裁定 | `research/13-next-session-auto-queue.md` Batch 2-A |
