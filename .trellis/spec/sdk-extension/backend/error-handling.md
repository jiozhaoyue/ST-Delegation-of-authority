# Error Handling — `@stdo/sdk-extension` backend

> 客户端错误分类体系。总览见 [index](./index.md)。

---

## 错误类层级（`src/api.ts:27` 起）

```
AuthorityApiError                 # 基类：status + payload（code/category/details）
├── AuthorityAuthError            # 认证失败
├── AuthoritySessionError         # 会话失效（x-authority-session-token 无效/过期）
├── AuthorityValidationError      # 参数校验失败
├── AuthorityLimitError           # 超限（MAX_KV_VALUE_BYTES / MAX_BLOB_BYTES / backpressure…）
├── AuthorityTimeoutError         # 超时
└── AuthorityCoreError            # core 不可用（core_unavailable / category: core）
```

- 分类依据是服务端 `AuthorityErrorPayload` 的 `code` / `category` 字段（`isAuthorityErrorPayload` 判别，`api.ts:29-47` 附近）。
- 全部从包入口导出（`src/index.ts:13-21`），调用方按类捕获而非解析消息字符串。
- 权限类错误独立于上述层级：`AuthorityPermissionError`（`src/index.ts:13` 导出），携带 `AuthorityPermissionErrorCode / Decision / Details`（类型导出见 `src/index.ts:50-53`）。

---

## 语义化重试（与 `docs/server/ai-integration-guide.md` §9 对齐）

| 症状 | 处置 |
|------|------|
| `503` + `core_unavailable`（category `core`） | 退避重试；不要当作 bug 反复裸重试 |
| `503` + `job_queue_full` / `concurrency_limit_exceeded`（category `backpressure`） | 退避重试 |
| `AuthoritySessionError` | 重新 `init()` 建会话 |
| `AuthorityLimitError` | 改走 `transfers` 分块或减小 payload |

---

## 约定

1. 新增 API 方法**必须**让错误能落到上述子类，不允许返回裸 `Error` 或自己拼消息。
2. `AuthorityPermissionError` 只在权限协商路径抛出（`ensurePermission` / `requireFeature`）；能力方法内部不做二次权限判断。
3. 测试参照 `api.test.ts`（95 行）对分类行为的既有写法。
