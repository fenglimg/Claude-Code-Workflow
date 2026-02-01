# Idea: Seed=4 Question Generator Spec (v1)

## Goal
Define a stable, testable generator contract that produces **4 discriminative seed questions** per topic, aligned with:
- continuous ability `ability_interval=[lo,hi]` and `sigma=hi-lo`
- stop rule `sigma<=0.1`
- scoring contract `p_correct + confidence` (rubric + evidence)

## Inputs
- `topic_id`
- `language`
- `taxonomy` (must/core/nice subpoints; may be absent)
- `background` (raw text + summary)
- (optional) `generator_version`

## Output
Exactly 4 question objects:

```json
[
  {
    "id": "seed-q1",
    "phase": "seed",
    "topic_id": "...",
    "capability_node": "see",
    "difficulty": 0.25,
    "subpoint_ids": ["sp_..."],
    "prompt_zh": "...",
    "rubric_version": "v1",
    "rubric_dimensions": ["correctness", "mechanism", "structure"],
    "expected_signals": ["..."],
    "common_mistakes": ["..."],
    "grading_notes": "..."
  }
]
```

Hard constraints:
- capability_node must be unique across 4 questions
- difficulty must be unique across 4 questions
- at least 2 questions must include must-subpoints when taxonomy exists
- prompt must be gradable: requires example + boundary/pitfall + reasoning/tradeoff

## capability_node and default difficulty mapping (cross-domain)
- Internal keys (stable): `see / explain / apply / debug`
- Meaning:
  - `see`: recognize/recall basics (识别/记忆/基本概念)
  - `explain`: explain in own words + mechanism (解释/机制)
  - `apply`: solve a standard scenario/task (应用/常规题)
  - `debug`: diagnose/analyze/resolve complex or ambiguous cases (诊断/分析/纠错/取舍)\n+- Default difficulty mapping:\n+  - `see` -> 0.25\n+  - `explain` -> 0.45\n+  - `apply` -> 0.65\n+  - `debug` -> 0.85

Execution order can be adaptive (choose next among remaining questions closest to midpoint `(lo+hi)/2`).

## Subpoint allocation rules
- Prefer 1-3 subpoints per question
- Prefer non-overlapping subpoints across 4 questions
- If must subpoints < 2:
  - fill from core
  - record downgrade reason in generator logs (not necessarily in user-visible UI)

## Discrimination requirements
Each question must ship with:
- 2-4 `common_mistakes`
- `grading_notes` that explain how to distinguish shallow vs deep answers

## Convergence update hook (uses Round 12 thresholds)
After each answer scoring output:
- if `confidence>=0.6` and `p_correct>=0.75`: `lo=max(lo, difficulty)`
- if `confidence>=0.6` and `p_correct<=0.25`: `hi=min(hi, difficulty)`
- else: uncertain path (soft update + prefer next question near midpoint)

## Fallback when 4 questions do not converge
- allow 1-2 extra questions up to `N_seed_max=6`
- choose new question with difficulty near midpoint and high discrimination
- prioritize missing must evidence and concept-contrast questions
