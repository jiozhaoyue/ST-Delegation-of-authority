# 任务 D 会话详录：移除子代理模型门禁（2026-09-25）

## 一、任务由来

用户裁定「删除这些自写的子代理，所有仓库也删，只留默认 trellis 的」，四项细化：
①门禁全删 8 项 ②两仓旧版 `.codex/agents/*.toml` 也恢复默认 ③保留 `workflow.md` 的 `python3→python` 适配
④新建子任务 D 承载。

## 二、取证（执行前的完整现场）

- **门禁只落在两个仓**：全仓 `grep -rl "glm-5.3-flash"`（排除 `node_modules`、`.history/`）命中
  `ST-Delegation-of-authority`（6 个 Trellis 管理文件 + `AGENTS.md` 项目覆盖区整节）与
  `ST-zip-converter`（`.trellis/spec/guides/index.md` 1 行）。
- **交叉验证**：`trellis update --dry-run` 的官方 "Modified by you" 清单给出本仓 7 个文件；
  另标记 `ST-Codex-theme/.codex/config.toml`、`ST-chatfilesys-rebuild/.github/copilot-instructions.md`、
  `PureTavern/AGENTS.md`——三者**与子代理无关**，列入「明确不做」（尤 `PureTavern/AGENTS.md` 是规则块写入目标，回默认会清掉规则块）。
- **manifest 语义**：`.trellis/.template-hashes.json` 记录**模板内容**的 sha256
  （本仓 `.trellis/agents/check.md` 条目 == 0.6.16 模板哈希，而文件当时是门禁版）→ 恢复为模板内容后
  Trellis 即判为 unchanged，**无需手改 manifest**。
- **动因**：`workflow.md:236` 门禁段被 SessionStart 注入，要求子代理只能用 `glm-5.3-flash`，
  而本平台可用模型列表不含该名 → **子代理派发被永久阻塞**。

## 三、执行与验证

- **本仓 7 处**（块级 Edit）：`.trellis/agents/{check,implement}.md`、`.codex/agents/trellis-{check,implement,research}.toml`
  → 与 0.6.16 模板 **diff = 0 且逐字节一致**；`.trellis/workflow.md` → 门禁命中 0、`python3` 残留 0、
  适配行 28 处、**非 python 差异行数 = 0**；`AGENTS.md` 项目覆盖区 → 标准空节形态。
- **规则块不受影响**：`sync_tavern_rules.py --verify` → `14 个目标，14 个与真源一致，0 个需处理`。
- **强验证**：收尾 `trellis update --dry-run` 的 "Modified by you" **只剩 `.codex/config.toml`**，
  7 个门禁文件全部从清单消失。
- **R2（6 个旧版 codex 代理文件）**：`ST-chatfilesys-rebuild` 3 个 diff = 0/0/0，该仓 `.gitignore:9`
  整体忽略 `.codex/` → **只本地生效、无需提交**；`ST-zip-converter` 3 个 diff = 0/0/0。
- **全仓复查**：受管文件口径 `glm-5.3-flash` **零命中**。

## 四、事故与处置：改动被并行会话的提交连带提交

- 时间戳实测：本任务写入 `ST-zip-converter` 4 个文件 = `17:53:13`；另一会话提交
  `4bcf119 docs(spec): 拆分超限 spec 文件 + T4 验收回填 + 修复 T3 遗留的列表割裂` = `17:53:42`（**29 秒后**），
  其 stat 含该 4 个文件（`.codex/agents/*.toml` 156/132/178 行 + spec 2 行）。
- 该仓当时在**另一会话的功能分支** `fix/perf-hardening-transfer-memory`（已推送 `f12eaa2`）。
- 发现后立即 `git checkout --` 撤回，但为时已晚（patch 生成为 0 行即证）。
- **用户裁定：接受现状**——随其 PR 合并进 `main`，**不改写他人分支历史**。
- **教训（已列候选进真源规则）**：同仓并发时，未提交的外部改动会被另一会话的 commit 连带提交；
  窗口实测可短至 29 秒。防护方向：跨仓写入"写盘与提交同批完成"，或并发会话开工前认领仓库。

## 五、spec 更新（Phase 3.3，L0-17）

新增 `.trellis/spec/guides/trellis-managed-files.md`（自包含、不引用任务目录）：
两条实测理由（workflow.md 被每轮注入 → 强约束被放大到所有会话；改动会被永久标记 Modified by you）、
「定制该放哪」落点表（规则真源 / 项目覆盖区 / spec / 原生模板通道 / 用户级配置）、
自检命令与其副作用、本仓现状核对表与复验命令；`guides/index.md` 增「Project Conventions」小节挂该页。

## 六、提交与推送

| 提交 | 仓 | 内容 |
| --- | --- | --- |
| `fca5329` | `ST-Delegation-of-authority` | 移除 7 处门禁（6 个 Trellis 管理文件 + `AGENTS.md` 项目覆盖区） |
| `034b962` | 同上 | spec 规范页 + 索引加行 |
| `4bcf119` | `ST-zip-converter`（**另一会话的提交**） | 连带含 zip 的 4 个文件改动 |

推送前 `git remote -v` 审计：本仓 `origin` = `jiozhaoyue/ST-Delegation-of-authority`；零 `upstream` 推送；
未触碰 `Instance/**`。

## 七、遗留（待你裁定，已写入 PRD）

1. 规则块 L0-8 仍写「项目约定 `DeepSeek-V4-Flash[free]`」——删门禁不等于删该条；字面上与「全部默认」有张力，
   改真源须版本提升 + 15 仓重同步。
2. `ST-zip-converter` spec 的整节 `## Sub-Agent Dispatch Rule (CRITICAL)` 去留（本任务只去掉写死的模型名）。
3. 多会话并发纪律是否立条（见第四节教训）。
