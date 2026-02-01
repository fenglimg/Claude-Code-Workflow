# Idea: UX + Seed 4Q Generator + Full Pack Async + Scoring/Confirmation vNext

## Motivation
真实体验反馈集中在 4 类痛点：
1) 交互批次与观感（AskUserQuestion 批次、Bash 噪音）
2) 数据模型使用方式（profile 是否默认复用）
3) topic 覆盖校验缺主 Agent 联想
4) 评估体验（seed 固定/自评突兀/缺校准）

## Proposed Direction (vNext)

### 1) pre_context：每批尽量 4 题（<=4），并确认 UI 是否存在“只显示 2 题/批”的限制
- 若 UI 限制存在：脚本无需调整，改 UI；否则修脚本。

### 2) profile 默认复用
- 默认 profileId 固定（如 `profile`）。
- 仍支持 `--profile-id` 显式创建新 profile（高级模式）。

### 3) topic 覆盖校验联想拓展
- 在覆盖校验 loop 内加入 “联想拓展”阶段：输出 Top-N 关联 topic + 理由；AskUserQuestion 让用户确认/否认/补充。
- 联想来源分层：taxonomy -> 规则/字典 -> LLM（只在需要时触发）。
- Loop guard：最多 2-3 轮，每轮 Top-4（符合 AskUserQuestion <=4）。

### 4) Seed 4 题：主 Agent 生成 + Full pack 后台生成
- Seed 阶段：4 题必须有区分度（不同 subpoints + 不同难度），用于定位 level 区间。
- Full pack：异步由 Gemini CLI 生成（taxonomy + qbank + regression skeleton）；主 Agent 读取后继续评估。
- 需要新增：异步 job 状态（pending/running/done/failed）与缓存 key（topic_id + taxonomy_version + language + generator_version）。

### 5) 去自评：自动评分 + 轻量校准
- 自动评分：LLM 评分 + 证据提取（subpoints 覆盖、正确性、边界条件）。
- 轻量校准：只在低置信或结论跳变时，AskUserQuestion 让用户确认“结论是否符合”（不是自评答案对错）。

### 6) Bash 噪音优化
- 方向优先级：
  1) `append-profile-events-batch`（一次写多个事件，减少 Bash 次数）
  2) 每 4 题 flush 一次（降低中断感）
  3) 合并 pack 相关命令（ensure+status+read）为粗粒度 API

## Acceptance Targets (Cycle-4 sketch)
- create 体验：pre_context 每批 4 题；topic 覆盖校验含联想拓展；seed 4 题与 topic 强相关；Bash 噪音明显减少。
- 评估准确性：评分/证据可解释；用户校准路径存在且非强制每题触发。

