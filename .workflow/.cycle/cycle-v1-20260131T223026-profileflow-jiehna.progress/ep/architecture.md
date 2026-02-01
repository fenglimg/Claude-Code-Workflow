# Architecture (Cycle-2): learn:profile Flow vNext

Version: v1.0.0  
Cycle: `cycle-v1-20260131T223026-profileflow-jiehna`

---

## Flow (Text Diagram, non-mermaid)

```text
/learn:profile create
  |
  +-> Phase A: pre_context_vNext (个人学习画像；每次 AskUserQuestion <=4，允许分批)
  |
  +-> Phase B: Background Capture (必填)
  |      |
  |      +-> 如果存在历史 background：AskUserQuestion 复用/更新
  |      `-> 保存到 profile.background (raw_text/summary/_metadata)
  |
  +-> Phase C: Background Parse (ccw learn:parse-background)  [JIT之外的初始化推断]
  |
  +-> Phase D: Topic Coverage Validation Loop
  |      |
  |      +-> 展示推荐 topics (from parser) + free text 补漏
  |      +-> 回显合并后的 topics 列表并确认是否覆盖
  |      `-> 选择本次要评估的 1 个 topic
  |
  `-> Phase E: Single-Topic Assessment (internal assess.js)

/learn:profile update
  |
  +-> 不做背景联想（已有目标）
  `-> 可进入单 topic 评估入口（或未来基于 goal 自动跳转；Cycle-3）
```

## Topic resolve (taxonomy-first) — 解释（Cycle-2 只解释，不实现）

含义：把用户/Agent 的候选 topic 文本（alias/synonym/旧名）映射到唯一 canonical `topic_id`（taxonomy 是唯一来源）。  
输出至少包含：`{ topic_id, taxonomy_version, resolution_source }`。  
Cycle-2 仅在文档中解释；真正的 taxonomy index 与 mapping 在 Cycle-3 落地。

## p-e2e-* isolation

Backend enforce:
- `learn:list-profiles`：默认过滤掉 `p-e2e-*`
- `learn:set-active-profile`：拒绝设置 `p-e2e-*`
- `learn:update-state --field active_profile_id`：拒绝 `p-e2e-*`

This prevents both UI exposure and accidental state pollution.

