# Requirements Specification - v1.0.0

## Document Status
| Field | Value |
|-------|-------|
| **Version** | 1.0.0 |
| **Iteration** | 1 |
| **Updated** | 2026-01-30T01:08:40+08:00 |
| **Source Task** | `.workflow/.brainstorm/BS-learn-profile优化-2026-01-29/cycle-task.md` |
| **Scope** | Cycle 1 (P0): init friction down + pre_context_v1.3 |
| **Mode** | Planning artifacts only (no code changes executed in this cycle run) |

---

## Goal

把 learn:profile 初始化从“强制问 Goal Type/经验”改为“最小必填 + 稳定偏好采集”，并上线 `pre_context_v1.3`（固定 4 问）与可观测性，降低流失且不牺牲可解释性。

---

## Functional Requirements

### FR-001: Init Flow 不强制 Goal Type
- 初始化阶段不强制用户提供明确 Goal Type。
- Goal Type 如果收集，应为可选字段，不影响 create/init 成功。

### FR-002: Init Flow 不要求经验自评
- 初始化阶段不要求用户陈述整体编程经验水平。
- 系统必须能在不询问经验自评的情况下创建/写入 profile。

### FR-003: pre_context_v1.3 固定 4 问模板（版本化）
- 每次调用 AskUserQuestion 必须恰好 4 个问题。
- 每题允许“选项 + free text(type something)”并存。
- 模板版本号必须为 `pre_context_v1.3`。

### FR-004: pre_context 持久化（raw/parsed/provenance）且解析失败不阻塞
- 必须保存 raw(q1-q4) 作为 source of truth。
- parsed 字段可选；解析失败不得阻塞流程。
- provenance 必须包含 template_version 与 captured_at。

### FR-005: Event 写入（至少 PRECONTEXT_CAPTURED + FIELD_SET）
- 采集 pre_context 时写入 `PRECONTEXT_CAPTURED`。
- 用户纠错时追加 `FIELD_SET` 事件；不得覆盖/删除 raw 证据。

### FR-006: Preference Summary + User Correction
- 系统提供 1-3 句偏好摘要回显（优先来自 parsed；可降级从 raw）。
- 支持用户用自由文本纠错，并能追溯到对应事件。

### FR-007: pre_context 复用/重问策略（gating）
- stale: >30 天必须重问 4 问（允许“无变化”）。
- drift: 用户明确表达偏好不匹配，立即重问 4 问。
- skip cooldown: 单题 skip 后 7 天内不重复问，除非显式 drift。

### FR-008: Telemetry（埋点）
- 必须能计算：init completion、pre_context completion、skip rate per question、correction rate、reuse rate、parse failure rate。
- telemetry 必须包含 template_version 与 asked vs reused。

---

## Non-Functional Requirements

### NFR-001: Backward Compatibility
- 旧 profile 数据可读可写，不因新增字段或缺省字段导致崩溃。

### NFR-002: Reliability
- pre_context 解析失败时必须仍能完成创建并留下可追溯数据。

### NFR-003: Auditability
- 所有纠错与关键字段变更可追溯到事件（actor/user/system）。

### NFR-004: Maintainability
- 模板版本化 + 快照测试（推荐）以减少无意文案漂移。

---

## Edge Cases

- EC-001: 用户对某题输入非结构化长文本，解析失败（必须保存 raw + 继续）。
- EC-002: 用户跳过某题（skip），冷却期内重复进入流程（不重复问该题）。
- EC-003: 用户在后续对话说“这不符合我的偏好”（drift），应立即触发重问。
- EC-004: schema/validator 当前要求 `experience_level`，但本 P0 要求不询问（见决策 DEC-001）。

---

## Hard Constraints (Must Hold)

- pre_context 固定 4 问模板；每次固定 4 个问题。
- 4 问中不问“2-4 周结果”，不问 accountability。
- pre_context 允许“选项 + type something”并存；但不进入 assessment。
- pre_context 解析失败不阻塞。
- 用户纠错不覆盖 raw；以事件追加。

---

## Decisions Needed

### DEC-001: experience_level 如何处理（不强制问，但写入/校验仍要求）
候选方案：
1) 让 `experience_level` 在 schema/validator 中变为可选（推荐，最贴合“不强制问”）。
2) 保持必填但设默认（例如 beginner）并新增单独的 confidence 字段（需要 schema 扩展）。
3) 只在有 background/assessment 信号后写入 experience_level（会让 create/init 更复杂）。

---

## Out of Scope (for this cycle)

- Milestone B（profile snapshot+events+rollback）完整落地（本 cycle 只要求最小事件闭环）。
- 评估引擎（assessment runtime）与 taxonomy/pack generator。

---

## Success Criteria

- 初始化完成率上升（对比上线前 baseline）。
- pre_context 完成率、纠错率、解析失败率可观测。
- 不因缺 goal_type/experience 自评导致 create/init 失败。

---

## Proactive Enhancements (ENHANCED v1.0.0 by RA)

- 增加 feature flag（或配置开关）允许灰度开启 pre_context_v1.3 与新 init flow。
- 将 schema 文件的“单一事实来源”明确：`.claude/workflows/cli-templates/schemas/learn-profile.schema.json` 与 `.workflow/learn/profiles/schemas/learn-profile.schema.json` 当前 SHA256 相同，但需要防止未来漂移（建议只维护一份并在构建/脚本中同步）。
