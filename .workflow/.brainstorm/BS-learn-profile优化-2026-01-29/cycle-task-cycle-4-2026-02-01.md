# Cycle-4 Task: Topic Expansion + Seed=4 (Gemini) + Full Pack Async + No Self-Rating + Bash Noise Reduction

**Generated**: 2026-02-01T16:26:21+08:00  
**Source Session**: `BS-learn-profile优化-2026-01-29`  
**Basis**: Latest decision_locks + decision_overrides in `synthesis.json` (2026-02-01).

---

# Main Objective

把当前 learn:profile create/full-assessment 从“能跑通”升级为“体验顺滑 + 评估可信 + 全自动”的版本：
- AskUserQuestion 批次按“一次调用=4题”执行（UI 若 2 题/屏仅做进度标注，不改 UI）
- profile 默认复用同一个（不每会话 new）
- topic 覆盖校验集成主 Agent 的背景解析 + 联想拓展（作为反馈 loop）
- Seed=4 不再固定模板：优先 Gemini CLI 生成（阻塞等待）；失败才 fallback 主 Agent 生成
- full pack 由 Gemini CLI 后台补全（异步 job），主流程不阻塞；失败/超时才 fallback 会话级补题
- 移除用户自评（完全不需要）
- 答题交互仅保留：确认提交/继续编辑（不提供跳过）
- 明显减少 Bash/CLI 中断感（批量写事件/降低写 profile 频率/合并 pack 调用）

---

# Hard Constraints (Must Hold)

- **No self-rating**: 不出现“你觉得对/错/部分对”的自评步骤。
- **Auto-only calibration**: 校准全自动；不问“要不要继续校准”。
- **Seed stop rule**: `sigma = hi - lo`，仅当 `sigma <= 0.1` 才允许高置信结束（否则自动加题到 `N_seed_max=6`，再不行标 low_confidence）。
- **Topic taxonomy pollution guard**: 仅当用户选中/输入才 `resolve-topic`/`ensure-topic`；未被用户选中的联想候选绝不 ensure。
- **Cross-domain**: 方案不依赖“编程特性”；`debug` 节点语义泛化为诊断/分析/纠错。
- **AskUserQuestion limits**: 每次调用最多 4 个 questions；每个 multiSelect 问题最多 4 options。

---

# Deliverables

## A) Topic candidates + coverage feedback loop (UX + policy)

- 主 Agent 生成 topic 候选：从 background 主观解析 + 联想拓展（每个候选带 1 句理由）。
- topicCoverageValidationLoop 作为反馈 loop：
  - 每轮两次 AskUserQuestion：
    1) 4 个 multiSelect questions（每题<=4 options，总计<=16 topics）
    2) type something 补充 + 已覆盖/还需补充
  - loop guard：最多 3 轮
  - 对用户选中/输入的 raw labels：先 `learn:resolve-topic`，无法 resolve 才 `learn:ensure-topic`（provisional）

## B) Seed=4 generation (Gemini-first, blocking)

- Seed=4 questions 由 Gemini CLI 先行输出（阻塞等待）：
  - 4 个 capability_node：`see/explain/apply/debug(诊断/分析)`
  - 4 个 difficulty：`0.25/0.45/0.65/0.85`（顺序可自适应，但集合固定）
  - taxonomy 存在时：至少 2 题命中 must（不足则 core 降级补足并记录原因）
  - 每题必须包含：`common_mistakes[]` + `grading_notes`
- **Fallback**：仅当 Gemini 生成失败/超时/不符合 schema 时，主 Agent 用同一 schema 生成 Seed=4 并继续。

### B2) Seed 生成策略（具体 Prompt / 题库 / 数据结构统一）

目标：Seed=4 不只是“4道题”，而是可回归、可校验、跨学科通用的“区分度种子包”，并与 full pack / 评估引擎共享同一套数据结构。

Inputs（Gemini CLI 与主 Agent fallback 共享）：
- `topic_id`（canonical）
- `language`（zh-CN）
- `background.summary`（进入 seed 题干措辞，但不进入 full pack cache key）
- `taxonomy.subpoints`（must/core/nice；若缺失允许 seed 产出临时 subpoints 草案写入 pack._metadata）

Outputs（统一 schema）：
- 产出 `Pack(pack_kind='seed')`，其中 `questions` 恰好 4 条，且每条 `Question` 字段齐全（见 Deliverables/Hard constraints）。

区分度最小标准（强约束，生成后必须校验）：
- `see`：能区分“是否见过/能否正确识别基本概念”
- `explain`：必须要求机制/因果链（否则背诵无法区分）
- `apply`：必须给具体场景/输入输出/约束（否则泛泛而谈无法区分）
- `debug`（诊断/分析）：必须给诊断步骤/错误归因/取舍（否则高阶能力无法区分）

生成后校验（不通过视为失败 -> 触发 fallback）：
- schema 校验：字段齐全/类型正确
- 覆盖校验：taxonomy 存在时 must 命中>=2（不足则 core 降级并记录原因）
- 区分度校验：`common_mistakes`/`grading_notes` 非空；题干包含“例子 + 边界/坑 + 推理链/取舍”

## C) Full pack async generation (Gemini-first, non-blocking)

- full pack 为 topic-level 共享资产（cache key=pack_key，不含 background_hash）。
- 启动后台 job 生成 full pack（taxonomy + qbank + regression skeleton）：
  - job status 落盘：`.workflow/learn/packs/{topic_id}/jobs/{pack_key_hash}.full.json`
  - 状态：pending/running/done/failed
- 主流程永不等待 full pack：
  - full 未 ready：继续会话级补题（不写入 pack）
  - full ready：后续选题切换到 full pack
  - full failed/timeout：继续会话级补题 + 记录失败原因（不弹用户选择）

### C2) Full pack 生成策略（后台补全 + 失败退化）

Full completeness（当前代码口径）：
- `has_taxonomy && has_question_bank && has_regression_skeleton && must/core 100% covered`

Gemini job 输出（统一 schema）：
- `Pack(pack_kind='full')`，包含：
  - `taxonomy.subpoints`（must/core/nice + min_evidence）
  - `questions[]`（覆盖 must/core，且每个 subpoint 至少多难度题供自适应挑选）
  - `regression_cases[]`（回归骨架；>=30 或你们门槛）
- job status 写入：`.workflow/learn/packs/{topic_id}/jobs/{pack_key_hash}.full.json`

切换策略（主流程不阻塞）：
- 评估中按 flush_interval（建议每 4 题）检查一次 pack status：
  - 若 full pack done：后续选题从 full pack 选取
  - 若未 done：继续会话级补题，不等待

失败退化：
- job failed/timeout：记录失败原因到 session summary / events；评估继续用会话级补题完成（不弹用户选择）

## D) Assessment loop changes

- 移除自评；评分由 Claude rubric 输出（p_correct + confidence + evidence）。
- 阈值锁定：pass_th=0.75, fail_th=0.25, confidence_gate=0.6；hints/time/retries 仅影响 confidence。
- 校准全自动补题到 N_seed_max=6；仍不收敛则标 low_confidence 并进入保守策略。

### D2) 具体评估策略（收敛/选题/结束）

State：
- `ability_interval=[lo,hi]` 初始 `[0,1]`
- `sigma = hi-lo`
- `asked_count`

Per-question scoring contract（Claude 输出）：
- `p_correct`, `confidence`, `rubric`, `covered_subpoints`, `missing_subpoints`, `evidence`

Update rule（已锁定阈值）：
- if `confidence>=0.6` and `p_correct>=0.75`: `lo=max(lo, difficulty)`
- if `confidence>=0.6` and `p_correct<=0.25`: `hi=min(hi, difficulty)`
- else：uncertain path（不 hard update；下一题优先挑 `difficulty≈(lo+hi)/2` 的高区分度题）

Question selection policy：
- Seed 阶段：在剩余的 0.25/0.45/0.65/0.85 中，选最接近 `(lo+hi)/2` 的那题（顺序自适应）
- Full/Session 阶段：优先补齐 must 证据缺口；其次最大化信息增益（difficulty 接近 midpoint）；再其次多样性/避免重复模板

Termination：
- 高置信结束：`sigma<=0.1` 且 must 证据满足最低要求（taxonomy 存在时）
- 题量上限：`N_seed_max=6`（仍不满足则标记 low_confidence，进入保守策略，不阻塞用户）

## E) Bash noise reduction (concrete)

目标：把 “每题多次 Bash 写事件/写 profile” 降到 “每 4 题 flush 一次 + topic 结束写一次”。

最低落地组合（推荐）：
1) **events batch**：新增或使用 `learn:append-profile-events-batch`（一次写多条 ASSESSMENT_* / FIELD_SET / PRECONTEXT_CAPTURED）
2) **flush policy**：评估中每 4 题 flush 一次；topic 结束强制 flush
3) **profile write policy**：topic 结束写一次 profile（而不是每题/每步写）
4) **pack calls**：每 topic 最多一次 status + 一次启动 full-pack job；不要题目粒度地 ensure/read/status

---

# Acceptance Criteria (Smoke + Regression)

- [ ] (FB-1) pre_context：一次 AskUserQuestion 调用传入 4 questions（批次口径=call 内 questions 数），header 显示 (1/4..4/4)；UI 若仍 2题/屏可接受。
- [ ] (FB-2) profile：默认复用同一 profile（active_profile_id 或固定 profile），create 为 upsert（不每会话 new）。
- [ ] (FB-3) topics：候选由主 Agent 背景解析+联想生成；topicCoverageValidationLoop 为反馈 loop（覆盖是否完整）；每轮最多 16 topics + type something；仅用户选中/输入才 resolve/ensure-topic（未选中的联想 topic 绝不 ensure）。
- [ ] (FB-4) seed+pack：Seed=4 优先 Gemini CLI 阻塞生成（非固定模板、保证区分度）；full pack Gemini CLI 后台异步补全；Gemini 失败/超时/产物不合法才 fallback 主 Agent；主 Agent 评估读取题库按规则决策能力。
- [ ] (FB-5) no self-rating：评估过程中不出现“对/错/部分对”用户自评。
- [ ] (FB-6) answer confirm/edit：每题仅提供“确认提交/继续编辑”（不提供跳过此题）。
- [ ] (FB-7) bash noise：评估中 Bash 次数显著下降（目标：每 4 题最多 1 次 events batch 写入 + 每 topic 1 次 profile 写入；pack 调用粗粒度化）。

- pre_context：一次 AskUserQuestion 调用传入 4 questions，header 显示 (1/4..4/4)；UI 2题/屏仍可接受。
- profile：默认复用同一 profile（active_profile_id 或固定 profile），create 为 upsert。
- topics：候选来自 Agent parse+expand；每轮最多 16 topics + type something；仅用户选中/输入才 ensure-topic。
- seed：Gemini 成功时阻塞等待 seed=4；Gemini 失败时自动 fallback 主 Agent；两者输出 schema 一致。
- pack：full pack job 异步；主流程不阻塞；job failed/timeout 不影响评估继续。
- assessment：无自评；sigma<=0.1 才高置信结束；自动补题到 N_seed_max=6。
- bash：评估中可见 Bash 次数显著下降（目标：每 4 题最多 1 次 events batch 写入 + 每 topic 1 次 profile 写入）。

---

# Suggested Implementation Steps (RA -> EP -> CD -> VAS)

1) RA: 定义统一 Pack/Question schema（seed/full 共用）+ Gemini 产物校验规则（validate-questions）。
2) EP: 在 /learn:profile 中实现 topic candidates 分组展示（4 multiSelect 问题）+ feedback loop。
3) EP: 接入 Gemini CLI（seed blocking + full async job）与失败兜底；实现 job status 文件。
4) EP: 改造 assess 模块：去自评、用 rubric contract、实现 sigma 收敛与自动补题。
5) EP: 实现 events batch + flush 策略；减少 write-profile 频率；合并 pack calls。
6) VAS: 增加回归测试（topic ensure 污染防线、seed fallback、job 状态机、bash 次数 smoke）。

---

# Source

Brainstorm Session: `BS-learn-profile优化-2026-01-29`  
Key files:
- `.workflow/.brainstorm/BS-learn-profile优化-2026-01-29/synthesis.json`
- `.workflow/.brainstorm/BS-learn-profile优化-2026-01-29/brainstorm.md`
- `.claude/commands/learn/profile.md`
- `.claude/commands/learn/_internal/assess.js`
- `ccw/src/commands/learn.ts`
