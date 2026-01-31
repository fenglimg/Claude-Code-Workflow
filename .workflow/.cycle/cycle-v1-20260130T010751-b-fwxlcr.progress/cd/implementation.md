# Implementation Progress - v1.2.0

## Document Status
| Field | Value |
|-------|-------|
| Version | 1.2.0 |
| Iteration | 3 |
| Updated | 2026-01-31T15:11:06+08:00 |
| Focus | TASK-005 inferred skill state machine (events + fold + CLI + gating + tests) |

---

## Implemented (Iteration 3)

### 1) Deterministic clock injection for tests

- `ccw/src/commands/learn.ts`
  - `nowIso()` now supports override via `CCW_NOW_ISO`.
  - `nowMs()` added for cooldown gating, validating `CCW_NOW_ISO` when used.

### 2) Inferred skill event folding into snapshot

- `ccw/src/commands/learn.ts`
  - Added fold handlers in `applyEventToSnapshot()` for:
    - `INFERRED_SKILL_PROPOSED`
    - `INFERRED_SKILL_CONFIRMED` (ignored unless `actor=user`)
    - `INFERRED_SKILL_REJECTED` (ignored unless `actor=user`)
    - `INFERRED_SKILL_SUPERSEDED`
  - Added helpers:
    - `safeInferredSkillTopicId()` (payload normalization + validation)
    - `inferredMapFromSnapshot()` / `writeInferredMapToSnapshot()` (stable ordering by `topic_id`)
  - Special-case behavior: proposals do not override already-confirmed skills; instead they are stored in `_metadata.pending_proposal` deterministically.

### 3) Dedicated CLI commands enforcing state machine rules

- `ccw/src/commands/learn.ts`
  - New commands (append events + best-effort snapshot update):
    - `learnProposeInferredSkillCommand`
    - `learnConfirmInferredSkillCommand`
    - `learnRejectInferredSkillCommand`
  - Rules enforced:
    - confirm/reject require `actor=user`
    - re-propose after rejection requires cooldown (30 days) AND new evidence (sha256 differs)
  - Evidence hashing:
    - `sha256Hex()` added; proposal `evidence_hash` derived from `--evidence` text.

- `ccw/src/cli.ts`
  - Registered new commands:
    - `learn:propose-inferred-skill`
    - `learn:confirm-inferred-skill`
    - `learn:reject-inferred-skill`

---

## Tests Added/Updated

- `ccw/tests/learn-inferred-skill-cli.test.js`
  - propose -> confirm flow
  - actor enforcement for confirm
  - reject -> cooldown + new-evidence gating
  - rollback restores view

