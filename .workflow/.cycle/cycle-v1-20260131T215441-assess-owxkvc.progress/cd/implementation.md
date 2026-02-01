# Implementation (Cycle-1): Assessment Plumbing

Version: v1.0.0  
Cycle: `cycle-v1-20260131T215441-assess-owxkvc`

---

## What Changed

### 1) `/learn:profile` can load internal assessment module + uses `Read(*)`

- Updated `.claude/commands/learn/profile.md`:
  - frontmatter: add `Read(*)` to `allowed-tools`
  - flags: remove `--no-assessment`; support `--full-assessment[=true|false]` with default `true`
  - load internal module via ESM: `await import('./_internal/assess.js')` and factory injection
  - create/update entrypoints can run a minimal single-topic assessment (1 question) via `__assess.assessTopic(...)`
  - removed the most jarring English prompt in background confirmation (now Chinese)

### 2) Internal assessment module (Cycle-1 minimal)

- Added `.claude/commands/learn/_internal/assess.js`
  - `createAssess({ AskUserQuestion, Bash, Read })`
  - `assessTopic({ profileId, topicId, language })`
  - behavior:
    - ensure pack exists (creates minimal pack if missing)
    - append `ASSESSMENT_*` events (session/question/answer/scored/summary)
    - only 1 question + placeholder scoring (real algorithm deferred to Cycle-3)

### 3) Pack CLI (P0) + storage under `.workflow/learn/packs`

- Updated `ccw/src/commands/learn.ts`:
  - added `PACKS_DIR` and created it in `ensureLearnDirs()`
  - implemented:
    - `learnResolvePackKeyCommand`
    - `learnReadPackCommand`
    - `learnWritePackCommand` (overwrite)
  - pack file layout:
    - `.workflow/learn/packs/{topic_id}/pack.{taxonomy_version}.{rubric_version}.{question_bank_version}.{language}.json`
  - enforced Cycle-1 strong-binding: `question_bank_version` must equal `taxonomy_version`

- Updated `ccw/src/cli.ts`:
  - registered new commands:
    - `learn:resolve-pack-key`
    - `learn:read-pack`
    - `learn:write-pack`

### 4) `learn:append-profile-event` explicit whitelist includes `ASSESSMENT_*`

- Updated `ccw/src/commands/learn.ts`:
  - `learnAppendProfileEventCommand` rejects non-whitelisted `--type`
  - whitelist includes existing profile events + `ASSESSMENT_*`

### 5) Tests

- Added `ccw/tests/learn-assessment-pack-cli.test.js`
  - pack resolve defaults + roundtrip write/read
  - `ASSESSMENT_*` allowed; unknown type rejected
- Updated `ccw/tests/learn-profile-cli-refactor.test.js`
  - allow `Read(*)` in frontmatter while still forbidding direct `Read(...)` calls

## How To Manually Verify (fast)

1) Run `npm test` (build + unit tests).
2) Manually run (in a sandbox dir if desired):
   - `ccw learn:resolve-pack-key --topic-id game_dev_core --json`
   - `ccw learn:read-pack --topic-id game_dev_core --json`
   - `ccw learn:write-pack --pack '{...}' --json` (see test file for example payload)
3) Run `/learn:profile create` and when asked:
   - input a topic_id
   - answer the single assessment question
   - verify `.workflow/learn/packs/...` and `.workflow/learn/profiles/events/<profile>.ndjson` got new records

