# Authority 插件注册表与依赖矩阵（L12）：只读发现层

## Goal

在 Authority 内新增「插件注册表」只读发现层：全量扩展清单、每扩展的 Authority 能力依赖矩阵、跨扩展冲突检测、跨宿主可用性登记。以 `module-discovery-service` 的既有模式（只读扫描 + manifest 校验 + diagnostics）为基底，**不新造执行机制**（L12 裁定：能力治理 ≠ 插件管理）。

## Background

- **缺口（atlas 任务 L12 登记）**：Authority 已有四层能力治理（权限 / Feature Flags / Companion Modules / Agent 工具），
  但缺「插件管理」视角：无法回答「装了哪些扩展、哪些在用 Authority、相互依赖什么、有无冲突、在四个宿主上各可用什么」。
- **既有基底**：`module-discovery-service.ts`——扫描已装扩展的 `.authority/module.json`、校验 manifest 形状/schema/协议版本/
  事务/资源/幂等/字节上限/owner 身份/入口路径包含，产出 `AuthorityModuleRecord`（含 diagnostics），**从不执行扩展代码**、
  不跟随符号链接、不递归嵌套、跳过 node_modules/dist/.git/target。
- **已有但分散的信号**：会话建立时的 `declaredPermissions`（permission-service）、SDK 部署目录（install-service）、
  管理员策略（admin-package-service）。注册表把这些聚合为统一只读视图。
- **跨宿主可用性**：四宿主 API 面差异（ST 1.18.0 完整 / Luker 2.7.0 核心可用但 Host Bridge 拒绝 / PT 0.1.12、TT 2.2.0 无服务端插件基建
  只能纯前端降级）——插件在非 ST 宿主上的可用性目前无任何登记载体。
- **检索先行结论（2026-09-24）**：GitHub API 检索无直接可复用的 ST 生态插件注册表实现（LenAnderson ExtensionManager 双件套
  是 UI 形态参考、DepPy 是确定性冲突检测思路参考），均不引入依赖、不造执行机制。

## Requirements

- **R1（注册表数据层）**：新 service（`extension-registry-service`）复用 module-discovery 的扫描纪律：
  - R1.1 扫描 `public/scripts/extensions/third-party/*` 全量扩展目录（含无 `.authority/module.json` 的普通扩展），
    产出 `ExtensionRegistryRecord`：扩展 id、显示名、版本（读 `manifest.json` 的标准字段，读取失败记 diagnostic 不炸）、
    是否 Authority 用户（有 companion module / 有 SDK 会话历史 / 有 declaredPermissions 记录）、Authority 能力依赖集
    （来自 module.json 的 requiredResources + 会话 declaredPermissions 聚合）。
  - R1.2 **严格只读**：不执行任何扩展代码、不 require 入口、不跟随符号链接、跳过 node_modules/dist/.git/target；
    扫描失败的单扩展记 diagnostics 继续。
  - R1.3 缓存与失效：扫描结果内存缓存，提供显式 refresh 入口；不做 fs.watch（避免常驻监听）。
- **R2（依赖矩阵与冲突检测）**：
  - R2.1 能力依赖矩阵：每扩展 × 依赖的 Authority 资源（sql/kv/blob/fs/http/jobs/events/trivium/agent）粒度，标注来源
    （manifest 声明 vs 会话声明 vs 实际调用观测——观测来源只读自既有审计日志聚合，不新埋点）。
  - R2.2 冲突检测（纯静态规则，不仲裁不执行）：moduleId 重复（两扩展声明同 id）、同名事务重复、协议版本不匹配、
    requiredResources 声明了宿主不支持的能力（如 PT 上声明 fs）。输出 conflict 列表带严重度（error/warning/info）。
- **R3（跨宿主可用性登记）**：
  - R3.1 静态能力矩阵（数据随代码分发，不运行时探测）：ST/Luker/PT/TT × Authority 能力面的支持表
    （宿主 × 能力 → supported/degraded/absent），来源固化为 docs/server 现有文档 + 实测记录（research/07），版本化维护。
  - R3.2 每扩展的跨宿主推算视图：依赖集 × 宿主能力矩阵 → 该扩展在各宿主的预期可用性（可用/降级/不可用）。
- **R4（公开 API 层）**：走 8 步顺序（shared-types DTO → core 内部能力（本任务无 core 侧改动，见 design）→ CoreService 代理（同左）
  → server route → SDK client → 文档 → 性能 → 测试与 installable 同步）：
  - R4.1 `GET /registry/extensions`：全量清单（分页可选、默认全量）。
  - R4.2 `GET /registry/extensions/:extensionId`：单扩展详情（依赖矩阵、conflicts、跨宿主可用性）。
  - R4.3 `POST /registry/refresh`：触发重扫描（管理员策略门禁，复用既有 admin 鉴权路径）。
  - R4.4 SDK client 对应方法 + Security Center「插件注册表」版块（清单 + 详情 + 冲突视图）。
- **R5（文档与规范）**：`docs/server/http-api.md` 增补 registry 端点；`.trellis/spec/server-plugin/backend/` 增补
  registry-service 规范页（含扫描纪律、缓存策略、冲突规则表）。
- **R6（测试与质量门）**：registry-service 单测（manifest 读取失败/diagnostics/重复 id/冲突规则/缓存失效）；
  routes 测试（鉴权、404、admin 门禁）；Security Center 版块冒烟；`npm run typecheck && npm run build && npm test` 全绿；
  installable 同步（SDK 源码变 → `sync:installable && check:installable`）。

## Acceptance Criteria

- [x] AC-1：`GET /registry/extensions` 返回全量扩展清单（含非 Authority 用户），字段完整（id/名称/版本/authorityUser/依赖集/diagnostics），无扩展代码被执行（扫描全程零 require/eval）
  （extension-registry-service.test.ts 覆盖；实现扫描全程只 readFileSync manifest.json）
- [x] AC-2：依赖矩阵正确聚合三来源（manifest 声明、会话声明、审计观测）；冲突检测覆盖 R2.2 四类规则并输出严重度
  （15 服务单测含四规则用例；三来源聚合在 buildRecord）
- [x] AC-3：跨宿主能力矩阵随代码版本化分发，每扩展的跨宿主可用性推算 = 依赖集 × 宿主矩阵，且对「PT 上声明 fs」类组合输出 warning 级 conflict
  （host-capability-matrix.ts 静态 HOST_MATRIX + estimateForHost；unsupported_capability_on_host warning 用例覆盖）
- [x] AC-4：`POST /registry/refresh` 仅管理员可触发（非管理员 403），重扫描后缓存更新
  （registry-routes.test.ts 6 用例：非管理员 403 时 assertSession not called 被断言；缓存重扫在服务测试覆盖）
- [x] AC-5：SDK client 三方法 + Security Center 新版块可用（清单/详情/冲突三视图）；文档与 spec 页落盘
  （client.registry.{list,get,refresh}；governance 第 6 tab + registry-workbench 6 渲染单测；
  http-api.md §4.8；spec registry-guidelines.md + index 行）
- [x] AC-6：typecheck/build/test 全绿；`sync:installable && check:installable` 通过；bench 无回归（本层纯只读，无热路径改动）
  （typecheck ✓；build 含 Rust release ✓；vitest 650/653 绿〔3 skip 既有〕+ cargo test 40/40 ✓；
  check:installable "up to date" ✓；bench 按 design §裁决：非热路径无回归即满足）
- [x] AC-7：扫描纪律与 module-discovery 一致（零代码执行、不跟随符号链接、跳过四类目录）；单测覆盖 manifest 读取失败仍产出 diagnostic 记录
  （SKIP_DIRECTORY_NAMES + isSymbolicLink 过滤；manifest_unreadable diagnostic 用例）

## Notes

- 复杂任务：需 design.md + implement.md。
- L1-MF-9 禁区合规：不绕过 PermissionService（registry 端点走公开 route + 既有会话鉴权）；registry 数据不手写路径碰数据文件
  （扫描的是扩展目录的 manifest.json，非 SQL/.tdb/Blob 布局）。
- 铁律 L1-MF-8：本任务涉及 shared-types / server-plugin / sdk-extension 三层 + installable，每层改动后检查另三层联动；
  SDK 源码或 server-plugin 编译输出变 → 必须跑 installable 同步。
- 规模控制：**不做**插件安装/卸载/启停（能力治理 ≠ 插件管理，裁定原文）；**不做**运行时宿主探测（静态矩阵）；
  **不做** fs.watch；**不做**跨用户共享（每用户视图独立）。
- Privacy：审计观测聚合只读自既有日志，不新增数据收集。
- 本任务不改 Rust core（纯 Node 层聚合与视图；core 内部能力无缺口）——如 design 阶段发现需要 core 侧存储，再回补 PRD。
