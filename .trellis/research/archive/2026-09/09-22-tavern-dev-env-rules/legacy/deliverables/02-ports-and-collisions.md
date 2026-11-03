# R2/R3 · 端口分配方案与冲突点清单（定稿，含 diff 预览、不实施）

> 数据源：`research/06-dev-env-instances-ports.md` §2（端口与配置对照）、§3（实际监听）、§5.1（冲突点）。
> **D6 已裁定（2026-09-22）**：维持 `8001–8004`，加防误连标识；**不改端口**（改端口要动 Real 配置，与只读红线冲突；真实风险是误连不是冲突）。
> 本文所有"改动"均为**预览文本**，未对任何文件实施（`Instance/**` 与实例配置全程只读）。

---

## 1. 端口分配基线（D6 裁定，固化）

| 端口 | 归属 | 角色 | 可否作为自动化目标 |
|---|---|---|---|
| **8001** | `Instance\Dev\SillyTavern` | 开发实例 | ✅ E2E 首选 |
| **8002** | `Instance\Real\SillyTavern` | 真实数据（只读） | ❌ 禁止 |
| **8003** | `Instance\Dev\Luker` | 开发实例 | ✅ 允许 |
| **8004** | `Instance\Real\Luker` | 真实数据（只读） | ❌ 禁止 |
| **8000** | **出厂默认值，无归属** | — | ❌ 标记"禁止直接使用"（见 §3） |
| **3000** | 无归属（两项目默认撞车 + 系统实占） | — | ❌ 划归系统保留（见 §2） |

**维持现状的理由**（裁定依据，写进规则防翻案）：
1. 四段区间**实测无冲突**（research/06 §2 关键结论 1）。
2. 改端口必须动 `Instance\Real\**` 配置 → 触碰 L0-1 只读红线。
3. Dev/Real 版本完全一致，端口是**唯一**可编程判别特征；若改成分族可辨识方案，反而引入"两套端口映射"的新误连面。
4. 防误连的成本应花在**断言与标识**上（见 `04-test-dev-rules.md` §2/§3），不是花在改配置上。

---

## 2. 冲突点清单（按严重度排序，回源 research/06 §5.1）

### C-1 · 3000 三方撞车（N-4，并入本任务处置）

| 撞车方 | 证据 | 后果 |
|---|---|---|
| `Dev\Tavern-Viewer\docker-compose.yml`（`"3000:3000"`、`PORT=3000`） | research/06 §2 表 | 按默认启动必然失败 |
| `Dev\TavernHeadless\.env`（`PORT=3000`） | research/06 §2 表 | 与上一条互抢 |
| 系统 `svchost.exe`（PID 5908）**已实占 3000** | research/06 §3 表 | 两个项目谁先启动谁失败 |

**处置建议（N-4，仅建议、需各仓 owner 批准后另行实施）**：
- `3000` 划归**系统保留**，任何酒馆项目不再使用。
- `Tavern-Viewer` → **3010**；`TavernHeadless` → **3020**（间隔 10，为后续同类工具留号）。
- 同步登记进统一规则：新酒馆周边工具的端口申请从 **3010 起**、与实例段（8001–8004）、出厂默认段（8000）物理隔开。

### C-2 · 8000 出厂默认值六处（N-5，并入本任务处置）

| # | 位置 | 证据（research/06） |
|---|---|---|
| 1 | `Dev\Luker\docker-compose.yml`（`127.0.0.1:8000:8000`） | §2 表 |
| 2 | `Real\Luker\docker\docker-compose.yml`（`luker` 容器名，同占 8000） | §2 表 |
| 3 | ST/Luker 两份 `default\config.yaml`（出厂默认 8000） | §2 表 |
| 4 | `PureTavern` remote-server：`app.mjs` `PURE_TAVERN_PROXY_PORT ?? '8000'` | §2 表 |
| 5 | `Real\TauriTavern\default\config.yaml`（8000 默认，桌面应用不监听） | §2 表 |

（上表第 3 项含两处，合计六处，与 N-5 "六处重灾区" 对应。）

**处置建议（N-5）**：
- `8000` 在统一规则中标记为「**出厂默认、禁止直接使用**」：任何脚本/CI/服务启动**不得绑定或请求 8000**，需要 ST 兼容默认值的场景必须显式覆盖环境变量/配置。
- 不修改任何出厂文件（`default\config.yaml` 属上游分发物，改了会在下次同步上游时丢失——L1-MF-3 同理）。

### C-3 · socks5 代理出口 10808 共享

`Real\Luker` 的 `requestProxy.url = socks5://127.0.0.1:10808` **已启用**；`Dev\Luker` 配了同一地址但 `enabled: false`（research/06 §2 表 + §5.1 第 4 条）。
→ 规则：多实例同开时，**最多允许一个实例启用该代理出口**，避免双实例共用一条出口造成流控混淆与日志污染。

### C-4 · 无冲突独占端口（登记，避免新任务误占）

`8899`（PureTavern web dev，`strictPort: true`）、`4173`（Vite preview）、`8233`（nocturne 后端内部）、`6080`（noVNC）、`15721`（Claude 本地代理，全局规则 §5.3）。
→ 任何新服务选端口前先对照本表。

---

## 3. R3 · 端口改动 diff 预览（**不实施**）

> 以下 diff 仅为方案预览。目标文件均在 `Instance\Dev\**` 下，属只读红线范围；实施需用户逐条批准后另行派发任务。**本轮未执行任何写入。**

### 3.1 `Dev\Tavern-Viewer\docker-compose.yml`（3000 → 3010）

```diff
--- a/docker-compose.yml（Dev\Tavern-Viewer）
+++ b/docker-compose.yml（Dev\Tavern-Viewer）
@@
-      - "3000:3000"
+      - "3010:3010"
 environment:
-      - PORT=3000
+      - PORT=3010
       - DATA_DIR=/data
       - USER_DIR=default-user
```

> 具体行号以实施时现场读取为准（本任务不读取/不改写该文件全文，仅按 research/06 §2 记录的关键键名出预览）。

### 3.2 `Dev\TavernHeadless\.env`（PORT 3000 → 3020）

```diff
--- a/.env（Dev\TavernHeadless）
+++ b/.env（Dev\TavernHeadless）
@@
-PORT=3000
+PORT=3020
```

### 3.3 `PureTavern` remote-server（不改源码，运行时显式覆盖）

```diff
# 不改 apps/remote-server/app.mjs 的出厂默认值（?? '8000' 保留），
# 启动命令显式注入（示例，实际值待用户批准）：
- pnpm --filter remote-server start
+ PURE_TAVERN_PROXY_PORT=3030 pnpm --filter remote-server start
```

> 远程代理端口建议 **3030**（与 3010/3020 同段）。若不启动 remote-server 则无需任何动作。

### 3.4 明确不做的事

- ❌ 不改 `Instance\Real\**` 任何配置（含 8004 端口）——只读红线。
- ❌ 不改任何 `default\config.yaml`（上游分发物，禁止直接编辑上游快照，L1-MF-3 同理）。
- ❌ 不改 `Dev\Luker` 任何文件（N-1 只读裁定）。
- ❌ 不在本任务内执行 3.1–3.3 的任何一步。

---

## 4. N-1 / N-2 / N-9 状态登记（按裁定口径书写）

| 项 | 状态 | 口径 |
|---|---|---|
| **N-1**（`Dev\Luker` origin 误指上游） | **已关闭**（用户 2026-09-22 裁定） | 该实例为只读、仅 `git pull`，永不改动 git 配置，不再作为缺陷登记 |
| **N-2**（Real/Luker 关 `enableServerPluginsAutoUpdate`） | **已获用户单独批准**，由主代理执行 | 本任务零接触，不对 `Instance\Real\**` 做任何读写 |
| **N-9**（Authority fork 补 upstream remote） | **已完成** | 本仓 `upstream` 已存在（`https://github.com/Youzini-afk/ST-Delegation-of-authority.git`） |

---

## 5. 回源索引

| 本文结论 | 回源位置 |
|---|---|
| 8001–8004 分配与无冲突 | `research/06` §2 关键结论 1 |
| 3000 三方撞车 + svchost 实占 | `research/06` §2 表、§3 表、§5.1 第 1 条 |
| 8000 六处默认值 | `research/06` §2 表、§5.1 第 2 条 |
| 10808 代理共享 | `research/06` §2 表、§5.1 第 4 条 |
| 8899/4173/8233 独占 | `research/06` §2 表、§2 关键结论 4 |
