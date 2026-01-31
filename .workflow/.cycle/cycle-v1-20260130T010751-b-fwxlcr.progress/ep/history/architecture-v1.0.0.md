# Architecture Design - v1.0.0

## Document Status
| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Iteration | 1 |
| Updated | 2026-01-30T01:11:30+08:00 |
| Cycle | cycle-v1-20260130T010751-b-fwxlcr |

---

## Proposed Model

### Storage Split
- `profile_snapshot`: 业务读取用（快速、当前态）
- `profile_events`: append-only（审计、回放、回滚）

### Event Stream
- 单条 event（建议 JSONL 一行一事件）：
  - event_id, profile_id, version, type, actor, created_at, payload

### Fold/Rebuild
- `rebuild_snapshot(profile_id, target_version?)`:
  - 读取 event stream（到 target_version）
  - fold 成 snapshot（确定性）
  - 写 snapshot（atomicWriteJson）

### inferred 技能状态机
- proposed -> confirmed/rejected -> superseded
- confirmed 仅 user 显式确认。
- rejected 再提必须 cooldown + new evidence。

### rollback
- 追加 ROLLBACK_TO_VERSION 事件
- rebuild 到目标 version 并生成“回滚视图”的新 version snapshot

---

## Migration Strategy (from existing profile JSON)

- 首次启用 events：
  - 写 PROFILE_CREATED（或 PROFILE_IMPORTED）
  - 将旧 snapshot 的关键字段转为一组 FIELD_SET / ASSERTED_SKILL_ADDED / PRECONTEXT_CAPTURED 事件（保持可回放）
  - 再生成新 snapshot

---

## Observability

- event 写入：latency / error rate
- rebuild：duration / failure rate
- inferred：proposed/confirm/reject/repropose
- rollback：request rate / failure rate
