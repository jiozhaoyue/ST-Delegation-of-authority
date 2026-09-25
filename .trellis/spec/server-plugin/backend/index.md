# Backend 开发规范 — `@stdo/server-plugin`（Node adapter 公开层）

> 本文件是 sub-agent 在 `packages/server-plugin` 写代码前必读的规范入口。
> 文档语言遵循本仓约定为**中文**（覆盖 Trellis 模板默认英文，属有意决策）。

---

## 职责边界（先读这个）

本包是 Authority 的**公开服务端 API 层**（Node adapter）：插件生命周期、路由注册、会话、权限决策、审计、SDK 自动部署、core 进程管理、SSE 桥接都发生在这里。

四层职责与联动关系：**公开合同在 Node adapter（本包），权威执行在 Rust core（`crates/authority-core`），浏览器接入在 SDK（`packages/sdk-extension`），发布落地在 installable（`runtime/` + `managed/` + `.authority-release.json`）**。改任何一层都要检查另外三层是否需要联动。原文：`docs/server/ai-integration-guide.md` §10（行 367-369）。跨仓通则条目见本仓 `AGENTS.md` 统一规则块 L1-MF-8，此处不重复其正文。

**路径判别**：`/api/plugins/authority/...` = 公开 adapter 层（本包）；`/v1/...` = 内部 core 层（Rust，loopback）。**给前端写代码默认只碰第一种**。判断规则原文：`docs/server/ai-integration-guide.md` §3.2（行 171-190）。

**启动顺序**（`packages/server-plugin/src/index.ts:24-47`）：`createAuthorityRuntime()` → `registerRoutes(router, runtime)`（:26）→ `runtime.install.bootstrap()`（:27，部署 SDK + 校验 core）→ `runtime.hostBridge.bootstrap()`（:28）→ companion module discovery/load（:40-45）→ `agentSessions.start()`（:46，fire-and-forget）→ `runtime.core.start()`（:47）。新增启动逻辑必须保持"失败不阻断启动"的现有模式（统一 `console.warn` 记录，不抛出）。

---

## 目录与关键文件

```
packages/server-plugin/src/
├── index.ts            # 插件入口：init(router) / exit()，启动顺序见 :24-47
├── routes.ts           # 公开路由注册中枢：ok()/fail() 响应封装、错误规范化（:47-79）
├── routes/             # 按域拆分的路由：sql / storage / trivium / jobs-events / http /
│                       #   host / agent / agent-history / module / st-manager
├── services/           # 业务服务：core-service（core 代理）、permission-service（权限评估）、
│                       #   install-service、session-service、audit-service、agent-session-*（12 个）、
│                       #   module-host-service、host-bridge-service、storage-service、trivium-service 等
├── events/sse-broker.ts # SSE 事件流（不支持 WebSocket）
├── store/authority-paths.ts # 数据路径解析（唯一路径标准化入口）
├── constants.ts        # 限额常量：MAX_KV_VALUE_BYTES=128KiB（:14）、MAX_BLOB_BYTES=16MiB（:15）、
│                       #   DATA_TRANSFER_INLINE_THRESHOLD_BYTES=256KiB（:18）、
│                       #   BUILTIN_JOB_TYPES=['delay','sql.backup','trivium.flush','fs.import-jsonl']（:73）
└── runtime.ts          # AuthorityRuntime 聚合根（全部 service 的组装点）
```

HTTP API 清单以 `docs/server/http-api.md` 为准（§3 路由分组总览在行 63-205，§4 接口语义详解从行 207 起）。

---

## 必须遵守的约定（带证据）

1. **所有公开 route 必须有权限检查**。评估入口在 `packages/server-plugin/src/services/permission-service.ts`（`PermissionService` 类 :40；`evaluate` :81；`authorize` :166；`resolve` :186）。权限判定顺序不可改序：声明门控 → 管理员扩展覆盖 → 管理员默认(granted/denied/blocked) → 持久授权 → 会话授权 → 管理员默认(prompt) → 系统默认(granted)。原文：`docs/server/capabilities-and-isolation.md` §3（行 42-64）。
2. **所有 DTO 都来自 `@stdo/shared-types`**（见 `packages/server-plugin/src/routes.ts:1-31` 的 import 面）。禁止在本包自定义跨层 DTO。
3. **错误必须走统一规范化**：`fail()`（`routes.ts:59-79`）把异常转为 `AuthorityErrorPayload`（`code` / `category` / `details`），并写审计日志（permission 类错误走 `audit.logPermission`，其余走 `audit.logError`）。禁止在 route 里裸 `res.status().json()` 绕过该路径。
4. **重要写操作保留审计日志**（`services/audit-service.ts`）。
5. **路径必须经过标准化与隔离解析**（`store/authority-paths.ts`）；严禁手写路径拼接触碰 SQL / `.tdb` / Blob 文件布局。
6. **新增公开能力走 8 步顺序**：shared-types DTO → core 内部能力 → `CoreService` 代理 → server service/route（本包）→ SDK client → 文档/Security Center → 性能敏感项跑 `bench:core` + `bench:scale` → 测试与 installable 同步。原文：`docs/server/ai-integration-guide.md` §7.1（行 306-317）。新增 route 的 checklist：同文件 §4（行 191-206）。
7. **改 installable 的触发条件**：SDK 源码变 / server-plugin 编译输出变 / core 变 / release metadata 或 managed 逻辑变 → 必须跑 `npm run sync:installable && npm run check:installable`。原文：`docs/server/ai-integration-guide.md` §5（行 208-227）。运行时生成的 `.authoritypkg.zip` / diagnostic `.json.gz` 不是 installable 产物，禁止误提交。
8. **分页复用统一合同**：优先复用 `CursorPageRequest` / `CursorPageInfo`（`packages/shared-types/src/common.ts`），不要为 audit / jobs / events / SQL / Trivium 再发明分页 envelope。原文：`docs/server/ai-integration-guide.md` §2.6（行 104-116）。
9. **limits 三层区分**：core hard ceiling / adapter transport routing threshold（`effectiveInlineThresholdBytes`，真正生效）/ compatibility transfer-max（`effectiveTransferMaxBytes`，仅兼容保留）。原文：同文件 §2.7（行 118-149）。
10. **六条 AI 禁区**（只列要点，原文见 `docs/server/ai-integration-guide.md` §6.1–6.6，行 229-302）：①不让浏览器直连 authority-core；②不绕过 PermissionService；③不手写路径碰数据文件；④不把 `trivium.private` 当 embedding 服务（调用方必须自己传 `vector`）；⑤不把 `jobs.background` 当任意代码执行平台（仅 `constants.ts:73` 的 4 个内置 type）；⑥不把 Trivium mapping integrity 路径当业务热路径。

---

## 常见坑

- **漏联动**：最常见的遗漏是漏 `shared-types`、漏 SDK client、漏 route 层权限校验、漏 installable 同步——表现为"代码改了但前端看起来没更新"。排查顺序：`managed/sdk-extension/*` 是否同步 → `.authority-release.json` 是否更新 → 是否需要重启宿主。原文：`docs/server/ai-integration-guide.md` §9（行 349-365）。
- **接口不工作时的调试优先级**：`POST /api/plugins/authority/probe` → `core.state` 是否 `running` → session 是否有效 → 权限是否 granted → route 是否映射到 core → control audit 的 warning/error → installable 是否与源码一致（同文件 §9）。
- **Host Bridge 冲突静默**：`init()` 中 `hostBridge.bootstrap()` 返回 `conflict`/`error` 只 `console.warn`（`index.ts:28-31`），不阻断启动。排查宿主相关问题时先看这一条日志；宿主版本门禁见 `host-bridge/manifest.json:2-4`（`supportedPackageVersions`）与语法检查目标清单（同文件 :9）。
- **backpressure 语义**：`503` + `core_unavailable`/`job_queue_full`/`concurrency_limit_exceeded` + `category: core|backpressure` 时调用方应退避重试，不要当成 route 实现 bug。
- **测试文件同目录放置**：本包约定测试与实现同目录（如 `routes/routes.test.ts`、`services/permission-service.test.ts`、`utils.test.ts`），由 Vitest 从仓根统一收集（`vitest.config.ts:6-11` 排除 `dist/managed/runtime`）。

---

## 验证命令

```bash
npm run typecheck        # version:sync && tsc -b（改动 TS 侧后必跑）
npm test                 # version:sync && vitest run && cargo test（Rust 侧无改动也会全量跑）
npm run sync:installable # 触发 installable 条件时必跑
npm run check:installable
npm run bench:core       # 性能敏感改动（CI 门槛：平均 ≤150ms，P95 ≤300ms）
npm run bench:scale
```

---

## 主题文件

| 文件 | 内容 | 状态 |
|------|------|------|
| [Directory Structure](./directory-structure.md) | 目录布局与模块组织规则 | 已填实 |
| [Database Guidelines](./database-guidelines.md) | 数据访问边界（委托 core，本包不直连） | 已填实 |
| [Error Handling](./error-handling.md) | 统一错误合同与审计 | 已填实 |
| [Quality Guidelines](./quality-guidelines.md) | route 编写规范与禁区索引 | 已填实 |
| [Logging Guidelines](./logging-guidelines.md) | 审计日志与 console 约定 | 已填实 |
| [Registry Guidelines](./registry-guidelines.md) | 插件注册表（L12 只读发现层）：扫描纪律、缓存、冲突规则、宿主矩阵 | 已填实 |
| [Version Binding](./version-binding.md) | **版本绑定与公开面兼容（跨仓规范）**：版本面现状、能力集声明契约、返回形状固化清单、`protocolVersion` 兼容窗口、消费者改造点 | 已填实 |
