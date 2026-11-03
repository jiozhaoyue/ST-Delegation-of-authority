# 执行计划：tavern-luker-plugin-dev

## 1. 开工检查

- [x] 确认 `~/.agents/skills/tavern-luker-plugin-dev` 与 `~/.claude/skills/tavern-luker-plugin-dev` 均不存在。（2026-09-24 实测两者均返回 `False`）
- [x] 检索现有 Skill，记录与 `fe-offline-design`、`fe-ui-inspect`、`trellis-*`、`lark-*` 的边界。（用户级与项目级 skill 的 description 已逐一读取；用户级清单中无 `tavern-*` / `lark-*` 前缀 skill）
- [x] 只按标题和关键词分片读取 `research/05-luker-dev-docs.md`，禁止整体载入。（按行段 1-330 / 331-711 / 976-1060 分片；research/07 全读）

## 2. Skill 实现

- [x] 使用 skill-creator 的 `init_skill.py` 初始化 `tavern-luker-plugin-dev`，包含 `references/` 与 `agents/openai.yaml`。（skill-creator 实际无 `init_skill.py`，改为手动创建同构目录；格式对齐现有 skill 样例）
- [x] 编写精炼的 `SKILL.md`，frontmatter 仅含 `name`、`description`，并在 description 中写明触发场景。（50 行，frontmatter 两键）
- [x] 编写 `references/luker-development.md`，覆盖 manifest、加载顺序、三层 API、错误信封、patch-first 与服务端插件约定。（255 行，§1-§9）
- [x] 明确与通用工作流、跨宿主兼容、离线前端设计、UI 诊断 Skill 的职责边界。（SKILL.md「职责边界」表）
- [x] 生成或刷新 `agents/openai.yaml`。（按 pavedpath-code / ahtml 样例的 interface 格式）
- [x] 在 `~/.claude/skills/` 创建指向真源的目录符号链接。（本机惯例为 Junction 而非 SymbolicLink——lark-*/gemini-* 均为 Junction；沿用 Junction，无需管理员权限）

## 3. 验证

- [x] 运行 `quick_validate.py`，修复至通过。（首次因 GBK 默认编码报 UnicodeDecodeError，属脚本 Windows locale 缺陷；`PYTHONUTF8=1` 重跑输出 `Skill is valid!`，exit=0）
- [x] 验证符号链接目标可解析且未形成副本漂移。（`(Get-Item ...).Target` 返回真源路径；经链接 Recurse 列出真源三文件）
- [x] 抽查五条知识结论，给出 `research/05` 的标题或行号证据。（references §9 表，行号经 grep 实测锚点：L86 / L115-118 / L217-230 / L366-384+L1019 / L694-706+L1020）
- [x] 检查 Skill 中没有实例路径、敏感配置或 Authority Host Bridge 可用性误述。（grep `D:\Repo|Instance|caocaobi` 命中 0；Host Bridge 表述为「Luker 上不可用、能力内核可用」，与 research/07 一致）
- [x] 输出新增文件清单、验证命令和结果；不提交、不推送。

## 风险与停止条件

- 目标路径已存在：停止，不覆盖、不删除。
- 初始化或链接需要安装包：停止并报告，禁止安装。
- Windows 符号链接权限不足：保留已验证的 Skill 真源并报告，不用目录复制替代。
- 发现官方资料与研究摘要冲突：记录冲突并采用可回源的官方材料，不自行扩展范围。
