# Implementation (v1.0.0)

**Cycle**: cycle-v1-20260201T170509-learnprofilev4-bwxjep  
**Updated**: 2026-02-01T17:34:14+08:00

## What Changed

### 1) Bash noise reduction: batched event appends
- Added new CCW CLI command: ccw learn:append-profile-events-batch
  - Appends N immutable events in one lock and updates snapshot once.
  - Reuses the same explicit event-type whitelist as learn:append-profile-event.
- Updated assessment runtime (.claude/commands/learn/_internal/assess.js) to buffer events and flush every 4 questions.

### 2) Seed=4 + Full pack async job (Gemini-first)
- Extended assessment pack question shape (back-compat optional fields):
  - difficulty (0..1), capability_node (see/explain/apply/debug), common_mistakes[], grading_notes.
- Updated deterministic seed pack builder to always produce a discriminative 4Q set:
  - difficulties: 0.25 / 0.45 / 0.65 / 0.85
  - capability nodes: see / explain / apply / debug
  - must coverage >= 2 when taxonomy has must.
- Updated ccw learn:ensure-pack:
  - Seed path: Gemini CLI first (blocking), fallback to deterministic builder.
  - Full path: Gemini-first background job (non-blocking) tracked via job status file:
    .workflow/learn/packs/{topic_id}/jobs/{pack_key_hash}.full.json
    - Job runner uses CCW_LEARN_FULL_PACK_JOB=1 to avoid recursive spawn.
  - Tests force deterministic generation via CCW_LEARN_PACK_GENERATOR=deterministic.

### 3) Assessment algorithm: continuous interval + confirm/edit + no self-rating
- Rewrote .claude/commands/learn/_internal/assess.js:
  - Removes self-rating + skip.
  - Uses bility_interval=[lo,hi] with stop rule sigma<=0.1 (or N_seed_max=6 -> low_confidence_stop).
  - Answer interaction is: free text -> confirm submit / continue edit.
  - Starts full pack job once; checks pack status only every 4 questions.

### 4) /learn:profile create: profile reuse + topic expansion loop
- Updated .claude/commands/learn/profile.md:
  - create defaults to upsert into ctive_profile_id (unless user passes explicit id).
  - Removes learn:parse-background dependency for topic candidates.
  - Implements topic coverage feedback loop as 4 multiSelect questions (<=4 options each) + free text, max 3 rounds.
  - Only user-selected/typed labels are resolved/ensured.
  - Pre-context headers show (1/4..4/4) in each AskUserQuestion call.

## Files Touched (Primary)
- ccw/src/commands/learn.ts
- ccw/src/cli.ts
- .claude/commands/learn/profile.md
- .claude/commands/learn/_internal/assess.js
- ccw/tests/learn-profile-events-cli.test.js
- ccw/tests/learn-pack-completeness-cli.test.js
- ccw/tests/learn-assess-internal-vnext.test.js

## Notes
- Gemini generation is enabled by default (CCW_LEARN_PACK_GENERATOR defaults to gemini).
  - For hermetic environments, set CCW_LEARN_PACK_GENERATOR=deterministic.
- Full-pack async job writes job status; assessment never blocks waiting for it.

