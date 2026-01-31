# Brainstorm Session

**Session ID**: BS-假设learn-profile-update可以正确更新用户画像对于目标的能力评-2026-01-31
**Topic**: 假设learn:profile update可以正确更新用户画像对于目标的能力评估的前提下，优化当前的learn:plan 当前存在问题：
1) 识别到当前个人简介，没有进入对于领域缺失具体的profile update环节。
2) 预期是将update后的profile以及具体目标交接给learn-planning-agent subAgent执行，现阶段直接在主Agent上进行。
3) 生成目标后缺失Gemini Review阶段。
4) 预期 learn-planning-agent 生成任务后：Gemini Review先给用户弹 AskUserQuestion 确认是否修改；再展示修改后的计划让用户审阅并继续 AskUserQuestion 是否需要修改；若严重不符合要求则回滚/重跑该Phase，迭代直至确定最终任务。
5) exa生成资源应在任务规划phase后作为资源补充。
6) 缺失exa资源验证流程。
7) 结构化报错修复（Schema校验失败）：phase_name/assessment.type 枚举不匹配。
8) 基于上述细节，需要对整体流程闭环性与 learn-planning-agent 执行粒度做进一步优化评估。

**Started (UTC+8)**: 2026-01-31T14:37:59+08:00
**Dimensions**: technical, ux, feasibility, scalability

---

## Initial Context

**Focus Areas (assumed)**: 技术方案, 用户体验, 可行性评估
**Depth (assumed)**: balanced
**Constraints (assumed)**:
- 现有learn:*工具/agent生态不大改（以流程编排与契约收敛为主）
- 所有跨agent交互都应有可校验schema（避免“Exit code 1”这类不透明失败）

---

## Seed Expansion

### Original Idea
> 假设learn:profile update可以正确更新用户画像对于目标的能力评估的前提下，优化当前learn:plan的闭环：补齐profile缺口更新→目标与profile交接给learn-planning-agent→Gemini Review + AskUserQuestion迭代→计划定稿后exa补充资源→exa验证→最终输出；同时修复schema枚举校验失败，并优化子agent执行粒度。

### Exploration Vectors

#### Vector 1: 闭环编排（Orchestration Loop）
**Question**: learn:plan 应该如何以“可回滚/可重跑”的phase模型实现闭环？
**Angle**: 状态机/phase-run模型、版本化、幂等与检查点
**Potential**: 直接解决“缺环节、不可迭代确认、不可重跑”的核心痛点

#### Vector 2: Profile Gap → Profile Update Gate
**Question**: 何时判定“领域缺失/画像缺口”，并强制进入 profile update？
**Angle**: 缺口检测器（rules + model），与ask-user补充信息策略
**Potential**: 让后续规划基于“可信画像”而非猜测

#### Vector 3: 主Agent→learn-planning-agent 交接契约
**Question**: 交接给 subAgent 的最小输入/输出contract是什么？
**Angle**: 输入（profile+goal+constraints+history摘要）输出（plan draft + rationale + open_questions）
**Potential**: 降低主Agent复杂度，提升可测性与可控性

#### Vector 4: Gemini Review + AskUserQuestion 的迭代协议
**Question**: Review的产物如何变成“用户可确认的变更建议”，并支持反复迭代？
**Angle**: diff-based revision、review verdict（approve/needs_changes/rerun_phase）、用户确认点设计
**Potential**: 让计划稳定收敛，而不是一次性输出

#### Vector 5: exa资源补充（Post-Plan Enrichment）
**Question**: exa资源应该如何与计划结构绑定（按任务/子任务/技能点）？
**Angle**: 资源映射策略、引用颗粒度、成本控制
**Potential**: 提升学习路径的可执行性与外部支撑

#### Vector 6: exa资源验证（Resource Verification）
**Question**: 如何验证 exa 资源“可访问、相关、可信、不过期”？
**Angle**: 多信号评分（域名信誉/发布时间/相似度/重复度）、抽样校验、失败回退
**Potential**: 避免“资源看起来多但不可用/不相关”

#### Vector 7: Schema校验失败的结构化修复
**Question**: 如何在生成阶段就防止枚举值违规，并给出可修复错误？
**Angle**: enum映射与正规化、预校验、error payload（field_path, expected, actual, fix_suggestion）
**Potential**: 把“Exit code 1”变成“可自动修复/可提示用户”的闭环

---

## Thought Evolution Timeline

### Round 1 - Seed Understanding (2026-01-31T14:37:59+08:00)

#### Initial Parsing
- **Core concept**: 将 learn:plan 从“一次性生成”升级为“可编排、可迭代确认、可补充资源并验证”的闭环工作流
- **Problem space**:
  - 画像缺口未触发profile update
  - 规划职责未下沉到 learn-planning-agent
  - 缺失 Gemini Review 与用户确认循环
  - exa资源生成/验证缺环节
  - schema枚举不匹配导致结构化产出失败
- **Opportunity**: 建立“阶段化合约 + 迭代协议 + 资源验证”的可复用框架，后续可扩展到更多learn:*流程

#### Key Questions to Explore
1. learn:plan 的phase边界如何定义，才能支持“回滚/重跑/迭代确认”？
2. profile gap detection 的最小可行规则是什么？何时需要问用户补信息？
3. learn-planning-agent 的输入/输出schema如何设计，既稳定又不冗余？
4. Gemini Review 的职责是什么：纠错、优化结构、风险提示，还是对齐用户偏好？
5. AskUserQuestion 在循环中的触发策略与终止条件是什么？
6. exa资源的“生成→验证→挂载”的顺序与失败回退策略是什么？
7. schema校验失败应如何在生成前拦截并自动修复（尤其是枚举映射）？

---

### Round 2 - Multi-Perspective Exploration (2026-01-31T14:37:59+08:00)

#### Creative Perspective
1. **Plan-as-Conversation Contract（计划即对话）**（Novelty 4/5, Impact 5/5）
   - 把计划输出拆成“可对话的变更提案”：每轮只提出3-5个改动点 + 预估收益/代价，用户一键确认
2. **Profile Gap Radar（画像缺口雷达）**（Novelty 4/5, Impact 4/5）
   - 用“目标→能力图谱→证据”反推缺口字段；缺口越大越先触发profile update/ask-user
3. **Schema Auto-Heal（schema自愈层）**（Novelty 3/5, Impact 5/5）
   - 在schema校验失败时给出可机器执行的修复补丁（mapping+re-run），避免硬失败
4. **Two-Lane Planning（双车道规划）**（Novelty 3/5, Impact 4/5）
   - 快速车道：先出1页“最小计划”让用户确认方向；慢速车道：再补齐细粒度任务与资源

**Challenged Assumptions**:
- ~~一次输出完整计划更高效~~ → 先收敛方向再细化更容易成功
- ~~schema失败只能报错退出~~ → 可以做enum映射/修复建议实现自愈

#### Pragmatic Perspective
1. **显式Phase编排 + 强制Gate**（Effort 3/5, Risk 2/5）
   - 在learn:plan内部加phase runner：ProfileGapCheck → (optional) ProfileUpdate → GoalGen → HandoffPlanningAgent → GeminiReview → UserConfirmLoop → ExaEnrich → ExaVerify → Finalize
2. **learn-planning-agent 合约最小化**（Effort 2/5, Risk 2/5）
   - 输入：{profile_snapshot, goal, constraints, prior_feedback}
   - 输出：{plan_draft, assumptions, open_questions, schema_version}
3. **Review产物标准化为Diff**（Effort 3/5, Risk 3/5）
   - Gemini输出结构：{verdict, changes:[{path, before, after, reason}]}
   - 主Agent只负责把diff转成AskUserQuestion选项并应用

**Technical Blockers**:
- 当前是否已有统一的schema/validator与错误格式？（若无需先建立最小schema层）
- 子agent之间的消息大小/上下文限制（需要summary与引用而非全文）

#### Systematic Perspective
**Problem Decomposition (text diagram)**:
- Input理解层
  - 读取profile/goal/context
  - ProfileGapCheck（缺口检测）
- 规划层
  - GoalGen（目标明确化）
  - PlanningDraft（learn-planning-agent）
- 评审与对齐层
  - GeminiReview（结构/风险/一致性）
  - UserConfirmLoop（AskUserQuestion驱动的迭代收敛）
- 资源层
  - ExaEnrich（按任务挂载资源）
  - ExaVerify（可用性/相关性/可信度验证）
- 质量与安全层
  - SchemaNormalize + PreValidate（枚举映射、必填校验）
  - ErrorContract（可修复错误）

**Architectural Options**:
1. **Phase State Machine（推荐）**
   - Pros: 可回滚/重跑；可插拔；可观测
   - Cons: 需要定义phase schema与状态存储
2. **Pipeline + Hooks（轻量）**
   - Pros: 侵入小；快速落地
   - Cons: 复杂迭代与重跑会变得难维护

**Risk Matrix (initial)**:
- 高影响/中概率：用户确认循环设计不当导致“无限循环/频繁打扰”
- 中影响/高概率：schema枚举映射缺失导致持续失败
- 中影响/中概率：exa资源质量参差，验证成本上升

---

## Current Ideas (Draft)

1. Phase State Machine + Gate（闭环编排）
2. Contract-first Handoff（主→子agent职责切分）
3. Gemini Review Diff + AskUserQuestion迭代协议
4. exa Enrich & Verify（后置资源补齐与验证）
5. Schema Normalize & Auto-Heal（枚举修复与结构化错误）

---

## Open Questions For You (to drive Round 3)

1) 你更想先解决哪一类问题？
- A. 流程闭环（phase + 迭代确认）
- B. learn-planning-agent 粒度与合约
- C. exa资源生成/验证
- D. schema枚举错误与自愈

2) 你希望“Gemini Review”的角色更偏哪种？
- A. 质量审查（结构/一致性/可执行性）
- B. 教学优化（节奏、练习、循序渐进）
- C. 风险/合规（安全、可信来源、过期）
- D. 混合（请给权重）

---

## Idea Graveyard

*（暂空）*

---

### Round 3 - Direction Selected: Phase Runner + Schema Auto-Heal (2026-01-31T14:48:53+08:00)

#### User Direction
- **Selected focus**: A（闭环编排/phase runner）+ D（schema枚举修复与预校验/自愈）

#### What We Lock In (for now)
1) `learn:plan` 以 **phase state machine** 形式编排（可插拔、可重跑、可回滚、可观测）。  
2) 在结构化输出写出/交接前，加入 **SchemaNormalize + PreValidate + Auto-Heal**，把“Exit code 1”变成可修复错误或可交互回退。

#### Deep Dives Created
- `.workflow/.brainstorm/BS-假设learn-profile-update可以正确更新用户画像对于目标的能力评-2026-01-31/ideas/phase-state-machine.md`
- `.workflow/.brainstorm/BS-假设learn-profile-update可以正确更新用户画像对于目标的能力评-2026-01-31/ideas/schema-auto-heal.md`

#### Updated Idea Ranking (Working Set)
1. **Phase State Machine + Gates** ✅ active
2. **Schema Normalize + PreValidate + Auto-Heal** ✅ active
3. Contract-first Handoff（主→learn-planning-agent） ⏸ next
4. Gemini Review Diff + AskUserQuestion迭代协议 ⏸ next
5. exa Enrich & Verify ⏸ later

#### Key Design Choices to Resolve Next
1) **Schema严格性**：无法映射时是 `ask_user` 还是 `fallback_default`？  
2) **Auto-Heal审计**：自愈替换是否必须记录（建议：必须）以及记录在哪里？  
3) **Phase状态存储**：仅内存（一次性）、文件落盘、还是KV/DB（取决于系统现状）？

---

### Round 4 - Decisions Locked (2026-01-31T14:51:56+08:00)

#### Decision Outcomes
1) **Schema严格性**：无法映射时 → `ask_user`（不默默降级；保证语义正确）  
2) **Auto-Heal审计**：必须记录（保证可追踪、可回放、可解释）  
3) **Phase状态存储**：文件落盘（作为起步方案，便于调试与复现；未来可迁移到DB/KV）

#### Implications (How This Changes The Flow)
- learn:plan 不再因为 schema 枚举问题硬失败：可映射→自动修复重试；不可映射→进入 AskUserQuestion。
- 所有 auto-heal 修改都可追踪（用于 review 与问题排查）。
- phase runner 将产生可复现的 run state 文件，为 rerun/rollback 提供数据基础。

---

## Synthesis & Conclusions (2026-01-31T14:51:56+08:00)

### Primary Recommendation
以 **Phase State Machine** 作为 learn:plan 主干编排；并将 **SchemaNormalize + PreValidate + Auto-Heal** 作为质量关卡（独立phase或横切hook）。

在本轮已锁定策略：
- enum 无法映射 → `ask_user`
- auto-heal 审计 → 必须记录
- phase 状态 → 文件落盘（起步方案）

### Quick Start Path (落地顺序)
1. 先做 phase runner + run state 文件落盘（提供 rerun/rollback 的数据基础）。
2. 接入 PreValidate：在写出/交接结构化结果前统一校验。
3. 加入 enum Normalize+Mapping：命中则 auto-heal 并记录审计；未命中则 AskUserQuestion。

### What This Solves (映射到原问题)
- 解决「缺闭环」：phase runner 提供可插拔与可重跑骨架。
- 解决「schema硬失败」：PreValidate + Auto-Heal 把 Exit code 1 变成可修复/可交互。
- 为后续（handoff、Gemini review、exa enrich/verify）提供稳定插入点。

---

### Round 5 - User Feedback & Flow Re-Design (2026-01-31T15:29:07+08:00)

#### User Feedback (Summary)
1) `GoalClarify` 应提前到最前，先让用户确认真实目标追求。
2) `ProfileGapCheck` 与 `ProfileUpdateGate` 可合并：基于明确目标去 profile 中查对应领域评估、有效性与置信度。
3) 若该目标领域能力未检测或置信度不足：构建 learn:profile 相关命令（领域 + 具体目标），让用户执行评估；后续流程不继续。
4) 需要明确 `learn-planning-agent` 的规划策略与逻辑。
5) SchemaNormalize/PreValidate/Auto-Heal 先做“最小处理”，测试阶段不考虑版本迁移。
6) GeminiReview 只需 Review “当前 Plan 是否合理”，必须考虑 Goal + Profile。
7) AskUserQuestion：每次修改后询问是否达到预期（迭代收敛）。
8) ExaVerify：需要资源质量衡量算法 + query切换/重生成等策略保证质量。

---

#### Revised Orchestration Flow (V2, ASCII)

```
learn:plan (V2)

[O0] GoalClarify (AskUserQuestion loop)
     - 目标具体化/可评估化/约束对齐/成功标准
        |
        v
[O1] ProfileCapabilityCheck (merge of gap-check + update gate)
     - 在 current_profile 中查找「目标领域」能力评估
     - 校验：是否存在？是否过期？是否覆盖该目标？置信度够不够？
        |
        +--> (NOT OK)  [O1a] Build learn:profile_eval command + AskUserQuestion
        |                 - 给用户执行评估/补证据
        |                 - 状态: needs_user -> STOP (不进入后续规划)
        |
        +--> (OK)      [O2] Handoff -> learn-planning-agent
                           - 用 goal_spec + profile_evidence 生成 plan_draft
                              |
                              v
                        [O3] Minimal PreValidate (+Enum Normalize) + Audit
                              |
                              v
                        [O4] GeminiReview (review_diff + verdict)
                              |
                              v
                        [O5] AskUserQuestion (accept/edit/rerun)
                              |
                              v
                        [O6] PlanLock
                              |
                              v
                        [O7] ExaEnrich
                              |
                              v
                        [O8] ExaVerify (quality scoring + retry strategy)
                              |
                              v
                        [O9] Finalize
```

---

#### What We Need To Define Next (to make V2 implementable)

1) **Profile 能力评估“置信度/有效性”怎么衡量（最小可用）？**
- 建议先做一个简单 score（0-1）由以下信号组成（可逐步扩展）：
  - `has_assessment`（是否存在该领域评估记录）
  - `recency_days`（距离上次评估的天数，越新越高）
  - `coverage`（评估是否覆盖目标关键能力点：从 goal_spec 拆解出来）
  - `evidence_type`（自评 < 项目作品/代码仓库 < 标准化测验/挑战）
  - `consistency`（历史结果是否一致/是否与近期产出一致）
- 阈值示例：`score >= 0.7` 认为 OK；否则触发 [O1a]。

2) **[O1a] learn:profile 相关命令长什么样？（你提到“领域+具体目标”）**
- 需要明确：是 `learn:profile_update` 还是一个更“评估导向”的命令（如 profile_evaluate / capability_assess）？
- 需要明确输出：返回哪些字段能被 [O2] 可靠消费（尤其是 evidence + confidence）？

3) **learn-planning-agent 的规划策略（[O2]）**
- 最小策略建议：基于 `goal_spec` 生成“能力阶梯”并映射到 `phase_name`（Foundation...Mastery），再在每个阶段内生成 tasks + assessments（type枚举合法）。
- 需要确定：计划颗粒度（阶段→周→任务？还是阶段→模块→任务？）与可迭代修改点（哪些字段允许 GeminiReview 改？）。

4) **SchemaNormalize/PreValidate/Auto-Heal 在测试阶段的“最小版本”**
- 只做两件事即可（避免版本迁移复杂度）：
  - enum 正规化与映射：`phase_name`、`assessment.type`
  - 结构化错误输出：不可映射 -> AskUserQuestion（不硬退出）
- Audit 也先最小化：记录 `field_path/before/after/rule_id/timestamp`。

5) **GeminiReview 的 Review 范围（[O4]）**
- 仅评审：计划是否满足 `goal_spec`、是否与 `profile_evidence` 匹配（难度/节奏/评估方式是否合理），并输出 diff 建议。
- 不越权：不擅自改变目标本身；涉及目标变化必须通过 AskUserQuestion。

6) **ExaVerify 的质量衡量算法（[O8]）**
- 最小可用：对每条资源打分 `0-1`，综合：
  - 可访问性（HTTP/可打开）
  - 相关性（与 task/关键词相似度）
  - 可信度（域名信誉/官方文档/作者/引用）
  - 时效性（发布时间/更新时间）
  - 去重（相同内容/镜像降权）
- Retry 策略：低分资源触发 query 改写（加限定词/换同义词/加“official/docs/tutorial”），或切换资源类型（文档/教程/视频/书籍章节）。

---

### Round 6 - Clarify `phase_name` Semantics (2026-01-31T15:34:47+08:00)

#### What `phase_name` Means (User Intent)
`phase_name` 作为“从当前能力到目标能力”的**可衡量阶段标准**：让后续 Review / 测验 / 进度跟踪都有一个统一标尺，而不是纯叙事描述。

#### Key Conclusion
`phase_name` 本身是**粗粒度枚举标签**（Foundation...Mastery），真正“可衡量”的部分需要由额外字段承载（例如 success criteria、evidence、assessment plan）。

因此建议：
- `phase_name` 保持枚举稳定（便于 schema 校验与跨组件消费）。
- 每个 phase 附带：
  - `entry_criteria`（当前应具备的可验证能力/证据）
  - `exit_criteria`（完成该阶段的可验证能力/证据）
  - `assessments`（用哪种 assessment.type 来验证 exit）
  - `confidence`（基于 profile_evidence 的置信度，用于 Review 判断“是否规划过度/不足”）

---

### Round 7 - Decisions: Phase Subrange + Evidence Signal (2026-01-31T15:40:08+08:00)

#### User Decisions
1) `phase_name` 输出策略：允许只输出「当前能力所在阶段 → 目标阶段」的**连续子区间**（不强制输出全五段）。
2) 能力有效性信号：优先以 **测验结果** 作为 profile_evidence 的核心依据。

#### Implications (Design Updates)
1) learn-planning-agent 需要先判断 `current_phase_name` 与 `target_phase_name`，再只生成该区间 `phases[]`。
2) ProfileCapabilityCheck 的最小置信度算法可先简化为：`test_score` + `recency` 两个信号（测试阶段不引入更复杂证据）。

#### Minimal Capability Confidence (MVV, Test-based)
- `has_test_result`: 0/1（该目标领域是否有测验结果）
- `test_score_norm`: 0..1（将测验分数/通过率正规化）
- `recency_norm`: 0..1（最近测验越新越高，例：clamp(1 - days/90, 0, 1)）
- `confidence = 0.7*test_score_norm + 0.3*recency_norm`（若无测验结果则 confidence=0）
- Gate 阈值建议：`confidence >= 0.7` 才进入规划；否则走 [O1a] 生成评估命令并 STOP。

#### Open Question (Small)
测验结果在 profile 里大概长什么样？（选一个即可）
- A. 只有“通过/不通过”
- B. 分数（0-100/0-1）+ 日期
- C. 分项能力得分（多个维度）+ 日期

---

### Round 8 - Defer Test Details; Lock Stage Meaning (2026-01-31T16:14:25+08:00)

#### User Clarification
暂时不纠结“测验结果字段/算法”，后续迭代再补。

当前只锁定：`phase_name` 的阶段划分含义 = **当前能力 → 目标能力** 的阶段标准（用于 Review / 评估 / 进度对齐的统一标尺）。

#### Updated Contract Direction (Test-Agnostic)
- ProfileCapabilityCheck 不绑定“测验”这一单一证据类型，而是消费 profile 中已有的**能力评估结果**（来源可多样）。
- Gate 的最小要求：profile 能提供 `current_phase_name`（或可推断）+ `confidence`（或可推断）；否则走 [O1a] 让用户先评估/补证据并 STOP。

建议 learn:profile_update 产物至少包含：
- `domain`
- `current_phase_name`（enum）
- `confidence`（0..1）
- `evidence_summary`（一段可读摘要 + 可选引用）

#### Planning Output (What Review/Assessment Can Anchor On)
- phases[] 仍按「current -> target」连续子区间输出。
- 每个 phase 提供可衡量字段：`entry_criteria` / `exit_criteria` / `assessments[]`（type枚举合法）。
- GeminiReview 只需基于 `goal_spec + profile_evidence` 检查这些 criteria 是否合理。

---

### Round 9 - Decide How To Determine `target_phase_name` (2026-01-31T16:15:53+08:00)

#### Decision
采用「系统先给建议 + AskUserQuestion 让用户确认」：
1) 在 GoalClarify 结束时，系统根据 `goal_spec` 推断一个 `target_phase_name_suggestion`（并给出理由）。
2) 通过 AskUserQuestion 让用户确认/修改 target phase。
3) 用户确认后锁定 `target_phase_name`，再进入 ProfileCapabilityCheck gate。

#### Implication
learn-planning-agent 的输入应包含已确认的：
- `current_phase_name`（来自 profile_evidence）
- `target_phase_name`（来自 GoalClarify 确认）

从而稳定生成 contiguous subrange phases[]。

---

### Round 10 - Planning Granularity (2026-01-31T16:25:21+08:00)

#### Decision
learn-planning-agent 的计划粒度采用：**阶段 → 模块 → 任务**（暂不做周计划）。

#### Implications
- `phases[]`（current→target 子区间）下包含 `modules[]`；每个 module 下包含 `tasks[]`。
- 后续若需要排期（周计划），应作为可选后处理（不影响核心能力阶段结构）。

---

### Round 11 - Module Cutting Rule (2026-01-31T16:28:55+08:00)

#### Decision
模块按 **能力点** 切分（不是按知识章节/主题）。

#### Implications
- learn-planning-agent 需要从 `goal_spec` 抽取能力点列表，并将能力点映射到 `modules[]`（每个 module 对应一个可验证能力点）。
- 每个 module 下的 `tasks[]` 应围绕该能力点产出“学习/练习/产出”，并给出可验证的 `exit_criteria` 与 `assessments[]`。
- GeminiReview 的主要检查点之一：能力点覆盖是否完整、是否与 profile_evidence 的短板对齐、是否存在多余/偏离能力点。

---

### Round 12 - Capability Points Count (2026-01-31T16:31:43+08:00)

#### Decision
能力点抽取默认规模：**15-25**（更全面）。

#### Implications
- learn-planning-agent 需要提供能力点去重/合并策略，避免“同义重复”撑大数量。
- GeminiReview 需检查：能力点是否过细导致不可执行，或过多导致路径冗长。
- AskUserQuestion 可提供“精简/保留/扩展”的开关（默认按 15-25 输出）。

---

### Round 13 - Verification Output Minimalism (2026-01-31T16:34:02+08:00)

#### Decision
暂时每个能力点只要求写 `exit_criteria`（assessment 后续迭代再补齐）。

#### Implications
- learn-planning-agent 输出 schema 可先不包含 `assessments[]`（或留空）。
- GeminiReview 的检查重点先放在：能力点覆盖、阶段划分合理性、以及每个能力点的 exit_criteria 是否清晰可验证。
- Schema 校验的枚举压力下降（assessment.type 可后置），当前只需保证 `phase_name` 枚举合法。

---

### Round 14 - `exit_criteria` Style Guide (2026-01-31T16:42:45+08:00)

#### Decision
`exit_criteria` 默认采用“产出物 + 行为能力”混合（可验证、可 review）。

#### Minimal Template (per capability point)
每个能力点建议输出 2-5 条 exit criteria，覆盖两类：
1) **Artifact（产出物）**：必须能展示/提交/运行/复现（例如：实现一个XX、提交一个PR、交付一个demo）。
2) **Capability（行为能力）**：必须能在约束下完成（例如：在XX限制下完成YY，并能解释 tradeoff）。

#### Anti-Patterns (avoid)
- 仅使用模糊动词：理解/掌握/熟悉（不可验证）
- 只写“看完/学完某课程”（过程不等于能力）

---

### Round 15 - Tasks Per Capability Point (2026-01-31T16:47:31+08:00)

#### Decision
每个能力点（module）默认输出 **3 条 tasks**（Learn/Practice/Produce 各 1 条），并提供可选扩展到 4-5 条的规则。

#### Default Task Set (per module)
1) **Learn**：获取关键概念/方法（避免过长的资源清单）。  
2) **Practice**：最小练习把方法跑通。  
3) **Produce**：产出一个可展示成果/片段（支撑 exit_criteria）。

#### Optional Expansion (only when needed)
- **Debug/Refactor**：能力点复杂或易踩坑时加 1 条。  
- **Setup/Tooling**：强依赖工具链时加 1 条（尽量避免每个 module 都重复）。

---

### Round 16 - Exit Criteria Count Per Capability Point (2026-01-31T16:52:37+08:00)

#### Decision
每个能力点（module）默认写 **3 条 `exit_criteria`**：
- 建议分布：2 条偏“产出物（Artifact）”，1 条偏“行为能力/约束（Capability-in-constraints）”。
- 简单能力点可降到 2 条；复杂/高风险能力点可升到 4-5 条（尽量不超过 5）。

---

### Round 17 - Fix Phase Inference Ownership + Profile Update Requirements (2026-01-31T17:25:06+08:00)

#### User Feedback (Key Points)
1) `target_phase_name_suggestion` 不应在 GoalClarify 阶段由“系统”给出；phase 划分应由 learn-planning-agent 结合 profile+goal 自主推导。
2) `current_phase_name` / `target_phase_name` 不应作为 learn-planning-agent 的必填输入，更像其输出推导结果。
3) 可以考虑补全 `assessments`（后续迭代或可选）。
4) 当前已有 `learn:profile` 的 update 接口：希望能满足「构建评估/补证据」的 needs_user STOP 方案；同时还希望有轻量级 update（只更新描述/字段）能力。

#### Resolution (Flow V3 Adjustments)
1) **GoalClarify**：只负责把 goal_spec/约束/成功标准澄清到可规划，不负责给 target phase 定论。
2) **ProfileCapabilityCheck**：只做“证据门禁”——判断 profile 是否具备该领域的能力评估证据（domain/evidence/confidence/evidence_summary）。
   - 不足则构建 `learn:profile_update`（评估导向）命令 + AskUserQuestion，并 **STOP**。
3) **learn-planning-agent**：负责推导并输出：
   - `current_phase_name`（推导）+ `target_phase_name`（推导）
   - phases 子区间 + 15-25 能力点 modules + tasks + exit_criteria
   - 推导理由（why/rationale）+ 置信度（confidence）
4) **AskUserQuestion**：若 learn-planning-agent 对 current/target phase 推导置信度不够，则在输出时触发一次确认（可覆盖默认推导）。

#### learn:profile_update Usage (Two Intent Modes)
1) **Assessment-oriented update（评估/补证据）**：
   - 输入包含：domain + clarified goal + requested evidence/questions
   - 输出至少包含：domain, confidence, evidence_summary（以及可选 current_phase_name）
2) **Lightweight update（轻量更新描述）**：
   - 仅更新 profile 的描述/字段（不做评估），用于用户主动维护画像
