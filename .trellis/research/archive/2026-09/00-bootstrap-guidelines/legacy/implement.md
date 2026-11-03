# Implement 记录 — 00-bootstrap-guidelines（Batch 4-A 执行）

> 执行者：父任务 `09-21-multi-repo-rules-skills-survey` 的 trellis-implement 子代理（Batch 4-A）。
> 执行日期：2026-09-24。本文件按执行时序记录，复选框为收尾时如实勾选。

---

## 执行步骤

- [x] 1. 读取 bootstrap `prd.md`、`.trellis/workflow.md`、10 个 spec 索引模板现状
- [x] 2. 读取父任务研究成果：`research/09-consolidated-rules-and-distribution-precedents.md`（L0/L1 归纳）、`research/02-rules-myfork.md`（ST-DoA 专项节）、`research/04-plugin-authority.md`（本仓架构证据）
- [x] 3. 代码取证（本仓 CLAUDE.md + docs/server/*.md + 各包源码 + scripts），确认真实路径与行号
- [x] 4. 灌入 `server-plugin`（backend index + 5 主题；frontend 不适用声明）
- [x] 5. 灌入 `sdk-extension`（backend + frontend 两层均有真实内容）
- [x] 6. 灌入 `shared-types`（backend 真实内容；frontend 消费指引）
- [x] 7. 灌入 `example-extension`（backend 不适用；frontend 接入示范）
- [x] 8. 灌入 `authority-core`（backend index + 5 主题）
- [x] 9. 定制 `guides/index.md`（追加"本仓特有的跨层触发点"7 条）
- [x] 10. 自查：占位符 grep 0 命中；TRELLIS:START 泄漏 0 命中；修复 4 个文件的模板残留尾节
- [x] 11. bootstrap `prd.md` 复选框勾选 + 完成记录与边界裁定

---

## 权威边界执行情况

- spec 内**零整段复制**统一规则块正文；通则仅一句话引用（如"见本仓 `AGENTS.md` 统一规则块 L1-MF-8 / L0-10 / L0-12 / L1-MF-5 / L1-MF-13 / P-9 / P-13"）。
- 六条 AI 禁区只写一句话要点索引，原文位置指向 `docs/server/ai-integration-guide.md` §6.1–6.6（行 229-302），未复制正文。
- **未裁定任何包"由规则块覆盖、spec 不另立"**，不建议改走选项 (c)（理由见 prd.md 完成记录）。

---

## 规范条目回源证据表（抽样 ≥10 条）

| # | spec 条目 | 回源（路径 + 行号/命令） |
|---|---|---|
| 1 | 四层职责边界 | `docs/server/ai-integration-guide.md:367-369`（§10） |
| 2 | 公开/内部路径判别 | `docs/server/ai-integration-guide.md:171-190`（§3.2）；`packages/sdk-extension/src/api.ts:5`（`AUTHORITY_API_BASE`） |
| 3 | 启动顺序 | `packages/server-plugin/src/index.ts:24-47`（registerRoutes :26 → install.bootstrap :27 → core.start :47） |
| 4 | 权限判定顺序 | `docs/server/capabilities-and-isolation.md:42-64`（§3）；实现 `packages/server-plugin/src/services/permission-service.ts:40,81,166,186` |
| 5 | 8 步新能力顺序 | `docs/server/ai-integration-guide.md:306-317`（§7.1） |
| 6 | installable 触发条件 | `docs/server/ai-integration-guide.md:208-227`（§5）；命令 `npm run sync:installable && npm run check:installable`；平台清单 `scripts/installable.mjs:28-34` |
| 7 | 六条 AI 禁区 | `docs/server/ai-integration-guide.md:229-302`（§6.1–6.6）；内置 job 类型 `packages/server-plugin/src/constants.ts:73` |
| 8 | 统一错误出口 fail() | `packages/server-plugin/src/routes.ts:59-79`；权限错误正则 :81-86 |
| 9 | SDK 全局对象与 init 去重 | `packages/sdk-extension/src/index.ts:7-10`；`packages/sdk-extension/src/sdk.ts:14-38` |
| 10 | AuthorityClient 12 命名空间行号 | `packages/sdk-extension/src/client.ts:529,545,555,568,610,614,623,629,640,644,650,658` |
| 11 | CSS 容器作用域 | `packages/sdk-extension/static/style.css:3-5`（三个根容器）；宿主变量回退 :31,:35 |
| 12 | SQLite PRAGMA 固定面 | `crates/authority-core/src/db.rs:10-34`（WAL + synchronous NORMAL + foreign_keys，:26-30） |
| 13 | core /v1 路由与就绪信号 | `crates/authority-core/src/main.rs:96-125`（v1_routes）；:190（`AUTHORITY_CORE_READY`）；:4230（stderr JSON） |
| 14 | 限额常量 | `packages/server-plugin/src/constants.ts:14-25`（KV 128KiB / Blob 16MiB / inline 256KiB） |
| 15 | 示例扩展最小权限声明 | `packages/example-extension/src/index.ts:33-52`；UI 注入 :54-63 |
| 16 | Host Bridge 版本门禁与语法检查目标 | `host-bridge/manifest.json:2-4,9` |
| 17 | Agent Session 日志不可变性 | `docs/server/agent-platform.md:43-69`（§Session 日志与恢复） |
| 18 | 测试命令与收集范围 | 根 `package.json` scripts；`vitest.config.ts:6-11`（排除 dist/managed/runtime）；`npm test` = version:sync + vitest + cargo test |
| 19 | 分页统一合同 | `docs/server/ai-integration-guide.md:104-116`（§2.6）；DTO `packages/shared-types/src/common.ts` |
| 20 | limits 三层语义 | `docs/server/ai-integration-guide.md:118-149`（§2.7） |
| 21 | shared-types 一域一文件 + 全量导出 | `packages/shared-types/src/index.ts:1-21` |
| 22 | 调试优先级链 | `docs/server/ai-integration-guide.md:349-365`（§9） |
| 23 | Cargo 技术栈 | `crates/authority-core/Cargo.toml`（edition 2024 / axum 0.8 / rusqlite 0.31 bundled / triviumdb v0.7.1 git tag） |
| 24 | Security Center 游标分页 UI | `packages/sdk-extension/src/security-center.ts:807-851,1454` |
| 25 | 安全更新只 `git pull --ff-only` | 本仓 `CLAUDE.md` 排障章；`docs/server/install-update-release.md` |

---

## 未完成 / 阻塞项

无。未触碰业务代码、未安装任何包、未执行任何 git 写操作、未写交付物清单以外的路径。
