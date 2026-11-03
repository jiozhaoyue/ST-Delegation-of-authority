# 执行计划 — 移除子代理模型门禁

> 复选框**随执行实时勾选**（L0-2）。验证命令与输出即证据。

## 阶段 0 · 准备

- [x] 0.1 现场复核：确认本仓无并行会话在改（`git status --porcelain` 仅含本任务改动）——复核通过
- [x] 0.2 复核模板路径：`C:/nvm4w/nodejs/node_modules/@mindfoldhq/trellis/dist/templates/`（Trellis 0.6.16）

## 阶段 1 · R1 本仓 8 处门禁（逐处块级 Edit）

- [x] 1.1 `.trellis/agents/check.md` 删 Model gate 段（diff 模板 = 0）
- [x] 1.2 `.trellis/agents/implement.md` 删 Model gate 段（diff 模板 = 0）
- [x] 1.3 `.trellis/workflow.md` 删门禁段（**保留** python 适配；非 python 差异行数 = 0）
- [x] 1.4 `.codex/agents/trellis-check.toml` 删 Model gate 段（diff 模板 = 0）
- [x] 1.5 `.codex/agents/trellis-implement.toml` 删 Model gate 段（diff 模板 = 0）
- [x] 1.6 `.codex/agents/trellis-research.toml` 删 Model gate 段（diff 模板 = 0）
- [x] 1.7 `AGENTS.md` 删「项目覆盖」区该节 → 空节标准形态（`--verify` 仍 14/14 零漂移）
- [x] 1.8 `ST-zip-converter/.trellis/spec/guides/index.md` 删门禁行 —— 已改但**被另一会话提交连带提交**（见 PRD 归属记录）

## 阶段 2 · 并发冲突判定（R2/R1.8 的前置）

- [x] 2.1 复核两仓并发状态：`ST-zip-converter` 处于另一会话功能分支 `fix/perf-hardening-transfer-memory`（已推送）；
      `ST-chatfilesys-rebuild` 在 `main` 但有会话活跃（`.trellis/.runtime/sessions` 秒级更新）
- [x] 2.2 裁定（用户 2026-09-25）：zip-converter **接受现状**（改动随其 PR 合并）；chatfilesys **现在做、立即提交**

## 阶段 3 · R2 旧版 codex 代理文件恢复默认（6 个文件）

- [x] 3.1 逐文件核对旧内容确无本地独有改动（`grep -c "glm-5.3-flash" == 0`，为旧版 Trellis 模板文本）
- [x] 3.2 以模板内容整体替换（L0-4 例外已在 PRD R2 声明）
- [x] 3.3 `diff 模板 文件` 全为 0：chatfilesys 3 个 = 0/0/0；zip-converter 3 个 = 0/0/0

## 阶段 4 · 验证（每项均须留命令 + 输出）

- [x] 4.1 6 个 Trellis 管理文件 `diff 模板 文件 == 0`（本仓 5 个 + workflow.md 见 4.2）
- [x] 4.2 `workflow.md` 剩余差异**仅** python 适配（非 python 差异行数 = 0；门禁命中 0、python3 残留 0）
- [x] 4.3 `python scripts/sync_tavern_rules.py --verify` → `14 个目标，14 个与真源一致，0 个需处理`
- [x] 4.4 全仓 `glm-5.3-flash` 零命中（受管文件口径）
- [x] 4.5 `trellis update --dry-run` 收尾复核：本仓 "Modified by you" **只剩 `.codex/config.toml`**
      （即「明确不做」里的 shell 环境策略项）；7 个门禁文件已全部从清单消失 —— 强验证通过（随后已还原 manifest 修剪）

## 阶段 5 · 收口

- [x] 5.1 提交推送各被改仓 `origin`（本仓 `fca5329`；chatfilesys 忽略面无需提交；zip-converter 未由本任务提交）
- [x] 5.2 更新 PRD 的 AC 勾选 + 记录归属与未达成项
- [x] 5.3 spec 更新：新增 `guides/trellis-managed-files.md`（Trellis 管理文件保持默认的约定）
- [ ] 5.4 journal + 归档（`/trellis:finish-work`）

## 回滚点

- 阶段 1 全部为块级 Edit → `git checkout -- <file>` 即回滚
- 阶段 3 为整体替换 → 同上；旧内容可在各仓 git 历史中取回
- 真源仓（`tavern-harness`）**本任务零改动** → 不存在跨仓回滚联动

## 风险与已知约束

| 风险 | 处置 |
| --- | --- |
| 并行会话正在改 `zip-converter` / `chatfilesys-rebuild` | 阶段 2 判定；必要时把 R1.8/R2 记为未达成项，不硬做 |
| `python3→python` 适配被误删 | 4.2 专项断言；PRD R1.3 明令保留 |
| `PureTavern/AGENTS.md` 被误纳入 | PRD「明确不做」已列明理由（会清掉规则块） |
