# 研究产出索引（供子代理按需读取）

> 本任务共 12 份研究产出。**大文件未内联进子代理提示词**（超出 `context_injection.max_file_bytes = 32768`，内联会被截断），
> 请按下表**按需用 Read 读取**，不要假设已知其内容。
> 另注意总注入上限 `max_total_bytes = 131072`，故清单只内联实现直接依赖的少数文件。

| 文件 | 体积 | 内容 | **何时读** |
| --- | --- | --- | --- |
| `00-requirements-inventory.md` | 13 KB | 用户全部草稿需求逐条转录（A 元任务 / B0 核心主张 / B1-B12 业务需求 / C 需求簇 / D 开放问题） | 需要核对某条业务线的**原始意图**时 |
| `01-rules-my-repo.md` | **42 KB** | My-repo 7 仓自定义规则：12 条跨项目共性 + 6 个非空子项目明细 + 7 条存疑 | 编写 **L1-My-repo** 段时，读对应小节 |
| `02-rules-myfork.md` | **36 KB** | Myfork 3 仓规则：10 条共性 + 逐项目亮点（PureTavern「尽量少调用子agent」、Timelines Git 政策、ST-DoA 四层职责边界） | 编写 **L1-Myfork** 段时 |
| `03-rules-js-slash-runner.md` | **42 KB** | JSSR 5 仓规则：20 条共性（DOMContentLoaded 禁令、iframe 适配、teleportStyle/tailwind 互斥、zod4 约定、MVU 目录、符号链接真源、chrome-devtools MCP） | 编写 **L1-JSSR** 段时 |
| `04-plugin-authority.md` | 24 KB | Authority 能力契约：三层架构、12 命名空间、26 Feature Flag、权限 7 级判定、Companion Modules | 编写 **S2 skill** 或做插件接入时 |
| `05-luker-dev-docs.md` | **131 KB** | Luker 官方开发文档全量（22 个开发页）；三层 API 惯例、`{ok,reason,hint}` 信封、patch-first | 编写 **S1 skill** 时按主题查页，**勿整体读取** |
| `06-dev-env-instances-ports.md` | 20 KB | 实例端口实测：8001-8004、Real\Luker 安全现状、Dev\Luker origin 误指、TauriTavern 须编译、Playwright/MCP 现状 | 编写 **C-06 环境规则**、处理 **N-1..N-6** 时 |
| `07-authority-host-compat-verification.md` | 10 KB | **C-08 关键路径结论**：四宿主可用性 + 逐字节同形证据 | **已内联**（硬约束来源） |
| `08-prior-unified-rules-archaeology.md` | 6.7 KB | **前作四个致命伤** + 8 条硬性要求 | **已内联**（反面教材） |
| `09-consolidated-rules-and-distribution-precedents.md` | 10.8 KB | **L0 12 条 + L1 三仓群差异 + 两种分发范式实证对比** | **已内联**（规则内容主体） |
| `10-trellis-integration-and-plugin-governance.md` | 10.9 KB | Trellis 集成结论 + 插件统一调控四层原语与注册表缺口 + 任务全集 | **已内联** |
| `11-harness-build-and-target-survey.md` | 6.5 KB | **执行阶段产出**：真源仓建设结果、15 仓实勘表（含两处研究偏差修正）、检索先行双通道结果、沙箱 24 项断言、全量 dry-run 结果、脱敏决策、待批准事项 | 处理 C-1…C-12 / D-1…D-6 / E 阶段时**先读本文** |
| `12-backlog-and-handoff.md` | 9 KB | **交接入口**：任务状态总览、已交付清单、待办全集（P0/P1/P2）、待用户裁定项、每个待办的开工方法、红线与纪律 | **接手本任务前必读** |

---

## 使用提醒

1. **不要凭文件名的印象作答**——需要某仓群的具体规则时，先 Read 对应文件再写。
2. `05` 达 131 KB，**禁止整体读取**；它按 VitePress 页面分节，请用 Grep 定位主题后再读片段。
3. 所有研究文件中标注为「存疑」「未获取」「未验证」的条目**不得当作事实使用**，
   需要时先回源核对（回源方法见各文件末尾的证据节）。
