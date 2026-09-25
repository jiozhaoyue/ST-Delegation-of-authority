# Backend 规范 — `@stdo/shared-types`（类型唯一真源）

> 本包是全仓**唯一的跨层 DTO / 类型来源**。本包没有运行时逻辑——"backend"层即类型定义本体；"frontend"层说明类型被 UI 消费的方式（见 [../frontend/index.md](../frontend/index.md)）。

---

## 职责边界

- 全部跨层数据合同（请求/响应 DTO、错误载荷、权限描述、feature flags、版本常量）都在这里定义；`packages/server-plugin`、`packages/sdk-extension`、`packages/example-extension` 三方 `import type` 自本包（证据：`packages/server-plugin/src/routes.ts:1-31`、`packages/sdk-extension/src/api.ts:2`、`packages/sdk-extension/src/index.ts:43-50`）。
- "所有 DTO 都经过 `shared-types`" 是 AI 生成代码的边界铁律之一（`docs/server/ai-integration-guide.md` §8，行 338-347）。
- **新增公开能力的第一步就是本包加 DTO**（8 步顺序第 1 步，同文件 §7.1，行 306-317）。

---

## 目录与关键文件

```
packages/shared-types/src/
├── index.ts        # 全量再导出（type * from 各域文件），本包唯一运行时入口
├── version.ts      # AUTHORITY_VERSION（单一版本来源，随 npm run version:sync 联动）
├── common.ts       # AuthorityErrorPayload / CursorPageRequest / CursorPageInfo / feature flags
├── permissions.ts  # PermissionEvaluateRequest / PermissionEvaluateResponse / Decision / Descriptor
├── probe.ts        # AuthorityProbeResponse / AuthorityInitConfig
├── sql.ts / storage.ts / transfers.ts / private-fs.ts / trivium.ts / http.ts
├── jobs.ts         # job 类型与队列 DTO
├── agent.ts        # Agent session / run / tool DTO（最大域之一）
├── control.ts / diagnostics.ts / admin-packages.ts / modules.ts
├── host.ts         # 聊天记录事务 DTO（AuthorityHost* 族）
├── session.ts / native-migration.ts / workspace-history.ts
```

`index.ts` 采用 `export type * from './<域>.js'` 的全量面（`packages/shared-types/src/index.ts:2-21`），加 `export { AUTHORITY_VERSION } from './version.js'`（:1）。

---

## 必须遵守的约定（带证据）

1. **一域一文件**：新能力的新 DTO 建新域文件或入既有域文件，然后在 `index.ts` 加一行 `export type * from './<域>.js'`。禁止从 `server-plugin` / `sdk-extension` 反向导入类型。
2. **分页合同复用**：新列表接口用 `CursorPageRequest` / `CursorPageInfo`（`src/common.ts`）；"不要为 audit / jobs / events / SQL / Trivium 再发明分页 envelope"（`docs/server/ai-integration-guide.md` §2.6，行 104-116）。
3. **错误载荷合同**：`AuthorityErrorPayload`（`src/common.ts`）字段 `error` / `code` / `category` / `details`——server-plugin 的 `fail()` 与 SDK 的错误类都按它分类（`packages/server-plugin/src/routes.ts:59-79`、`packages/sdk-extension/src/api.ts:29-47` 附近）。改此结构必须三层联动。
4. **limits / transfer 语义**：三个层级的字段在 DTO 中并存（hard ceiling / `effectiveInlineThresholdBytes` 真正生效 / `effectiveTransferMaxBytes` 兼容保留），不要删"看似冗余"的兼容字段（`docs/server/ai-integration-guide.md` §2.7，行 118-149）。
5. **权限描述**：新权限资源必须同步 `src/permissions.ts` 的 Descriptor/Request 族，且服务端 `PermissionService`（`packages/server-plugin/src/services/permission-service.ts:296` 起 `getDeclarationDecision` 等）与文档 `docs/server/capabilities-and-isolation.md` §1-§2（行 11-40）联动。
6. **版本常量单一来源**：`src/version.ts` 导出 `AUTHORITY_VERSION`；`npm run version:sync`（`scripts/versioning.mjs`）是它的同步机制。任何包内不得硬编码版本号。
7. **命名**：请求 `Authority<域><动作>Request`，响应 `Authority<域><动作>Response`，记录 `XxxRecord`，实体 `XxxEntry`（以 `src/permissions.ts` / `src/storage.ts` 既有命名为准）。

---

## 常见坑

- **改 DTO 漏联动**：本包一改，`npm run typecheck`（`tsc -b`）会暴露全部受影响点——必须清零才算完成，不允许用 `any` 压报错。
- **installable 同步**：本包变更会进入 server-plugin / sdk-extension 的编译输出，属 installable 触发条件（`docs/server/ai-integration-guide.md` §5，行 208-227）→ `npm run sync:installable && npm run check:installable`。
- **类型文件不写运行时代码**：除 `version.ts` 常量外不放函数/类；跨层共享的运行时工具不属于本包。

---

## 验证命令

```bash
npm run typecheck        # tsc -b：类型合同变更的主验证
npm test                 # 全量回归（server-plugin/sdk-extension 的测试消费这些类型）
npm run sync:installable && npm run check:installable
```

---

## 主题文件

| 文件 | 内容 | 状态 |
|------|------|------|
| [Directory Structure](./directory-structure.md) | 一域一文件与 index 全量导出 | 已填实 |
| [Database Guidelines](./database-guidelines.md) | 不适用声明 | 已填实 |
| [Error Handling](./error-handling.md) | `AuthorityErrorPayload` 合同 | 已填实 |
| [Quality Guidelines](./quality-guidelines.md) | 类型质量规范 | 已填实 |
| [Logging Guidelines](./logging-guidelines.md) | 不适用声明 | 已填实 |
| [Capability Lifecycle](./capability-lifecycle.md) | **能力生命周期与登记真源（跨层规范）**：4 态阶段模型、五套词汇表的收敛、三条漂移断言 A1/A2/A3、废弃流程与过渡期 | 已填实 |
