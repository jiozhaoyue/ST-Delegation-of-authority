# R4/R6 · 测试开发规则（定稿）+ 跨仓通则草案与 dry-run 计划

> 数据源：`research/06` §5（风险与结论）+ `research/13-next-session-auto-queue.md` Batch 2-B、红线段。
> 关联裁定：D6（维持 8001–8004 + 防误连标识）、N-1（已关闭：`Dev\Luker` 只读）、N-2（主代理单独执行）、N-4/N-5（并入 `02-ports-and-collisions.md`）。
> 本文件 §6 为 **R6 跨仓通则草案**（只给草案 + dry-run 计划，**不落盘到真源仓** `tavern-harness`）。

---

## 1. E2E / 自动化测试目标纪律（MUST）

| # | 规则 | 依据 |
|---|---|---|
| R4-1 | E2E / 自动化测试**只允许**对 `Instance\Dev\**` 运行（目标端口 ∈ {8001, 8003}，PureTavern 场景含 8899） | L0-1 / L1-MF-10 / `research/06` §5.2 |
| R4-2 | **禁止**把 `8002` / `8004`（或任何 `Instance\Real\**` 路径）作为自动化目标；哪怕"只读探测"也不行 | P-11（端口仅差 1，误连即污染 GB 级真实数据，不可逆） |
| R4-3 | 禁止读取任何实例的聊天内容；`data\` 目录除路径级判断外不得遍历内容 | `research/06` 附录（调研时即刻意未读） |
| R4-4 | 禁止跨实例拷贝 `data\`（四处 data 目录均含 `cookie-secret.txt` 会话密钥） | `research/06` §5.2 第 4 条 |
| R4-5 | `Instance\Dev\Luker` 除 `git pull` 外零操作（N-1 已关闭裁定，非"待修缺陷"） | `research/13` §一 N-1 行 |

## 2. 端口断言（MUST，防误连的机制化落实）

统一规则 L1-MF-6 要求"显式失败、不静默回退"。落成可执行约定：

1. **启动即断言**：E2E 脚本/框架在启动时校验目标地址，端口不在允许集 → **立即抛错退出（非 0 exit code）**，打印"疑似误连 Real 实例"。
2. **允许集只认端口白名单**：`{8001, 8003, 8899}`（+ 各项目自身 dev 端口，登记进 `02-ports-and-collisions.md` §2 C-4）。
3. **环境变量不给默认值**：`BASE_URL` 之类变量未设置时必须失败，**禁止** `?? 'http://127.0.0.1:8001'` 这类静默兜底——兜底值就是误连入口。
4. **禁止自动改写目标**：脚本不得因"端口被占用"而回退到其它端口（改端口 = 换实例 = 换数据区）。

参考实现（片段级，不构成新依赖）：

```ts
// e2e/guard.ts —— E2E 启动守卫（示例）
const ALLOWED_DEV_PORTS = new Set(['8001', '8003', '8899']);

export function assertDevTarget(rawUrl: string): URL {
  if (!rawUrl) throw new Error('BASE_URL 未设置：拒绝静默兜底（统一规则 L1-MF-6）');
  const u = new URL(rawUrl);
  if (!ALLOWED_DEV_PORTS.has(u.port)) {
    throw new Error(`拒绝启动：端口 ${u.port} 不在 Dev 白名单 {8001,8003,8899}，疑似误连 Real 实例`);
  }
  return u;
}
```

## 3. 防误连标识方案 `INSTANCE-ROLE.txt`（**只出方案，不落地**）

> 落地属实例写操作（触碰 L0-1），须用户逐条批准。本轮**零写入**（含该标识文件本身）。

**方案**：

| 位置 | 文件内容 | 语义 |
|---|---|---|
| `Instance\Dev\<实例>\INSTANCE-ROLE.txt` | `DEV` | 允许自动化 |
| `Instance\Real\<实例>\INSTANCE-ROLE.txt` | `REAL-READONLY` | 禁止自动化 |

**脚本侧约定**（落地后生效）：
1. E2E 启动时先读 `BASE_URL` 对应实例根目录的 `INSTANCE-ROLE.txt`，内容非 `DEV` → 显式失败。
2. 文件缺失视为**未知实例** → 同样失败（不因"读不到"而放行；未知 ≠ 安全）。
3. 该文件只增不改：任何工具不得改写他人实例的标识文件。

**实施前提**（缺一不可）：① 用户逐条批准写入实例目录；② 与 N-2 一样以"最小改动"方式执行；③ 写入后立即 `git status` / mtime 复核。

## 4. 产物留证路径（MUST）

| 产物 | 允许的落盘位置 | 禁止位置 |
|---|---|---|
| Playwright trace / 截图 / har | `<项目仓>\test-results\`（gitignore 管理）或 `.trellis\tasks\<task>\deliverables\`（脱敏摘要） | `Instance\**` |
| E2E 报告 / 结论摘要 | 任务目录 `deliverables\`（引用数据时给出处） | 真源仓 `tavern-harness`（除非脱敏并走 §6 流程） |
| 诊断会话的控制台/网络记录 | 任务目录（**先脱敏**：抹去 token、聊天内容、用户路径） | `Instance\**`、公开 fork 的 git |

## 5. 其余测试纪律（沿用既有规则，登记出处）

1. 本仓质量门命令固定：`npm test`（version:sync → vitest → cargo test）、`npm run typecheck`（L1-MF-7）。
2. 发版前测试全绿、零回退；涉及 installable 时跑 `npm run sync:installable && npm run check:installable`（L0-13 / L1-MF-8）。
3. TauriTavern 例外登记：唯一可构建/可跑测试的副本在 `Instance\Real\TauriTavern`（N-3），**在裁定补克隆或特批之前，不做任何 TT 构建与测试**。
4. 版本号不能用于区分 Dev/Real（完全一致），判别只认端口+路径+（落地后的）`INSTANCE-ROLE.txt`。
5. **实例目录只读，仅允许 `git pull`（含 `--ff-only`）**（2026-09-24 新增，源 N-1 关闭裁定）：`Instance/**` 下四个实例一律视为**只读**——禁止在实例目录内执行 `push` / `remote` 改名 / `reset` / `checkout` 等任何写操作。**不得再把“实例 `origin` 误指上游 → `push` 会误推上游”登记为待修缺陷**：实例侧从设计上只执行拉取，该风险已按用户裁定判为**伪风险**（N-1 已关闭）。本任务外若确需改动实例配置，须**逐条**获批（N-2 是当前唯一先例，且限单行）。

---

## 6. R6 · 跨仓通则草案（**不落盘真源仓**，仅草案 + dry-run 计划）

> 红线：本任务**不修改** `D:\Repo\Tavern-repo\tavern-harness` 内任何文件。以下为拟议变更，供后续派发执行。

### 6.1 拟入真源的候选条目（真源 `rules/`）

| # | 目标文件 | 拟新增/修订内容 | 级别 |
|---|---|---|---|
| G-1 | `rules/groups/myfork.md` | 新增「E2E 启动断言」：自动化目标端口必须显式断言 ∈ Dev 白名单，禁止静默回退与默认值兜底（L1-MF-6 的可执行化） | MUST |
| G-2 | `rules/groups/myfork.md` | 修订 L1-MF-10：补记 N-1 已关闭（`Dev\Luker` 只读、仅 `git pull`，非待修缺陷）；补记 N-2/N-9 状态 | MUST（事实更新） |
| G-3 | `rules/groups/myfork.md` | 新增「浏览器自动化分工」：回归=Playwright、诊断=chrome-devtools-mcp，均不新装、依赖只进项目 `devDependencies` | MUST |
| G-4 | `rules/L0-global.md` | 新增「端口申请段位」：实例段 8001–8004 独占；8000=出厂默认禁用；3000=系统保留；周边工具自 3010 起申请 | MUST |
| G-5 | `rules/pitfalls.md` | 新增 P-14（8000 六处默认值互抢案例）与 P-15（3000 三方撞车 + svchost 实占案例），按既有「案例/后果/防护」三段式撰写 | 坑与教训 |
| G-6 | `rules/pitfalls.md` | 新增 P-16（TauriTavern Dev 残缺/Real 完整倒挂 → N-3），警示"Dev/Real 目录名不可假设语义" | 坑与教训 |

> G-2 注意：`rules/` 属真源仓内容，写作时**脱敏**（不含本机安全细节；环境缺陷细节仍只留在 `docs/environment-defects.md`，不同步不公开）。

### 6.2 dry-run 计划（执行者照抄，本轮不执行）

```powershell
cd D:\Repo\Tavern-repo\tavern-harness
# 1) 修改 rules/ 真源后先跑沙箱回归
python scripts\test_sync_tavern_rules.py
# 2) 预览全部目标仓库的变更（不写盘）
python scripts\sync_tavern_rules.py --dry-run
# 3) 人工 review 预览 → 用户批准后落盘
python scripts\sync_tavern_rules.py --apply --allow-dirty
# 4) 校验零漂移
python scripts\sync_tavern_rules.py --verify
# 5) 真源仓提交并推送 origin（绝不推 upstream；L0-7 / L1-MF-1）
git add <rules 相关文件> && git commit && git push origin main
```

**执行前提**：① G-1…G-6 文案经用户过目；② 修改真源后 `test_sync_tavern_rules.py` 全绿；③ dry-run 预览无意外目标仓。**本任务不执行上述任何一步。**

---

## 7. 回源索引

| 本文结论 | 回源位置 |
|---|---|
| E2E 只允许 Dev、Real 只读 | `research/06` §5.2 第 1 条；`research/13` §三红线 1–3 |
| 端口白名单与断言要求 | `research/13` Batch 2-B；统一规则 L1-MF-6 |
| cookie-secret.txt 禁拷 | `research/06` §5.2 第 4 条 |
| Dev CORS 形态对 file:// 友好 | `research/06` §5.4 末条 |
| TT Dev 残缺/Real 完整 | `research/06` §1、§5.3 |
| 同步器命令序（test→dry-run→apply→verify→commit→push） | `research/12-backlog-and-handoff.md` §五 |
