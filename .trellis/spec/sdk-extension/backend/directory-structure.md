# Directory Structure — `@stdo/sdk-extension` backend

> 浏览器接入层目录布局。总览见 [index](./index.md)。

---

## 目录布局（实测）

```
packages/sdk-extension/src/
├── index.ts               # window.STAuthority 挂载（:7-10）+ 对外导出面
├── sdk.ts                 # AuthoritySDK（probe / init 去重 / getClient），37 行
├── api.ts                 # authorityRequest() HTTP 封装 + 端点基址 + 错误分类，176 行
├── client.ts              # AuthorityClient：12 个能力命名空间 + 客户端级方法，3222 行
├── client/                # 纯客户端支撑模块
│   ├── chunking.js        # 大 payload 分块（transfers / bulkUpsert 用）
│   ├── encoding.js        # 编码工具
│   ├── feature-flags.js   # 能力开关读取
│   └── permission-messages.js
├── permission-prompt.ts   # 权限弹窗（122 行）
├── host-event-recorder.ts # 宿主事件记录（145 行）
├── dom.ts                 # DOM 工具（47 行）
├── security-center.ts     # Security Center 引导（2769 行）→ 归 frontend 层
└── security-center/       # Security Center 模块化视图 → 归 frontend 层
```

构建产物：`managed/sdk-extension/*`（installable 之一）。本包 `src/` 变更后必须 `npm run sync:installable && npm run check:installable`（触发条件：`docs/server/ai-integration-guide.md` §5，行 208-227）。

---

## 模块组织规则

1. **新能力方法挂在 `client.ts` 的对应命名空间**（storage :529 / fs :545 / sql :555 / trivium :568 / http :610 / transfers :614 / permissions :623 / jobs :629 / events :640 / modules :644 / host :650 / agent :658），并在 `client.test.ts` 补同构测试。
2. **纯逻辑下沉 `client/`**：分块、编码、feature-flag 等与 DOM 无关的逻辑放 `client/` 子目录，保持可单测。
3. **UI 代码不进 backend 层**：`security-center.ts` 与 `security-center/` 按 frontend 层规范（见 `../frontend/index.md`）。
4. **测试同目录**：`api.test.ts`、`client.test.ts`、`security-center.test.ts`、`host-event-recorder.test.ts`。

---

## 命名约定

- 能力方法与 shared-types 的 DTO 名一一对应（`AuthorityXxxRequest` / `AuthorityXxxResponse`）。
- 错误类：`Authority<Scenario>Error`（`api.ts:27` 起）。
- 常量：`AUTHORITY_*` 前缀（`api.ts:5-11`）。
