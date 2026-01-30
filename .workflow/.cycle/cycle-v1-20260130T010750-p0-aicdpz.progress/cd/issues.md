# Development Issues - v1.0.0

## Document Status
| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Iteration | 1 |
| Updated | 2026-01-30T01:09:30+08:00 |
| Cycle | cycle-v1-20260130T010750-p0-aicdpz |

---

## Open Issues / Decisions

### Issue 1: experience_level required but prompt removed
- Severity: High
- Why: `learnWriteProfileCommand` currently throws if `experience_level` missing.
- Options: make optional in schema/validator (recommended) OR default + confidence OR infer-only.

### Issue 2: Schema duplication drift risk
- Severity: Medium
- Why: learn-profile schema exists in two places; currently identical but can diverge.
- Mitigation: single source of truth or CI check (hash compare).

### Issue 3: Telemetry contract stability
- Severity: Medium
- Why: metrics fields easily drift and break dashboards.
- Mitigation: contract tests and versioned telemetry payload.
