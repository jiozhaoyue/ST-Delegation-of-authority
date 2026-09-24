# Registry Guidelines — `@stdo/server-plugin`

> 插件注册表（L12 只读发现层）编写规范：扫描纪律、缓存策略、冲突规则表、静态宿主矩阵维护。总览见 [index](./index.md)。

---

## 职责与边界

插件注册表回答「装了哪些扩展、哪些在用 Authority、相互依赖什么、有无冲突、在四个宿主上各可用什么」。它是**纯只读聚合层**，L12 裁定「能力治理 ≠ 插件管理」：不做安装/卸载/启停，不新造执行机制。

- 实现：`services/extension-registry-service.ts`（扫描 + 聚合 + 冲突检测 + 缓存）、
  `services/host-capability-matrix.ts`（静态宿主矩阵）、`routes/registry-routes.ts`（三端点）。
- DTO 唯一来源：`packages/shared-types/src/registry.ts`（index 约定第 2 条）。
- registry 端点走**会话鉴权**（`assertSession`），不调 `PermissionService`——registry 数据是
  Authority 自身元数据，不属于任何扩展声明的能力面（L1-MF-9 ② 对本层不适用，裁定见任务 design §2.3）。

---

## 扫描纪律（铁律，与 module-discovery 同款）

`extension-registry-service.ts:42-47` 定义 `SKIP_DIRECTORY_NAMES`（node_modules / dist / .git / target），
`:143` 逐条过滤 `isSymbolicLink()`。全程**零 require / 零 eval**，唯一读盘动作是每个扩展目录的
`manifest.json`（`:200-217`），解析失败只记 `manifest_unreadable` warning diagnostic，**绝不中断扫描**。

改扫描逻辑时不得突破：

1. 不执行任何扩展代码（不 require 入口、不 import manifest 里的字段以外的文件）；
2. 不跟随符号链接；不递归嵌套（只扫 third-party 一级子目录）；
3. 跳过四类目录；单扩展失败 → diagnostic 继续（AC-7，测试 `extension-registry-service.test.ts` 覆盖）。

扫描根经 `resolveSillyTavernRoot` 候选链解析（`registry-routes.ts:32` 注入
`runtime.install.getSillyTavernRoot`），失败时返回空清单 + 已注册记录，不抛错。

---

## 三来源依赖聚合

每扩展的 `dependencies` 按能力粒度聚合，`sources` 标注来源（`buildRecord`，`:233-282`）：

| 来源 | 数据面 | 映射 |
|------|--------|------|
| `manifest` | companion module `manifest.transactions[*].requiredResources[].resource` | `RESOURCE_PREFIX_TO_CAPABILITY`（`:50-62`，权限资源前缀 → 9 能力） |
| `session` | 会话注册的 `declaredPermissions` | `capabilitiesFromDeclaredPermissions`（`:390-424`） |
| `observed` | 审计日志只读聚合（**不新埋点**） | `AUDIT_KEYWORD_TO_CAPABILITY` 宽松文本匹配（`:65-76`） |

注意：`modules.execute` 不映射为独立能力（`:416-419` 有意跳过）；observed 是启发式信号，只用于展示，不参与权限决策。

---

## 冲突检测四规则

`detectConflicts`（`:305-387`）纯静态规则，不仲裁不执行：

| kind | severity | 触发 |
|------|----------|------|
| `duplicate_module_id` | error | 两个扩展声明同一 moduleId（`:336-346`） |
| `duplicate_transaction` | error | 不同模块声明同名事务（`:356-366`） |
| `protocol_mismatch` | warning | module protocolVersion ≠ `AUTHORITY_MODULE_PROTOCOL_VERSION`（`:325-333`，同时记入该记录 diagnostics） |
| `unsupported_capability_on_host` | warning | 依赖集中存在某宿主上 `absent` 的能力（`:368-386`，如 PT 上声明 fs） |

新增规则时：只加静态判定，保持「输出 conflict 列表带严重度」的形态，不做任何自动修复动作。

---

## 静态宿主矩阵维护约定

`host-capability-matrix.ts` 的 `HOST_MATRIX`（`:31-42`）是**随代码版本化分发的静态数据，禁止运行时探测**。
来源固化：`docs/server/capabilities-and-isolation.md` + 四宿主实测（research/07）。

当前事实：ST 1.18.0 全支持（含 host-bridge）；Luker 2.7.0 核心能力 supported 但 host-bridge `absent`；
PT 0.1.12 / TT 2.2.0 无服务端插件基建，九能力全 `absent`。

推算函数 `estimateForHost`（`:57-80`）语义：空依赖 → `supported`；全 absent → `absent`；
supported 与 absent 混合 → `degraded`。宿主能力面变化时只改 `HOST_MATRIX` 数据，不改推算逻辑。

---

## 缓存、单飞与每用户实例

- 缓存无 TTL，唯一失效入口是 `refresh()`（admin 门禁路由触发）；**不做 fs.watch**（L12 规模控制）。
- 首次 `list()` 懒扫描，并发调用共享 in-flight promise（单飞合并，`:98-109`）。
- **每用户一个 registry 实例**：`runtime.registries: Map<handle, ExtensionRegistryService>`
  （`registry-routes.ts:28-65`）——每用户 control DB 隔离，refresh 互不影响。

---

## 路由鉴权顺序（勿调换）

`registry-routes.ts:97-112`：refresh 端点**先** `user.isAdmin` 门禁（403 `admin_required`，
此路径不调 assertSession）**再** `assertSession`。该顺序被 `registry-routes.test.ts` 断言
（非管理员 403 时 `assertSession not called`）。GET 两端点走常规 assertSession；详情对未知
extensionId 返回 404 `extension_not_found`（`:87-90`）。

---

## 常见坑

- `SessionExtensionInfo.id`（不是 `extensionId`）——ControlExtensionRecord 的字段名。
- tsconfig `exactOptionalPropertyTypes: true`：省略可选字段时别显式传 `undefined`。
- SDK 侧数据调用（Security Center `loadRegistrySnapshot` 等）必须显式传 `sessionToken`——
  registry 路由要求会话头，与 `/admin/*` 的宿主中间件路径不同。
- 新增公开 route 后必须同步 `routes.test.ts` 的「完整路由面」清单（按 routes.ts 实际挂载顺序排列）。

---

## 验证

```bash
npm run typecheck
npx vitest run packages/server-plugin   # service 15 用例 + routes 6 用例
npm run sync:installable && npm run check:installable   # SDK 源码变时必跑（index 第 7 条）
```
