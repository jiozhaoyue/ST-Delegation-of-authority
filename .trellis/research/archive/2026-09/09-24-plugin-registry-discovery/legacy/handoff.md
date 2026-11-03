# 交接文档：09-24-plugin-registry-discovery（2026-09-24 收尾交接）

> 用户指令：「不要继续了，把当前状态全部写入 trelli 文档，并交接」→ 随后「继续」恢复 → 完成至 E1 →
> 「只做 trelli 交接」定稿。本文为最终交接状态，供下一会话无缝续做。
> 读序：本文件 → `prd.md` → `design.md` → `implement.md`。

## 一、任务定位

- Trellis 任务：`.trellis/tasks/09-24-plugin-registry-discovery`，状态 `in_progress`。
- 内容：Authority 插件注册表 L12 只读发现层（shared-types DTO → server service/route → SDK client → Security Center 版块 → 文档/spec → installable 同步）。
- **不改 Rust core**；registry 端点走会话鉴权（非 PermissionService，L1-MF-9 ②属「不适用」，见 design §2.3）。
- 执行模式：主会话直做（子代理端点 `DeepSeek-V4-Flash[free]` 连续 503 三轮后经用户确认转主会话）。

## 二、总体进度（对照 implement.md）

| 阶段 | 状态 |
| --- | --- |
| Phase A（shared-types DTO） | ✅ 完成 |
| Phase B（server service + 15 单测） | ✅ 完成 |
| Phase C（routes + 6 单测） | ✅ 完成 |
| Phase D1（SDK client `registry.{list,get,refresh}`） | ✅ 完成 |
| Phase D2（Security Center「注册表」版块 + 6 渲染单测） | ✅ 完成 |
| Phase D3（typecheck + build） | ✅ 完成（TS 侧；Rust core 见 §四环境阻塞） |
| Phase E1（http-api.md 三端点文档） | ✅ 完成 |
| **Phase E2（spec 规范页）** | ❌ **未做** |
| **Phase E3（全量质量门）** | ❌ **未做**（Rust 网络阻塞） |
| **Phase E4（installable 同步）** | ❌ **未做** |
| **Phase E5（AC 勾选 + journal 终版 + 归档 + 提交推送）** | ❌ **未做** |

**全部代码已落盘未提交**（提交范围见 §六）。

## 三、已完成工作清单（细节供 review，不再需要重做）

### 服务端（server-plugin）
- `packages/shared-types/src/registry.ts`（新）：全量 DTO。`index.ts` 加 `export type * from './registry.js'`。
- `packages/server-plugin/src/services/host-capability-matrix.ts`（新）：四宿主 × 10 能力静态矩阵 +
  `estimateForHost(capabilities, host)` 纯函数（全支持→supported / 全缺→absent / 空依赖→supported / 混合→degraded）。
- `packages/server-plugin/src/services/extension-registry-service.ts`（新）：扫描
  （`resolveSillyTavernRoot` 候选链 → third-party 一级子目录 → `manifest.json` 读取容错；零 require/eval、
  不跟随符号链接、跳过 node_modules/dist/.git/target；单扩展失败记 diagnostic 继续）+ 三来源依赖聚合
  （module records / 会话 declaredPermissions / 审计 usage 只读）+ 四冲突规则
  （duplicate_module_id·error / duplicate_transaction·error / protocol_mismatch·warning /
  unsupported_capability_on_host·warning）+ 进程内缓存 + 单飞合并 + `refresh()`。
- `packages/server-plugin/src/routes/registry-routes.ts`（新）：三端点。**refresh 先 `user.isAdmin` 门禁
  （403 `admin_required`，此路径不调 assertSession）再 assertSession**。每用户一个 registry 实例：
  `runtime.registries: Map<handle, ExtensionRegistryService>`（`runtime.ts` 已加字段与 JSDoc）。
- `routes.ts` 挂载：`registerRegistryRoutes` 在 `registerModuleRoutes` 之后。

### SDK / Security Center（sdk-extension）
- `client.ts`：`client.registry.{list, get, refresh}` 命名空间（get 对空 id 抛错；refresh POST）。
- `security-center/types.ts`：`CenterTab` 加 `'registry'`；新 `RegistryViewState`；`SecurityCenterState.registry`；
  re-export `RegistryListResponse`（import 别名 `AuthorityRegistryListResponse` 避免同名冲突）。
- `static/security-center.html`：governance 侧栏第 6 tab（`data-tab="registry"`，完整 ARIA 链：
  `security-center-tab-registry` / `security-center-tabpanel-registry`）+ view-canvas 内
  `data-section="registry"` 面板（`data-role="registry-view"`）。
- `security-center.ts`：`PRIMARY_TAB_NAMES` 加 `'registry'`；构造 state 初始化；
  `bindEvents` 加 `[data-action^="registry-"]` 分支；`switchTab` 尾部懒加载；`render()` 序列插
  `renderRegistrySection()`；新方法块 `renderRegistrySection` / `getRequiredRegistrySessionToken` /
  `loadRegistrySnapshot`（refresh 先 POST `/registry/refresh` 再 GET list）/ `refreshRegistry` /
  `handleRegistryAction`（refresh / select-record / back）。**数据调用显式传 `sessionToken`**
  （registry 路由要求会话头，与 `/admin/*` 的宿主中间件路径不同）。
- `security-center/registry-workbench.ts`（新）：渲染纯函数。清单（glance + 记录表 + 冲突 severity 分组）→
  详情（依赖矩阵表 + Companion 模块 chips + 跨宿主四格 + 涉及冲突 + 诊断列表）；加载/错误态。
- `static/style.css`：主区末尾追加 `.authority-pill--muted` / `.authority-registry-record-link` /
  `.authority-registry-host-grid/-cell（--supported/--degraded/--absent）`——双前缀 + `--authority-*` 变量，无硬编码色。

### 测试
- `extension-registry-service.test.ts` 15 用例；`registry-routes.test.ts` 6 用例；
  `registry-workbench.test.ts` 6 用例（含 XSS 转义断言：`<unsafe>` 实体形态）。
- `routes.test.ts`「完整路由面」清单补 3 端点（GET 2 项在 `/modules/:moduleId/record` 后、
  POST 1 项在 `/modules/:moduleId/transactions/...` 后——按 routes.ts 实际挂载顺序）。
- `security-center.test.ts`：PRIMARY_TAB_NAMES 字面量断言加 `'registry'`；panels/tabs 数组断言改 nine 项
  （顺序 policies 后、updates 前）；governance/system-workbench 测试 state 工厂补 `registry` 字段。

### 验证状态（2026-09-24 实测）
- `npm run typecheck` ✓
- `npx vitest run` 全仓 **650 passed / 3 skipped（既有 skip）** ✓
- TS 四包单独 build ✓（shared-types / server-plugin〔webpack〕 / sdk-extension / example-extension）。
- **审查门 D 冒烟** ✓：`packages/sdk-extension/dist/extension/security-center.html` 含 `registry-view`、
  编译产物 security-center.js 含 26 处 registry 引用。
- `docs/server/http-api.md` E1 增补完成（§3.2 三行 + §4.8 全节）。

## 四、剩余待办（E2-E5，按序）与环境阻塞

1. **E2 spec 规范页**：`.trellis/spec/server-plugin/backend/` 新增 registry 规范页（扫描纪律 / 每用户缓存与单飞 /
   四冲突规则表 / 静态宿主矩阵维护约定）+ 更新该目录 index.md。落盘前先读 index 现有格式对齐。
2. **E3 全量质量门**：`npm run typecheck && npm run build && npm test`。
   **环境阻塞**：`build:core`（cargo build）与 `cargo test` 都要拉 TriviumDB git 依赖
   （`https://github.com/YoKONCy/TriviumDB?tag=v0.7.1#2f037d57`），当前网络 SSL 握手失败（sannel [35]），
   且 `~/.cargo/git/db/triviumdb-*` 缓存为空壳（无 refs 无对象）无法离线。**本任务零 Rust 改动**，
   网络恢复后重跑 `npm run build:core` 即可。若网络持续不可用，向用户汇报并以「TS 侧全绿 + Rust 零改动」
   为口径请求裁定是否放行 E4/E5。
3. **E4 installable 同步**：SDK 源码变 → 触发条件命中，**必跑**
   `npm run sync:installable && npm run check:installable`（L1-MF-8）。E3 全绿前不得进 E4（implement.md 审查门）。
4. **E5 收尾**：prd.md AC-1~AC-7 对照勾选（AC-1/2/3/7 服务层语义已由 15 单测覆盖、AC-4 由 routes 6 测试覆盖、
   AC-5 已完成、AC-6 的 TS 部分已绿待 Rust 网络恢复补全量）→ journal 补终版记录 → `task.py` 归档
   （`--skip-branch-validation`）→ commit + push（L0-7，origin 是自己的 fork）。

## 五、关键事实与坑（供续做者避坑）

- `SessionExtensionInfo.id`（不是 `extensionId`）——ControlExtensionRecord/ExtensionRegistryEntry 的字段名。
- tsconfig `exactOptionalPropertyTypes: true`：省略可选字段时别显式传 `undefined`。
- refresh 路由的鉴权顺序（先 admin 后 session）被 `registry-routes.test.ts` 断言（assertSession not called），勿调换。
- `security-center.test.ts` 是**源码字面量断言**风格：改 security-center.ts 关键行（PRIMARY_TAB_NAMES 等）必须同步它。
- routes.test.ts 的「完整路由面」清单断言按**实际挂载顺序**排列：新路由必须同步该清单（本次已同步）。
- 写文件遇到 HTML 实体（`<` 等）会被传输层解码成原字符：用 Python `chr(38) + 'lt;'` 拼接绕过（本次踩过并已修）。
- 工作区 `version.ts` / `package.json` / `manifest.json` / `package-lock.json` 改动是 `version:sync` 顺带产物，
  非本任务逻辑改动；提交范围参照 §六。
- 若恢复子代理派发：平台模型门禁实际名 `glm-5.3-flash`，并发 ≤3，503 先落盘再重试。
- GBK 控制台跑 tavern-harness Python 脚本需 `PYTHONIOENCODING=utf-8`。

## 六、本任务文件清单（提交范围参考）

新增（未跟踪）：
- `packages/shared-types/src/registry.ts`
- `packages/server-plugin/src/services/host-capability-matrix.ts`
- `packages/server-plugin/src/services/extension-registry-service.ts` + `.test.ts`
- `packages/server-plugin/src/routes/registry-routes.ts` + `.test.ts`
- `packages/sdk-extension/src/security-center/registry-workbench.ts` + `.test.ts`

修改：
- `packages/shared-types/src/index.ts`
- `packages/server-plugin/src/runtime.ts`、`src/routes.ts`、`src/routes.test.ts`
- `packages/sdk-extension/src/client.ts`、`src/security-center.ts`、`src/security-center.test.ts`、
  `src/security-center/types.ts`、`src/security-center/governance-workbench.test.ts`、
  `src/security-center/system-workbench.test.ts`
- `packages/sdk-extension/static/security-center.html`、`static/style.css`
- `docs/server/http-api.md`
- `.trellis/tasks/09-24-plugin-registry-discovery/`（prd/design/implement/handoff + journal）

（`version.ts` / 各 `package.json` / `manifest.json` / `package-lock.json` 为 version:sync 顺带产物，随提交一并入库即可。）
