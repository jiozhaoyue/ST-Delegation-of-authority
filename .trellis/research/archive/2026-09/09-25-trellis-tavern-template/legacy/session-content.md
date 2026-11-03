# 任务 C 会话详录：Trellis tavern 模板与云同步（2026-09-25）

## 一、阶段 0 环境断言（全绿）

- `trellis --version` = **0.6.16**；真源仓干净且 `--verify` **14/14 零漂移**；
- `ssh -T git@github.com` → `Hi jiozhaoyue! You've successfully authenticated`（云同步路径成立）。

## 二、取了什么契约证据（决定布局，全部来自 Trellis 0.6.16 `dist/`）

| 事实 | 出处 |
| --- | --- |
| `git@github.com:org/repo` 属 **Public SSH → native(giget) 后端**，私有仓可用 | `dist/utils/template-fetcher.js:116-123` 映射表 |
| `type:"workflow"` 条目只取**单文件**内容；`type:"spec"` 才被 `downloadTemplateById` 接受 | `dist/utils/workflow-resolver.js:102-116`、`template-fetcher.js`（"only 'spec' is supported"） |
| **spec 目录 1:1 映射**：索引 `path` 目录内容 → 下载进 `<temp>/.trellis/spec/` → 整目录收集为 `.trellis/spec/` | `dist/commands/update.js` 的 `collectRegistrySpecTemplates()` + `getInstallPath(cwd,"spec")` |
| 非 `native` id 的 workflow 哈希条目会被**删除**（`update` 不覆盖它） | `dist/commands/workflow.js:103-118` `applyHashContract` |
| `trellis init` 原生支持 `-y -u --workflow --workflow-source -r/--registry -t` | `trellis init --help` |

## 三、产出（真源仓提交，均已推送 origin）

| 提交 | 内容 |
| --- | --- |
| `df8ac8e` | `index.json`（两条目：tavern/tavern-spec）、`workflows/tavern/workflow.md`、`specs/tavern/tavern/{host-compat,degradation,offline-frontend}.md`、`scripts/tavern-init.mjs` 补轨扩展 |
| `c9f6210` | workflow 模板修正：改为**原生逐字节 + 末尾纯追加 24 行**（原生侧删除/修改行 = 0） |
| `bfd5f10` | `docs/marketplace.md` 规范条文 + README/CHANGELOG 同步 |

### 两处"先写错、再实测改对"（如实记录）

1. **模板不再自带 `python3→python` 适配**。对照实验：`--workflow native` 与 `--workflow tavern` 在 Windows
   上产物均为 `python3`=0 / `python`=32 → CLI 自己渲染生成物（原话 `Windows detected: Trellis rendered
   Python commands as "python" ...`）。模板自带适配会让非 Windows 使用者拿到未定义命令 → 已还原为原生原样。
   同时补上 PRD R2.1 要求、先前被我从简省略的**指向性提示**节。
2. **spec 种子目录需再嵌一层** `tavern/`（见上表映射规则）；否则种子会落在 `.trellis/spec/` 根。

### 补轨脚本扩展（`tavern-init.mjs`）

- 新增 `ensureTrellisPrefs()`：幂等合并 `registry.spec` 自举块（SSH 形式）；**仅当** `.trellis/tasks|workspace`
  被 `.gitignore` 排除时才写 `session_auto_commit: false`；写盘前 `.bak`；`--dry-run` 只打印；异常不阻断；
  新增 `--skip-prefs`；收尾打印两条**原生通道**命令（不代劳下载）。
- **修一处实测缺陷**：`git check-ignore` 须以**目录形式（尾斜杠）**查询——不带斜杠时目录尚未创建会被
  误判为"未忽略"（实测同路径 status=1 vs 0）。

## 四、验收证据

| AC | 结果 |
| --- | --- |
| **AC-C1** | 市场文件就位；`--verify` 仍 **14/14 零漂移**（新增市场文件不影响块哈希） |
| **AC-C2** | `trellis workflow -m git@github.com:jiozhaoyue/tavern-harness --list` → 列出 `tavern (marketplace) — Tavern workflow (SillyTavern repo group)` |
| **AC-C3** | 模板定制逐条有据：与原生差异**仅**末尾追加节（原生侧删除/修改 = 0） |
| **AC-C4** | spec 三页只指向条目号与 skill 名，零正文复制；边界表在 `docs/marketplace.md` §9 |
| **AC-C5** | 盘点表见 PRD R4.1（本轮逐项处置：workflow/config/spec/规则块均已落；平台门禁=明确不做） |
| **AC-C6** | 补轨幂等实测：第二次运行"✓ 已是最新，无需改动"、`config.yaml` md5 不变；人工已写 `registry` 与 `session_auto_commit` 时**零覆盖**（文件 md5 不变、人工值仍在）；`.bak` 已生成；`--skip-prefs` 生效 |
| **AC-C7** | 新项目一条命令实跑成功：`trellis init -y -u … --workflow tavern --workflow-source <SSH> --registry <SSH> -t tavern-spec` → 落盘 `python3`=0/`python`=32、追加节在场、种子落在 `.trellis/spec/tavern/` 三页且与源**逐字节一致** |
| **AC-C8** | 既有项目沙箱副本：干跑分区 = `New files (will add)` 三页种子 + `Modified by you: ? .trellis/config.yaml` + `Deleted by you (preserved)`；`update -s` 后预置锚点仍在（1 处）、本地 registry 块仍在、`config.yaml` **md5 完全不变**、种子增量加入且逐字节一致、`update` 自留 `.backup-<时间戳>/`；真实仓全程 0 项脏 |
| **AC-C9** | 真源仓三次提交已推 `origin`；README + `docs/marketplace.md` §4 写明 SSH 前置条件与替代方案 |
| **AC-C10** | 未触碰 Trellis 上游源码与 `node_modules`；零 `upstream` 推送；`Instance/**` 零操作（全部验证在临时目录） |

反证：`gh:jiozhaoyue/tavern-harness` 形式 → `⚠ No marketplace index.json found at the configured source`（N8 复现）。

## 五、遗留与说明

- 临时目录（新项目 / native 对照 / 渲染实验 / 既有项目沙箱）**均已按 R6.4 清理**（见下条命令留证）。
- 本次未对任何目标仓写入（含 Authority 自身）→ 各仓工作区零影响。
- spec 更新（L0-17）：本次规范条文落在**真源仓** `docs/marketplace.md`（市场的归属地，已推送）；
  Authority 仓不新增 spec 页——通则已在规则块（L0-17）内，新增即与真源重复（与子任务 B 同一判断）。
