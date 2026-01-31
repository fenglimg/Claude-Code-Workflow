# Idea Deep Dive: Test-Based Confidence + Phase Mapping (MVV)

## Goal
用“测验结果”作为 profile_evidence 的主信号，解决：
- ProfileCapabilityCheck 的 gate：是否允许进入规划
- learn-planning-agent 的 `current_phase_name`（当前能力阶段）推断
- Review/测验有统一可衡量标准

---

## Inputs (from profile)
最小建议字段：
- `test.domain`: string（目标领域，例如 backend-java / react / leetcode）
- `test.date`: ISO date
- `test.score`: number（0-100 或 0-1）或 `test.pass`: boolean
- （可选）`test.subscores`: { skill: score }

---

## Confidence (gate)
### Normalization
- `test_score_norm`:
  - score 0-100 -> /100
  - score 0-1 -> 直接使用
  - pass/fail -> pass=1, fail=0
- `recency_norm = clamp(1 - days_since_test/90, 0, 1)`

### Formula
- `confidence = 0.7*test_score_norm + 0.3*recency_norm`

### Gate Rule
- if no test for domain -> confidence = 0 -> needs_user (STOP)
- if confidence < 0.7 -> needs_user (STOP)
- else -> proceed to planning

---

## Phase Mapping (current_phase_name)
MVV 用分数阈值映射到 5 段（可后续按领域配置化）：

- [0.00, 0.20) -> Foundation
- [0.20, 0.45) -> Core Concepts
- [0.45, 0.70) -> Advanced Topics
- [0.70, 0.85) -> Specialization
- [0.85, 1.00] -> Mastery

备注：
- 这里的 `test_score_norm` 表示“当前能力水平”；
- `target_phase_name` 应由 goal_spec 推断（例如目标要求、预期产出、成功标准），不应只由分数决定。

---

## Output Contract (for planning)
- `current_phase_name`: enum
- `target_phase_name`: enum
- `phases[]`: 仅输出 contiguous subrange（current->target）
- 每个 phase 需要至少包含：
  - `entry_criteria`
  - `exit_criteria`
  - `assessments[]`（type 必须合法）

---

## Open Question
测试结果目前更接近：pass/fail、单分数、还是多维度分项？这决定：
- confidence 计算是否足够
- phase mapping 是否需要按 skill 维度做更精细推断
