# Idea Deep Dive: `phase_name` as a Measurable Standard (Test-Agnostic)

## What We Lock In
`phase_name` is the **standardized stage label** for capability progression from **current ability -> target ability**.
It exists primarily to give downstream steps a common anchor:
- GeminiReview: check plan difficulty/ordering vs goal+profile
- Assessments: verify exit criteria per stage
- Progress tracking: determine whether user has “moved phases”

`phase_name` itself is not enough to be measurable; measurability comes from per-phase criteria + assessments.

---

## Enum (Stable)
Allowed values:
- `Foundation`
- `Core Concepts`
- `Advanced Topics`
- `Specialization`
- `Mastery`

Plan should output a **contiguous subrange** from `current_phase_name` to `target_phase_name`.

---

## Minimal Plan Schema Additions (Per Phase)
Each phase should include:
- `entry_criteria[]`: what must already be true (verifiable)
- `exit_criteria[]`: what must become true (verifiable)
- `assessments[]`: how to verify exit (type must be enum-valid)
- `confidence`: 0..1 (how reliable is the current ability estimate for this domain)

This makes phase measurable without binding to a specific evidence type.

---

## Minimal Profile Evidence Contract (Input to Planning)
To avoid planning on guesswork, ProfileCapabilityCheck requires:
- `domain`
- `current_phase_name` (enum)
- `confidence` (0..1)
- `evidence_summary` (human-readable)

If any missing / confidence low -> generate learn:profile_update/eval command and STOP (needs_user).

---

## Open Decisions
- How to compute `target_phase_name` from goal_spec (rules vs model)?
- Whether `confidence` should be per-domain only, or per-skill within a domain.
