# Idea Deep-Dive: Pre-Context 固定 4 问模板（用满 AskUserQuestion 负载）

## Problem
- 初始化阶段信息缺口大：学习时间/专注模式/内容形式偏好/学习约束未稳定收集。
- “随意追问”导致不同用户采集维度不一致，后续推荐与评估策略难以对齐。

## Proposal
- 在背景信息完整提供前，强制先走一次 `AskUserQuestion`，每次固定 4 个开放式问题。
- 模板版本化（v1/v2/...），允许后续迭代，但同一版本内问题固定，便于回归与 A/B。

## Fixed 4 Questions (pre_context_v1.3 - FINAL: 个人因素优先 + 选项 + type something)
原则：
- 每次固定 4 问（用满 AskUserQuestion 负载）。
- 允许“快捷选项 + 自由输入（type something）”并存：选项用于降摩擦，自由输入用于补充真实细节。
- 允许用户快速回答：`同上 / 无变化 / 跳过`（不阻塞）。
- 选项只用于偏好采集（pre_context），不要复用到评估（assessment），避免变成可猜题。
- 暂时只关注“个人因素”（习惯/偏好/注意力/反馈方式/巩固方式等），先忽略具体环境因素（设备/IDE/版本/公司网络/技术栈等）。
- 不在 pre_context 里采集“2-4 周可验证结果”；动机/推进（accountability）不强制进 4 问，作为后续渐进字段。

### 可直接落地的最终文案（建议按原样使用）
1. **学习时间与节奏（个人习惯）**：你通常在什么时间段学习？一次大概能投入多长时间？每周大概几次？
   可答：同上 / 无变化 / 跳过
   快捷选项（可多选，也可忽略直接输入）：
   - 时间段：工作日白天 / 工作日晚间 / 周末 / 不固定
   - 单次时长：15-30min / 30-60min / 60-90min / 90min+
   - 频率：每天 / 每周 3-5 次 / 每周 1-2 次 / 不固定

2. **专注/能量与打断处理（个人状态）**：你一般能连续专注多久？你更容易在什么状态下学得最好（精力高/一般/疲惫）？最常见的打断/走神原因是什么？当你被打断时，你希望我怎么帮你继续？
   可答：同上 / 无变化 / 跳过
   快捷选项（可多选，也可忽略直接输入）：
   - 连续专注：5-10min / 10-20min / 20-40min / 40min+
   - 精力状态：精力高 / 一般 / 容易疲惫 / 看情况（type something）
   - 打断/走神：消息通知 / 忙别的事 / 容易走神 / 不知道从哪开始 / 其他（type something）
   - 续上方式：拆小步 / 先结论后展开 / 先总结进度 / 给下一步清单 / 其他（type something）

3. **内容形式与学习方式偏好（个人偏好）**：对你最有效的学习方式是什么？你希望我怎么输出/组织内容？（比如：先结论后原因、先原理后例子、边讲边练、用类比、用 checklist 等）
   可答：同上 / 无变化 / 跳过
   快捷选项（可多选，也可忽略直接输入）：
   - 输出：短要点 / 中等细节 / 长讲解
   - 练习：多练习 / 平衡 / 少练习
   - 节奏：先给可用结论 / 循序渐进 / 先问我再讲
   - 组织：步骤清单 / 框架图（文字版）/ 对比表 / 常见坑清单

4. **反馈/纠错与巩固方式（个人偏好）**：你希望我怎么给反馈与纠错？你更偏好的巩固方式是什么（例如：每次小结、间隔复习提醒、做题/复盘）？
   可答：同上 / 无变化 / 跳过
   快捷选项（可多选，也可忽略直接输入）：
   - 纠错：严格纠错 / 温和纠错 / 先鼓励后纠错
   - 反馈：指出问题+给改法 / 只指出问题我自己改 / 先给提示再揭晓
   - 巩固：每次小结 / 周总结 / 间隔复习提醒 / 只在我卡住时回顾

### AskUserQuestion payload（4 个问题的“可复制版本”）
```json
{
  "template_version": "pre_context_v1.3",
  "questions": [
    "学习时间与节奏（个人习惯）：你通常在什么时间段学习？一次大概能投入多长时间？每周大概几次？（可答：同上/无变化/跳过）",
    "专注/能量与打断处理（个人状态）：你一般能连续专注多久？你更容易在什么状态下学得最好？最常见的打断/走神原因是什么？当你被打断时，你希望我怎么帮你继续？（可答：同上/无变化/跳过）",
    "内容形式与学习方式偏好（个人偏好）：对你最有效的学习方式是什么？你希望我怎么输出/组织内容？（可答：同上/无变化/跳过）",
    "反馈/纠错与巩固方式（个人偏好）：你希望我怎么给反馈与纠错？你更偏好的巩固方式是什么？（可答：同上/无变化/跳过）"
  ]
}
```

## Output Schema (suggested)
```json
{
  "pre_context": {
    "template_version": "pre_context_v1.3",
    "raw": {
      "q1": "free_text",
      "q2": "free_text",
      "q3": "free_text",
      "q4": "free_text"
    },
    "parsed": {
      "study_time_windows": "free_text",
      "session_length": "free_text",
      "weekly_cadence": "free_text",
      "focus_duration": "free_text",
      "energy_state_preference": "free_text",
      "common_interruptions": "free_text",
      "resume_preference": "free_text",
      "learning_mode_preference": "free_text",
      "output_format_preference": "free_text",
      "content_organization_preference": "free_text",
      "teaching_style_rules": "free_text",
      "must_avoid": "free_text",
      "feedback_preference": "free_text",
      "correction_strictness_preference": "free_text",
      "retention_preference": "free_text"
    }
  },
  "provenance": {
    "source": "ask_user_question",
    "template_version": "pre_context_v1.3",
    "captured_at": "ISO-8601"
  }
}
```

## Parsing Notes (non-blocking)
- 必须保存 raw（q1-q4 原文），parsed 抽取失败不影响后续流程。
- “同上/无变化”：表示沿用上次有效值；若无历史值则保留为空并在后续自然对话补齐。
- “跳过”：显式记录为 skipped，避免重复追问造成打扰（可设置冷却期）。

## UX Flow
- Step A: 进入 create 阶段 → 直接发起 4 问模板
- Step B: 用户回答后，系统回显一个“我理解的学习偏好摘要”（1-3 句）并允许用户纠正
- Step C: 再进入画像初始化（收集基本信息 + 自述技能点）

## Reuse Strategy (复用策略 - FINAL)
目标：在不牺牲“深度收集”的前提下，减少重复提问与用户疲劳。

### When to Ask (触发 AskUserQuestion 的条件)
- First-time：用户没有 `pre_context` 或缺关键字段（时间/形式/风格任一为空）→ 必问。
- Stale：距离上次采集超过 N 天（建议 30 天）→ 必问（允许“无变化/同上”快速答）。
- Drift signal：用户在对话中表达“你讲得太长/太短/不符合我习惯/我时间变了”等 → 立即重问。
- Explicit command：用户请求“更新偏好/调整学习方式” → 立即重问。

### When NOT to Ask (直接复用)
- `pre_context` 在 N 天内且用户未表达 drift → 直接复用，不额外打断；仅在输出里遵循已记录偏好。

### Cooldown
- 若用户在 Q1-Q4 明确写了“跳过”，建议冷却期 M 天（建议 7 天）内不重复追问同一问题。

## Risks & Mitigations
- 风险：4 问过长导致疲劳
  - 缓解：每问 1 句、允许“先跳过/稍后补充”、支持一次性回答或分段回答
- 风险：自由文本难结构化
  - 缓解：保存原文 + 轻量抽取（不丢原文），抽取失败不阻塞流程

## MVP
- 仅落地 v1 模板 + 结构化字段（保留原文）
- 加一段“偏好摘要回显 + 纠错”

## Success Metrics
- 初始化完成率/中途退出率
- 4 问回答完整率
- 后续学习任务完成率、回访率（与未启用模板对比）

## Open Questions
- 同一用户二次进入时：是否复用上次偏好，还是只问变更？
- 偏好冲突处理：用户说“想要详细”但时间块很短，策略如何折中？

## Resolved (本轮已明确)
- 复用优先：在 N 天内默认复用，不打断；出现 drift/过期/缺失再触发 AskUserQuestion。
- 同一模板兼容“更新”场景：用户可用“同上/无变化/跳过”快速回答，仍满足固定 4 问约束。
