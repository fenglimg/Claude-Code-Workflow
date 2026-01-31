# Brainstorm Session

**Session ID**: BS-learn-profile优化-2026-01-29
**Topic**: learn：profile优化
**Started**: 2026-01-29T22:44:53+08:00
**Dimensions**: technical, ux, feasibility, scalability

---

## Initial Context

**Focus Areas**:
- 初始化流程简化 (Goal & Experience)
- 学习偏好深度挖掘 (Pre-Context Setup)
- 画像初始化与技能联想 (Profile Initialization)
- 评估机制升级 (Assessment Logic)
- 资源文件清理 (Refinement)

**Depth**: balanced

**Constraints (Hard)**:
- 初始化阶段不强制用户提供明确的 Goal Type
- 初始化阶段不要求用户陈述整体编程经验水平
- Pre-Context 优先通过 AskUserQuestion 收集学习习惯与偏好
- 提问必须使用固定且全面的问题模板；每次固定 4 个问题 (用满 AskUserQuestion 负载)
- 评估环节仅允许用户纯文本输入；严禁提供选择题选项
- 引入动态难度调整 + 置信度计算（语义相似度 × 知识点覆盖率）
- 停用并确认删除 KeywordDictionary.json（流程不再依赖静态字典）

---

## Seed Expansion

### Original Idea
> learn：profile优化

### Exploration Vectors

#### Vector 1: What Are We Optimizing?
**Question**: profile 的“好”如何定义：更快完成？更准画像？更适配学习路径？
**Angle**: success metrics
**Potential**: 明确指标才能做取舍（摩擦 vs 信息量）

#### Vector 2: Friction vs Signal
**Question**: 初始化最小必填能否仍收集到足够强的信号？
**Angle**: UX + data quality
**Potential**: 提升转化/留存同时保证画像可靠

#### Vector 3: AskUserQuestion Template
**Question**: 4 问固定模板如何覆盖时间/注意力/形式偏好/目标场景并可扩展？
**Angle**: conversation design
**Potential**: 前置调研“稳定化”，减少随意追问导致的信息缺口

#### Vector 4: Skill Inference
**Question**: 如何从用户自述技能点做“可解释、可回滚”的技能联想？
**Angle**: inference + provenance
**Potential**: 自动扩展画像维度，并能给用户纠错入口

#### Vector 5: Assessment Without Multiple Choice
**Question**: 纯文本评估如何既高效又能区分层级？
**Angle**: evaluation design
**Potential**: 更真实捕捉理解深度，减少猜题

#### Vector 6: Dynamic Difficulty
**Question**: 动态跳级/降级的触发条件是什么？如何避免误判造成挫败？
**Angle**: adaptive algorithm
**Potential**: 提升评估效率、缩短对话轮次

#### Vector 7: Removing KeywordDictionary
**Question**: 删除静态字典后，知识点归因/覆盖率怎么做？
**Angle**: maintainability + scoring
**Potential**: 降低维护成本，避免字典过时拖累体验

---

## Thought Evolution Timeline

### Round 1 - Seed Understanding (2026-01-29T22:44:53+08:00)

#### Initial Parsing
- **Core concept**: 优化 learn 场景下的用户画像（profile）初始化与更新流程，使学习推荐/评估更准确，同时降低初始化摩擦。
- **Problem space**:
  - 初始化强约束导致流失（Goal Type 强制、经验自评）
  - 画像信息不完整/不可用（偏好与习惯缺失）
  - 技能点无法扩展到可用的知识体系（缺乏联想与归因）
  - 评估效率低/置信度低（关键词命中式评估、选择题可猜）
  - 静态字典维护成本高且易过时（KeywordDictionary）
- **Opportunity**:
  - 用“固定模板 + 动态追问”稳定收集偏好信号
  - 用“可解释的技能联想 + 语义评分”提升画像质量
  - 用“动态难度”减少评估轮次，提升效率和体验

#### Key Questions to Explore
1. 最小必填字段是什么？哪些字段可延迟到后续自然对话再补？
2. AskUserQuestion 的 4 问模板具体问什么，如何保证全面且不过度打扰？
3. 技能联想的输出结构（inferred skills）如何存储（置信度、证据、来源时间）？
4. “立即深度评估 / 暂时结束”等节点的文案/时机如何设计？
5. 纯文本评估如何设计题型（解释、推导、对比、debug 思路等）以区分水平？
6. 动态难度调整用哪些信号（概念准确度、结构化表达、反例、边界条件）？
7. 置信度计算如何做到可复现（评分 rubric + 覆盖率计算）？
8. 删除 KeywordDictionary 后，覆盖率的“知识点集合”来源是什么？
9. 如何避免技能联想的“过度推断”带来的误导？
10. 如何在隐私与个性化之间平衡（最小化采集、明确告知用途）？

---

### Round 2 - Multi-Perspective Exploration (2026-01-29T22:44:53+08:00)

#### Creative Perspective

**Top Creative Ideas**:
1. **“无感评估”Shadow Assessment** ⭐ Novelty: 4/5 | Impact: 5/5
   把评估题嵌入正常对话（让用户描述做过的事/如何解决问题），通过 rubric 评分，不出现“考试感”。
2. **Skill Constellation（技能星图）** ⭐ Novelty: 4/5 | Impact: 4/5
   将用户自述技能点映射到“相关知识簇”，展示为可编辑的“推断结果”，让用户一键确认/否认。
3. **Goal Type 自动推断 + 轻量确认** ⭐ Novelty: 3/5 | Impact: 5/5
   不问 Goal Type，先问“你最近想解决的一个具体问题/项目”，由系统推断后给出一句确认。
4. **时间与注意力驱动的学习模式** ⭐ Novelty: 3/5 | Impact: 4/5
   用前置 4 问模板采集“学习时间块/注意力阈值/内容形式偏好”，直接影响输出节奏（短卡片/长文/练习）。
5. **可回滚画像（Provenance-first Profile）** ⭐ Novelty: 3/5 | Impact: 4/5
   画像字段都带来源证据（用户原话/评估片段），支持“撤销某次推断”。

**Challenged Assumptions**:
- ~~用户必须明确知道自己目标类型~~ → 先让用户描述真实需求，系统推断并二次确认
- ~~经验自评能提高画像准确度~~ → 用行为/表达质量的评估信号替代主观自评
- ~~关键词命中就能代表掌握~~ → 强调解释结构、边界条件、反例与推理链

---

#### Pragmatic Perspective

**Implementation Approaches**:
1. **Init Flow Simplification** | Effort: 2/5 | Risk: 2/5
   去掉 Goal Type 强制、去掉经验自评；仅收集“基本信息 + 自述技能点 + 学习习惯/偏好”。
   - Quick win: 转化提升、减少卡点
   - Dependencies: Profile schema 调整、前端/对话脚本改动
2. **Pre-Context 固定 4 问模板 + 可扩展 follow-up** | Effort: 3/5 | Risk: 3/5
   每次 AskUserQuestion 固定 4 个问题，覆盖时间/专注/形式/约束；允许根据回答追加“澄清追问”但不破坏模板。
   - Quick win: 偏好信号稳定收集
   - Dependencies: 统一问题模板版本管理、会话状态存储
3. **技能联想与画像结构升级（asserted vs inferred）** | Effort: 4/5 | Risk: 3/5
   profile 中区分用户自述技能（asserted）与系统推断技能（inferred），并保存证据与置信度。
   - Quick win: 推荐/评估可用信息维度更丰富
   - Dependencies: inference 规则/模型、存储 schema、UI/对话的“确认/纠错”路径
4. **纯文本评估 + 动态难度 + 语义评分** | Effort: 5/5 | Risk: 4/5
   评估题不提供选项；用“语义相似度 + 知识点覆盖率 + 逻辑结构”计算置信度，动态跳级。
   - Quick win: 评估更真实
   - Dependencies: 评分 rubric、知识点集合来源、评估日志与可解释输出
5. **移除 KeywordDictionary.json 并迁移到更可维护机制** | Effort: 3/5 | Risk: 2/5
   删除静态字典；覆盖率可来自“主题-知识点 taxonomy（可配置）”或“embedding 检索出的知识点集合”。
   - Quick win: 降低维护成本
   - Dependencies: 替代方案落地、迁移脚本（如有历史数据）

**Technical Blockers**:
- 语义评分可解释性不足时，容易引发用户不信任
- 动态跳级误判会带来挫败感（需要保守策略与回退）
- inferred skills 的错误推断需要“低成本纠错/撤销”机制

---

#### Systematic Perspective

**Problem Decomposition**:
- A. Pre-Context（偏好与习惯采集）
  - A1 固定 4 问模板（版本化）
  - A2 回答解析与结构化落库
- B. Profile Initialization（画像初始化）
  - B1 最小必填字段
  - B2 asserted skills（用户自述）
  - B3 inferred skills（系统联想，带证据与置信度）
- C. Assessment（评估）
  - C1 纯文本题型库（解释/推导/对比/debug）
  - C2 动态难度控制（跳级/降级/回退）
  - C3 置信度计算（语义相似度 × 覆盖率 × 结构评分）
- D. Update & Lifecycle（更新与生命周期）
  - D1 create 阶段用户选择：立即深评 / 暂停等待
  - D2 learn:profile update 入口与节奏
- E. Maintenance（维护）
  - E1 移除 KeywordDictionary
  - E2 知识点 taxonomy/embedding 的替代机制

**Architectural Options**:
1. **State Machine Pipeline**
   - Pros: 流程清晰、易测试、易插拔节点
   - Cons: 状态机设计不当会僵化
   - Best for: 明确初始化/评估节点的产品流程
2. **Event-Sourced Profile Updates**
   - Pros: 所有推断可追溯、可回滚、可审计
   - Cons: 实现复杂度更高
   - Best for: 画像可信度与可解释性要求高的场景
3. **Tool-Orchestrated LLM Flow（Ask/Infer/Eval/Update）**
   - Pros: 迭代快、可按策略动态调整
   - Cons: 需要严格约束输出与日志
   - Best for: 需要快速试错的对话式产品

**Risk Matrix (Initial)**:
- High impact / High likelihood: 语义评分误判导致错误画像、用户信任下降
- High impact / Medium likelihood: inferred skills 过度推断引发推荐偏航
- Medium impact / High likelihood: 固定模板过长引发疲劳（需措辞与节奏优化）
- Medium impact / Medium likelihood: 删除静态字典后覆盖率实现不稳定

---

#### Perspective Synthesis

**Convergent Themes** (all perspectives agree):
- ✅ 降低初始化摩擦是第一优先级（删强制项）
- ✅ 结构化采集学习偏好能显著提升个性化效果
- ✅ asserted/inferred 分离 + provenance 能提升画像可用性与可信度
- ✅ 评估应从“可猜的选择题”转向“可解释的文本表达”
- ✅ KeywordDictionary 应退出主流程，改为更可维护的机制

**Conflicting Views** (need resolution):
- 🔄 inferred skills 的“联想强度”
  - Creative: 更大胆联想，给用户星图确认
  - Pragmatic: 先保守联想，减少纠错成本
  - Systematic: 强制 provenance + 回滚，允许更大胆但可控
- 🔄 覆盖率的知识点集合来源
  - Creative: embedding 动态召回
  - Pragmatic: 小而稳定的 taxonomy 配置
  - Systematic: taxonomy 为主、embedding 为辅（并记录版本）

**Unique Contributions**:
- 💡 [Creative] Shadow Assessment：减少考试感提升配合度
- 💡 [Pragmatic] 固定 4 问模板版本化：便于 A/B 与回归
- 💡 [Systematic] Event-sourcing：为画像可信度和回滚提供基础

---

### Round 3 - Deep Dive (Pre-Context 4Q Template) (2026-01-29T22:44:53+08:00)

#### User Direction
- 将 pre_context 固定 4 问模板打磨成“可直接落地”的最终文案与字段，并给出复用策略（减少重复提问但保证深度）。

#### Final Template (pre_context_v1.3)
1. 学习时间与节奏：你通常在什么时间段学习？一次大概能投入多长时间？（如果有：每周频率/最近截止日期也可以一起说；可答：同上/无变化/跳过）
2. 专注与打断处理：你一般能连续专注多久？最常见的打断是什么？当你被打断时，你希望我怎么帮你继续？（可答：同上/无变化/跳过）
3. 内容形式与学习方式偏好：对你最有效的学习方式是什么？请描述你希望我怎么输出。（可答：同上/无变化/跳过）
4. 讲解风格与约束（禁忌/偏好）：你希望我在讲解时遵循哪些规则？（可答：同上/无变化/跳过）
补充：pre_context 允许“快捷选项 + type something”并存（用于降摩擦但保留真实表达），并且本阶段只关注个人因素（习惯/偏好/注意力/反馈/巩固）；不包含“2-4 周可验证结果”；动机/推进（accountability）作为后续渐进字段。

#### Field Mapping (落库字段建议)
- raw：q1/q2/q3/q4 原文（必须保留，不可丢）
- parsed（非阻塞抽取）：study_time_windows、session_length、weekly_cadence、focus_duration、common_interruptions、resume_preference、output_format_preference、learning_mode_preference、teaching_style_rules、must_avoid、code_inclusion_preference、correction_strictness_preference
- provenance：template_version=pre_context_v1.3 + captured_at

#### Reuse Strategy (复用策略)
- 触发重问（AskUserQuestion）：首次缺失 / 关键字段为空 / 超过 30 天 / 用户表达 drift（“太长/太短/不符合习惯/时间变了”）/ 用户显式要求更新。
- 直接复用：30 天内且无 drift → 不打断、不重复问。
- 冷却：用户写“跳过”的问题，建议 7 天内不重复追问同一题（后续自然对话补齐）。

（细化文案、payload 可复制版本、解析规则与更多细节见 ideas/idea-pre-context-4q-template.md）

### Round 4 - Refinement (Options + Profile Additions) (2026-01-29T22:44:53+08:00)

#### User Direction
- pre_context 允许使用“快捷选项 + type something”。
- 进一步补齐：学习相关的个人简介画像还应包含哪些维度。

#### Updates
- pre_context 模板升级为 pre_context_v1.3（个人因素优先；选项用于降摩擦，自由输入用于补充真实细节；不包含 2-4 周可验证结果；accountability 不进入 4 问，后续渐进采集）。
- 学习画像补齐维度建议（仅个人因素、渐进采集、不增加初始化摩擦）：时间预算与节奏、专注/能量模式、学习方式与内容组织偏好、反馈/纠错偏好、巩固/复习偏好、先验知识地图、动机与表达偏好；accountability 后置（详见 ideas/idea-profile-learning-aspects.md）。

## Current Ideas

1. 初始化“最小必填” + 去强制 Goal Type + 去经验自评
2. Pre-Context 固定 4 问模板 pre_context_v1.3（固定 4 问 + 选项+自由输入 + 个人因素优先 + 可复用/可重问策略；不含 2-4 周结果与 accountability）
3. asserted skills + inferred skills（带证据/置信度/可回滚）
4. create 阶段可选：立即 learn:profile update 深评 / 暂停
5. 纯文本评估 + 动态难度 + 语义评分（相似度 × 覆盖率 × 结构）
6. 删除 KeywordDictionary.json，并落地替代机制

### Round 5 - Deep Dive (Profile Schema + State + Rollback) (2026-01-29T22:44:53+08:00)

#### User Direction
- 细化 profile schema（asserted/inferred/provenance）+ 状态流转 + 回滚策略。

#### Output
- 采用两层结构：`profile_snapshot`（快照）+ `profile_events`（append-only 事件）实现可审计与可回滚。
- skills 明确区分 asserted（用户自述）与 inferred（系统推断），并定义 inferred 的状态机：proposed/confirmed/rejected/superseded。
- 回滚先落地 MVP：写入 `ROLLBACK_TO_VERSION` 事件并后台重建 snapshot；不删除历史。
- 详见：`ideas/idea-profile-schema-state-machine.md`

### Round 6 - Deep Dive (Assessment Rubric + Adaptive + Regression Set) (2026-01-29T22:44:53+08:00)

#### User Direction
- 继续细化：纯文本评估 + 动态难度 + 置信度 的 rubric/跳级策略/回归集设计；要求其能写 events 并更新 inferred。

#### Output
- 定义 4-level 难度模型（L1-L4），并给出可执行 rubric（Correctness/Mechanism/Boundaries/Tradeoffs/Diagnostics/Structure）。
- 保守跳级阈值：一次最多升/降 1 级；支持用户“保级巩固”；给出 stop rule（2 连 promote/2 连 demote/题数上限）。\n
- 覆盖率依赖版本化 taxonomy：题目绑定 taxonomy_id + expected_subpoints，回答抽取 matched_subpoints 计算 coverage。\n
- 事件对齐 profile_events：新增 assessment_* 事件 + inferred skill proposed/updated（不自动 confirmed）。\n
- 回归集（JSONL）用于稳定性验证，并提供模板：`ideas/assessment-regression-set-template.jsonl`。\n
- 详见：`ideas/idea-assessment-text-only-adaptive-scoring.md`

### Round 7 - Deep Dive (Game Dev Topic: Taxonomy + Question Bank + Regression Cases) (2026-01-29T22:44:53+08:00)

#### User Direction
- 选定主题为“游戏开发”，先定义 topic + taxonomy(subpoints) 范围，并据此生成 L1-L4 最小题库、expected_subpoints 绑定与第一批回归样本。

#### Output
- taxonomy（16 subpoints，版本化）：`ideas/taxonomy-game-dev-core.json`
- 题库（12 题，覆盖 L1-L4，纯文本输入）：`ideas/assessment-question-bank-game-dev-core.json`
- 回归集（24 cases = 4 levels x 6）：`ideas/assessment-regression-set-game-dev-core.jsonl`

### Round 8 - Convergence (Productize: Generic Assessment Pack Generator) (2026-01-29T22:44:53+08:00)

#### User Direction
- 把评估体系产品化成通用流程：输入任意学习方向 -> 自动生成最小 taxonomy(subpoints) + 题型模板 + 最小回归集骨架（避免每个方向手工做）。

#### Output
- 通用流程：`ideas/idea-assessment-pack-generator.md`
- 文件模板：\n
  - `ideas/assessment-pack-template-taxonomy.json`\n
  - `ideas/assessment-pack-template-question-bank.json`\n
  - `ideas/assessment-pack-template-regression.jsonl`

### Round 9 - Validate (Topic Pack: cocos开发) (2026-01-29T22:44:53+08:00)

#### User Direction
- 尝试用通用流程生成 “cocos开发” 主题的评估包（taxonomy + 题库 + 回归集）。

#### Output
- taxonomy：`ideas/taxonomy-cocos-dev-core.json`
- 题库：`ideas/assessment-question-bank-cocos-dev-core.json`
- 回归集：`ideas/assessment-regression-set-cocos-dev-core.jsonl`

---

## Idea Graveyard

- （待定）“经验自评作为强信号”：已被更可靠的行为/表达评估信号替代

---

## Synthesis & Conclusions (2026-01-29T22:44:53+08:00)

### Executive Summary

本次 profile 优化的核心取舍是“先降摩擦，再提精度”。落地路径上，先通过删强制项 + pre_context_v1.3（仅个人因素、固定 4 问、支持“选项+type something”）稳定获取 plan 所需偏好信号；再用 profile snapshot + append-only events 建立 asserted/inferred/provenance 与可回滚能力；最后用“纯文本自适应评估 + taxonomy(subpoints) 覆盖率 + 回归集”把评估做成可解释、可迭代且不漂移的引擎，并产品化为可复用的 assessment pack generator（任意学习方向都可生成最小评估包）。

### Top Ideas (Final Ranking)

#### 1) Init Flow Simplification（删强制项） ⭐ Score: 9/10
**Description**: 初始化不强制 Goal Type，不要求经验自评；仅收集基本信息 + 自述技能点 + 学习习惯/偏好。
**Why This Idea**:
- ✅ 低风险、立刻降低流失
- ✅ 明确符合“取消强制约束”的产品方向
**Main Challenges**:
- ⚠️ 需要与既有 schema/文案/流程兼容
**Recommended Next Steps**:
1. 列出现有 create/init 流程中的强制字段与依赖
2. 定义最小必填字段（MVP）并更新对话/前端
3. 加埋点对比改动前后完成率

#### 2) Pre-Context 固定 4 问模板（版本化） ⭐ Score: 9/10
**Description**: pre_context_v1.3：在背景信息完整提供前，优先 AskUserQuestion 收集个人因素偏好；每次固定 4 问；允许“选项 + type something”；不包含“2-4 周可验证结果”；accountability 后置渐进；模板版本化。
**Why This Idea**:
- ✅ 采集维度稳定，个性化策略更可靠
- ✅ 适合回归与 A/B（模板版本化）
**Main Challenges**:
- ⚠️ 避免疲劳；抽取失败不应阻塞流程
**Recommended Next Steps**:
1. 实现 pre_context_v1.3 的 AskUserQuestion（固定 4 问）与落库字段（raw + parsed + provenance）
2. 实现“偏好摘要回显 + 用户纠错”（不改变原文证据，产生事件）
3. 落地复用/重问策略（30 天过期 + 跳过冷却 + drift 触发重问）

#### 3) Profile 结构升级（asserted vs inferred + provenance） ⭐ Score: 8/10
**Description**: 用 profile_snapshot + profile_events（append-only）实现 asserted/inferred/provenance + 可审计/可回滚；inferred 走 proposed/confirmed/rejected/superseded 状态机，confirmed 仅用户明确确认。
**Why This Idea**:
- ✅ 画像更可用且可信，可解释可回滚
**Main Challenges**:
- ⚠️ inference 误判的纠错入口设计；taxonomy/版本管理
**Recommended Next Steps**:
1. 实现 profile_snapshot schema + profile_events schema（append-only）与 fold/重建策略
2. 实现 inferred 的 proposed/confirmed/rejected/superseded + rollback_to_version
3. 打通“用户确认/否认”入口（把 inferred 从 proposed 推到 confirmed/rejected）

#### 4) 纯文本评估 + 动态难度 + 置信度评分 ⭐ Score: 7/10
**Description**: 评估题只允许自由文本输入；采用 4-level（L1-L4）难度模型 + 可执行 rubric（正确性/机制/边界/权衡/诊断/结构）+ 保守跳级策略；覆盖率基于版本化 taxonomy(subpoints)；写入 assessment_* events，并仅产出 inferred proposed/updated（不自动 confirmed）；通过回归集防漂移。
**Why This Idea**:
- ✅ 更真实区分水平；潜在减少评估轮次
**Main Challenges**:
- ⚠️ 评分可解释性；跳级误判挫败；需要回归集
**Recommended Next Steps**:
1. 将 assessment pack generator 接入：输入 topic -> 生成 taxonomy/题库/回归骨架（避免手工）
2. 接入评估运行时：按 L1-L4 调度题目、打分、跳级，并写入 assessment_* events
3. 为每个高频 topic 维护最小回归集（JSONL），用于阈值/抽取策略回归验证

#### 5) 删除 KeywordDictionary.json 并替代 ⭐ Score: 7/10
**Description**: 确认主流程不再依赖 KeywordDictionary；以版本化 taxonomy 为主、embedding 召回为辅替代。
**Why This Idea**:
- ✅ 降低维护成本，减少过时误判
**Main Challenges**:
- ⚠️ 替代机制需要回归验证
**Recommended Next Steps**:
1. 全局扫描对 KeywordDictionary 的读取依赖
2. 落地最小 taxonomy 并接入覆盖率计算
3. 删除文件并加回归测试防复活

### Primary Recommendation

> 按“删强制项 → pre_context_v1.3 → profile(snapshot+events) → 评估引擎（rubric+taxonomy+回归集）→ assessment pack generator + topic packs → 删除 KeywordDictionary 并用 taxonomy 替代”的顺序推进。

**Quick Start Path**:
1. 先把 create/init 流程的强制项删掉，并上线 pre_context_v1.3（raw+parsed+provenance）与复用策略
2. 上线 profile_snapshot + profile_events，并落地 inferred 状态机与 rollback_to_version
3. 接入评估运行时（写 events、只 propose inferred），并用回归集守住评分/跳级稳定性

---

## Session Statistics

- **Total Rounds**: 9
- **Ideas Generated**: 20+
- **Perspectives Used**: Creative, Pragmatic, Systematic
- **Artifacts**: brainstorm.md, perspectives.json, synthesis.json, plus taxonomy/question-bank/regression packs & templates under ideas/

---

## Implementation Plan (2026-01-29T22:44:53+08:00)

- 可执行落地计划：`implementation-plan.md`
- 结构化 backlog：`backlog.json`

---

### Round 10 - Status Check (brainstorm-to-cycle readiness) (2026-01-30T00:26:32+08:00)

#### Question
- 需要确认：讨论流程是否已经完成，是否可以进入 brainstorm-to-cycle 阶段？

#### Evidence (Artifacts Present)
- ✅ 已完成收敛并产出最终结论：见 `brainstorm.md` 的 “Synthesis & Conclusions”
- ✅ 已生成最终综合产物：`synthesis.json`（含 completed 时间戳）
- ✅ 已生成可执行计划：`implementation-plan.md`
- ✅ 已生成结构化工程 backlog：`backlog.json`（含 milestones/items/policies）

#### Decision
- 该 brainstorm 流程已完成；可以进入 brainstorm-to-cycle 阶段（并且本 session 已产出进入该阶段所需的核心工件）。

#### Next Actions (Cycle Entry)
1. 从 `backlog.json` 的 Milestone A（P0）开始落地（pre_context_v1.3）
2. 将 Milestone A 的 items 拆为可执行 issue/任务（含验收与埋点），进入开发迭代循环

---

### Round 11 - Brainstorm-to-Cycle Output (P0 + Milestone B) (2026-01-30T00:43:38+08:00)

#### Cycle Artifacts Generated
- ✅ Cycle 1（P0：删强制项 + pre_context_v1.3）：`cycle-task.md` + `cycle-issues-p0.md`
- ✅ Cycle 2（Milestone B：profile snapshot+events+rollback）：`cycle-task-milestone-b.md` + `cycle-issues-milestone-b.md`

#### parallel-dev-cycle Runs (Artifacts Only)
- ✅ Cycle 1 ID: `cycle-v1-20260130T010750-p0-aicdpz`（产物目录：`.workflow/.cycle/cycle-v1-20260130T010750-p0-aicdpz.progress/`）
- ✅ Cycle 2 ID: `cycle-v1-20260130T010751-b-fwxlcr`（产物目录：`.workflow/.cycle/cycle-v1-20260130T010751-b-fwxlcr.progress/`）

---

### Round 12 - Execution Feedback Triage (2026-01-31T17:46:08+08:00)

#### New Issues (来自真实执行反馈)
1. 在进行背景描述后突然出现 `Confirm your familiarity with typescript`，用户感知很突兀
2. 具体提问和选项预期改成中文（当前中英混杂）
3. 执行过程中出现 `--profile-id p-e2e-001` 不符合预期（疑似测试/样例数据污染）
4. `create` 状态下默认应该是 `--full-assessment`
5. 背景解析不应仅依赖用户粘贴的文本；预期通过 Agent 联想拓宽技术栈（并给出可解释的推断）
6. 完整评估下存在一个 “Add Topic” 流程很突兀；预期基于“背景解析 + Agent 联想”直接添加 topic（或直接生成 topic 列表），不应逼用户手工录入
7. 当前完整评估某一个 topic 的流程缺失（需要排查为何缺失/被移除）
8. 需要确认：是否是 `.claude/commands/learn/profile.md` 的更新导致相关功能失效或体验退化

#### Evidence (代码级定位)
- 背景解析后的“确认熟悉度”问题来自：`.claude/commands/learn/profile.md` 中 inferred skills 的确认环节（`question: Confirm your familiarity with ${topic_id}`）
- “Add Topic” 手工录入循环来自：`.claude/commands/learn/profile.md` 的 `collectKnownTopicsMinimal()`（header: `Add Topic`）
- `/learn:plan` 中明确记录：JIT Assessment 为避免打断流程已从 `/learn:plan` 移除（这解释了“完整评估某个 topic 流程缺失”的一部分）

#### Diverge (可选方案发散)
**A. 只修体验（最小改动，立刻止痛）**
- 把所有 AskUserQuestion 的 `header/question/label/description` 全面中文化（保留 value 作为稳定 key）
- “背景解析 -> 确认”前加一段过渡解释（告诉用户：这是系统根据背景推断的候选技能，用于个性化学习）
- 对 inferredSkills 做降噪与节流：只展示 Top-N（按 confidence/proficiency），并提供 “全部跳过/稍后再说”

**B. 纠正默认行为（符合最新需求）**
- `create` 默认走 full assessment；新增 `--minimal`（或保留 `--no-assessment`）以显式走轻量模式
- `select`/`show` 时过滤 `p-e2e-*` 等测试 profile，或把 e2e fixture 从 `.workflow/learn/profiles/` 移出到测试目录

**C. 背景解析升级（从“文本->字典”到“文本+联想”）**
- Pipeline：`用户背景文本` → `deterministic parse`（可保留）→ `Agent 扩展联想`（生成邻接技术栈/生态）→ `topic proposals`
- 输出必须带 provenance：每个 topic 说明“为什么推断”（从背景证据/生态联想/目标推断）
- 默认不强制逐条确认：先直接写入 inferred=proposed（低置信度），只对 Top-3 做确认，剩余提供“批量编辑/纠错”入口

**D. 恢复/重建“完整评估某 topic”的闭环**
- 选项 1：把评估前置到 `/learn:profile create --full-assessment`（新建评估子流程，按 topic pack 逐题）
- 选项 2：保持 `/learn:plan` 纯规划；将评估作为 `/learn:execute` 的按需 preflight（每个知识点开始前触发）
- 选项 3：新增独立命令 `/learn:assess [topic]`（可反复调用，产出 events + snapshot fold）

#### Converge (当前更推荐的收敛路径 - Draft)
1. 先做 A + B（语言统一 + 过渡文案 + 默认行为 + 排除 e2e 污染）保证用户可用、体验不突兀
2. 再做 C（Agent 联想 + provenance + 低打扰确认策略）替换/弱化手工 Add Topic
3. 同时明确 D 的产品落点（更偏向 `/learn:execute` preflight，避免 `/learn:plan` 被评估打断）

#### Open Questions（需要你确认的产品选择）
1. “create 默认 full assessment”是否意味着：必须立刻评估（题目/任务）还是仅仅“收集更多背景 + 自动扩展 topics + 标记为 is_minimal=false”？
2. 对 `p-e2e-001` 的要求：是“永远不应出现在交互选择里”，还是“允许存在但必须隐藏/标记为测试”？
3. “Add Topic”是否要完全移除（仅保留一个“缺少哪些？一次性补充”问题），还是保留为高级入口（隐藏在 update）？

---

### Round 13 - Product Decisions Locked + Current Flow Audit Request (2026-01-31T17:54:13+08:00)

#### Decisions（你已确认）
1. `create` 默认 `--full-assessment`：包含两部分
   - “更完整采集 + topic 自动扩展 + is_minimal=false / metadata”
   - “必须进入题目评估”（存在真正的 assessment 闭环）
2. `p-e2e-*`：永远隐藏/隔离（不应进入真实交互选择，也不应污染 active_profile_id）
3. “Add Topic”：完全移除
   - topics 仅由 “用户描述 + Agent 联想拓展”生成
   - 仍需要 AskUserQuestion 做最终确认/纠错（但不再手工逐条录入）

#### Request
- 需要输出“当前 learn:profile 的执行流程图”（非 mermaid），用于对比差异并指导落地改造。

---

### Round 14 - Desired Flow Spec (Post-Audit) (2026-01-31T18:38:11+08:00)

#### New Requirements（基于现流程继续分析后的结论）
1. 去除 `--no-assessment`；只保留 `--full-assessment`，且默认 true
2. backgroundText 非空：除 deterministic 解析外，必须做“拓展关联”，并通过 AskUserQuestion Loop 确保 topics 覆盖用户预期技能点
3. pre_context 不应只剩固定 4 问；需要恢复/扩展为“学习相关但与目标无关因素”的完整概述（仍需版本化与可跳过）
4. 手工 Add Topic 流程可去除；由“拓展关联 + AskUserQuestion Loop 确认”替代
5. 解释现状：full-assessment 目前仅影响 metadata，之后的流程基本是写 profile + 写事件 + 设置 active_profile
6. 补回“对某个 topic 的能力衡量”闭环：题库/评估包生成 + 纯文本作答 + rubric 评分 + 写入事件/快照
7. 每完成一个 topic 评估：AskUserQuestion 让学生继续评估另一个 topic 或结束并记录
8. 可考虑去除 selectFlow（暂时无意义）
9. 需要基于以上要求重画一个新流程图，验证是否符合预期

---

### Round 15 - Flow Approved, What Still Needs Discussion? (2026-01-31T18:43:31+08:00)

#### Status
- ✅ 你已确认：Round 14 的新流程图整体符合预期（full-assessment 默认 true + topic-level 评估闭环 + 背景联想确认 loop + 移除 Add Topic + 隔离 p-e2e-* + 可去除 selectFlow）

#### Multi-Perspective Explore（快速扫描“还需要讨论/定稿”的点）

**Creative（体验/交互）**
- “Topic 覆盖校验 loop”的交互形态：展示 Top-N + “为什么推断”，并提供「缺什么/不对/够了」三种动作，避免用户被迫逐条点确认。
- 评估循环的“疲劳管理”：每个 topic 评估后给出简短结论（你在什么水平、下一步建议、证据引用），再问要不要继续评估下一个。
- pre_context vNext 的“渐进策略”：初次只问关键 6-8 个，其余在后续 update/execute 中按需补齐。

**Pragmatic（可落地/工程）**
- `--full-assessment` 默认 true 会显著增加 create 的时长，需要明确“最少评估多少个 topic/多少题”才能算完成（completion_percent 的定义要改为“评估闭环完成度”而不是固定 100）。
- Agent 联想输出必须被 schema 约束（topic_id/label/reason/confidence/provenance），并有最大循环次数/兜底策略（避免无限 loop 或联想发散）。
- `p-e2e-*` 隔离策略要定：是从数据目录迁移 fixture，还是在 `list-profiles`/state 写入处强制过滤（最好两层都做）。

**Systematic（架构/一致性）**
- topic_id 体系需要明确：是否采用 taxonomy 作为唯一来源？如何把“自然语言补充”映射到稳定 topic_id（含别名/同义词/normalize 规则）？
- 评估事件模型需要定稿：assessment pack version、题目 id、rubric version、score breakdown、evidence snippet（可解释性）如何落到 events/snapshot。
- 评估闭环的落点：是内置在 `/learn:profile create/update`，还是抽成 `/learn:assess` 命令由 profile 调用（更利于复用与测试）。

#### Converge（我建议优先讨论/拍板的 8 个问题）
1. full-assessment 默认 true：create 时默认评估几个 topic？每个 topic 默认几题/几轮？
2. Topic 覆盖校验 loop：用户的“补充缺失技能点”是输入 topic_id，还是允许自然语言描述并由 Agent 映射？
3. topic_id 来源：taxonomy 是否必须先存在？不存在时是动态生成还是拒绝？
4. assessment pack 生成：是运行时生成（慢但灵活）还是预生成（快但需要维护）？缓存策略是什么？
5. 评估结果写入：写到 `known_topics`（asserted）还是只写 inferred events/snapshot（proposed/confirmed）？
6. pre_context vNext：问题集的范围与数量；哪些必问、哪些可跳过；复用/重问策略（30 天、drift 等）。
7. p-e2e-* 隔离：除了 UI 隐藏，是否也要禁止 state 写入为 active_profile_id（硬保护）？
8. selectFlow：是彻底移除，还是保留为隐藏命令（例如仅 dev 使用）以支持多 profile 测试？

---

### Round 16 - Deep Dive: Full-Assessment 默认评估范围/完成条件 (2026-01-31T18:49:09+08:00)

#### Goal
- 让 full-assessment（默认 true）既能“补齐能力衡量闭环”，又不会把 create/update 拖到不可用（必须支持用户随时结束并保留已完成进度）。

#### Proposal (Draft Defaults)
**默认评估范围**
1. 默认评估 topic 数：`2` 个
   - topic #1：系统判定的“最关键/最高收益”topic（来自 背景+目标+联想 的 Top-1）
   - topic #2：系统判定的“相邻关键”topic（Top-2），或由用户在 topic 选择页主动指定
2. 每个 topic 默认题目数：`3` 题（纯文本）
   - L1 基础机制/概念：1 题
   - L2 实操/代码思路：1 题
   - L3 边界/诊断/权衡：1 题

**停止条件（每 topic）**
- 达到以下任一条件即停止该 topic 评估：
  1) 用户选择“结束该 topic”
  2) 已完成默认 3 题
  3) 连续 2 题置信度很低（避免挫败），并提示“建议先从基础学习开始”

**全局停止条件（full-assessment 结束）**
- 结束条件任一成立即退出评估循环：
  1) 已评估完默认 2 个 topic
  2) 用户选择“结束评估并保存”

**完成度 (completion_percent) 计算建议**
- 不再固定 100；改为：
  - `topics_assessed / topics_planned`（planned=默认2 或用户确认的目标列表）× 100
  - 并额外记录：per-topic answered_count / max_questions

#### UX Gate（你之前提到的关键点）
- 每个 topic 评估结束必须 AskUserQuestion：
  - “继续评估下一个 topic”
  - “结束并保存（可稍后 update 再继续）”

#### Open Questions（需要你确认的默认值）
1) 默认评估 topic 数是 `1/2/3` 哪个更符合你的使用场景？
2) 每 topic 默认题目数是 `2/3/4` 哪个更合适？
3) 是否允许“预计耗时”提示（例如：每 topic 3 题，约 5-10 分钟）？

---

### Round 17 - Decision: 默认一次只评估一个 Topic + 评估集驱动 (2026-01-31T18:52:52+08:00)

#### Decision
- full-assessment 默认：一次只评估 `1` 个 topic
- 评估如何做：由该 topic 对应的“评估集（assessment pack：taxonomy + question bank + rubric + regression skeleton）”来决定题数/难度/覆盖点，而不是用固定 2/3/4 题的硬编码
- 评估完成：必须立即写入并记录（events + snapshot fold + progress）
- 结束后：AskUserQuestion 询问是否继续评估下一个 topic，或结束并保存

#### Notes（与已有工件对齐）
- 已存在评估集相关模板/样例（用于落地该决策）：
  - `ideas/idea-assessment-pack-generator.md`
  - `ideas/assessment-pack-template-taxonomy.json`
  - `ideas/assessment-pack-template-question-bank.json`
  - `ideas/assessment-pack-template-regression.jsonl`
  - `ideas/taxonomy-game-dev-core.json` / `ideas/taxonomy-cocos-dev-core.json` 等

---

### Round 18 - Topic ID 体系：taxonomy 是否唯一来源？别名/版本策略 (2026-01-31T18:52:52+08:00)

#### Problem
- 评估闭环依赖 “稳定的 topic_id + 稳定的 subpoints + 可回归的题库/评分规则”。
- 当前实现里存在 `normalizeInferredTopicId()`（把任意字符串变成 a-z0-9_-），会导致：
  - topic_id 可能随 LLM 输出漂移（ts/typescript/TypeScript 等）
  - 历史评估不可比（topic id 变化、subpoints 不可追踪）
  - regression set 无法稳定绑定

#### Options
**Option A（推荐）：taxonomy 是唯一 source of truth**
- 任何进入“评估/事件/快照”的 topic_id 必须存在于 taxonomy index（否则不能评估、不能写入 canonical topic_id）。
- Agent/用户输入可以是自然语言，但必须先 resolve 到 canonical topic_id（或进入“创建新 topic”流程）。

**Option B：允许动态 topic_id（不推荐）**
- 运行时直接 normalize 生成新 topic_id 并落库，后续再慢慢治理。
- 风险：topic 漂移 + 历史不可比 + 回归集失效（与“评估闭环可迭代”目标冲突）。

#### Proposed Design (based on Option A)
1) **Taxonomy Index（全局注册表）**
- 维护一个 index，列出所有合法 topic：
  - topic_id（canonical，snake_case）
  - name（展示名，可中文/英文）
  - aliases（同义词/别名，含中英缩写，如 ts/typescript/TypeScript）
  - status: active/deprecated + redirect_to（支持重命名/合并）
  - taxonomy_version（该 topic 的 subpoints 版本）

2) **Alias Resolution（输入→canonical topic_id）**
- 输入（用户/Agent）永远以“raw_label/raw_text”进入
- 解析器：
  - normalize（小写、去符号、空白折叠）
  - alias match（exact/normalized match）
  - deprecated redirect（保证历史兼容）
- 解析成功：得到 canonical topic_id
- 解析失败：进入 AskUserQuestion：
  - “系统没找到该 topic：你想（创建新 topic）/（映射到已有 topic）/（忽略）？”

3) **Versioning（保证评估可回归）**
- taxonomy_version：当 subpoints 变化时 bump（例：tax_v0.1 → tax_v0.2）
- assessment pack 在运行时必须携带：
  - topic_id + taxonomy_version + rubric_version + question_bank_version
- 评估事件必须记录这些版本号（避免未来变更导致不可比）

#### Open Questions（需要你拍板）
1) 我们是否锁定 Option A：taxonomy 为唯一 source of truth？（我建议锁定）
2) taxonomy index 的“展示名”是否需要同时支持中文 + 英文？
3) 当用户补充一个“系统不存在”的 topic 时：是否允许走“自动生成 pack + 立刻评估”，还是必须先人工确认再生成？

---

### Round 19 - Recommendation: Taxonomy-First + Provisional Topic Creation (2026-01-31T19:43:31+08:00)

#### Recommendation（我建议采用）
1) **锁定 Option A**：taxonomy 是进入评估/事件/快照的唯一 canonical 来源（保证可回归、可比较）
2) **展示名双语**：`topic_id` 保持稳定英文 snake_case；`name` 支持中文+英文（aliases 也支持中英缩写）
3) **允许“用户确认后自动创建新 topic 并立刻评估”**，但要以“provisional（临时）”方式写入 taxonomy index（仍然满足 taxonomy-first）
   - 生成 assessment pack 时记录：topic_id + taxonomy_version + rubric_version + question_bank_version
   - 后续若发现重复/合并：用 deprecated + redirect_to_topic_id 保持历史兼容

#### Why（简短理由）
- 评估闭环必须依赖稳定的 topic_id/taxonomy_version，否则 regression 与历史分数不可比；
- 允许 provisional creation 能兼顾“用户补充技能点时的即时评估需求”与“长期治理”。

---

### Round 20 - Assessment Pack 生成策略：运行时 vs 预生成 + 缓存/存储 (2026-01-31T19:44:37+08:00)

#### Goal
- 在 full-assessment 默认流程里，“评估某个 topic”必须快速稳定、可回归（版本可追踪），同时支持用户补充的新 topic 也能立刻进入评估。

#### Options
**Option A：全部预生成（pre-generate only）**
- 优点：稳定、快、易回归；生成过程可人工 review
- 缺点：覆盖慢；新 topic 会阻塞（必须先生成再评估）

**Option B：全部运行时生成（runtime only）**
- 优点：覆盖快；新 topic 立即可评估
- 缺点：慢且不稳定；容易漂移；对回归/一致性要求高（必须强约束 schema + 回归集）

**Option C（推荐）：混合策略（pre-generate hot topics + runtime for provisional）**
- hot topics（常见/核心）走预生成，保证体验与稳定
- provisional/new topics 允许运行时生成，但必须立刻“固化为 pack + 版本号 + 回归骨架”，后续可治理/合并

#### Recommendation (Option C)
1) **Pack 是“topic 级”可复用资产**（不含用户信息）
2) **pack 生成完成后必须落盘缓存**，后续评估只做“挑题 + 评分”，不再重复生成
3) **版本键驱动缓存失效**：topic_id + taxonomy_version + rubric_version + question_bank_version (+ language)

#### Cache Key（建议）
- `pack_key = { topic_id, taxonomy_version, rubric_version, question_bank_version, language }`
- 注意：不要把 user/profile_id 放进 key（否则无法复用）；也不要把 goal 文本直接放 key（会爆炸）

#### Storage Location（建议）
- 统一放到 learn 的工作区，而不是 profile 文件里：
  - `.workflow/learn/packs/{topic_id}/`
    - `manifest.json`（记录上述版本键、生成时间、来源：pre/runtime、状态：active/provisional/deprecated/redirect）
    - `taxonomy-{taxonomy_version}.json`
    - `question-bank-{question_bank_version}.json`
    - `regression-{question_bank_version}.jsonl`（最小回归骨架，可逐步扩充）

#### Open Questions（需要你确认）
1) language 是否要进入 pack_key？（我建议进入，否则中英题库会混）
2) provisional topic 的 pack：是否允许“先生成最小包（3题）”以保证速度，然后后台/后续再补全？
3) question_bank_version 与 taxonomy_version 的关系：是否允许 taxonomy 变更但题库版本不变（一般不建议，容易不一致）？

---

### Round 21 - Decisions Locked: Pack Key + Provisional Minimal Pack + Version Binding (2026-01-31T19:47:15+08:00)

#### Decisions
1) `language` 进入 `pack_key`
2) provisional topic 允许“先生成最小包（例如 3 题）”保证速度，后续可补全/升级
3) `question_bank_version` 与 `taxonomy_version` **强绑定**

#### Implications
- pack_key 形式固定为：
  - `{ topic_id, taxonomy_version, rubric_version, question_bank_version, language }`
- taxonomy 变更必须 bump question bank（否则拒绝复用旧题库）
- provisional pack 的升级策略：
  - `status: provisional` → `status: active`（review/补全后）
  - 或者 `deprecated + redirect_to_topic_id`（若合并/更名）

---

### Round 22 - Assessment 结果落库策略：asserted vs inferred + 是否二次确认 (2026-01-31T19:48:53+08:00)

#### Context
- 我们已锁定：full-assessment 默认 true，且一次只评估一个 topic；评估完成后要“立即记录”，然后 AskUserQuestion 问是否评估下一个。

#### Key Question
- 评估结果应该写到 `known_topics`（asserted）还是写到 inferred skills（events/snapshot）？
- 是否需要用户二次确认，把 inferred 从 proposed → confirmed？

#### Recommendation（我建议）
1) **评估结果默认写入 inferred（而不是 asserted）**
   - asserted（`known_topics`）只存“用户自述/明确声明会”的能力
   - assessment 得出的水平属于系统判断，应该进入 inferred，并带上证据与版本号（rubric/taxonomy/question bank）
2) **不自动 confirmed；默认 proposed，但提供“轻量确认”入口**
   - 评估结束输出结论后，用一次 AskUserQuestion 让用户选择：
     - “准确 ✅（确认）” -> proposed → confirmed
     - “不准确 ❌（否认）” -> proposed → rejected（记录原因）
     - “需要调整 🛠（纠正）” -> 进入纠正（例如让用户选择更接近的等级/补充证据），再写 superseded/updated
   - 若用户跳过确认，则保持 proposed（仍然已记录，不阻塞继续评估下一个 topic）

#### Why（原因）
- 避免“系统判定”污染 asserted；保持画像可信与可解释
- 通过可选确认提升信任与纠错效率，同时不增加太多流程摩擦

#### Open Questions（需要你确认的交互强度）
1) “轻量确认”是否作为评估结束的必问（但允许选择“跳过/稍后”）？
2) confirmed 的含义：是否要求用户明确点“准确”才算 confirmed（我建议是）？

---

### Round 23 - Decisions Locked: Post-Assessment Confirmation (2026-01-31T19:51:52+08:00)

#### Decisions
1) “轻量确认”作为每个 topic 评估结束的必问，但必须提供“跳过/稍后再说”
2) `confirmed` 必须用户明确点“准确/确认”才进入 confirmed；否则保持 `proposed`

---

### Round 24 - 评估闭环落点：内置 profile 还是抽成 /learn:assess？(2026-01-31T19:53:49+08:00)

#### Problem
- 我们已经把 full-assessment 做成默认路径，并且一次只评估 1 个 topic；这意味着“评估闭环”会被 create/update 频繁调用。
- 需要决定评估闭环的“命令落点”，否则实现会散落在 profile.md、未来也很难复用到 execute/preflight。

#### Option A：内置在 `/learn:profile create|update`（不新增命令）
**Pros**
- 用户体验最直：create/update 里直接进入评估，不需要额外命令心智
- 实现初期改动范围更集中（只动 profile.md）
**Cons**
- 评估逻辑会把 profile.md 变成“巨型脚本”，可测试性差、演进风险大
- 未来想在 `/learn:execute` 做按需评估（preflight）时，很可能复制/分叉逻辑

#### Option B（推荐）：抽成可复用 `/learn:assess`，profile 只做编排
**Pros**
- 评估成为稳定能力：profile/create/update、execute/preflight 都能复用同一套闭环
- 更容易做回归测试（输入 pack + answers -> 输出 events/snapshot 更新）
- 清晰的边界：profile 负责“收集背景/确定 topics/状态切换”，assess 负责“对某 topic 评估并落库”
**Cons**
- 命令面增多；需要设计参数/状态（profile-id、topic-id、resume、language）
- 需要处理“交互式模式”（AskUserQuestion）与“非交互模式”（json/脚本）的一致性

#### Hybrid 方案（实际落地建议）
- 对用户仍然表现为：`/learn:profile create|update` 内完成评估
- 但实现上：profile 内部调用 `/learn:assess`（或 ccw CLI 的 assess 子命令），让 assess 成为可复用单元

#### Contract（/learn:assess 的最小输入输出草案）
**Input**
- profile_id
- topic_id（canonical）
- pack_key（topic_id + taxonomy_version + rubric_version + question_bank_version + language）
- mode: interactive (AskUserQuestion) / batch (answers JSON)
**Output**
- assessment events appended（含版本号、score breakdown、evidence）
- inferred skill status updated: proposed (default) + optional confirm prompt handled by caller
- returns summary: level/score/confidence + next recommendation

#### Question
- 你是否同意锁定 Option B：抽成 `/learn:assess`，由 profile/create/update 调用实现“看起来内置”的体验？

---

### Round 25 - Decision Locked: Add /learn:assess (Internal Only) (2026-01-31T19:56:26+08:00)

#### Decision
- ✅ 新增 `/learn:assess`
- ✅ 仅供 `/learn:profile` 内部调用（对用户不暴露为主要入口；用户只使用 profile 的 create/update 流程）

#### Implications
- `/learn:profile` 负责：背景收集/联想/确认 loop、topic 选择、评估后轻量确认、继续下一个 topic 或结束
- `/learn:assess` 负责：加载/生成 assessment pack、发起纯文本题目问答、rubric 评分、写入 assessment_* events + snapshot fold 所需数据

---

### Round 26 - Consolidated Flow Diagram (Post-Discussion) (2026-01-31T19:58:50+08:00)

> 说明：这是当前所有已锁定决策合并后的最新 learn:profile 流程图（非 mermaid）。

```text
/learn:profile <op> [profile-id?] [--goal="..."] [--full-assessment]
  |
  +--> Flags (locked)
  |     - remove: --no-assessment
  |     - full_assessment default: true (create/update 走评估闭环)
  |
  +--> switch(op)
        |
        +--> create
        |     |
        |     +--> Determine profile_id
        |     |     - default: profile-${Date.now()}
        |     |
        |     +--> AskUserQuestion: 背景输入（可选）
        |     |     - 支持 Skip
        |     |
        |     +--> If background provided:
        |     |     |
        |     |     +--> Deterministic parse background
        |     |     |     - ccw learn:parse-background --text "<...>" --json
        |     |     |
        |     |     +--> Agent expand (拓展关联/生态联想)
        |     |     |     - 产出 proposed topics（raw + reason + confidence + provenance）
        |     |     |
        |     |     +--> Topic resolution (taxonomy-first)
        |     |     |     - raw/alias -> canonical topic_id (taxonomy index + aliases + redirect)
        |     |     |     - unresolved -> AskUserQuestion: 创建新 topic / 映射已有 / 忽略
        |     |     |
        |     |     +--> AskUserQuestion LOOP: topic 覆盖校验
        |     |           - 展示 Top-N topics + 为什么推断
        |     |           - 用户：缺什么/不对/够了（可补充自然语言）
        |     |           - Agent：把补充映射为 canonical topic_id
        |     |           - loop guardrails（最大轮次 + 可跳过）
        |     |
        |     +--> AskUserQuestion: pre_context_vNext（学习相关但与目标无关因素，版本化，可跳过/稍后补）
        |     |
        |     +--> Persist profile (schema validated)
        |     |     - write profile.json
        |     |     - append PRECONTEXT_CAPTURED, FIELD_SET (best-effort)
        |     |     - update state.active_profile_id
        |     |
        |     +--> Persist topics as inferred skills (default)
        |     |     - propose inferred skill events (actor=agent)
        |     |     - do NOT force per-topic confirm here (avoid突兀)
        |     |
        |     +--> Full-Assessment Loop (default, one topic per cycle)
        |           |
        |           +--> Select next topic to assess (default Top-1, user can change)
        |           |
        |           +--> Ensure assessment pack (hybrid cache)
        |           |     - hot topics: pre-generated pack
        |           |     - provisional topic: runtime minimal pack (3 questions) then can be expanded
        |           |     - pack_key = {topic_id, taxonomy_version, rubric_version, question_bank_version, language}
        |           |     - question_bank_version strongly bound to taxonomy_version
        |           |     - store: .workflow/learn/packs/{topic_id}/...
        |           |
        |           +--> Internal call: /learn:assess (internal_only)
        |           |     - interactive text Q&A
        |           |     - rubric scoring
        |           |     - write assessment_* events (+ versions + evidence)
        |           |     - update inferred skill snapshot as proposed (default)
        |           |
        |           +--> AskUserQuestion (mandatory): 评估结论轻量确认
        |           |     - ✅ 准确（确认） => proposed -> confirmed
        |           |     - ❌ 不准确（否认） => proposed -> rejected (reason)
        |           |     - 🛠 需要调整（纠正） => superseded/updated
        |           |     - ⏭ 跳过/稍后 => keep proposed
        |           |
        |           +--> AskUserQuestion: 继续评估下一个 topic / 结束并保存
        |                 - 若继续 => 回到 “Select next topic to assess”
        |
        +--> update
        |     |
        |     +--> Resolve profile_id (arg or state.active_profile_id)
        |     +--> Read profile + snapshot
        |     |
        |     +--> AskUserQuestion: 本次 update 做什么？
        |           - 补充/修正背景（走 parse+expand+coverage loop，写 inferred events）
        |           - 更新 pre_context_vNext（写 FIELD_SET events）
        |           - 基于目标继续做 topic 能力评估（进入 Full-Assessment Loop）
        |           - show
        |
        |     +--> Persist updated profile (schema validated)
        |
        +--> show
              |
              +--> Read profile + snapshot
              +--> Output:
                    - pre_context + learning preferences
                    - inferred skills: proposed/confirmed/rejected + last assessed versions
                    - assessed topics summary (score/confidence/provenance)

Notes:
- 手工 Add Topic 已移除：topics 只来自“背景/目标/联想 + 用户确认 loop”
- p-e2e-* 永远隔离/隐藏（不进入真实交互，不污染 active_profile_id）
- selectFlow 可移除/不作为用户入口
```

---

### Round 27 - Flow Adjustments (User Feedback Applied) (2026-01-31T20:12:58+08:00)

#### Decisions / Corrections (Locked)
1) “topic 覆盖校验 loop”需要提供：推荐 topic 列表（含简短解释）+ 支持 `type something` 补充缺失技能点
2) `/learn:assess` 结束后不需要“轻量确认”（不做 proposed->confirmed 的交互确认）；评估必须在算法/题库层面保证足够准确
3) update 不做背景联想：
   - 因为 update 有明确目标（goal），应基于 goal 决定是否需要评估
   - 若目标相关 topic 已评估过（在当前版本体系中），则提示无需再评估并退出
4) “Persist profile” 与 “Persist inferred topics”在流程图层面合并为一个“保存结果”步骤（实现上可能仍通过 profile + events 存储，但对流程展示合并）
5) Full-Assessment Loop 需要升级为“评估题目/评分/自适应”的循环：完整生成 assessment pack（非最小包），并采用类似二分的方式做能力晋升/回退直到收敛

#### Updated Consolidated Flow Diagram (v2)

```text
/learn:profile <op> [profile-id?] [--goal="..."] [--full-assessment]
  |
  +--> Flags (locked)
  |     - remove: --no-assessment
  |     - full_assessment default: true
  |
  +--> switch(op)
        |
        +--> create
        |     |
        |     +--> Determine profile_id
        |     |
        |     +--> AskUserQuestion: 背景输入（可选）
        |     |     - 支持 Skip
        |     |
        |     +--> If background provided:
        |     |     |
        |     |     +--> parse + expand + resolve topics (taxonomy-first)
        |     |     |
        |     |     +--> AskUserQuestion LOOP: topic 覆盖校验（推荐列表 + type something）
        |     |           - 展示：推荐 topics（Top-N）+ 每个 topic 的“为什么”（来自背景/目标/联想）
        |     |           - 用户动作：
        |     |               A) 直接选择要评估的 topic（单选/多选）
        |     |               B) type something：补充缺失技能点（自然语言）
        |     |               C) 够了/跳过
        |     |           - Agent：把补充映射为 canonical topic_id，并更新推荐列表
        |     |
        |     +--> AskUserQuestion: pre_context_vNext（学习相关但与目标无关因素，版本化，可跳过/稍后补）
        |     |
        |     +--> Save results (conceptual merge)
        |     |     - profile + events：保存 pre_context、topics(proposed)、state.active_profile_id 等
        |     |
        |     +--> Full-Assessment Loop (default, one topic per loop)
        |           |
        |           +--> Pick topic to assess
        |           |     - 默认：覆盖校验 loop 中用户选中的 topic；否则 Top-1
        |           |
        |           +--> Ensure assessment pack (FULL pack, versioned + cached)
        |           |     - pack_key = {topic_id, taxonomy_version, rubric_version, question_bank_version, language}
        |           |     - strong binding: question_bank_version <-> taxonomy_version
        |           |     - provisional topic: 允许从最小包起步，但必须可升级为完整包（你已要求“完整生成”）
        |           |
        |           +--> Internal call: /learn:assess (internal_only)
        |           |     - Q&A Loop（纯文本）
        |           |     - Scoring Loop（rubric + coverage + confidence）
        |           |     - Adaptive Loop（能力晋升/回退，类似二分直到收敛）
        |           |     - Persist assessment_* events (+ versions + evidence)
        |           |
        |           +--> AskUserQuestion: 继续评估下一个 topic / 结束并保存
        |                 - 继续 => 回到 “Pick topic to assess”
        |
        +--> update
        |     |
        |     +--> Resolve profile_id + Read profile/snapshot
        |     |
        |     +--> Determine target topics by goal (goal -> topics via taxonomy/aliases)
        |     |
        |     +--> If already assessed under current pack_key/version:
        |     |     - print: 已完成评估，无需重复
        |     |     - exit
        |     |
        |     +--> Else:
        |           - directly enter Full-Assessment Loop (same as create)
        |
        +--> show
              |
              +--> Read profile + snapshot
              +--> Output:
                    - topics + latest assessment summary per topic (with pack versions)
                    - indicate whether goal-topics are assessed
```

---

### Round 28 - Decisions Locked + Remaining Confirmations (2026-01-31T20:19:03+08:00)

#### Locked (new)
1) topic 覆盖校验 loop 的“接下来评估哪个 topic”：**单选**
2) 评估结论不做轻量确认；且不引入 “assessment_confirmed” 新状态：
   - 采用 **B**：status 仍可保持 `proposed/confirmed/rejected`（或仅 `proposed`），但 UI/逻辑以“assessment events 的最新结果”为权威来源

#### Remaining Confirmations（还需要你拍板/确认的点）
1) **pre_context_vNext 的问题清单**：必问哪些？可跳过哪些？是否分两段（create 轻量、update/execute 补全）？
2) **taxonomy index 的落盘位置 + 新 topic 的治理流程**：
   - provisional topic 创建后多久/如何 review -> active？
   - 合并/重命名的 redirect 策略由谁触发？
3) **update 的“已评估无需重复”判定标准**：
   - 以 pack_key 完全一致为准？（topic_id+taxonomy_version+rubric_version+question_bank_version+language）
   - 若 pack_key 变化（例如 taxonomy bump），是否要求重新评估？
4) **/learn:assess 的 contract 细节**（internal-only）：
   - 输入：profile_id、topic_id、pack_key、goal（可选）、mode（interactive）
   - 输出：写入哪些 assessment_* events？如何返回摘要给 profile？
5) **评估算法细节（你强调“必须准确概括能力”）**：
   - 自适应/二分晋升回退策略的停止条件
   - 每个 subpoint 的覆盖率阈值与最低证据要求
   - 回归集（regression）如何接入（阻止漂移）
6) **pack “完整生成”与“最小包 3 题”之间的关系**：
   - 是先最小包用于快速定位水平，再扩展到完整包补齐覆盖？
   - 还是必须先完整生成后再开始问答？（会影响 create 的耗时）

---

### Round 29 - pre_context_vNext 问题清单（草案）(2026-01-31T20:23:31+08:00)

#### Goal
- 采集“学习相关但与目标无关”的稳定偏好信号（用于 plan/execute 的呈现方式与节奏），且不把 create 流程变得过重。
- 所有问题支持“选项 + type something”；每题可 Skip；字段版本化（raw+parsed+provenance）。

#### Recommendation（分两段：create 轻量 + 后续补全）

**A) create 阶段（必问，建议 6 题，约 1 分钟）**
1. 每周可稳定投入的时间（time_budget）
2. 单次学习时长/专注窗口（session_length）
3. 偏好的学习方式（learning_style）
4. 偏好的资源形态（preferred_sources，多选）
5. 主要学习/使用场景（learning_context）
6. 输出语言偏好（output_language）

**B) update/execute 阶段（可选补全，按需问，建议最多再 4 题）**
7. 练习/作业密度偏好（practice_intensity）
8. 反馈风格偏好（feedback_style：直接/循序渐进/先肯定后建议等）
9. 是否允许/偏好使用外部工具与代码运行（tooling_preference：允许/限制/不确定）
10. 学习节奏偏好（pace：稳健/快速/冲刺）

#### Open Questions（需要你拍板）
1) create 阶段 6 题是否可接受？是否要再砍到 4 题？
2) “输出语言偏好”是否固定为中文（默认中文），还是允许中英混合？
3) 你是否希望加入“责任/督促（accountability）”相关问题？（之前我们倾向后置渐进）

---

### Round 30 - Decisions Locked: pre_context_vNext Batching + Language + Personal-Only Scope (2026-01-31T20:29:10+08:00)

#### Decisions
1) create 阶段可以问全量，但 **每次 AskUserQuestion 最多 4 题**（分批询问即可）
2) 输出语言偏好：**强制中文（不再询问）**
3) pre_context 的定位更聚焦：**预先生成“学习相关画像”，不涉及目标/环境**（以个人角度为主）

#### Additional Personal-Only Dimensions (Proposal)
在不引入“目标/环境”的前提下，建议补充以下维度（全部可 Skip，可后置到 update/execute 补全）：
- 练习密度偏好（practice_intensity）
- 反馈风格偏好（feedback_style）
- 学习节奏偏好（pace）
- 复盘偏好（reflection_style：学完要不要总结/输出）

---

### Round 31 - Decisions Locked: pre_context 全量放到 create（分批<=4题）(2026-01-31T20:29:10+08:00)

#### Decisions
- pre_context_vNext 的通用个人画像信息：可以一并放到 create 中收集（分批提问，每次<=4题）
- 动机/驱动力（motivation_type）：纳入 create
- 督促偏好（accountability）：不纳入

---

### Round 32 - /learn:assess Minimal Contract (Internal Only) (2026-01-31T20:40:51+08:00)

#### Positioning (Locked)
- `/learn:assess` 是“内部命令”，只由 `/learn:profile` 调用；用户入口仍然是 profile create/update 的评估循环。

#### Contract Goals
- 输入足够少（internal-only），但输出/事件足够可回归（pack_key 强绑定 + 版本号 + evidence）。
- 评估不做“轻量确认”；评估准确性由 pack 完整性 + 评分/自适应 loop 保证。
- profile 只需要拿到一个“摘要”用于 show/提示与下一步决定（继续下一个 topic / 结束）。

#### Input (Draft)
必须：
- `profile_id`（目标画像）
- `topic_id`（canonical）
- `pack_key`（包含：topic_id + taxonomy_version + rubric_version + question_bank_version + language）
- `mode=interactive`（AskUserQuestion 纯文本问答）

可选（internal convenience）：
- `goal_text`（用于选择题目侧重点，但不进入 pack_key）
- `assessment_session_id`（若未传由命令生成；用于把本次评估的 events 串起来）

#### Output (Draft JSON)
- 返回给 profile 的 JSON（供 profile 的 Bash 调用解析）：
  - `ok: true`
  - `data: { profile_id, topic_id, pack_key, assessment_session_id, summary }`
  - `summary` 至少包含：最终 level/proficiency、confidence、覆盖率、关键证据片段引用（IDs）、建议下一步（learn next）

#### Events written (append-only, via ccw learn:append-profile-event)
同一次 `/learn:assess` 必须写以下事件（payload 都包含 assessment_session_id + topic_id + pack_key）：
1) `ASSESSMENT_SESSION_STARTED`
2) `ASSESSMENT_QUESTION_ASKED`（question_id, level, targets: subpoints）
3) `ASSESSMENT_ANSWER_RECORDED`（question_id, answer_text）
4) `ASSESSMENT_SCORED`（question_id, score_breakdown, confidence, coverage_delta）
5) `ASSESSMENT_LEVEL_CHANGED`（from_level, to_level, reason）*可多次*
6) `ASSESSMENT_SESSION_SUMMARIZED`（final_level, final_scores, final_confidence, coverage_summary, evidence_refs）

并且（为了让 snapshot.skills.inferred 也能同步体现）：
- 至少一次 `ccw learn:propose-inferred-skill`（evidence 从 assessment_session_summarized 派生）
  - 注意：不写 confirm/reject（你已要求无确认）；UI 以 assessment events 为准

#### Return-to-Caller Hook
`/learn:profile` 在调用 `/learn:assess` 后只做：
- 保存/展示 summary
- AskUserQuestion：继续评估下一个 topic / 结束并保存

---

### Round 33 - Decision Locked: /learn:assess supports no-op shortcut (2026-01-31T20:45:35+08:00)

#### Decision
- ✅ `/learn:assess` 增加 `noop` 短路输出：当检测到同一 `pack_key` 下该 topic 已评估完成时，不再写新的 `assessment_*` events
- ✅ `/learn:profile` 可直接用该返回进行“已评估无需重复”的提示，并展示已有 summary

#### Rule
- no-op 判定：`pack_key` 全等（topic_id + taxonomy_version + rubric_version + question_bank_version + language）

---

### Round 34 - Decision Override: No slash /learn:assess; use shared internal JS module (2026-01-31T20:49:53+08:00)

#### Decision
- ✅ 不再把 `learn:assess` 做成独立 slash command
- ✅ 评估闭环抽到：`.claude/commands/learn/_internal/assess.js`
- ✅ `/learn:profile` 通过 `Read()` 读取该文件并复用评估逻辑（交互仍在 profile 中发起）

#### Implications
- 避免 profile 需要 `SlashCommand(*)` 权限（当前 allowed-tools 主要是 AskUserQuestion + Bash；后续可增加 Read/Write 以加载脚本）
- 评估逻辑可被未来 `/learn:execute` 复用（同样 Read 内部脚本）
- 原先“新增 /learn:assess internal-only”决策被此方案替代（评估能力仍然是“内部组件”，但以 shared JS file 实现）

---

### Round 35 - Decision Locked: Conservative Assessment Stop + must-cover labeling (2026-01-31T20:59:57+08:00)

#### Decisions
1) 评估预算上限提升 + 停止条件更保守（目标：评估一次后尽量无需再次初始化评估同一 topic）
   - max_questions_per_topic = 20
   - stop 条件（同时满足）：
     - level 收敛（区间收缩到单一 level 或等价稳定条件）
     - must-cover subpoints 100% 覆盖且达标
     - overall coverage >= 0.85
     - overall confidence >= 0.90
     - 最近 4 题稳定（无明显波动/矛盾）
2) must-cover subpoints 标注策略：
   - min_evidence 采用 4 档：see / explain / apply / debug
   - must subpoints 默认 min_questions = 2

---

### Round 36 - Decision Locked: /learn:profile tooling for internal assess module (2026-01-31T21:03:37+08:00)

#### Decisions
1) `/learn:profile` 增加 `Read(*)`（必须，用于加载 `.claude/commands/learn/_internal/assess.js`）
2) `/learn:profile` 暂不增加 `Write(*)`（写入尽量走 `ccw learn:*` CLI，经由 Bash 调用）
3) 评估模块加载方式采用 **函数工厂模式（B）**：避免 eval 污染全局；profile 注入 AskUserQuestion/Bash 等依赖

---

### Round 37 - Pack 最小包 3 题 vs 完整生成：衔接策略定稿 (2026-01-31T21:06:10+08:00)

#### Constraint recap（已锁定）
- 评估要“足够准确以至于后续无需再做该 topic 的初始化评估”
- max_questions_per_topic = 20 + 更严格 stop 条件
- must-cover：min_evidence 4 档（see/explain/apply/debug），must 默认 min_questions=2
- pack_key 包含 language，且 question_bank_version 与 taxonomy_version 强绑定
- `/learn:profile` 无 Write 权限：pack 的落盘需要走 `ccw learn:*` CLI（Bash 调用）

#### Recommended Strategy（兼容“允许最小包起步”+“最终必须完整生成”）
**结论：最小包 3 题不是一个“最终 pack 形态”，而是“同一个 pack 生成过程的 seed questions”。**

1) **Hot topics（预生成 pack）**
- 直接使用已存在的 full pack（跳过最小包概念）
- 评估循环只是“从 full question bank 里选题 + 自适应”，直到满足 stop 条件

2) **Provisional topics（运行时生成 pack）**
- 第一步：生成 **完整 taxonomy（含 must/core/nice 标注）** + 初始化 question_bank_version（例如 qb_tax_vX_v1）
- 第二步：先生成 **seed questions = 3 题**（覆盖多个 must/core subpoints，用于快速定位区间与发现明显缺口）
- 第三步：进入评估 loop，按需继续生成题目（或从已生成题库里选题）：
  - 优先补齐 must-cover 的“命中次数”与证据强度（must 每个 subpoint 至少 2 题且达标）
  - 再补齐 core 覆盖率，最后做 level 收敛与稳定性检查
- 第四步：在“结束评估”之前，必须确保 pack 达到 **full pack completeness**：
  - taxonomy 完整（含 must/core/nice + min_evidence/min_questions）
  - question bank 完整（至少覆盖所有 must/core 子点的出题需要；不要求一次把 nice 全部出齐）
  - regression skeleton 已写入（可空内容但必须有结构与版本号）

#### Key Clarification（避免矛盾）
- “允许最小包 3 题”= 允许先问 3 个高信息量题目作为 seed（加速定位），**不是**允许只生成 3 题就结束。
- “完整生成”= 在本 topic 评估 session 结束前，pack 必须被补全到可回归/可复用的程度（full pack completeness）。

#### Implementation Notes（与权限/缓存一致）
- 在 internal assess 模块中允许“边问边生成题目”，但 pack 的最终写入必须通过 `ccw learn:write-pack`（待实现）或等价后端接口完成（因为 profile 无 Write）。
- assessment events 仍记录统一 pack_key；seed questions 只是 question bank 的一部分。

---

### Round 38 - Decision Locked: ccw learn:* minimal backend capabilities for packs/events (2026-01-31T21:13:03+08:00)

#### Decisions
1) pack 存储位置确定：
   - `.workflow/learn/packs/{topic_id}/...`
2) `write-pack` 采用 **整包覆盖写入**（先不做增量 append）
3) profile event types 不放开任意写入：
   - 后端显式扩展支持 `ASSESSMENT_*` 类型（白名单）

#### P0 CLI (must-have)
- `ccw learn:read-pack --topic-id <id> --pack-key '<json>' --json`
- `ccw learn:write-pack --topic-id <id> --pack '<json>' --json` (overwrite)
- `ccw learn:resolve-pack-key --topic-id <id> --taxonomy-version <v> --rubric-version <v> --question-bank-version <v> --language zh --json`
- extend `learn:append-profile-event` validation to allow `ASSESSMENT_*` types (explicit whitelist)

#### P1 CLI (nice-to-have later)
- `ccw learn:resolve-topic --text "<raw>" --json`
- `ccw learn:pack-status --topic-id <id> --pack-key '<json>' --json`

---

### Round 39 - Taxonomy Index 落盘与治理（provisional -> active / redirect / alias）(2026-01-31T21:16:41+08:00)

#### Goal
- taxonomy-first：topic_id 作为全局 canonical id，稳定可回归
- 支持 long-tail：用户补充新 topic 时可 provisional 创建，但后续可治理为 active
- redirect/alias 可持续维护，避免 topic_id 漂移与重复评估

#### Recommended Storage Layout
1) taxonomy index（全局注册表，profile 只读）
- `.workflow/learn/taxonomy/index.json`

2) topic 的具体 taxonomy 内容与 pack 继续放在 packs 目录（已锁定）
- `.workflow/learn/packs/{topic_id}/manifest.json`
- `.workflow/learn/packs/{topic_id}/taxonomy-{taxonomy_version}.json`
- `.workflow/learn/packs/{topic_id}/question-bank-{question_bank_version}.json`
- `.workflow/learn/packs/{topic_id}/regression-{question_bank_version}.jsonl`

#### Taxonomy Index Schema (Draft)
index.json 顶层：
- `version`（index schema version）
- `updated_at`
- `topics[]`

每个 topic entry（核心字段）：
- `topic_id`（canonical, snake_case）
- `display_name_zh`
- `display_name_en`（可选）
- `aliases[]`（中英/缩写/旧名；用于 resolve-topic）
- `status`: `active | provisional | deprecated`
- `redirect_to_topic_id`（deprecated 时必填；active/provisional 为 null）
- `active_pack_key`（当前用于评估的 pack_key；provisional 初期可为空，生成 pack 后写入）
- `created_at`, `updated_at`

#### Governance Rules (Draft)
1) **Provisional 创建（当 alias 无法 resolve 时）**
- 由 profile 的 AskUserQuestion 触发：“创建新 topic / 映射已有 / 忽略”
- 创建新 topic 时：
  - topic_id 由用户输入 label 规范化生成（冲突则加后缀，且必须再次确认）
  - status=provisional
  - aliases 至少包含：用户原始输入 + normalize 后的形式

2) **Provisional -> Active（promotion）**
- promote 条件建议（与“评估一次后无需再初始化”一致）：
  - full pack completeness 已满足（must/core 可出题）
  - regression set 满足最小规模（建议 >=30，分布覆盖 L1-L4 与边界样例）
  - 无明显重复/冲突（例如与既有 topic 高重合）
- promote 后：
  - status=active
  - active_pack_key 指向最新可用版本

3) **Redirect（合并/重命名）**
- 旧 topic：status=deprecated + redirect_to_topic_id=<new>
- alias resolution 必须支持：
  - 命中旧 topic_id/alias -> 自动 redirect 到新 topic_id
- 历史 pack 不删除（保证历史评估可解释）；但 active_pack_key 只指向 active topic

4) **Alias 维护**
- 允许追加 alias（需要审核以防误映射）
- 建议规则：alias 不能跨多个 active topic；若冲突必须人工处理

#### Open Questions（需要你拍板）
1) taxonomy index 的落盘路径是否就锁定为 `.workflow/learn/taxonomy/index.json`？
2) topic_id 冲突时的策略：自动加后缀（如 `_2`）并二次确认，是否可接受？
3) promote 条件中 regression 最小规模是否锁定为 30（与你的“高准确”目标一致）？

---

### Round 40 - Decisions Locked: Taxonomy Index Path + Conflict Suffix + Promotion Gate (2026-01-31T21:16:41+08:00)

#### Decisions
1) taxonomy index 路径锁定：`.workflow/learn/taxonomy/index.json`
2) topic_id 冲突：自动加后缀 `_2/_3...` 并二次确认
3) provisional -> active promote 门槛：regression >= 30

#### Implementation Note (Tooling)
- 当前 `.claude/commands/learn/profile.md` 的 allowed-tools 只有 AskUserQuestion + Bash（没有 SlashCommand）。
- 若要“真正调用”另一个 slash command `/learn:assess`，需要：
  - A) 给 profile 增加 `SlashCommand(*)` 权限，让其调用 `/learn:assess`（internal-only）
  - 或 B) 将评估闭环实现在可复用的 JS 文件中，由 profile/assess 两边引用（但目前命令文件是内嵌 JS，不是模块化）
