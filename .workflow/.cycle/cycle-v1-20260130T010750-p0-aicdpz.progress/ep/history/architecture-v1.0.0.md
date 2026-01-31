# Architecture Design - v1.0.0

## Document Status
| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Iteration | 1 |
| Updated | 2026-01-30T01:09:10+08:00 |
| Cycle | cycle-v1-20260130T010750-p0-aicdpz |

---

## Target Behavior (P0)

### High-level Flow
1) `/learn:profile create` 启动
2) Init Flow：收集最小必填信息（不强制 goal_type / 不要求经验自评）
3) pre_context_v1.3：单次 AskUserQuestion 固定 4 问（options + free text）
4) Persist：保存 raw/parsed/provenance，并写入最小事件闭环（PRECONTEXT_CAPTURED）
5) 回显偏好摘要，允许用户纠错（FIELD_SET）
6) 根据 stale/drift/skip cooldown 决定未来会话复用还是重问

---

## Data Model (P0)

### pre_context (建议字段结构，供后续 Milestone B 演进)
- `pre_context.raw`: { q1, q2, q3, q4 }
- `pre_context.parsed`: { ... } (optional; derived)
- `pre_context.provenance`: { template_version: "pre_context_v1.3", captured_at: ISO8601, asked_vs_reused }

### Minimal Events (P0)
- `PRECONTEXT_CAPTURED`: 保存 raw + provenance (+ parsed if available)
- `FIELD_SET`: 用户纠错（path + value + actor=user）

---

## Decision Points

- `experience_level` 的处理（DEC-001）：决定 schema/validator 如何允许“不问经验自评”但仍能写入 profile。

---

## Compatibility Strategy

- 尽量保持旧字段可读；新字段使用 optional + default。
- schema 同步：`.claude/workflows/cli-templates/schemas/learn-profile.schema.json` 与 `.workflow/learn/profiles/schemas/learn-profile.schema.json` 当前相同，但更新时必须保持一致（或引入单一来源）。

---

## Observability

Telemetry should support:
- init completion rate
- pre_context completion rate
- per-question skip rate
- correction rate
- reuse rate
- parse failure rate
