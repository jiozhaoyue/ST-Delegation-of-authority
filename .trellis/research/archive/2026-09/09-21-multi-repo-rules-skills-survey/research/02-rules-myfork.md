# Myfork 自定义规则提炼

生成时间：2026-09-21
调查范围：`D:\Repo\Tavern-repo\Myfork\` 下三个子项目 —— PureTavern、SillyTavern-Timelines、ST-Delegation-of-authority
排除项：`<!-- TRELLIS:START -->`~`<!-- TRELLIS:END -->` 块、各 agent 工具通用样板、README 功能宣传/安装说明、上游开源项目原有内容、node_modules/.git/dist/.history 等

---

## 汇总：跨项目共性规则

1. **提交必须推送远程（禁止仅本地提交）** — 出现于：SillyTavern-Timelines `AGENTS.md`（TRELLIS 块之外的用户指令）。原文：「每次提交必须推送到远程，禁止只做本地提交」「推送目标固定为 `origin`（jiozhaoyue fork），绝不推送到 `upstream`」。这是三仓中唯一明确成文的 Git 政策。

2. **三仓同属 `jiozhaoyue` fork 群，上游一律只读** — 出现于：PureTavern（origin=jiozhaoyue/PureTavern，上游 Lianues/PureTavern）、SillyTavern-Timelines（origin=jiozhaoyue/SillyTavern-Timelines，upstream=SillyTavern/SillyTavern-Timelines）、ST-DoA（自研主仓）。共性：`upstream` 只用于拉取，改动只落 `origin`。

3. **计划先行 / Trellis 任务制** — 出现于：三仓均有 `.trellis/`（config.yaml + spec + tasks + workspace）。ST-DoA 与 Timelines 的 `.trellis/workflow.md` 首条核心原则即「Plan before code」。ST-DoA 当前任务 `09-21-multi-repo-rules-skills-survey` 的 `prd.md` 的 Requirements/Acceptance Criteria 仍为 `TBD`，与全局规则「计划先行铁律」存在偏离（详见「坑/禁忌」）。

4. **中文文档 / 中文注释** — 出现于：ST-DoA 全部 docs、Timelines WIKI 与 spec、PureTavern 的 README 与 docs 均为中文；Timelines `optional-integration.md` 显式声明「实现层注释保持中文与现有代码一致」，而 Trellis 模板默认要求英文（`**Language**: All documentation must be written in **English**.`），属对框架默认的有意覆盖。

5. **「能力嗅探 + 可选降级」适配器模式（零硬依赖）** — 出现于：Timelines `.trellis/spec/frontend/optional-integration.md`（Authority 范式，沉淀自 09-12 任务）、PureTavern README「可选后端」与 `docs/architecture/legacy-compatibility-contract.md`。两者独立收敛到同一模式：外部能力不可用时主链路零行为变化。

6. **非破坏性 / 原生数据源唯一原则** — 出现于：Timelines WIKI 1.2「非破坏性与零私有数据库」、Timelines 09-12 PRD「核心原则（不可妥协）」第 1 条。原话：「原生 `message.extra` / `chat.jsonl` 永远是唯一数据源——卸载外部插件后插件功能必须完好」。

7. **禁止直接编辑上游快照目录** — 出现于：PureTavern `legacy-compatibility-contract.md`（「禁止直接编辑 `apps/web/legacy/upstream/**`」，确需改须先形成版本化 patch）。

8. **端口/路径约定固定、不自动回退** — 出现于：PureTavern `README.md`（dev 服务固定 `http://127.0.0.1:8899/`，「端口被占用时会直接报错，不会自动回退」）；Timelines `luker-plugin-standards.md`（本地实例 `https://127.0.0.1:8003`）；ST-DoA（core 走 `127.0.0.1:<ephemeral-port>`，standalone 默认 `8173`）。

9. **最小权限声明** — 出现于：Timelines `optional-integration.md` 第 3 条「只声明实际用到的权限……绝不顺手声明 `agent.*` / `fs.*` / `http.*`」；ST-DoA README「扩展声明 → 用户授权 → 管理员收口」。

10. **测试命令固定为 `node --test tests/*.test.mjs`（Timelines）与 `npm test`（ST-DoA）** — 见逐项目明细。

---

## 逐项目明细

### ST-Delegation-of-authority（主仓，详见后节专项）

**证据文件**：
- `README.md`（行 1-260 全文）
- `docs/server/ai-integration-guide.md`（全文，行 1-260）
- `docs/server/README.md`（行 1-50「快速事实」）
- `docs/server/architecture.md`（行 1-120）
- `docs/server/capabilities-and-isolation.md`（行 1-180）
- `docs/server/core-runtime.md`（行 1-80）
- `docs/server/install-update-release.md`（行 1-70）
- `docs/server/agent-platform.md`（行 1-90）
- `package.json`（scripts 段）
- `.authority-release.json`（全文）
- `host-bridge/manifest.json`（全文）
- `.trellis/config.yaml`（packages / channel 段）

**自定义规则**：

- **四层职责边界不可混淆（架构硬约束）**：公开合同在 Node adapter（`packages/server-plugin`），权威执行在 Rust core（`crates/authority-core`），浏览器接入在 SDK（`packages/sdk-extension`），发布落地在 installable（`runtime/` + `managed/` + `.authority-release.json`）。改任何一层都必须检查另外三层是否需要联动。（`docs/server/ai-integration-guide.md` §10）
- **公开 API 与内部 API 的路径判别规则**：`/api/plugins/authority/...` = 公开 adapter 层；`/v1/...` = 内部 core 层。给前端写代码默认只碰第一种。（同文件 §3.2）
- **六条「不要做」（AI 生成代码的禁区）**：① 不让浏览器直连 `authority-core`；② 不绕过 `PermissionService`；③ 不手写路径去碰数据文件（SQL/`.tdb`/Blob 布局）；④ 不把 `trivium.private` 当 embedding 服务（调用方必须自己传 `vector`）；⑤ 不把 `jobs.background` 当任意代码执行平台（仅 `delay`/`sql.backup`/`trivium.flush`/`fs.import-jsonl`）；⑥ 不把 Trivium mapping integrity 路径当业务热路径。（同文件 §6.1-6.6）
- **新增公开能力必须走 8 步推荐顺序**：`shared-types` DTO → core 内部能力 → `CoreService` 代理 → server service/route → SDK client → 文档/Security Center → 性能敏感项跑 `bench:core`+`bench:scale` → 测试与 installable 同步。（同文件 §7.1）
- **改 installable 触发条件**：SDK 源码变 / server-plugin 编译输出变 / core 变 / release metadata 或 managed 逻辑变 → 必须跑 `npm run sync:installable && npm run check:installable`。（同文件 §5）
- **运行时生成的 `.authoritypkg.zip` / diagnostic `.json.gz` 不是 installable 产物**，不得误提交进仓库。（同文件 §5）
- **权限评估优先级链（不可改序）**：声明门控 → 管理员扩展覆盖 → 管理员默认(granted/denied/blocked) → 持久授权 → 会话授权 → 管理员默认(prompt) → 系统默认(granted)。（`docs/server/capabilities-and-isolation.md` §3）
- **统一分页合同**：优先复用 `CursorPageRequest` / `CursorPageInfo`，「不要为 audit / jobs / events / SQL / Trivium 再发明一套新的分页 envelope」；并须区分「公开工作流接口」与「控制面聚合接口」的分页语义。（`ai-integration-guide.md` §2.6）
- **limits 三层区分**：core hard ceiling / adapter transport routing threshold（`effectiveInlineThresholdBytes`，当前真正生效）/ compatibility transfer-max field（`effectiveTransferMaxBytes`，仅兼容保留）。（同文件 §2.7）
- **Git 更新安全规则**：Authority 的安全更新只执行 `git pull --ff-only`；「不要把 `reset --hard` 当默认排障步骤」。（`README.md` 排障章）
- **不提供任意 shell / VM / 服务端代码托管 / 宿主文件系统直通**；Agent 工作区终端是单独高风险能力，只能在管理员登记的根目录内运行，始终审批并先建检查点。（`README.md` 权限与安全章）
- **Agent Session 日志不可变性**：唯一事实源为 `<DATA_ROOT>/_authority-global/authority/state/agent/sessions/<session-id>/journal*.jsonl`，append-only + SHA-256 前向链；「完整损坏、乱序、segment 缺口或断链会拒绝打开，仅最后一个 segment 的最后一条未写完整记录可被安全截断」；同一 Session 只允许一个持有可核验 token 的 writer。（`docs/server/agent-platform.md`）
- **工具副作用三段式**：「意图先落盘、效果随后发生、结果最后落盘」；重启恢复时「尚未开始的工具不会被自动重放」「已开始但没有结果的外部调用不会被假定失败」，非幂等调用标 `outcome_unknown` 并暂停。（同上）
- **API key 不返回前端**，只暴露已配置状态、mask 和 fingerprint；远程 endpoint 必须 HTTPS，本机回环可用 HTTP。（同上）
- **host-bridge 补丁约束**：`host-bridge/manifest.json` 声明 `supportedPackageVersions: ["1.18.0"]`、`patchModule: patch.cjs`、8 个 `syntaxCheckTargets`（含 `public/scripts/extensions.js`、`public/script.js`、`src/endpoints/chats.js` 等）——改动宿主文件前必须先过语法检查目标清单。
- **Trellis packages 声明**：`example-extension` / `sdk-extension` / `server-plugin` / `shared-types`（`packages/*`）+ `authority-core`（`crates/authority-core`），`default_package: @stdo/example-extension`；channel worker guard `idle_timeout: 5m`、`max_live_workers: 6`。（`.trellis/config.yaml`）
- **文档语言**：全部中文（README、docs/server/*、排障章）。与 Trellis spec 模板默认的「All documentation must be written in English」相反。

**专属命令**（`package.json` scripts）：
```
npm install                 # 安装依赖
npm run version:sync        # 版本号同步（所有 build/test/typecheck 前置）
npm run build               # version:sync → shared-types → core → server-plugin → sdk-extension → example
npm run build:core          # 仅构建 Rust core
npm run typecheck           # version:sync && tsc -b
npm test                    # version:sync && vitest run && cargo test
npm run bench:core          # SQL/分页基线延迟（CI gate: avg ≤ 150ms, p95 ≤ 300ms）
npm run bench:scale         # 大规模 Trivium / mapping / 混合负载基准
npm run sync:installable    # typecheck → build → test → installable.mjs sync
npm run check:installable   # 产物一致性校验
npm run dev:link / dev:unlink  # 本地 SillyTavern 联调链接
```

**发布流程**（README「发布流程」）：
```
npm run typecheck && npm run build && npm test
npm run bench:core && npm run bench:scale
npm run sync:installable && npm run check:installable
```
多平台发布由 GitHub Actions `Core Artifacts` workflow 完成，汇总为 `authority-installable-multiplatform`。

**坑/禁忌**：
- 最常见遗漏：漏 `shared-types`、漏 SDK client、漏 route 层权限校验、漏 installable 同步。（`ai-integration-guide.md` §2.1）
- 调试优先级：`/api/plugins/authority/probe` → `core.state` 是否 `running` → session 有效 → 权限 granted → route 映射 → control audit 的 warning/error → installable 是否与源码一致。（同文件 §9）
- 「前端看起来没更新」优先查 `managed/sdk-extension/*` 是否同步、`.authority-release.json` 是否更新、是否需要重启 ST。（同文件 §9）
- 当前不含 `darwin-arm64` 预构建产物，macOS Apple Silicon 需源码构建 core。（README 排障章）
- 当前任务 `09-21-multi-repo-rules-skills-survey/prd.md` 的 Requirements / Acceptance Criteria 仍为 `TBD`，违反用户全局规则「计划先行铁律」（`task.py start` 前必须回填 PRD）。

---

### PureTavern

**证据文件**：
- `AGENTS.md`（全文 1 行，TRELLIS 块之外）
- `README.md`（行 1-260）
- `docs/architecture/legacy-compatibility-contract.md`（行 1-80）
- `docs/architecture/legacy-ui-strategy.md`（行 1-50）
- `docs/architecture/feature-module-structure.md`（行 1-100）
- `docs/migration/module-inventory.md`（行 1-60）
- `.github/workflows/sync-upstream.yml`（全文）
- `package.json`（scripts 段）
- `git log --oneline -30`（二改判据）

**自定义规则**：

- **「尽量少调用子agent」** — `AGENTS.md` 全文仅此一行，是用户本人的工作流偏好，直接覆盖「复杂任务优先分派多个子代理并行执行」的默认倾向。
- **Legacy-first UI 策略（长期决策，非临时方案）**：根入口 `/` 由 SillyTavern 原版页面长期负责 DOM 与交互，Vue 只用于 `/modern.html` 与隔离的新页面。「原版 DOM 子树不得同时由 Vue 和 jQuery/上游 ESM 管理」。（`legacy-ui-strategy.md` §1）
- **上游快照目录只读**：`apps/web/legacy/upstream/**` 禁止直接编辑；确需改上游文件「必须先形成可复核的版本化 patch」。允许改动的优先级为 ①用上游公开函数/导出/事件/DOM 锚点 → ②经 `src/legacy-hook/**` 拦截 → ③加独立 CSS/模块/版本化 patch → ④版本化 patch。（`legacy-compatibility-contract.md` §1）
- **功能模块结构强制模板**：`features/<module>/` 下必须有 `module.ts`（唯一装配入口）、`README.md`、`domain/`、`application/`、`ports/`、`infrastructure/`、`legacy/register-routes.ts` + `legacy/contract.json`、`tests/`。（`feature-module-structure.md`）
- **跨模块协作禁令**：「跨模块协作只注册/消费 `platform/features/standard-capabilities.ts` 中的类型化 Capability；禁止直接 import 另一模块的 Repository」；模块之间禁止直接读取对方的 IndexedDB 表或 Vue 内部状态。（`feature-module-structure.md` 步骤 7 / `module-inventory.md` §3）
- **模块可删性约束**：「任一非核心模块可中途删除，而不破坏应用启动、数据层或其他模块」；删除模块后其他模块只能失去一项可选 Capability。（`module-inventory.md` §1.2/§3）
- **平台只定义两个固定 Object Store**：`records`（JSON-safe）与 `blobs`（Blob + JSON metadata）；「增加 module、collection 或 record 类型不会改变 IndexedDB Object Store，因此没有按模块递增数据库 schema 的工作」。（`feature-module-structure.md`）
- **纯前端为默认实现，可选后端只能增强**：后端调用必须可降级，Provider 构造与响应处理始终在前端；远程代理「只代理前端已经构造好的最终聊天补全 HTTP 请求，不存储 URL、访问 Key、Provider Key 或请求内容」。（`README.md` 架构章 / 远程代理章）
- **迁移状态机（9 态）**：`inventory` / `designed` / `legacy-hosted` / `migrating` / `browser-ready` / `backend-optional` / `completed` / `removed` / `deferred`；「状态以各模块目录内的 `module.json` 为准」。（`module-inventory.md` §2）
- **dev 端口固定 8899 且不回退**：`http://127.0.0.1:8899/`，「端口被占用时会直接报错，不会自动回退到其他端口」。（`README.md` 开发与构建章）
- **密钥存储不视为安全 Vault**（明文 IndexedDB / 远程后端运行时 Key 内存态、刷新不保留）。（`README.md` 密钥与隐私章 / 浏览器限制章）
- **上游同步自动化**：`.github/workflows/sync-upstream.yml` 每 6 小时 `git merge --no-edit FETCH_HEAD` 上游默认分支到 fork 默认分支并 `git push origin`——这是本仓 fork 工作流的核心机制（本仓二改判据：`git log` 中带 `feat: 添加*后端*`、`fix(ios)`、`feat: 添加一个自动同步上游仓库的action` 等均为自研提交）。

**专属命令**（`package.json` scripts，节选）：
```
pnpm install / pnpm dev              # dev 固定 127.0.0.1:8899
pnpm build                           # 产物 apps/web/dist
pnpm typecheck / pnpm test / pnpm lint / pnpm format
pnpm legacy:prepare / legacy:sync / legacy:sync:check
pnpm legacy:contracts:generate       # 生成版本化契约
pnpm legacy:contracts:check --source "<上游源码路径>" --version <ver>
pnpm legacy:verify
pnpm android:sync / android:debug / android:release / android:open
pnpm ios:sync / ios:open             # 仅 macOS
pnpm harmony:sync / harmony:build / harmony:deploy
pnpm desktop:dev / desktop:build
pnpm vscode:build / vscode:package
```

**坑/禁忌**：
- 环境依赖固定：Android 需 JDK 21 + Android SDK Platform 36 + Build Tools 36；HarmonyOS 在 `ubuntu-22.04` 安装固定版本 command-line-tools。
- CI 不自动打包：APK/IPA/HAP/Desktop/VSIX 的 workflow 均为**手动触发**（`workflow_dispatch`）。
- 测试版发布（`Build Test Release`）在构建期间若 `main` 已前移，「发布阶段会拒绝提交和打 Tag，避免用过期源码创建 Release」。
- 签名材料禁令：证书、Profile、密钥库和密码不得提交到仓库。
- 浏览器限制无法绕过：CORS、TLS、Mixed Content、PNA 是纯 Web 前端模式的硬边界；HTTPS 网页通常必须用 HTTPS 代理。

---

### SillyTavern-Timelines

**证据文件**：
- `AGENTS.md`（TRELLIS 块之外，行 12-18）
- `WIKI.md`（行 1-150 目录与 1.1-3.6 节；行 5.1-5.4；行 6.1-6.3）
- `.trellis/spec/frontend/luker-plugin-standards.md`（全文）
- `.trellis/spec/frontend/optional-integration.md`（全文）
- `.trellis/spec/frontend/quality-guidelines.md`（全文）
- `.trellis/spec/frontend/index.md`（Guidelines Index 表）
- `.trellis/tasks/archive/2026-09/09-12-authority-integration/prd.md`（「核心原则（不可妥协）」+ Requirements + AC）
- `src/adapters/authority-adapter.js`（行 1-70）
- `.gitignore`（全文）
- `manifest.json`（全文）
- `git log --oneline -20`

**自定义规则**：

- **提交必须推送远程** — `AGENTS.md`：任何一批 `git commit` 完成后必须立即 `git push origin <当前分支>`；工作/归档/日志提交全部适用；例外仅当用户同轮明确说「先不要推」；「推送目标固定为 `origin`（jiozhaoyue fork），绝不推送到 `upstream`」。
- **零私有数据库（核心哲学，不可妥协）**：「绝不在插件目录下建立独立的私有 SQLite、LevelDB 或 IndexedDB 专有数据库」；所有节点/分支/书签/标签/快照命名存于原生 `chat.jsonl` 的 `message.extra` 契约。（`WIKI.md` §1.2）
- **只读分析与原生委托写**：所有写操作（打标签、改书签、合并分支）必须委托给原生酒馆核心 API（`saveChatDebounced`、`createBranch`、`openCharacterChat`），「绝不擅自使用 Node.js 直接覆写用户聊天文件」。（`WIKI.md` §1.2）
- **Line 0 保护 + 深克隆**：采摘/分支创建/分支合并时「必须严格保留源会话 Line 0 的头部完整性，且必须深克隆消息内容，杜绝浅拷贝引用污染」。（`WIKI.md` §2.1）
- **Authority 集成四条不可妥协原则**：① 零私有数据源（Authority 中只存可随时全量重建的派生索引）；② 零硬依赖（不装 Authority 时行为 100% 一致，无新增 console error、无 UI 空壳）；③ 最小权限声明（仅 `trivium.private`/`sql.private`/`storage.kv`/`jobs.background`，绝不声明 `agent.*`/`fs.*`/`http.*`）；④ 主链路隔离（索引构建与 embedding 全异步后台化，失败只影响语义搜索自身）。（`09-12-authority-integration/prd.md`）
- **可选集成状态机约定**：状态机固定 5 态 `absent / disabled / connecting / ready / error`，非法转移静默忽略；「模块级单例状态机统一管理生命周期，禁止散落的布尔标记」；错误态冷却 60s，禁止无界重试风暴。（`optional-integration.md` §1；`authority-adapter.js` 行 1-30）
- **Node 可测模块约定**：「禁止静态导入宿主模块」——`script.js`、`extensions.js`、jQuery、`toastr` 只能在 `index.js`（浏览器入口）导入；src 下纯逻辑模块一律通过参数注入（`getHeaders`、`fetchImpl`、`client`、`provider`）；浏览器专用 DOM 模块须在 `typeof document === 'undefined'` 时安全短路。（`optional-integration.md` §2）
- **确定性哈希**：需要「内容是否变化」判断时「一律用内容指纹，而非时间戳」（如 `hashText` FNV-1a）。（同上 §2.4）
- **Luker 插件清单规范**：`manifest.json` 必需字段 `display_name`/`loading_order`（数值越小越早加载）/`js`/`css`/`requires`/`optional`；设置面板顶层容器必须带 `data-extension-name` 属性；UI 标准类名 `.extension_container` / `.inline-drawer` / `.inline-drawer-toggle` / `.inline-drawer-content` / `.menu_button`。（`luker-plugin-standards.md` §1-§3）
- **宿主上下文获取优先级**：`window.Luker?.getContext?.() ?? window.SillyTavern?.getContext?.() ?? getContext()`。（`luker-plugin-standards.md` §2）
- **模态框集成规范**：不展示时挂载于 `.timelines-modal-storage.hidden`，打开时 `document.body.appendChild(modal)` 提升到 `<body>` 根节点以避免 z-index 被父容器裁切；旧版 `callPopup` 字符串形式已废弃，改用 `context.callGenericPopup` / `new context.Popup` / `context.loader.show|hide`。（`luker-plugin-standards.md` §4）
- **三条 Forbidden Patterns**：① 禁止 Direct In-place Chat Mutation；② 禁止 Cytoscape 样式里的动态 JS 闭包（`line-color: ele => ...`，每帧逐元素执行），须用静态 selector + `data(...)` + class；③ 禁止主线程同步跑 >100 节点的大图 Dagre 布局。（`quality-guidelines.md`）
- **关键节点保护不变量（Critical Node Protection Invariant）**：所有折叠/过滤/剪枝算法中，以下节点**永不**可被删除或折叠——根节点、分叉节点（in/outDegree>1）、叶子节点（outDegree=0）、书签节点、记忆里程碑节点（`has_memory`/`hasMemory`）、当前活跃消息节点。（`quality-guidelines.md`）
- **图算法必须为纯函数模块**：LCA、链检测、LOD 折叠、lineage 追踪须放在与 DOM/Cytoscape 生命周期解耦的纯模块（`src/api.js`、`src/lod-service.js`、`src/graph-builder.js`），「so they can be 100% unit tested in Node.js」。（`quality-guidelines.md`）
- **微内核总线开放 API**：`window.TimelinesExtensionApi`，含 `registerNodeDecorator`（带 `priority`、`beforeRender`、`decorateNode`、`onClick`）、`registerToolbarAction`、`registerContextMenuAction`、`getLineageFromElements`、`computeLowestCommonAncestor`、`getChatBranchNodes`、`set/getTimelineGraphState`。（`WIKI.md` §5.1-5.2）
- **性能硬约束**：拓扑布局必须走 Web Worker（主线程 `preset` 吸附坐标）；图算法「路径回溯算法必须使用预索引父节点映射，杜绝 O(N) 循环全图检索」；边与节点强去重（Set/Map 哈希索引）。（`luker-plugin-standards.md` §5）
- **spec 语言策略**：Trellis spec 模板默认「All documentation must be written in English」，本仓 `optional-integration.md` 显式覆盖：「实现层注释保持中文与现有代码一致；本 spec 面向 AI/开发者，正文可中文」。
- **.gitignore 约定**：`.history/`、`.codex/`、`.claude/`、`.cursor/` 为「本地 AI 工具运行产物（不应随插件分发）」；`luker_timelines_*.png` 为「端到端自动化验证截图」。（`.gitignore` 全文）

**专属命令**：
```
node --test tests/*.test.mjs        # 全量单元测试（118+ 用例，无 DOM 依赖）
/tl                                 # 斜杠命令：打开时间线视图
/tl r                               # 重新加载时间线图
```
端到端验证走 Chrome DevTools Protocol（CDP）对本地真实实例（`https://127.0.0.1:8003`）验证 UI，产物为 `luker_timelines_*_verified.png`。

**坑/禁忌**：
- 「不安装 Authority 时适配器停留在 `absent`，全部上层模块静默休眠，主图谱链路零影响」；`src/adapters/authority-adapter.js` 顶部注释明确「本模块必须可在 Node 测试环境独立导入运行」。
- 不新增私有数据库、不擅自覆写 `chat.jsonl`、不用时间戳判断内容变化。
- 大图同步 Dagre 布局会冻结 UI（>100 节点必须走 Worker）。
- Cytoscape 样式内联闭包是性能陷阱（每帧逐元素执行）。

---

## ST-Delegation-of-authority 专项：结构与能力总览

### 一、目录结构总览

根目录本身即是一个可直接安装的 SillyTavern 服务端插件（installable）。

```
ST-Delegation-of-authority/
├─ packages/                      # npm workspaces（TypeScript 侧）
│  ├─ shared-types/               # @stdo/shared-types：全量 DTO / 类型定义（唯一类型来源）
│  ├─ server-plugin/              # @stdo/server-plugin：Node adapter 公开 API 层（webpack 打包）
│  │  └─ src/{routes.ts, runtime.ts, constants.ts, index.ts, types.ts,
│  │           services/*, store/*, routes/*, events/*, agent-cli.ts}
│  ├─ sdk-extension/              # @stdo/sdk-extension：浏览器接入层
│  │  └─ src/{sdk.ts, client.ts, client/*, api.ts, dom.ts, permission-prompt.ts,
│  │           security-center.ts, security-center/*, host-event-recorder.ts}
│  └─ example-extension/          # @stdo/example-extension：示例第三方扩展
├─ crates/
│  └─ authority-core/             # Rust 权威执行层（axum + rusqlite + triviumdb）
│      Cargo.toml: axum 0.8 / rusqlite 0.31(bundled) / tokio 1 / tower-http 0.6
│                  triviumdb (git, tag v0.7.1) / ureq / url / serde / base64 / half / time
├─ runtime/                       # installable：实际插件加载用的运行时代码
│  ├─ index.cjs                   # 插件入口（package.json main）
│  ├─ agent.cjs                   # 独立恢复 CLI 入口（不启动 SillyTavern）
│  └─ *.map
├─ managed/                       # installable：按平台管理的部署产物
│  ├─ core/                       # authority-core 可执行产物 + 元数据（按 <platform>-<arch>）
│  ├─ sdk-extension/              # 自动部署到 ST 的 SDK 产物
│  └─ host-bridge/                # 宿主桥接产物
├─ host-bridge/                   # 与酒馆宿主的集成补丁
│  ├─ manifest.json               # schemaVersion 1 / bridgeVersion 1.1.1 / host "sillytavern"
│  │                             # supportedPackageVersions ["1.18.0"] / patchModule patch.cjs
│  │                             # assets: public/scripts/authority-host-bridge.js + src/authority-host-bridge.js
│  │                             # syntaxCheckTargets: 8 个宿主文件
│  ├─ patch.cjs
│  └─ assets/
├─ scripts/                       # 构建/发布/联调脚本
│  ├─ build-core.mjs              # 构建 Rust core
│  ├─ benchmark-core.mjs          # bench:core（CI gate）
│  ├─ benchmark-scale.mjs         # bench:scale
│  ├─ installable.mjs             # installable sync / check
│  ├─ versioning.mjs              # 版本同步与 bump
│  ├─ copy-managed-core.mjs / copy-static.mjs
│  └─ link-dev.mjs / unlink-dev.mjs   # 本地 SillyTavern 联调
├─ stubs/                         # 宿主类型桩（globals.d.ts / script.js.d.ts / scripts/）
├─ docs/server/                   # 服务端文档（10 篇，全中文）
├─ .authority-release.json        # installable 统一 release metadata（版本/hash/平台）
├─ .trellis/                      # Trellis 任务与规范
└─ package.json / tsconfig*.json / vitest.config.ts / Cargo.toml / Cargo.lock
```

`.authority-release.json` 关键字段：`pluginId: "authority"`、`pluginVersion: "1.6.8"`、`sdkExtensionId: "third-party/st-authority-sdk"`、`sdkVersion`、`assetHash`、`coreVersion`、`coreArtifactHash`、`coreArtifactPlatform`、`coreArtifactPlatforms`（5 个）、`coreArtifacts`（逐平台 `binarySha256` + `artifactHash`）、`hostBridgeVersion: "1.1.1"`、`hostBridgeArtifactHash`、`buildTime`。

预构建平台（`coreArtifactPlatforms`）：`android-arm64`、`linux-arm64`、`linux-x64`、`linux-x64-musl`、`win32-x64`。**不含 `darwin-arm64`**。

### 二、对外暴露的 API / 能力清单

**分层**：
```
SillyTavern 前端 → window.STAuthority / AuthoritySDK
  → /api/plugins/authority/*            （公开 adapter 层，Node server-plugin）
  → http://127.0.0.1:<ephemeral-port>/v1/*  （内部 core 层，Rust authority-core）
  → SQLite + Blob 文件 + 私有文件
```
公开传输复用 SillyTavern 自身 HTTP 端口，不额外暴露独立公网端口。

**认证**：公开层 `x-authority-session-token`；SSE 先以 session header 换 30 秒单次 ticket（长期 token 不进 URL）；core 层 `x-authority-core-token`（空则全通过）。错误合同为结构化 `AuthorityErrorPayload` = `{error, code, category, details}`。

**SDK 客户端能力（`AuthorityClient`）**：

| 能力 | SDK 调用 | 权限资源 | 风险等级 | 系统默认 |
|---|---|---|---|---|
| SQL 数据库 | `client.sql.*` | `sql.private` | medium | granted |
| Trivium 图数据库 | `client.trivium.*` | `trivium.private` | high | granted |
| KV 存储 | `client.storage.kv.*` | `storage.kv` | low | granted |
| Blob 存储 | `client.storage.blob.*` | `storage.blob` | low | granted |
| 私有文件 | `client.fs.*` | `fs.private` | medium | granted |
| HTTP 请求 | `client.http.fetch()` | `http.fetch` | medium | granted |
| 后台任务 | `client.jobs.*` | `jobs.background` | medium | granted |
| 事件流 | `client.events.subscribe()` | `events.stream` | low | granted |
| Agent Runtime | `client.agent.*` | `agent.run` / `agent.browser` | — | **prompt** |

内置 job type（仅此 4 种）：`delay`、`sql.backup`、`trivium.flush`、`fs.import-jsonl`。

**公开 HTTP 路由分组**（`docs/server/http-api.md`）：
- 诊断与会话：`POST /probe`、`POST /session/init`、`GET /session/current`、`POST /permissions/evaluate`、`POST /permissions/evaluate-batch`、`POST /permissions/resolve`
- 扩展与控制面视图：`GET /extensions`、`GET /extensions/:id`、`POST /extensions/:id/grants/reset`
- KV/Blob：`POST /storage/kv/{get,set,delete,list}`、`POST /transfers/{init,:id/append,:id/read,:id/discard}`、`POST /storage/blob/{put,commit-transfer,get,open-read,delete,list}`
- 私有文件：`POST /fs/private/{mkdir,read-dir,write-file,write-file-transfer,read-file,open-read,delete,stat}`
- SQL：`POST /sql/{query,exec,batch,transaction,migrate,list-migrations,list-schema,stat}`、`GET /sql/databases`
- Trivium：`POST /trivium/{resolve-id,resolve-many,insert,insert-with-id,upsert,bulk-upsert,get,update-payload,update-vector,delete,bulk-delete,link,bulk-link,unlink,bulk-unlink,neighbors,search,search-advanced,search-hybrid,search-hybrid-context,tql,tql-mut,create-index,drop-index,index-text,index-keyword,build-text-index,...}`（30+ 端点）
- 其余分组：`/jobs/*`（含 `POST /jobs/list` 为公开 page-aware 列表接口）、`/events/*`、`/admin/*`（`/admin/agent/*` 额外要求 ST 用户是 admin）、`/admin/policies`

**Security Center 控制面**（`window.STAuthority.openSecurityCenter()`）7 个板块：总览 / 扩展详情 / 数据资产 / 活动与排障 / Agent 工作台 / 管理员策略 / 运维面板。

**统一分页合同**：`CursorPageRequest` / `CursorPageInfo`。

**控制面诊断种类**：`permission`、`usage`、`warning`、`error`。

**管理员包格式**：导出 `.authoritypkg.zip`，诊断归档 `.json.gz`，上传上限 `256 MiB`。

**Agent 平台**：持久 Session（非一次性任务卡片），`Session → Run → Step → Generation`，`Invocation/Approval`，`Workspace history`。三种自主度 `plan` / `ask` / `auto`。工具三类：`host`（文件/搜索/补丁/终端/进程/Git/ST 状态/版本树）、`module`（映射 `ModuleHostService.execute()`）、`browser`（前端插件注册，短租约 + 幂等 claim）。模型调用走 OpenAI-compatible Chat Completions tool-call 协议。DOA 不限制 Run 的总步数/工具调用次数/总时长。

**独立恢复入口**（不启动 SillyTavern）：
```bash
node plugins/authority/runtime/agent.cjs rescue status
node plugins/authority/runtime/agent.cjs {log|diff|rollback|resume}
```

### 三、与酒馆宿主的集成方式

**集成模型（三段式）**：

1. **Node server plugin 生命周期**（`packages/server-plugin/src/index.ts`）：
   - 启动：`createAuthorityRuntime()` → `registerRoutes(router, runtime)` → `runtime.install.bootstrap()`（SDK 部署 + core 校验）→ `runtime.core.start()`
   - 退出：`runtime.core.stop()` → 清空 runtime 引用
   - Runtime 服务对象（16 个）：`adminPackages`、`events`、`audit`、`core`、`transfers`、`extensions`、`install`、`policies`、`permissions`、`sessions`、`storage`、`files`、`http`、`jobs`、`trivium`

2. **SDK 自动部署**（首次启动自动完成，无需手动复制）：
   - 目标路径固定：`<SillyTavernRoot>/public/scripts/extensions/third-party/st-authority-sdk`
   - 管理权判据：目标目录内的 `.authority-managed.json`
   - 目标目录存在但非 Authority 管理 → install status 进入 `conflict`，「插件不会强行覆盖别人的目录」
   - 目录名不强制等于插件 ID；SillyTavern 按 `info.id = authority` 识别
   - 触发重新部署的条件：目录缺失或版本/hash 漂移

3. **host-bridge 宿主补丁**（`host-bridge/`）：
   - `host: "sillytavern"`，`supportedPackageVersions: ["1.18.0"]`，`bridgeVersion: "1.1.1"`
   - 注入 2 个文件：`public/scripts/authority-host-bridge.js`、`src/authority-host-bridge.js`
   - `patchModule: patch.cjs` 执行补丁
   - 8 个 `syntaxCheckTargets` 前置语法校验：`public/lib/eventemitter.js`、`public/scripts/extensions.js`、`public/scripts/events.js`、`public/script.js`、`public/scripts/group-chats.js`、`src/endpoints/chats.js`、`public/scripts/authority-host-bridge.js`、`src/authority-host-bridge.js`

**安装/升级/卸载**：
```bash
# 安装（ST 根目录）
git clone https://github.com/Youzini-afk/ST-Delegation-of-authority.git plugins/authority
node plugins.js install https://github.com/Youzini-afk/ST-Delegation-of-authority.git

# 升级
cd plugins/authority && git pull        # 安全更新仅 git pull --ff-only

# 卸载
删除 SillyTavern/plugins/authority（如需同时移除 SDK，再删 public/scripts/extensions/third-party/st-authority-sdk）
```
前置条件：`enableServerPlugins: true`；建议 `AutoUpdate: false`。

**本地联调目录约定**（`dev:link` 假设）：
```
<parent>/
├─ SillyTavern/
└─ ST-Delegation-of-authority/
```

**core 运行边界**：正常插件模式下由 Node adapter 设置 `AUTHORITY_CORE_HOST=127.0.0.1`、`AUTHORITY_CORE_PORT=<动态可用端口>`、`AUTHORITY_CORE_TOKEN=<随机 token>`、`AUTHORITY_CORE_VERSION`、`AUTHORITY_CORE_API_VERSION=authority-core/v1`；**端口是运行时临时端口，浏览器和外部系统都不应假设它有固定端口**。standalone 调试模式默认端口 `8173`（非稳定合同）。core 健康检查 `GET /health` 返回 `buildHash`、`platform`、`pid`、`uptimeMs`、`requestCount`、`errorCount`、`activeJobCount`、`queuedJobCount`、`maxConcurrency`、`currentConcurrency`、`workerCount`、`lastError`、`jobRegistrySummary` 等。

**数据落盘路径约定**：
- 每用户数据根：`<user.rootDir>/extensions-data/authority`（下分 `state/`、`storage/`、`sql/`）
- 每用户控制面库：`<user.rootDir>/extensions-data/authority/state/control.sqlite`
- 全局管理员策略库：`<DATA_ROOT>/_authority-global/authority/state/control.sqlite`
- KV 每扩展一库：`<user.rootDir>/extensions-data/authority/storage/kv/<sanitized-extension-id>.sqlite`
- Agent Session 日志：`<DATA_ROOT>/_authority-global/authority/state/agent/sessions/<session-id>/journal*.jsonl`

**隔离维度**：SillyTavern 用户 × 扩展 ID × 资源 target（部分能力）× 数据库名（SQL/Trivium）× channel（events）× hostname（HTTP fetch）× job type（jobs）。
