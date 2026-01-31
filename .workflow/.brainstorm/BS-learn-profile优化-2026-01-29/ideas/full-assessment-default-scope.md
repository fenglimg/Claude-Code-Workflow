# Full-Assessment 默认评估范围/完成条件（Draft）

Timestamp: 2026-01-31T18:49:09+08:00

## Defaults（建议默认值）

- topics_assessed_default: 1
  - topic#1: “最关键/最高收益”（来自：背景解析 + Agent 联想 + 目标对齐 的 Top-1；或用户在 topic 选择页指定）
- questions_per_topic_default: 3（纯文本）
  - L1: 机制/概念
  - L2: 实操/代码思路
  - L3: 边界/诊断/权衡

## Stop Conditions

### Per-topic stop
Stop if any:
1) user ends this topic
2) answered_count >= questions_per_topic_default
3) consecutive_low_confidence >= 2（避免挫败，给出“建议先学基础”的结论）

### Global stop
Stop if any:
1) topics_assessed_count >= topics_assessed_default
2) user ends assessment and save

## Progress / Completion Percent

- completion_percent = round(100 * topics_assessed_count / topics_planned_count)
  - topics_planned_count = 默认 2，或用户在 topic list 确认的数量
- Persist per-topic detail:
  - answered_count, score_summary, confidence_summary, pack_version, rubric_version

## UX Requirements

After each topic:
- AskUserQuestion: continue next topic / end and save (resume later)

## Open Questions

1) topics_assessed_default 已确认：默认 `1`（评估完立即记录，再询问是否继续评估下一个）
2) questions_per_topic_default：保持从“评估集（assessment pack）”中按 topic 定义来决定题数/难度分布（不强行固定 2/3/4）
3) ETA：可选（未锁定）
