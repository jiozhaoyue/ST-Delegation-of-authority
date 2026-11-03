# 03 · 后端插件路线结论（R3）

> 任务：`09-22-authority-ecosystem-pr-strategy`（父任务 C-09）
> 回答用户第三问：**后端插件策略——直接用 Authority 的可用子集，还是必须自造插件？**
> 结论性质：**基于源码与实机文件系统的静态验证**（`research/07`），运行时装载未实测（见 §五 残留未验项）。

---

## 一、结论

**✅ 直接用 Authority 可移植子集，不自造后端插件。「并存」是事实陈述，不是路线选项。**

三选项裁定：

| 选项 | 裁定 | 理由 | 代价 |
| --- | --- | --- | --- |
| **A. 直接用 Authority 可用子集** | **✅ 采用**（与 D4 裁定一致，C-08 实测补齐可行域） | 四宿主可行域已实测（§二）；治理四层原语现成（§二.4）；用户主张"暴露 API 成为基础设施"——Authority 就是该基础设施 | 依赖 Authority 演进节奏；PT/TT 必须带纯前端降级；Host Bridge 语义在 Luker 上放弃（L0-12） |
| **B. 自造后端插件** | ❌ 否决 | 生态分裂（第二套后端 = 插件被迫二选一）；需重造权限/隔离/降级/互调四层；每插件各带 server plugin + 进程管理 + 安全边界 = "自己维护的地狱"的根源 | 巨大且持续 |
| **C. 并存（部分插件用 Authority、部分自造）** | ❌ 不作为策略 | 并存是**事实**（纯前端插件本就不接入 Authority，`research/04` §6.3"并存非替代"），不是**设计**；设计上允许并存会失去收敛压力，退化为 B | 管理成本随插件数发散 |

---

## 二、实测证据链（AC-2 依据，全部回源 `research/07`）

### 2.1 四宿主可行域（`research/07` §一结论表）

| 宿主 | 服务端插件机制 | Host Bridge | 综合可用性 | 对本结论的含义 |
| --- | --- | --- | --- | --- |
| SillyTavern 1.18.0 | ✅ | ✅ 版本命中 `["1.18.0"]` | ✅ 完整可用 | 官方支持路径，直接依赖 |
| **Luker 2.7.0** | ✅（与 ST **逐字节同形**） | ❌ 版本门禁拒绝（降级为 `console.warn`） | **✅ 核心可用 / ⚠️ 桥接层不可用** | **避开 Host Bridge 即全套后端能力可用**（主战场成立） |
| PureTavern 0.1.12 | ❌ 无 | ❌ | ❌ 不可用 | 纯前端降级是唯一形态 |
| TauriTavern 2.2.0 | ❌ 无 | ❌ | ❌ 不可用 | 同上 |

### 2.2 Luker 装载契约逐字节同形（`research/07` §2.1）

六证据点全部命中：导出函数同签名（`loadPlugins(app, pluginsPath)`）、`enableServerPlugins` 开关同名、插件 ID 正则逐字符相同、重复 ID 拒绝同文案、路由注册同形同序（`/api/plugins/${id}`）、退出钩子相同。
→ Authority `runtime/index.cjs` 的 `info.id='authority'` + `init(router)` **完全满足 Luker 装载契约**。

### 2.3 能力内核与宿主解耦（`research/07` §2.2）

- 门禁仅一处生效路径：`host-bridge-service.ts:236-252 resolveContext()`（host ≠ sillytavern → throw；版本不在 `supportedPackageVersions` → throw）。
- **该抛错被 `packages/server-plugin/src/index.ts:23-32` 吞掉，降级为 `console.warn`，插件照常加载**。
- 宿主根解析 `isSillyTavernRoot`（`install-service.ts:731-734`，按 `plugins/` + `public/scripts/extensions/` 目录存在性判定）在 Dev Luker 上为 **true**（`research/07` §2.3 实测表）。
→ **Host Bridge 不可用不阻断任何核心能力**；Authority 原生具备"特性检测 + 静默降级"（用户全局规则 §4.6 的样板）。

### 2.4 治理四层原语现成（`research/04` §6.2 a–f；`research/10` §B.1）

1. **权限与隔离**：8 资源 + 7 级判定顺序 + 6 维隔离——插件无需自实现安全边界。
2. **Feature Flags**：`hasFeature`/`requireFeature` + 26 特性路径——官方强制的降级姿势。
3. **Companion Modules**：`.authority/module.json` 声明 transaction + `client.tx('<moduleId>:<txName>')` 互调——"联动但不耦合"的机制化落地（发现阶段不执行 companion 代码、不跟随符号链接）。
4. **Agent 工具注册**：`agent.browser.registerTools` / `claim` / `submitResult` 回路。

### 2.5 B2/B4/B5 业务线落法（不需要改路线，`research/07` §3.1）

| 业务线 | 落法 |
| --- | --- |
| **B3 通用后端** | = Authority 本体；跨插件共享能力经 **Companion Modules transaction** 暴露（timeline 等也能调，兑现"timeline 也可获增强"） |
| **B4 shujuku** | 前端做到极限 → `hasFeature('sql.private')` 检测到 Authority 后把不该前端做的**转交后端**（用户已裁定模式） |
| **B5 zip-converter** | 大 payload 走 `client.transfers.*`（inline 阈值 `SDK_TRANSFER_INLINE_THRESHOLD_BYTES = 256*1024`，`client.ts:526`），导入流量与 408 优化在插件侧实现 |
| 跨宿主统一骨架 | `init(declaredPermissions)` → 按 Feature Flags 分支 → Authority 可用时增强、不可用时纯前端路径全功能（L0-11），**禁止依赖 Host Bridge**（L0-12，子集清单见 `04-portable-subset.md`） |

---

## 三、代价与缓解（如实列出）

| 代价 | 缓解措施 |
| --- | --- |
| Authority API 随 fork 大量迭代可能变化 | `hasFeature` 26 路径门控 + `shared-types` 单一类型真源（语义化演进）+ Companion `AUTHORITY_MODULE_SCHEMA_VERSION = 1` 版本协商；插件侧所有能力调用包在特性检测里 |
| PT/TT 无服务端基建 | 插件必须带纯前端降级路径，功能子集全保留（L0-11）；**不为 PT/TT 自造后端**（成本封顶） |
| 聊天修订/事务语义在 Luker 上不可得（Host Bridge 分叉） | 跨宿主插件不依赖它（L0-12）；若将来确需，独立立项为 Luker 编写 `manifest.json`+`patch.cjs` 并跟随 Luker 版本维护——**成本与持续性风险高，默认不做**（`research/07` §3.2） |
| core 不可用 / 过载 | 官方错误分类契约：`503 core_unavailable`（category: core）、`job_queue_full`/`concurrency_limit_exceeded`（category: backpressure）→ 调用方退避重试（`api.ts:174-208`、README 排障章） |
| 六条禁区约束编码自由度 | 已知且成文（`ai-integration-guide.md` §6.1–6.6 = 统一规则 L1-MF-9）：不直连 core、不绕 PermissionService、不手写数据文件路径、Trivium 不做 embedding、Jobs 仅 4 内置类型、mapping integrity 非热路径——均为安全边界而非功能限制 |

---

## 四、什么情况才允许"自造"

唯一合法场景：**Authority 未覆盖且宿主原生也没有**的能力。当前盘点：B1–B10 全部需求均落在可移植子集内，**该清单为空**。
若未来出现此类需求：先评估在 Authority 内新增能力（走 L1-MF-8 八步顺序），仍不自造平行后端——保持"基础设施只进一个口"（`01` 号文 A2）。

---

## 五、残留未验项（AC-2 明确标注，不得当作已验证）

| # | 未验项 | 性质 | 补验路径 |
| --- | --- | --- | --- |
| 1 | **未实际启动宿主装载插件**——静态验证 ≠ 运行时验证；Luker 上 Authority 是否实际注册路由、core 是否正常启动未实测 | 🔴 关键 | 需在 `Instance/Dev/Luker` 开启 `enableServerPlugins` 并 `npm run dev:link` 装载后 `probe` 验证；**涉改实例配置，须用户批准后另开任务**（对 Dev 实例，L1-MF-10 红线内） |
| 2 | Luker 实例 `config.yaml` 的 `enableServerPlugins` 实际值未读（`default/config.yaml:435` 模板值为 `false`） | 🟡 只读可补 | 读 `Instance/Dev/Luker/config.yaml`（纯只读，获批后可随 #1 一起做） |
| 3 | `packages/server-plugin/src` 对宿主内部 API 的调用面未与 Luker `src/` 导出面穷尽比对 | 🟡 | 静态比对任务（只读），可另开小任务 |
| 4 | PT/TT 是否存在**非 ST 同源**的插件机制未穷尽检索（仅按 ST 惯例关键词检索） | 🟡 | 读 PT/TT 官方扩展开发文档确认 |
| 5 | Agent 默认工作区 `workspaceId: 'sillytavern'` 在 Luker 上的运行时行为未实测（结构判定通过，运行时未验） | 🟡 | 随 #1 一并验证 |

> 以上各项**均未构成对结论的反证**——结论的成立依赖 2.1–2.4 的静态证据；#1 是把"成立"升级为"实证"的最后一步。

---

## 证据来源

| 来源 | 用途 |
| --- | --- |
| `research/07` 全文（§一/§2.1–2.5/§3.1–3.2/§四） | 四宿主可行域、契约同形、降级行为、宿主根判定、残留未验项 |
| `research/04` §3.2、§6.1–6.3 | 命名空间、接入硬约定、transfers 阈值、并存非替代 |
| `research/10` §B.1 | 治理四层原语 |
| 本仓 `docs/server/ai-integration-guide.md` §6.1–6.6 | 六条禁区（L1-MF-9） |
| 仓群统一规则 L0-11/L0-12、L1-MF-8/9/10 | 降级、Host Bridge 禁令、八步流程、禁区、实例红线 |
