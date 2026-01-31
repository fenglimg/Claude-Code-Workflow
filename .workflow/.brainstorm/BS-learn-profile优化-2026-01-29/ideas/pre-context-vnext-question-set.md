# pre_context_vNext 问题集（Draft）

Timestamp: 2026-01-31T20:23:31+08:00

## Design Goals
- 只问“学习相关但与目标无关”的稳定偏好信号（用于 plan/execute 的呈现/节奏/练习密度）
- create 阶段尽量轻量（不超过 6 题）
- 每题：选项 + 允许 type something；允许 Skip；可复用/可重问（drift/过期）
- 存储：raw + parsed + provenance；template_version 版本化

## Template Version
- `pre_context_v2.0`（建议命名）

## Fields / Keys（建议保持英文 key，UI 文案全中文）

### A) create（必问，分两批问，每批<=4题）

Batch 1 (<=4 questions)

1) `pre_time_budget`
- Header: 时间投入
- Question: 你每周能稳定投入多少时间学习？（可选或输入）
- Options (value -> label):
  - `lt2` -> 少于 2 小时/周
  - `2_5` -> 2-5 小时/周
  - `5_10` -> 5-10 小时/周
  - `10plus` -> 10 小时以上/周
  - `variable` -> 不固定（看工作情况）
  - `skip` -> 跳过

2) `pre_session_length`
- Header: 专注时长
- Question: 你更适合一次连续学习多久？（可选或输入）
- Options:
  - `15_30m` -> 15-30 分钟
  - `30_60m` -> 30-60 分钟
  - `60_90m` -> 60-90 分钟
  - `2h_plus` -> 2 小时以上
  - `variable` -> 不固定
  - `skip` -> 跳过

3) `pre_learning_style`
- Header: 学习方式
- Question: 你更喜欢哪种学习方式？（可选或输入）
- Options:
  - `hands_on` -> 先动手后补概念
  - `concept_first` -> 先把概念讲透再练习
  - `mixed` -> 概念+练习交替
  - `example_driven` -> 多看例子/对照改
  - `skip` -> 跳过

4) `pre_preferred_sources` (multiSelect)
- Header: 资源偏好
- Question: 你更喜欢哪些资源形态？（可多选或输入）
- Options:
  - `official_docs` -> 官方文档
  - `interactive` -> 交互式教程/沙盒
  - `video` -> 视频课
  - `book` -> 书籍/长文
  - `articles` -> 博客/文章
  - `repo_examples` -> 开源项目/示例仓库
  - `skip` -> 跳过

Batch 2 (<=4 questions) — Personal-only (no goal/context/environment)

5) `pre_practice_intensity`
- Header: 练习密度
- Question: 你希望练习/作业的密度？（可选或输入）
- Options:
  - `light` -> 轻量（少量练习，更多讲解）
  - `balanced` -> 平衡
  - `heavy` -> 高频练习（以练代学）
  - `skip` -> 跳过

6) `pre_feedback_style`
- Header: 反馈风格
- Question: 你更喜欢我怎么给反馈？（可选或输入）
- Options:
  - `direct` -> 直接指出问题 + 给改法
  - `step_by_step` -> 分步骤引导
  - `socratic` -> 先提问引导你自己推理
  - `skip` -> 跳过

7) `pre_pace`
- Header: 学习节奏
- Question: 你希望整体节奏更偏向？（可选或输入）
- Options:
  - `steady` -> 稳健（少走弯路）
  - `fast` -> 快速（先覆盖后补漏）
  - `sprint` -> 冲刺（短期强度高）
  - `skip` -> 跳过

8) `pre_reflection_style`
- Header: 复盘方式
- Question: 你更喜欢以什么方式复盘/巩固？（可选或输入）
- Options:
  - `summary_first` -> 每次学完给我一段总结/要点
  - `flashcard` -> 关键点卡片/清单
  - `practice_only` -> 不用总结，靠练习巩固
  - `skip` -> 跳过

Output language (locked)
- parsed.output_language = `zh` (强制中文，不再询问)

Batch 3 (<=4 questions) — Personal-only (no goal/context/environment)

9) `pre_motivation_type`
- Header: 学习驱动力
- Question: 你学习时更偏向哪种驱动力？（可选或输入）
- Options:
  - `curiosity` -> 好奇/探索（我想搞明白）
  - `achievement` -> 成就/进度（我想快速看到结果）
  - `pragmatic` -> 实用/解决问题（能用上最重要）
  - `mastery` -> 体系/长期能力（打牢基础）
  - `skip` -> 跳过

## Parsed Mapping（建议）
- parsed.time_budget <= normalized(pre_time_budget)
- parsed.session_length <= normalized(pre_session_length)
- parsed.learning_style <= normalized(pre_learning_style)
- parsed.preferred_sources <= normalized(pre_preferred_sources)
- parsed.practice_intensity <= normalized(pre_practice_intensity)
- parsed.feedback_style <= normalized(pre_feedback_style)
- parsed.pace <= normalized(pre_pace)
- parsed.reflection_style <= normalized(pre_reflection_style)
- parsed.output_language = `zh` (locked)
- parsed.motivation_type <= normalized(pre_motivation_type)

## Gating / Reuse
- create: ask Batch 1 + Batch 2 unless user skips
- create: ask Batch 3 unless user skips (motivational signal)
- update/execute: (optional) only re-ask when drift triggers (e.g. user explicitly says preferences changed)
- expiry: optional (e.g. 30 days) but should not hard-block

## Open Questions
1) create 阶段每次 AskUserQuestion 最多 4 题：✅ locked（分批问）
2) 默认输出语言强制中文：✅ locked（不再询问）
3) motivation_type 放在 create：✅ locked
