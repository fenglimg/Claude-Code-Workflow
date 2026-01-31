# Development Issues - v1.1.0

## Document Status
| Field | Value |
|-------|-------|
| Version | 1.1.0 |
| Iteration | 2 |
| Updated | 2026-01-31T14:07:44+08:00 |
| Cycle | cycle-v1-20260130T010750-p0-aicdpz |

---

## Issues / Decisions

### Issue 1 (Resolved): experience_level required but prompt removed
- Status: Resolved via DEC-001
- Decision: `experience_level` optional/null in schema/validator; init/create does not force prompt.

### Issue 2: Schema duplication drift risk
- Severity: Medium
- Why: learn-profile schema exists in two places; currently identical but can diverge.
- Mitigation: single source of truth or CI check (hash compare).

### Issue 3: Telemetry contract stability
- Severity: Medium
- Why: metrics fields easily drift and break dashboards.
- Mitigation: contract tests and versioned telemetry payload.
