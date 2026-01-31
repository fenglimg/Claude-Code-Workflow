# Round 15 - What Still Needs Discussion (Decision Checklist)

Timestamp: 2026-01-31T18:43:31+08:00

## 1) Full-Assessment “Done” Definition
- Default topics to assess: ? (recommend: 1-3)
- Default questions per topic: ? (recommend: 2-4)
- Stop conditions:
  - user chooses “end”
  - confidence reaches threshold
  - max rounds reached
- completion_percent should reflect: (topics_assessed / topics_planned) * 100, not a fixed 100

## 2) Topic Coverage Confirmation Loop
Questions to lock:
- User input mode: (A) natural language补充 (B) topic_id 输入 (C) both
- Loop guardrails:
  - max iterations (e.g. 3)
  - always offer “skip/continue”
- Output schema constraints:
  - topic_id, label, confidence, provenance, reason

## 3) topic_id Source of Truth
Options:
- A) taxonomy first: topic_id 必须来自已存在 taxonomy（稳定、可回归）
- B) hybrid: 允许动态 topic_id，但必须落到 “pending taxonomy review” 状态

## 4) Assessment Pack Generation + Caching
- Runtime generate vs pre-generate
- Cache key: topic_id + taxonomy_version + rubric_version + language
- Storage location: `.workflow/.learn/assessment-packs/...` (or under profiles folder)

## 5) Where to Persist Assessment Results
Needs clarity:
- `known_topics` 是否只存 asserted（用户自述）？
- 评估结果是否进入 inferred skills snapshot（proposed/confirmed）？
- “用户确认”机制：评估后是否需要 AskUserQuestion 把 inferred 从 proposed -> confirmed？

## 6) pre_context_vNext Scope
- Must-have: time budget, preferred sources, learning style, context
- Candidates to add: attention span, device/IDE, prior habits, motivation, constraints, language preference
- Progressive profiling: create asks minimal set, update/execute asks additional as needed

## 7) p-e2e-* Isolation Policy (Hard Requirements)
- list/select hides `p-e2e-*`
- state update rejects `p-e2e-*` as active_profile_id (fail-fast)
- test fixtures moved out of real `.workflow/learn/profiles/`

## 8) Command Surface: keep /learn:assess ?
Decision:
- Embed assessment loop into profile (fast UX, harder testing) vs
- Create `/learn:assess` (reusable, testable) and let profile call it

