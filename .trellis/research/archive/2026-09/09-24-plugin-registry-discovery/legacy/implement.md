# Implement：Authority 插件注册表与依赖矩阵（L12）只读发现层

> 前置：`prd.md`（需求）→ `design.md`（契约与服务设计）。按下列序号执行，**每完成一项立即勾选**（L0-2 铁律）。
> 验证命令统一在阶段尾集中跑，但每阶段完成后必须先过该阶段的验证再进下一阶段。

## Phase A：数据契约（shared-types）

- [x] A1. 新建 `packages/shared-types/src/registry.ts`：按 design §1.1 的完整 DTO 集
  （HostCapabilityLevel / AuthorityCapability / DependencySource / ExtensionDependencyEntry / ExtensionRegistryRecord /
  HostAvailabilityView / RegistryDiagnostic / RegistryConflict / RegistryListResponse / RegistryGetResponse / RegistryRefreshResponse）
- [x] A2. `packages/shared-types/src/index.ts` 导出 `* from './registry.js'`（对齐既有导出风格）
- [x] A3. 验证：`npm run typecheck` 过（此时无消费方，仅类型自洽）

## Phase B：服务层（server-plugin）

- [x] B1. 新建 `packages/server-plugin/src/services/host-capability-matrix.ts`：静态矩阵常量 + `estimateFor(capabilities, host)` 纯函数
- [x] B2. 新建 `packages/server-plugin/src/services/extension-registry-service.ts`：
  - 扫描（resolveSillyTavernRoot 候选链复用 → third-party 一级子目录 → manifest.json 读取 + diagnostics 容错）
  - 三来源聚合（module records / 会话 declaredPermissions / 审计 usage 只读聚合）
  - 冲突检测四规则（duplicate_module_id / duplicate_transaction / protocol_mismatch / unsupported_capability_on_host）
  - 缓存 + 单飞合并 + refresh
- [x] B3. 单测 `extension-registry-service.test.ts`：
  - manifest 读取失败 → diagnostic 记录继续（AC-7）
  - 重复 moduleId → error 级 conflict（AC-2）
  - 依赖集 × 宿主矩阵 → 「PT 上声明 fs」warning（AC-3）
  - 缓存：二次 list 不重扫；refresh 后重扫（AC-4 前半）
- [x] B4. 验证：`npx vitest run test/unit` 相关文件全绿 + typecheck

## Phase C：路由层（server-plugin）

- [x] C1. 新建 `packages/server-plugin/src/routes/registry-routes.ts`：三个端点
  （GET list / GET detail / POST refresh——refresh 走 `user.isAdmin` 门禁，403 非管理员）
- [x] C2. 挂载到 `http-routes.ts` 的 register 序列
- [x] C3. 单测 `registry-routes.test.ts`（鉴权 401 / 无会话拒绝 / refresh 非管理员 403 / 正常路径 200 / 未知 extensionId 404）
- [x] C4. 验证：vitest + typecheck

## Phase D：SDK 与 Security Center

- [x] D1. `packages/sdk-extension/src/client.ts` 增补三方法（listRegistry / getRegistryEntry / refreshRegistry）
  （实际形态为 `client.registry.{list,get,refresh}` 命名空间，非三个平铺方法；typecheck 已过）
- [x] D2. Security Center 新版块「插件注册表」：清单表 + 详情（依赖矩阵/跨宿主四格/diagnostics）+ 冲突视图（severity 分组）；
  类名双前缀、配色继承宿主变量（L0-10）
  （governance 区第 6 tab；registry-workbench.ts 渲染模块 + 6 渲染单测；routes.test.ts 路由面清单补 3 端点；
  vitest 全仓 650/653 绿〔3 skip 为既有〕）
- [x] D3. 验证：typecheck + build 全绿
  （typecheck ✓；TS 四包 build ✓〔shared-types/server-plugin/sdk-extension/example-extension〕；
  产物冒烟 ✓〔dist 内 grep registry-view/registry 引用〕。
  **例外**：`build:core` 因 TriviumDB git 依赖网络握手失败〔SSL schannel〕——本任务零 Rust 改动，缓存仓为空壳无法离线
  构建，属环境阻塞非代码回归；网络恢复后重跑 `npm run build:core` 即可，无本任务连带动作。）

## Phase E：文档、规范与收尾

- [x] E1. `docs/server/http-api.md` 增补 registry 三端点（含鉴权说明与响应示例）
  （§3.2 路由组加 3 行 + 新增 §4.8「插件注册表」详解：鉴权边界〔refresh 先 admin 后 session〕、
  RegistryListResponse/RegistryGetResponse/RegistryRefreshResponse 字段语义、扫描纪律、按用户缓存）
- [x] E2. `.trellis/spec/server-plugin/backend/` 新增 registry 规范页 + 更新 index
  （registry-guidelines.md：职责边界/扫描纪律/三来源聚合表/冲突四规则表/宿主矩阵维护/缓存单飞与每用户实例/鉴权顺序；
  index.md 主题文件表加行）
- [x] E3. 全量质量门：`npm run typecheck && npm run build && npm test`
  （网络恢复后重跑全绿：typecheck ✓；TS 四包 build ✓ + Rust release ✓〔2m20s〕；
  vitest 650 passed / 3 skipped〔既有 skip〕；cargo test 40 passed / 0 failed）
- [x] E4. installable 同步：`npm run sync:installable && npm run check:installable`（SDK 源码变 → 触发条件命中）
  （同步完成：managed/sdk-extension/** + managed/core/win32-x64/** + .authority-release.json 更新；
  check 结论 "Installable runtime is up to date." exit 0）
- [x] E5. AC 全量对照勾选（prd.md）+ journal 记录 + 归档
  （AC-1~7 全勾带证据；journal 追记二；归档 --skip-branch-validation）

## 回滚点

- Phase A-C：纯新增，revert 对应提交即可（design §5）。
- Phase D 起：SDK/installable 变更，回滚需连带 `sync:installable`（回滚后重跑一次同步恢复产物一致性）。

## 审查门

- Phase B 完成后：主会话自查扫描纪律（零 require/eval/符号链接/四类跳过目录）与单飞合并实现。
- Phase D 完成后：Security Center 版块冒烟（构建产物内 grep 新版块标识）。
- E3 全绿前不得进 E4。
