# Directory Structure — `@stdo/example-extension` frontend

> 示例扩展布局。总览见 [index](./index.md)。

---

## 布局（实测）

```
packages/example-extension/
├── src/
│   ├── index.ts     # bootstrap()（:24）→ AuthoritySDK.init()（:33-52）→ #extensionsMenu 按钮注入（:54-63）→ demo 面板
│   └── version.ts   # 复用 AUTHORITY_VERSION
├── static/          # manifest、模板（menu-button）、样式
├── package.json     # @stdo/example-extension
└── tsconfig.json
```

## 规则

1. **单文件入口**：示例保持 `src/index.ts` 一文件讲完整接入故事，不为"架构优雅"拆模块——它的价值是**可读的接入样本**。
2. **静态资源进 `static/`**，经构建进 `managed/sdk-extension/` 部署链。
3. 新增能力演示时，对应代码段必须保留注释说明对应 Authority 命名空间（与 [../index.md](../index.md) 约定表一致）。

---

## 命名约定

- 扩展 ID：`third-party/st-authority-example`（`packages/example-extension/src/index.ts:12`，与部署目录一致）。
- 静态模板：小写连字符（`menu-button`），经宿主 `renderExtensionTemplateAsync` 加载（:59）。

## 参考范例

- 完整接入流：`src/index.ts:24-70`（SDK 探测 → init + 最小权限声明 → 菜单注入），是全仓第三方扩展接入的权威样板。
