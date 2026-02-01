# Exploration (Cycle-2): learn:profile Flow vNext

Version: v1.0.0  
Cycle: `cycle-v1-20260131T223026-profileflow-jiehna`

---

## Existing Constraints From Tests (must keep)

- `ccw/tests/learn-profile-doc-contract.test.js` requires:
  - heading `### Phase 4: Profile Selection Flow (select)` exists and contains `ccw learn:read-state --json` and `ccw learn:update-state --field active_profile_id`
  - heading `### Phase 5: Profile Display Flow (show)` exists and contains `ccw learn:read-state --json` and `ccw learn:read-profile`
  - scratchpad marker `.workflow/.scratchpad/learn-challenges` exists
  - mcp-runner parsing example uses `lastJsonObjectFromText(raw)` (not `JSON.parse(raw)`)
- `ccw/tests/learn-profile-minimal.test.js` expects the doc includes:
  - `--full-assessment`, `is_minimal`, `completion_percent`, `JIT`, and `learn:parse-background`

Therefore Cycle-2 must refactor carefully: change UX/flow but preserve these invariants.

## Current /learn:profile structure

File: `.claude/commands/learn/profile.md`
- Contains a JS implementation block with `createFlow/updateFlow/selectFlow/showFlow`.
- Already supports `Read(*)` and loads internal `assess.js` (Cycle-1).
- Still has:
  - English fragments in pre_context and background prompt
  - background is optional and not persisted into `profile.background`
  - legacy `add_topic` update action exposed
  - selectFlow is exposed and does not filter p-e2e-*

## Backend learn APIs

File: `ccw/src/commands/learn.ts`
- `learn:list-profiles` enumerates `profiles/*.json` and returns summaries (no filter).
- `learn:set-active-profile` sets `state.active_profile_id` (no filter).
- `learn:update-state --field active_profile_id` sets `active_profile_id` (no filter).

Cycle-2 needs to enforce: `p-e2e-*` never visible and never set as active.

