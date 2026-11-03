# R1 · 本机酒馆实例对照表（定稿）

> 数据源：父任务 [`research/06-dev-env-instances-ports.md`](../../../09-21-multi-repo-rules-skills-survey/research/06-dev-env-instances-ports.md)（2026-09-21 实测，全程只读）。
> 本文所有数字均可回源到该文件的 §1（实例清单）、§2（端口与配置对照）、§3（实际监听）、§5（风险与结论）。
> 状态标识：🟡 = 测试数据区（Dev）；🔴 = 真实数据区（Real，**只读红线**，见统一规则 L0-1）。

---

## 1. 实例矩阵（主表）

| # | 路径 | 项目 / 版本 | 类型 | 端口 | 数据目录 | 编译要求 | 数据敏感度 |
|---|---|---|---|---|---|---|---|
| 1 | `Instance\Dev\SillyTavern` | SillyTavern 1.18.0（commit `8172dcd0e`，581.6 MB） | 源码仓 clone（origin=`SillyTavern/SillyTavern`） | **8001** | `./data` | 无需编译（Node 直跑） | 🟡 |
| 2 | `Instance\Real\SillyTavern` | SillyTavern 1.18.0（同 commit `8172dcd0e`，582.5 MB） | 源码仓 clone（同上游） | **8002** | `./data` | 无需编译 | 🔴 只读 |
| 3 | `Instance\Dev\Luker` | Luker 2.7.0（ST fork，commit `8cd177ed2`，3034.4 MB，分支 `luker`） | 源码仓 clone | **8003** | `./data` | 无需编译（Node 直跑） | 🟡（**只读纪律**：除 `git pull` 外零操作，N-1 已关闭裁定） |
| 4 | `Instance\Real\Luker` | Luker 2.7.0（commit `239b329ea`，4294.5 MB，分支 `release`） | 源码仓 clone（origin=`funnycups/Luker`） | **8004** | `./data` | 无需编译 | 🔴 只读（调研时正在运行，PID 50076 监听 8004） |
| 5 | `Instance\Dev\PureTavern` | PureTavern 0.1.12（commit `9a1e854`，409.1 MB） | 源码仓 clone（pnpm monorepo，origin=`Lianues/PureTavern`） | **8899**（dev）/ 4173（preview） | **无磁盘 dataRoot**（数据在浏览器 IndexedDB/OPFS） | 需 pnpm 构建（Vite，`strictPort: true`） | 🟡 |
| 6 | `Instance\Real\PureTavern` | PureTavern 0.1.12（同 commit、同体积 409.1 MB） | 源码仓 clone，**与 Dev 版 diff 为空** | 8899（同构） | 无磁盘 dataRoot | 同上 | 🔴 只读（**疑似冗余副本**，处置 = N-6，需用户拍板） |
| 7 | `Instance\Dev\TauriTavern` | TauriTavern 2.2.0（commit `3a8c5401`，104.2 MB） | 源码仓 clone（**残缺**：缺 `src-tauri/`、`tests/`、`node_modules/`） | 8000（出厂默认，**未生效**，桌面应用不监听固定端口） | 运行时数据应在 `src-tauri/data`（当前不存在） | **无法构建**（缺 Rust 侧工程） | 🟡（仅前端代码快照） |
| 8 | `Instance\Real\TauriTavern` | TauriTavern 2.2.0（同 commit，266.7 MB） | 源码仓 clone（**完整**：含 `src-tauri/` 14-crate workspace + `tests/` + `node_modules/`） | 8000（默认，桌面应用不监听固定端口） | `src-tauri/data`（`.taurignore` 所示，当前不存在） | **必须编译**：`tauri:dev` / `tauri:build` → `node scripts/tauri-app.mjs`，依赖 Rust 工具链 | 🔴 只读（**唯一可构建/可跑测试副本**，构建属写操作，需用户单独特批，见 N-3） |
| 9 | `Instance\Dev\Tavern-Viewer` | Tavern-Viewer（commit `01f18b0`，0.4 MB） | 源码仓 clone（Node + Vite + Electron，origin=`Staruin/Tavern-Viewer`） | 3000（compose，**见冲突点 C-1**） | 卷挂载外部 ST data（只读挂载） | Node 构建 | 🟡 |
| 10 | `Instance\Dev\TavernHeadless` | TavernHeadless（commit `20e71d2`，391.9 MB） | 源码仓 clone（pnpm monorepo，origin=`HerSophia/TavernHeadless`） | 3000（`.env`，**见冲突点 C-1**） | — | pnpm 构建 | 🟡 |
| 11 | `Instance\Dev\nocturne_memory` | nocturne_memory（commit `beee74a`，6.8 MB） | 源码仓 clone（Python 后端 + 前端，origin=`Dataojitori/nocturne_memory`） | 80（可调）/ 8233（后端内部） | `snapshots_data`、`backups_data` 卷 + postgres 容器 | Docker Compose | 🟡 |
| 12 | `Myfork\PureTavern` | PureTavern 0.1.12（个人 fork `jiozhaoyue/PureTavern`，363.5 MB） | **代码仓**（非实例），带 `.trellis` / `.claude` 等 agent 目录 | — | — | 同 #5 | 非数据区 |

> 说明：`Instance\Dev\readme.md` 与 `Instance\Real\readme.md` 自述"均为存有真实数据的实例"（原文见 research/06 §1 补注），因此 🟡 与 🔴 的分界以**目录所在区**（Dev / Real）为准，而非内容判断。

---

## 2. 关键事实注记（写规则前必须知道）

### 2.1 版本号不能用于区分 Dev / Real（🔴 最大误连根源）

`research/06` §2 关键结论：**Dev 与 Real 的各宿主版本完全一致**（Luker 同为 2.7.0、ST 同为 1.18.0、PT 同为 0.1.12、TT 同为 2.2.0），且 ST 两组同 commit（`8172dcd0e`）、PT 两组同 commit 且文件清单 diff 为空。**两组 Dev/Real 的差异只在 `config.yaml`（端口）**。
→ 推论：区分实例**只能靠端口 + 路径**，任何"看版本号/看 UI"的区分手段都不可靠（统一规则 L1-MF-10 固化此条）。

### 2.2 端口仅差 1：`8001 / 8002 / 8003 / 8004`

顺序分配、当前实测无冲突（research/06 §2「关键结论」第 1 条）。**真实风险是误连 Real，不是端口冲突**（D6 裁定依据）。

### 2.3 Real/Luker 的安全开关处于放宽状态（只读红线的原因之一）

对照 research/06 §5.2 第 2 条：

| 配置项 | Dev\Luker | Real\Luker |
|---|---|---|
| `whitelistMode` | `true` | **`false`** |
| `securityOverride` | `false` | **`true`** |
| `cors.origin` | `["null"]` | **`["*"]`**（+全方法、`allowedHeaders:["*"]`、`maxAge:86400`） |
| `listen` | `true`（白名单兜底） | `true` 且 `0.0.0.0` → **对内网全部可达** |

误连 Real 不只是数据污染，还会把自动化操作暴露给内网。

### 2.4 `cookie-secret.txt` 存在于所有 data 目录

research/06 §5.2 第 4 条：Dev/Real 的 Luker 与 ST 四处 data 目录均含 `cookie-secret.txt`（会话密钥）。
→ **禁止任何"同步/复制 data"操作**，禁止把实例 data 目录纳入任何备份、打包、git 提交。

### 2.5 `Dev\Luker` 的 git remote 异常属已关闭事项（N-1）

`Dev\Luker` 的 `origin` 指向上游 `SillyTavern/SillyTavern`（Luker 自己的 remote 叫 `luker`，research/06 §1）。用户 2026-09-22 裁定：**该实例为只读，除 `git pull` 外不触发任何操作，永不改动 git 配置，不再作为缺陷登记**（N-1 已关闭）。故"误推上游"为伪风险，无需修复。

### 2.6 TauriTavern 的 Dev/Real 倒挂（N-3）

可构建副本是 `Instance\Real\TauriTavern`（Dev 侧缺 `src-tauri/` 无法构建，research/06 §5.3）。这与"E2E/构建只允许 Dev"的红线直接冲突，属 N-3 待办：**补克隆 Dev 侧**或**特批只读使用 Real 侧构建**，二者均需用户拍板，本文不裁定。

### 2.7 数据布局已分叉

`Dev\Luker\data\` 存在 `_tauritavern\`（extension-sources）子目录而 `Real\Luker\data\` 没有（research/06 §5.2 第 6 条）——存在跨项目数据混放；两实例数据布局不可假设同构。

---

## 3. 敏感度与可操作性速查

| 实例 | E2E 可作为目标？ | 允许的写操作 |
|---|---|---|
| Dev/SillyTavern（8001） | ✅ 首选 | 无（数据只读；扩展部署走酒馆原生机制） |
| Dev/Luker（8003） | ✅ 允许 | **仅 `git pull`**（N-1 裁定） |
| Real/SillyTavern（8002） | ❌ 禁止 | 无（绝对只读） |
| Real/Luker（8004） | ❌ 禁止 | 无（N-2 单项已由主代理单独执行，不在本任务授权内） |
| Dev/PureTavern（8899） | ✅ 允许（注意数据在浏览器侧，自动化 profile 需隔离） | 无 |
| Real/TauriTavern | ❌ 禁止作为 E2E 目标 | 构建类操作需用户特批（N-3） |

---

## 4. 回源索引

| 本文结论 | 回源位置 |
|---|---|
| 实例路径/体积/commit/origin | `research/06` §1 表 |
| 端口 8001–8004 与各 config 关键项 | `research/06` §2 表 |
| 8004 正在运行（PID 50076） | `research/06` §3 表 |
| Dev/Real 版本一致、PT 同构 | `research/06` §1「三处 PureTavern 的区分」+ §2 关键结论 |
| Real/Luker 安全开关差异 | `research/06` §5.2 第 2 条 |
| cookie-secret.txt | `research/06` §5.2 第 4 条 |
| TauriTavern Dev 残缺 / Real 完整 | `research/06` §1 + §5.3 |
| `Dev\Luker` data 分叉 | `research/06` §5.2 第 6 条 |
