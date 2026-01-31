# Pack 最小包 3 题 vs 完整生成：衔接策略（Locked）

Timestamp: 2026-01-31T21:06:10+08:00

## Goal
既允许“先用 3 题快速定位”，又保证在本 topic 评估结束前 pack 被补全到可复用、可回归的程度，做到“后续无需再做初始化评估”。

## Key Principle
“最小包 3 题”不是一个最终 pack 形态，而是同一 pack（同一 question_bank_version）的 seed questions。

## Strategy

### Hot topics (pre-generated)
- Use full pack immediately
- Question selection is adaptive, but question bank is already complete and versioned

### Provisional topics (runtime-generated)
1) Generate full taxonomy first (must/core/nice labeling included)
2) Set versions up-front:
   - taxonomy_version = tax_vX
   - question_bank_version = qb_tax_vX_v1 (strong binding)
   - rubric_version = rub_vY
   - language = zh
3) Generate seed questions (3) quickly (high-signal, multi-subpoint coverage)
4) Adaptive assessment loop:
   - prioritize must-cover subpoints: min_questions=2 + min_evidence satisfied
   - then raise core coverage toward threshold (overall >= 0.85)
   - ensure level convergence + last4 stable + confidence >= 0.90
5) Before allowing user to exit this topic assessment:
   - pack must be “complete enough”:
     - taxonomy complete (with metadata)
     - question bank contains all asked/generated questions used in session
     - regression skeleton exists (versioned structure)

## Why this avoids contradiction
- Seed-3 gives fast calibration, but cannot end the session.
- “Full generation” happens before session end, so the saved result is based on a stable, versioned pack.

## Implementation Constraint (tooling)
`/learn:profile` has no Write(*), so pack persistence must be done via ccw backend CLI (e.g., future `ccw learn:write-pack`).

