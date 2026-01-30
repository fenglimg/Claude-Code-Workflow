# Cycle Issues (Cycle 2 / Milestone B): profile snapshot + events + rollback

**Generated**: 2026-01-30T00:43:38+08:00  
**Source**: `.workflow/.brainstorm/BS-learn-profile优化-2026-01-29/backlog.json` Milestone B

---

## B-1: 定义 `profile_snapshot` schema（包含 pre_context + skills）

**Goal**: 明确读模型结构：pre_context(raw/parsed/provenance) + skills(asserted/inferred) + version/updated_at。

**Acceptance**
- snapshot 至少包含：pre_context、skills(asserted/inferred)、monotonic version、updated_at
- 结构支持渐进字段（后续评估/推荐扩展不破坏现有读取）

**Tests**
- schema 校验（JSON schema 或类型约束）覆盖必需字段
- 迁移/升级测试：旧 snapshot 能被读取或被迁移到新结构

---

## B-2: 定义 `profile_events`（append-only）事件类型与 payload 约定

**Goal**: 建立事件表/存储结构与事件 catalog，并保证不可变更。

**Acceptance**
- events 包含：event_id, profile_id, version, type, actor, created_at, payload
- 支持类型：PROFILE_CREATED / PRECONTEXT_CAPTURED / FIELD_SET / ASSERTED_SKILL_* / INFERRED_SKILL_* / ROLLBACK_TO_VERSION
- 事件不可 update/delete（逻辑/权限/存储层保障）

**Tests**
- 写入后尝试更新/删除应失败
- 事件 payload 结构有契约测试（防字段漂移）

---

## B-3: append_event 写入接口 + 版本号策略

**Goal**: 实现追加事件的原子写入，并返回新 version（用于 snapshot 更新与并发控制）。

**Acceptance**
- append_event 成功返回 new version
- 并发写入不产生 version 冲突或 silent overwrite（明确冲突处理策略）

**Tests**
- 并发测试：多事件并发追加版本单调递增且不丢事件
- 故障注入：写失败不更新 snapshot（事务语义明确）

---

## B-4: fold/rebuild：从 events 重建 snapshot（含 target_version）

**Goal**: 提供可重建能力：给定 event stream（可到某个 version），确定性地生成 snapshot。

**Acceptance**
- 同一事件流多次 fold 结果一致（deterministic + idempotent）
- 支持 target_version（用于审计/回滚视图）

**Tests**
- 属性测试/金样测试：固定事件流 -> 固定 snapshot
- 大事件流性能测试：rebuild 耗时在可接受范围（至少有基线指标）

---

## B-5: inferred skills 状态机（proposed/confirmed/rejected/superseded）+ 用户确认/否认

**Goal**: inferred 技能全链路事件化，并确保 confirmed 仅来源于用户显式确认。

**Acceptance**
- 所有 inferred 从 proposed 开始；禁止 auto-confirm
- confirm/reject 必须由用户动作触发（actor=user）
- rejected 再提：满足冷却期（30 天）且必须有新证据

**Tests**
- 状态迁移测试：合法/非法迁移覆盖（例如 proposed->confirmed OK；proposed->confirmed without user action FAIL）
- 再提策略测试：冷却期未到或无新证据时禁止 re-propose

---

## B-6: rollback_to_version（事件 + rebuild）+ 一致性保障

**Goal**: 实现回滚：写 ROLLBACK_TO_VERSION 事件 + 生成回滚后的 snapshot view，且不删历史。

**Acceptance**
- rollback 不删除/不篡改历史事件
- rollback 后，读取 profile_snapshot 得到的视图与 target_version 一致
- rollback 自身作为新 version 追加（可继续在回滚视图上演进）

**Tests**
- 回滚后再追加事件：版本与视图一致
- 回滚多次/回滚到不存在 version：错误清晰且不污染 snapshot

---

## B-7: 指标与可解释性：evidence/provenance 最小闭环

**Goal**: 让每个 inferred 都能回答“为什么这么认为”，并且能量化运行健康度。

**Acceptance**
- inferred 必须带 evidence（来源、文本片段/引用、taxonomy_version 或模板版本等）
- 指标至少包括：event 写入延迟/错误率、rebuild 耗时/失败率、confirm/reject 比例、rollback 成功率

**Tests**
- evidence 必填校验测试
- 指标事件结构契约测试（防字段缺失）

