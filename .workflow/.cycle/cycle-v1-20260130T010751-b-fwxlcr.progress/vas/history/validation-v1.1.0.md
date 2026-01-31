# Validation Report - v1.1.0

## Executive Summary
- Cycle: cycle-v1-20260130T010751-b-fwxlcr
- Iteration: 2
- Status: PASS
- Test command: `npm test`
- Result: 199/199 passed (duration_ms=54580)

本次迭代已决策 DEC-101 并完成 Milestone B 的基础闭环（append-only events + deterministic snapshot rebuild + rollback）。inferred state machine（TASK-005）仍待下一轮。

---

## What Was Validated

### Deterministic Snapshot (Golden Tests)
- 同一事件流 fold/rebuild 的输出一致（deterministic & idempotent）
- 支持 target_version fold（审计/回滚视图）

### Rollback Semantics
- rollback 通过追加 `ROLLBACK_TO_VERSION` 实现（append-only；不删除历史）
- rollback 后 snapshot 版本追踪 head event version，同时内容对应 target_version 的 fold 结果

### Schema & IO
- snapshot schema 存在并可用于运行时验证
- NDJSON events reader 忽略坏行（append-only 语义下的 best-effort 容错）

---

## Manual Checklist (Recommended)

1) 新建 profile + 追加两个事件（PRECONTEXT_CAPTURED / FIELD_SET）
2) `ccw learn:read-profile-snapshot --profile-id <id>`
3) `ccw learn:rebuild-profile-snapshot --profile-id <id> --target-version 1`
4) `ccw learn:rollback-profile --profile-id <id> --target-version 1`
5) 确认：
   - `.workflow/learn/profiles/events/<id>.ndjson` 行数递增
   - `.workflow/learn/profiles/snapshots/<id>.json` 更新且包含 `_metadata.rolled_back_*`

---

## Known Gaps / Next Iteration

- inferred state machine（proposed/confirmed/rejected/superseded + cooldown/new evidence）
- 事件 catalog 强校验与 payload schema（避免 drift）
- coverage 未采集（当前 `npm test` 默认不产出 coverage 报表）
