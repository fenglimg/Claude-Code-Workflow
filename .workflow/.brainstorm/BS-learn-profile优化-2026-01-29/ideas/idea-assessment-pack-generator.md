# Idea Deep-Dive: 评估包（Assessment Pack）通用生成流程（任意学习方向）

目标：输入任意学习方向（topic），产出一套“可评估、可解释、可回归”的最小评估包，用于：
- 动态生成题目（text-only）与动态难度（L1-L4）调度
- 置信度/覆盖率计算（基于版本化 taxonomy/subpoints）
- 写入 profile_events（evidence + inferred(proposed)，不自动 confirmed）
- 回归集（regression set）防止评分/跳级策略迭代后漂移

---

## 1) 输入（Input Contract）

- `topic_name`: string（例如“游戏开发”“React Hooks”“Linux 网络调优”）
- `topic_scope`: string（一句话范围：要评估什么，不评估什么）
- `constraints`:
  - 题目必须 text-only（type something），不提供选择题选项
  - inferred 不自动 confirmed（confirmed 仅用户明确确认）
  - taxonomy 版本化（tax_vX.Y）并写入事件

---

## 2) 输出（Artifacts）

每个 topic 产出 3 个文件（最小可用）：

1) taxonomy（subpoints 集合，支持覆盖率与 inferred 提案）
- `taxonomy-{topic_id}.json`

2) question bank（L1-L4 最小题库，题目绑定 expected_subpoints）
- `assessment-question-bank-{topic_id}.json`

3) regression skeleton（回归集骨架：可逐步补齐真实样本）
- `assessment-regression-set-{topic_id}.jsonl`

推荐最小规模（MVP）：
- subpoints：12-18 个
- 题库：12 题（每个 level 3 题：explain/compare/derive/debug 组合）
- 回归集：24 条（每 level 6 条：2 优秀 + 2 中等 + 2 不足；先允许 answer 留空占位）

---

## 3) 命名与 ID 规范（避免后续混乱）

- `topic_id`: slug（小写 + 下划线），例如 `game_dev_core`
- `taxonomy_id`: `tax_{topic_id}`
- `subpoint_id`: `sp_{topic_id}_{short}`（short 用 1-3 个词概括）
- `question_id`: `{topic_short}-L{level}-{nnn}`（例如 `gd-L3-002`）

---

## 4) Taxonomy 生成规则（subpoints 该怎么选）

要求：
- subpoints 需覆盖四层能力：
  - L1：名词/直觉（是什么/为什么）
  - L2：机制/步骤（怎么做/怎么运作）
  - L3：边界/权衡（何时不适用/代价/复杂度）
  - L4：迁移/诊断（debug/profiling/推断排查）
- 每个 subpoint 必须能被“题目”触发（否则是死字段）
- 每个题目 expected_subpoints 不要超过 3 个（保证 coverage 可解释）

推荐 subpoints 结构（对大多数 topic 通用）：
- core concepts（2-4）
- workflow / steps（2-4）
- failure modes / pitfalls（2-4）
- tradeoffs / performance / complexity（2-4）
- debug / diagnose / validate（1-2）

---

## 5) 题库生成规则（最小题型模板）

每个 level 各 3 题（共 12），建议分配：

- L1：
  - explain：定义/直觉
  - explain：关键概念 2
  - explain：常见术语/对象关系

- L2：
  - derive：给一个输入/约束，推导一个“怎么做”的步骤或公式
  - compare：比较 A/B 的适用场景（不要求深入 tradeoff）
  - explain：机制/流程/生命周期

- L3：
  - compare：边界/代价/复杂度（必须提 tradeoff 或 boundary）
  - explain：性能/质量/风险点（必须提影响链）
  - explain：设计权衡（必须提至少 1 个代价）

- L4：
  - debug：现象 -> 可执行排查路径（repro/观测/假设/验证）
  - debug：性能瓶颈定位（分离瓶颈 + 下一步）
  - derive：迁移到新情境并说明权衡（例如网络/一致性/可用性等）

每题必须包含：
- `question_id`, `level`, `question_type`, `question`
- `expected_subpoints[]`（1-3 个）
- 可选：`inferred_skills_proposals[]`（与 subpoints 命中相关）

---

## 6) 回归集骨架（Regression Skeleton）

原则：回归集不是“固定题库”，而是“评估引擎的单元测试”：
- 同样回答，不因阈值/抽取策略变化而大幅漂移
- 重点覆盖“易误判样本”（关键词多但逻辑不通、关键词少但解释清晰）

最小骨架（JSONL）允许先空 answer：
- 对每个 question_id，至少 2 条：
  - one_good（expected promote 或 hold）
  - one_bad（expected demote）
- 后续再补齐 24 条目标规模

---

## 7) Agent 生成提示模板（可复制）

把下面 prompt 作为“生成器”使用：输入 topic 后，Agent 必须只输出 JSON/JSONL（便于直接写文件）。

### Prompt A: Generate taxonomy
要求：输出一个 taxonomy JSON，包含：
- taxonomy_version=tax_v0.1
- topic_id/taxonomy_id/name/description
- subpoints[12-18]：每项包含 id/name/description
- inferred_skills_map（可选，最多 3 个映射）

### Prompt B: Generate question bank
要求：输出一个 question bank JSON，包含：
- topic_id/taxonomy_id/taxonomy_version
- questions[12]：覆盖 L1-L4，每题 expected_subpoints 1-3 个且都存在于 taxonomy

### Prompt C: Generate regression skeleton
要求：输出 JSONL（24 行）：
- 每行包含 case_id/topic_id/level/question_type/question/taxonomy_version/taxonomy_id/expected_subpoints/answer/expected
- answer 可先留空或放示例回答（建议 2 优秀/2 中等/2 不足）

---

## 8) 事件写入对齐（Assessment -> Profile）

评估包生成完之后，运行评估时应写 events（示例类型）：
- ASSESSMENT_QUESTION_ASKED / ASSESSMENT_ANSWER_RECORDED / ASSESSMENT_SCORED / ASSESSMENT_LEVEL_CHANGED
- INFERRED_SKILL_PROPOSED / INFERRED_SKILL_UPDATED（evidence.type=assessment_signal）

禁止：
- 不自动写 INFERRED_SKILL_CONFIRMED（除非用户明确确认）

