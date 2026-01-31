# Assessment Algorithm Spec (Locked Defaults)

Timestamp: 2026-01-31T20:59:57+08:00

## Goals
- One topic assessment should be accurate enough that we generally do not need to re-run "initial assessment" for that topic.
- No post-assessment lightweight confirmation step; accuracy must come from pack completeness + scoring + adaptive loop + regression gate.

## Budget / Stop Conditions

- max_questions_per_topic: 20

Stop only if ALL are satisfied:
1) level convergence (binary interval collapses to a single level or equivalent stability condition)
2) must-cover subpoints: 100% covered AND passed
3) overall coverage_ratio >= 0.85
4) overall confidence >= 0.90
5) last 4 questions are stable (no large variance or contradictions)

## Evidence Strength (Locked)

`min_evidence` levels:
- see: recall / recognize
- explain: explain mechanism clearly
- apply: apply to a concrete scenario / steps / code-level reasoning
- debug: diagnose failures + propose fixes + tradeoffs

## must-cover Labeling (Locked)

For each taxonomy subpoint, add metadata:
- tier: must | core | nice
- blocker: boolean (must usually blocker=true)
- min_evidence: see|explain|apply|debug
- min_score: 0..1
- min_questions: integer

Defaults:
- must: min_questions = 2

## Scoring Outline (To be implemented)
- each question targets 2-4 subpoints
- score_breakdown includes dimensions: correctness / reasoning / boundary_tradeoff / debugging_or_practice
- per-subpoint pass is derived from evidence strength + min_score across its targeted questions

## Regression Gate (Recommended, not yet locked here)
- each pack should include a regression set; version bumps must pass regression

