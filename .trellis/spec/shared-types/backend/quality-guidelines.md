# Quality Guidelines — `@stdo/shared-types`

> 类型质量规范。总览见 [index](./index.md)。

---

## 写代码前检查清单

1. **这是不是跨层合同？** 只有被 ≥2 个包消费的类型才进本包；单包私有类型留在该包（如 server-plugin 的 `types.ts`、sdk-extension 的 `security-center/types.ts`）。
2. **有没有现成类型可复用？** 先查 `index.ts:2-21` 已导出的 20 个域；分页一律 `CursorPageRequest/CursorPageInfo`（`src/common.ts`），不要发明新 envelope。
3. **命名是否符合既有模式？** `Authority<域><动作>Request/Response`、`XxxRecord`、`XxxEntry`（对照 `src/permissions.ts`）。
4. **字段是否向后兼容？** limits/transfer 兼容字段不可删（`docs/server/ai-integration-guide.md` §2.7，行 118-149）。
5. **是否需要版本联动？** 版本号只经 `src/version.ts` + `npm run version:sync`。

---

## 类型书写规范

- 全部 `export type` / `export interface`，运行时值只有 `AUTHORITY_VERSION`。
- 联合类型显式列出枚举值（`AuthorityErrorCode` / `AuthorityErrorCategory` / `AuthorityPermissionErrorCode`），不写裸 `string`。
- 可选字段必须语义明确（`?` vs `| null` 按既有域文件风格，对照 `src/storage.ts`）。
- 新域文件进 `index.ts` 的字母序位置。

---

## 反模式

- 在本包写函数/类（唯一例外 `version.ts`）。
- `any` / 未标注的宽松结构——`npm run typecheck` 必须零新增告警。
- 从 `packages/server-plugin` / `packages/sdk-extension` import 类型（依赖方向只能单向：它们 → 本包）。

---

## 验证

```bash
npm run typecheck    # 主验证：tsc -b 会连带检查全部消费方
npm test
```
