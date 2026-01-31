# Development Issues - v1.2.0

## Document Status
| Field | Value |
|-------|-------|
| Version | 1.2.0 |
| Iteration | 3 |
| Updated | 2026-01-31T15:11:06+08:00 |

---

## Resolved in Iteration 3

- Implemented inferred skill state machine events + fold + CLI enforcement + deterministic tests (TASK-005).

---

## Open Issues / Follow-ups

1) Supersede write path
- `INFERRED_SKILL_SUPERSEDED` is supported in fold, but there is no dedicated CLI command yet.
- If needed, add `learn:supersede-inferred-skill` with explicit payload + validation.

2) Confirming updates when already confirmed
- Current behavior does not override confirmed skills on new proposals; it stores a deterministic `_metadata.pending_proposal`.
- If product needs \"re-confirm\" flow, add explicit event(s) (e.g. `INFERRED_SKILL_REOPENED` / `INFERRED_SKILL_UPDATED`) and CLI support.

3) Schema tightening (optional)
- Snapshot schema intentionally allows additional properties.
- If consumers need stricter guarantees, add a specific schema for `skills.inferred[]` items (status/proficiency/confidence/evidence shapes).

4) Profile command integration
- `.claude/commands/learn/profile.md` still uses older direct inference confirmation flow.
- Consider migrating it to use the new `learn:propose-inferred-skill` + `learn:confirm-inferred-skill` + `learn:reject-inferred-skill`.

