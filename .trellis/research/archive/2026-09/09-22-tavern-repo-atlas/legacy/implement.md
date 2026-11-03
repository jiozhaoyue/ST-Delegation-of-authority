# Implement：全景地图与意图确认（09-22-tavern-repo-atlas）

> 父任务：`09-21-multi-repo-rules-skills-survey`（C-07 / R3）｜性质：**纯调查与陈述，禁改业务代码**
> 执行：trellis-research 子代理 ｜ 日期：2026-09-24
> 约束：只写本任务目录（`research/`、`prd.md`、`implement.md`）；不碰 `Instance/**`、`tavern-harness`、父任务文件；不做任何 git 写操作。

## 步骤清单

- [x] S1 读本任务 `prd.md`（R1–R5 / AC-1–AC-4）与父任务素材索引
- [x] S2 读需求真源 `research/00-requirements-inventory.md`（B0 意图原话 + B1–B12 全部业务需求）
- [x] S3 读 `research/07-authority-host-compat-verification.md`（四宿主可用性证据链，全读）
- [x] S4 定位并分片读父任务 `design.md` §5.3（L1…L12 业务线）与 §5.4（N-1…N-9 缺陷）
- [x] S5 分片读 `research/01/02/03` 的逐仓定位明细（Select-String 定位行号 → 只读所需片段）
- [x] S6 读 `research/04-plugin-authority.md`（Authority 定位与能力契约）、`research/10` §B（四层治理原语 / L12 缺口）、`research/11`（15 仓实勘与同步结果）、`research/12`（N 缺陷处置状态与裁定）
- [x] S7 15 仓 + tavern-harness 只读实测核查（目录列表 / `git log -1` / `git remote -v` / `git status --short` / 最近 5 条提交区分业务与规则块提交）
- [x] S8 发现并诊断新缺陷：`tavern_helper_template` git 仓对象损坏（`git fsck`：refs/HEAD 指向 invalid sha1 `9167e77f…`）——只诊断不修复（修复属 git 写操作，禁做）
- [x] S9 发现口径偏差：`ST-shujuku-rebuild` 实测在 Myfork（research/00 与 research/11 记为 My-repo）——以实测为准并登记修正
- [x] S10 写 `research/atlas-overview.md`（R1 全景地图 + R2 可消费结论 + R4 L/N 登记 + 证据等级）
- [x] S11 写 `research/intent-statement.md`（R3 意图陈述 I1–I6，可逐条"对/不对"确认，标注待用户确认）
- [x] S12 更新 `prd.md`：勾选 R1–R4 与 AC-1/AC-2/AC-4；R5 与 AC-3 保持未勾（主代理职责）
- [x] S13 创建本 `implement.md` 并实时勾选
- [x] S14（**主代理**）把意图陈述交用户逐条确认（AC-3 / R5），确认结果回写任务文档
      ✅ **已完成（2026-09-24）**：主代理以 `AskUserQuestion` 提交 I1–I6，用户回执 **「全部准确」**；已回写 `prd.md` 的 R5 / AC-3 行。

## 边界遵守记录

- ✅ 未写任何 `research/atlas*`、`research/intent*`、`prd.md`、`implement.md` 之外的文件。
- ✅ 未触碰 `D:\Repo\Tavern-repo\Instance\**`（N-3…N-6 现状沿用父任务 research/06 转录，证据等级已标注）。
- ✅ 未触碰 `tavern-harness`、父任务文件、其它子任务目录。
- ✅ 全程零 git 写操作（log/remote/status/fsck 均只读）。
