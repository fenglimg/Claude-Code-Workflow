# Issues / Follow-ups (Cycle-3)

## Known Limitations (Intentional for vNext)
- Assessment scoring uses a “self-rating” step (`correct|partial|wrong|skip`) to drive convergence. It is conservative but not fully automatic rubric grading.
- Pack taxonomy is deterministic placeholder (`defaultSubpointsForTopic`). Real taxonomy curation can be layered later (topic-specific must/core definition).
- Regression cases are a skeleton (count gate) rather than a real question-level regression runner yet.

## Suggested Next Work (If Needed)
1) Add a real regression runner for active topics (execute regression cases + CI gate).\n
2) Replace placeholder pack/taxonomy generator with curated taxonomy + question bank generation pipeline.\n
3) Add a small CLI helper to query “already assessed for pack_key” without reading NDJSON in the internal module.\n

