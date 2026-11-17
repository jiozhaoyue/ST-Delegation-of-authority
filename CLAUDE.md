# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用命令

- 安装依赖：`npm install`
- 类型检查：`npm run typecheck`（运行 `tsc -b`）
- 构建全部：`npm run build`（执行 `version:sync` → 构建 shared-types → 构建 Rust core → 构建 server-plugin → 构建 sdk-extension → 构建 example-extension）
- 构建 Rust core 单独：`npm run build:core`
- 运行所有测试：`npm test`（执行 `version:sync` → `vitest run` → `cargo test --manifest-path crates/authority-core/Cargo.toml`）
- 运行单个测试文件：使用 Vitest，例如 `npx vitest run test/unit/example.test.ts` 或通过过滤器运行特定测试：`npx vitest run -t "test name"`（ Vitest 支持 `--testNamePattern`、`--retry` 等选项）
- 核心性能基准（CI 门槛）：`npm run bench:core`（目标：平均延迟 ≤150ms，P95 ≤300ms）
- 大规模负载基准：`npm run bench:scale`
- 同步可直接安装产物：`npm run sync:installable`
- 校验产物一致性：`npm run check:installable`
- 本地联调链接：`npm run dev:link`（构建并链接到本地 SillyTavern）
- 清理联调链接：`npm run dev:unlink`
- 版本同步：`npm run version:sync`
- 版本号提升：`npm run version:bump`

## 代码架构与结构

### 高层架构（分层）

```
SillyTavern 前端
  → window.STAuthority / AuthoritySDK
  → /api/plugins/authority/*          （Node server plugin，适配层）
  → localhost 内部 HTTP
  → Rust authority-core               （执行层：数据面与控制面权威执行）
  → SQLite + Blob 文件 + 私有文件
```

- **SDK extension**（`packages/sdk-extension`）：前端接入、权限弹窗、Security Center。
- **Node server plugin**（`packages/server-plugin`）：插件生命周期、路由、会话、权限评估、Agent Runtime、工作区版本树、SDK 安装、SSE 桥接。
- **Rust authority-core**（`crates/authority-core`）：axum + rusqlite + triviumdb，提供 SQL、Trivium 图数据库、KV 存储、Blob 存储、私有文件系统、HTTP 请求、后台任务、事件流、Agent Runtime 等能力。
- **数据隔离**：普通存储数据按用户 + 扩展隔离，扩展只能访问自身数据；Agent 只能在管理员登记并由当前用户获准访问的工作区内操作宿主文件。

### 项目目录结构

- `packages/`：npm workspaces（TypeScript 侧）
  - `shared-types/`：全量 DTO / 类型定义（唯一类型来源）
  - `server-plugin/`：Node adapter 公开 API 层（webpack 打包）
  - `sdk-extension/`：浏览器接入层
  - `example-extension/`：示例第三方扩展
- `crates/`：Rust 工作区
  - `authority-core/`：Rust 权威执行层（axum + rusqlite + triviumdb）
- `runtime/`：installable：实际插件加载用的运行时代码
- `managed/`：installable：按平台管理的部署产物
- `host-bridge/`：与酒馆宿主的集成补丁
- `scripts/`：构建/发布/联调脚本
- `stubs/`：宿主类型桩
- `docs/server/`：服务端文档（10 篇，全中文）
- `.authority-release.json`：installable 统一 release metadata（版本/hash/平台等）
- `.trellis/`：Trellis 任务与规范（用于任务管理）
- 代理/IDE 配置目录（`.claude/`、`.cursor/`、`.codex/` 等）由 Trellis 生成或用户自行添加，原则上不应修改其内容（除非明确意图）。

### 开发工作流

1. 前置条件：Node.js + npm，Rust toolchain，Windows x64 环境（用于生成 managed core）。
2. 常见调试：使用 `npm run dev:link` 将本项目构建并链接到本地 SillyTavern（假设 SillyTavern 与本项目在同一父目录下）。
3. 启用插件：确认 SillyTavern 配置中 `enableServerPlugins: true`，建议关闭 `AutoUpdate: false` 以避免自动覆盖。
4. 升级：在插件目录执行 `git pull`（安全更新仅执行 `git pull --ff-only`）。
5. 发布流程：`npm run typecheck && npm run build && npm test && npm run bench:core && npm run bench:scale && npm run sync:installable && npm run check:installable`。
6. 多平台发布由 GitHub Actions `Core Artifacts` workflow 完成：每个平台构建 core → 上传 artifact → 汇总生成 `authority-installable-multiplatform`。

### 重要约定与注意事项

- **Trellis 集成**：本项目使用 Trellis 进行任务管理。`.trellis/scripts/**`、`.trellis/agents/**`、`.trellis/workflow.md` 以及各平台目录（`.agents/`、`.claude/`、`.cursor/`、`.gemini/`、`.opencode/`、`.qoder/`、`.codebuddy/`、`.factory/`、`.pi/`、`.reasonix/`、`.trae/`、`.zcode/`、`.github/` 等均为 Trellis 生成的运行时和平台载体。在审查 PR 时，除非 PR 明确修改 Trellis 集成、该文件是主要主题、泄露秘密、存在语法或接线问题或与 PR 目标矛盾，否则不应对这些复制的文件留下逐行风格、措辞或局部重构注释。若 Trellis 生成的文件需要行为变更，请留下一个交接注释，请求上游 Trellis 修复，包含受影响路径、期望行为、观察证据或复现步骤，并说明修复应归因于上游。
- **文档语言**：项目文档（README、docs/server/*、排障章）全部为中文，与 Trellis spec 模板默认的英文要求相反。
- **权限评估顺序**：声明门控 → 管理员扩展覆盖 → 管理员默认(granted/denied/blocked) → 持久授权 → 会话授权 → 管理员默认(prompt) → 系统默认(granted)。
- **Security Center**：通过 `window.STAuthority.openSecurityCenter()` 打开，包含总览、扩展详情、数据资产、活动与排障、Agent 工作台、管理员策略、运维面板等版块。
- **Agent 工作区**：持久 Session（非一次性任务卡片），`Session → Run → Step → Generation`，`Invocation/Approval`，`Workspace history`。三种自主度 `plan` / `ask` / `auto`。工具三类：`host`（文件/搜索/补丁/终端/进程/Git/ST 状态/版本树）、`module`（映射 `ModuleHostService.execute()`）、`browser`（前端插件注册，短租约 + 幂等 claim）。
- **模型调用**：使用 OpenAI-compatible Chat Completions tool-call 协议。DOA 不限制 Run 的总步数/工具调用次数/总时长；管理员在模型连接中填写上下文窗口，长会话会自动生成可审计的摘要检查点并保留原始日志。
- **独立恢复入口**（不启动 SillyTavern）：`node plugins/authority/runtime/agent.cjs rescue status`，随后可用 `{log|diff|rollback|resume}` 子命令。

## 文档与排障

- 关键文档：
  - `docs/server/architecture.md`：架构分层、调用链、生命周期
  - `docs/server/http-api.md`：公开 HTTP / SSE API 清单
  - `docs/server/capabilities-and-isolation.md`：能力矩阵、隔离模型、安全边界
  - `docs/server/core-runtime.md`：Rust core 内部 API、健康检查、作业注册
  - `docs/server/install-update-release.md`：安装、更新、installable 产物
  - `docs/server/ai-integration-guide.md`：编程 AI 接入规则
  - `docs/server/agent-platform.md`：Agent Runtime、IDE、插件工具与独立恢复
  - `docs/server/agent-session-runtime.md`：Agent Session 日志、执行边界与崩溃恢复语义
- 常见排障：
  - Security Center 看不到：确认 `enableServerPlugins: true`；检查 `POST /api/plugins/authority/probe` 的 `installStatus`；若 SDK 目录冲突，删除旧目录后重启。
  - Core 无法启动：查看 `probe.core.state` 和 `probe.core.lastError`；确认当前平台在 `.authority-release.json` 的 `coreArtifactPlatforms` 中；当前预构建包不含 `darwin-arm64`，macOS Apple Silicon 用户需从完整源码运行 `npm run build:core`，直到 CI 提供该平台 artifact。
  - 503 / backpressure：`core_unavailable` + `category: core` 或 `job_queue_full`、`concurrency_limit_exceeded` + `category: backpressure`，调用方应退避重试。
  - Git 更新失败：Authority 的安全更新只执行 `git pull --ff-only`；不要把 `reset --hard` 当默认排障步骤。
  - SDK 状态冲突：检查 `SillyTavern/public/scripts/extensions/third-party/st-authority-sdk` 是否为 authority 管理的目录；备份后删除旧目录，重启让 authority 重新部署。
  - SQL 报权限错误：确认扩展声明了 `declaredPermissions: { sql: { private: true } }`；在 Security Center 查看 `sql.private` 授权或管理员策略。
  - 事件没有收到：确认声明了 `events.stream` 权限；Job 事件默认 channel 为 `extension:<extensionId>`。

## 当前限制与后续方向

- **当前限制**（摘自项目文档）：
  - Jobs 仅支持内置类型（`delay`、`sql.backup`、`trivium.flush`、`fs.import-jsonl`），不是任意代码执行。
  - 事件流为 SSE，不支持 WebSocket 和跨用户广播。
  - SQL 主要覆盖 `sql.private`。
  - Trivium 数据库节点数 ≥10000 时，TDB 会自动构建 QuIVer BQ-native Vamana 图索引，存储在 `<name>.tdb.quiver` 文件中。该文件是派生数据：portable package 不会导出它，导入后首次查询会自动重建（耗时数百 ms 至几秒）。如需 100% 精确召回率，可在 `searchAdvanced` 调用中传入 `forceBruteForce: true`。
- **后续方向**：更系统的压力基准与错误分类、更多内建 job 类型、更完善的事件订阅模型、Security Center 深度运维视图、公开发布后的升级迁移策略。

## 其他

- 请遵守项目的全局规则（如中文文档/注释/回复、检索先行、使用 diff 工具比较变更、高风险操作前需用户确认等），这些规则已在用户的全局 CLAUDE.md 中定义。
- 若需导入外部配置（如 OpenAI Codex、Gemini CLI 等），可使用 `/import` 命令扫描可导入项，然后 `/import --yes=<digest>` 应用用户级项目。不应手动读取外部代理配置文件或自行写入 Claude Code 配置。

---
注：本文件基于现有 README.md、package.json、.github/copilot-instructions.md 以及项目源码结构生成，旨在为后续的 Claude Code 实例提供快速上手指南。
<!-- TAVERN-RULES:START v3.0.0 -->
<!-- 本块由 tavern-harness/scripts/modules/rules_sync.py 自动生成，请勿手动编辑 -->
<!-- 真源: tavern-harness · registry/rules.json · 类别 host · v3.0.0 -->
<!-- 同步时间: 2026-11-17T13:55:32Z -->
<!-- 内容哈希: sha256:2207b50b05e47bb138b9c4541067f28c23e86e4469d22ba9f24b53a8eecc74e8（仅覆盖规则正文，不含头部与项目覆盖） -->
# 统一开发规则（v3.0.0 · 宿主 fork）

> 本块由 tavern-harness 生成，请勿手改正文。
> 规范全文在 `.trellis/spec/`；项目特例写文末「项目覆盖」。

## 通用红线

- **G-01** 需要用户决策时用问答工具，一次聚合多个问题；重大设计多轮问答。
- **G-02** 任何工具调用前先输出可见短汇报；禁止无文本直接调工具。
- **G-03** 多项改动先落计划文件；验收标准不得 TBD；执行中实时勾选。
- **G-04** 用文件实时记录进度与交接；丢弃 AI IDE 上下文后可续跑。
- **G-05** 独立任务并行发起；命令非阻塞；禁止空等与轮询。
- **G-06** 子代理任务自包含；模型与并发由用户裁定；阻塞宿主不开子代理。
- **G-07** 删除、覆盖、装依赖、大重构、对外写操作前必须显式授权。
- **G-08** 删除一律走回收站或归档；禁止用命令直接删除。
- **G-09** 变更用 diff 与块级编辑；禁整文件覆盖与 shell 重定向写源码。
- **G-10** Git 只用显式 pathspec；提交前校验暂存区；完成即推 origin。
- **G-11** 交付物零凭据、零隐私、零真实数据、零本机绝对路径。
- **G-12** 先检索复用；UI 复用设计系统；DB 复用 schema 与迁移；不自造。
- **G-13** 运行时零 CDN 与网络引用；无法本地化须说明并隔离。
- **G-14** 脚本禁硬编码业务数据；路径、端口、URL、阈值一律读配置。
- **G-15** 一仓一份脚本目录；模块登记；中控统一派发；禁一次性脚本。
- **G-16** UI 文案短；禁长句、合并连词、分隔符、括号说明、说明性副标题。
- **G-17** UI 布局紧凑；禁大间隔、大空白、横竖颠倒；改动必须截图检查。
- **G-18** UI 区域用阴影或色差区分；禁线条分割、边框滥用、卡片套卡片、中控台风格。
- **G-19** 异步等待必须有界；Worker 终止后置空；高频 DOM 更新用 rAF 合帧。
- **G-20** 耗时操作有进度与结果；失败不静默、不整体中断。
- **G-21** 发版前测试全绿、零回归；未验证项不得写成已验证。
- **G-22** 改前读 spec；复杂功能先写设计再写代码。
- **G-23** 文档、注释、回复用中文；代码标识符与专有名词除外。
- **G-24** 工作流改动覆盖 skills、MCP、agent、配置文件与 TDD，并留验证证据。
- **G-25** 单一真源；禁散落规则与副本；规范入 spec，注入只留短摘要。
- **G-26** 任何完成声明必须有可复现证据；未验证项如实标注。
- **G-27** 多事项物理分行；禁连词、分隔符、括号合并；单项断言独立成行。
- **G-28** 对话正文不贴完整文件内容；落地文件，只给可点击路径。

## 宿主 fork 红线

- **H-01** upstream 只读；改动只推 origin；拉取上游只用 ff-only。
- **H-02** 上游改动拆单一功能 PR；禁把不相关改动塞进同一个 PR。
- **H-03** 禁直接编辑上游快照；改动走公开函数、钩子或版本化 patch。
- **H-04** 原生 message.extra 与 chat.jsonl 是唯一数据源；禁私有数据库；写操作委托原生 API。
- **H-05** 权限最小化；禁顺手声明未使用的高危能力。
- **H-06** 端口与路径固定；占用即失败；禁静默回退到其他端口。
- **H-07** Dev 与 Real 只靠端口和路径区分；E2E 只对 Dev；启动即断言目标地址。
- **H-08** 端口段位：实例段独占；8000 禁用；3000 系统保留；周边工具 3010 起。
- **H-09** 交付前必须构建与测试；没有构建产物等于没有可运行实例。
- **H-10** 实例边界：运行时数据可写、宿主源码禁改、链接禁写穿；写入前备份。
- **H-11** 浏览器自动化分工：回归用 Playwright；一次性诊断用 chrome-devtools；依赖进项目。
- **H-12** 确定性判断用内容指纹；不用时间戳判断内容是否变化。

## 规范入口

- `.trellis/spec/tavern-host/index.md`

## 技能策略

- 允许 pack：dev, infra, upstream
- 禁止 pack：card

## 项目覆盖
（本仓自有内容，同步器保留；无则留空。）

<!-- TAVERN-RULES:END -->
