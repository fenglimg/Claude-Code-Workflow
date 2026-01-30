# Generated Task (Cycle 2): Milestone B - profile snapshot + events + rollback

**Generated**: 2026-01-30T00:43:38+08:00  
**Source Session**: BS-learn-profile优化-2026-01-29  
**Basis**: `backlog.json` Milestone B (P0) + `synthesis.json` top_ideas[2] (Profile 结构升级).

---

# Main Objective

上线 `profile_snapshot`（读模型）+ `profile_events`（append-only 审计日志）+ rollback 能力，并把技能画像分成 asserted vs inferred（含 provenance/evidence）+ inferred 状态机。

# Description

把画像升级为“可解释、可审计、可回滚”的状态模型：
- 所有变更以事件追加（不可变更/不可删除）
- snapshot 由事件 fold/rebuild 得到（确定性、可重建）
- inferred skills 走 proposed/confirmed/rejected/superseded 状态机
- confirmed 仅用户明确确认产生（禁止自动 confirmed）
- rollback_to_version：写 ROLLBACK 事件 + 生成回滚视图（不删历史）

# Hard Constraints (Must Hold)

- `profile_events` append-only：禁止 update/delete
- inferred skills 默认 proposed；禁止 auto-confirm
- rejected 再提需要满足冷却期（默认 30 天）且必须有新证据
- rollback 不删除历史事件；回滚后读到的 snapshot 一致

# Deliverables

- 数据结构：profile_snapshot / profile_events（表结构或存储实现 + 版本号策略）
- 事件类型与 payload 约定（至少覆盖 backlog 的 catalog）
- fold/rebuild：可按 target_version 重建 snapshot（用于审计/回滚）
- inferred 状态机：propose/update/confirm/reject/supersede（事件化 + snapshot 生效）
- rollback_to_version：API/命令 + 重建逻辑 + 回归
- metrics：event 写入延迟/错误率、rebuild 耗时、confirm/reject 比例、rollback 成功率

# Work Breakdown (Issues)

见：`.workflow/.brainstorm/BS-learn-profile优化-2026-01-29/cycle-issues-milestone-b.md`

# Source

Brainstorm Session: BS-learn-profile优化-2026-01-29  
Topic: learn：profile优化

