# Assessment Pack Generation Strategy (Pre vs Runtime + Cache)

Timestamp: 2026-01-31T19:44:37+08:00

## Recommended Strategy: Hybrid (Option C)

- Pre-generate for hot topics (stable UX, strong regression)
- Runtime-generate only for provisional/new topics (user-confirmed), but immediately persist as a versioned pack

## Why Hybrid Works Here

- full-assessment default means pack generation cannot block the flow for common topics
- user background + agent expansion can introduce long-tail topics; runtime generation keeps flow unblocked
- “persist immediately + versioned key” keeps assessment reproducible

## Pack Scope

- Pack is topic-level and reusable (no user data inside)
- Runtime evaluation uses the pack; only answers/scores are user-specific

## Cache Key

Suggested:
- topic_id
- taxonomy_version
- rubric_version
- question_bank_version
- language

Avoid:
- profile_id / session_id (kills reuse)
- raw goal string (explodes variants)

## Storage Layout (Suggested)

`.workflow/learn/packs/{topic_id}/`
- `manifest.json`
  - pack_key fields
  - created_at
  - source: pre_generated | runtime_generated
  - status: active | provisional | deprecated
  - redirect_to_topic_id (optional)
- `taxonomy-{taxonomy_version}.json`
- `question-bank-{question_bank_version}.json`
- `regression-{question_bank_version}.jsonl`

## Governance

- Provisional packs can be promoted to active after review
- If a topic is merged/renamed:
  - mark old topic deprecated
  - keep redirect_to_topic_id
  - do not delete old packs; keep for historical comparability

## Open Questions

1) `language` in pack_key: ✅ locked (yes)
2) Provisional topics "minimal pack (3 questions)" first: ✅ locked (yes)
3) question_bank_version coupled to taxonomy_version: ✅ locked (strong binding)
