# 本机酒馆实例/端口/浏览器自动化调研

调研时间：2026-09-21
调研方式：只读（`ls` / `git remote` / `git log` / `cat config.yaml` / `Get-Process` / `Get-NetTCPConnection`）
未改动任何实例文件、未读取任何聊天内容（`data/` 仅列目录名）

---

## 1. 实例清单

| 实例路径 | 项目 | 类型(源码/安装版) | 体积 | 最后修改 | 备注 |
|---|---|---|---|---|---|
| `Instance\Dev\Luker` | Luker（SillyTavern fork） | 源码仓 clone | 3034.4 MB | 2026-08-29 11:42 | 分支 `luker`；本地 commit `8cd177ed2` (2026-08-26)。**remote 异常**：`origin` 指向 `SillyTavern/SillyTavern`，另有名为 `luker` 的 remote（HEAD→`luker/release`）。README 自述 "Luker is a SillyTavern fork" |
| `Instance\Dev\PureTavern` | PureTavern | 源码仓 clone（pnpm monorepo） | 409.1 MB | 2026-08-28 15:42 | `origin`=`Lianues/PureTavern`；commit `9a1e854` release 0.1.12 (2026-07-31)。含 apps/{web,desktop,mobile,harmony,remote-server,vscode-extension} + packages/{contracts,shared} |
| `Instance\Dev\SillyTavern` | SillyTavern 上游 | 源码仓 clone | 581.6 MB | 2026-08-28 15:45 | `origin`=`SillyTavern/SillyTavern`；commit `8172dcd0e` (2026-07-07) |
| `Instance\Dev\TauriTavern` | TauriTavern | 源码仓 clone（**残缺**） | 104.2 MB | 2026-08-28 15:40 | `origin`=`Darkatse/TauriTavern`；commit `3a8c5401` (2026-08-12)。**缺 `src-tauri/`、`tests/`、`node_modules/`**，仅前端/web 部分 |
| `Instance\Dev\Tavern-Viewer` | Tavern-Viewer | 源码仓 clone | 0.4 MB | 2026-05-07 04:50 | `origin`=`Staruin/Tavern-Viewer`；commit `01f18b0` (2026-03-07)。Node+Vite+Electron |
| `Instance\Dev\TavernHeadless` | TavernHeadless | 源码仓 clone（pnpm monorepo） | 391.9 MB | 2026-05-02 23:20 | `origin`=`HerSophia/TavernHeadless`；commit `20e71d2` (2026-05-02) |
| `Instance\Dev\nocturne_memory` | nocturne_memory | 源码仓 clone | 6.8 MB | 2026-06-21 19:31 | `origin`=`Dataojitori/nocturne_memory`；commit `beee74a` (2026-06-15)。Python 后端 + 前端，含 `demo.db` (1.3 MB) |
| `Instance\Real\Luker` | Luker | 源码仓 clone | 4294.5 MB | 2026-09-05 15:45 | `origin`=`funnycups/Luker`，分支 `release`；commit `239b329ea` (2026-09-06)。**当前正在运行** |
| `Instance\Real\PureTavern` | PureTavern | 源码仓 clone | 409.1 MB | 2026-08-28 15:38 | `origin`=`Lianues/PureTavern`；commit `9a1e854`（与 Dev 版**完全同 commit**） |
| `Instance\Real\SillyTavern` | SillyTavern 上游 | 源码仓 clone | 582.5 MB | 2026-08-28 15:14 | `origin`=`SillyTavern/SillyTavern`；commit `8172dcd0e`（与 Dev 版同 commit） |
| `Instance\Real\TauriTavern` | TauriTavern | 源码仓 clone（**完整**） | 266.7 MB | 2026-08-28 15:48 | `origin`=`Darkatse/TauriTavern`；commit `3a8c5401`。**含 `src-tauri/`+`tests/`+`node_modules/`** |
| `Myfork\PureTavern` | PureTavern（个人 fork） | 源码仓 clone | 363.5 MB | 2026-09-05 14:15 | `origin`=`jiozhaoyue/PureTavern`；仅 `main` 分支；commit `9a1e854`（与上游 release 同 commit）。额外含 `.trellis` `.claude` `.agents` `.codex` 等 agent 目录 |

补充：`Instance\Dev\readme.md` 原文——"均为存有真实数据进行测试的酒馆及类酒馆实例，如果有开发分支，则使用开打分制"（末句疑似笔误）；`Instance\Real\readme.md` 原文——"均为存有真实数据使用的酒馆及类酒馆实例"。

**三处 PureTavern 的区分**：
- `Instance\Dev\PureTavern` / `Instance\Real\PureTavern`：同一上游 `Lianues/PureTavern` 的两份 clone，文件清单 diff 为空、commit 相同、体积相同（均 409.1 MB）。
- `Myfork\PureTavern`：个人 fork `jiozhaoyue/PureTavern`，体积更小（363.5 MB），带 agent 目录。
- 证据：`git remote get-url origin` 三条输出 + `diff <(ls Dev/PureTavern) <(ls Real/PureTavern)` 无差异。

**「Dev/Real」命名与实际内容不符的两处**（值得写进统一规则）：
- `Dev\PureTavern` 与 `Real\PureTavern` 内容无差异，且都**没有 `data/` 目录**（PureTavern 数据在浏览器 IndexedDB/OPFS，不在磁盘 dataRoot）→ `Real\PureTavern` 目前看是冗余副本。
- `Dev\TauriTavern` 缺 `src-tauri/`，无法构建，实质只是前端代码快照；可构建的是 `Real\TauriTavern`。

---

## 2. 端口与配置对照

配置来源：各实例根目录 `config.yaml`（Dev/Luker、Real/Luker、Dev/ST、Real/ST）；`default/config.yaml` 为出厂默认；另有 `docker-compose.yml` / `vite.config.ts` / `.env`。

| 实例 | 端口 | 数据目录 | 关键配置项 | 冲突? |
|---|---|---|---|---|
| `Dev\Luker` | **8003** | `./data`（`config.yaml:1`） | `listen: true`（:2）、`listenAddress 0.0.0.0`+`[::]`、`ssl.enabled: true`（certs/cert.pem）、`whitelistMode: true`（白名单 `::1,127.0.0.1,192.168.*.*,10.236.*.*`）、`securityOverride: false`、`enableCorsProxy: false`、`extensions.enabled: true`、`enableServerPlugins: true`、`enableUserAccounts: true`、`requestProxy` 关闭（socks5://127.0.0.1:10808）、`cors.enabled true` origin `["null"]` methods `[OPTIONS]`、`storage.mode: fs` | 否（8003 独占） |
| `Real\Luker` | **8004** | `./data` | `listen: true`、`ssl.enabled: true`、**`whitelistMode: false`**、`securityOverride: **true**`、`enableCorsProxy: false`、`cors.enabled true` origin `["*"]` methods 全开 allowedHeaders `["*"]` maxAge 86400、`requestProxy` **启用**（socks5://127.0.0.1:10808）、`enableUserAccounts: false`、`enableKeepAlive: true`、`thumbnails.format: webp`、`performance.memoryCacheCapacity: 512mb`、`extensions.enabled: true` | 否（8004 独占，**当前占用中**） |
| `Dev\SillyTavern` | **8001** | `./data` | `listen: false`、`ssl.enabled: false`、`whitelistMode: true`（`::1,127.0.0.1`）、`securityOverride: false`、`enableCorsProxy: false`、`extensions.enabled: true`、`enableServerPlugins: false`、`cors.enabled true` origin `["null"]` methods `[OPTIONS]`、`requestProxy` 关闭 | 否（8001 独占） |
| `Real\SillyTavern` | **8002** | `./data` | `listen: false`、`ssl.enabled: false`、`whitelistMode: true`、`securityOverride: false`、`enableCorsProxy: false`、`enableServerPlugins: false`、`cors.enabled true` origin `["null"]` methods `[OPTIONS]` | 否（8002 独占） |
| 两者 `default\config.yaml` | 8000 | `./data` | `listen: false`、`whitelistMode: true`、`enableCorsProxy: false`、`securityOverride: false`（Luker :83/:103/:119/:225；ST :40/:60/:76/:182） | 出厂默认值，未生效 |
| `Dev/Real\Luker` `docker-compose.yml` | 8000 | 卷 `./data` | `127.0.0.1:8000:8000`、image `ghcr.io/funnycups/luker:latest`、容器名 `luker` | **冲突**：两条 compose 都占 8000；与 ST default 8000 也重叠 |
| `Dev\PureTavern` `apps\web\vite.config.ts` | **8899** (dev) / **4173** (preview) | 无磁盘 dataRoot（浏览器 IndexedDB/OPFS） | `server.host: 127.0.0.1`、`server.port: 8899`、`strictPort: true`、`preview.port: 4173` | 否（8899/4173 独占） |
| `PureTavern` `apps\remote-server` | 8000（默认） | — | `app.mjs:61` `PURE_TAVERN_PROXY_PORT ?? '8000'`；`app.mjs:60` `PURE_TAVERN_PROXY_HOST ?? '0.0.0.0'` | **冲突**：默认 8000，与 Luker compose/ST default 重叠（需环境变量改口） |
| `Dev\Tavern-Viewer` `docker-compose.yml` | **3000** | 卷 `/d/Git/SillyTavern-Launcher/SillyTavern/data:/data:ro` | `"3000:3000"`、`PORT=3000`、`DATA_DIR=/data`、`USER_DIR=default-user` | **冲突**：与 TavernHeadless 默认 3000 撞；且 3000 当前被系统进程占用（见 §3） |
| `Dev\TavernHeadless` `.env` | **3000** | — | `PORT=3000` | **冲突**：与 Tavern-Viewer 撞 |
| `Dev\nocturne_memory` `docker-compose.yml` | 80（可调）/ 后端 8233 | 卷 `snapshots_data`、`backups_data`、`./config.json` | `nginx` 端口 `"${NGINX_PORT:-80}:80"`；backend 健康检查 `http://localhost:8233/health`；postgres 16-alpine（内部 5432） | 低（80 需管理员权限；8233 内部） |
| `Real\TauriTavern` `default\config.yaml` | 8000（默认） | `./data` | `listen: false`、`dataRoot: ./data`（:3/:6/:40）；实际由 Tauri 应用内管理，非独立服务 | 出厂默认，桌面应用不监听固定端口 |

**关键结论（端口）**：
1. **8001–8004 是人为错开的四段独占区间**，是当前唯一无冲突的分配方案：
   `8001=Dev\SillyTavern`、`8002=Real\SillyTavern`、`8003=Dev\Luker`、`8004=Real\Luker`。这四者互不冲突，应作为统一规则的基线保留。
2. **8000 是默认值重灾区**：Luker 两份 `docker-compose.yml`、ST/Luker 两份 `default\config.yaml`、PureTavern remote-server 默认值、TauriTavern `default\config.yaml` 全部落 8000。任一默认启动都会互相抢占。
3. **3000 双重冲突**：`Tavern-Viewer` 与 `TavernHeadless` 都默认 3000；且该端口当前被系统 `svchost`（PID 5908）占用，两者直接启动都会失败。
4. `8899`（PureTavern web dev）、`4173`（Vite preview）、`8233`（nocturne 后端）为独占用口，无冲突。

---

## 3. 当前实际监听端口

命令：`Get-NetTCPConnection -State Listen | Where-Object {$_.LocalPort -gt 1024}`（PowerShell 7，**有权限，成功获取**）

与酒馆相关的实际监听：

| 端口 | 绑定 | PID | 进程 | 判定 |
|---|---|---|---|---|
| **8004** | 0.0.0.0 | 50076 | `node.exe`，命令行 `node  server.js`，启动于 2026/9/21 13:58:50 | **= `Real\Luker`（config port 8004）正在运行** |
| **3000** | 0.0.0.0 | 5908 | `svchost.exe` | 被 Windows 系统服务占用 → Tavern-Viewer/TavernHeadless 若用 3000 会失败 |
| 6080 | 0.0.0.0 | 45696 | `python.exe`，`-m websockify --web "D:\Git\noVNC" 6080 127.0.0.1:6901` | noVNC 远程桌面，非酒馆 |
| 10808/10809/10812 | :: / 127.0.0.1 | 20628 | （代理进程） | 与 Luker `requestProxy` 配置的 `socks5://127.0.0.1:10808` **一致，代理在跑** |
| 15721 | 127.0.0.1 | 18132 | （Claude 本地代理） | 见全局规则 §5.3 |

**未在监听**：8001、8002、8003 → `Dev\SillyTavern`、`Real\SillyTavern`、`Dev\Luker` 当前均**未运行**。

其他 >1024 监听（非酒馆，供参考）：2179、3060、3389(RDP)、5000、5040、5985(WinRM)、7680、7800、7891、8034、8045、9010、9080、9090、9180、9223、10000、12434、13688、19222、25734、30950、38671、42050、45654、47001、49664–49761（Windows 动态端口）。

进程侧（`Get-Process node,python,tauri*,cargo`）：
- `node.exe` × 1（PID 50076，即 Real\Luker）
- `python.exe` × 1（PID 45696，noVNC）
- `msedge.exe` × 约 60 个（用户浏览器会话，全部来自 `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`）
- **无 `tauri*` / `cargo` 进程** → TauriTavern 未运行
- `chrome.exe` 无进程（未启动）

---

## 4. 浏览器自动化可用性

| 手段 | 是否可用 | 证据 |
|---|---|---|
| **Playwright（全局安装）** | ✅ 可用 | `C:\nvm4w\nodejs\node_modules\playwright\package.json` 存在，`version 1.62.1`；`npx --no-install playwright --version` → `Version 1.62.1`（成功） |
| **Playwright 浏览器内核** | ✅ 已下载 | `C:\Users\caocaobi\AppData\Local\ms-playwright\`：`chromium-1223`、`chromium-1228`、`chromium-1234`、`chromium_headless_shell-1223/1228/1234`、`ffmpeg-1011`、`winldd-1007`；`chromium-1234\chrome-win64` 存在且含 `INSTALLATION_COMPLETE` 标记 |
| **Puppeteer 浏览器内核** | ⚠️ 有缓存但未见 puppeteer 包 | `C:\Users\caocaobi\.cache\puppeteer\` 下有 `chrome`、`chrome-headless-shell`（内核缓存存在）；但未在任何 `node_modules` 中检出 `puppeteer` 依赖 |
| **Chrome（系统安装）** | ✅ 存在 | `C:\Program Files\Google\Chrome\Application\chrome.exe`（存在）。`C:\Program Files (x86)\...` 路径不存在 |
| **Edge（系统安装）** | ✅ 存在且在用 | `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`（存在，当前约 60 个进程在跑）。`C:\Program Files\Microsoft\Edge\...` 不存在 |
| **项目内 playwright/puppeteer 依赖** | ❌ 未检出 | 检查 `Instance\Dev\PureTavern\node_modules\.bin`、`Instance\Dev\TauriTavern\node_modules\.bin`、`Instance\Dev\TavernHeadless\node_modules\.bin`、`D:\Repo\Tavern-repo\node_modules\.bin` 均**无** `playwright*` / `puppeteer*`。对 `Instance\` 与 `Myfork\` 全量 grep `package.json` 依赖超时未完成（**未获取**，原因：目录过大/`node_modules` 遍历超 120s），已改为抽样确认 |
| **Playwright MCP（官方插件，未注册）** | ⚠️ 可用但未启用 | `C:\Users\caocaobi\.claude\plugins\marketplaces\claude-plugins-official\external_plugins\playwright\.mcp.json` → `{"playwright":{"command":"npx","args":["@playwright/mcp@latest"]}}`；plugin.json 描述为 Microsoft 官方 browser automation MCP。**当前会话未注册该 MCP** |
| **chrome-devtools-mcp（项目级，未注册）** | ⚠️ 可用但未启用 | 3 个 `.mcp.json` 均为：`D:\Repo\Tavern-repo\JS-Slash-Runner\{ST-chatfile-improve,ST-msg-btn-mgr,tavern_helper_template}\.mcp.json` → `{"mcpServers":{"chrome-devtools":{"command":"pnpx","args":["chrome-devtools-mcp@latest","--autoConnect"]}}}` |
| **全局 MCP 注册情况** | ❌ 无浏览器 MCP | `C:\Users\caocaobi\.claude.json` 的 `mcpServers` 仅有 `figma`（第 825–838 行）；各 project 段 `mcpServers` 均为 `{}`。`~\.claude\settings.json` 内无 chrome/playwright/puppeteer/browser 关键字（仅 `env` 代理配置） |
| **mcp-chrome 使用痕迹** | ✅ 有历史 | `C:\Users\caocaobi\AppData\Local\ms-playwright\mcp-chrome-4d3ea74\` 与 `mcp-chrome-9443e22\` 为完整 Chromium 用户配置目录（含 `Default`、`Crashpad`、`Last Version`），最后修改 2026-03-05 → 说明 MCP 浏览器曾被实际驱动过 |

**结论**：Playwright 1.62.1 + Chromium 1234 内核 + 系统 Chrome/Edge 三套浏览器资源齐备，`npx playwright` 可直接跑；缺的只是**项目内依赖声明**与 **MCP 注册**。最小可行路径是注册 `@playwright/mcp@latest`（官方插件已在本机 marketplace 内）或复用 JS-Slash-Runner 已有的 `chrome-devtools-mcp` 写法。

---

## 5. 关键风险与结论

### 5.1 端口冲突点（按严重度排序）

1. **3000 三方撞车**：`Dev\Tavern-Viewer`（compose `3000:3000`）＋ `Dev\TavernHeadless`（`.env PORT=3000`）＋ 当前被系统 `svchost`(PID 5908) 实占 → 两者按默认配置启动**必然失败**。规则建议：3000 划归系统保留，两项目改用 3010/3020。
2. **8000 默认值泛滥**：Luker 两份 `docker-compose.yml`、Luker/ST 两份 `default\config.yaml`、PureTavern remote-server（`PURE_TAVERN_PROXY_PORT` 默认）、TauriTavern `default\config.yaml` 六处默认 8000 → 任意两处默认启动即互抢。规则建议：把 8000 明确标记为「出厂默认、禁止直接使用」。
3. **8001–8004 是目前唯一正确的分区**（Dev/Real × ST/Luker），必须写进统一规则固化下来，禁止随意改动。
4. **代理端口 10808 是共享资源**：`Real\Luker` 的 `requestProxy.url = socks5://127.0.0.1:10808` 与实占 PID 20628 对应；`Dev\Luker` 配了同一地址但 `enabled: false`。规则建议：多实例同开时不要同时启用同一 socks5 出口。

### 5.2 数据安全红线

1. **`Instance\Real\*` 是真数据区**：`Real\Luker\data\`（含 `default-user`、`chat-branch.db` 及 `-shm`/`-wal`、`content.log`、`cookie-secret.txt`、`diagnostic-reports`）体积 4.29 GB，且 `Real\Luker` **此刻正在运行**（PID 50076，监听 8004）。规则建议：任何自动化/测试**禁止指向 Real 实例**，只允许 `Instance\Dev\*`。
2. **`Real\Luker` 的安全开关处于放宽状态**，与 Dev 实例差异显著，误连会放大风险：
   - `whitelistMode: false`（Dev 为 `true`）
   - `securityOverride: **true**`（Dev 为 `false`）
   - `cors.origin: ["*"]` + 全方法 + `allowedHeaders: ["*"]` + `maxAge: 86400`（Dev 为 `origin: ["null"]`、仅 `OPTIONS`）
   - `listen: true` 且 `listenAddress 0.0.0.0` → **对内网全部可达**，白名单却已关闭
   证据：`Instance\Real\Luker\config.yaml` 对应行 vs `Instance\Dev\Luker\config.yaml`。
3. **`Dev\Luker` 的白名单是内网段**：`192.168.*.*`、`10.236.*.*`（`Dev\Luker\config.yaml` whitelist 段），且 `listen: true`、`ssl.enabled: true` → 开发实例同样对局域网开放，只是有白名单兜底。
4. **`cookie-secret.txt` 出现在所有 data 目录**（Dev/Real 的 Luker 与 ST）→ 任何「同步/复制 data」操作都会泄露会话密钥，规则必须明令禁止跨实例拷贝 `data/`。
5. **`Real\Luker\config.yaml` 的 `basicAuthUser.password` 仍是出厂明文 `password`**（`enableUserAccounts: false` + `basicAuthMode: false`，故当前未启用，但属隐患）。
6. **`Dev\Luker\data\_tauritavern\`** 出现 TauriTavern 相关子目录（`extension-sources`）→ 存在跨项目数据混放，规则建议明确归属。

### 5.3 TauriTavern 构建结论

- **必须编译才能运行**：`package.json` 全部运行入口都走 Tauri CLI —— `tauri:dev` / `tauri:build` → `node scripts/tauri-app.mjs` → `@tauri-apps/cli ^2.10.0`；`web:build` 走 `rspack`。依赖 Rust 工具链（`cargo check/test/clippy` 均出现在 scripts）。
- **`src-tauri/` 是 14 crate 的 Cargo workspace**：`src-tauri/Cargo.toml` members = `crates/tauritavern`、`tt-domain`、`tt-contracts`、`tt-ports`、`tt-application`、`tt-adapter-{http,tokenization,sync,archive,provider-http,extension,storage-core,storage-userdata,media}`，`default-members = ["crates/tauritavern"]`，`resolver = "3"`。
- **当前无构建产物**：`find .../src-tauri/target -name "*.exe"` 无结果；`Instance\Real\TauriTavern\src-tauri\` 下只有 `Cargo.lock`、`Cargo.toml`、`crates`、`resources`，**无 `target/`**。
- **可移植包构建脚本**：`scripts/build-portable.mjs`，产物默认输出目录 `release`（`--output-dir`，默认值 `release`；`--skip-web-build` 可跳过前端）。
- **`Dev\TauriTavern` 无法构建**：缺 `src-tauri/`，仅有前端源码（104.2 MB vs Real 的 266.7 MB）。**结论：要构建/运行 TauriTavern 只能用 `Instance\Real\TauriTavern`。**
- 环境要求：`engines.node = "^20.19.0 || >=22.12.0"`；本机 node 在 `C:\nvm4w\nodejs\node.exe`。
- `.taurignore` 排除 `src-tauri/data`、`src/webfonts/**/*.woff`、`src/webfonts/*.ttf`（说明运行时数据在 `src-tauri/data`，但该目录当前不存在）。
- **`Instance\Real\TauriTavern` 同时是唯一含 `tests/` 的副本** → 测试也只能在此跑。

### 5.4 其他值得写进规则的结论

- **`Dev\Luker` 的 git remote 配置是错的/易混淆**：`origin` 指向上游 `SillyTavern/SillyTavern`，Luker 自己的 remote 叫 `luker`。`git push origin` 会误推到 ST 上游。规则建议统一为 `origin`=fork、`upstream`=上游。
- **`Dev\SillyTavern` 与 `Real\SillyTavern` 同 commit（`8172dcd0e`），`Dev\PureTavern` 与 `Real\PureTavern` 同 commit 且文件清单完全一致** → 这两组的 Dev/Real 差异**只在 `config.yaml`（端口）**，不在代码；测试环境差异仅靠端口区分，容易误连。
- **`Real\PureTavern` 无 `data/` 目录、与 Dev 版完全同构** → 疑似冗余副本，建议确认是否可归档（属「删除/迁移」范畴，需用户拍板，本调研未做任何改动）。
- **`Real\Luker` 的 `data\` 里没有 `_tauritavern\`，而 `Dev\Luker` 有** → 两实例数据布局已出现分叉。
- **CORS 现状**：`enableCorsProxy` 在**所有**实例中均为 `false`（Dev/Real Luker、Dev/Real ST、两处 default），无需改动；真正差异在 `cors.enabled` 的 `origin` —— Dev 全部为 `["null"]`+`[OPTIONS]`（即允许 `file://` 页面的预检），Real\Luker 为 `["*"]`+全方法。规则若要做浏览器自动化对接，应保持 Dev 的 `["null"]` 形态（对 `file://` 自动化脚本友好）而不动 Real。

---

## 附：调研方法与环境备注

- Shell：PowerShell 7（`Get-Process` / `Get-NetTCPConnection` / `Get-CimInstance` 均**有权限，成功返回**）；文件遍历用 Git Bash。
- 未获取项及原因：
  1. `Instance\` 与 `Myfork\` 全量 `package.json` 的 playwright/puppeteer 依赖扫描 → **超时失败**（`node_modules` 体积过大，>120s），已用「逐目录 `.bin` 检查 + 抽样 package.json」替代。
  2. TauriTavern 是否曾成功构建过 → 无 `target/` 目录可证，**无历史构建产物**。
  3. `Real\Luker` 的 `data\default-user\` 内部结构 → **刻意未读取**（数据红线，仅记录目录名）。
- 全程只读：未修改、未删除、未写入任何实例目录；未读取任何聊天内容。
