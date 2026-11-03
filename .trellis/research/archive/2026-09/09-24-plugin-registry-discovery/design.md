# Design：Authority 插件注册表与依赖矩阵（L12）只读发现层

> 任务：`09-24-plugin-registry-discovery` ｜ PRD 见同目录 `prd.md`
> 分层判定（L1-MF-8）：本设计**只动三层**——`shared-types`（DTO）→ `server-plugin`（service + route）→ `sdk-extension`（client + Security Center 版块）+ installable 同步。**不动 Rust core**（纯 Node 层聚合，无持久化新需求：缓存进程内存即可，重启重扫）。

## 1. 边界与契约

### 1.1 数据契约（shared-types 新文件 `registry.ts`）

```ts
/** 跨宿主能力支持等级（静态矩阵值）。 */
export type HostCapabilityLevel = 'supported' | 'degraded' | 'absent';

/** Authority 能力面枚举（依赖矩阵的列）。 */
export type AuthorityCapability =
    'sql' | 'kv' | 'blob' | 'fs' | 'http' | 'jobs' | 'events' | 'trivium' | 'agent' | 'host-bridge';

/** 依赖来源三分类。 */
export type DependencySource = 'manifest' | 'session' | 'observed';

export interface ExtensionDependencyEntry {
    capability: AuthorityCapability;
    sources: DependencySource[];   // 去重排序，manifest > session > observed
}

/** 注册表单扩展记录（JSON-serializable，可从 route 直接返回）。 */
export interface ExtensionRegistryRecord {
    extensionId: string;           // 目录名（third-party/<dir>）
    displayName: string;           // manifest.json display_name / falling back 目录名
    version: string | null;        // manifest.json version；读取失败 null + diagnostic
    isAuthorityUser: boolean;      // 有 module.json / 有会话历史 / 有 declaredPermissions
    dependencies: ExtensionDependencyEntry[];
    moduleIds: string[];           // 该扩展声明的 companion module id 集
    crossHost: HostAvailabilityView;
    diagnostics: RegistryDiagnostic[];
}

export interface HostAvailabilityView {
    /** host → 该扩展依赖集与静态矩阵的推算结果。 */
    estimates: Record<'sillytavern' | 'luker' | 'puretavern' | 'tauritavern', HostCapabilityLevel>;
}

export interface RegistryDiagnostic {
    severity: 'error' | 'warning' | 'info';
    code: string;                  // 如 manifest_unreadable / module_id_conflict / …
    message: string;
}

export interface RegistryConflict {
    severity: 'error' | 'warning' | 'info';
    kind: 'duplicate_module_id' | 'duplicate_transaction' | 'protocol_mismatch' | 'unsupported_capability_on_host';
    extensionIds: string[];        // 涉事扩展
    detail: string;
}

/** 响应 DTO。 */
export interface RegistryListResponse { records: ExtensionRegistryRecord[]; count: number; generatedAt: string; conflicts: RegistryConflict[]; }
export interface RegistryGetResponse  { record: ExtensionRegistryRecord | null; conflicts: RegistryConflict[]; }
export interface RegistryRefreshResponse { refreshed: true; generatedAt: string; }
```

### 1.2 静态宿主能力矩阵（随代码分发）

`server-plugin/src/services/host-capability-matrix.ts` 内的常量表（非运行时探测）：

| 能力 | ST 1.18.0 | Luker 2.7.0 | PT 0.1.12 | TT 2.2.0 |
|---|---|---|---|---|
| sql/kv/blob/fs/http/jobs/events/trivium/agent | supported | supported | absent（纯前端降级） | absent |
| host-bridge | supported（版本门禁 1.18.0） | absent（门禁拒绝，warn 不阻断） | absent | absent |

> 来源：docs/server/capabilities-and-isolation.md + research/07 四宿主实测。矩阵随版本化维护，AC-3 的版本化分发即指此文件随 installable 分发。

### 1.3 路由与权限

- `GET /registry/extensions`、`GET /registry/extensions/:extensionId`：公开 route（复用 module-routes 的会话鉴权模式：
  `assertSession(getSessionToken(req), user)`，无会话不返回数据）。
- `POST /registry/refresh`：`user.isAdmin` 门禁（复用 st-manager-routes.ts:27 模式），非管理员 403。
- 全部挂在 `http-routes.ts` 的既有 `register*Routes` 序列里，新增 `registry-routes.ts`。
- **不新增权限资源**（registry 是 Authority 自身元数据，不是扩展数据面）——不触 PermissionService 判定序，仅会话鉴权。
  （L1-MF-9 ②合规：非绕过，是「不适用」——registry 端点不访问扩展隔离数据。）

## 2. 服务设计

### 2.1 `extension-registry-service.ts`

```
class ExtensionRegistryService {
    private cache: RegistryListResponse | null
    private scanning: Promise<RegistryListResponse> | null   // 单飞（in-flight 合并）

    async list(): Promise<RegistryListResponse>          // 命中缓存直接返回
    async get(extensionId): Promise<RegistryGetResponse>
    async refresh(): Promise<RegistryListResponse>       // 强制重扫
    private async scan(): Promise<RegistryListResponse>  // 核心：一次全量扫描
}
```

扫描算法（严格复用 module-discovery 纪律）：
1. `resolveSillyTavernRoot()`（复用 install-service 的候选链：cwd → pluginRoot/../.. → `AUTHORITY_ST_ROOT` env）。
2. 列 `public/scripts/extensions/third-party/` 一级子目录（**不递归**、跳过 node_modules/dist/.git/target、不跟随符号链接）。
3. 每目录读 `manifest.json`（SillyTavern 扩展标准文件）：取 `display_name`/`version`，读取失败/解析失败 →
   `displayName=目录名`、`version=null`、`diagnostics += manifest_unreadable(warning)`，**不中断**。
4. 聚合 module-discovery 的当次结果（`runtime.modules` 已有 records；registry 不重复实现校验，直接消费）。
5. 聚合会话侧：`runtime.sessions` 遍历活跃+持久会话的 `declaredPermissions`（只读聚合，不落盘）。
6. 聚合观测侧：`audit-service.getRecentActivity` 按扩展聚合 usage 记录中的能力线索（只读既有日志，不新埋点）。
7. 冲突检测（纯静态规则，R2.2 四类）：跨扩展 moduleId 重复 / 同名事务重复 / 协议版本不匹配 / 依赖集-宿主矩阵不支持组合。
8. 产出 `RegistryListResponse`，写缓存。

### 2.2 失效与并发

- 进程内存缓存，无 TTL（扩展目录变更频率低）；`refresh` 是唯一失效入口（AC-4）。
- 单飞合并：并发 `list()` 共享同一个 in-flight scan promise（防扫描风暴）。
- 首次 `list()` 懒加载触发扫描。

### 2.3 规模与性能

- 扫描量级：third-party 目录一级子目录数 ×（1 manifest 读 + 常量级聚合）。不进任何热路径
  （首次调用懒加载、缓存命中 O(1)），**无需 bench 门槛动作**（AC-6 的 bench 无回归指「不新增回归」，非新增基准）。

## 3. SDK 与 Security Center

### 3.1 SDK client（`packages/sdk-extension/src/client.ts` 增补）

```ts
listRegistry(): Promise<RegistryListResponse>
getRegistryEntry(extensionId): Promise<RegistryGetResponse>
refreshRegistry(): Promise<RegistryRefreshResponse>   // 仅管理员会话可用
```

### 3.2 Security Center 版块

- 新版块「插件注册表」挂在 Security Center 既有版块序列（overview/extension/data/activity/agent/admin/ops 之后）。
- 三视图：清单表（扩展/版本/authorityUser/依赖数/冲突徽标）→ 点开详情（依赖矩阵条形、跨宿主可用性四格、diagnostics 列表）→ 冲突页（按 severity 分组）。
- CSS 纪律：宿主变量继承 + 双前缀类名（L0-10），不新增外部依赖。

## 4. 8 步顺序对照（L1-MF-8）

| 步 | 落点 | 本任务动作 |
|---|---|---|
| 1 | shared-types DTO | `registry.ts` 新文件 + index 导出 |
| 2 | core 内部能力 | **无改动**（无新存储/执行需求，设计上明确排除） |
| 3 | CoreService 代理 | **无改动**（registry 不经 core） |
| 4 | server service/route | `extension-registry-service.ts` + `host-capability-matrix.ts` + `registry-routes.ts` |
| 5 | SDK client | client 三方法 |
| 6 | 文档/Security Center | http-api.md 增补 + 新版块 |
| 7 | bench | 纯只读非热路径，无动作 |
| 8 | 测试与 installable | 单测 + route 测试 + `sync:installable && check:installable` |

## 5. 兼容与回滚

- 全部新增（新文件、新路由、新 DTO），零既有行为变更 → 回滚 = revert 三个层的新增提交即可。
- DTO 版本化：`registry.ts` 不复用 modules.ts 既有类型（避免给 Phase 1 module 类型加可选字段造成旧调用方歧义）。
- Security Center 新版块对旧 SDK 缓存无影响（懒挂载）。

## 6. 权衡记录

- **为什么不做 fs.watch**：常驻监听违背「插件管理最小介入」定位，且扩展目录变更时点（用户手动安装）频率极低，
  refresh 端点 + 懒加载已够。若后续需要，加 TTL 即可，不破坏契约。
- **为什么观测来源只读审计日志**：新埋点会引入「注册表影响运行时」的耦合；只读聚合保持 registry 纯观察者。
- **为什么静态宿主矩阵而非运行时探测**：四宿主版本面差异是**已知静态事实**（research/07 已实测固化），
  运行时探测需要在每个宿主跑探测代码，PT/TT 无服务端基建根本跑不了——静态矩阵是唯一可行形态。
- **为什么 conflicts 不含仲裁**：L12 裁定「能力治理 ≠ 插件管理」；仲裁 = 启停/禁用扩展 = 执行动作，超出只读定位。
