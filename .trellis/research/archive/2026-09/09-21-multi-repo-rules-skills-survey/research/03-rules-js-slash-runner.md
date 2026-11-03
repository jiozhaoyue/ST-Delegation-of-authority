# JS-Slash-Runner 自定义规则提炼

生成时间：2026-09-21
来源仓库：`D:\Repo\Tavern-repo\JS-Slash-Runner`（下辖 5 个子项目）
说明：本文件只收「项目自定义」规则，已剔除各 agent 工具的通用自带话术、README 的功能宣传与安装步骤、上游官方模板原件中与本仓库二改无关的内容。凡上游模板自带的约定（如 `.clinerules` 八件套正文），只要本仓库将其作为项目规则生效，仍按「项目采用的约定」收录并标注来源性质。

---

## 汇总：跨项目共性规则

以下规则由 `tavern_helper_template` 上游模板的规则文件（`.clinerules/*.md` → 实为 `.cursor/rules/*.mdc` 的符号链接）提供，并被本仓库 4 个模板派生项目（`ST-PanelReset` 除外）全量继承生效。

1. **加载/卸载时机硬约束**：禁止 `document.addEventListener("DOMContentLoaded", ...)`（因为产物可能以 `$('body').load(网络链接)` 或 `import '网络链接'` 方式加载，该事件不触发）；必须用 `$(() => {...})` 做加载、`$(window).on('pagehide', ...)` 做卸载，禁止用 `'unload'`。— 出现于：`ST-chatfile-improve`、`ST-msg-btn-mgr`、`tavern_helper_template`（`项目基本概念.md` 第 182-202 行；`脚本.md` 第 37-56、75-80 行）

2. **`index.html` 只允许静态 `<body>` 内容**：保留空 `<head>`（webpack 打包时插入样式与脚本）；禁止 `<link rel="stylesheet" href="./index.css">`；禁止 `<script src="./index.ts">`；`<img>` 禁止用 `src=""` 占位（会致 webpack 打包错误）。— 出现于：`ST-chatfile-improve`、`ST-msg-btn-mgr`、`tavern_helper_template`（`前端界面.md` 第 11-28 行）

3. **iframe 高度/布局适配禁令**：禁止 `vh` 等受宿主高度影响的单位（用 `width` + `aspect-ratio` 让高度随宽度变化）；避免 `min-height`、`overflow: auto` 等撑高父容器的元素；主体内容禁止 `position: absolute` 等脱离文档流的样式；页面不得产生横向滚动条；若适合卡片形状则不加背景色（除非用户明确要求）。— 出现于：同上（`前端界面.md` 第 34-40 行）

4. **脚本向酒馆网页挂载 vue 组件时的样式分叉规则**：组件「是酒馆网页的补充」→ 挂到非 iframe DOM 上，用 `util/script.ts` 的 `teleportStyle()` 复制样式到酒馆 `<head>`，并在 `pagehide` 调 `destroy()`；此路径**禁止使用 tailwindcss**（避免与酒馆既有类名冲突）。组件「独立、需与酒馆样式隔离」→ 用 `createScriptIdIframe()` 挂到 iframe 内部 body，**优先使用 tailwindcss class**。— 出现于：同上（`脚本.md` 第 19-83 行）

5. **接口优先级：酒馆助手高层接口 > 原生/STScript**：优先用 `@types/function/*`（如 `getChatMessages`/`setChatMessages`、`getWorldbook`/`replaceWorldbook`、`getVariables`/`replaceVariables`），而非 `@types/iframe/exported.sillytavern.d.ts` 的低层接口或 `triggerSlash` 调用的 "/STScript" 命令。`exported.ejstemplate`（提示词模板插件）除非明确要求不考虑；`tavern_regex` 只应偶尔用 `formatAsTavernRegexedString`。— 出现于：同上（`项目基本概念.md` 第 134-141 行；`酒馆助手接口.md` 第 12、14、25-26 行）

6. **技术栈优先级**：必须用 TypeScript 而非 JavaScript；优先 vue（+ pinia + vue-router）写界面；用 zod 做数据校验纠错（配 `z.prettifyError()`）而非 if/else；用 jquery/jqueryui 而非原生 DOM；用 gsap 做动画；样式优先 tailwindcss 写在 `<template>` 内，否则 `<style scoped>`；多媒体资源多时用 `@pixi/react` + pixi.js。禁止使用 nodejs 库（运行在浏览器）。— 出现于：同上（`项目基本概念.md` 第 116-131、56-58、172-180 行）

7. **响应式数据写回酒馆前必须 `klona()` 去 proxy**：`watchEffect(() => replaceVariables(klona(settings.value), ...))`。— 出现于：同上（`项目基本概念.md` 第 145-170 行）

8. **vue-router 双约束**：`createRouter()` 不能写在 `$(() => {})` 内，必须全局执行；前端界面与脚本都是 iframe，必须用 `history: createMemoryHistory()`。— 出现于：同上（`项目基本概念.md` 第 145、155 行）

9. **MVU 使用前置等待**：涉及 MVU 的脚本/界面必须在代码顶部（一次即可）`await waitGlobalInitialized('Mvu')`；前端界面另需 `await waitUntil(() => _.has(getVariables({type:'message'}), 'stat_data'))`；脚本用 `waitUntil` 等变量就绪。— 出现于：同上（`mvu变量框架.md` 第 13-17 行）

10. **zod 4 schema 硬性写法约定**（用于 MVU 变量结构与脚本设置）：优先 `z.prefault` 而非 `z.default`；**禁止 `z.passthrough`、`z.strict`**；数字优先 `z.coerce.number()`，但其他类型不得用 `z.coerce.xxx()`；限制条件用 `z.transform`（如 `_.clamp`）而非 `.min()/.max()`（除非 Explorer 明确要求）；`Schema.parse` 必须幂等；`z.transform` 的 `fn` 只能接收已解析输出、不得使用 `context` 参数；`z.extend` 只能作用于 `z.object/z.looseObject/z.strictObject`（`.prefault({})` 后不可 extend）。— 出现于：同上（`mvu角色卡.md` 第 33-68 行）

11. **「用户提供的变量结构」需剥离首尾**：若用户给的是「变量结构脚本」（含 `import { registerMvuSchema } from '...mvu_zod.js'` 开头、`$(() => { registerMvuSchema(Schema); })` 结尾），必须去掉首尾只保留 `export const Schema`；`schema.ts` 只应有 `export const Schema` 且无其他副作用。— 出现于：同上（`mvu角色卡.md` 第 70-73 行；`mvu变量框架.md` 第 55-69 行）

12. **MVU 角色卡目录约定**：`角色卡/脚本/*/`（脚本）、`角色卡/界面/*/`（前端界面）、`角色卡/世界书/*/`（设定提示词）、`角色卡/schema.ts`（zod 4 变量结构，`pnpm build`/`pnpm watch` 时生成同级 `schema.json` 供 `initvar.yaml` 的 `# yaml-language-server: $schema=` 使用）、`角色卡/界面/store.ts`（pinia 预设的楼层变量读取，供所有界面导入）。世界书除 `[initvar]变量初始化勿开` 外还应有 `变量列表`、`[mvu_update]变量更新规则`、`[mvu_update]变量输出格式` 三条目。— 出现于：同上（`mvu角色卡.md` 第 7-17、124-132 行）

13. **必须区分「独立脚本/界面」与「MVU 角色卡增补」**：用户只要独立脚本/界面时，不得参考 `mvu角色卡` 规则文件。— 出现于：同上（`mvu角色卡.md` 第 19 行）

14. **流式楼层界面的定位**：因酒馆限制前端界面不支持流式渲染，项目通过 `util/streaming.ts` 的 `mountStreamingMessage` 提供方案；**流式楼层界面本质是脚本，所有脚本编写规则依旧适用**。— 出现于：同上（`项目基本概念.md` 第 26-37 行）

15. **项目/界面判定规则**：`src/xxx`（或 `示例/xxx`）文件夹内「同时有 `index.ts` 和 `index.html`」= 前端界面项目；「仅有 `index.ts`」= 脚本项目。— 出现于：同上（`项目基本概念.md` 第 19-22 行；`前端界面.md` 第 7 行；`脚本.md` 第 7 行）

16. **`示例` 文件夹禁止删除**：AI 需要参考其中代码；如需避免打包，可在 `webpack.config.ts` 约 54 行把 `{示例,src}/` 改为 `src/`。— 出现于：`ST-chatfile-improve`、`ST-msg-btn-mgr`、`tavern_helper_template`（`README.md` 第 45-47 行）

17. **`dist/` 冲突用 ours 策略**：`.gitattributes` 设 `dist/** merge=ours`（因 CI 会重新打包，本地 dist 内容无关紧要）；需一次性执行 `git config --global merge.ours.driver true` 才生效。— 出现于：同上（`README.md` 第 90-100 行；`tavern_helper_template/.gitattributes` 第 5 行）

18. **`.vscode/launch.json` 含云酒馆地址，需防泄漏**：`git update-index --skip-worktree .vscode/launch.json`。— 出现于：同上（`README.md` 第 37-43 行）

19. **用 chrome-devtools MCP 自读自操酒馆网页**：以 `.vscode/launch.json` 的 `url`（`https://localhost:49152`）连接已开浏览器，读取 DOM/显示/Console 并点击。**先检查 `$('#extensions_settings')` 中「酒馆助手-实时监听-允许监听」开关是否启用**——启用后代码变更会自动热重载到酒馆网页，因此**不需要刷新酒馆网页、也不需要自己跑 `pnpm build`**。— 出现于：4 个项目均有（`ST-PanelReset/.codex/config.toml`、`ST-chatfile-improve/.cursor/mcp.json` 与 `.clinerules/mcp.md`、`ST-msg-btn-mgr/.agent/mcp.json` 与 `.mcp.json`；`mcp.md` 第 7-13 行）

20. **规则文件单一真源 + 符号链接分发**：`CLAUDE.md`/`AGENTS.md`/`GEMINI.md` 三份内容完全相同，均为 8 行 `@.cursor/rules/*.mdc` 引用；`.clinerules/*.md`、`.augment/rules/*.md` 均为指向 `../.cursor/rules/*.mdc` / `../../.cursor/rules/*.mdc` 的**符号链接**；`.kilocode/mcp.json`、`.roo/mcp.json` 为 `../.cursor/mcp.json` 的符号链接。→ 改规则只改 `.cursor/rules/`，其余自动同步。— 出现于：`ST-chatfile-improve`、`ST-msg-btn-mgr`、`tavern_helper_template`（各项目 `CLAUDE.md`/`AGENTS.md`/`GEMINI.md` 全 10 行；`ls -la` 可见 link 目标）

---

## 逐项目明细

### ST-PanelReset

**证据文件**：`ST-PanelReset/package.json`（1-7 行）、`ST-PanelReset/tavern-helper-script.config.json`（1-19 行）、`ST-PanelReset/manifest.json`（1-11 行）、`ST-PanelReset/index.js`（1 行）、`ST-PanelReset/.codex/config.toml`（1-6 行）、`ST-PanelReset/README.md`（1-104 行）、`ST-PanelReset/release/*.json`、`ST-PanelReset/src/ST-PanelReset/index.ts`（1-40 行）

**自定义规则**：
- **本项目是最小化脱离模板的项目**：无 `.cursor/`、无 `.clinerules/`、无 `.augment/`、无 `.roo/`、无 `.kilocode/`、无 `AGENTS.md`/`CLAUDE.md`/`GEMINI.md`，**不继承上游模板的 8 条规则文件**；只有 `.codex/config.toml` 一条 MCP 配置。`README.md` 仍是模板原件（首行为 `# tavern_helper_template`，内容与上游逐字相同），未本地化。
- **入口采用「一行转发」形态**：`index.js` 全文仅 `await import("./dist/ST-PanelReset/index.js");`，即 Luker 扩展入口只做转发，真实产物在 `dist/ST-PanelReset/index.js`。
- **发布产物双形态**：`release/` 下同时产出「远程引用版」（`content` = `import 'https://testingcf.jsdelivr.net/gh/jiozhaoyue/ST-PanelReset@latest/dist/ST-PanelReset/index.js'`，文件名 `酒馆助手脚本-酒馆面板回正.json`）与「内联压缩版」（`content` 为整段 webpack 压缩代码，文件名带 `-v1.1.0`）。注意**版本化文件名的只有 inline 版**，远程引用版文件名不带版本号。
- **版本号三处手工保持一致**：`package.json.version`（1.1.0）、`manifest.json.version`（1.1.0）、`tavern-helper-script.config.json` 中 `remoteUrl` 与 release 文件名中的 `v1.1.0`。
- **脚本 ID 固定**：`tavern-helper-script.config.json` 中 `script.id = 279082b9-8909-4f57-89cb-abb7775c9ec0`，与 release JSON 的 `id` 一致——改配置时不得改动，否则用户在酒馆中会重复安装。
- **`manifest.json` 是 Luker 扩展清单**：`display_name`（酒馆面板回正）、`loading_order: 100`、`js: "index.js"`、`auto_update: true`、`requires/optional` 均为空数组。
- **用户设置走「脚本变量 + settings_version 迁移」**：源码用 `getVariables({type:'script'})` 读 `变量[o]`（`o = 'ST-PanelReset'` 命名空间），带 `settings_version` 字段，版本不符时合并默认值并回写（`normalizePanelResetSettings`）；读写失败一律 `console.warn` 降级到默认设置，不抛错。变量读写被 `'function' != typeof getVariables` 之类的特性检测包裹（可选后端/宿主能力降级模式）。

**专属命令**：无。`package.json` 仅含 `name`/`version`/`license`/`private`/`type`，**没有任何 `scripts` 字段**（无 build/watch/lint/test），产物为手工/外部流程生成。

**坑/禁忌**：
- 无 `.gitignore` 之外的规则文档；无 lint/format/测试基建，改动无自动化校验兜底。
- `release/` 内两种 JSON 内容语义不同，混用会导致用户装到「需要联网的远程版」而非「离线内联版」。

---

### ST-chatfile-improve

**证据文件**：`ST-chatfile-improve/CLAUDE.md`（1-10 行）、`AGENTS.md`（1-10 行）、`GEMINI.md`（1-10 行）、`README.md`（1-124 行）、`package.json`（1-123 行）、`.clinerules/*.md`（8 个文件，正文见跨项目共性规则）、`scripts/template-sync.mjs`（1-283 行）、`scripts/template-sync.test.mjs`（1-139 行）、`scripts/chat-file-enhance.test.mjs`（1-137 行）、`scripts/cdp-chat-import-smoke.ps1`、`scripts/cdp-eval.ps1`、`.github/template-sync.json`、`.github/.templatesyncignore`、`.github/workflows/{bump_deps,bundle,sync_template}.yaml`、`tsconfig.json`、`.vscode/*`、`tavern_sync.yaml`

**自定义规则**：
- **完整继承上游模板规则八件套**（见「跨项目共性规则」全部 20 条）。
- **模板同步上游指向自建 fork**：`.github/template-sync.json` 的 `upstream = https://github.com/jiozhaoyue/tavern_helper_template.git`（非 StageDog 官方），`upstreamBranch = main`，`protectedPaths = ["src/**","dist/**",".github/workflows/**","README.md","@types/**"]`——即**只同步脚手架、永不同步自己的 src/dist/工作流/README/@types**。
- **本地同步走独立分支、不动工作区**：`pnpm template:sync` 从当前 `HEAD` 建 `template-sync/<时间戳>` 分支，在临时 worktree（`.template-sync-worktree/`）中同步未保护文件后提交到该分支；**不触碰未提交修改**；若上游无变化则自动删分支并打印 `Template is already up to date.`。查看/合并：`git diff HEAD..template-sync/时间戳`、`git merge template-sync/时间戳`。
- **CI 模式只用于 PR 流程**：`pnpm template:sync:ci`（`--mode=ci`）直接改当前检出，由 `sync_template.yaml` 每周一 03:00 触发并开 PR（分支 `bot/sync-template`，标题 `[bot] 同步模板仓库的更新`）。
- **禁止以 `--config` 之外的方式硬编码同步配置**：脚本默认读 `.github/template-sync.json`，缺失 `upstream` 直接报错；`protectedPaths` 缺省回落到脚本内置默认（与上述一致）。
- **`tsconfig` 路径别名约定**：`@util/*` → `./util/*`，`@/*` → `./src/*`；`types` 预置 jquery/jqueryui/lodash/toastr/type-fest/yaml/zod（这些为全局可用，无需 import）。
- **测试风格：无测试框架，用 node:test + `assert/strict` 手写断言脚本**，通过 `pnpm` 脚本直接 `node scripts/xxx.test.mjs` 运行（`test:template-sync`）。被测纯逻辑以 `typescript.transpileModule` 转译后经 `data:text/javascript;base64,...` 动态 import，从而绕开浏览器依赖测 `src/**/logic.ts` 的纯函数。

**专属命令**（`package.json.scripts`）：
- `build:dev` = `webpack --mode development`
- `build` = `webpack --mode production`
- `watch` = `webpack --mode development --watch --progress`
- `format` = `prettier --write "src/**/*.{ts,tsx,js,jsx,css,scss,html,vue}" --no-error-on-unmatched-pattern`
- `lint` / `lint:fix` = `eslint` / `eslint --fix`
- `dump` = `node dump_schema.ts`
- `sync` = `node tavern_sync.mjs`
- `template:sync` = `node scripts/template-sync.mjs`
- `template:sync:ci` = `node scripts/template-sync.mjs --mode=ci`
- `test:template-sync` = `node scripts/template-sync.test.mjs`
- 另有 `scripts/cdp-eval.ps1`、`scripts/cdp-chat-import-smoke.ps1`（CDP 调试/冒烟脚本，未挂到 pnpm scripts）

**坑/禁忌**：
- `bundle.yaml` 中模板上游分支用 `pnpm install && pnpm build`（**未加 `--frozen-lockfile`**），而 `ST-msg-btn-mgr`/`tavern_helper_template` 用 `pnpm install --frozen-lockfile && pnpm build:js`——三仓库该步写法不一致，改 CI 时勿照抄。
- `template-sync.test.mjs` 明确断言：CI 模式下**受保护路径必须保持本地内容**（`README.md`/`src`/`dist`/`@types`/`.github/workflows` 均不得被上游覆盖），且非保护文件（`webpack.config.ts`、`slash_command.txt`）必须被更新——这是同步逻辑的回归护栏。

---

### ST-msg-btn-mgr

**证据文件**：`ST-msg-btn-mgr/CLAUDE.md`（1-10 行）、`AGENTS.md`（1-10 行）、`GEMINI.md`（1-10 行）、`README.md`（1-104 行）、`package.json`（1-115 行）、`tavern-helper-script.config.json`（1-24 行）、`tavern_sync.yaml`（1-27 行）、`scripts/package-tavern-helper-script.mjs`（1-128 行）、`test/stums-normalize-swipes.test.mjs`（1-325 行）、`.agent/mcp.json`、`.agent/rules/*.mdc`、`.mcp.json`、`.github/workflows/release-script-json.yaml`（1-41 行）、`.github/workflows/bundle.yaml`、`.github/.templatesyncignore`

**自定义规则**：
- **完整继承上游模板规则八件套**（见「跨项目共性规则」）。
- **`.agent/rules/` 是唯一实体规则目录**：`.cursor/` 缺失导致 `.clinerules`/`.augment` 的符号链接**全部悬空**，规则正文实际落在 `.agent/rules/*.mdc`（8 个真实文件，与 ST-chatfile-improve 的 `.cursor/rules/*.mdc` 同名同尺寸）。
- **发布流程自动化（本仓库独有）**：`.github/workflows/release-script-json.yaml` 在 `push: tags: v*` 时触发 → Node 24 + pnpm 10 → `pnpm install --frozen-lockfile` → `node scripts/package-tavern-helper-script.mjs --check-tag --tag "$GITHUB_REF_NAME"` → `pnpm release:script` → `softprops/action-gh-release@v2` 上传 `release/*.json`。
- **tag 与 `package.json.version` 必须严格相等**：打包脚本 `checkTag()` 期望 `v${version}`，不符直接抛错退出（`Release tag ... does not match package.json version ...`）。本地跑打包若设置了 `GITHUB_REF_TYPE=tag`/`RELEASE_TAG`/`--tag` 也会校验。
- **打包产物命名与内容约定**：`release/ST-msg-btn-mgr-v<version>.json`（远程引用版，`content = import '<remoteUrl>'`）与 `release/ST-msg-btn-mgr-v<version>.inline.json`（内联版，去掉 `//# sourceMappingURL=` 注释后整段内联）；`name` 统一为 `${baseName}v${version}`；`fileBaseName` 经 `sanitizeFilePart` 过滤 `\/:*?"<>|` 与空白。`config.enabled === false` 时静默跳过不产出。
- **`tavern-helper-script.config.json` 的 dist 路径与仓库名不一致是历史遗留**：`dist` 指向 `dist/ST-user-message-swipe/index.js`（源码目录名），而 `fileBaseName`/仓库名为 `ST-msg-btn-mgr`；`outputDirectory` 为 `release`（无子目录），`remoteUrl` 用 `@main` 而非 `@latest`（与 ST-PanelReset 的 `@latest` 不同）。改配置时勿"顺手统一"。
- **测试即源码字符串断言**：`test/stums-normalize-swipes.test.mjs` 用 `ts.transpileModule` 转 CommonJS 后在 `vm.runInNewContext` 中执行，手工 mock `$`、`z`、`MutationObserver`、`Element`、`klona`、`window`；除断言纯函数行为外，**还断言源码中「不得出现」的反模式字符串**（如 `source.includes('insertAfter($mes_text)') === false`、`deleteUserMessageOrSwipe` 已移除、若干按钮特性已被禁用），即"已废弃实现不得回归"以源码文本形式固化。
- **`appendInexistentScriptButtons` 注册按钮**：脚本用 `appendInexistentScriptButtons([...])` + `eventOn(getButtonEvent('按钮名'), ...)`；管理器按钮名为 `⚙`（源码断言 `const MANAGER_BUTTON_NAME = '⚙'`），配置文件中 `script.button.buttons` 也登记同名 `⚙`。
- **脚本 ID 固定**：`script.id = a90de8ad-ff45-4335-a9f7-5ff0d4c447df`。
- **设置项持久化约定**：设置以 zod schema + `prefault` 定义默认值，经 `getVariables/replaceVariables({type:'script'})` 读写，写回前 `klona` 去 proxy（同共性规则 7）。

**专属命令**（`package.json.scripts`）：
- `build:dev` = `webpack --mode development`
- `build:js` = `webpack --mode production --env buildOnly=true`
- `build` = `pnpm build:js`（**注意：默认 build 只编 JS，不跑 schema dump / tavern_sync 副作用**）
- `build:all` = `webpack --mode production`
- `watch` = `webpack --mode development --watch --progress`
- `package:script` = `node scripts/package-tavern-helper-script.mjs`
- `release:script` = `pnpm build:js && pnpm package:script`
- `format` / `lint` / `lint:fix` = prettier / eslint
- `dump` = `node dump_schema.ts`；`sync` = `node tavern_sync.mjs`
- **无 `test` script**：`test/stums-normalize-swipes.test.mjs` 未挂到 `package.json`，需手动 `node test/stums-normalize-swipes.test.mjs` 运行。

**坑/禁忌**：
- `.cursor/` 缺失使 `.clinerules`、`.augment/rules`、`.kilocode`、`.roo` 下的链接全部悬空，**若在这些路径下编辑"规则文件"会写入断链**；正确位置是 `.agent/rules/`。
- `build` 与 `build:all` 语义不同，误用 `build:all` 会产生 schema dump / tavern_sync 副作用。

---

### tavern_helper_template

**证据文件**：`tavern_helper_template/CLAUDE.md`（1-24 行）、`AGENTS.md`（1-24 行）、`GEMINI.md`（1-24 行）、`README.md`（1-124 行）、`package.json`（1-118 行）、`tavern_sync.yaml`（1-27 行）、`.github/workflows/{bundle,bump_deps,sync_template}.yaml`、`.github/.templatesyncignore`、`.gitattributes`（1-5 行）、`tsconfig.json`、`.clinerules/*.md`、`初始模板/{脚本,前端界面,流式楼层界面,角色卡}/`、`示例/`、`slash_command.txt`（274 行）、`scripts/package-tavern-helper-script.mjs`、`scripts/template-sync.mjs`、`scripts/template-sync.test.mjs`

**性质判定（重要）**：本目录**同时含上游官方模板原件与本地二改**。判定依据：
- 上游原件：`README.md`、`.clinerules/*.md`、`.augment/`、`.github/workflows/{bundle,bump_deps,sync_template}.yaml`、`初始模板/`、`示例/`、`slash_command.txt`、`@types/`、`tavern_sync.mjs`（由 CI 每 3 天从上游拉取）。
- **本地二改**：`CLAUDE.md`/`AGENTS.md`/`GEMINI.md` 在 10 行引用之后**追加了第 12-24 行的「Codex 脚本打包与发布指引」段落**（上游同名文件只有前 10 行）；`package.json` 追加了 `build:js`/`build:all`/`package:script`/`release:script` 四条脚本；`scripts/package-tavern-helper-script.mjs`、`scripts/template-sync.mjs(.test.mjs)`、`tsconfig.json` 的 `paths` 别名、`.gitattributes` 的 `dist/** merge=ours` 亦为本地/上游增强。

**自定义规则（本地二改部分）**：
- **构建/发布分档纪律**：涉及 `dist`、脚本 JSON 打包、`tavern-helper-script.config.json`、pnpm 安装/构建问题、`.github/workflows` 发布流程时，**先读 `.codex/skills/tavern-helper-script/SKILL.md`**（该文件在本快照中不存在，见「附：无法分类/存疑条目」）。
- **依赖恢复必须显式**：先 `CI=true pnpm install --frozen-lockfile` 再构建。
- **构建命令分档**：用 `pnpm build:js` 编译脚本 JS；**只有明确需要 schema dump 或 tavern_sync 副作用时才用 `pnpm build:all`**；用 `pnpm package:script` 生成 Tavern Helper `type: "script"` JSON。
- **pnpm 构建脚本许可位置**：**不要依赖 `package.json.pnpm.onlyBuiltDependencies`**；应放在 `pnpm-workspace.yaml`。（注：`ST-chatfile-improve`、`ST-msg-btn-mgr` 的 `package.json` 中仍存在 `pnpm.onlyBuiltDependencies`，属未迁移的旧写法。）
- **网络故障立即停止**：registry 出现 `ECONNREFUSED`、`UND_ERR_DESTROYED` 或长时间逐包重试时，**停止命令并请求允许联网重跑，不要等待重试耗时**。
- **模板同步双轨**：上游用 `.github/.templatesyncignore`（忽略 `.github/workflows`、`@types`、`src`、`dist`、`README.md`），下游用 `.github/template-sync.json` 的 `protectedPaths`；`sync_template.yaml` 的 `if: github.repository != 'jiozhaoyue/tavern_helper_template'` 使本仓库自身跳过该工作流。
- **bundle 工作流按仓库身份分叉**：`github.repository == 'StageDog/tavern_helper_template'` 时只保留 `dist/角色卡示例`；否则删除 `dist/{角色卡示例,脚本示例,流式楼层界面示例,前端界面示例}`——**即示例只在上游保留，下游仓库构建时剔除**。
- **依赖与 `@types` 自动更新**：`bump_deps.yaml` 每 3 天（`cron: 0 0 */3 * *`）跑 `pnpm update` + `pnpm install --lockfile-only`，并 `wget` 重下 `@types.zip`（来自 `gitlab.com/novi028/JS-Slash-Runner`）与 `tavern_sync.mjs`（来自 `StageDog/tavern_sync`）；**若变更文件只有 `pnpm-lock.yaml` 则跳过提交**。
- **`tsconfig` 路径别名约定**：`@util/*` → `./util/*`，`@/*` → `./src/*`。

**专属命令**（`package.json.scripts`，含本地二改的加粗项）：
- `build:dev` = `webpack --mode development`
- **`build:js` = `webpack --mode production --env buildOnly=true`**
- **`build` = `pnpm build:js`**
- **`build:all` = `webpack --mode production`**
- `watch` = `webpack --mode development --watch --progress`
- **`package:script` = `node scripts/package-tavern-helper-script.mjs`**
- **`release:script` = `pnpm build:js && pnpm package:script`**
- `format` / `lint` / `lint:fix`
- `dump` = `node dump_schema.ts`；`sync` = `node tavern_sync.mjs`
- `template:sync` / `template:sync:ci` / `test:template-sync`

**坑/禁忌**：
- `初始模板/脚本/新建为src文件夹中的文件夹/index.ts` 在本快照中为空（0 字节内容），而 `初始模板/前端界面/新建为src文件夹中的文件夹/index.html` 仅 4 行（`<head></head><body><div id="app"></div></body>`）——这是模板骨架形态，**不是可运行产物**。
- 依赖版本极新且含预发布：`typescript: 6.0.3`、`jquery: ^4.0.0`、`vue-router: ^5.1.0`、`eslint: ^10.6.0`、`@pixi/react: 8.0.5`——与本仓库其他项目（`typescript: 6.0.0-dev.20250807`、`jquery: ^3.7.1`、`vue-router: ^4.6.4`）**存在代差**，跨项目复制依赖清单会引发不兼容。
- 工作流权限需人工配置：仓库 Settings → Actions → General 需设 `Read and write permissions` 并勾选 `Allow GitHub Actions to create and approve pull requests`（否则 sync_template 无法开 PR）。
- 克隆需先启用 `core.symlinks`（否则 `.clinerules`/`.augment` 的符号链接会变成文本文件）。

---

### tavern_helper_workspace

**证据文件**：`tavern_helper_workspace/scripts/project-workflow-luker-extension.test.mjs`（1-141 行）

**性质判定**：本目录**在本快照中仅含 1 个测试文件，无 README、无 package.json、无 `.git`、无 git remote**——是一个"尚未成型/未纳入版本控制"的多扩展工作区脚手架。**所有关于其组织方式的结论只能从该测试文件的 fixture 与断言反推**，无任何说明文档佐证。

**自定义规则（从测试 fixture 反推，均为该测试固化的契约）**：
- **工作区以 `projects.json` 为唯一扩展注册表**，每项结构为：
  `{ packageName, version, repository, branch, entry, dist, scriptConfig, releaseDirectory, sourceRoots[], distRoots[], readme }`
  （示例：`Demo: { packageName: 'demo-extension', version: '1.2.3', repository: <origin 路径>, branch: 'main', entry: 'src/Demo/index.ts', dist: 'dist/Demo/index.js', scriptConfig: 'projects/Demo/tavern-helper-script.config.json', releaseDirectory: 'release/Demo', sourceRoots: ['src/Demo'], distRoots: ['dist/Demo'], readme: 'projects/Demo/README.md' }`）
  → 即**每个扩展有独立的 `src/<名>/`、`dist/<名>/`、`release/<名>/`，扩展私有文件（README、script 配置）放 `projects/<名>/`**。
- **统一构建入口是 `scripts/project-workflow.mjs`**，子命令形式 `node scripts/project-workflow.mjs export <扩展名>`；`projects.json`、`.gitignore`、`package.json`、`webpack.config.ts`、`tsconfig.json`、`@types/`、`util/`、`tavern_sync.mjs`、`dump_schema.ts`、`示例/`、`初始模板/` 均在工作区根（沿用模板仓库的根结构）。
- **`export` 产出「纯 Luker 扩展仓库」**：输出到 `.targets/<扩展名>/`，包含：
  - `manifest.json`，字段由扩展的 `scriptConfig` 派生——`display_name` 取 `script.baseName`（示例断言 `=== '演示扩展'`）、`js: 'index.js'`、`version` 取 `projects.json` 的 `version`（`1.2.3`）、`auto_update: true`
  - `index.js`，内容为**动态 import 转发**：`import("./dist/<名>/index.js")`（正则断言 `import\(["']\.\/dist\/Demo\/index\.js["']\)`）
  - `dist/<名>/`（编译产物）与 `release/<名>/*.json`（Tavern Helper 脚本 JSON）
  - `LICENSE`（断言含 `GNU GENERAL PUBLIC LICENSE`）与 `package.json`，其中 `package.json.license === 'GPL-3.0-only'` 且 **`package.json.scripts === undefined`**（导出的扩展仓库不带任何构建脚本）
- **导出必须剔除工作区脚手架文件**（断言这些文件在 `.targets/<名>/` 中**不存在**）：`.github/workflows/bump_deps.yaml`、`.agent/mcp.json`、`@types/index.d.ts`、`util/script.ts`、`webpack.config.ts`、`tsconfig.json`、`pnpm-lock.yaml`、`示例/`、`初始模板/`、`tavern_sync.mjs`、`dump_schema.ts`。
- **`.gitignore` 必须忽略**：`.targets/`、`release/`、`node_modules/`。
- **测试基建约定**：测试为独立 `.mjs`，**自建裸 git 仓库 fixture**（`git init --bare` 作 origin + seed 仓库 push + 工作区），用 `execFileSync` 调 `git`/`node`，`mkdtempSync(tmpdir())` 建临时目录、`finally` 中 `rmSync(recursive, force)` 清理——**与 `ST-chatfile-improve`/`ST-msg-btn-mgr` 的 node:test + assert/strict 风格一致**，未引入 jest/vitest 等框架。

**专属命令**：`node scripts/project-workflow.mjs export <扩展名>`（由测试第 111 行调用确证）；测试自身为 `node scripts/project-workflow-luker-extension.test.mjs`。**无 package.json，故无 pnpm scripts 可对照。**

**坑/禁忌**：
- `scripts/project-workflow.mjs` **在本快照中不存在**（测试第 9 行 `readFileSync(resolve('scripts/project-workflow.mjs'))` 会失败），该测试当前**不可直接运行**；实现文件缺失或未纳入本目录。
- 无 README/无文档，工作区组织方式只能靠读测试 fixture 推断，**极易误改契约字段名**（`entry`/`dist`/`sourceRoots`/`distRoots`/`releaseDirectory` 等）。

---

## 工作区与脚手架专项

### 一、`tavern_helper_workspace`：多扩展工作区的组织方式

**当前实际状态**：`D:\Repo\Tavern-repo\JS-Slash-Runner\tavern_helper_workspace\` 下**只有** `scripts/project-workflow-luker-extension.test.mjs` 一个文件；无 `projects.json`、无 `package.json`、无 README、无 `.git`（`git -C` 查询 remote 无输出）。即**工作区本体尚未落地，只有一份描述其契约的测试**。

**设计意图（据测试反推）**：
- 单一工作区根容纳多个扩展，扩展通过 `projects.json` 注册；每个扩展在根下拥有 `src/<名>/`（源码）、`dist/<名>/`（构建产物）、`release/<名>/`（脚本 JSON）、`projects/<名>/`（扩展私有 README 与 `tavern-helper-script.config.json`）。
- 根目录保留模板仓库的标准脚手架（`webpack.config.ts`、`tsconfig.json`、`@types/`、`util/`、`tavern_sync.mjs`、`dump_schema.ts`、`示例/`、`初始模板/`），因此**多扩展共享同一套构建配置与酒馆助手类型定义**。
- **统一构建/发布命令为 `node scripts/project-workflow.mjs export <扩展名>`**，产出到 `.targets/<扩展名>/`，形态是可直接作为 Luker 扩展仓库发布的「纯扩展仓库」（manifest.json + index.js 转发 + dist + release + LICENSE + 无 scripts 的 package.json）。
- 产物与工作区脚手架强隔离：导出时剔除 `.github/workflows`、`.agent/mcp.json`、`@types`、`util`、`webpack.config.ts`、`tsconfig.json`、`pnpm-lock.yaml`、`示例`、`初始模板`、`tavern_sync.mjs`、`dump_schema.ts`。

**证据**：`tavern_helper_workspace/scripts/project-workflow-luker-extension.test.mjs` 第 57-106 行（fixture 构造）、第 108-141 行（断言）。

### 二、`tavern_helper_template`：脚手架提供的标准约定

**目录约定**：
- `src/<项目名>/`：源码。`index.ts` + `index.html` = 前端界面项目；仅 `index.ts` = 脚本项目。
- `dist/<项目名>/`：webpack 打包产物，**随仓库上传**（供 jsdelivr 自动更新），CI 每次重新打包。
- `util/`：`script.ts`（脚本用函数）、`common.ts`（界面/脚本通用）、`mvu.ts`（MVU 用，含 `defineMvuDataStore`）、`streaming.ts`（含 `mountStreamingMessage`）、`iframe_srcdoc.html`。
- `@types/`：酒馆助手接口类型定义（`function/*.d.ts` 与 `iframe/*.d.ts`），由 CI 从上游 `@types.zip` 覆盖更新；**其中的接口可直接调用，无需 import，也无需检查可用性**。
- `初始模板/`：`脚本/`、`前端界面/`、`流式楼层界面/`、`角色卡/` 四类骨架，每类下分 `新建为src文件夹中的文件夹/`（放入 src 的骨架）与 `导入到酒馆中/`（可直接导入酒馆的成品）。
- `示例/`：`脚本示例`、`前端界面示例`、`流式楼层界面示例`、`角色卡示例`（**禁止删除**，AI 需参考；可在 webpack 配置中排除打包）。
- `slash_command.txt`：274 行的 STScript 命令清单（供 `triggerSlash` 参考）。
- `tavern_sync.yaml` + `tavern_sync.mjs`：把酒馆中的角色卡/世界书/预设提取到本地或反向打包（配置项 `user名称`、`配置.{名称}.{类型,酒馆中的名称,本地文件路径,导出文件路径}`）。

**类型/导入约定**：
- `tsconfig.json` 别名：`@util/*` → `./util/*`，`@/*` → `./src/*`；`types` 预置 jquery、jqueryui、lodash、toastr、type-fest、yaml、zod。
- 特殊导入：`import x from './f?raw'`（内容字符串；`.ts`/`.scss` 会先经 webpack 打包成纯 js/css）；`import html from './f.html'`（html-loader 最小化）；`import md from './f.md'`（remark-loader 转 html）；`import C from './f.vue'`（vue 组件，优先使用）；`import './index.scss'`（自动注入最终 `dist/**/index.html` 的 `<head>`）。
- `package.json` 的 `dependencies` 即"可用第三方库白名单"（dedent、gsap、jquery、jqueryui、lodash、pinia、pixi.js、toastr、yaml、vue、vue-router、@vueuse/*、react、@pixi/react、async-wait-until、zod 等），可自行 `pnpm add` 扩展。

**构建产物形态**：
- 脚本：`dist/<名>/index.js`（单文件，webpack production + obfuscator）。
- 前端界面：`dist/<名>/index.html`（单文件自包含，样式与脚本已内联进 `<head>`/`<body>`）。
- 二者均可经 jsdelivr 以 `$('body').load('https://testingcf.jsdelivr.net/gh/<user>/<repo>/dist/<名>/index.html')` 或 `import 'https://testingcf.jsdelivr.net/gh/.../index.js'` 远程加载（这也是共性规则 1 禁止 `DOMContentLoaded` 的根因）。
- `bundle.yaml` 自动打包并**自动递增版本号**（让 jsdelivr 更快失效缓存）；下游仓库额外用 `autotag-action` 打版本 tag（`with-v: true`），因为带版本号的 jsdelivr URL 缓存 12h、不带版本号则 7d。
- `.gitattributes` 固定 `dist/** merge=ours`；`.editorconfig`/`.prettierrc` 与 `.vscode/settings.json` 强制 `editor.formatOnSave`、prettier（singleQuote、printWidth 120、trailingComma all、arrowParens avoid、semi、tabWidth 2）与 `source.organizeImports`/`fixAll` 等保存时动作。

**证据**：`tavern_helper_template/.clinerules/*.md` 全篇、`README.md` 第 45-100 行、`package.json` 第 1-118 行、`tsconfig.json`、`.github/workflows/bundle.yaml` 第 37-53 行、`ST-chatfile-improve/.github/workflows/bundle.yaml` 第 44-53 行、`.vscode/settings.json`、`.gitattributes`、`tavern_sync.yaml`、`slash_command.txt`。

### 三、各项目 `package.json` scripts 对照表

| script | ST-PanelReset | ST-chatfile-improve | ST-msg-btn-mgr | tavern_helper_template |
| :--- | :--- | :--- | :--- | :--- |
| （无 scripts 字段） | **是** | — | — | — |
| `build:dev` | — | `webpack --mode development` | 同左 | 同左 |
| `build:js` | — | — | `webpack --mode production --env buildOnly=true` | 同左 |
| `build` | — | `webpack --mode production` | `pnpm build:js` | `pnpm build:js` |
| `build:all` | — | — | `webpack --mode production` | 同左 |
| `watch` | — | `webpack --mode development --watch --progress` | 同左 | 同左 |
| `package:script` | — | — | `node scripts/package-tavern-helper-script.mjs` | 同左 |
| `release:script` | — | — | `pnpm build:js && pnpm package:script` | 同左 |
| `format` | — | prettier --write（src 下 ts/tsx/js/jsx/css/scss/html/vue） | 同左 | 同左 |
| `lint` / `lint:fix` | — | `eslint` / `eslint --fix` | 同左 | 同左 |
| `dump` | — | `node dump_schema.ts` | 同左 | 同左 |
| `sync` | — | `node tavern_sync.mjs` | 同左 | 同左 |
| `template:sync` | — | `node scripts/template-sync.mjs` | — | 同左 |
| `template:sync:ci` | — | `node scripts/template-sync.mjs --mode=ci` | — | 同左 |
| `test:template-sync` | — | `node scripts/template-sync.test.mjs` | — | 同左 |
| **test（任何形式）** | — | —（测试文件未挂 script） | —（测试文件未挂 script） | —（测试文件未挂 script） |

补充对照（非 scripts，但影响构建/发布）：

| 项 | ST-PanelReset | ST-chatfile-improve | ST-msg-btn-mgr | tavern_helper_template |
| :--- | :--- | :--- | :--- | :--- |
| `package.json.version` | 1.1.0 | 未设 | 1.0.0 | 0.1.0 |
| `package.json.license` | GPL-3.0-only | 未设 | 未设 | 未设（LICENSE 文件为 Aladdin） |
| `pnpm.onlyBuiltDependencies` | 无 | 有（6 项） | 无 | 无 |
| `tavern-helper-script.config.json` | 有 | 无 | 有 | 无 |
| `outputDirectory` | `release/ST-PanelReset` | — | `release` | — |
| `remoteUrl` 版本策略 | `@latest` | — | `@main` | — |
| workflows | 无 | bundle / bump_deps / sync_template | bundle / bump_deps / sync_template / **release-script-json** | bundle / bump_deps / sync_template |
| 测试文件 | 无 | `scripts/*.test.mjs` ×2 | `test/*.test.mjs` ×1 | `scripts/template-sync.test.mjs` |
| 上游同步配置 | 无 | `.github/template-sync.json`（指向 jiozhaoyue fork） | 仅 `.github/.templatesyncignore` | 仅 `.github/.templatesyncignore` |

---

## 附：无法分类/存疑条目

1. **`tavern_helper_template/CLAUDE.md` 与 `AGENTS.md` 引用的 `.codex/skills/tavern-helper-script/SKILL.md` 不存在**。两份文件第 16 行要求「当任务涉及脚本构建、`dist`、脚本 JSON 打包……时，先阅读 `@.codex/skills/tavern-helper-script/SKILL.md`」，但全仓库（排除 node_modules）`find -name SKILL.md` **零命中**，且 `tavern_helper_template/.codex/` 目录本身不存在。→ 该指引当前是**断链**，其"关键避坑"四条只能从 `CLAUDE.md` 正文本身获取。证据：`tavern_helper_template/CLAUDE.md` 第 12-24 行、`AGENTS.md` 第 12-24 行。

2. **符号链接在不同项目中的存在性不一致，导致"规则文件在哪"因项目而异**：
   - `ST-chatfile-improve`：`.cursor/rules/*.mdc` 为实体，`.clinerules`/`.augment`/`.kilocode`/`.roo` 为有效链接。
   - `ST-msg-btn-mgr`：`.cursor/` **缺失**，但 `.agent/rules/*.mdc` 有同名实体文件（内容一致），其余目录链接悬空。
   - `tavern_helper_template`：`.cursor/` **缺失**且 `.agent/` 也缺失，`.clinerules`/`.augment` 的链接**全部悬空**（正文不可读）。
   - `ST-PanelReset`：规则目录**完全不存在**。
   → 结论：**"项目规则八件套"真正生效的只有 `ST-chatfile-improve` 与 `ST-msg-btn-mgr`**；`tavern_helper_template` 需依赖上游原仓库补齐 `.cursor/` 才可读；`ST-PanelReset` 完全不受这套规则约束。证据：各项目 `ls -la` 输出（`ST-chatfile-improve/.clinerules/*.md -> ../.cursor/rules/*.mdc` 等）。

3. **`tavern_helper_workspace` 无任何文档、无 git、无 package.json**，且其唯一测试所依赖的 `scripts/project-workflow.mjs` 缺失。→ 无法确认它是"进行中的新工作区"还是"被剥离出的测试样本"，也无法确认 `projects.json` 是否还有其他未在 fixture 中出现的字段。证据：`tavern_helper_workspace/` 目录列表（仅 `scripts/`）、`scripts/project-workflow-luker-extension.test.mjs` 第 9、57-106 行。

4. **`ST-PanelReset` 的 `README.md` 与 `package.json` 严重脱节**：`README.md` 是上游模板原件（首行 `# tavern_helper_template`，含"请阅读教程文档""Use this template""如果只在本地使用"等模板说明），而 `package.json` 只有 7 行且无 scripts。→ 推测项目是"从模板拷出后删掉脚手架只留 src/dist/release"，但 README 未清理。证据：`ST-PanelReset/README.md` 第 1-47 行、`ST-PanelReset/package.json` 第 1-7 行。

5. **`ST-msg-btn-mgr/.github/` 下有 `.templatesyncignore` 但无 `template-sync.json`**：该仓库的 `sync_template.yaml` 调用 `pnpm template:sync:ci`，而该命令需要 `.github/template-sync.json`（`template-sync.mjs` 第 148 行缺 `upstream` 即报错），但 `package.json` 中**也没有** `template:sync:ci` script。→ 该仓库的模板同步链路在本快照中不完整（脚本、配置、script 入口三缺）。证据：`ST-msg-btn-mgr/.github/` 列表（仅 `.templatesyncignore` 与 `workflows/`）、`ST-msg-btn-mgr/package.json` 第 2-17 行、`ST-chatfile-improve/scripts/template-sync.mjs` 第 148-150 行。

6. **`ST-chatfile-improve` 独有 CDP 调试脚本**：`scripts/cdp-eval.ps1`、`scripts/cdp-chat-import-smoke.ps1` 存在但未挂入 `package.json.scripts`，也未在任何规则文档中被说明用途。→ 用途只能从文件名推测（Chrome DevTools Protocol 求值 / 聊天导入冒烟测试）。证据：`ST-chatfile-improve/scripts/` 目录列表。

7. **`bundle.yaml` 三仓库写法分歧（潜在不一致风险）**：`ST-chatfile-improve` 用 `pnpm install && pnpm build`；`ST-msg-btn-mgr` 与 `tavern_helper_template` 用 `pnpm install --frozen-lockfile && pnpm build:js`。同时 `tavern_helper_template` 的 bundle 不含 autotag 步骤，`ST-chatfile-improve` 与 `ST-msg-btn-mgr` 含（`phish108/autotag-action@v1.1.64` + 删除旧 tag）。→ 是否属有意为之无法判定。证据：三个仓库的 `.github/workflows/bundle.yaml`。
