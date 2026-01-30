# Idea Deep-Dive: 纯文本评估 + 动态难度 + 置信度（语义相似度 × 覆盖率）

## Problem
- 选择题可猜，难以区分真正理解与“猜对”。
- 关键词命中式评估对表达方式敏感，不能衡量逻辑严密性。
- 固定难度评估效率低：水平高的用户被迫从基础开始，水平低的用户被“劝退”。

## Proposal
- 评估输入仅允许用户自由文本作答（type something），不提供选项。
- 采用自适应评估：根据用户回答的深度/结构动态跳级或回退。
- 评分以“逻辑与覆盖”为核心：
  - 语义相似度：回答是否贴合目标知识点的核心含义（非关键词匹配）
  - 知识点覆盖率：回答涉及的关键子点/边界/反例/推导链覆盖程度
  - 结构评分（建议加入）：是否有清晰步骤、因果关系、条件/边界声明
 - 与 profile schema 对齐：评估只能产出 **evidence** 与 **proposed inferred skills**，不自动 confirmed（confirmed 仅用户明确确认）。

## Question Types (text-only)
- 解释型：用自己的话解释 X，并给一个反例或常见误解。
- 对比型：比较 A 与 B，分别适用场景与代价。
- 推导型：从前提出发推导结论，并说明关键一步。
- Debug 型：给一段现象/错误，让用户描述排查路径。

## Difficulty Model (levels)
定义 4 个难度级别（不展示给用户，只用于自适应调度）：
- L1: 术语与直觉（能说清“是什么/为什么大致如此”）
- L2: 机制与步骤（能说清“怎么运作/怎么做/关键步骤”）
- L3: 边界与权衡（能说清“何时不适用/代价/取舍/复杂度”）
- L4: 迁移与诊断（能迁移到新情境、能给出排查路径与反例构造）

## Adaptive Difficulty (high level)
1. 选择一个起始级别（默认中等偏保守，或由 asserted/inferred 推断）。
2. 对回答做三类判断：
   - **跳级信号**：包含边界条件/反例/复杂度分析/权衡；结构清晰；自我校验
   - **维持信号**：核心正确但缺少细节
   - **回退信号**：概念混淆、因果不成立、关键步骤缺失
3. 根据信号在 1-2 个级别内跳转；始终允许回退（避免一次误判）。

## Confidence Scoring (suggested)
- `semantic_similarity` ∈ [0,1]
- `coverage` ∈ [0,1]
- `structure` ∈ [0,1]（可选，但强烈建议）
- `confidence = semantic_similarity * coverage * (0.5 + 0.5*structure)`（示例公式）

覆盖率计算：
- 以“版本化知识点集合”作为 ground truth（来自 taxonomy），对回答抽取到的子点集合求覆盖。

## Rubric (可执行评分量表)
目标：减少“自由文本评分飘”的主观性，把评分拆成可解释的维度，并输出给用户可理解的反馈。

### 评分维度（每题）
- **Correctness（正确性）**：核心结论是否成立（0/0.5/1）
- **Mechanism / Steps（机制/步骤）**：是否说明关键机制或步骤（0/0.5/1）
- **Boundaries（边界）**：是否提到适用条件/边界/反例（0/0.5/1）
- **Tradeoffs（权衡）**：是否说明代价/复杂度/取舍（0/0.5/1）
- **Diagnostics（诊断）**：debug 题专用：是否给出可执行排查路径（0/0.5/1）
- **Structure（结构化表达）**：是否有清晰结构（分点/步骤/因果链）（0/0.5/1）

说明：
- 每题只启用与题型相关的维度（例如解释题不启用 Diagnostics）。
- 最终 `structure` 可以复用该维度评分，避免“结构评分”另算一套。

### 可解释输出（每题）
固定输出 3 段：
1) 你做对的关键点（1-3 条）
2) 你缺失/模糊的点（1-3 条）
3) 下一题为何升/降/维持（1 句，引用 rubric 维度）

## Adaptive Policy (保守可控的跳级策略)
默认从 L2 起步（除非已有强 evidence 表明更低/更高）。

### 跳级/回退规则（建议阈值）
对每题计算：
- `confidence`（0-1）
- `rubric_score`：相关维度均值（0-1）

建议：
- **Promote（升一级）**：confidence >= 0.75 且 rubric_score >= 0.7，且至少命中 1 个“高阶维度”（Boundaries/Tradeoffs/Diagnostics 任一 >= 0.5）
- **Hold（维持）**：confidence 在 [0.45, 0.75) 或 rubric_score 在 [0.4, 0.7)
- **Demote（降一级）**：confidence < 0.45 或 Correctness == 0（核心错误）

限制：
- 一次最多升/降 1 级（防误判挫败）
- 任何时候允许“保级巩固”模式（用户说想多练一题同级就不升）

### 结束条件（stop rule）
- 同一主题连续 2 题达到 Promote 门槛，可结束并给出主题等级结论
- 或连续 2 题 Demote，则下探到更基础子主题/先补缺口
- 或达到题数上限 N（建议 6 题），强制收敛总结（避免疲劳）

## Knowledge Points & Coverage (覆盖率落地)
覆盖率必须基于版本化 taxonomy（不要用 KeywordDictionary）：
- 每个题目绑定 `taxonomy_id` + `subpoints[]`（该题期望覆盖的子点列表）
- 从回答中抽取命中的子点集合（保留证据：回答原句片段/解释）
- `coverage = |matched_subpoints| / |expected_subpoints|`

## Event Integration (写入 profile_events / 更新 inferred)
评估模块不直接“改写用户是谁”，只写入可审计 evidence，并生成/更新 inferred（仍为 proposed）。

### 建议新增 events 类型（与 schema 对齐）
- `ASSESSMENT_SESSION_STARTED`：{ topic_id, taxonomy_version, start_level }
- `ASSESSMENT_QUESTION_ASKED`：{ question_id, level, taxonomy_id, expected_subpoints[] }
- `ASSESSMENT_ANSWER_RECORDED`：{ question_id, answer_text }
- `ASSESSMENT_SCORED`：{ question_id, confidence, rubric_breakdown, matched_subpoints[], rationale }
- `ASSESSMENT_LEVEL_CHANGED`：{ from_level, to_level, reason }
- `INFERRED_SKILL_PROPOSED`：{ skill }（evidence.type=assessment_signal）
- `INFERRED_SKILL_UPDATED`：{ skill_id, confidence_delta, new_evidence }（仍保持 proposed）
- `ASSESSMENT_SESSION_SUMMARIZED`：{ final_level, strengths[], gaps[], recommended_next_steps[] }

与之前约束一致：
- 不产出 `INFERRED_SKILL_CONFIRMED`（除非用户明确确认）

## Regression Set (回归集设计：保证评分/跳级稳定)
目的：每次改 rubric/阈值/抽取策略，都能验证“同样输入得到同样的等级/跳级结论”。

### 数据格式（推荐 JSONL）
每行一个 case：
```json
{
  "case_id": "js-closure-L2-001",
  "topic_id": "js_closure",
  "level": "L2",
  "question_type": "explain|compare|derive|debug",
  "question": "string",
  "taxonomy_version": "tax_v0.1",
  "taxonomy_id": "tax_js_closure",
  "expected_subpoints": ["sp1", "sp2", "sp3"],
  "answer": "string",
  "expected": {
    "min_correctness": 0.5,
    "min_coverage": 0.5,
    "min_rubric_score": 0.5,
    "expected_decision": "promote|hold|demote",
    "expected_level_change": -1
  }
}
```

### 回归集构成（建议最小规模）
- 每个主题 × 每个 level：至少 6 条（2 条优秀、2 条中等、2 条明显不足）
- 覆盖不同表达方式（同义句、口语、结构化分点、啰嗦但正确）
- 特别加入“容易误判”的样本：
  - 关键词很多但逻辑不通（应 demote）
  - 关键词少但解释清晰（应 hold/promote）

## Game Dev Pilot (已落地示例：可直接用来跑通整条链)
- taxonomy：`ideas/taxonomy-game-dev-core.json`（tax_game_dev_core / tax_v0.1）
- 题库：`ideas/assessment-question-bank-game-dev-core.json`（L1-L4，每题绑定 expected_subpoints）
- 回归集：`ideas/assessment-regression-set-game-dev-core.jsonl`（24 cases，用于稳定性验证）

## Cocos Dev Pilot (已落地示例：可直接用来跑通整条链)
- taxonomy：`ideas/taxonomy-cocos-dev-core.json`（tax_cocos_dev_core / tax_v0.1）
- 题库：`ideas/assessment-question-bank-cocos-dev-core.json`（L1-L4，每题绑定 expected_subpoints）
- 回归集：`ideas/assessment-regression-set-cocos-dev-core.jsonl`（24 cases，用于稳定性验证）

## Productize: Generic Pack Generation (任意学习方向)
- 通用生成流程与模板：`ideas/idea-assessment-pack-generator.md`
- 文件模板（便于快速开新 topic）：\n
  - `ideas/assessment-pack-template-taxonomy.json`\n
  - `ideas/assessment-pack-template-question-bank.json`\n
  - `ideas/assessment-pack-template-regression.jsonl`

## Explainability
- 输出给用户的反馈应包含：
  - 你答对的关键点（1-3 条）
  - 你缺失/模糊的关键点（1-3 条）
  - 下一题为什么升/降级（一句话说明）

## Risks & Mitigations
- 风险：语义评分不稳定（同样意思不同表达）
  - 缓解：保留 rubric；用多角度证据（相似度+覆盖+结构）；需要回归集
- 风险：跳级误判造成挫败
  - 缓解：跳级幅度限制；允许用户选择“继续同级巩固”
- 风险：覆盖率的知识点集合来源不清
  - 缓解：taxonomy 版本化；每次评估记录使用的版本

## MVP
- 先选 1-2 个领域（例如：前端基础/JS/引擎基础）做题型与 rubric
- 落地“保守自适应”策略（最多跳 1 级）
- 记录评估日志（题目、回答、评分、解释、跳级原因）
 - 建立最小回归集（每主题≥24 条：4 levels × 6 cases）

## Success Metrics
- 完成评估轮次减少（效率）
- 用户主观满意度提升（体验）
- 评估结果与后续任务表现相关性提升（有效性）
