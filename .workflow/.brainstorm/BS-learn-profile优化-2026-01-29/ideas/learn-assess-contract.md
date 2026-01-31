# Assessment Minimal Contract (Internal Module)

Timestamp: 2026-01-31T20:40:51+08:00

## Purpose
Run a single-topic assessment session (interactive, text-only), write append-only assessment events, and return a compact summary to `/learn:profile` for orchestration.

## Non-Goals
- Not a primary user entrypoint (internal-only)
- No post-assessment "light confirmation" step
- No user-specific content inside assessment packs (packs are reusable assets)

## Inputs (internal function call)

Required:
- `profile_id: string`
- `topic_id: string` (canonical)
- `pack_key: { topic_id, taxonomy_version, rubric_version, question_bank_version, language }`
- `mode: "interactive"` (AskUserQuestion loop, text-only answers)

Optional (internal convenience):
- `goal_text?: string` (influences which questions to ask first; not part of pack_key)
- `assessment_session_id?: string` (if omitted, generate)

## Outputs (return value to caller)

Return value (printed as JSON so caller can parse):
```json
{
  "ok": true,
  "data": {
    "profile_id": "profile-...",
    "topic_id": "typescript",
    "assessment_session_id": "AS-...",
    "pack_key": {
      "topic_id": "typescript",
      "taxonomy_version": "tax_v0.2",
      "rubric_version": "rub_v0.1",
      "question_bank_version": "qb_tax_v0.2_v1",
      "language": "zh"
    },
    "summary": {
      "final_level": "L2",
      "proficiency": 0.45,
      "confidence": 0.72,
      "coverage": {
        "covered_subpoints": ["sp_x", "sp_y"],
        "total_subpoints": 16,
        "coverage_ratio": 0.5
      },
      "evidence_refs": [
        { "question_id": "q1", "score_event_id": "evt_..." }
      ],
      "recommendation": {
        "next_step": "learn",
        "focus_subpoints": ["sp_x", "sp_z"]
      }
    }
  }
}
```

## No-op Shortcut (Locked)

If the topic is already assessed under the exact same `pack_key` (topic_id + taxonomy_version + rubric_version + question_bank_version + language), `/learn:assess` should NOT write any new `assessment_*` events. Instead it returns a short-circuit response:

```json
{
  "ok": true,
  "data": {
    "profile_id": "profile-...",
    "topic_id": "typescript",
    "pack_key": { "...": "..." },
    "assessment_session_id": null,
    "noop": true,
    "noop_reason": "already_assessed",
    "latest_summary_ref": {
      "assessment_session_id": "AS-...",
      "session_summarized_event_id": "evt_..."
    },
    "summary": {
      "final_level": "L2",
      "proficiency": 0.45,
      "confidence": 0.72,
      "coverage_ratio": 0.5
    }
  }
}
```

This keeps the system idempotent and avoids duplicate event pollution.

## Events Written (append-only)

All events must include in payload:
- `assessment_session_id`
- `topic_id`
- `pack_key` (with language + versions)

Event sequence (minimum):
1) `ASSESSMENT_SESSION_STARTED`
2) `ASSESSMENT_QUESTION_ASKED` (repeat)
3) `ASSESSMENT_ANSWER_RECORDED` (repeat)
4) `ASSESSMENT_SCORED` (repeat)
5) `ASSESSMENT_LEVEL_CHANGED` (optional, repeat)
6) `ASSESSMENT_SESSION_SUMMARIZED` (exactly once at end)

Additionally:
- Call `ccw learn:propose-inferred-skill` at least once to update snapshot.skills.inferred (status can remain proposed; UI uses assessment events as source-of-truth).

## Caller Responsibilities (/learn:profile)
- Decide whether to call `/learn:assess` (already-assessed check happens in profile flow)
- Display summary
- AskUserQuestion: 继续评估下一个 topic / 结束并保存

## Tooling Note (Locked)
No `/learn:assess` slash command will be added. The assessment logic lives in:
- `.claude/commands/learn/_internal/assess.js`
and is loaded by `/learn:profile` via `Read()` for reuse.

## Open Questions
- Should `/learn:assess` also persist a compact “assessment index” into snapshot metadata for quick lookup (topic -> latest_session_id + pack_key)?
- Should the output include `already_assessed=true` shortcut, or is that only checked by caller?
