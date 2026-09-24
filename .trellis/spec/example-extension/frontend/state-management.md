# State Management — `@stdo/example-extension` frontend

> 示例扩展**刻意保持无状态**。总览见 [index](./index.md)。

- 模块级状态只有一个 `authorityClient: any`（`packages/example-extension/src/index.ts:22`，SDK init 结果），bootstrap 一次赋值。
- 演示数据的持久化全部走 Authority 服务端能力（KV / Blob），**不落 localStorage**——这是"事实源在服务端"取向的示范（见 `../../sdk-extension/backend/database-guidelines.md`）。
- 真实扩展的状态管理规范见 `../../sdk-extension/frontend/state-management.md`。
