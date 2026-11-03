# Research: 用户意图陈述（R3）——待用户确认

- **Query**: 基于调查把用户主张「暴露 API，成为基础设施；想联动打造生态但又不耦合」写成可被用户一句"对/不对"确认的陈述
- **Scope**: mixed（`research/00` B0 用户原话 + research/04/10/11 + 本轮 15 仓实测）
- **Date**: 2026-09-24
- **状态**: ⚠️ **待用户确认**（AC-3，由主代理转交用户；用户可逐条答"对/不对"，或整体确认）

---

## 确认方式

以下 6 条陈述（I1–I6）均标注了证据来源。请用户**逐条确认或更正**：
- 回复形如「I1 对、I2 对、I3 不对（应为 …）」即可；
- 若整体无误，回复「都对」；
- 任何一条更正后，主代理修订本文件并再次请求确认（对应 PRD AC-3「或按更正修订后再次确认」）。

---

## 意图陈述

### I1 · Authority 的定位是「给别的插件用的基础设施底座」

> 我开发 Authority（ST-Delegation-of-authority）的目的，不是做一个终端用户的功能插件，而是把它做成**基础型插件**：统一提供 SQL / KV / Blob / 私有文件 / HTTP / 后台任务 / 事件流 / Trivium 图数据库 / Agent Runtime 这套后端能力，外加「先声明后使用」的权限治理——让其它前端扩展**不必各自造轮子**（滥用 localStorage、让用户手填 API、直连外部服务）。

- 证据：用户原话「暴露 api，成为一个基础设施」（`research/00` §B0）；`research/04` §一「定位关键词：基础型（foundational）——它本身不是给终端用户的功能插件，而是给别的插件用的底座」；Authority README / `docs/server/architecture.md`。

### I2 · 「联动打造生态但不耦合」已经机制化：Companion Modules + Feature Flags

> 我想要插件之间联动、形成生态，但**绝不互相耦合**。落地机制就是 Authority 已有的两样东西：
> ① **Companion Modules**——插件在自己目录声明 `.authority/module.json` 事务，其它插件通过 `client.modules.execute(moduleId, txName, input)` 或语法糖 `client.tx('<moduleId>:<txName>')` 调用，**只依赖声明契约，绝不 import 对方内部实现**；
> ② **Feature Flags**（26 条特性路径）——接入方先 `hasFeature()` 判断，可用时增强、不可用时静默降级。
> 我名下的插件已经**各自独立收敛到这个模式**：Timelines（Authority 集成四条不可妥协原则）、zip-converter（Authority 可用即增强、不可用绝不阻塞主路径）、BgLoader（不连 Authority 也必须完整工作）。

- 证据：`research/10` §B.1 第 2/3 层（原文标注「★ 这是『联动但不耦合』的答案」）；`research/02` §Timelines（09-12 集成 PRD 四原则）；`research/01` §zip-converter（CLAUDE.md:7 定位）；`research/01` §BgLoader（存储倒置重构 +「不连 Authority 也必须如此」）。

### I3 · Authority 与宿主、与其它插件是「并存」关系，不是「替代/接管」

> Authority 自己只是 `plugins/` 下与其它服务端插件**同级**的一员：它只规定「使用 Authority 能力的扩展」要走它的 SDK，**不接管其它插件的路由或生命周期**；它管「谁能访问什么资源」（能力治理），不管「谁装了、谁在跑」（插件管理）。跨宿主运行的插件**禁用 Host Bridge**（宿主补丁路径），只用 Authority 的可移植子集——Luker 上它必须无 Host Bridge 也能工作。

- 证据：`research/10` §B.2「并存，不是替代」；统一规则 L0-12（跨宿主插件禁用 Host Bridge，2026-09 判定）；`research/07`（Luker 上 Host Bridge 失败仅 `console.warn`，内核不受影响）。

### I4 · 改动按质量分层处置：通用改进提上游（单一功能 PR），生态能力留在自有仓

> 对宿主和上游项目：质量高、通用的改动走 **PR 提上游**，且**一个 PR 只做一件事**（功能单一、可独立 review），绝不一次提超大 PR；插件型、生态型的能力留在自有仓做扩展（如 Switcher 专门用纯 TypeScript 架构解耦 UI 与宿主，**就是为向 Luker 官方仓提核心 PR 铺路**）。我的核心顾虑是**避免陷入「自己维护 + 提交 PR + 多方联动」的地狱**——所以宁可少而可审，不可多而失控。

- 证据：`research/00` §B0 派生问题 1/2/4（用户原话「不可能一次提个超大 PR，必须使其功能单一、可 review」「不想陷入自己维护的地狱」）；`research/01` §ST-Switcher（「为向 Luker 官方仓库提交核心 PR 奠定纯 TypeScript 架构底座」）；统一规则 L1-MF-2。

### I5 · 我对「规则 / 经验 / 环境」用了和插件同一套哲学：唯一真源 + 无损分发 + 不耦合副本

> 我不只把**代码能力**基础设施化，也把**开发知识**基础设施化：统一规则真源放在私有仓 `tavern-harness`（带远程、每次推送），用幂等同步器分发成**自包含块**落进各仓——真源丢失副本也不失效、任何时刻可校验漂移、各仓自有内容永不被触碰。这和插件的「真源 + 分发 + 降级」是同一个思想。

- 证据：`design.md` §一设计哲学 P1/P2/P3（唯一真源单向分发 / 无损可校验 / 不耦合）；`research/11` §一/§七（真源仓已建并推送，规则块落 11 仓、`--verify` 14/14 零漂移）；统一规则 v1.1.0 实际落仓内容（本仓 AGENTS.md/CLAUDE.md 内的 TAVERN-RULES 块）。

### I6 · 实例数据是不可再生的红线资产：Real 只读、开发只用 Dev、靠端口+路径区分

> `Instance/Real/**` 是真实使用数据区（GB 级、上千会话），**只读纪律高于一切开发便利**；一切开发、测试、E2E 只允许对 `Instance/Dev/**`；Dev 与 Real 各宿主版本完全一致，**版本号不能用于区分**，只能靠端口（8001 Dev ST / 8002 Real ST / 8003 Dev Luker / 8004 Real Luker）与路径区分；统一调整配置、错开端口是为了防误连，而**最大的风险是误连 Real，不是端口冲突**。

- 证据：`research/00` §B11（用户原文「分为真实使用实例和开发用实例……所有数据禁止更改」）；统一规则 L0-1（实例隔离铁律，红线）、L1-MF-10（Dev/Real 端口纪律）；`research/06` §5.2、`research/12` §六红线 1/2。

---

## 陈述边界的显式声明（防止过度解读）

1. I1–I3 描述的是 Authority 的**现在时**（已实现的机制），不是规划——Companion Modules、Feature Flags、权限治理均已实现并有源码级证据。
2. I4 的「哪些具体功能提 PR」**尚未裁定**（属于子任务 `09-22-authority-ecosystem-pr-strategy` / C-09 的职责），本陈述只确认「分层处置的原则」本身。
3. I5 中「各仓自有内容永不被触碰」指同步器的块外零改动承诺；`ST-Switcher` 等例外仓按用户裁定单独处理过。
4. I6 中 N-1（Dev\Luker 误推风险）已按 2026-09-22 裁定关闭（只读实例），不与本条冲突。
