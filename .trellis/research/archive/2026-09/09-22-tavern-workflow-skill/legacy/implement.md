# 执行计划：tavern-dev-workflow

## 1. 开工检查

- [x] 确认 `~/.agents/skills/tavern-dev-workflow` 与 `~/.claude/skills/tavern-dev-workflow` 均不存在。（两处均已核验不存在）
- [x] 检索现有 Skill，记录与 `trellis-*`、`fe-offline-design`、`fe-ui-inspect`、`tavern-luker-plugin-dev` 的边界。（已读各方 description；GitHub API 双通道检索已发起，无同类 skill）
- [x] 读取真源仓 `README.md` 与 `rules/pitfalls.md` 的标题索引；三份规则提炼只按索引分片读取。（README 全读；pitfalls.md 全读；research/01-03 仅读索引段与证据行）

## 2. Skill 实现

- [x] 使用 skill-creator 的 `init_skill.py` 初始化 `tavern-dev-workflow`，包含 `references/` 与 `agents/openai.yaml`。
      （偏差：skill-creator/scripts 下**不存在** `init_skill.py`，仅有 package/validate 等脚本；目录结构按 design.md 手动创建，未安装任何包）
- [x] 编写精炼的 `SKILL.md`，frontmatter 仅含 `name`、`description`，并在 description 中写明触发场景。（77 行）
- [x] 编写 `references/workflow-playbook.md`，覆盖新任务流程、单一功能 PR 拆分、统一规则变更流程、经验留存载体。（208 行）
- [x] 每条经验保留真实案例与后果的索引，不复制规则正文。（§4.1 十三条转述表 + 各节案例锚点，全部带回源行号）
- [x] 生成或刷新 `agents/openai.yaml`。（手写 24 行，与 SKILL.md 边界/流程一致；无生成脚本可用）
- [x] 在 `~/.claude/skills/` 创建指向真源的目录符号链接。（按本机惯例用 `New-Item -ItemType Junction`，LinkType=Junction、Target 可解析）

## 3. 验证

- [x] 运行 `quick_validate.py`，修复至通过。（`$env:PYTHONUTF8='1'` 后输出 "Skill is valid!"）
- [x] 验证符号链接目标可解析且未形成副本漂移。（`Get-Item ... | Select Target` 指向真源目录；`Test-Path` 经链接可读 SKILL.md = True；真源目录即唯一实体，无副本）
- [x] 抽查五条经验，给出 `pitfalls.md` 或 `research/01-03` 的标题或行号证据。（P-5@pitfalls.md:53、P-9@:93、P-11@:113、P-12@:123、P-4@:36，见子代理报告②）
- [x] 检查 Skill 中没有实例路径、敏感配置或规则正文副本。（`Select-String -Pattern 'D:\\Repo|Instance|caocaobi'` 三文件 0 命中）
- [x] 输出新增文件清单、验证命令和结果；不提交、不推送。（见子代理最终报告；未执行任何 git 操作）

## 风险与停止条件

- 目标路径已存在：停止，不覆盖、不删除。
- 初始化或链接需要安装包：停止并报告，禁止安装。
- Windows 符号链接权限不足：保留已验证的 Skill 真源并报告，不用目录复制替代。
- 发现真源流程与父任务材料冲突：记录冲突并采用真源仓当前版本，不自行扩展范围。
