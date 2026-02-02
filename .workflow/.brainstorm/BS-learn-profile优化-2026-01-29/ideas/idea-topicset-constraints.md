# Idea: TopicSet 约束器（考虑既有 topics + 去重 + 冗余治理，不依赖包含层级）

## Intent
把“主 Agent 联想出来的 topics”从“散落的字符串列表”升级为“满足不变量的一组 topic_ids”，并且：
- 考虑 profile 已存在 topics（update 场景）
- topic 作为最小能力粒度（评估/学习计划按 topic 组织）
- topic 之间不建模包含关系（不走 parent/child 层级）
- topic 不重复（同义/别名/redirect 必须收敛）

## Why it matters
如果 topic 集合不干净：
- 会出现重复评估、重复题库、重复计划
- 用户会感知“系统不懂我已经会/已经选过”
- 未来治理（alias/redirect）会越来越难

## Proposed Function (Conceptual)
```
TopicSet = constrainTopics({
  existing_topic_ids: string[],
  candidates: Array<{ raw_label: string, reason: string, source: "parse" | "associate" | "user_typed" }>,
  resolve_batch: (raw_labels[]) -> resolve_items[],
  redundancy_rules?: Array<{ keep: string, drop: string, reason: string }>
})
=> {
  kept: Array<{ topic_id: string, display_label: string, reason: string, source: string }>,
  dropped: Array<{ raw_label?: string, topic_id?: string, why: string }>,
  ambiguous: Array<{ raw_label: string, candidates: Array<{ topic_id: string, label: string }> }>
}
```

## Constraint Steps (Recommended Order)
1) **Canonicalize**（先统一口径）
   - 对 candidates.raw_label 走 resolve-topics(batch) → 得到 canonical topic_id / ambiguous / not_found
2) **Deduplicate by canonical id**
   - 同一个 topic_id 只保留一条（reason 优先用 parse，其次 user_typed，其次 associate）
3) **Subtract existing topics**
   - update 场景：如果 topic_id 已在 existing_topic_ids 中，默认 dropped（原因：already_in_profile）
   - 可选：仍允许在 UI 中以“已存在（只读）”展示，但不参与“新增/待评估”列表
4) **Redundancy governance (optional, rule-based)**
   - 不是“包含层级”，而是“冗余对/重叠对”的治理规则
   - 例：当 `typescript` 被保留时，`javascript` 可能被 drop（理由：superset overlap）
   - 规则必须可审计、可配置、可快速回滚（别硬编码进 taxonomy 结构）
5) **Pack for AskUserQuestion**
   - 最终用于候选展示的 items 需要被切成 4x4（<=16），并保证：
     - 同一次 AskUserQuestion：question 文案唯一
     - 同一 question 内 option.label 唯一（必要时 label 加短后缀，如 `JavaScript (lang)`）

## Handling not_found / ambiguous
- ambiguous：必须走用户选择（不自动 ensure、不自动拍板）
- not_found：
  - **只有当** raw label 来自 user_typed/user_selected 时才允许 ensure-topic
  - agent_associate 产生的“用户没选的候选”不得 ensure（避免 taxonomy 污染）

## Open decisions
1) update 场景，“已存在 topics”是否要在覆盖校验 loop 里只读展示？
2) 冗余治理的首批规则范围：仅做同义/alias/redirect，还是把 TS/JS、框架/语言等也纳入？

