# 仓库经验 Skill 化

> 父任务：[`09-21-multi-repo-rules-skills-survey`](../09-21-multi-repo-rules-skills-survey/prd.md)（对应 C-05）
> 素材：[`research/01`](../09-21-multi-repo-rules-skills-survey/research/01-rules-my-repo.md)、[`02`](../09-21-multi-repo-rules-skills-survey/research/02-rules-myfork.md)、[`03`](../09-21-multi-repo-rules-skills-survey/research/03-rules-js-slash-runner.md)（各 36–42KB）+ 真源仓 `tavern-harness/rules/pitfalls.md`

## Goal

把本仓群在**开发过程中积累的经验**（坑、约定、流程）沉淀为 `tavern-dev-workflow` skill，
使 agent 在仓群里开任务、拆变更、分发规则时**不必重新踩一遍已记录的坑**。

## Background

- 15 个仓库分三群（My-repo 扩展插件 / Myfork 宿主 fork 与插件 / JS-Slash-Runner 酒馆助手脚本），
  三群的宿主约束、构建方式、测试命令各不相同，但**共用同一套跨群通则**。
- 已产出真实事故案例 13 条（`pitfalls.md`），其中有实际损害后果的包括：CSS 裸选择器污染酒馆全站、
  Worker terminate 未置空导致永久静默挂死、无界等待导致测试挂死、把浏览器存储当事实源导致方向性返工。
- 统一规则块 v1.1.0 已分发到各仓（块外零改动、幂等），本 skill 是它的**操作层编排**。

## Requirements

- [x] R1 产出 `~/.agents/skills/tavern-dev-workflow/SKILL.md`。（77 行，2026-09-24）
- [x] R2 写成**编排器**（告诉你何时用哪个已有 skill/工具），而非复制 `pitfalls.md` 或规则块的内容——
      规则块是"约束"，本 skill 是"怎么照着做"。（skill 内经验条目均为转述索引 + 回源行号，无正文复制）
- [x] R3 至少覆盖：① 在仓群开新任务的标准流程；② 变更如何拆成单一功能 PR；
      ③ 统一规则变更的流程（改真源 → 跑测试 → dry-run → apply → 逐仓提交推送）。
      （playbook §1/§2/§3；八步流程与真源仓 README 程序化逐字比对一致）
- [x] R4 每条经验必须**带真实案例与后果**（沿用 `pitfalls.md` 的收录标准），禁止只列标题。
      （playbook §4.1 十三条 + §1.3/§2.2/§2.6/§3.4/§4.2-4.4 补充条目，均含案例与后果）
- [x] R5 去重：与 `trellis-*`（工作流）、`fe-offline-design`、`tavern-luker-plugin-dev` 划分边界，只引用不重复。
      （SKILL.md「边界与路由表」节）
- [x] R6 symlink 到 `~/.claude/skills/`。（按本机惯例用 Junction：`.claude\skills\tavern-dev-workflow` → `.agents\skills\tavern-dev-workflow`，LinkType=Junction 已验证）

## Acceptance Criteria

- [x] AC-1 结构校验通过：frontmatter 完整、`description` 含触发场景。（`quick_validate.py` 输出 "Skill is valid!"）
- [x] AC-2 与现有 skill 的比对结论已列出，无重叠。（SKILL.md「边界与路由表」；GitHub API 检索两次 0 命中）
- [x] AC-3 抽查 5 条经验能回源到 `pitfalls.md` / `research/01-03`。（子代理报告②节：P-5/P-9/P-11/P-12/P-4，均给出文件+行号）
- [x] AC-4 包含"规则变更七步流程"，且与真源仓 `README.md` 的流程一致。
      （注：真源仓 README 当前版本为**八步**——第 7 步各目标仓提交推送、第 8 步真源仓提交推送；已按真源仓为准收录 8 步，两处程序化比对均 True，差异已记录）

## Constraints

- 不得把真源仓 `rules/` 的正文复制进 skill（那会制造第二份会漂移的副本——正是前作腐烂的模式）。
  正确做法：**引用**规则块与真源仓路径。
- 中文；检索先行（写入前完成双通道检索）。

## 开工前须知

1. 先读真源仓 `tavern-harness/README.md` 与 `rules/pitfalls.md`（后者是经验主体）。
2. 三份规则提炼（`research/01-03`）各 36–42 KB，**按索引 Grep 定位后读片段**，勿整体读取。
3. 本 skill 与 `tavern-instance-safety`（若后续拆分）的边界：前者讲"流程"，后者讲"实例与端口纪律"。
