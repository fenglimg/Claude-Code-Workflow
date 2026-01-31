# Implementation Progress - v1.1.0

## Document Status
| Field | Value |
|-------|-------|
| Version | 1.1.0 |
| Iteration | 2 |
| Updated | 2026-01-31T14:07:44+08:00 |
| Cycle | cycle-v1-20260130T010750-p0-aicdpz |

---

## Summary

本次迭代已落地 P0（init friction down + pre_context_v1.3），并完成 DEC-001：

- DEC-001（已决定）：`experience_level` 在 schema/validator 中允许 omitted/null；初始化不再强制问经验自评
- init flow：不强制 `goal_type` / `experience_level` 的交互问答（降低创建摩擦）
- pre_context_v1.3：固定 4 问模板，持久化 `raw/parsed/provenance`，并记录 per-question skip 时间戳
- gating：在 `/learn:plan` 增加 missing/stale/cooldown/drift 的重问/复用逻辑（drift 由用户显式触发）
- 事件与埋点：追加 `PRECONTEXT_CAPTURED` / `FIELD_SET` 事件与 `PRECONTEXT_CAPTURED` / `PRECONTEXT_REUSED` / `PROFILE_CREATED` telemetry（best-effort，不阻塞主流程）

---

## Files Changed (Implementation Surface)

- `.claude/commands/learn/profile.md`（create 流程、pre_context provenance/skip、telemetry）
- `.claude/commands/learn/plan.md`（pre_context gating + drift/cooldown + reuse telemetry）
- `ccw/src/commands/learn.ts`（learn CLI：profile 读写、append events、telemetry、snapshot fold 等能力）
- `ccw/src/cli.ts`（learn CLI 命令注册）
- `.claude/workflows/cli-templates/schemas/learn-profile.schema.json`（experience_level optional/null + pre_context provenance 字段）
- `.workflow/learn/profiles/schemas/learn-profile.schema.json`（与 cli-templates schema 保持一致）

---

## Tasks Executed

- TASK-001：盘点并确认 init 的最小必填字段（goal_type/experience 不再强制）
- TASK-002：更新 init/create 交互流程（不强制问 goal_type/experience）
- TASK-003：冻结 pre_context_v1.3 固定 4 问（模板 + key 约定）
- TASK-004：持久化 pre_context raw/parsed/provenance；追加 PRECONTEXT_CAPTURED（best-effort）
- TASK-005：偏好摘要 + 用户纠错（FIELD_SET，禁止覆盖 raw）
- TASK-006：gating（missing/stale/cooldown + drift 显式触发）
- TASK-007：埋点（captured/reused/corrections + init completion）

---

## Notes / Follow-ups

- 覆盖率报告未生成（本仓库测试脚本当前不产出 coverage；见 VAS）
- `.workflow/learn/state.json` / `*.bak` 等可能由本地运行/测试产生，通常不应纳入提交
