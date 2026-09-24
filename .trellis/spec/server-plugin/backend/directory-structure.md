# Directory Structure — `@stdo/server-plugin`

> 目录布局与模块组织规则。总览见 [index](./index.md)。

---

## 目录布局（实测）

```
packages/server-plugin/src/
├── index.ts             # 插件入口（init / exit），webpack-safe 对外导出（:14）
├── constants.ts         # 限额与内置 job 常量
├── runtime.ts           # AuthorityRuntime：聚合全部 service 的组装根
├── routes.ts            # 路由注册中枢 + 响应封装 ok()/fail() + 错误规范化
├── routes/              # 按域拆分的 route 模块（11 个，含测试）
│   ├── sql-routes.ts / storage-routes.ts / trivium-routes.ts
│   ├── jobs-events-routes.ts / http-routes.ts / host-routes.ts
│   ├── module-routes.ts / agent-routes.ts / agent-history-routes.ts
│   ├── st-manager-routes.ts
│   └── authority-route-context.ts   # route 上下文公共类型
├── services/            # 业务服务（80+ 文件，与实现同目录放 *.test.ts）
├── events/
│   └── sse-broker.ts    # SSE 事件流实现
├── store/
│   └── authority-paths.ts  # 数据路径标准化/隔离解析
├── agent-cli.ts         # agent.cjs 独立恢复 CLI 的共享逻辑
├── types.ts             # AuthorityRequest / AuthorityResponse / AdminUpdate* 等本包私有类型
├── utils.ts             # getUserContext / getSessionToken / AuthorityServiceError / asErrorMessage
└── version.ts
```

---

## 模块组织规则

1. **新能力按"route 模块 + service 模块"成对组织**：route 只做参数解析、权限检查调用、service 调用与响应封装；业务逻辑进 `services/`。参照 `routes/sql-routes.ts` + `services/storage-service.ts` / `services/trivium-service.ts` 的现有模式。
2. **route 注册集中在 `routes.ts`**：新增 route 模块后在 `routes.ts` import 并在 `registerRoutes` 内挂接（参照 `packages/server-plugin/src/routes.ts:36-47` 对 10 个 register* 的调用方式）。禁止在业务文件里自取 router。
3. **服务依赖通过 `AuthorityRuntime` 组装**：所有 service 在 `runtime.ts` 中构造并互相引用；新增 service 加入 runtime，而不是模块级单例。
4. **测试与实现同目录**：如 `services/permission-service.test.ts`、`routes/jobs-events-routes.test.ts`、`utils.test.ts`。由 Vitest 从仓根统一收集（`vitest.config.ts:6-11` 排除 `dist/managed/runtime`）。

---

## 命名约定

- route 文件：`<domain>-routes.ts`；service 文件：`<domain>-service.ts`；测试：同名 + `.test.ts`。
- 类型：本包私有类型进 `types.ts`；跨层 DTO 一律进 `packages/shared-types/src/`（本包 `routes.ts:1-31` 的 import 面是现成范例）。
- 常量：限额/内置值进 `constants.ts`（带行号引用的现成清单见 [index](./index.md)）。
