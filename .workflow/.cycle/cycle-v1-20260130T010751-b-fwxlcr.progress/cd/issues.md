# Development Issues - v1.0.0

## Document Status
| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Iteration | 1 |
| Updated | 2026-01-30T01:11:50+08:00 |
| Cycle | cycle-v1-20260130T010751-b-fwxlcr |

---

## Open Issues / Decisions

### Issue 1: DEC-101 events 存储格式
- Severity: High
- Impact: 决定 append 原子性、恢复策略、读取性能。
- Recommendation: JSONL per profile + 严格一行一事件 + 读取跳过坏行并报警。

### Issue 2: 迁移策略
- Severity: Medium
- Impact: 旧 profile JSON 如何转为 events/snapshot，避免破坏兼容。
- Recommendation: PROFILE_IMPORTED + FIELD_SET/ASSERTED_SKILL_* 导入事件。

### Issue 3: rebuild 性能与 checkpoint
- Severity: Medium
- Impact: event stream 增长后 rebuild 可能变慢。
- Recommendation: 定期 snapshot checkpoint 或增量 fold。
