# Assessment 结果落库策略（asserted vs inferred）

Timestamp: 2026-01-31T19:48:53+08:00

## Recommended Rule

### Asserted (known_topics) only if user explicitly says so
- Source: self-report / explicit user confirmation
- Example: “我经常用 TypeScript”，或在确认步骤点了“准确/确认”

### Inferred (events + snapshot) for assessment-derived judgments
- Source: assessment (question answers + rubric scoring)
- Must include provenance:
  - topic_id
  - taxonomy_version
  - rubric_version
  - question_bank_version
  - language
  - evidence snippets / scoring breakdown (minimal but explainable)
- Status machine:
  - proposed (default)
  - confirmed (only after user confirms)
  - rejected (user denies)
  - superseded (newer assessment overrides older)

## UX (Updated)

After finishing one topic assessment:
- 直接保存评估结果（events + snapshot），不做“轻量确认/二次确认”
- AskUserQuestion 仅保留：
  - 继续评估下一个 topic
  - 结束并保存

## Why This Split
- Keeps profile trustworthy: system judgments don't silently become user-asserted truth
- Enables rollback/audit: inferred is evented and versioned
- Keeps flow fast: confirmation is optional, not blocking

## Locked Decisions (2026-01-31)
- Deprecated: Post-assessment lightweight confirmation.
- New: No post-assessment confirmation; ensure accuracy via pack completeness + scoring/adaptive loops.
