<!-- TRELLIS:START -->
# Trellis Instructions

These instructions are for AI assistants working in this project.

This project is managed by Trellis. The working knowledge you need lives under `.trellis/`:

- `.trellis/workflow.md` — development phases, when to create tasks, skill routing
- `.trellis/spec/` — package- and layer-scoped coding guidelines (read before writing code in a given layer)
- `.trellis/workspace/` — per-developer journals and session traces
- `.trellis/tasks/` — active and archived tasks (PRDs, research, jsonl context)

If a Trellis command is available on your platform (e.g. `/trellis:finish-work`, `/trellis:continue`), prefer it over manual steps. Not every platform exposes every command.

If you're using Codex or another agent-capable tool, additional project-scoped helpers may live in:
- `.agents/skills/` — reusable Trellis skills
- `.codex/agents/` — optional custom subagents

Managed by Trellis. Edits outside this block are preserved; edits inside may be overwritten by a future `trellis update`.

<!-- TRELLIS:END -->

<!-- TAVERN-RULES:START v3.0.0 -->
<!-- 本块由 tavern-harness/scripts/modules/rules_sync.py 自动生成，请勿手动编辑 -->
<!-- 真源: tavern-harness · registry/rules.json · 类别 host · v3.0.0 -->
<!-- 同步时间: 2026-11-21T18:31:26Z -->
<!-- 内容哈希: sha256:0b45376e7a8aa51a7f6ad859be2a757c77b8a04534227c63c065b851a515b79a（仅覆盖规则正文，不含头部与项目覆盖） -->
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
- **G-29** opencode/workbuddy 会话必须用子代理多并行推进；禁止主代理单干。
- **G-30** 子代理必须使用免费模型；调用前实时查询注册表并确认 cost 输入输出均为 0；禁止误用付费模型。
- **G-31** 输出与工具调用禁止简写；禁止把用户简写直接当作具体模型、工具、仓库或路径名。
- **G-32** 禁用 checkout --/restore/reset --hard/clean -fd 回滚未提交改动；回滚前先 stash 或备份并报备路径。（来源 ST-pack-transfer/iron-rules#40）
- **G-33** dev server 等长驻服务用系统命令起独立进程（Start-Process/nohup/setsid），禁用 agent 内置后台 shell。（来源 ST-pack-transfer/iron-rules#38）
- **G-34** 读数/体积/进度同源实时可复核；读不到显示「未提供」，禁假 0/假缓存/假成功。（来源 ST-pack-transfer/iron-rules#5）
- **G-35** 禁重复造轮子：通用算法/格式/API 封装优先用三方库或仓内去重，自写仅限业务逻辑。（来源 ST-pack-transfer/quality-guidelines 三方库规范）
- **G-36** 主代理只兜底：全局调配、仲裁、进度勘察、多模态复核；子代理不可用时才亲自实现。（来源 ST-pack-transfer/subagent-collaboration#G-8）
- **G-37** 派发角色按内置→仓内专用→主代理亲自三级顺序选，不跳级；亲自做须记降级原因。（来源 ST-pack-transfer/subagent-collaboration#G-10）
- **G-38** 仓内专用角色统一入库（.zcode/agents/*.md）、纳入 git、随时可调用；禁散落临时目录。（来源 ST-pack-transfer/subagent-collaboration#G-11）
- **G-39** 每个子代理独占产出文件；同一文件同一时刻只有一个写者；只读角色只给读工具。（来源 ST-pack-transfer/subagent-collaboration#G-12）
- **G-40** 一轮并发派发多角色子代理成蜂群，主代理同轮推进自身工作；禁串行接力、禁 wait/轮询空等。（来源 ST-pack-transfer/subagent-collaboration#G-9）

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
