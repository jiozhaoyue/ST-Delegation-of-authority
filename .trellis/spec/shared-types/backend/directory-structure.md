# Directory Structure — `@stdo/shared-types`

> 一域一文件。总览见 [index](./index.md)。

---

## 布局（实测）

```
packages/shared-types/src/
├── index.ts            # 唯一出口：AUTHORITY_VERSION + 全域 export type *（:1-21）
├── version.ts          # AUTHORITY_VERSION 常量
├── common.ts           # 错误载荷 / 分页 / feature flags / 内联阈值类型
├── permissions.ts      # 权限评估族
├── probe.ts            # probe / init 配置族
├── sql.ts  storage.ts  transfers.ts  private-fs.ts  trivium.ts  http.ts
├── jobs.ts  agent.ts  modules.ts  control.ts  diagnostics.ts
├── admin-packages.ts  native-migration.ts  workspace-history.ts
├── host.ts             # 聊天记录事务（AuthorityHost* 族）
└── session.ts
```

## 规则

1. **新增域 = 新文件 + `index.ts` 一行 `export type * from './<域>.js'`**（参照 `packages/shared-types/src/index.ts:2-21` 的 20 个域条目）。
2. **文件按业务域命名**（小写单词），不按层命名（无 `-types.ts`、`-dto.ts` 后缀）。
3. **类型与实现分离**：本包不写运行时逻辑（唯一例外 `version.ts` 常量）。
4. 消费方固定 `import type ... from '@stdo/shared-types'`（workspace 名，见根 `package.json` 的 `workspaces: ["packages/*"]`）。

---

## 模块组织

新能力的新 DTO 落到既有域文件或新建域文件，随后在 `index.ts` 的字母序位置加一行 `export type * from './<域>.js'`。跨层合同变更时按 `../index.md` 的联动清单走完 8 步。

## 命名规则

- 文件：业务域小写单词（`workspace-history.ts` / `native-migration.ts`），不按层命名。
- 类型：`Authority<域><动作>Request/Response`、`XxxRecord` / `XxxEntry`（对照 `src/permissions.ts`）。

## 参考范例

- 域文件 + 全量导出：`packages/shared-types/src/index.ts:1-21`（`AUTHORITY_VERSION` + 20 个 `export type *`）。
- 既有域文件样板：`src/permissions.ts`（权限族）、`src/common.ts`（错误载荷 + 分页）。
