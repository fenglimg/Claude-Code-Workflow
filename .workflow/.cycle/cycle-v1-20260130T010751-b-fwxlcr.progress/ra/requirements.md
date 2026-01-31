# Requirements Specification - v1.2.0

## Document Status
| Field | Value |
|-------|-------|
| **Version** | 1.2.0 |
| **Iteration** | 3 |
| **Updated** | 2026-01-31T15:11:06+08:00 |
| **Source Task** | `.workflow/.brainstorm/BS-learn-profile优化-2026-01-29/cycle-task-milestone-b.md` |
| **Scope** | Cycle 3 (Milestone B): inferred skill state machine on top of events/snapshot/rollback |
| **Mode** | Implemented + validated: inferred propose/confirm/reject commands + fold rules + golden tests |

---

## Goal

把 learn:profile 的画像模型升级为“可解释、可审计、可回滚”的状态系统：
- snapshot（读模型）用于业务读取
- events（append-only）用于审计、回放、回滚
- inferred 技能走状态机，confirmed 只能来自用户显式确认

---

## Decisions

- DEC-101 (iteration 2): `profile_events` storage format = JSONL per profile (`.workflow/learn/profiles/events/{profileId}.ndjson`).
- DEC-102 (iteration 3): inferred skills state machine (events + fold + actor rules) + re-propose gating (cooldown 30d + new evidence) + test-time clock injection (`CCW_NOW_ISO`).

---

## Functional Requirements

### FR-101: profile_snapshot (derived read model)
- Provide latest snapshot per profile id.
- Snapshot minimum fields: `pre_context` + `skills(asserted/inferred)` + `version` + `updated_at`.

### FR-102: profile_events (append-only audit log)
- Append-only event stream with monotonic `version`.
- Events are immutable once written.
- Snapshot rebuild is deterministic from events.

### FR-103: inferred skills state machine (proposed/confirmed/rejected/superseded)
- Introduce inferred skill lifecycle via events:
  - `INFERRED_SKILL_PROPOSED`
  - `INFERRED_SKILL_CONFIRMED`
  - `INFERRED_SKILL_REJECTED`
  - `INFERRED_SKILL_SUPERSEDED`
- Actor rules:
  - confirm/reject must have `actor=user`.
  - no auto-confirm (proposed never becomes confirmed without explicit confirm event).
- Fold rules (deterministic):
  - `snapshot.skills.inferred` is derived from events deterministically; ordering is stable by `topic_id`.
  - Rejections block re-propose unless BOTH conditions are met:
    - cooldown >= 30 days since rejection time
    - new evidence (evidence hash differs from last rejected evidence hash)
- CLI enforcement:
  - Provide dedicated commands that enforce the above rules:
    - `learn:propose-inferred-skill`
    - `learn:confirm-inferred-skill`
    - `learn:reject-inferred-skill`

### FR-104: rollback does not delete history
- Rollback is implemented as an event (`ROLLBACK_TO_VERSION`) and does not delete events.
- Fold respects rollback by building a rolled-back view at the head version.

---

## Non-Functional Requirements

### NFR-201: determinism
- Same event stream must produce the same snapshot.

### NFR-202: test-time determinism
- Allow injecting deterministic \"now\" via env var `CCW_NOW_ISO`.

### NFR-203: safety
- Avoid mutating event payload objects during fold (events remain immutable).

---

## Acceptance Criteria (Iteration 3)

- `learn:propose-inferred-skill` writes `INFERRED_SKILL_PROPOSED` and updates snapshot.
- `learn:confirm-inferred-skill` and `learn:reject-inferred-skill` enforce `actor=user`.
- Re-propose after rejection is blocked until cooldown + new evidence.
- Fold output is deterministic and rollback combinations work.
- `npm test` passes.

