# 技术设计：tavern-dev-workflow

## 目标与边界

在 `C:\Users\caocaobi\.agents\skills\tavern-dev-workflow\` 创建一个用户级 Skill，
作为酒馆仓群开发流程的编排器：告诉 agent 在仓群里开任务、拆变更、分发规则时应按什么顺序
调用既有 Skill、真源仓和校验命令。

本 Skill 不复制统一规则正文，也不复制 `pitfalls.md` 全文；它只引用权威来源并给出操作顺序。

## 内容结构

```text
tavern-dev-workflow/
├── SKILL.md
├── agents/openai.yaml
└── references/
    └── workflow-playbook.md
```

- `SKILL.md`：触发场景、流程选择器、硬边界与最短操作路径。
- `references/workflow-playbook.md`：新任务流程、单一功能 PR 拆分、统一规则变更流程、经验留存载体与常见事故索引。
- `agents/openai.yaml`：由 skill-creator 脚本生成，保持与 `SKILL.md` 一致。

## 权威来源

- 统一规则正文与同步流程：`D:\Repo\Tavern-repo\tavern-harness\README.md`、`rules/`。
- 跨仓坑与教训：`D:\Repo\Tavern-repo\tavern-harness\rules\pitfalls.md`。
- 三群规则提炼：父任务 `research/01-rules-my-repo.md`、`02-rules-myfork.md`、`03-rules-js-slash-runner.md`。
- Trellis 生命周期：继续交给 `trellis-*` Skill；本 Skill 只说明酒馆仓群特有约束。

## 职责边界

- `tavern-dev-workflow` 负责跨仓流程编排与经验路由。
- `tavern-luker-plugin-dev` 负责 Luker 开发契约。
- `fe-offline-design` 负责离线前端设计。
- `fe-ui-inspect` 负责 UI 自动化诊断。
- `trellis-*` 负责任务生命周期。
- 后续实例与端口纪律若拆成独立 Skill，本 Skill 只引用，不重复展开。

## 兼容与安全

- 不安装任何包；使用现有 skill-creator 脚本。
- 不访问或修改 `D:\Repo\Tavern-repo\Instance\**`。
- 不把真源仓规则正文复制进 Skill，避免制造第二份漂移副本。
- 创建目标前检查同名目录和链接是否存在；若存在，不覆盖、不删除，立即报告。
- 不提交、不推送任何仓库。

## 验证与回滚

- 使用 `quick_validate.py` 校验 Skill 结构。
- 验证 `agents/openai.yaml` 与 `SKILL.md` 一致。
- 抽查五条经验，记录其在 `pitfalls.md` 或 `research/01-03` 中的标题或行号。
- 验证 `.claude/skills/` 链接能解析到 `.agents/skills/` 真源。
- 若创建后校验失败，仅修正本任务新增文件；不得删除已有路径。
