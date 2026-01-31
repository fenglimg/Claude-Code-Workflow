# Round 14 - Desired learn:profile Flow (Spec + Diagram)

Timestamp: 2026-01-31T18:38:11+08:00

## Flags (new)
- Remove: `--no-assessment`
- Keep: `--full-assessment` (default true)

## Core Changes
1) backgroundText 非空 => deterministic parse + Agent 扩展联想 => AskUserQuestion loop 校验 topics 覆盖
2) pre_context 从 4 问扩展为“学习相关但与目标无关因素”的完整概述（版本化、可跳过/后置补全）
3) 移除手工 Add Topic（create/update 都不再逐条录入 topic id）
4) full-assessment 必须包含 “topic-level 能力评估闭环”
5) topic 评估结束后允许继续评估下一 topic 或结束
6) selectFlow 可去除（或隐藏为内部调试命令）

## Desired Flow Diagram (non-mermaid)

```
/learn:profile <op> [profile-id?] [--goal="..."] [--full-assessment]
  |
  +--> parse args/flags
  |     - fullAssessment = true (default)
  |
  +--> switch(op)
        |
        +--> create
        |     |
        |     +--> AskUserQuestion: 背景（可选，支持粘贴/跳过）
        |     |
        |     +--> [if background provided]
        |     |     |
        |     |     +--> ccw learn:parse-background (deterministic)
        |     |     +--> Agent expand (关联/生态/邻接技能栈，带 provenance)
        |     |     +--> AskUserQuestion Loop: “识别到的 topics 列表是否完整/正确？”
        |     |           - 用户：确认/否认/补充（用自然语言描述缺失项）
        |     |           - Agent：把补充描述映射为 topic ids，回到 loop 直到确认
        |     |
        |     +--> AskUserQuestion: pre_context_vNext（学习相关但与目标无关因素，版本化，可跳过/稍后补）
        |     |
        |     +--> write profile (is_minimal=false + metadata 完整)
        |     +--> write inferred topic proposals (events: propose/confirm/reject)
        |     +--> set active_profile_id
        |
        |     +--> full-assessment: Topic Assessment Loop (必须)
        |           |
        |           +--> 选择要评估的 topic（默认从“背景+联想+目标”Top-N 开始）
        |           +--> ensure/generate assessment pack（taxonomy + question bank + rubric）
        |           +--> AskUserQuestion: 纯文本作答（多轮）
        |           +--> scoring + 写 events + fold snapshot
        |           +--> AskUserQuestion: 继续评估下一个 topic / 结束并记录
        |
        +--> update
        |     |
        |     +--> read profile
        |     +--> AskUserQuestion: 本次更新是“补充背景/更新偏好/基于目标做评估/查看”？
        |     |
        |     +--> 若补充背景：走“背景解析+联想+确认 loop”，写入 inferred events
        |     +--> 若更新偏好：走 pre_context_vNext（版本化），写 FIELD_SET events
        |     +--> 若基于目标评估：进入 Topic Assessment Loop（同 create）
        |     +--> write profile
        |
        +--> show
              |
              +--> read profile + snapshot
              +--> 输出 asserted/inferred + 已评估 topics 状态
```

