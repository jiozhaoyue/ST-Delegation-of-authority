# Thinking Guides

> **Purpose**: Expand your thinking to catch things you might not have considered.

---

## Why Thinking Guides?

**Most bugs and tech debt come from "didn't think of that"**, not from lack of skill:

- Didn't think about what happens at layer boundaries → cross-layer bugs
- Didn't think about code patterns repeating → duplicated code everywhere
- Didn't think about edge cases → runtime errors
- Didn't think about future maintainers → unreadable code

These guides help you **ask the right questions before coding**.

---

## Available Guides

| Guide | Purpose | When to Use |
|-------|---------|-------------|
| [Code Reuse Thinking Guide](./code-reuse-thinking-guide.md) | Identify patterns and reduce duplication | When you notice repeated patterns |
| [Cross-Layer Thinking Guide](./cross-layer-thinking-guide.md) | Think through data flow across layers | Features spanning multiple layers |

---

## Quick Reference: Thinking Triggers

### When to Think About Cross-Layer Issues

- [ ] Feature touches 3+ layers (API, Service, Component, Database)
- [ ] Data format changes between layers
- [ ] Multiple consumers need the same data
- [ ] You're not sure where to put some logic
- [ ] You are adding an event kind, JSONL record, RPC payload, or config field
- [ ] UI / command code starts casting raw payload fields directly

→ Read [Cross-Layer Thinking Guide](./cross-layer-thinking-guide.md)

### When to Think About Code Reuse

- [ ] You're writing similar code to something that exists
- [ ] You see the same pattern repeated 3+ times
- [ ] You're adding a new field to multiple places
- [ ] **You're modifying any constant or config**
- [ ] **You're creating a new utility/helper function** ← Search first!
- [ ] Two files read the same untyped payload field with local casts
- [ ] Multiple branches update the same derived state from `kind` / `action`

→ Read [Code Reuse Thinking Guide](./code-reuse-thinking-guide.md)

### When Verifying AI Cross-Review Results

- [ ] Reviewer claims "user input can be malicious" → Check the actual data source (internal manifest? user config? external API?)
- [ ] Reviewer flags "missing validation" → Is the data from a trusted internal source?
- [ ] Reviewer says "behavior change" → Read the code comments — is it intentional design?
- [ ] Reviewer identifies a "bug" in test → Mentally delete the feature being tested — does the test still pass? If yes → tautological test

**Common AI reviewer false-positive patterns**:
1. **Trust boundary confusion**: Treating internal data (bundled JSON manifests) as untrusted external input
2. **Ignoring design comments**: Flagging intentional behavior documented in code comments as bugs
3. **Variable misreading**: Not tracing a variable to its actual definition (e.g., Map keyed by path vs name)

**Verification rule**: Every CRITICAL/WARNING finding must be verified against the actual code before prioritizing. Budget ~35% false-positive rate for AI reviews.

---

## Pre-Modification Rule (CRITICAL)

> **Before changing ANY value, ALWAYS search first!**

```bash
# Search for the value you're about to change
grep -r "value_to_change" .
```

This single habit prevents most "forgot to update X" bugs.

---

## 本仓特有的跨层触发点（ST-Delegation-of-authority）

> 本仓是四层架构：公开合同（`packages/server-plugin`）→ 权威执行（`crates/authority-core`）→ 浏览器接入（`packages/sdk-extension`）→ 发布落地（`runtime/` + `managed/` + `.authority-release.json`）。原文：`docs/server/ai-integration-guide.md` §10（行 367-369）。各包细则见各包 `index.md`，此处只列"什么时候必须想到其他层"。

- [ ] **改了任何 DTO**（`packages/shared-types/src/**`）→ 四层全部过一遍：core 同构 → `CoreService` 代理 → route/权限 → SDK client → 文档 → installable 同步（8 步顺序，同文件 §7.1，行 306-317）。
- [ ] **改了 SDK 源码 / server-plugin 编译输出 / core / release metadata** → `npm run sync:installable && npm run check:installable`（触发条件：同文件 §5，行 208-227）。跳过这步的典型症状是"代码改了但前端看起来没更新"（§9）。
- [ ] **新增公开 route** → 权限检查（`PermissionService`）+ `fail()` 错误出口 + 审计，三者缺一即审查不通过；route checklist：同文件 §4（行 191-206）。
- [ ] **想直接碰 `/v1/*` 或数据文件路径** → 停。`/v1/*` 是内部层，文件布局不是合同（同文件 §6.1/§6.3，行 231-237、247-259）。
- [ ] **改了 `static/style.css` 或任何注入宿主的样式** → 确认全部规则在 `.authority-*` 根容器作用域内（`packages/sdk-extension/static/style.css:3-5`），grep 自查无裸 `body`/`:root`/酒馆原生类名（通则与事故案例：本仓 `AGENTS.md` 统一规则块 L0-10 / P-5）。
- [ ] **改了 `host-bridge/`**（宿主补丁）→ 版本门禁 `supportedPackageVersions`（`host-bridge/manifest.json:2`）与 8 个 `syntaxCheckTargets`（同文件 :9）必须先过；跨宿主插件禁用 Host Bridge（统一规则块 L0-12）。
- [ ] **发版前** → 全链验证：`npm run typecheck && npm run build && npm test && npm run bench:core && npm run bench:scale && npm run sync:installable && npm run check:installable`（README「发布流程」节）。

---

## How to Use This Directory

1. **Before coding**: Skim the relevant thinking guide
2. **During coding**: If something feels repetitive or complex, check the guides
3. **After bugs**: Add new insights to the relevant guide (learn from mistakes)

---

## Contributing

Found a new "didn't think of that" moment? Add it to the relevant guide.

---

**Core Principle**: 30 minutes of thinking saves 3 hours of debugging.
