# AC-3 · `tavern-host-compat` 与 `tavern-browser-automation` 合并/拆分判定（定稿）

> 判定依据素材：父任务 `design.md:193/196`（S3/S6 定位）、`implement.md:218/224`（F-5 归属本任务）、`research/07-authority-host-compat-verification.md`（S3 素材：四宿主可用性证据链）、`research/06` §4 + 本任务 `deliverables/03`（S6 素材：D5 分工矩阵，已定稿）、D5 裁定（`research/13` Batch 2-A）。
> 现状取证（2026-09-24，只读）：两个 skill **均未创建**；`~/.agents/skills/` 现有 tavern-* 仅 `tavern-dev-workflow`、`tavern-luker-plugin-dev`。

---

## 1. 结论：**拆分**（不合并）

两个拟议 skill 保持独立：

| Skill | 定位（回源） | 素材状态 |
|---|---|---|
| **`tavern-host-compat`**（S3） | "处理 ST/Luker/PT/TT 四宿主差异时"触发——**开发期查阅宿主能力差异**（父 `design.md:193`） | `research/07` 四宿主证据链 + 各仓 host-bridge 实测（体量大） |
| **`tavern-browser-automation`**（S6） | "需要浏览器自动化验证插件 UI 时"触发——**测试期选择与操作自动化工具**（父 `design.md:196`） | `research/06` §4 + `deliverables/03` 分工矩阵（一页，已定稿） |

## 2. 拆分的四条理由

1. **触发场景正交，合并稀释路由精度**。SKILL.md 的 `description` 是 agent 的加载依据（父 `design.md:200-202` 模板要求"明确触发场景"）。S3 的触发词面是"宿主差异 / 版本门禁 / host-bridge / 跨宿主兼容"，S6 是"浏览器 / Playwright / MCP / E2E 验证"。合并后一个 description 必须同时覆盖两类词面，**误触发与漏触发同时上升**——skill 体系失效的常见形态恰恰是"永不触发"（P-4 的静默失效同源）。
2. **内容稳定性不同，维护节奏冲突**。S3 素材随宿主版本演进必然漂移：Host Bridge 按宿主版本号做门禁（`supportedPackageVersions: ["1.18.0"]`，`research/07` §2.2），宿主一升级即需复核（P-13：内部实现随版本可改）。S6 素材是 D5 用户裁定后的**稳定分工约定**（回归=Playwright、诊断=MCP），几乎不随宿主版本变化。合并会把稳定约定绑在高频漂移内容上，每次宿主升级都要连带复审 Automation 部分——维护成本无谓叠加。
3. **素材体量悬殊，合并破坏渐进披露**。S3 素材是四宿主 × {服务端插件机制、Host Bridge 门禁、安全姿态} 的验证矩阵（`research/07` 全文）；S6 素材是本任务 `deliverables/03` 的一页分工矩阵 + 反模式清单。合并后 SKILL.md 超长，违背 skill 渐进披露原则（主文档保持可扫描，细节下沉 references/）。
4. **两者的"下一步动作"不同**。S3 被触发后的产出是**代码决策**（用可移植子集还是桥接层、L0-12 判定）；S6 被触发后的产出是**工具操作**（写 Playwright 用例 / 发起 MCP 会话，且必须先过 `04-test-dev-rules.md` §2 的端口断言）。动作类型不同，检查清单无法共用。

## 3. 边界澄清（判定时一并固定，防后续误并）

- **S6 与 S4（`tavern-instance-safety`）的关系**：E2E 场景下两者常同时触发，但 S4 是**纪律**（对哪个实例、什么禁止——MUST 红线），S6 是**工具手册**（怎么自动化）。若未来为精简 skill 数量而合并，**正确方向是 S6 并入 S4，而非并入 S3**；且合并前提是 S6 素材不足以独立成篇（当前已足：分工矩阵 + 反模式 + 端口断言衔接）。
- **S6 引用 S4 的纪律而不是复制**：S6 内对"只连 Dev / 端口白名单"只放一句话 + 指针（指向统一规则 L1-MF-6 与 `deliverables/04` §2），遵循 `05-experience-retention.md` §2 去重铁律。
- **S3 与统一规则 L0-12 的分工**：L0-12 是规则正文（"跨宿主插件禁用 Host Bridge"），S3 是**操作知识**（逐宿主现状表、版本门禁机制、可移植子集清单）。规则进 L2 真源，操作流程进 L3 skill——四层载体各归其位（`05-experience-retention.md` §1）。

## 4. 重新评估合并的触发条件（任一成立时再议）

1. S3 或 S6 任一方的可用素材缩减到无法支撑独立 SKILL.md（触发场景 + 操作步骤 + ≥1 条真实坑）。
2. 两者的触发场景在实际使用中出现 ≥3 次同会话双加载，且引用交叉率 > 50%。
3. 用户明确要求精简 skill 数量。

## 5. 后续编写归属（不在本任务执行）

- 两个 skill 的**实际编写**归父任务队列 Batch 3-5 的 F-5 项（父 `implement.md:224`），本任务只交付本判定。
- 编写时素材路径：S3 ← `research/07` + `research/06` §5.2；S6 ← 本任务 `deliverables/03`（分工矩阵）、`deliverables/04` §2（端口断言）。
- 落点与 symlink 惯例按父 `design.md` §3.1–3.2 执行；本任务**不创建**任何 skill 文件。

---

## 6. 回源索引

| 本文结论 | 回源位置 |
|---|---|
| S3/S6 定位与"可能重叠、R5 后判定"的原始约定 | 父任务 `design.md:193/196/199` |
| F-5 判定归属本任务 | 父任务 `implement.md:218/224` |
| Host Bridge 版本门禁随宿主版本漂移 | `research/07` §2.2（`host-bridge-service.ts:236-252`） |
| S6 素材（D5 两者并用裁定） | `research/13` Batch 2-A；本任务 `deliverables/03` §1 |
| 跨宿主禁用 Host Bridge 的规则正文 | 统一规则 L0-12（本仓 `AGENTS.md`「L0-12」节） |
| 两个 skill 均未创建（现状） | `~/.agents/skills/` 目录列举（2026-09-24） |
