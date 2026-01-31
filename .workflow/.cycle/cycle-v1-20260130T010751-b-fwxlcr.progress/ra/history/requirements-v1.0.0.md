# Requirements Specification - v1.0.0

## Document Status
| Field | Value |
|-------|-------|
| **Version** | 1.0.0 |
| **Iteration** | 1 |
| **Updated** | 2026-01-30T01:10:55+08:00 |
| **Source Task** | `.workflow/.brainstorm/BS-learn-profile优化-2026-01-29/cycle-task-milestone-b.md` |
| **Scope** | Cycle 2 (Milestone B): profile_snapshot + profile_events + rollback |
| **Mode** | Planning artifacts only (no code changes executed in this cycle run) |

---

## Goal

把 learn:profile 的画像模型升级为“可解释、可审计、可回滚”的状态系统：
- snapshot（读模型）用于业务读取
- events（append-only）用于审计、回放、回滚
- inferred 技能走状态机，confirmed 只能来自用户显式确认

---

## Functional Requirements

### FR-101: profile_snapshot（读模型）
- 提供最新 snapshot（按 user_id/profile_id 读取）。
- snapshot 至少包含：pre_context(raw/parsed/provenance) + skills(asserted/inferred) + version + updated_at。

### FR-102: profile_events（append-only 审计日志）
- 事件不可 update/delete（逻辑/权限/存储层保障）。
- 每个 snapshot 变更都能解释为一个或多个 events 的 fold 结果。

### FR-103: 事件类型与 payload 约定
- 至少覆盖：PROFILE_CREATED / PRECONTEXT_CAPTURED / FIELD_SET / ASSERTED_SKILL_ADDED|REMOVED / INFERRED_SKILL_* / ROLLBACK_TO_VERSION。

### FR-104: append_event（原子追加 + version 策略）
- 追加事件必须返回新 version。
- 并发写入不能 silent overwrite；必须有清晰冲突处理策略。

### FR-105: fold/rebuild（确定性 + target_version）
- 给定同一事件流，fold 结果必须 deterministic + idempotent。
- 支持 target_version 用于审计/回滚视图。

### FR-106: inferred skills 状态机
- inferred 默认 proposed，禁止 auto-confirm。
- confirmed 只能由用户显式确认产生（actor=user）。
- rejected 再提必须满足：冷却期（默认 30 天）+ 新证据存在。
- superseded 用于保留历史链而非覆盖。

### FR-107: rollback_to_version
- rollback 通过追加 `ROLLBACK_TO_VERSION` 事件实现。
- rollback 不删除/不篡改历史事件。
- rollback 后的 snapshot 读视图一致。

### FR-108: Explainability + Metrics
- 每个 inferred 必须包含 evidence/provenance（来源、文本片段/引用、版本信息）。
- 指标至少包含：event 写入延迟/错误率、rebuild 耗时/失败率、confirm/reject 比例、rollback 成功率。

---

## Non-Functional Requirements

### NFR-101: Backward Compatibility
- 现有 `.workflow/learn/profiles/{id}.json` 能平滑迁移/兼容（至少可读）。

### NFR-102: Data Integrity
- events append 必须尽量抗中断（部分写入可检测/可恢复）。

### NFR-103: Performance
- rebuild 在常见规模事件流下可接受；需要基线指标与优化入口（例如周期性快照）。

---

## Edge Cases

- EC-101: events 文件存在坏行/截断（JSONL），读取需跳过坏行并报告；不能导致系统崩溃。
- EC-102: 并发 append 导致 version 冲突（必须可重试或拒绝）。
- EC-103: rollback to non-existent version（报错清晰，不污染 snapshot）。
- EC-104: rejected 但无新证据仍被再次 proposed（必须被 gating 拒绝）。

---

## Hard Constraints (Must Hold)

- profile_events append-only：禁止 update/delete。
- inferred 默认 proposed；禁止 auto-confirm。
- rollback 不删除历史事件。

---

## Decisions Needed

### DEC-101: profile_events 的存储格式
候选方案：
1) 每个 profile 一份 JSONL（复用现有 Logger/issue JSONL append 模式）（推荐）。
2) 每个 event 一个 JSON 文件（文件数量多，但易于原子写）。
3) 单个 JSON 数组文件（不推荐：需要重写整文件，且更易损坏）。
