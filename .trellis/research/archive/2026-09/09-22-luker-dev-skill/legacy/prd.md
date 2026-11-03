# Luker 开发文档 Skill 化

> 父任务：[`09-21-multi-repo-rules-skills-survey`](../09-21-multi-repo-rules-skills-survey/prd.md)（对应 C-04）
> 素材：[`research/05-luker-dev-docs.md`](../09-21-multi-repo-rules-skills-survey/research/05-luker-dev-docs.md)（131 KB，已抓全 22 个开发页）

## Goal

把 Luker 官方开发文档（`https://luker.cups.moe/zh-CN/development`）沉淀为一个**可复用 skill** `tavern-luker-plugin-dev`，
让 agent 在开发/调试 Luker 扩展或服务端插件时**不必重新翻 131KB 文档**。

## Background

- Luker 是 SillyTavern 的 fork，其**服务端插件加载契约与 ST 逐字节同形**（`loadPlugins` / `isValidPluginID` / `express.Router()` 挂载方式全部相同）——已实测（`research/07` §2.1）。
- 官方文档共 22 个开发页，含三层 API 惯例、`{ok, reason, hint}` 信封、patch-first 等约定。
- 本仓群已有大量 Luker 相关实践（`SillyTavern-Timelines` 的 `.trellis/spec/frontend/luker-plugin-standards.md` 等）。

## Requirements

- [x] R1 产出 `~/.agents/skills/tavern-luker-plugin-dev/SKILL.md`，落点与命名遵循 `design.md` §3.1（`tavern-` 前缀 + kebab-case）。（2026-09-24 完成）
- [x] R2 覆盖 Luker 开发的核心约定：插件清单（`manifest.json` 必需字段）、加载顺序、三层 API 惯例、错误信封、patch-first 工作流。（references §2.1/§2.4/§3.5/§6 + 服务端契约 §5）
- [x] R3 `description` 写清**触发场景**（何时该加载本 skill），使 agent 能自主判断。（四类触发场景枚举）
- [x] R4 做**去重检查**：不得与现有 skill 重叠（`fe-offline-design`、`fe-ui-inspect`、`trellis-*`、`lark-*`）；与 `tavern-dev-workflow` / `tavern-host-compat` 的边界须写明。（SKILL.md「职责边界」表）
- [x] R5 按本机惯例 symlink 到 `~/.claude/skills/`。（本机既有惯例实为 Junction，已沿用并验证可解析）

## Acceptance Criteria

- [x] AC-1 skill 结构校验通过：frontmatter 完整（`name` + 含触发场景的 `description`）。（quick_validate.py 输出 `Skill is valid!`，exit=0）
- [x] AC-2 列出与现有 skill 的比对结论，证明无功能重叠。（SKILL.md 边界表 7 行比对）
- [x] AC-3 **抽查 5 条文档结论**，能按 `research/05` 的页面定位回源核对。（references §9 表，行号经 grep 实测）
- [x] AC-4 symlink 生效（`~/.claude/skills/tavern-luker-plugin-dev` 可解析）。（Junction Target 实测返回真源路径）

## Constraints

- 只读 `research/05`（131 KB，**禁止整体读取**，按 VitePress 页面分节 Grep 定位后读片段）。
- 文档、注释、回复全中文（代码标识符/专有名词除外）。
- 涉及"跨宿主"内容时，必须与 `tavern-host-compat` 的边界划分清楚，不得重复。

## 开工前须知

1. 先读 `research/05` 的**目录结构**（页面清单），再按主题 Grep。
2. 先做 F-1 去重检查（与现有 skill 逐一比对），再动笔。
3. 本任务的规则块已随统一规则分发到各仓；若 skill 内容与规则块冲突，**以规则块为准**并回报差异。
