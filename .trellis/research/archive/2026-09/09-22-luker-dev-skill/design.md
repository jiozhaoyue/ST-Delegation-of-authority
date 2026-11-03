# 技术设计：tavern-luker-plugin-dev

## 目标与边界

在 `C:\Users\caocaobi\.agents\skills\tavern-luker-plugin-dev\` 创建一个用户级 Skill，
把 Luker 官方开发文档中的稳定开发契约压缩为可按需加载的工作流，并在
`C:\Users\caocaobi\.claude\skills\tavern-luker-plugin-dev` 建立目录符号链接。

本任务只产出 Skill 本身及其校验结果，不修改任何 Luker/ST 实例、宿主源码、业务插件或项目依赖。

## 内容结构

采用渐进披露结构：

```text
tavern-luker-plugin-dev/
├── SKILL.md
├── agents/openai.yaml
└── references/
    └── luker-development.md
```

- `SKILL.md`：触发条件、资料选择顺序、开发工作流、核心禁区与验证清单，保持精炼。
- `references/luker-development.md`：承载 manifest、加载顺序、三层 API、错误信封、patch-first、服务端插件等详细速查。
- `agents/openai.yaml`：由 skill-creator 提供的生成脚本按 Skill 内容生成，不手写额外元数据。

## 知识边界

- 本 Skill 负责 Luker 特有的前端扩展、服务端插件和公开 API 契约。
- 通用前端离线设计继续由 `fe-offline-design` 负责。
- UI 自动化诊断继续由 `fe-ui-inspect` 负责。
- Trellis 生命周期继续由 `trellis-*` 负责。
- 跨宿主兼容策略只提示边界并链接结论，不在本 Skill 内展开完整兼容矩阵。
- 通用仓群开发流程留给后续 `tavern-dev-workflow`，本 Skill 不复制 Git、任务、提交和多仓同步纪律。

## 资料读取策略

父任务的 `research/05-luker-dev-docs.md` 约 131KB，禁止整体载入。实现时先用标题和关键词定位，
再分片读取以下主题：

1. Frontend Plugin Development
2. Server Plugin Development
3. Extension API Reference
4. Chat & State
5. UI & Popups
6. Plugin Integration
7. Low-Level Endpoint Reference

宿主可用性只从 `research/07-authority-host-compat-verification.md` 抽取 Luker 与服务端插件加载契约相关段落。

## 兼容与安全

- 不安装任何包；优先使用现有 skill-creator 脚本。
- 创建目标前检查同名目录和链接是否存在；若存在，不覆盖、不删除，立即报告。
- 不访问或修改 `D:\Repo\Tavern-repo\Instance\**`。
- 不把 Authority Host Bridge 描述为 Luker 可用能力。
- 不把低层 HTTP 端点作为首选路径；优先 Context API 与 patch-first 语义。

## 验证与回滚

- 使用 skill-creator 的 `quick_validate.py` 校验 Skill 结构。
- 检查 `agents/openai.yaml` 与 `SKILL.md` 一致。
- 抽查五条结论，记录其在父任务研究材料中的标题或行号。
- 验证 `.claude/skills/` 链接能解析到 `.agents/skills/` 真源。
- 若创建后校验失败，仅修正本任务新增文件；不得删除已有路径。若无法在不删除的前提下回滚，停止并报告。
