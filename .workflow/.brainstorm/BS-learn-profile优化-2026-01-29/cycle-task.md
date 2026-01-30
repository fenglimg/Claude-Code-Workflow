# Generated Task (brainstorm-to-cycle)

**Generated**: 2026-01-30T00:43:38+08:00  
**Source Session**: BS-learn-profile优化-2026-01-29  
**Basis**: Composite P0 derived from `synthesis.json` top_ideas[0] (Init Flow Simplification) + top_ideas[1] (Pre-Context 4Q Template) + `backlog.json` Milestone A.

---

# Main Objective

P0：降低 learn:profile 初始化摩擦（删强制项）+ 上线 `pre_context_v1.3`（固定 4 问）并落库 raw/parsed/provenance，配套复用策略与埋点。

# Description

把 profile 初始化从“先问清 Goal Type/经验”改为“先完成最小画像 + 稳定偏好采集”，确保：
- 初始化阶段不强制用户提供明确 Goal Type
- 初始化阶段不要求用户陈述整体编程经验水平
- Pre-Context 通过 AskUserQuestion 固定模板收集学习习惯与偏好（每次固定 4 问，用满 AskUserQuestion 负载）
- 抽取失败不阻塞（raw 永远保存），可回显摘要并允许用户纠错（事件化）
- 有可解释的复用/重问策略（stale/drift/skip cooldown）
- 有埋点可对比改动前后完成率/退出率

# Hard Constraints (Must Hold)

- pre_context 必须固定且全面的问题模板；每次固定 4 个问题
- 4 问中：不问 “2-4 周结果”，不问 accountability
- pre_context 问题允许 “选项 + type something” 并存（但不进入 assessment；assessment 仍纯文本、严禁选择题）
- pre_context 解析失败不阻塞：raw(q1-q4) 仍需落库并继续流程
- 用户纠错不能覆盖/删除原始证据（raw）；纠错用事件追加（FIELD_SET）

# Deliverables

- Init Flow：删掉 create/init 中“强制字段/强制步骤”，并明确最小必填字段（MVP）
- pre_context_v1.3：固定 4 问模板（版本化），以及 raw+parsed+provenance 持久化
- 事件：至少 `PRECONTEXT_CAPTURED` + `FIELD_SET`（用于纠错与审计）
- gating：stale/drift/skip cooldown 复用/重问策略
- telemetry：可计算 completion/skip/correction/reuse 等指标
- tests：对“4 问固定模板 + 不阻塞 + 不问禁区问题 + 不强制 Goal/经验”有回归保障

# Recommended Implementation Steps

1. 盘点现有 create/init 流程强制项与依赖，定义“最小必填字段（MVP）”
2. 冻结 `pre_context_v1.3` 文案与选项粒度（固定 4 问，版本化）
3. 落库：raw+parsed+provenance；解析失败不阻塞；写入 `PRECONTEXT_CAPTURED`
4. 回显偏好摘要并提供用户纠错入口（写 `FIELD_SET`，不覆盖 raw）
5. 上线复用策略：30 天 stale、drift 触发重问、skip 冷却 7 天
6. 增加埋点并对比上线前后（初始化完成率、pre_context 完成率、纠错率等）

# Work Breakdown (Issues)

见：`.workflow/.brainstorm/BS-learn-profile优化-2026-01-29/cycle-issues-p0.md`

# Source

Brainstorm Session: BS-learn-profile优化-2026-01-29  
Topic: learn：profile优化

