# Idea Deep Dive: Phase State Machine + Gates

## Concept
把 `learn:plan` 从“一次性生成”升级为**可编排的 phase state machine**：每个 phase 有明确输入/输出（schema），支持 checkpoint、回滚/重跑，并把后续的 review/用户确认/exa 资源补齐与验证都作为 phase 插入。

目标：让流程具备 **可观测、可恢复、可迭代收敛** 的闭环能力。

---

## Minimal Viable Version (MVV)
只先实现能跑通的最小闭环主干：

1. `ProfileGapCheck`
2. `ProfileUpdate`（仅当 gap 存在）
3. `GoalClarify`
4. `HandoffPlanningAgent`（先保持为“占位调用”，可返回简单草案）
5. `SchemaNormalize+PreValidate`（横切层，也可做成独立 phase）
6. `Finalize`

先不做：Gemini Review、AskUserQuestion迭代、ExaEnrich/Verify（等主干稳定再插）。

---

## Phase List (Target)
建议目标phase序列（可插拔）：

- `ProfileGapCheck` -> 产出 `gap_report`
- `ProfileUpdate` (optional) -> 产出 `profile_snapshot_vN`
- `GoalClarify` -> 产出 `goal_spec`
- `HandoffPlanningAgent` -> 产出 `plan_draft`
- `GeminiReview` -> 产出 `review_diff` + `verdict`
- `UserConfirmLoop` -> 产出 `plan_vFinal`（含用户确认记录）
- `ExaEnrich` -> 产出 `resources_attached`
- `ExaVerify` -> 产出 `resources_verified`
- `Finalize` -> 产出最终 `learn_plan_output`

横切（可作为独立phase或每phase后hook）：
- `SchemaNormalize`
- `PreValidate`
- `AuditLog`

---

## State Model (Schema Sketch)
### Run State
- `run_id`: string
- `workflow`: "learn:plan"
- `status`: "in_progress" | "completed" | "failed" | "needs_user"
- `current_phase`: phase_name
- `phase_history`: PhaseExecution[]
- `artifacts`: { [key: string]: ArtifactRef }

### PhaseExecution
- `phase_name`: string
- `attempt`: number
- `status`: "started" | "succeeded" | "failed" | "skipped" | "needs_user"
- `started_at` / `ended_at`
- `inputs_ref`: ArtifactRef[]
- `outputs_ref`: ArtifactRef[]
- `error`: StructuredError | null

### ArtifactRef
- `id`: string
- `type`: string (e.g. profile_snapshot, goal_spec, plan_draft, review_diff)
- `schema_version`: string
- `content_ref`: string (path/kv-key)
- `hash`: string (optional)

---

## Checkpoints, Rerun, Rollback
- **Checkpoint**: 每个 phase 成功后写入 `phase_history` + `artifacts`（以 snapshot 为准）。
- **Rerun same phase**: `attempt++`，输入固定为同一份 snapshot（避免“悄悄漂移”）。
- **Rollback**: 将 `current_phase` 回退到指定 phase；清理（或标记无效）后续 artifacts。
- **Idempotency**: phase 尽量纯函数化：输出只依赖 inputs snapshot + deterministic config。

---

## Success Metrics
- `Schema校验失败` 不再导致硬退出；失败能给出结构化错误并可自动修复或回退到 AskUserQuestion。
- phase 可观测：每一步都有状态、耗时、错误字段路径。
- 可重跑：同输入重复执行得到稳定结果（或可解释差异）。

---

## Risks & Mitigations
- 风险：phase过多导致流程复杂。
  - 缓解：默认只启用主干phase；高级phase按需启用（feature flag）。
- 风险：上下文过大导致跨agent传输困难。
  - 缓解：用 `ArtifactRef` + 摘要（summary）替代全文传递。

---

## Next Steps (Implementation-Oriented)
1. 定义 phase runner 的最小接口（run/skip/rerun/rollback）。
2. 先接入 `SchemaNormalize+PreValidate`（即使Gemini/Exa未做，也先杜绝硬失败）。
3. 将规划细节迁移到 `learn-planning-agent`（下一轮再做）。
