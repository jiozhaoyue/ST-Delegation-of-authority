# Bootstrap Task: Fill Project Development Guidelines

**You (the AI) are running this task. The developer does not read this file.**

The developer just ran `trellis init` on this project for the first time.
`.trellis/` now exists with empty spec scaffolding, and this bootstrap task
exists under `.trellis/tasks/`. When they want to work on it, they should start
this task from a session that provides Trellis session identity.

**Your job**: help them populate `.trellis/spec/` with the team's real
coding conventions. Every future AI session — this project's
`trellis-implement` and `trellis-check` sub-agents — auto-loads spec files
listed in per-task jsonl manifests. Empty spec = sub-agents write generic
code. Real spec = sub-agents match the team's actual patterns.

Don't dump instructions. Open with a short greeting, figure out if the repo
has any existing convention docs (CLAUDE.md, .cursorrules, etc.), and drive
the rest conversationally.

---

## Status (update the checkboxes as you complete each item)

- [x] Fill guidelines for @stdo/example-extension
- [x] Fill guidelines for @stdo/sdk-extension
- [x] Fill guidelines for @stdo/server-plugin
- [x] Fill guidelines for @stdo/shared-types
- [x] Fill guidelines for authority-core
- [x] Add code examples

> **完成记录（2026-09-24，由父任务 `09-21-multi-repo-rules-skills-survey` 的 Batch 4-A 子代理执行）**：
> 上述 6 项全部完成——`.trellis/spec/` 下 10 个索引（5 包 × backend/frontend + guides）与全部主题文件已灌入本仓实证规范（62 个 md 文件，零占位符，自查 `TBD|待填|TODO|To be filled|To fill` 为 0 命中；`TRELLIS:START` 泄漏为 0 命中）。
> 证据回源：≥25 条规范条目带真实文件路径 + 行号或可执行命令（见 implement.md 的证据表）。
>
> **与统一规则块的边界裁定（用户选项 (a) 下执行）**：spec 只承载"该包内写代码要遵守什么、怎么验证"的操作规范；跨仓通则（Git 纪律、检索先行、子代理模型、中文约定等 L0 层）一律不复制正文，仅在必要处以"见本仓 `AGENTS.md` 统一规则块 L0-x / L1-MF-x"一句话引用。**无任何包被裁定"由规则块覆盖、spec 不另立"**——规则块与 spec 视角不同（通则 vs 操作规范），spec 内容均已操作化（验证命令 + 文件行号 + 检查清单），不构成重复。故**不需要**改走选项 (c)。

---

## Spec files to populate

### Package: @stdo/example-extension (`spec/example-extension/`)

- Backend guidelines: `.trellis/spec/example-extension/backend/`

- Frontend guidelines: `.trellis/spec/example-extension/frontend/`

### Package: @stdo/sdk-extension (`spec/sdk-extension/`)

- Backend guidelines: `.trellis/spec/sdk-extension/backend/`

- Frontend guidelines: `.trellis/spec/sdk-extension/frontend/`

### Package: @stdo/server-plugin (`spec/server-plugin/`)

- Backend guidelines: `.trellis/spec/server-plugin/backend/`

- Frontend guidelines: `.trellis/spec/server-plugin/frontend/`

### Package: @stdo/shared-types (`spec/shared-types/`)

- Backend guidelines: `.trellis/spec/shared-types/backend/`

- Frontend guidelines: `.trellis/spec/shared-types/frontend/`

### Package: authority-core (`spec/authority-core/`)

- Backend guidelines: `.trellis/spec/authority-core/backend/`


### Thinking guides (already populated)

`.trellis/spec/guides/` contains general thinking guides pre-filled with
best practices. Customize only if something clearly doesn't fit this project.

---

## How to fill the spec

### Step 1: Import from existing convention files first (preferred)

Search the repo for existing convention docs. If any exist, read them and
extract the relevant rules into the matching `.trellis/spec/` files —
usually much faster than documenting from scratch.

| File / Directory | Tool |
|------|------|
| `CLAUDE.md` / `CLAUDE.local.md` | Claude Code |
| `AGENTS.md` | Codex / Claude Code / agent-compatible tools |
| `.cursorrules` | Cursor |
| `.cursor/rules/*.mdc` | Cursor (rules directory) |
| `.windsurfrules` | Windsurf |
| `.clinerules` | Cline |
| `.roomodes` | Roo Code |
| `.github/copilot-instructions.md` | GitHub Copilot |
| `.vscode/settings.json` → `github.copilot.chat.codeGeneration.instructions` | VS Code Copilot |
| `CONVENTIONS.md` / `.aider.conf.yml` | aider |
| `CONTRIBUTING.md` | General project conventions |
| `.editorconfig` | Editor formatting rules |

### Step 2: Analyze the codebase for anything not covered by existing docs

Scan real code to discover patterns. Before writing each spec file:
- Find 2-3 real examples of each pattern in the codebase.
- Reference real file paths (not hypothetical ones).
- Document anti-patterns the team clearly avoids.

### Step 3: Document reality, not ideals

**Critical**: write what the code *actually does*, not what it should do.
Sub-agents match the spec, so aspirational patterns that don't exist in the
codebase will cause sub-agents to write code that looks out of place.

If the team has known tech debt, document the current state — improvement
is a separate conversation, not a bootstrap concern.

---

## Quick explainer of the runtime (share when they ask "why do we need spec at all")

- Every AI coding task spawns two sub-agents: `trellis-implement` (writes
  code) and `trellis-check` (verifies quality).
- Each task has `implement.jsonl` / `check.jsonl` manifests listing which
  spec files to load.
- The platform hook auto-injects those spec files + the task's `prd.md`
  into every sub-agent prompt, so the sub-agent codes/reviews per team
  conventions without anyone pasting them manually.
- Source of truth: `.trellis/spec/`. That's why filling it well now pays
  off forever.

---

## Completion

When the developer confirms the checklist items above are done with real
examples (not placeholders), guide them to run:

```bash
python ./.trellis/scripts/task.py finish
python ./.trellis/scripts/task.py archive 00-bootstrap-guidelines
```

After archive, every new developer who joins this project will get a
`00-join-<slug>` onboarding task instead of this bootstrap task.

---

## Suggested opening line

"Welcome to Trellis! Your init just set me up to help you fill the project
spec — a one-time setup so every future AI session follows the team's
conventions instead of writing generic code. Before we start, do you have
any existing convention docs (CLAUDE.md, .cursorrules, CONTRIBUTING.md,
etc.) I can pull from, or should I scan the codebase from scratch?"
