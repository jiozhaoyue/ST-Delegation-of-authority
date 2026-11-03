# 本仓挂起项收尾：core exe 体积、Instance 消费者盘点、未验项

> 父任务：`09-25-tavern-project-bootstrap` · 子任务 A（无依赖，可与 B 并行）

## Goal

收口 09-25 治理规划任务遗留的挂起项与未验项，让 Authority 仓的"已知账"归零。

---

## Background

前序任务 `09-25-authority-plugin-governance-plan`（已归档）在收口时留下三项挂起 + 一项未验：

| # | 项 | 已知事实 |
| --- | --- | --- |
| 1 | **core exe 体积膨胀** | `managed/core/win32-x64/authority-core.exe` 从 **10.3 MB → 17.7 MB**，而 `crates/` 源码自 2026-07-31 **零改动**。哈希与 `.authority-release.json` 一致、`check:installable` 通过，即 installable 自洽；但本机 release 重建产物与上游 CI 产物不同。 |
| 2 | **Instance 消费者盘点** | 前序任务因 L1-MF-15 ④（实例聊天内容不可读）挂起。用户 2026-09-25 **明确批准**本次执行，限**路径级枚举**。 |
| 3 | **TS 穷尽性未验项** | 向 `AuthorityFeaturePath` 新增成员而漏加 `getFeatureAvailability()` 的 switch `case` 时，TS 是否报错。`tsconfig.base.json` 启用 `strict` 与 `noUncheckedIndexedAccess`，**未显式启用 `noImplicitReturns`**；该 switch 无 `default` 分支。前序任务明确"实测前不得断言"。 |
| 4 | **跨仓约束力缺口** | 治理契约未同步 `tavern-harness` 真源。**已移交子任务 B**，本任务不重复。 |

---

## Requirements

### R1 · core exe 体积核查

- R1.1 判定 17.7 MB 是**工具链/strip 差异**还是**真实代码膨胀**。至少核验：
  可执行文件是否含调试符号（`.debug_*` / PDB 引用）、构建 profile（`scripts/build-core.mjs:12` 的
  `AUTHORITY_CORE_PROFILE`）、`Cargo.toml` 的 `[profile.release]` 设置、本机 Rust 版本与上游 CI 的差异。
- R1.2 复核上游 CI 产物（`.github/workflows` 的 `Core Artifacts`）是否与本机产物同参数。
- R1.3 产出**结论 + 处置建议**：若为 strip 差异，给出让本地产物与 CI 对齐的具体做法；
  若为真实膨胀，给出原因与是否需要回滚该产物提交。
- R1.4 **不擅自改动已推送的产物**：任何替换 `managed/core/**` 的动作都属 PARDON 高风险，须先列出路径与理由获批准。

### R2 · Instance 消费者盘点（红线项，用户已批准）

- R2.1 **仅做路径级枚举**：列出 `Instance/Dev/**` 下已安装的第三方扩展目录名，判定其中是否有
  Authority 消费者（依据：目录内是否存在 `manifest.json` 且其内容引用 `STAuthority`/`st-authority` 等标识）。
- R2.2 **严禁**：读取任何聊天内容、遍历 `Instance/Real/**`、拷贝 `data/`、读取会话密钥文件（L1-MF-15 ④ / L0-1）。
- R2.3 产出与仓群 16 仓盘点的**差集**：即"仓群内没有、但实例里装着"的消费者，补齐前序任务的盘点缺口。
- R2.4 若发现消费者，登记其是否存在隐式契约依赖（供子任务 C 的模板设计参考），但**不做任何修改**。

### R3 · TS 穷尽性未验项实测

- R3.1 构造最小复现：向 `AuthorityFeaturePath` 加一个成员而不加 `case`，跑 `npm run typecheck`，记录结果。
- R3.2 **在临时分支或临时文件上做**，实测后立即还原；不得把探针留在产品代码里。
- R3.3 回填前序任务的 spec 页（`.trellis/spec/shared-types/backend/capability-lifecycle.md` §七 未验项 1），
      把"未验"改为确定结论。该文件**已入库并可推送**，回填后照 L0-7 提交推送。

---

## Acceptance Criteria

- [x] **AC-A1**：core exe 体积有明确结论（strip 差异 / 真实膨胀），并附核验证据（PE 节表、profile 配置、CI 参数对照）。
      → **结论：工具链差异（GNU/MinGW vs MSVC），非代码膨胀、非 strip 差异。**
      证据：COFF `PointerToSymbolTable` 本机 11,883,008 / 上游 0；符号数 60,583 / 0；符号表占文件 **33.0%**；
      定量归因 7,407,487 字节差中 **79.1% 是符号表**；工具链指纹 `__mingw`×26 vs 0、`api-ms-win-crt` 0 vs ×8；
      两边**均无** `.debug_*` 节。详见 `research/00-findings.md` §R1。
- [x] **AC-A2**：给出可执行的处置建议；如需替换产物，已列出目标路径与理由并获用户批准（未获批准则不执行，仅出建议）。
      → 三方案 (a) MSVC /(b) strip /(c) 维持现状+登记。
      **用户 2026-09-25 批准「两者都做」+「替换并新开提交」→ 已执行**：
      `rustup target add x86_64-pc-windows-msvc`（免管理员）+ `Cargo.toml`（workspace 根）加
      `[profile.release] strip = "symbols"` + 以 MSVC 三元组重建 + 替换
      `managed/core/win32-x64/authority-core.exe` 并同步两处哈希。
      **结果 17,739,135 → 10,292,736 字节（−42.0%）**，与 CI 产物结构同源（均 5 节 / UCRT / 无符号表）。
      `check:installable` = "Installable runtime is up to date."；提交 `2681b1e` 已推送。
      **更正**：先前判定的「本机未装 MSVC 工具链、需安装」**是错的**——实况是
      VS Build Tools 已装在 `Program Files (x86)\...\BuildTools`（MSVC toolset 14.44.35207，VC/ 2.2GB），
      我最初查错了目录且 find 深度不足。**实际只缺一个 rustup 目标**。
- [x] **AC-A3**：Instance 盘点产出目录级清单与"仓群内/实例内"差集，**全程零聊天内容读取**。
      → **差集为空集**：Dev/SillyTavern 第三方扩展 **0** 个、Dev/Luker **23** 个，三种独立信号
      （`.authority` 目录 / `manifest.json` 提及 / 源码调用）**全部为零**；且 Dev 实例**未安装 Authority 本身**。
      扫描范围自证见 `research/00-findings.md` §2.1（未触 `Real/`、未遍历 `chats/`、未读会话密钥）。
- [x] **AC-A4**：TS 穷尽性实测完成，结论回填 `capability-lifecycle.md`，探针已还原（`git status` 无残留）。
      → **编译期会拦住**：实测报 `error TS2366`（`feature-flags.ts(32,105)`）。
      已回填 spec 页 §4 的 A3 定位说明（A3 由"唯一防线"降为"双保险"）；探针已 `git checkout --` 还原、`tsc -b` 复核通过。
- [x] **AC-A5**：Authority 产品代码（`packages/`/`crates/`/`docs/`/`runtime/`/`managed/`）零改动，
      除非 AC-A2 获批准并单独记录。
      → **经批准后已改动**（AC-A2 路径）：`Cargo.toml`（+15 行 strip 加固）+ `managed/core/win32-x64/*`
      （产物替换 + 哈希同步）+ `.authority-release.json`（哈希同步）。
      **`packages/` / `crates/` 源码 / `docs/` / `runtime/` 均零改动**（实测 `git status --porcelain` 无命中）。
      改动全部集中在 AC-A2 批准范围内，提交 `2681b1e`。
- [x] **AC-A6**：本任务产物已提交推送 `origin`（L0-7）。
      → 三笔提交均已推送 `origin/main`，`rev-list --left-right --count` = `0 0`：
      `a524f02`（spec 回填 TS 穷尽性）、`9f2be80`（规则块 v1.2.0 同步）、
      `2681b1e`（core 产物替换 + strip 加固）。

---

## Out of Scope

- 跨仓规则补条 → 子任务 B。
- 模板与云同步 → 子任务 C。
- 修复 Instance 中发现的任何消费者插件。
- 任何 `Instance/Real/**` 的读写。
