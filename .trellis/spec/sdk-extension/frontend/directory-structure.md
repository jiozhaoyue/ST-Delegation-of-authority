# Directory Structure — `@stdo/sdk-extension` frontend

> Security Center UI 模块布局。总览见 [index](./index.md)。

---

## 布局（实测）

```
packages/sdk-extension/
├── static/                        # UI 静态资源（构建后进 managed/sdk-extension/）
│   ├── security-center.html       # Security Center 页面骨架
│   ├── permission-dialog.html     # 权限弹窗骨架
│   ├── style.css                  # 容器作用域样式（.authority-panel 等三个根容器）
│   └── manifest.json
└── src/
    ├── security-center.ts         # bootstrapSecurityCenter() / openSecurityCenter() + 主面板类
    ├── security-center/           # 版块化模块（每个版块配 *.test.ts）
    │   ├── components.ts          # DOM 构件工厂
    │   ├── view-models.ts         # DTO → 展示模型
    │   ├── host.ts                # 宿主版块
    │   ├── governance-workbench.ts  # 治理工作台
    │   ├── system-workbench.ts      # 运维面板
    │   ├── agent-workbench.ts       # Agent 工作台（会话/审批/工作区差异）
    │   ├── agent-settings.ts
    │   ├── impact-confirmation.ts   # 高影响操作确认
    │   ├── mobile-presentation.ts   # 移动端适配
    │   ├── workspace-diff-view.ts
    │   ├── st-manager-bridge.ts / st-manager-control.ts
    │   └── formatters.ts / options.ts / constants.ts / types.ts
    └── permission-prompt.ts       # 权限弹窗交互
```

---

## 组织规则

1. **新版块 = `security-center/` 下一个新模块 + 伴测**，主类在 `security-center.ts` 挂接；参考 `agent-workbench.ts` + `agent-workbench.test.ts` 的成对模式。
2. **数据转换集中在 `view-models.ts`**，不散落在各版块。
3. **静态资源只放 `static/`**；`static/manifest.json` 决定部署清单，不要手工复制文件进 `managed/`（由构建链 `npm run sync:installable` 处理）。

---

## 命名规则

- 版块模块：与 Security Center 版块对应的小写连字符名（`governance-workbench.ts` / `agent-workbench.ts` / `workspace-diff-view.ts`）。
- 伴测：同名 + `.test.ts`，同目录。
- CSS：根容器 `.authority-panel` / `.authority-permission-dialog` / `.authority-impact-dialog`（`static/style.css:3-5`），本地变量 `--authority-*`。

## 参考范例

- 版块 + 伴测成对模式：`packages/sdk-extension/src/security-center/agent-workbench.ts` 与 `agent-workbench.test.ts`。
- 游标分页 UI：`security-center.ts:807-851,1454`（`refreshAgentWorkbench({ cursor, append })`）。
