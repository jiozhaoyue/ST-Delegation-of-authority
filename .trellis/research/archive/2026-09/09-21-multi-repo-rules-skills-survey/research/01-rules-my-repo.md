# My-repo 自定义规则提炼
生成时间：2026-09-21

> 提炼范围：`D:\Repo\Tavern-repo\My-repo` 下 7 个子项目（ST-Assets-Manger 为空目录，跳过）。
> 已排除：`<!-- TRELLIS:START -->`~`<!-- TRELLIS:END -->` 框架样板、各 agent 工具通用自带指令、README 宣传/安装说明、上游开源项目原有文档。
> 注意：6 个非空子项目中有 5 个（除 ST-shujuku-rebuild、ST-chatfilesys-rebuild 部分外）都内嵌了同一份 `sync-rules.ps1` 自动生成的 `<!-- UNIFIED-RULES:START -->` 统一规则摘要块——**该块是同步产物，非项目自定义**，其中真正的"自定义"部分只在其 §9「项目特定覆盖机制」段落（本项目覆盖了哪些统一规则）。以下汇总只收真正的自定义内容。

---

## 汇总：跨项目共性规则

1. **实例隔离铁律（最高频，全部 6 个非空项目）**：开发/修复/测试只能在代码库工作区内进行；**严禁向本地酒馆实例目录（`D:\Repo\Instance\Real\Luker\*`、`D:\Repo\Instance\Test\SillyTavern\*`）复制/写入任何文件**；实例插件安装与更新只能走 Git（`git clone`/`git pull`）或酒馆原生扩展安装器。 — 出现于：ST-BgLoader, ST-zip-converter, ST-chatfilesys-rebuild, ST-git-improve, ST-shujuku-rebuild, ST-Switcher（经由统一规则块）；ST-zip-converter 另在 `AGENTS.md` 与 `CLAUDE.md` 双重强调
2. **计划先行铁律**：Trellis 任务 `task.py start` 前必须回填 `prd.md`（Requirements/Acceptance Criteria 不得为 TBD）；复杂任务另需 `design.md` + `implement.md`；`implement.md` 复选框随执行**实时勾选**，不许任务结束后批量补勾。教训来源：09-12 任务代码完成三片后 PRD 仍为 TBD（2026-09-21 回填）。 — 出现于：ST-zip-converter（`CLAUDE.md`/`AGENTS.md`），与全局 CLAUDE.md 同源
3. **完成即推送**：每个工作阶段完成并通过测试后必须 `git push` 到 origin，不得只提交不推送。 — 出现于：ST-zip-converter, ST-BgLoader（+统一规则块 §4）
4. **强制 diff 工具 + 严禁用命令行写文件**：修改现有文件必须用 `Edit`/`replace_file_content` 做局部块级替换；禁止 `Write` 整文件覆盖；禁止用 PowerShell/bash/`node -e`/`echo`/重定向符直接改写源码、配置与数据文件。 — 出现于：ST-zip-converter, ST-BgLoader（+统一规则块 §2），与全局 CLAUDE.md 同源
5. **交互式问答规范**：需要用户决策/澄清/选技术路线时必须用交互式问答工具（`AskUserQuestion`/`ask_question`），**严禁在正文里以提问结束回合**；每次提问必须**聚合 ≥2 个问题**一次性呈现；不得主动中止流程。 — 出现于：ST-zip-converter, ST-BgLoader, ST-chatfilesys-rebuild（+统一规则块 §1）
6. **检索先行**：实现任何功能前必须先检索是否存在现成方案/工具/技能/库，不造轮子；双通道（WebSearch/WebFetch + GitHub API）；`search-gate` hook 强制校验，豁免 `.trellis/`、`docs/`、`tasks/` 与只读操作，紧急开关 `TRELLIS_SEARCH_GATE=0`。 — 出现于：ST-zip-converter, ST-BgLoader（+统一规则块 §6），与全局 CLAUDE.md 同源
7. **测试即质量门、零回归**：发版前测试必须全绿，不接受回退。 — 出现于：ST-zip-converter（`npm test`）, ST-BgLoader（`npm test`/E2E）, ST-chatfilesys-rebuild（单测+宿主 e2e）, ST-shujuku-rebuild（~7700 用例零回退）, ST-git-improve, ST-Switcher（`npm test`）
8. **宿主 CSS 作用域纪律**：插件注入宿主的样式严禁全局选择器泄漏（`*`/`body`/`:root`/`::-webkit-scrollbar`/裸酒馆原生类）。 — 出现于：ST-zip-converter（双前缀铁律，最严厉）, ST-chatfilesys-rebuild（`chatfilesys-*` 前缀）, ST-BgLoader（`st-bg-media-container` 独立图层）
9. **宿主适配只许进桥接层**：宿主平台差异（TT/Luker/通用 ST 三态）集中在一个 host-bridge 模块，不许散落业务层。 — 出现于：ST-shujuku-rebuild（`shared/host-bridge.ts`）, ST-zip-converter（`host-bridge.js`）, ST-Switcher（STBridge）, ST-BgLoader（宿主嗅探）
10. **文档先行**：改动前先读 `.trellis/spec/` 对应层规范；复杂功能（>100 行或跨多模块）需在 `docs/superpowers/specs/` 有设计文档。 — 出现于：ST-zip-converter, ST-BgLoader, ST-shujuku-rebuild（+统一规则块 §8）
11. **项目 AGENTS.md 内声明统一规则覆盖**：如 ST-zip-converter/ST-BgLoader 声明「完成推送规范：本项目用 `develop`/`master` 分支」「子代理模型：本项目用 `claude-sonnet-4`」，覆盖必须说明理由。 — 出现于：ST-zip-converter, ST-BgLoader, ST-shujuku-rebuild（同一模板文本）
12. **统一规则由 `sync-rules.ps1` 同步、勿手改**：`<!-- UNIFIED-RULES:START -->` 块自动生成，变更走 Center 仓库 `unified-development-rules.md`。 — 出现于：全部内嵌该块的项目

---

## 逐项目明细

### ST-zip-converter（最丰富，同时有 CLAUDE.md + AGENTS.md）

**证据文件**：`ST-zip-converter/CLAUDE.md`（全 66 行）、`ST-zip-converter/AGENTS.md`（23-100、102-385）、`ST-zip-converter/README.md`、`ST-zip-converter/SECURITY.md`、`ST-zip-converter/docs/research/filename-placeholders-root-cause.md`、`ST-zip-converter/docs/research/luker-extension-mechanics-and-git-prune.md`、`ST-zip-converter/docs/research/security-audit-and-public-release.md`、`ST-zip-converter/.trellis/spec/frontend/component-guidelines.md`、`ST-zip-converter/.trellis/spec/frontend/state-management.md`、`ST-zip-converter/.trellis/spec/frontend/quality-guidelines.md`、`ST-zip-converter/.trellis/spec/frontend/directory-structure.md`、`ST-zip-converter/.trellis/spec/frontend/hook-guidelines.md`、`ST-zip-converter/.trellis/spec/backend/database-guidelines.md`、`ST-zip-converter/.trellis/spec/backend/error-handling.md`、`ST-zip-converter/.trellis/workspace/jiozhaoyue/journal-1.md`

**自定义规则**：
- **项目定位**：四酒馆（SillyTavern / Luker / TauriTavern / PureTavern）数据包互转工作站；**纯前端为主、Authority 服务端为可选增强层**（2026-09-21 用户确认，不转向前后端混合架构）。核心功能纯浏览器闭环，Authority 可用时增强、不可用时静默降级，绝不阻塞主路径。（CLAUDE.md:7、AGENTS.md:89-93）
- **三形态同构核心**：同一份 `src/core/` 跑在独立 Web（`index.html`+`#app`）/ 酒馆扩展插件（`host-bridge.js` 注入扩展设置抽屉）/ Node-Vitest（无 `Worker` 时自动主线程降级）三种入口。
- **分层边界（硬性）**：`src/core/` 纯逻辑**禁止 DOM 依赖**；`src/ui/` 可 DOM；`src/storage/`；`src/vendor/` 是 zip.js/fzstd 本地副本**勿升级改动**，只用已有 API。（CLAUDE.md:32-38、AGENTS.md:32-35）
- **CSS 双前缀铁律（最严厉，实测事故）**：`style.css` 所有规则必须带 `.app-container`（独立）或 `.st-converter-drawer-app`（插件）前缀。裸选择器（`.menu_button`/`.inline-drawer`/`.text_pole`/`.checkbox_label` 等酒馆全站类）会污染宿主全站 UI——2026-09 实测发生并修复，严禁回归。配色一律继承宿主 `--SmartTheme*` 变量 + `var(..., 回退值)`，禁止硬编码金色系。CI 自查：`grep '^\.' style.css | grep -vc 'app-container\|st-converter-drawer'` 必须为 0。（CLAUDE.md:58、AGENTS.md:51、component-guidelines.md:85-144）
- **平台代码 vs 布局代码双轨制**：宿主检测返回 `st|luker|standalone`（平台码），转换器只认 `st|l|tt|pt`（布局码）。凡把宿主平台传给 `convert()`/文件名模板，必须经 `host-bridge.js` 的 `hostLayoutCode()` 归一（`luker→l`）；`/api/users/backup` 等端点调用则用平台码。（CLAUDE.md:42、AGENTS.md:52-53）
- **宿主端点差异**：`/api/users/backup` ST 不支持 selection（全量导出+插件内过滤），Luker 支持透传勾选；恢复端点 `/api/users/restore`。
- **宿主识别协议（顺序不可颠倒）**：`globalThis.lukerContext` 存在 → luker；否则 `SillyTavern` 存在或 `#extensionsMenu` → st；否则 standalone。Luker **同时暴露** `SillyTavern` 与 `lukerContext`，`window.luker`/`#luker-app` 是死信号。服务端用 `GET /version` 校验（Luker 形状含 `stCompatVersion`）。export 后软校验：Luker 含 `manifest.json`，ST 不含。
- **产物统一出口**：所有转换/宿主拉取产物进待导出区（`export-queue.js`），**不自动下载**；临时条目在下载/存工作区时才入 IndexedDB；ExportQueue 渲染走 rAF 合帧防高频重建。（CLAUDE.md:52-54、AGENTS.md:55）
- **浏览器 API 必须特性检测回退**：`showSaveFilePicker`、drag-out `DownloadURL`（仅 Chromium）、`navigator.storage.estimate` 配额条。（AGENTS.md:56）
- **有界等待（bounded wait）硬规则**：任何对 DOM 媒体事件（`canplay`/`error`/`onload`/`play()`）或跨源 `fetch()` 的 `await` 必须经超时或 destroy 信号兜底 settle。实测挂死：`IframeRenderer.render` 只等 `onload`，快速切换中 iframe 被 destroy 则 promise 永久悬置。禁止让渲染/挂载 promise 永远 pending（会让测试挂死）。（error-handling.md:30-34、component-guidelines.md:26）
- **双模板同步铁律**：`index.html`（静态）与 `src/ui/workbench-template.js` 是同一 UI 的**两份独立维护副本**，结构改动必须在同一次提交同时改两处，否则独立模式断裂。自查：`grep -c "<new-id>" index.html src/ui/workbench-template.js` 两处均须 ≥1。
- **Worker terminate 后必须重置 `workerInstance = null`**：被 terminate 的 Worker 忽略所有后续 `postMessage`，忘记重置会让后续每次转换永久静默挂死（见 commit `034b7ab`）。AbortSignal 不能 `postMessage`，须在主线程监听。
- **高频进度回调必须 rAF 合帧**：流式 fetch ~50 chunk/秒，同步 `setProgress` 曾累积 14 个 80-107ms 长任务导致宿主页面卡顿。
- **OPFS 半成品生命周期**：暂停=关闭 writable（不 abort）保留半文件；恢复先试 `Range: bytes=<received>-`，非 206 则丢弃重取；catch 块清理引用的变量必须在 `try` 外声明（否则 TDZ ReferenceError）。
- **Luker 备份 selection 陷阱**：`selection.settings=true` 会隐式打包 `data/<user>/backups/` 历史快照目录，2GB 备份目录会让"仅设置"拉取变成 1.4GB 下载。
- **开源安全基线**：零个人隐私泄露（本地路径/真名/私有邮箱）；零凭据泄露；真实数据彻底隔离（`*.zip`/`data-zip/`/`data-*/`/`samples/` 严禁入库）；Git 提交走 GitHub 隐私中继邮箱。（security-audit-and-public-release.md:13-17、SECURITY.md）
- **`src/vendor/` 依赖自包含**：ST 扩展管理器 Git URL 一键克隆安装后**无需 `npm install` / `npm run build`**，开箱即用（内建本地封装 zip.js + 纯 JS fzstd 解压），杜绝 `Failed to resolve module specifier`。
- **目录平铺规范（Luker）**：用户私有扩展放 `data/<user>/extensions/<name>/`（**平铺，绝不嵌套 `third-party`**）；全局扩展放 `public/scripts/extensions/third-party/<name>/`。嵌套 `third-party/third-party` 会导致该目录下所有子插件全军覆没。（luker-extension-mechanics-and-git-prune.md:73-88）
- **Git 浅层精简（Shallow Shrink）**：保留酒馆 UI 一键更新能力的同时压缩 80%+；截断前必须先清本地 tag + `git update-ref refs/remotes/origin/HEAD <HEAD>`，否则 `git prune --expire=now` 报 `Exit Status 128: Failed to traverse parents`。

**专属命令**：
```bash
npm test                          # Vitest 全量（187 项 / 30 文件）
npx vitest run test/xxx.test.js   # 单文件
npx vitest run -t "用例名"         # 单条用例
npm run dev                       # vite 开发服务器 http://localhost:5173
npm run build                     # vite build --base=./（GitHub Pages）
npm run gen-fixtures              # 重新生成测试固件 fixtures/
python ./.trellis/scripts/task.py current   # 当前 Trellis 任务
```
无独立 lint/typecheck 命令——类型契约靠 JSDoc + 运行时目标守卫，质量门槛就是 `npm test` 全绿。

**坑/禁忌**：
- 严禁写本地酒馆实例目录；实例更新只走 Git。
- 裸 CSS 选择器污染宿主（2026-09 实测，最严重事故）。
- Worker terminate 后未重置实例 → 后续转换永久静默挂死。
- 渲染 promise 无界等待 → 测试挂死（stress test 3）。
- 文件名占位符六大根因（宿主原生导出分支硬编码绕过模板引擎、`handle` 未透传、`sourceName` 写死、芯片点击失焦光标重置为 0、无实时预览、`$` 转义风险）——见 filename-placeholders-root-cause.md。

---

### ST-BgLoader

**证据文件**：`ST-BgLoader/AGENTS.md`（23-29 + 统一规则块）、`ST-BgLoader/README.md`、`ST-BgLoader/.trellis/spec/backend/quality-guidelines.md`、`ST-BgLoader/.trellis/spec/backend/error-handling.md`、`ST-BgLoader/.trellis/spec/backend/database-guidelines.md`、`ST-BgLoader/.trellis/spec/backend/logging-guidelines.md`、`ST-BgLoader/.trellis/spec/frontend/component-guidelines.md`、`ST-BgLoader/.trellis/spec/frontend/state-management.md`、`ST-BgLoader/.trellis/spec/frontend/hook-guidelines.md`、`ST-BgLoader/.trellis/spec/frontend/type-safety.md`、`ST-BgLoader/.trellis/workspace/jiozhaoyue/journal-1.md`（Session 1-14）

**自定义规则**：
- **项目定位**：次世代 SillyTavern 富媒体背景与沉浸式氛围增强插件；零转码直放、硬件加速解码、多媒体全格式、微粒天气、音频反应律动、2.5D 视差、智能场景联动。针对官方视频插件 CPU 软解转码痛点的替代方案。
- **三层持久化架构（关键，勿混淆）**：
  - **Layer 1（唯一源端）**：酒馆服务端 `backgrounds/` 目录——与原生背景同一目录。上传 `POST /api/backgrounds/upload`（multipart，字段名 `avatar`），删除 `POST /api/backgrounds/delete`（`{bg: <filename>}`），静态路由 `backgrounds/<file>` 支持 HTTP Range。非图片文件对原生 `/all` 列表不可见 → 用同目录清单 `st-bg-loader-manifest.json` 编目。**服务端文件永不被缓存维护驱逐**。
  - **Layer 2（纯缓存）**：浏览器 `CacheStorage` + `IndexedDB` 索引，仅做 L1 缓存与 LRU，`clearAll()` 绝不碰服务端。
  - **Layer 3（设置）**：durable 副本是服务端文档 `backgrounds/st-bg-loader-settings.json`（`{version, revision, updatedTimestamp, settings}`）；`localStorage` 是快缓存与降级回退；写入 800ms 尾沿去抖、单飞串行、最新载荷胜出；init 时 `reconcileSettings` 按 revision 收敛（高者胜、平局服务器胜）。
- **架构方向（2026-09-13 用户纠正）**：媒体**从设计上就该存酒馆服务端原生目录**（与原生背景同一逻辑同一位置），不连 Authority 也必须如此；浏览器存储只配当缓存且可管理；Authority 只是增强层。曾误入"浏览器优先"路线被纠正为存储倒置重构。
- **无框架子系统类约定**：无 React/Vue，组件=类（构造注入依赖，无 service locator/全局）；每个创建 DOM 的类**必须实现 `destroy()`** 移除节点并释放资源；`render()` 返回创建元素的 promise 且必须无条件 settle。
- **A/B 双缓冲图层**：背景媒体挂进 layer A/B，新项在非活跃层渲染 → 交叉淡入 → `dur + 50` ms 后销毁旧层；`mountMedia` 开头立即 finalize 上一状态以取消待处理淡入。任何新媒体类型都必须走图层系统，禁止在图层外挂载。
- **`setOptions` 不得清除不属于自己的样式**：曾有 visualizer 无条件清空容器 `style.filter`（filter 引擎设置的），被 E2E 套件捕获。
- **设置扇出代替 hooks**：设置变更经单一 `applySettingsToSubsystems()` 扇出到所有子系统；子系统暴露 `setOptions(<自己的切片>)`/`apply*`，对持久化无状态。
- **事件总线代替 context/callback**：`PublicAPI` 实现 `on/off/emit`，监听器级错误隔离；跨模块通知用它，且它是用户脚本面，事件即契约。
- **PublicAPI 面（`src/api/PublicAPI.ts`）是用户脚本接口**：只做加法变更，每个新方法必须在 `README.md` 记录。
- **日志规范**：每行以 `[ST-BgLoader]` 开头（子系统加限定符 `[ST-BgLoader AudioEngine]`）；`console.warn` 是主导级别（可恢复降级）；错误对象作为最后参数传入（不 stringify）；**绝不记录绝对本地路径或可识别用户数据**（commit a568b10）；热路径（渲染循环/visualizer 帧回调）禁止 debug 日志。
- **错误两层**：硬失败 → `throw new Error` 带上下文（URL + HTTP 状态）；可恢复降级 → `try/catch` + `console.warn` 继续。禁止空 catch、禁止 reject 非 Error、禁止 render/mount promise 永久 pending。
- **运行时零依赖**：插件运行时无依赖（仅 devDependencies：typescript/vite/puppeteer-core）；**新增运行时依赖必须先讨论**。
- **公开 API 面只做加法**，每个新方法记入 README。
- **实例隔离（硬规则）**：测试实例通过 symlink 服务本仓库；套件产生的测试产物必须由套件清理（崩溃运行泄漏的服务端文件经插件 API 清除，**不许手改实例文件**）。

**专属命令**：
```bash
npm run type-check   # tsc --noEmit（strict）
npm run build        # vite build（须保持绿）
npm test             # 单测
npm run test:e2e     # 24 项 Puppeteer E2E 套件
node tests/authority.mjs   # 服务端源端存储场景（15-18 项）
node tests/stress.mjs      # 4 项极端压力场景
```
浏览器套件需测试实例：`TEST_TARGET_URL=https://127.0.0.1:8003`（Dev/Luker 实例，symlink 接线）。`tests/authority.mjs` 实例不可达时跳过（exit 0）；`e2e.mjs` 失败。

**坑/禁忌**：
- `settings.activeMediaId` 每次切背景都变，**不刷服务器**（防高频写）。
- 渲染 promise 无界等待 → stress test 3 挂死（`IframeRenderer.render` 只等 `onload`）；已统一 settle 模式（8s/15s/15s 超时 + destroy 即时结算）。
- `AudioEngine.play()` 无界等待 → 10s 竞速兜底。
- 跨源 URL 下载必须 `AbortSignal.timeout(60s)`（同源 backgrounds/ 路由不受影响）。
- 修改 renderer/async 代码时 stress 套件必须**多跑几次**（挂死是时序相关，只在全套件上下文复现，单独跑不复现）。
- 服务端模块必须在服务端缺端点时有韧性（探测能力，降级 warn，**绝不假设某个 ST fork 有上游 API**）。

---

### ST-Switcher

**证据文件**：`ST-Switcher/AGENTS.md`（仅 TRELLIS 样板，无自定义）、`ST-Switcher/README.md`、`ST-Switcher/Luker与SillyTavern深度对比与调查报告.md`

**自定义规则**：
- **项目定位**：面向 SillyTavern 与 Luker 的多会话秒切、原生双栏独立输入分屏、后台流式生成解耦前端扩展；**为向 Luker 官方仓库提交核心 PR 奠定纯 TypeScript 架构底座**。
- **纯 TypeScript 类架构**：所有核心模块（SessionManager / DOMCachePool / StreamRouter / FloorLockEngine / StateVirtualizer / SwitcherEventEmitter）均为纯 TS 类，**完全解耦 UI 与宿主环境**，为后续剥离提 PR 做准备。
- **Viewport Keep-Alive**：每个会话独立视口外壳（`div.st-switcher-viewport[data-session-id]`），切换仅 CSS 显隐（`display: none/flex`），**彻底告别 `clearChat()` 暴力重排**（切换从上千毫秒降至 0~1ms）。
- **状态虚拟化**：将原生单一布尔 `window.is_send_press` 虚拟化为按会话维护的动态字典；切走正在生成的 Tab 时新 Tab 的 `is_send_press` 为 `false`。
- **楼层级排他锁（FloorLockEngine）**：同会话双视图下某楼层进入编辑时注册排他锁，另一栏对应楼层显示警戒边框与锁徽标；有未保存编辑时主输入框发送显示防踩踏提醒；楼层保存走**单节点局部增量更新**（事件派发），不重刷整个聊天列表。
- **Luker 源码级调查结论（关键事实，指导设计）**：
  - Luker = **"上游 Fork + 外科手术式打补丁 + 侧载独立重型子系统"**，不是推倒重写；`server.js` 仅改 1 行，保留全部 ST 全局变量与 DOM 骨架。
  - PC 桌面端保活被**硬编码跳过**（`power-user.js` 的 `if (!isMobile()) return;`）——为避免桌面 Web Audio 触发 MediaSession 暂停用户音乐。
  - 标签页休眠：WS 70s 超时被切断、后端 15s 自动落盘、前端 `isConnected()` 假阳性误判 + 90s 僵尸死锁、恢复入口只绑 `CHAT_CHANGED` 不监听唤醒事件 → 用户以为死了，**按 F5 刷新即可看到完整输出**。
  - "DOM 分片加载"**未实现任何虚拟列表**，仅 15 行 `slice.remove()` 补丁，且**单向永久锁死**（点过一次"Show more"或搜过一次聊天后优化永久关闭）。
  - 增量同步（Patch-First）**仅网络层有效**，后端磁盘依然 `writeFileAtomic` 全量重写；409/Abort/Swipe/Continue/预设保存全部回退全量。
  - Swipe/Continue/Impersonate/quiet 类型的生成**不持久化**（`persist_target` 为 null）。

**专属命令**：
```bash
npm test              # Vitest + JSDOM 全量（10 测试文件 / 42 用例）
npm run type-check    # TypeScript 严格类型检查
npm run build         # 构建生产产物到 dist/
npm run dev           # 监听模式开发
```

**坑/禁忌**：
- 切换会话**不得**触发 `clearChat()`（破坏 Keep-Alive）。
- 不得拦截切换时的 `AbortController.abort()`（否则掐死后台生成）。
- 楼层编辑必须有排他锁（防多视图编辑踩踏）。
- Luker 官方宣传与源码实际落地有落差（DOM 分片虚设、增量仅网络层），**不得依据宣传假设行为**。

---

### ST-chatfilesys-rebuild

**证据文件**：`ST-chatfilesys-rebuild/AGENTS.md`（仅 TRELLIS 样板）、`ST-chatfilesys-rebuild/README.md`、`ST-chatfilesys-rebuild/backend-plugin-spec.md`、`ST-chatfilesys-rebuild/.trellis/spec/frontend/ui-placement.md`、`ST-chatfilesys-rebuild/.trellis/spec/frontend/docs-sources.md`、`ST-chatfilesys-rebuild/.trellis/spec/frontend/quality-guidelines.md`、`ST-chatfilesys-rebuild/.trellis/spec/frontend/state-management.md`、`ST-chatfilesys-rebuild/.trellis/spec/frontend/component-guidelines.md`、`ST-chatfilesys-rebuild/.trellis/workspace/jiozhaoyue/journal-1.md`（全部会话）

**自定义规则**：
- **项目定位**：接管酒馆聊天文件系统——真正的楼层分支、SVG 分支树、零复制切换、纯标准 JSONL 导出，**全部作为一个前端扩展实现，零核心修改**。
- **硬约束（不可妥协）**：
  1. **零核心修改**：不改 Luker 源码、不覆盖核心路由，只用官方扩展/server-plugin 机制。
  2. **标准格式唯一权威**：数据库 schema 与标准 JSONL 必须**双向无损**——任何时刻从库导出的 JSONL 能被 vanilla ST/Luker 原生打开；**禁止发明第二种聊天格式**。
  3. **事实源永远在服务器**：内存 ≠ 事实源；浏览器存储（IndexedDB 等）永远只做缓存，可随时丢弃重建。
  4. **integrity 乐观锁语义沿用**：并发写冲突返回 409，客户端重拉重放。
  5. **后端不发明需求**：后端仓库一切功能以前端 PRD + implement.md 为准；前端没要的不做。
- **UI 位置规范（强制，2026-08-29 事故后确立）**：
  - 设置项 → 扩展设置区 inline-drawer（`#extensions_settings`）；**扩展设置页禁止放操作按钮**（"扩展页面只调设置"）。
  - 复杂 UI（操作面板/树状图/批量操作）→ **官方 Popup**（`callGenericPopup` / `new Popup` + `POPUP_TYPE.DISPLAY` + `wide/large` + `renderLukerTabs`）。
  - 消息旁轻量元素 → 官方渲染钩子 `USER_MESSAGE_RENDERED` / `CHARACTER_MESSAGE_RENDERED` 注入。
  - 全局入口 → 设置页按钮 + 斜杠命令 + 快捷键。
  - **判定原则：一个位置如果不在官方文档里，就是禁止的。**
- **禁止位置**：禁止直接向核心动态渲染区（`#sheld`/`#chat`/`#chat-container`）append（核心重渲染会抹掉）；禁止自造浮动面板、全局悬浮按钮、`document.body` 直挂 UI；禁止顶部抽屉栏内部按钮。
- **禁止原生 `prompt()`/`confirm()`/`alert()`**，一律用 `callGenericPopup` + `POPUP_TYPE`。
- **API 事实以官方文档为准，禁止翻源码**：查 API 先查 Luker 官方文档站 `luker.cups.moe`；源码只允许用于验证"文档写了却不生效"的 bug 排查，**不允许作为"发现 API"的手段**。
- **禁用弃用 API**：`patchChatMessages`/`appendChatMessages`（官方已弃用）→ 用消息 API `addMessages`/`updateMessages`（批量合并持久化 + RFC 6902 增量）/`deleteMessages`/`saveChatMetadata()`。
- **术语纪律（用户严令）**：楼层 = 聊天中的**一条消息**（用户一层/AI 一层交替，全局编号），**禁止用"一轮"描述楼层**；「分支树（Branch Tree）」指数据结构，「分支系统（Branch System）」指整套机制；「分支模型」「楼层模型」已废止；**不得自造术语当正式概念**，概念命名先查用户认可的术语表。
- **无版本号**：规划工件（prd/design/implement）禁止版本号/版本管理——版本横幅、v1/v1.x 标记、"废止存档"章节全清；工件 = 单一权威文档，历史只进 journal/research。schema 里 version/迁移机制一概不要。
- **单一写入口**：改模型一律「core/ 纯函数就地改 → `setModel(model)` 写回 chat_metadata（tainted 置位）→ 持久化」；**禁止在 ui/ 里直接改 `ctx.chatMetadata`**。
- **渲染函数两形态**：①字符串模板渲染函数（数据入 → HTML 字符串出，调用方 `innerHTML`）；②命令式 DOM 注入（消息旁工具/徽章，类名 `chatfilesys-*`，幂等先查再建）。view 由 `index.js currentView()` 统一产出，渲染函数不自己取数据。
- **转义纪律**：任何插值进 innerHTML 前必须过 `esc()`（分支名/聊天名是用户输入）；**禁止内联 `onclick=`**。
- **事件委托**：弹窗内容动态重渲染，点击统一委托到内容根（`closest('[data-action]')`）；SVG 节点无 `.click()`，统一 `dispatchEvent(new MouseEvent('click', {bubbles:true}))`。
- **UI 刷新防抖**：结构操作后的弹窗/徽章/注入统一走 `scheduleUiRefresh()`（150ms），**禁止各 UI 各自 setTimeout**。
- **禁止 MutationObserver**：核心重渲染自愈必须走 RENDERED 事件 + 自身重绘尾部补注。
- **自愈双通道（实测补正）**：RENDERED 事件**只在 append 路径触发**，`printMessages` 批量重绘（切分支/删层后）**不触发**——注入自愈必须双通道（RENDERED 事件 + 扩展自身 `renderChat()` 尾部显式重注入）+ 150ms 防抖。
- **测试不得固定 sleep**：用 `wait_state`/`wait_disk` 轮询（宿主高负载下固定 settle 不稳）；测试角色前缀 `__cb_e2e`，末尾删除，**绝不触碰既有数据**。
- **落盘核对**：内存断言后必查 `disk_state()`（服务端重拉），防"内存对磁盘错"假绿；宿主聊天文件 mtime 是假值（1970/1980），**对账必须内容比对**。
- **报错归因**：pageerror/console error 按 `/third-party/<name>/` 归因，本扩展必须零归因报错；宿主其他扩展噪音不计入。

**专属命令**：
```bash
node --test tests/branches/*.test.mjs          # 数据层单测（node:test，直接 import 源码）
node --check public/scripts/extensions/third-party/chatfilesys/**/*.js   # 语法检查
python tests/e2e/smoke.py          # 冒烟（4/5 = 已知噪音口径）
python tests/e2e/test_deletes.py   # 删层/删分支 11
python tests/e2e/test_conflict.py  # 409/并发 8
python tests/e2e/test_adopt_export.py  # 收编/导出/自动导出 14
python tests/e2e/test_acceptance.py    # 一期验收回归 13
python tests/e2e/test_acceptance_p2.py # 二期验收 15
python tests/e2e/test_perf.py      # 百层性能 5
```
e2e 依赖本地 Luker 实例（默认 `https://127.0.0.1:8003`，`tests/e2e/harness.py` 可改 `BASE`）；`demo/` 是 UI 交互基准（静态 HTML 可直接打开）。

**坑/禁忌**：
- 扩展设置页放操作按钮（违规）；`#sheld` append 按钮（会被核心重绘抹掉）。
- 原生 `prompt()`/`confirm()`（无 API 依据）。
- 自造术语（"楼层模型"杜撰事故 → 渗透进设计）。
- NUL 字节污染：批量编辑 CRLF 文件后必须跑 NUL 扫描 + `node --check`，不能只看 diff。
- `Edit` 工具截断 index.js 事故 → 改完必须立刻 `node --check`。
- `disabledExtensions` 键名必须带前缀 `third-party/chat-branch`（`disableExtension('chat-branch')` 静默无效）。
- `/api/chats/get` 对不存在文件也返回 200 + `{new_chat:true}`——判断文件存在必须看 body 形态。
- 宿主 `yieldToBrowser()` 依赖 rAF，后台/遮挡标签页 rAF 永不触发 → 酒馆启动静默冻结（自动化调试必须保持页面可见）。
- 后台标签页会让酒馆启动卡死（同上，见 shujuku 教训）。
- 前序扩展卡住 → 后续扩展面板静默不出现（`addExtensionScript()` 无超时保护）。
- 操作层 catch 会掩盖接线错误（`injectAllMessages` 未导入被静默吞掉）——新接线后必须跑一次带 console 捕获的冒烟。

---

### ST-git-improve

**证据文件**：`ST-git-improve/AGENTS.md`（仅 TRELLIS 样板）、`ST-git-improve/README.md`、`ST-git-improve/.trellis/workspace/jiozhaoyue/journal-1.md`

**自定义规则**：
- **项目定位**：SillyTavern/Luker 的**服务端插件**——在酒馆内完成私有 git 源登录、认证安装、重建式更新（本地改动自动备份）、npm 依赖自动安装与修复、扩展诊断。**纯补充面板——不修改、不接管原生扩展管理的任何行为**。
- **安全约定（硬性）**：
  - 凭据只写 `data/<user>/git-improve/credentials.json`（本机、原子写），**不写入任何 URL、`.git/config` 或日志**；前端展示一律脱敏。
  - `.git/config` 中保存的 remote URL **永远不含凭据**——认证仅在请求时经内存注入。
  - 仅支持 http(s) 克隆；**不支持 SSH / LFS / submodule / hook 执行**。
  - API 挂载在 `/api/plugins/st-git-improve`，与宿主插件体系一致。
- **零系统 git 依赖**：全部 git 操作走 isomorphic-git（纯 JS），零系统 git 二进制依赖。
- **代理显式开关**：isomorphic-git **不读取系统代理环境变量**——环境里有代理也不代表被使用，需要代理时必须显式设置。三档：`direct`（默认，不依赖任何环境配置）/ `env`（跟随 `HTTPS_PROXY`/`HTTP_PROXY`/`ALL_PROXY`/`NO_PROXY`，回环地址始终豁免）/ `http(s)://host:port`（自定义，对所有 git 请求生效）。环境变量 `ST_GIT_IMPROVE_PROXY` 优先于 settings 文件。
- **重建式更新（TT 式）**：depth-1 fetch → 候选树校验 → 本地改动自动 commit 到备份 ref → 原子重建 tracked 文件。
- **安装判重**：颗粒度可配（仓库名 / 仓库名+版本号）；全局（管理员）安装不受判重影响；**强制本地安装需管理员身份**（多用户模式经宿主会话识别；单用户/降级模式用显式勾选）；启动自动清理只删无改动副本，有改动的跳过并记日志。
- **身份门禁 fail-closed**：未认证返回 403（不降级放行）。
- **配置优先级**：环境变量优先于配置文件（`ST_GIT_IMPROVE_REGISTRY`、`ST_GIT_IMPROVE_USER`）。

**专属命令**：
```bash
npm install
npm test                 # 单元测试（无网络）
npm run test:integration # 无 git 二进制环境下的 clone 集成测试（需网络）
node scripts/install-to-tavern.mjs <酒馆目录>   # 安装到酒馆
```

**环境变量**：
```bash
ST_GIT_IMPROVE_GITHUB_CLIENT_ID=...   # GitHub OAuth App (device flow)
ST_GIT_IMPROVE_GITLAB_CLIENT_ID=...   # GitLab 应用
ST_GIT_IMPROVE_PROXY=...              # 代理（优先于 settings 文件）
ST_GIT_IMPROVE_REGISTRY=...           # npm 源（默认 https://registry.npmmirror.com）
ST_GIT_IMPROVE_USER=...               # 用户目录（默认 default-user）
```

**坑/禁忌**：
- 不得把凭据写进 URL / `.git/config` / 日志。
- 不得假设 isomorphic-git 会用系统代理（必须显式设置）。
- 已知边界（MVP）：单用户（`default-user`）；SSH 桥为二期；Gitee 无设备码流程；本插件自身更新走宿主原生插件更新，不依赖本插件。

---

### ST-shujuku-rebuild

**证据文件**：`ST-shujuku-rebuild/AGENTS.md`（1-40）、`ST-shujuku-rebuild/README.md`、`ST-shujuku-rebuild/docs/lessons-chat-db-rescue.md`、`ST-shujuku-rebuild/docs/superpowers/specs/2026-09-07-chat-db-rescue-and-template-migration-design.md`、`ST-shujuku-rebuild/docs/superpowers/plans/2026-09-05-luker-host-adapt.md`
（注：该项目无 `.trellis/` 目录）

**自定义规则**：
- **项目定位**：Luker / TauriTavern 宿主的数据库插件，基于上游 `shuiyue-cmyk/shujuku-rebuild` v9.1.9 的适配 fork；标准浏览器扩展形式安装（**无需酒馆助手**），SQL 表格持久化到聊天消息的 `TavernDB_ACU_*` 字段。
- **仓库结构硬约定**：仓库根是**分发产物**（`index.js` 单文件约 10MB、`manifest.json`、`sql-wasm.wasm`）——**由构建生成并提交，不手改**；`source/` 是真正的工程（TS + rollup + vitest），所有开发在那里进行。
- **分层**：`data/`（sqlite 引擎、sync-bridge、仓储、网关）→ `service/`（业务）→ `presentation/`、`presentation-v2/`（UI，后者为 Vue SFC）→ `shared/`（工具/常量/host-bridge）→ `entry-extension.ts`。
- **单文件标识 `shujuku_v120`（最关键的坑）**：`UNIQUE_SCRIPT_ID` 常量（`src/shared/constants.ts`）是存储命名空间根（`shujuku_v120__userscript_settings_v1`、`TavernDB_ACU_*` 聊天字段前缀与之配套）。**改它 = 换存储身份，会"丢"所有现有数据；独立副本才改。**
- **数据持久化模型**：运行时是 sql.js 内存 SQLite；持久化靠"存储帧"（checkpoint + SQL 操作日志 `logEntries`）写进聊天消息的 `TavernDB_ACU_IsolatedData`；热状态快照在 `chat_metadata.TavernDB_ACU_HotSnapshot`（**仅加速缓存，不可作为数据真相**）；模板在 `TavernDB_ACU_ScopedConfig` / `TavernDB_ACU_InternalSheetGuide`。修数据层必须理解"回放日志 → 重建表"这条链（`data/sqlite/sync-bridge.ts`）。
- **回放语义**：从最后一个 `kind=full` 的 checkpoint 建库，其后各帧 `logEntries[].operations[].statements` 按楼层/seq 顺序重放。物理表名 = `sheetKey` 去掉 `sheet_` 前缀并去掉下划线（`sheet_ji_yao_biao` → `jiyaobiao`）。
- **宿主适配只许进桥**：TT / Luker / 通用 ST 三态 profile 在 `src/shared/host-bridge.ts`，探测失败自动降级 generic，**宿主差异只许进桥，不许散落业务层**。
- **上游同步纪律**：CI 每日自动合并上游 master；冲突按"我方差量"解决（host-bridge、分发产物重建）。**上游的数据格式与模板 JSON 必须保持同构**，不要私自改 `TavernDB_ACU_*` 结构。
- **manifest 身份分离（防 auto_update 反向覆盖）**：本仓库 manifest 必须脱离上游 homePage——`homePage` 指向上游会让宿主 `auto_update` 把本插件拉回上游产物；`display_name` 不得为 `TTonly·数据库`/`幻想·数据库`。
- **构建开关**：SQLite 引擎（wasm 默认 / asm 回滚）由 rollup replace 注入（`ACU_SQLITE_ENGINE`）；wasm 以 base64 内联进产物，**无外部 fetch**。
- **版本一致性**：source `package.json` 与根 `manifest.json` 的 `version` 需一致。
- **vitest stub**：宿主模块（`./script.js`、`./scripts/extensions.js`）由 `vitest.config.ts` 的 stub 占位，**新增依赖宿主全局时注意补 stub**。
- **救援方法论（可复用，来自实战）**：
  - **数据从未丢失**：全部数据都在存储帧的操作日志里，只是"严格回放"被单条坏语句卡死。
  - **离线重建（不碰实例文件）**：解析聊天 `.jsonl` 存储帧，从 checkpoint 建库 + 宽容回放；宽容规则 = INSERT 主键/UNIQUE 冲突自动转 `INSERT OR IGNORE` 重试一次，仍失败单条跳过并记录诊断，其他错误上抛。
  - **在线写回只走插件 API**：`importTableAsJson` 有 preflight 审计 + 写入门闸（写前 provisional replay 必须成功）——**旧坏帧不先清除，任何导入都会被拒**；正确路径是 `initGameSession(null, {injectTemplate:true, templateData, resetExistingTableData:true, persist:false})`。
  - **导入预检三坑**：①首列表头必须是 `row_id`（全等，只认 `row_id`/`id`/`行号`）；②表头必须覆盖 DDL 全部列（checkpoint 表头可能与 DDL 漂移）；③NOT NULL 无默认列不能为空串（需按 CHECK IN 枚举填中性合法值）。
  - **验证闭环**：刷新 → 重开会话 → 控制台零插件报错 → `exportTableAsJson` 行数与离线重建一致。
- **工程杂项经验**：`selectCharacterById` 之后再 `openCharacterChat`（后者内部校验模块态 `characters[chid]`，只设 `window.this_chid` 无效）；插件 API 全集在 `window.AutoCardUpdaterAPI`；酒馆 `.jsonl` 第 1 楼（index 0）通常是系统楼，`chat_metadata` 挂在它上面；服务端日志目录通常为空，**浏览器控制台才是主要证据源**。

**专属命令**（全部在 `source/` 下执行）：
```bash
cd source
npm run build        # rollup：产物自动同步到仓库根（dist/extension → 根 index.js 等）
npm run typecheck    # tsc --noEmit
npx vitest run       # 全量测试（发版前必须零回退；当前规模 ~7700 用例）
npm run smoke        # 产物冒烟
```
单测：`cd source && npx vitest run <file>`；类型检查：`npx tsc --noEmit -p tsconfig.json`。
救援工具：`source/scripts/rescue/replay-chat.mjs`、`source/scripts/rescue/extract-template.mjs`。

**坑/禁忌**：
- 改 `UNIQUE_SCRIPT_ID` = 丢所有现有数据。
- 手改仓库根分发产物（应由构建生成）。
- 私有改 `TavernDB_ACU_*` 结构（破坏上游同构）。
- `HotSnapshot` 不可作为数据真相（可能过期/为空）。
- **后台标签页会让酒馆启动卡死**：`yieldToBrowser` 依赖 `requestAnimationFrame`，后台/遮挡页签 rAF 永不触发 → 启动停在 `[init] loader hidden` 之后，表现为角色列表空白、插件不加载。自动化浏览器做酒馆调试**务必保持页面可见**。
- IAB 面板可能中途重启 → 长流程要假设页面状态随时丢失，每步从头 bootstrap，用 fire-and-poll 模式绕开工具超时。

---

### ST-Assets-Manger

**事实记录**：空目录（无任何文件），跳过。无规则可提炼。

---

## 附：无法分类/存疑条目

1. **统一规则块的 `sync-rules.ps1` 同步机制**：5 个项目的 `AGENTS.md` 内嵌同一份 `<!-- UNIFIED-RULES:START -->` 块（最后同步 2026-09-12 19:56:35），声称由 `sync-rules.ps1` 自动生成、勿手改，完整规则在 `../../Center/.trellis/spec/guides/unified-development-rules.md`（**该 Center 仓库不在本次提炼范围内，未获取**）。块内的 §9「项目特定覆盖机制」文本在多个项目中**逐字相同**（都写"本项目使用 `develop` 分支""本项目使用 `claude-sonnet-4`"），疑似模板未按项目定制——存疑，无法判断哪个项目真的用了 develop 分支。

2. **子代理模型规定冲突**：统一规则块 §5 规定"任何派发子代理一律使用 `gemini-3-flash-preview`"，但同块 §9 又写"本项目使用 `claude-sonnet-4` 作为子代理模型"。两者矛盾，且与用户全局 CLAUDE.md 的"禁止使用 Kimi K3 做子代理"（未提及 gemini/claude 限制）也不完全对齐。**存疑：实际生效的是哪一条无法从文件确定。**

3. **`ST-Switcher/AGENTS.md`、`ST-chatfilesys-rebuild/AGENTS.md`、`ST-git-improve/AGENTS.md` 仅含 TRELLIS 样板**（1073 字节，纯框架内容），无任何项目自定义规则——其自定义规则全部散落在 README、`.trellis/spec/` 与 journal 中。按任务要求已整段跳过样板块。

4. **`ST-shujuku-rebuild` 无 `.trellis/` 目录**：该项目不使用 Trellis，规则全在 `AGENTS.md` + `docs/superpowers/`。其 `AGENTS.md` 无 TRELLIS 样板块，但仍有 UNIFIED-RULES 块（未获取完整行号范围，内容与其它项目一致）。

5. **`.trellis/config.yaml` 6 个项目字节数完全相同（7027B）**：是 Trellis 默认配置（含注释），非项目自定义，未纳入规则汇总。

6. **ST-zip-converter 的 `docs/research/security-audit-and-public-release.md` 中记录的 `.gitignore` 加固规则**（`*.zip`/`data-zip/`/`data-*/`/`samples/`/`.env`/`*.pem`/`*.key` 等）是该项目专属的安全防御清单，但同源规则（零隐私泄露、零凭据泄露）应视为跨项目适用，已归入 ST-zip-converter 条目并列入共性第 11 条相关背景。

7. **未获取的文件**（未读或不存在）：各项目的 `.cursor/`、`.codex/`、`.gemini/`、`.grok/`、`.kimi-code/`、`.kiro/`、`.opencode/`、`.qoder/`、`.trae/`、`.zcode/`、`.kilocode/`、`.agent/`、`.agents/` 等目录下的内容——经枚举确认绝大多数是 Trellis 生成的平台集成副本（skills/agents/commands/hooks），非项目自定义；`.github/copilot-instructions.md`（ST-BgLoader 版）仅含 TRELLIS:COPILOT-GUIDANCE 框架样板，已跳过。ST-Switcher 与 ST-git-improve 的 `.trellis/spec/` 全部为 "To fill" 占位状态（无实质内容）。
