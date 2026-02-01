# Architecture (Cycle-3): Taxonomy + Pack + Full Assessment vNext

## Storage Layout
- Taxonomy index (canonical topic_id source): `.workflow/learn/taxonomy/index.json`
- Taxonomy audit log (append-only): `.workflow/learn/taxonomy/changes.ndjson`
- Packs: `.workflow/learn/packs/{topic_id}/pack.{taxonomy_version}.{rubric_version}.{question_bank_version}.{language}.json`

## Key Contracts
- `pack_key = { topic_id, taxonomy_version, rubric_version, question_bank_version, language }`
- Strong binding: `question_bank_version === taxonomy_version`
- Provisional topics default to seed packs (4 questions) in `learn:ensure-pack --mode auto`.
- Full assessment cannot terminate until pack is full completeness (must/core coverage + regression skeleton present).

## Flow (Internal)
1) `/learn:profile` imports `.claude/commands/learn/_internal/assess.js` via `Read(*)`.
2) `assess.assessTopic()`:
   - taxonomy-first resolve/ensure topic via `ccw learn:resolve-topic` / `ccw learn:ensure-topic`
   - ensure seed pack via `ccw learn:ensure-pack --mode auto`
   - upgrade to full pack via `ccw learn:ensure-pack --mode full` before termination checks
   - run single-topic question loop (max 20), strict stop conditions (ALL)
   - write `ASSESSMENT_*` events (audited)
   - return summary `{proficiency, confidence, stop_conditions, pack_key_hash}` to `/learn:profile`
3) `/learn:profile` persists the latest summary into profile JSON (`known_topics[]`) via `ccw learn:write-profile`, and also proposes inferred skills via `ccw learn:propose-inferred-skill` (no auto-confirm).

