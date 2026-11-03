# 执行计划 — Trellis tavern 模板与云同步（子任务 C）

> 复选框**随执行实时勾选**（L0-2）。每步的验证命令与输出即证据。
> 设计依据：同目录 `design.md`（市场契约均附 Trellis 0.6.16 代码出处）。

## 阶段 0 · 准备与环境断言

- [x] 0.1 `trellis --version` = **0.6.16**
- [x] 0.2 真源仓 `git status --short` 为空；`--verify` = 14/14 零漂移
- [x] 0.3 `ssh -T git@github.com` → `Hi jiozhaoyue! You've successfully authenticated`（云同步路径成立）

## 阶段 1 · 市场仓文件（真源仓 `tavern-harness`）

- [x] 1.1 `index.json`：`tavern`(workflow) + `tavern-spec`(spec) 两条目，两条 path 均已核实存在
- [x] 1.2 `workflows/tavern/workflow.md`：**原生逐字节 + 末尾纯追加 24 行**（修正记录见 design §3）
- [x] 1.3 断言：与原生差异的**原生侧删除/修改行 = 0**（`diff | grep -c '^<'` = 0），新增 24 行
- [x] 1.4 `specs/tavern/tavern/{host-compat,degradation,offline-frontend}.md` 三页种子
- [x] 1.5 断言 R1.2：`--verify` 仍 **14/14 零漂移**

## 阶段 2 · 补轨扩展（`scripts/tavern-init.mjs`）

- [x] 2.1 `ensureTrellisPrefs()`：幂等合并 `registry.spec`；条件写 `session_auto_commit: false`；
      写盘前 `.bak`；`--dry-run` 只打印；异常不阻断
- [x] 2.2 新增 `--skip-prefs`（实测生效）；收尾打印两条原生通道命令
- [x] 2.3 幂等实测：第二次"✓ 已是最新，无需改动"、`config.yaml` md5 不变；
      人工已写 `registry`/`session_auto_commit` 时**零覆盖**（md5 不变、人工值仍在）
- [x] 2.4 顺带修缺陷：`git check-ignore` 改以**目录形式（尾斜杠）**查询（不带斜杠时目录未创建会被误判）

## 阶段 3 · 推送与原生通道可达性（AC-C2 / AC-C9）

- [x] 3.1 真源仓三次提交推送：`df8ac8e` → `c9f6210` → `bfd5f10`（推送前 origin 审计：jiozhaoyue/tavern-harness）
- [x] 3.2 `trellis workflow -m git@github.com:jiozhaoyue/tavern-harness --list` → **列出 tavern (marketplace)** ✓
- [x] 3.3 反向验证：`gh:jiozhaoyue/tavern-harness` → `⚠ No marketplace index.json found`（私有仓 404 复现）

## 阶段 4 · 新项目路径（AC-C7）

- [x] 4.1 全新临时目录 `trellis init -y -u … --claude` → `.trellis/` 生成
- [x] 4.2 `-t tavern`（经 `--workflow tavern --workflow-source`）→ 落盘 `python3` = 0 / `python` = 32；追加节在场
- [x] 4.3 写入 `registry.spec` → 种子落 `.trellis/spec/tavern/` 三页，与源**逐字节一致**
- [x] 4.4 证据留存；临时目录已清理

## 阶段 5 · 既有项目路径（AC-C8，沙箱副本）

- [x] 5.1 复制真实仓 `.trellis/`（66 个 spec 文件）+ 预置本地改动（spec 追加一行 + config.yaml 写 registry 块）
- [x] 5.2 `update --dry-run` 分区：`New files (will add)` 三页种子；`Modified by you: ? .trellis/config.yaml`；
      `Deleted by you (preserved)`（沙箱未带的平台文件）。`update -s` 后：预置锚点仍在、registry 块仍在、
      `config.yaml` **md5 完全不变** → **本地改动零丢失，非静默覆盖**
- [x] 5.3 种子增量加入且逐字节一致；`update` 自留 `.trellis/.backup-<时间戳>/`
- [x] 5.4 证据留存；临时目录已清理；真实仓全程 0 项脏

## 阶段 6 · 文档与收口

- [x] 6.1 `README.md`：目录结构补市场文件 + 新增「Trellis 市场模板」节（含 SSH 前置条件）
- [x] 6.2 `CHANGELOG.md`：新增「市场模板」节 + 两处实测校正记录
- [x] 6.3 `docs/marketplace.md`：市场契约规范（布局 / id 语义 / 1:1 映射推导与实机验证 / 源形式反证 /
      一次性命令 / 本地改动不丢断言表 / Windows 渲染实测 / 维护自检 / 边界 / 已知限制）
- [x] 6.4 全量自查：`--verify` 零漂移、`test_sync_tavern_rules.py` ✅ 全部通过、`node --check` 通过、
      零 `Instance/**` 触碰、零 `upstream` 推送
- [x] 6.5 真源仓提交推送完成；本仓（Authority）范围门 `git status --short` = 空
- [x] 6.6 spec 更新判定：规范条文落真源仓 `docs/marketplace.md`（已推送）；本项目不新增 spec 页
      （通则已在规则块 L0-17 内，新增即与真源重复——与子任务 B 同一判断）
- [x] 6.7 journal 记录 + 归档 C（`--skip-branch-validation`）
- [x] 6.8 父任务集成验收：回填父 `implement.md`、勾选父 AC、归档父任务

> **勾选时点说明（如实记录）**：本文件的复选框在**收口时**一次性勾选，但每条的证据均为**执行当轮**
> 捕获的命令输出（见本文件各条括注与会话详录 `session-content.md`），非事后凭记忆补记。

## 回滚点

- 阶段 1/2 全在真源仓 → `git revert` 或 `git checkout --` 即回滚；**未对任何目标仓写盘**（验证只在临时目录）
- 阶段 4/5 的临时目录用完即删，不留痕
- 私有仓推送后若需回撤：`git revert` + 推送（**不用** force push）

## 风险与已知约束

| 风险 | 处置 |
| --- | --- |
| 本机无 GitHub SSH key → 阶段 3/4 无法验证 | 阶段 0.3 已先断言（实测通过），未伪造证据 |
| spec 目录映射（design §2.2）与实测不符 | 阶段 4.3 实机验证**落点与预期一致**（`.trellis/spec/tavern/`） |
| `trellis update` 会修剪 `.template-hashes.json` | 全程只在临时目录/沙箱副本里跑，未触碰真实仓 |
| 并行会话 | 本次改动集中在真源仓与临时目录，未写其他仓 → 与并行会话零交集（实测各仓 0 项脏） |
