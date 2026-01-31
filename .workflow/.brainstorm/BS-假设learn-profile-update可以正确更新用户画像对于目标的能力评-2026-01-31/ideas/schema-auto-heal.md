# Idea Deep Dive: Schema Normalize + PreValidate + Auto-Heal

## Problem
当前结构化输出在 schema 校验失败时直接 `Exit code 1`，根因是枚举不匹配：
- `phase_name` 允许值：`Foundation`, `Core Concepts`, `Advanced Topics`, `Specialization`, `Mastery`
- `assessment.type` 允许值：`practical_task`, `code_challenge`, `multiple_choice`

这会破坏 learn:plan 的闭环（无法继续review/确认/资源补齐）。

---

## Concept
在写出/消费结构化schema前加入 3 层保护：

1) **Normalize（正规化）**：大小写、分隔符、同义词归一
2) **PreValidate（预校验）**：在落盘/发送前校验，失败转结构化错误
3) **Auto-Heal（自愈修复）**：可确定修复的场景自动改正并重试；不可确定则转 AskUserQuestion/回退策略

---

## Minimal Viable Version (MVV)
只覆盖最常见的 enum 修复：

### phase_name normalize
输入 `actual` -> `normalized_key`（小写、去空格/连字符/下划线）-> 映射到 allowed：

- foundation -> `Foundation`
- coreconcepts / core / fundamentals -> `Core Concepts`
- advancedtopics / advanced -> `Advanced Topics`
- specialization / specialisation / specialty -> `Specialization`
- mastery / master -> `Mastery`

### assessment.type normalize
- practicaltask / practice / project / hands_on -> `practical_task`
- codechallenge / codingchallenge / kata -> `code_challenge`
- multiplechoice / quiz / mcq -> `multiple_choice`

---

## Structured Error Contract (Example)
当无法自愈时，输出可机读的错误，避免“Exit code 1”黑盒：

- `code`: "SCHEMA_ENUM_INVALID"
- `field_path`: "phases[2].phase_name" / "assessments[0].type"
- `expected`: [allowed values]
- `actual`: "CoreConcept"
- `normalized`: "coreconcept"
- `suggested_fix`: "Core Concepts"
- `auto_fixable`: true|false
- `action`: "apply_fix_and_retry" | "ask_user" | "fail"

---

## Auto-Heal Policy
- **可自动修复**：映射命中唯一候选（auto_fixable=true），直接替换并记录审计。
- **不可自动修复**：
  - 1) 若候选多个（歧义），AskUserQuestion 让用户选
  - 2) 若完全未知，回退到默认值 + 记录警告（可选，取决于你对严格性的要求）

审计建议（最小字段）：
- `timestamp`
- `run_id`
- `field_path`
- `before` / `after`
- `rule_id`（命中的mapping规则）

---

## Where It Lives (Architecture)
两种落点：

1) **独立 phase：SchemaNormalize+PreValidate**（推荐）
- 好处：可观测、可重跑、可作为横切质量关卡

2) **每个 schema-producing phase 的尾部 hook**
- 好处：侵入小
- 代价：分散、难统一审计

---

## Success Metrics
- 枚举违规不再导致硬退出；能给出结构化错误并尽可能自愈。
- 自愈行为可追踪（审计），不会“悄悄改”。

---

## Open Decisions
1. 严格性：无法映射时是 `ask_user` 还是 `fallback_default`？
2. mapping表维护：写死在代码中，还是由schema/配置驱动？
3. 是否对所有枚举字段做同样策略（可扩展），还是先只做这两个字段？
