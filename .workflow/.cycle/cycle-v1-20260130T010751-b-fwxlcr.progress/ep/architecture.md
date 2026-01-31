# Architecture Design - v1.2.0

## Document Status
| Field | Value |
|-------|-------|
| Version | 1.2.0 |
| Iteration | 3 |
| Updated | 2026-01-31T15:11:06+08:00 |
| Cycle | cycle-v1-20260130T010751-b-fwxlcr |

---

## Overview

Milestone B uses event sourcing style:
- `profile_events` (append-only NDJSON) is the source of truth.
- `profile_snapshot` is a derived read model folded deterministically from events.
- Rollback is implemented by appending a new event that changes the *current view* (without deleting history).

Iteration 3 adds an inferred-skill state machine on top of the same event log + fold engine.

---

## Inferred Skills State Machine

### States

- `proposed`
- `confirmed`
- `rejected`
- `superseded`

### Allowed transitions (MVP)

- `proposed -> confirmed` (only by explicit user action)
- `proposed -> rejected` (only by explicit user action)
- `confirmed -> superseded` (system/agent can mark old entry inactive when taxonomy/wording changes)
- `rejected -> proposed` (only with cooldown + new evidence)

### Actor rules

- `INFERRED_SKILL_CONFIRMED` and `INFERRED_SKILL_REJECTED` MUST have `actor=user`.
- No auto-confirm: inferred proposals never become confirmed without an explicit confirm event.

---

## Event Catalog (subset for TASK-005)

### INFERRED_SKILL_PROPOSED

- actor: `agent|system|user`
- payload:
  - `topic_id` (normalized to lowercase)
  - `proficiency` (0..1)
  - `confidence` (0..1 or null)
  - `evidence` (array, stored as provided; fold treats it as immutable)
  - `evidence_hash` (sha256 over `--evidence` text for gating)

### INFERRED_SKILL_CONFIRMED

- actor: `user` only
- payload:
  - `topic_id`

### INFERRED_SKILL_REJECTED

- actor: `user` only
- payload:
  - `topic_id`
  - `reason` (optional)
  - `rejected_evidence_hash` (captured from current proposed/confirmed entry for re-propose gating)

### INFERRED_SKILL_SUPERSEDED

- actor: any (MVP: accept, fold it)
- payload:
  - `topic_id`
  - `superseded_by_topic_id` (optional)

---

## Fold Strategy (Deterministic)

Implemented inside `applyEventToSnapshot()` and persisted via `foldSnapshotFromEvents()`:

- Maintain `snapshot.skills.inferred` as an array of objects keyed by `topic_id`.
- On every relevant inferred event, rebuild the inferred array deterministically:
  - convert array -> map keyed by `topic_id`
  - apply state transition
  - write back to array sorted by `topic_id`
- Confirm/reject events from non-user actors are ignored for safety.
- Special case: if a new proposal arrives when a skill is already `confirmed`, do not override the confirmed entry; store a deterministic `_metadata.pending_proposal` for review.

---

## Re-propose Gating (cooldown + new evidence)

Enforced in the *write path* (`learn:propose-inferred-skill`):
- If current folded view shows `status=rejected` for `topic_id`:
  - block until `now - rejected_at >= 30 days`
  - require new evidence (`evidence_hash != rejected_evidence_hash`)

### Deterministic time for tests

- `CCW_NOW_ISO` overrides the clock used by event creation and cooldown gating.
- Production behavior unchanged when env var is not set.

