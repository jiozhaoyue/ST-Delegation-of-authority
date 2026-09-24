# Frontend 规范 — `@stdo/example-extension`（第三方扩展接入示范）

> 本包是 Authority 的**官方接入示例扩展**（部署为 `third-party/st-authority-example`）。写新的第三方扩展或改示例时以本层为准。

---

## 职责边界

示范一个第三方扩展如何以**最小权限声明**接入 Authority 全流程（SDK init → 权限授权 → KV/HTTP/Jobs/Events 使用）。它是"扩展声明 → 用户授权 → 管理员收口"模型（`docs/server/capabilities-and-isolation.md`）的使用方样板。

---

## 目录与关键文件

```
packages/example-extension/
├── src/
│   ├── index.ts        # 全部逻辑：bootstrap()（:24）→ sdk.init()（:33-52）→ 菜单按钮注入（:55 起）
│   └── version.ts      # 版本常量（AUTHORITY_VERSION 复用）
├── static/             # 模板与静态资源（menu-button 等）
├── package.json        # @stdo/example-extension
└── tsconfig.json
```

---

## 必须遵守的约定（带证据）

1. **SDK 探测先行**：`const sdk = window.STAuthority?.AuthoritySDK`，不存在则抛出明确错误（`src/index.ts:25-31`）。新扩展照抄此模式，不要假设 SDK 一定已加载。
2. **init 参数完整**：`extensionId` 必须与扩展目录 ID 一致（`third-party/st-authority-example`，:12）；`installType: 'local'`；`uiLabel` 供权限弹窗展示（:38）。
3. **最小权限声明**（:40-52）：示例只声明 `storage.kv/blob`、`http.allow: ['jsonplaceholder.typicode.com']`、`jobs.background: ['delay']`、`events.channels: ['extension:<自身ID>']`。**绝不**声明 `agent.*` / `fs.*` / `sql.private` 等高危能力——最小权限是硬约束（本仓 `AGENTS.md` 统一规则块 L1-MF-5；权限资源与风险等级全表：`docs/server/capabilities-and-isolation.md` §1-§2，行 11-40）。
4. **UI 注入用宿主公开锚点**：菜单按钮挂 `#extensionsMenu`（`src/index.ts:54-63`），模板经宿主 `renderExtensionTemplateAsync`（:1）；复杂交互用宿主 `Popup`（:2）。API 事实以官方文档为准，不翻宿主源码找内部函数（统一规则块 P-13）。
5. **版本单一来源**：`VERSION = AUTHORITY_VERSION`（:4），不硬编码。
6. **installable 同步**：本包源码/静态资源变更经 `npm run build` 进入 `managed/sdk-extension/` 部署链——触碰 installable 条件时跑 `npm run sync:installable && npm run check:installable`。

---

## 常见坑

- **扩展 ID 不一致**：`extensionId` 与目录名不一致会导致会话/数据隔离错位与授权失效。
- **声明了未用权限**：授权弹窗会出现无意义风险项，用户可能整包拒绝。
- **示例变更要同步文档**：本包常被当作接入文档的活样本（`docs/server/ai-integration-guide.md` 的示例代码），改示例时检查文档示例是否需同步。

---

## 验证命令

```bash
npm run typecheck
npm run build           # 示例包包含在 build 链末位（根 package.json 的 build script）
npm run sync:installable && npm run check:installable
```

---

## 主题文件

| 文件 | 内容 | 状态 |
|------|------|------|
| [Directory Structure](./directory-structure.md) | 示例包布局 | 已填实 |
| [Component Guidelines](./component-guidelines.md) | 宿主 UI 注入模式 | 已填实 |
| [Hook Guidelines](./hook-guidelines.md) | 不适用声明 | 已填实 |
| [State Management](./state-management.md) | 无状态示范的说明 | 已填实 |
| [Quality Guidelines](./quality-guidelines.md) | 最小权限与接入质量规范 | 已填实 |
| [Type Safety](./type-safety.md) | 接入类型规范 | 已填实 |
