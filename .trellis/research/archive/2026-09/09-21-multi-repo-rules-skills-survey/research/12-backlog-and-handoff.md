# 待办全集与交接文档

> 生成：2026-09-22 ｜ 对应任务 `09-21-multi-repo-rules-skills-survey`（父任务）
> 本文是**交接入口**：所有未完成事项、待裁定事项与开工方法都在这里。
> 配套：`prd.md`（需求与验收）、`design.md`（设计）、`implement.md`（执行计划与实时勾选）。

---

## 一、任务状态总览

| 阶段 | 状态 |
| --- | --- |
| A 需求与历史 | ✅ 完成 |
| B 15 仓规则提炼 | ✅ 完成（含 2 处研究偏差修正） |
| C 统一规则真源建立 | ✅ 完成（C-1…C-12；**C-2 远程仓已建并推送**） |
| D 同步器实现与灰度 | ✅ 完成（沙箱 24 项断言 + 本仓真实灰度） |
| E 全仓同步与残留清理 | ✅ 完成（16 个目标文件 / 11 仓 + 3 仓残留清理） |
| **F Skill 体系** | 🔄 **部分完成**：F-3/F-4/F-6/F-7 ✅（交付 2 skill）；F-1 部分完成；**F-2 / F-5 待做**（F-5 判定已定稿：拆分） |
| **G 环境与测试规则** | ✅ **完成**（2026-09-24 回填；D5/D6 已裁定，6 deliverable 齐） |
| **H 任务地图收尾** | ✅ H-1/H-2/H-3/H-4/H-5/H-5b 完成；H-6 待全部 Gate 通过 |
| **N 缺陷修复** | 🔄 N-1/N-2/N-7/N-9/N-10 ✅；**N-11/N-12 新登记**；N-3/N-4/N-5/N-6/N-8 待批准/待拍板 |

**真源仓**：`D:\Repo\Tavern-repo\tavern-harness` → 远程 `github.com/jiozhaoyue/tavern-harness`（**私有**），已推送。

---

## 二、已交付（可直接消费）

| 交付物 | 位置 |
| --- | --- |
| 统一开发规则真源 v1.1.0 | `tavern-harness/rules/`（L0 15 条 + L1 三组 14/14/20 + 坑与教训 13 条） |
| 同步器（幂等/无损/块外零改动） | `tavern-harness/scripts/sync_tavern_rules.py` |
| 沙箱回归测试（24 项断言） | `tavern-harness/scripts/test_sync_tavern_rules.py` |
| 前作残留清理工具 | `tavern-harness/scripts/remove_legacy_rules_block.py` |
| 新项目初始化薄封装 | `tavern-harness/scripts/tavern-init.mjs` |
| 本机环境缺陷清单（**私有，不同步**） | `tavern-harness/docs/environment-defects.md` |
| 研究产出 11 份 + 索引 | 本任务 `research/` |
| 规则块已落 11 仓 | 各仓 `AGENTS.md`（JSSR 两仓为 `CLAUDE.md`），10 仓已提交 |

---

## 三、待办全集（按优先级）

### 🔴 P0 — 随时可能造成实际损害

| # | 事项 | 为何优先 | 前置 |
| --- | --- | --- | --- |
| ~~**N-1**~~ | ✅ **已关闭（2026-09-22，用户裁定）**：`Instance/Dev/Luker` 为**只读实例**，除 `git pull` 外不触发任何操作，故「误推上游」属**伪风险**。已裁定**永不改动**该目录 git 配置，不再作为待修缺陷登记；纪律并入「实例目录只读，仅允许 `git pull`」 | — | 无 |
| **N-2** | `Instance/Real/Luker` 安全开关全面放宽（`whitelistMode:false`、`securityOverride:true`、`cors:["*"]`+全方法、`listen:true` 且 `0.0.0.0:8004`）+ basicAuth 仍是出厂明文 `password` | 对内网全开放 + 弱口令 | 改 Real 配置与只读红线冲突 → **需用户逐条批准** |
| **C-09** | 生态与 PR 策略（用户四问 + 可执行拆分清单） | 决定后续所有业务线的走法 | 已建子任务 `09-22-authority-ecosystem-pr-strategy`；`N-9` 是其前置 |

### 🟠 P1 — 主要交付项

| # | 事项 | 子任务 | 前置 |
| --- | --- | --- | --- |
| **C-04** | Luker 开发文档 skill 化 → `tavern-luker-plugin-dev` | `09-22-luker-dev-skill` | 素材已齐（`research/05`） |
| **C-05** | 仓库经验 skill 化 → `tavern-dev-workflow` | `09-22-tavern-workflow-skill` | 素材已齐（`research/01-03` + `pitfalls.md`） |
| **C-06** | 统一开发/测试环境规则定稿 | `09-22-tavern-dev-env-rules` | **卡 D5 / D6 裁定** |
| **C-07** | 全景地图与意图确认 | `09-22-tavern-repo-atlas` | 素材已齐（`research/00/01-04`） |

### 🟡 P2 — 环境与仓库缺陷

| # | 事项 | 处置建议 |
| --- | --- | --- |
| **N-3** | `Instance/Dev/TauriTavern` 缺 `src-tauri/`，**无法构建** → 与"E2E 只用 Dev 实例"红线直接冲突 | 补克隆 / 或特批只读使用 Real（需批准） |
| **N-4** | 端口 `3000` 三方撞车（Tavern-Viewer + TavernHeadless 均默认 3000，且被系统 `svchost` 实占） | 并入 C-06，建议 3000 划归系统保留、两项目改 3010/3020 |
| **N-5** | `8000` 默认值重灾区（6 处：Luker 两份 compose、ST/Luker 两份 `default/config.yaml`、PT remote-server、TT default） | 并入 C-06，建议标记为「出厂默认、禁止直接使用」 |
| **N-6** | `Instance/Real/PureTavern` 疑似冗余（与 Dev 版 diff 为空、均无 `data/`） | **属删除范畴，需用户拍板** |
| **N-7** | 前作腐烂残留块 | ✅ **已完成**（3 仓各删 284 行） |
| **N-8** | JSSR 仓群规则引用悬空（`ST-msg-btn-mgr`、`tavern_helper_template` 的 `@.cursor/rules/*.mdc` 指向不存在文件） | 独立小任务；注意 `tavern_helper_template` 是上游模板仓 |
| ~~**N-9**~~ | ✅ **已完成（2026-09-24 回源核实）**：`upstream = https://github.com/Youzini-afk/ST-Delegation-of-authority.git`；`git fetch upstream --dry-run` 通过（exit 0，已见 `main`/`dev` 等分支） | — | 无 |

---

## 四、待用户裁定（阻塞项）

| # | 事项 | 选项 | 影响 |
| --- | --- | --- | --- |
| **D5** | 浏览器自动化选型 | (a) Playwright 1.62.1（脚本化 E2E）(b) `chrome-devtools-mcp`（交互式诊断）(c) **两者并用**（设计推荐） | 阻塞 C-06 与 `tavern-browser-automation` skill |
| **D6** | 端口分配 | (a) 维持 8001–8004 + 做防误连标识（**设计推荐**，不动 Real）(b) 分族改造（需改 Real 配置，与只读红线冲突） | 阻塞 C-06 |
| **推送** | 各仓规则块是否推送到云端 | (a) 现在推送（遵守 L0-7）(b) 保持仅本地提交（**当前状态**） | 不推送则规则只在本地，换机/协作时看不到 |
| **bootstrap 冲突** | `00-bootstrap-guidelines`（Trellis 自带任务，`in_progress`）职责是填充 `.trellis/spec/`，与本任务 R1 规则提炼**高度重叠** | (a) 前置并共享结论 (b) 各自独立 (c) 归档承认被吸收 | 阻塞 H-4（spec 更新） |
| **全局规则缺口** | `~/.claude/CLAUDE.md` 有 §4.5（计划先行）与 §4.6（适配器模式），`.codex`/`.agents` 两处**缺失** | 补齐 / 保持现状 | 与三文件自身声明的"三处同步"不符 |

---

## 五、开工方法（每个待办的入口）

```
# 子任务已建好，直接进入规划/执行
python ./.trellis/scripts/task.py list --mine
python ./.trellis/scripts/task.py start .trellis/tasks/09-22-<slug>     # 需其 PRD 已回填（已回填）

# 规则相关：改真源 → 测试 → dry-run → apply → 逐仓提交
cd D:\Repo\Tavern-repo\tavern-harness
python scripts/test_sync_tavern_rules.py                    # 沙箱回归（改动真源后必跑）
python scripts/sync_tavern_rules.py --dry-run               # 预览
python scripts/sync_tavern_rules.py --apply --allow-dirty   # 落盘
python scripts/sync_tavern_rules.py --verify                # 校验零漂移
python scripts/remove_legacy_rules_block.py                 # 清理前作残留（默认 dry-run）
git add -A && git commit && git push origin main            # 真源仓纪律（全局规则第 8 节）

# 实例相关（N-2…N-6）：`Instance/**` 只读，任何改动前先列范围 + 获用户批准
# N-1 已关闭：`Instance/Dev/Luker` 为只读实例，仅允许 `git pull`，永不改动其 git 配置
```

---

## 六、红线与纪律（接手者必读）

1. **`Instance/**` 全程只读**——真实聊天数据（GB 级）不可再生。E2E 只允许对 `Instance/Dev/**`。
2. **端口 8001–8004 仅差 1，且 Dev/Real 宿主版本完全一致** → 最大风险是**误连 Real**，不是冲突。
3. **跨宿主插件禁用 Host Bridge**（统一规则 L0-12）——Host Bridge 按宿主版本门禁且补丁面分叉，
   在 Luker 上被拒；但 Authority 的能力内核与宿主解耦，禁用不损失核心能力。
4. **子代理一律用最低档小模型**（`haiku` 档），禁旗舰模型、禁 Kimi K3；并发 ≤3（免费端点易 502）。
5. **改各仓规则必须改真源再同步**，不要直接改各仓规则块（会被下次同步覆盖）。
6. 真源仓 `docs/environment-defects.md` **不同步、不公开**（含本机安全细节）；规则块已脱敏。
7. 公开仓库污染风险：`tavern_helper_template` 有上游 `StageDog/tavern_helper_template`，
   向它写入会与上游产生差异——本轮已按裁定排除。
