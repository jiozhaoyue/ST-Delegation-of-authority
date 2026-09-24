# Quality Guidelines — `authority-core`

> core 层质量规范。总览见 [index](./index.md)。

---

## 写代码前检查清单

1. **这是不是新内部端点？** 是 → `main.rs` 的 `v1_routes` 加 route + handler（`:96` 起的既有模式），并确认 DTO 语义与 `packages/shared-types` 同构。
2. **这是不是性能敏感改动？** 是 → 改完跑 `npm run bench:core`（门槛：平均 ≤150ms、P95 ≤300ms）与 `npm run bench:scale`（脚本：`scripts/benchmark-core.mjs` / `benchmark-scale.mjs`；指标文档：`docs/server/performance-benchmarks.md`）。
3. **是否改了数据布局或限额？** 是 → 与 `packages/server-plugin/src/constants.ts:14-25` 对齐，并全量 `npm test`。
4. **core-only 改动收尾**（`docs/server/ai-integration-guide.md` §7.3，行 328-337）：`cargo test` → 更新 managed core 产物 → 更新 `.authority-release.json` → installable 检查。
5. **发布验证链**（本仓交付前全绿要求）：`npm run typecheck && npm run build && npm test && npm run bench:core && npm run bench:scale && npm run sync:installable && npm run check:installable`（README「发布流程」节）。

---

## 反模式

- 在 core 实现权限裁决（权限语义唯一权威在 adapter 的 `PermissionService`）。
- 把 core 端点当公开 API 对外宣传或让前端直连（`/v1/*` 是内部层，`docs/server/ai-integration-guide.md` §6.1，行 231-237）。
- 引入"任意代码执行"类能力（jobs 仅 4 个内置类型：`packages/server-plugin/src/constants.ts:73`；禁区 §6.5，行 277-286）。
- 时间戳做内容变化判断——本仓群通则用内容指纹（统一规则块 L1-MF-13）；core 内哈希/指纹逻辑遵循该取向。
- 升级 `triviumdb` 不带联动（git tag 变更 = 合同变更，见 [database-guidelines.md](./database-guidelines.md)）。

---

## 验证

```bash
cargo test --manifest-path crates/authority-core/Cargo.toml
npm run build:core
npm run bench:core && npm run bench:scale
```
