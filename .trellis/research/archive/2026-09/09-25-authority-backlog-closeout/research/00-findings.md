# A · 挂起项取证报告（2026-09-25）

任务：`09-25-authority-backlog-closeout` · 父任务 `09-25-tavern-project-bootstrap`
方法：全部为本地静态取证 + 一次编译探针实测；**未读取任何实例聊天内容**。

---

## R1 · core exe 体积膨胀：**已归因，且定量**

### 1.1 结论

**根因是工具链差异（GNU/MinGW vs MSVC），不是代码膨胀，也不是 strip 差异。**

| 项 | 本机产物 | 上游 CI 产物 |
| --- | --- | --- |
| 来源 | `build-core.mjs` 本机 `cargo build --release` | GitHub Actions `Core Artifacts` |
| 目标三元组 | **`x86_64-pc-windows-gnu`**（host 默认，无 env 覆盖） | **`x86_64-pc-windows-msvc`**（`core-artifacts.yml:51`） |
| 文件长度 | **17,739,135** | 10,331,648 |
| PE 节数 | 10 | 5 |
| **COFF `PointerToSymbolTable`** | **11,883,008** | **0** |
| **COFF 符号数** | **60,583** | **0** |
| **符号表占用** | **5,856,127 字节（占文件 33.0%）** | 0 |
| COFF Characteristics | `0x226`（含 `DEBUG_STRIPPED 0x200`） | `0x22` |
| 调试节（`.debug_*`） | **无** | **无** |

工具链指纹（字节级标记命中次数）：

| 标记 | 本机 | 上游 |
| --- | --- | --- |
| `__mingw` | **26** | 0 |
| `_tmainCRTStartup`（MinGW 入口） | 1 | 0 |
| `msvcrt.dll` | 1 | 0 |
| `api-ms-win-crt`（UCRT/MSVC CRT） | 0 | **8** |

### 1.2 定量归因

```
总差 = 17,739,135 − 10,331,648 = 7,407,487 字节
  ├─ COFF 符号表 + 字符串表         5,856,127 字节  （79.1%）
  └─ 节数据与头部差异               1,551,360 字节  （20.9%）
```

节数据差异构成（本机 − 上游）：

| 节 | 本机 (GNU) | 上游 (MSVC) | 差 |
| --- | --- | --- | --- |
| `.text` | 9,420,800 | 7,667,200 | **+1,753,600** |
| `.rdata` | 1,487,360 | 2,248,192 | −760,832 |
| `.xdata` | 678,912 | —（无） | **+678,912**（MinGW 特有） |
| `.pdata` | 220,672 | 368,128 | −147,456 |
| `.reloc` | 32,768 | 22,016 | +10,752 |
| 其余 6 节（`.bss`/`.idata`/`.tls`/`.rsrc`/`.data`） | — | 上游缺 4 节 | + |

### 1.3 排除项（避免误判）

- **不是调试信息**：两边**都无 `.debug_*` 节**；本机侧 COFF 特征位还显式设了 `DEBUG_STRIPPED`。
  尾部 5.86 MB 的字节熵 4.00 bits/byte（非压缩/非随机），其中 40,583 条 ASCII 串、8,424 条含
  `debug/.rs/src/authority`，内容形如 `_RINvNtCsg7k5df709B6_4core3ptr9drop_glue…` —— 即 **Rust mangled 符号名**，
  首部串为 `.l_start` / `@feat.00`（COFF 符号表结构），**确证为符号表**。
- **不是源码膨胀**：`crates/` 自 2026-07-31 零改动（`git log --since=2026-07-31 -- crates/authority-core/src` 为空）。
- **不是 strip 步骤缺失**：本地与 CI **都没有** strip 步骤；CI 侧无符号表是 MSVC `link.exe` release 的默认行为。

### 1.4 处置建议（**未执行任何变更**，遵 R1.4）

| 方案 | 做法 | 代价 | 建议 |
| --- | --- | --- | --- |
| **(a) 用 MSVC 目标构建** | 只需 `rustup target add x86_64-pc-windows-msvc`；构建时设 `AUTHORITY_CORE_TARGET_TRIPLE=x86_64-pc-windows-msvc`（CI 即此法） | **代价极小**——MSVC C++ 工具链**本就已装**（见下方更正），只缺一个 rustup 目标（约 50MB、**免管理员**） | ★ **已执行**——见 §1.5 |
| **(b) 剥离符号表** | `Cargo.toml` 加 `[profile.release] strip = "symbols"` | **已执行**。GNU 产物 17.74MB → 11.88MB（−33.0%）；MSVC 产物本无符号表，零影响 | ★ **已执行**——见 §1.5 |
| **(c) 登记环境事实** | 说明"本机 build:core 默认产 GNU 产物" | 零风险 | ★ 见 §1.5 结尾（**建议补进 `tavern-harness/docs/environment-defects.md`**） |

### 1.5 执行结果（2026-09-25，用户批准「两者都做」+「替换并新开提交」）

**§1.4 表格中「本机不可行：未装 msvc target、VS2022 为空目录」是错的，特此更正：**

- 我最初查的是 `C:\Program Files\Microsoft Visual Studio\2022`（**空目录**），
  而 VS Build Tools 实际装在 **`C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools`**；
  且我的 `find -maxdepth 6` 深度不足，没找到位于第 8 层的 `cl.exe`。
- **实况**：实例 `17c3ad29`，`product.id = Microsoft.VisualStudio.Product.BuildTools`，
  `version 17.14.37614.0`，**MSVC toolset `14.44.35207`** 齐备（`cl.exe` / `link.exe` 多套 host×target），
  `VC/` 目录 **2.2 GB**。**C++ 工作负载早已安装。**
- 那个"说已安装却无文件"的假象，成因是我看错了目录——不是安装损坏。
  （`vswhere -all -prerelease` 仍返回 `[]`，属另一独立小问题，不影响构建。）

**实际执行的两步（均已完成）：**

1. `rustup target add x86_64-pc-windows-msvc` —— 成功，**无需管理员**。
2. `Cargo.toml` 加 `[profile.release] strip = "symbols"`（加在 **workspace 根**——
   加在成员包 `crates/authority-core/Cargo.toml` 会被 Cargo 忽略）。

**三份产物对照（实测）：**

| 产物 | 字节 | PE 节数 | COFF 符号表指针 | 符号数 | `__mingw` | `api-ms-win-crt` |
| --- | --- | --- | --- | --- | --- | --- |
| 修复前（GNU，无 strip） | 17,739,135 | 10 | 11,883,008 | 60,583 | 26 | 0 |
| GNU + strip（中间态） | 11,882,496 | 10 | **0** | **0** | 26 | 0 |
| **本机 MSVC（最终采用）** | **10,292,736** | **5** | **0** | **0** | **0** | **8** |
| 上游 CI（MSVC） | 10,331,648 | 5 | 0 | 0 | 0 | 8 |

**结论**：MSVC 产物与 CI 产物**结构完全同源**（同节数、同 CRT、均无符号表），
体积仅差 **38,912 字节（0.38%）**，可归因于本机 rustc 1.98.0 与 CI 固定版本不同。
相对修复前 **17,739,135 → 10,292,736，减少 42.0%**。

**遗留的环境事实（建议登记进 `tavern-harness/docs/environment-defects.md`，该文件不公开）：**

> `scripts/build-core.mjs` 未设三元组时使用**宿主默认 target**，本机即 `x86_64-pc-windows-gnu`，
> 产出的 Windows 二进制比 CI（MSVC）**大 72%**（17.74MB vs 10.33MB）。
> 本机已装 MSVC 工具链与 rustup 目标，故**本机重建 core 必须显式设
> `AUTHORITY_CORE_TARGET_TRIPLE=x86_64-pc-windows-msvc`**，否则产出不得作为发布产物提交。
> **建议**：让 `build-core.mjs` 在 Windows 上**默认**优先 MSVC（除非显式覆盖），
> 从机制上消除"忘了设环境变量"这一类问题——此项属构建脚本行为变更，需单独批准。

---

## R2 · Instance 消费者盘点（红线项）：**结论为空集**

### 2.1 扫描范围（自证合规）

| 项 | 内容 |
| --- | --- |
| 扫描根 | `Instance/Dev/Luker/data/*/extensions/`、`Instance/Dev/SillyTavern/public/scripts/extensions/third-party/` |
| 文件类型限制 | `manifest.json` + `*.js` / `*.json` / `*.html`，且 glob 限定在 `extensions/**` |
| **未触碰** | ❌ 未读任何聊天内容 ❌ 未进入 `Instance/Real/**` ❌ 未遍历 `chats/` ❌ 未读会话密钥 |

### 2.2 实测结果

| 实例 | 已装第三方扩展 | 其中 Authority 消费者 |
| --- | --- | --- |
| `Dev/SillyTavern` | **0**（`third-party/` 为空目录） | **0** |
| `Dev/Luker` | **23** + 一个空的 `third-party/` 子目录 | **0** |
| `Dev/PureTavern` / `Dev/TauriTavern` | 无扩展目录 | — |

三种独立信号**全部为零**：
1. 含 `.authority` 目录的扩展：**0**（Companion Module 信号）
2. `manifest.json` 提及 `authority` 的扩展：**0**
3. 扩展源码中调用 `STAuthority|AuthoritySDK|api/plugins/authority|st-authority` 的文件：**0**

### 2.3 附带发现（不属本任务范围，仅登记）

1. **Dev 实例未安装 Authority**：全 Dev 树下无 `st-authority-sdk`、无 `plugins/authority`。
   → 前序治理规划的三篇规范**无法在 Dev 实例上做端到端验证**（无 Authority 可连）。
2. `Dev/Luker/data/*/extensions/third-party/` 为空目录（**不是** P-10 的嵌套覆没情形，仅空目录）。
3. Dev Luker 的 23 个扩展中含仓群内仓：`ST-BgLoader`、`st-git-improve`、`JS-Slash-Runner`、`chatfilesys` 等。

### 2.4 对前序任务盘点缺口的补齐

前序 `09-25-authority-plugin-governance-plan` 的 `research/00` §七保留了"实例内消费者未盘点"这一未验项。
**现结论：差集为空集** —— 仓群内外均无未被登记的 Authority 消费者（仓群外仍无登记载体，属治理缺口本身）。

---

## R3 · TS 穷尽性实测：**编译期会拦住**

### 3.1 方法

向 `packages/sdk-extension/src/client/feature-flags.ts` 的 `AuthorityFeaturePath` union
新增成员 `'__probe_ts_exhaustiveness__'`，**故意不**在 `getFeatureAvailability()` 的 switch 中加 `case`，
然后跑 `npx tsc -b packages/sdk-extension`。

### 3.2 实测输出

```
packages/sdk-extension/src/client/feature-flags.ts(32,105): error TS2366:
Function lacks ending return statement and return type does not include 'undefined'.
```

（行 32 即 `getFeatureAvailability` 的函数签名行。）

### 3.3 结论

**TypeScript 会在编译期报 TS2366 拦住该遗漏**，即使 `tsconfig.base.json` 未显式启用 `noImplicitReturns`——
因为函数声明返回类型为 `boolean`，union 未全覆盖时 TS 的穷尽性分析判定函数末尾可达，从而报错。

### 3.4 对前序规范的影响（已回填）

`.trellis/spec/shared-types/backend/capability-lifecycle.md` §四 的 **A3 断言**由"唯一防线"**降级为"双保险"**：
编译期已能拦住"漏加 case"，A3 仍覆盖编译期抓不到的形态——**加了 case 但路径名与真源不一致**
（例如真源写 `host.eventLedger` 而 switch 写 `host.event-ledger`）。

### 3.5 合规

探针已在实测后**立即用 `git checkout --` 完全还原**，`git status` 无残留，`tsc -b` 复核通过，探针字样已清除。
