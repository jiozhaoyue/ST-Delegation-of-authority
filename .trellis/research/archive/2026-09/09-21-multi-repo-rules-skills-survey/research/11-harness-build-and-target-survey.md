# 真源仓建设与目标仓库实勘（C/D 阶段）

> 日期：2026-09-21 ｜ 执行：主代理（Claude Code）｜ 对应 implement.md 的 C-1…C-12、D-1…D-6

---

## 一、真源仓建设结果

**落点**：`D:\Repo\Tavern-repo\tavern-harness`（新建，`git init -b main`，首次提交 `d739541`）

```
tavern-harness/
├─ rules/
│  ├─ L0-global.md                # L0 全局规则 15 条（L0-1 … L0-15）
│  ├─ groups/my-repo.md           # L1：酒馆扩展/工具插件形态（L1-MR-1 … L1-MR-14）
│  ├─ groups/myfork.md            # L1：宿主 fork 与插件形态（L1-MF-1 … L1-MF-14）
│  ├─ groups/js-slash-runner.md   # L1：酒馆助手脚本/工作区形态（L1-JSR-1 … L1-JSR-20）
│  └─ pitfalls.md                 # 坑与教训 13 条（P-1 … P-13，每条带真实案例与后果）
├─ targets.json                   # 15 个仓库登记（分组 / 目标文件 / Git 状态 / 上游派生标记）
├─ scripts/sync_tavern_rules.py   # 同步器
├─ scripts/test_sync_tavern_rules.py  # 沙箱回归测试（24 项断言）
├─ scripts/tavern-init.mjs        # 薄封装
├─ docs/environment-defects.md    # ⚠️ 本机缺陷清单，**不同步不公开**
├─ README.md / CHANGELOG.md / .gitignore
```

块正文 = `L0-global.md` + 该仓所属仓群的 `groups/<群>.md` + `pitfalls.md`（同步时拼装）。
块大小：My-repo 组 489 行 / Myfork 组 503 行 / JSSR 组 541 行。

---

## 二、目标仓库实勘（实测，修正研究偏差）

| 仓群 | 仓库 | AGENTS.md | CLAUDE.md | GEMINI.md | Git | 上游 | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| My-repo | ST-BgLoader | ✓(13K) | — | — | ✓ | — | **含前作 UNIFIED-RULES 残留** |
| My-repo | ST-Switcher | ✓(1.1K) | — | — | **✗ 非 Git 仓** | — | 需 `--allow-non-git` |
| My-repo | ST-chatfilesys-rebuild | ✓(1.1K) | — | — | ✓ | — | — |
| My-repo | ST-git-improve | ✓(1.1K) | — | — | ✓ | — | — |
| My-repo | ST-shujuku-rebuild | ✓(14K) | — | — | ✓ | shuiyue-cmyk/… | **含前作残留** |
| My-repo | ST-zip-converter | ✓(20K) | ✓(5.4K) | — | ✓ | — | **含前作残留** |
| My-repo | ST-Assets-Manger | — | — | — | ✗ | — | 空目录，已禁用 |
| Myfork | PureTavern | ✓(23B) | — | — | ✓ | — | 单行"尽量少调用子agent" |
| Myfork | ST-Delegation-of-authority | ✓(1.1K) | ✓(10K) | — | ✓ | — | 本任务宿主仓；AGENTS.md 仅 TRELLIS 块 |
| Myfork | SillyTavern-Timelines | ✓(1.6K) | — | — | ✓ | SillyTavern/… | — |
| JSSR | ST-PanelReset | ✗ | ✗ | ✗ | ✓ | — | **无任何 agent 规则文件** |
| JSSR | ST-chatfile-improve | ✓ | ✓ | ✓ | ✓ | — | 8 行 `@.cursor/rules`，**真源存在→有效** |
| JSSR | ST-msg-btn-mgr | ✓ | ✓ | ✓ | ✓ | — | 8 行引用**全部悬空** |
| JSSR | tavern_helper_template | ✓ | ✓ | ✓ | ✓ | StageDog/… | 上游模板仓；引用悬空 |
| JSSR | tavern_helper_workspace | — | — | — | ✗ | — | 仅 `scripts/`，非项目本体 |

### 与前期研究的两处偏差（**以本次实测为准**）

| 项 | 研究所述 | 实测 | 处置 |
| --- | --- | --- | --- |
| 前作 `UNIFIED-RULES` 残留 | "6 个非空项目中的 5 个" | **实际 3 个**（ST-BgLoader / ST-shujuku-rebuild / ST-zip-converter） | E-7 清理范围缩小到 3 仓 |
| `ST-PanelReset` | "CLAUDE.md/AGENTS.md 的 8 行引用悬空" | 该仓**根本没有 agent 规则文件**（无 `.cursor`、无三件套） | 结论（agent 拿不到规则）成立，成因不同；已按实测处理 |

> `tavern_helper_workspace` 研究亦列为"引用悬空"，实测为"仅有 `scripts/` 且非 Git 仓"→ 非项目本体，本轮不同步。

---

## 三、检索先行（约束 7 / AC-7 要求）

| 通道 | 结果 |
| --- | --- |
| WebSearch | 「sync shared rules block into multiple git repositories markdown marker tools」→ **0 条有用结果**（国际搜索在本机环境不可靠，与全局规则 5.3 一致） |
| GitHub API | `rulesync` → `dyoshikawa/rulesync` **1456★**、`jpcaparas/rulesync` 13★；`ruler` → `intellectronica/ruler` **2933★**；`agents.md sync rules` → `PanisHandsome/ai-rules-sync` **119★**、`Jiangultimo/agents-md`、`danielcinome/rulix` 等 |

**结论**：现有工具全部是**单个仓库内、跨 agent 格式**的规则同步（AGENTS.md ↔ CLAUDE.md ↔ .cursor/rules ↔ GEMINI.md）。
**没有任何一个做"一份真源 → 幂等分发到 N 个仓库、且保留各仓自有内容"**——这正是本设计的核心需求。
因此自建同步器**不构成重复造轮子**；同时 `intellectronica/ruler` 的 marker 块（`<!-- ruler:start -->`）范式从侧面验证了 D2 的裁定方向。

---

## 四、同步器验证（沙箱，未触碰真实仓库）

`scripts/test_sync_tavern_rules.py` 在临时目录造 5 个假仓库（正常插入 / 过期块 / 无文件 / marker 残缺 / 前作残留），
**24 项断言全部通过**，其中包括：

| 类别 | 断言 |
| --- | --- |
| 插入位置 | 块位于 `<!-- TRELLIS:END -->` 之后；原自有内容在块之后 |
| 块外零改动 | 文件头部逐字一致；块外自有内容逐字保留 |
| 覆盖节 | 「项目覆盖」内容在重建后保留；标题唯一 |
| 幂等 | **第二次 `--apply` 全部跳过、零写入** |
| 安全 | marker 不成对 / 前作残留 → 文件不被改动；写前生成 `.bak` |
| 漂移检测 | `--verify` 报告零漂移；真源变更后可被检出为"更新" |

**过程中发现并修复了两个真实缺陷**（详见 implement.md Phase D 的"沙箱测试暴露并已修复的真实缺陷"）：
① 头部与正文间缺空行导致幂等性不成立；② 更新块时在 `END_MARK` 后多加一个换行，会逐次推移块后内容。

---

## 五、全量 dry-run 结果（未写盘）

```
新建=1 · 插入=17 · 前作残留拦截=3 · 合计 21 个目标（13 个启用仓库）
```

- **拦截的 3 个**：ST-BgLoader / ST-shujuku-rebuild / ST-zip-converter —— 含前作 `UNIFIED-RULES` 残留，
  同步器按设计**拒绝盲目追加**，须先执行 E-7 清理
- **新建 1 个**：ST-PanelReset/AGENTS.md（该仓原本没有任何 agent 规则文件）
- 其余 17 个为锚点插入（`ST-Delegation-of-authority` 本仓的 AGENTS.md 与 CLAUDE.md 亦在其中）

---

## 六、脱敏决策（重要）

规则块将写入**多个公开仓库**，其中 `tavern_helper_template` 还有上游（`StageDog/tavern_helper_template`）。
初稿曾把本机实例的安全配置细节写进 L1-Myfork 规则（`securityOverride: true`、`whitelistMode: false`、
`cors: ["*"]`、`0.0.0.0` 绑定、出厂明文密码）——**这等于向外公布本机安全姿态**。

**处置**：这些细节全部移入 `tavern-harness/docs/environment-defects.md`（私有仓、**不同步**）；
规则块中只保留"本机存在已登记缺陷 + 遵守 L1-MF-1 / L1-MF-10 纪律"这一层。
凡与实例数据规模相关的具体数字（GB 数、会话数）也一并泛化。

---

## 七、用户裁定与执行结果（2026-09-21）

| # | 事项 | 用户裁定 | 执行结果 |
| --- | --- | --- | --- |
| 1 | 真源远程仓 | **直接创建私有仓并推送，且把该纪律写入规则、化到全局** | ✅ `github.com/jiozhaoyue/tavern-harness`（核验 PRIVATE），4 次提交已推送；三处全局规则新增**第 8 节「真源仓与工具仓纪律」**；`rules/L0-global.md` 的 L0-7 同步加强 |
| 2 | 真实仓库写盘 | **先灰度本仓一个** | ✅ 先对 `ST-Delegation-of-authority` 灰度（更新路径/幂等/块外零改动/verify 四项全通过），随后获准**同步 12 个仓** |
| 3 | 前作残留清理 | **批准清理（先列范围）** | ✅ 范围已列出（3 仓各 284 行、逐字同构、均在文件末尾；4 条覆盖声明三仓相同且含过时/错误条目）→ 执行后 `git diff` 为 **284 deletions / 0 insertions** |
| 4 | 边界仓库 | 纳入 `ST-Switcher`、`ST-PanelReset`；并要求 **Switcher 建私有仓推送、统一走 git** | ✅ `ST-Switcher` 已 `git init` + 提交 1051 文件/2.3 MB + 推送私有远程 `jiozhaoyue/ST-Switcher`（核验 PRIVATE）；`ST-PanelReset` 已新建 `AGENTS.md` |
| 5 | 各仓 git 处理 | **只提交，不推送** | ✅ 10 个仓已提交；2 个仓的 `AGENTS.md` 被其 `.gitignore` 有意忽略，未强推 |

### 全量同步最终数据

| 指标 | 结果 |
| --- | --- |
| 目标文件 | 16 个（11 个仓）；JSSR 两仓的 6 个"文件"实为 2 个物理文件（符号链接） |
| 写入性质 | 纯新增，各仓目标文件 `git diff --numstat` 均为 **N 增 / 0 删** |
| 校验 | `--verify` **14/14 与真源一致、零漂移** |
| 幂等 | 连续 `--apply` 第二次**全部跳过、零写入** |
| 死链 | 0（块自包含，不引用任何外部路径） |

### 执行中发现并修复的真实缺陷：符号链接叠块

`JS-Slash-Runner` 仓群的 `AGENTS.md` / `GEMINI.md` **是指向 `CLAUDE.md` 的符号链接**。
同步器按文件名逐个写入 → **同一物理文件被写 3 次、叠出 3 个块**（6 个目标报"marker 不成对"）。

- 修复：`dedupe_symlinked_targets()` 按 `os.path.realpath` 去重、优先保留实体文件名
- 受损文件：2 个 `CLAUDE.md` 已 `git checkout` 精确还原后重新同步（确认二者此前均无未提交改动）
- 回归测试：新增 repoF 符号链接用例（断言只写一次、原有内容保留）

> **本仓群"范式乙（符号链接分发）"的坑，先写进研究、再被自己的代码踩中** —— 已成 `pitfalls.md` P-4 的实证条目，并随同步分发进各仓。

### 未完成 / 遗留

| 项 | 状态 |
| --- | --- |
| 各仓 push | ⏸ 用户裁定不推送——**规则块目前只在本地提交，尚未同步到云端** |
| `tavern_helper_template` | ⏸ 本轮排除（上游模板仓） |
| `ST-chatfilesys-rebuild` / `ST-git-improve` | ⚠️ 块仅本地生效（两仓 `.gitignore` 有意忽略 `AGENTS.md`） |
| F 阶段（Skill 体系）、G 阶段（环境规则）、H-3/H-4/H-5、N-1…N-9 | ⏳ 未开始 |
