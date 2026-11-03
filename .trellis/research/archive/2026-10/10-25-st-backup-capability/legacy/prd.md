# ST 选择性备份与整包恢复能力

## Goal

为 ST 平台补选择性备份 / 整包恢复端点（Authority 可移植子集的路由层），清除
`st-zip-converter` 在 ST 上的两大能力缺口。需求来源 `st-zip-converter` 父任务
`10-24-ui-orchestration-r2` R-B2 + `10-25-luker-selection-max` 取证。

## 背景事实（跨仓取证）

- **ST 原生无 selection**：`POST /api/users/backup` 忽略 selection 体，必全量打包
  （st-zip-converter `host-bridge.js` `BACKUP_SELECTION_SUPPORT.st = false`；浏览器内过滤是现状补偿）。
- **ST 原生无整包恢复**：`/api/users/restore` 与 `/api/users/restore-backup` 均 404
  （09-25 认证态黑盒取证 + 源码交叉印证，`src/endpoints/users-private.js` 无任何恢复路由）。
- **Luker 侧痛点（登记，本任务不实现）**：`settings` 键与 `backups/` 目录绑死
  （勾「设置」必同拉 backups 892.2MB，占包 49.8%；selection 无分离开关）——
  上游解绑或 Authority 通道代收精简包，留待后续任务。

## Requirements

| # | 要求 |
| --- | --- |
| R1 | **选择性备份端点**：`POST /api/plugins/authority/host/st-backup`——body 含 `selection`（ST 标准类目布尔表）与可选 `handle`；只把勾选类目打进 zip 流返回。粒度=类目级（与 Luker 原生 selection 同构，不臆造文件级）。 |
| R2 | **整包恢复端点**：`POST /api/plugins/authority/host/st-restore`——multipart 收 zip，解包校验（拒绝路径穿越/绝对路径），按类目**合并写入**用户数据目录（覆盖同名、不删独有），写前留清单快照（可报出改了哪些路径）。 |
| R3 | **能力探测端点**：已有 probe 响应里追加 `stBackup: true` 能力标记（消费方特性检测用；不新增端点则并入既有 probe 形状）。 |
| R4 | **ST 数据根定位**：经宿主注入的运行时上下文取得 ST 用户数据目录（与该仓既有 host 路由同源路径）；定位失败 → 明确 4xx 错误体，不猜路径。 |
| R5 | **安全边界**：路由沿用该仓权限/校验中间件链；恢复端点设包体上限；zip 内条目路径白名单（用户数据目录之内）。 |
| R6 | **测试**：路由级单测（打桩文件系统）：selection 差分（勾/不勾产物集合）、路径穿越拒绝、合并语义（不删独有）、probe 能力标记。 |

## Acceptance Criteria

- [ ] AC-1 选择性备份：同数据目录下勾选子集的产物**不含**未勾类目条目（差分断言）。
- [ ] AC-2 整包恢复：合成小包恢复后目标目录合并正确、独有文件仍在、穿越条目被拒且错误体可读。
- [ ] AC-3 probe 标记 `stBackup: true` 可被消费方（st-zip-converter 适配器）特性检测。
- [ ] AC-4 该仓测试全绿（`npm test` / 既有 vitest 套件零回归）。
- [ ] AC-5 消费仓适配器与两态单测落地于 st-zip-converter（该仓自身任务收口，此处只登记链接）。

## 范围外

- Luker `settings↔backups` 解绑（登记后续任务）。
- 文件/路径级选择粒度（Luker 端点取证已证无此契约，不臆造）。
- 跨主机传输/加密。

## 关联

- 需求方：`st-zip-converter` `.trellis/tasks/10-24-ui-orchestration-r2/prd.md` R-B2 / AC-6。
- 取证：`st-zip-converter` 任务 `10-25-luker-selection-max/research/luker-selection-probe.md`（Luker 契约）与归档任务 `09-25-batch-restore-luker-endpoint/research/host-endpoint-facts.md`（ST 404 取证）。
