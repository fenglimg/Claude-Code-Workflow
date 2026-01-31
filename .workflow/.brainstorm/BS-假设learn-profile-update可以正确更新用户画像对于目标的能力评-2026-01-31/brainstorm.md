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
以 **Phase State Machine** 作为 learn:plan 主干编排；并将 **SchemaNormalize + PreValidate + Auto-Heal** 作为质量关卡（独立phase或横切hook）。\n\n在本轮已锁定策略：\n- enum 无法映射 → `ask_user`\n- auto-heal 审计 → 必须记录\n- phase 状态 → 文件落盘（起步方案）\n\n### Quick Start Path (落地顺序)
1. 先做 phase runner + run state 文件落盘（提供 rerun/rollback 的数据基础）。\n2. 接入 PreValidate：在写出/交接结构化结果前统一校验。\n3. 加入 enum Normalize+Mapping：命中则 auto-heal 并记录审计；未命中则 AskUserQuestion。\n\n### What This Solves (映射到原问题)
- 解决「缺闭环」：phase runner 提供可插拔与可重跑骨架。\n+- 解决「schema硬失败」：PreValidate + Auto-Heal 把 Exit code 1 变成可修复/可交互。\n+- 为后续（handoff、Gemini review、exa enrich/verify）提供稳定插入点。\n*** End Patch 왜?! ***!
