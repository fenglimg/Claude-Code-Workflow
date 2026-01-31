# Idea Deep Dive: Orchestration V2 (Goal-first + Capability Gate)

## Why V2
V1 把 profile gap detection 放在目标澄清之前，容易出现“按错误目标领域检查画像”的误判。
V2 把 **GoalClarify 前置**，并把“检查画像+触发评估”合并为一个能力门禁（capability gate）。

---

## V2 Flow (Orchestration)

1. GoalClarify
- AskUserQuestion 直到 goal_spec 清晰：范围、成功标准、时间/资源约束、优先级

2. ProfileCapabilityCheck (gate)
- 在 profile 里查找是否存在与 goal_spec 对齐的领域能力评估
- 评估有效性：覆盖度、时效性、证据类型、置信度

2a. If NOT OK -> Build learn:profile command + needs_user STOP
- 生成建议命令（领域 + 目标 + 评估方式）
- 不进入规划，避免“用不可信画像做计划”

3. If OK -> Handoff learn-planning-agent
- 输入：goal_spec + profile_evidence (+ constraints)
- 输出：plan_draft（含学习阶段 phase_name 与 assessments.type）

4. Minimal PreValidate (+Enum Normalize)
- 只处理 enum：phase_name / assessment.type
- 不可映射 -> AskUserQuestion（而不是 Exit code 1）

5. GeminiReview + AskUserQuestion loop
- review_diff -> 用户确认 -> apply -> 再校验

6. PlanLock -> ExaEnrich -> ExaVerify -> Finalize

---

## Capability Confidence (MVV)

建议先做一个简单得分：

confidence = w1*has_assessment + w2*recency + w3*coverage + w4*evidence_type + w5*consistency

- has_assessment: 0/1
- recency: clamp(1 - days/180, 0, 1)
- coverage: 0..1 (goal_spec 能力点覆盖率)
- evidence_type: 0.2 self_report, 0.6 project_evidence, 0.8 code_challenge, 1.0 standardized_test
- consistency: 0..1

阈值：>=0.7 通过；否则 needs_user。

---

## Open Decisions
1. profile 的“领域”如何识别：由 goal_spec 显式声明？还是由系统推断？
2. learn:profile 命令：现有只有 update 还是有 evaluate？若只有 update，需要如何表达“请评估XX能力并返回置信度”？
3. gate 未通过时，是硬 stop 还是允许输出一个“临时计划（低置信度标记）”？（当前选择：硬 stop）
