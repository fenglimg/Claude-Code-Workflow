# Idea Deep-Dive: 学习画像需要补齐哪些“个人因素”维度（通用学习向）

目标：在“不强制 Goal Type、不过度问卷、不要求整体经验自评”的前提下，补齐能显著影响学习体验与推荐/评估质量的**个人因素**字段（习惯/偏好/注意力/反馈/巩固等），先忽略具体环境因素（设备/IDE/版本/网络/技术栈等）。

## Recommended Additions (按优先级)

### P0（强烈建议纳入画像；可渐进采集）
1. **时间预算与节奏（time budget & cadence）**
   - 你一般什么时候学、一次能学多久、每周大概几次（以及你更喜欢“碎片”还是“整块”）。\n
   - 目的：决定输出粒度、任务拆分、复习节奏。

2. **专注/能量模式（focus & energy pattern）**
   - 你能连续专注多久？你在哪些状态下学得最好/最差？最常见的走神原因是什么？\n
   - 目的：决定内容长度、交互频率、是否需要更多 checkpoint。

3. **学习方式与内容组织偏好（learning mode & structure）**
   - 你更喜欢：先结论后原因/先原理后例子/边讲边练/对比表/坑点清单/步骤清单等。\n
   - 目的：让“同样的知识”以你更吸收的形式呈现。

4. **反馈/纠错偏好（feedback & correction）**
   - 你希望我如何指出问题：严格纠错/温和纠错/先鼓励后纠错；要不要给改法/提示到位再揭晓。\n
   - 目的：减少挫败感同时保持学习效率。

5. **巩固/复习偏好（retention strategy）**
   - 你希望我怎么帮你巩固：每次小结、间隔复习提醒、周总结、错因复盘等。\n
   - 目的：把一次性理解变成长期掌握。

6. **先验知识地图（prior knowledge map，非经验等级）**
   - 用自然语言列“我会什么/我卡在哪/我经常混淆什么/我最怕什么”。\n
   - 目的：替代“经验自评”，更可靠地定位起点与误区。

### P1（显著提升效率；可选）
7. **推进/监督偏好（accountability）**
   - 你希望我“推着你走”吗？要不要每次结束给下一步清单？要不要设置固定 check-in？\n
   - 目的：提升持续性与完成率。

### P2（提升长期留存与个性化；可后置）
9. **动机与驱动（motivation）**
   - 一句话：你学这个最核心的驱动力是什么？（兴趣/效率/工作需要/长期成长等，自由描述即可）

10. **表达与接收偏好（communication accessibility）**
   - 术语密度高不高、是否需要更多类比/例子、是否容易被长文淹没、是否更喜欢短句要点。\n
   - 目的：提升沟通效率与体验一致性。

## Suggested Schema (minimal, optional)
```json
{
  "learning_profile": {
    "time_budget": {
      "time_windows": "free_text",
      "session_length": "free_text",
      "weekly_cadence": "free_text"
    },
    "focus_energy": {
      "focus_duration": "free_text",
      "energy_pattern": "free_text",
      "common_interruptions": "free_text",
      "resume_preference": "free_text"
    },
    "learning_style": {
      "learning_mode_preference": "free_text",
      "output_format_preference": "free_text",
      "content_organization_preference": "free_text"
    },
    "feedback": {
      "feedback_preference": "free_text",
      "correction_strictness_preference": "free_text"
    },
    "retention": {
      "retention_preference": "free_text"
    },
    "accountability": {
      "accountability_preference": "free_text"
    },
    "prior_knowledge": {
      "what_i_can_do": "free_text",
      "what_confuses_me": "free_text",
      "common_misconceptions": "free_text"
    },
    "motivation": {
      "why_learning_now": "free_text"
    },
    "communication": {
      "term_density_preference": "free_text",
      "analogy_preference": "free_text"
    }
  }
}
```

## Collection Strategy (不增加初始化摩擦)
- 初始化只采集 pre_context + 基本信息 + 自述技能点；以上字段采用“按需触发”渐进补齐（不问环境因素）：\n
  - pre_context 的 Q1-Q4 直接覆盖 time_budget/focus_energy/learning_style/feedback/retention\n
  - accountability 建议后续渐进采集（不放入 pre_context 4 问）\n
  - 用户表达卡点/误解 → 写入 prior_knowledge（what_confuses_me/common_misconceptions）\n
  - 用户表达“为什么学/动力” → 写入 motivation
