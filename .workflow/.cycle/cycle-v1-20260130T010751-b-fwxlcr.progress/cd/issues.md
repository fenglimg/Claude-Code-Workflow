# Development Issues - v1.1.0

## Document Status
| Field | Value |
|-------|-------|
| Version | 1.1.0 |
| Iteration | 2 |
| Updated | 2026-01-31T14:37:10+08:00 |
| Cycle | cycle-v1-20260130T010751-b-fwxlcr |

---

## Issues / Decisions

### Issue 1 (Resolved): DEC-101 events 存储格式
- Status: Resolved via DEC-101
- Decision: JSONL per profile + strict line-per-event append; reader ignores bad lines.

### Issue 2: 迁移策略
- Severity: Medium
- Impact: 旧 profile JSON 如何转为 events/snapshot，避免破坏兼容。
- Recommendation: PROFILE_IMPORTED + FIELD_SET/ASSERTED_SKILL_* 导入事件。

### Issue 3: rebuild 性能与 checkpoint
- Severity: Medium
- Impact: event stream 增长后 rebuild 可能变慢。
- Recommendation: 定期 snapshot checkpoint 或增量 fold。
