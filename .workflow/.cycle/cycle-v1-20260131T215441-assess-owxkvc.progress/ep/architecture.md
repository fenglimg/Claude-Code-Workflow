# Architecture (Cycle-1): Assessment Plumbing

Version: v1.0.0  
Cycle: `cycle-v1-20260131T215441-assess-owxkvc`

---

## Overview

Cycle-1 只做“管道打通”，形成最小闭环：

`/learn:profile` (markdown runtime)
  -> `import './_internal/assess.js'` (factory injection)
  -> `Bash('ccw learn:resolve-pack-key ... --json')`
  -> `Bash('ccw learn:read-pack ... --json')` or `Bash('ccw learn:write-pack --pack <json> --json')`
  -> `Bash('ccw learn:append-profile-event --type ASSESSMENT_* ... --json')`

## Internal Module Contract (Cycle-1 scope)

File: `.claude/commands/learn/_internal/assess.js`

Export:
- `createAssess(deps)`
  - deps: `{ AskUserQuestion, Bash, Read, nowIso? }`
  - returns: `{ assessTopic }`
- `assessTopic({ profileId, topicId, language })`
  - minimal single-question assessment
  - writes pack (if missing) + writes events (session + question + answer + scored + summarized)

Factory injection:
- No global mutation; module only uses injected deps + pure helpers.

## Pack CLI Contract (Cycle-1 scope)

Storage root:
- `.workflow/learn/packs/`

Pack key fields:
- `topic_id`
- `taxonomy_version`
- `rubric_version`
- `question_bank_version`
- `language`

Commands:
- `ccw learn:resolve-pack-key` -> returns canonical `pack_key` object + `pack_key_hash`
- `ccw learn:read-pack` -> returns `{ found: true, pack }` OR `{ found: false }`
- `ccw learn:write-pack` -> overwrite write pack JSON and returns `{ path, pack_key }`

Path layout (Cycle-1 minimal, reversible by the same code):
- `.workflow/learn/packs/{topic_id}/pack.{taxonomy_version}.{rubric_version}.{question_bank_version}.{language}.json`

Strong binding (enforced in write-pack):
- If `question_bank_version` is omitted -> default to `taxonomy_version`
- If both provided but not equal -> error (Cycle-1 enforces strong binding now)

## Assessment Events (Cycle-1 scope)

Events appended by `ccw learn:append-profile-event`:
- `ASSESSMENT_SESSION_STARTED`
- `ASSESSMENT_QUESTION_ASKED`
- `ASSESSMENT_ANSWER_RECORDED`
- `ASSESSMENT_SCORED`
- `ASSESSMENT_SESSION_SUMMARIZED`

Whitelist policy:
- `learn:append-profile-event` must accept only explicit known event types (existing profile events + `ASSESSMENT_*`).
- Snapshot fold ignores unknown types, so assessment events do not affect snapshot correctness in Cycle-1.

