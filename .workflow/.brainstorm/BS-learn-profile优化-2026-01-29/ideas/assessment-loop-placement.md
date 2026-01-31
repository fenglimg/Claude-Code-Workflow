# 评估闭环落点决策：profile 内置 vs /learn:assess 抽离

Timestamp: 2026-01-31T19:53:49+08:00

## Context
- full-assessment 默认 true
- 一次只评估 1 个 topic
- 评估结束必问轻量确认（可跳过），confirmed 需显式确认
- pack_key 已锁定：topic_id + taxonomy_version + rubric_version + question_bank_version + language

## Option A: 内置在 /learn:profile create|update

Pros:
- UX 直观：用户只用 profile 一个入口
- 初期实现路径短（只改 profile.md）

Cons:
- profile.md 会膨胀为“巨型脚本”，后续维护/回归风险高
- execute/preflight 评估复用困难，容易复制/分叉
- 难以做独立评估回归测试

## Option B (Recommended): 抽成 /learn:assess

Pros:
- 评估能力成为可复用组件：profile/create/update + execute/preflight 共用
- 更易测试：pack + answers -> events/snapshot 纯函数化倾向
- 边界清晰：profile=收集与编排；assess=评估与落库

Cons:
- 需要设计命令 contract 与状态（resume、interactive/batch）
- 命令面增多，需要文档与一致性约束

## Recommended Hybrid UX
- 用户体验仍是：/learn:profile create|update 内完成评估
- 实现上：profile 调用 /learn:assess 完成评估闭环

## Minimal /learn:assess Contract (Draft)

Input:
- profile_id
- topic_id (canonical)
- pack_key (includes language)
- mode: interactive | batch

Output:
- assessment_* events appended (versioned)
- inferred skill updated (default proposed)
- summary returned (score/level/confidence + recommended next)

## Note (2026-01-31)
- Post-assessment lightweight confirmation step was removed; `/learn:assess` should aim to be accurate enough to persist results directly.

## Decision Question
Lock Option B?

## Locked Decision (2026-01-31)
- Override: Do NOT add `/learn:assess` slash command.
- Use shared internal JS module: `.claude/commands/learn/_internal/assess.js` (loaded by `/learn:profile` via Read()).
