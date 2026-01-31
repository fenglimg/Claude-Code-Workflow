# Implementation Progress - v1.1.0

## Document Status
| Field | Value |
|-------|-------|
| Version | 1.1.0 |
| Iteration | 2 |
| Updated | 2026-01-31T14:37:10+08:00 |
| Cycle | cycle-v1-20260130T010751-b-fwxlcr |

---

## Summary

本次迭代优先把 Milestone B 的“可回放基础设施”闭环（事件/快照/回滚），并先决定 DEC-101：

- DEC-101（已决定）：每个 profile 一份 JSONL 事件文件（append-only）
- 已实现：append_event + monotonic version（lock-protected）
- 已实现：snapshot fold/rebuild（支持 target_version）+ 持久化 snapshot
- 已实现：rollback_to_version（通过追加 ROLLBACK_TO_VERSION 事件，不删除历史）
- 已增加：golden determinism tests（同一事件流 -> 同一 snapshot）

本次迭代不包含 inferred state machine（TASK-005），留到下一轮。

---

## Implemented CLI Surface

- `ccw learn:append-profile-event`（NDJSON, append-only）
- `ccw learn:read-profile-snapshot`
- `ccw learn:rebuild-profile-snapshot --target-version <n> [--no-persist]`
- `ccw learn:rollback-profile --target-version <n>`（append-only rollback event）

---

## Files Changed (Implementation Surface)

- `ccw/src/commands/learn.ts`（events/snapshot/rebuild/rollback commands）
- `ccw/src/cli.ts`（new CLI command registrations）
- `.claude/workflows/cli-templates/schemas/learn-profile-snapshot.schema.json`（snapshot schema）
- `.workflow/learn/profiles/schemas/learn-profile-snapshot.schema.json`（runtime copy for $schema reference）
- `ccw/tests/learn-profile-events-cli.test.js`（assert snapshot is updated）
- `ccw/tests/learn-profile-snapshot-cli.test.js`（rebuild/rollback + determinism tests）

---

## Task Status

- TASK-001 Define profile_snapshot schema: DONE（新增 snapshot schema）
- TASK-002 Define profile_events catalog (DEC-101): PARTIAL（仅完成 DEC-101；catalog 细化留后续）
- TASK-003 Implement append_event + versioning strategy: DONE
- TASK-004 Implement fold/rebuild snapshot (target_version supported): DONE
- TASK-005 inferred state machine + user confirm/reject: DEFERRED
- TASK-006 rollback_to_version: DONE
- TASK-007 metrics + explainability: PARTIAL（本轮覆盖事件/回滚路径的基础指标入口；完整闭环留后续）

---

## Follow-ups

- 统一事件类型 catalog（强校验/枚举）与 payload schema（避免 drift）
- inferred 状态机：proposed/confirmed/rejected/superseded + cooldown/new evidence
- 给 snapshot/rebuild 增加性能基线（N events rebuild duration）
