# Trellis 管理文件：保持上游默认

> **适用**：本仓（`ST-Delegation-of-authority`）与仓群内其他 Trellis 托管仓。
> **结论先行**：`.trellis/agents/*`、`.codex/agents/*`、`.trellis/workflow.md`、`.codex/config.toml`
> 这类**由 Trellis 安装/管理的文件保持上游默认**，不在其中写项目定制。要定制时，落点见下方「定制该放哪」。

---

## 为什么

### 理由一：workflow.md 会被注入**每一轮**上下文，其中的强约束会放大到所有会话

Trellis 的 SessionStart 注入读取 `.trellis/workflow.md`。实测事故（2026-09-23 → 09-25 处置）：
该文件的 sub-agent dispatch 协议段后被插入一段「Model gate」——要求子代理**只能**使用 `glm-5.3-flash`。
此后每一轮上下文都带着这条指令；而主流平台实际可用的子代理模型列表（Claude Code 为 sonnet / opus / haiku / fable）
**不含该名称**，按字面执行即「**任何子代理派发都被禁止**」，工作流在 Phase 2.2（派发 quality check）处硬停。

→ 在 workflow.md 里写定的模型名/工具名，等于给**所有**会话加一道可能无法满足的门。

### 理由二：改动会让该文件被永久标记为 "Modified by you"

Trellis 用 `.trellis/.template-hashes.json` 记录每个托管文件的基准哈希。`trellis update` 把
「工作区文件 ≠ 记录」的托管文件列为 **`Modified by you (need your decision)`**，需要有人逐个决策，
同时**上游模板升级也被这一改动挡住**。

实测语义：记录的是**模板内容**的 sha256——本仓 `.trellis/agents/check.md` 的条目等于 Trellis 0.6.16
模板 `templates/trellis/agents/check.md` 的哈希，而工作区文件当时是带门禁的定制版，
故 `--dry-run` 稳定把它列为 Modified by you。

> ⚠️ **一处未解释的例外（如实记录）**：`.trellis/workflow.md` 的本地差异（`python3` → `python`）
> **没有**出现在该清单里——该文件由 `trellis workflow` 通道单独跟踪。因此**不能靠"清单里没有就没事"**
> 来判断某个定制是否安全；结论仍是：别手改托管文件。

**自检命令（只读）**：

```bash
trellis update --dry-run     # 输出中的 "Modified by you" 清单 = 本仓对托管文件的全部改写
```

> `trellis update --dry-run` 会**顺手修剪** `.template-hashes.json` 里的孤儿条目（对工作区是一次真实写入）。
> 看完清单若不想留痕：`git checkout -- .trellis/.template-hashes.json`。
> 该命令另有副作用面：它会打印 `Deprecated commands cleanup`（对已改的废弃钩子会 `modified, skipped`）。

---

## 定制该放哪（按优先级）

| 想定制的东西 | 正确落点 | 机制 |
| --- | --- | --- |
| 跨仓群通用的强制规则 | `tavern-harness/rules/**`（真源） | 同步器写入各仓 `AGENTS.md` 的 `TAVERN_RULES` 块 |
| 本仓对某条规则的覆盖/例外 | 规则块内「**项目覆盖**」区（`AGENTS.md` 块尾） | 同步器**保留**该节，只重建块的其余部分 |
| 层内工程约定（可执行的检查项） | `.trellis/spec/<包>/<层>/`（本页所在层） | Trellis 按任务/按层注入 |
| workflow 的行为差异 | Trellis 原生模板通道（`trellis workflow -t <id> -m <source>`） | **不要手改已安装的 workflow.md**；手改会被 `update` 视为本地改动 |
| 平台 agent 的模型/参数 | 平台**用户级**配置（如 `~/.claude/`）或真源规则条目 | 写进项目级托管文件会与上游模板持续冲突 |

判断口径：**「这条约束要不要跟着仓库走？」** 要 → 规则块/「项目覆盖」/spec；只是本机偏好 → 用户级配置。

---

## 本仓现状（核对用，2026-09-25 实测）

`trellis update --dry-run` 的 "Modified by you" 清单：

| 文件 | 状态 |
| --- | --- |
| `.codex/config.toml` | **在列**。差异为 `[shell_environment_policy]`（写入 `CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR=1`），属 shell 环境策略、非子代理定制；**有意保留**，需在每次 `trellis update` 时跳过 |
| `.trellis/agents/{check,implement}.md` | 已与 0.6.16 模板**逐字节一致**（2026-09-25 移除门禁段后） |
| `.codex/agents/trellis-{check,implement,research}.toml` | 已与 0.6.16 模板**逐字节一致** |
| `.trellis/workflow.md` | 唯一本地差异是 **`python3` → `python`**（Windows 无 `python3`）；该适配**有意保留**，仓群内 9 个 Trellis 仓一致 |

复验命令：

```bash
T="$(npm root -g)/@mindfoldhq/trellis/dist/templates"
diff "$T/trellis/agents/check.md" .trellis/agents/check.md      # 期望无输出
diff "$T/codex/agents/trellis-check.toml" .codex/agents/trellis-check.toml   # 期望无输出
diff "$T/trellis/workflow.md" .trellis/workflow.md | grep -v "python3\? "   # 期望无输出（差异应全为 python 适配）
```
