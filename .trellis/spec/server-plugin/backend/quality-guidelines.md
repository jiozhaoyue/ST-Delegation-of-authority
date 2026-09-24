# Quality Guidelines — `@stdo/server-plugin`

> Route / service 编写质量规范与禁区索引。总览见 [index](./index.md)。

---

## 写代码前检查清单

1. **类型**：跨层 DTO 是否已进 `packages/shared-types/src/`？（本包 import 面范例：`packages/server-plugin/src/routes.ts:1-31`）
2. **权限**：新 route 是否调用了 `PermissionService`（`services/permission-service.ts:40`，`authorize` :166 / `evaluate` :81）？权限判定顺序不可改序（`docs/server/capabilities-and-isolation.md` §3，行 42-64）。
3. **审计**：重要写操作是否走 `fail()` / 审计服务（`services/audit-service.ts`）？
4. **路径**：任何数据路径是否经 `store/authority-paths.ts` 解析？
5. **联动**：core / SDK / installable 三层是否需要同步改？（联动矩阵见 [index](./index.md) 第 7 条）
6. **构建**：webpack 打包（`packages/server-plugin/webpack.config.cjs`）——不要引入 webpack 无法静态处理的运行时动态依赖；从磁盘加载外部模块一律走 `services/companion-module-loader-service.ts`（其 `loadCompanionModuleFromDisk` 是专为绕开 bundle 期 `__webpack_require__` 设计的，见 `packages/server-plugin/src/index.ts:6-14` 的文档注释）。

---

## 六条禁区（要点索引）

原文与详细理由：`docs/server/ai-integration-guide.md` §6.1–6.6（行 229-302）。

1. 不让浏览器直连 `authority-core`（端口非固定、token 不出后端、绕过治理）。
2. 不绕过 `PermissionService`（会破坏管理员策略、grant 行为与 Security Center 一致性）。
3. 不手写路径碰数据文件（SQL / `.tdb` / Blob 布局不是稳定合同）。
4. 不把 `trivium.private` 当 embedding 服务——调用方必须自己传 `vector`。
5. 不把 `jobs.background` 当任意代码执行平台——内置类型仅 `delay` / `sql.backup` / `trivium.flush` / `fs.import-jsonl`（`packages/server-plugin/src/constants.ts:73`）。
6. 不把 Trivium mapping integrity 路径当业务热路径（`stat({includeMappingIntegrity})` / `checkMappingsIntegrity` / `deleteOrphanMappings` 只用于 diagnostics / maintenance）。

---

## 反模式（本仓明确避免）

- **模块级可变单例**：服务状态一律经 `AuthorityRuntime`（`src/runtime.ts`）组装与注入；`src/index.ts:22` 的 `runtime` 持有是唯一例外（插件生命周期需要）。
- **route 里做业务决策**：route 只做解析/检查/转发；权限决策进 `PermissionService`，策略进 `services/policy-service.ts`。
- **自定义分页 envelope**：见 [index](./index.md) 第 8 条。
- **把启动失败抛出去**：非关键启动步骤（host bridge、module discovery、agent session 恢复）失败只 `console.warn` 不阻断（`src/index.ts:28-46` 的既有模式）。

---

## 验证

```bash
npm run typecheck
npm test                       # vitest（本包测试与实现同目录）+ cargo test
npm run sync:installable && npm run check:installable   # 触发 installable 条件时
```
