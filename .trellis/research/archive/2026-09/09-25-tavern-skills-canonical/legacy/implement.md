# 实施清单 — 酒馆 skill 正本化与补轨分发

> 复选框随执行**实时勾选**（规则 4.5）。证据行在每阶段末尾。
> **PARDON 门**：阶段 0（移动素材）与阶段 8（分发写盘）均先出清单获用户批准。

## 阶段 0 — 素材落地（不跟踪目录） ✅

- [x] `.gitignore` 加 `skills-src/`（附三行理由：上游许可状态不一、只留本地）
- [x] 建 `skills-src/docs/`，7 篇 **移动**（非删除）——移动后 `sha256sum` 与移动前**逐一相同**
- [x] 建 `skills-src/upstream/`，取上游快照：TauriTavern 的 `ExtensionDEV.md` + `AGENTS.md` +
      `docs/{FrontendHostContract,FrontendGuide,TechStack,BackendStructure}.md` +
      `docs/API/{Extension,Chat,Dev,README,Migration,Layout,ChatSurface}.md` +
      `docs/CurrentState/{ThirdPartyExtensions,MemoryExtensionApi,MobileStyleAdaptation,ChatPayload}.md`
      + 上游 4 个 skill 原件
- [x] `skills-src/README.md` 记来源 URL + commit + 取用日期 + **许可状态列**

**证据**：`git check-ignore -v skills-src/` → `.gitignore:20:skills-src/`；`git status` 不含它

## 阶段 1 — 迁移 5 个既有 skill ✅

- [x] `cp -r` 5 个 → `skills/`
- [x] 逐目录 `diff -r` 断言零差异

**证据**：5 组 `diff -r` 全部 exit 0（"✓ 逐字节一致"）；共 15 个文件

## 阶段 2 — 收上游 4 个 ✅

- [x] 记录 upstream commit：`f447e54f4effc7980891d89ab7e9b3c9aa02737e`
- [x] 写 `scripts/vendor_upstream_skills.py`（**声明节由常量生成，不手写**）
- [x] `--apply` 写入 4 个
- [x] **修一处真实缺陷**：首版用 `read_text`/`write_text` → Windows 上 LF 被静默改 CRLF
      （14733→15855 字节），且 `--verify` 因 universal-newline 归一化而**假绿**
      → 改全程 `read_bytes`/`write_bytes` + 字节比对
- [x] 注入「正文被手改」→ `--verify` 检出并点名；`--apply` 复原；复检零漂移

**证据（AC-3）**：4 个全部 `diff 上游原件 vs 收录件` → **删除/修改 = 0，新增 = 10**（声明节 10 行）；
**仓库级复核**：`git show :skills/upstream/<名>/SKILL.md` vs 上游原件 → 新增=0（上游内容完整）、
差异=10 行声明；索引内 CRLF=0

## 阶段 3 — `tavern-ttavern-dev` ✅

- [x] 从 TT 上游 docs 提取：扩展目录规则、专属 API 面、移动端 Layout ABI
- [x] **发现并订正上游自相矛盾**：`ExtensionDEV.md`「窗口化聊天」节称 `getContext().chat`
      只反映窗口内消息，与权威文档 `docs/CurrentState/ChatPayload.md`
      （「不再提供 `chat_history_mode`，也不存在前端 window state」）及
      `docs/API/Chat.md`（`windowInfo().mode` 恒 `'off'`）**直接冲突**
      → skill 内以订正形式写明，并提示「不要为数组被截断写兼容分支」
- [x] 写 `SKILL.md` + `references/ttavern-api.md`（索引 + 签名事实，不复制上游正文）+ `agents/openai.yaml`
- [x] 显式声明「只覆盖纯前端扩展形态」；引上游文档路径

## 阶段 4 — `tavern-helper-dev` ✅

- [x] 写 `SKILL.md`：判型（`index.ts`+`index.html`=界面 / 仅 `index.ts`=脚本）+
      路由到上游 4 个 skill + `L1-JSR-1…20` **只给条目号** + 上游资料 URL + 硬边界
- [x] 写 `references/tooling-index.md`（工具链、目录形态、许可状态表）
- [x] **发现并登记 N-12**：`L1-JSR-20` 指向的 `D:\Repo\Tavern-repo\skills\` **不存在**
      （悬空引用，P-4 同类）→ skill 内标注 + 给出替代资料位置 + 登记缺陷
- [x] **自检（AC-5，比 grep 更强的判据）**：与上游 4 个 skill 的**最长公共子串** =
      `PolyFormNoncommercial100`（**许可名本身**）→ **零散文复制**

## 阶段 5 — 补强 host-compat + 更新 router + 清理悬空引用 ✅

- [x] `tavern-host-compat/SKILL.md`：矩阵改名并加**读法约定**（PT/TT 的 ❌ **只指服务端插件**，
      不代表不能开发扩展）；新增「四宿主形态映射（扩展开发视角）」节；PT 一行**诚实标注未穷尽检索**
- [x] `tavern-dev-workflow`：路由表 + skill 全景表 + frontmatter + `agents/openai.yaml` + playbook §1.1
- [x] **顺带清理 6 处悬空引用**（L0-17 类，均指向被 gitignore 的 `.trellis/tasks/`）：
      host-compat×2、browser-automation×2（含裸 `deliverables/04` 不可解析）、
      luker×1、playbook×3 处 → 全部改为**内联证据** + 标注「本机归档、不入库」
- [x] 为 browser-automation **内联**了端口断言四约束 + `e2e/guard.ts` 参考实现 + 留证落点表

## 阶段 6 — 补轨分发器 ✅

- [x] `scripts/sync_tavern_skills.py`（`--list`/`--dry-run`/`--apply`/`--verify`/`--skill`/`--prune`，
      备份落仓外，受管清单，UTF-8 stdio 护栏）
- [x] `scripts/test_sync_tavern_skills.py`（沙箱，**不触碰真实目录**）
- [x] **修两个脚本真缺陷 + 一个测试自身错误**：
      ① 无待写内容时提前 `return`，跳过受管清单与 `--prune`；
      ② 受管清单每轮被覆写 → 孤儿跨轮丢失 → `--prune` 永远等不到；
      ③ 测试用 `p.name` 取到 `"SKILL.md"` 而非目录名（脚本本正确）
- [x] **修链接判定真缺陷**：本机 `~/.claude/skills/*` 是**目录 junction**，
      Python `Path.is_symlink()` 对 junction 返回 **False** → 5 个既有链接被误判为
      "存在但不是链接"而跳过。改 `os.readlink` 判定；创建改 `cmd /c mklink /J`
      （junction 与既有约定一致，且**无需管理员权限**）
- [x] 沙箱回归 **37 项全绿**，且**不带** `PYTHONIOENCODING` 也全绿

**证据（AC-8）**：`✅ 全部通过`，exit=0；含 Windows junction 专项回归

## 阶段 7 — 文档 ✅

- [x] `docs/skills.md` 新建（布局 / 命名不变式 / 分发契约 / 与规则块·spec 的边界 /
      上游收录的字节级要求 / 新增 skill 步骤 / 维护自检 / **跨机器行尾限制**）
- [x] `docs/marketplace.md` §11：市场不支持 skill 类型（附 `template-fetcher.js:840` 原文 + 先例辨析）
- [x] `README.md`：目录树 + 「skill 正本与分发」节 + **「来源声明」节**（三列：内容 / 来源 / 许可状态 / 处置）
- [x] `CHANGELOG.md` 新节（含首版脚本四个缺陷的记录）
- [x] **`.gitattributes` 新建**：锁 LF——`core.autocrlf=true` 会破坏字节级比对契约

## 阶段 8 — 分发（PARDON 门已批准） ✅

- [x] `--dry-run` 完整清单（11 skill / 10 新建 / 10 更新 / 6 新链接）**已列给用户并获批准**
- [x] 额外核查：目标侧 5 个 skill **无未提交本地改动**（覆盖不丢用户工作）
- [x] `--apply` → 写入 20 文件 + 建 6 个 junction；备份 `.backups/skills/20260926-001634`
- [x] `--verify` **零漂移**；既有 5 个 junction 经核实**未动**

**证据（AC-9/AC-10）**：`11 个 skill，11 个与真源逐字节一致，0 个需处理`；
`~/.agents/skills` 与 `~/.claude/skills` 各 11 个可解析；目标内 `*.bak` = 0

## 阶段 9 — 收口 ✅

- [x] `tavern-harness` 提交 **`bc4a34d`** 推送 origin（`bfd5f10..bc4a34d`）
- [x] `~/.agents` 提交 **`fdd23f1`** 推送 origin（`e7a099b..fdd23f1`）——
      **只 add 20 个文件**，该仓另有约 400 项未提交改动**未被牵连**（已复核）
- [x] 两个仓推送前均做 `git remote -v` 审计；**零 `upstream` 推送**；`Instance/Real/**` 零操作
- [x] 全量自检五连：skill 回归 37/37 ✅、上游字节一致 ✅、分发零漂移 ✅、
      规则回归 ✅、规则块 --verify **13/14**

**关于 13/14**：唯一漂移项是 `ST-chatfilesys-rebuild/AGENTS.md`，**由并发会话手改规则块正文造成**
（该文件 mtime 2026-09-25 23:38:56，本会话未写任何目标仓）→ 已登记 **N-13**，
用户裁定**本轮零操作、先存证**。`rules/` 本任务**零改动**（该结论不受影响）。

- [x] 回填本文件与 `prd.md` 的 AC 勾选（实时）
- [ ] `task.py finish` → `task.py archive`（待用户确认后再归档）
