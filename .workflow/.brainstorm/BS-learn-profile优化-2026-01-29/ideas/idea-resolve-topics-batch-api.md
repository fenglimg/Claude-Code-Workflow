# Idea: Batch resolve topics（避免 N+1 CLI 调用）

## Problem
`/learn:profile` 在 topic 覆盖校验/联想阶段会对每个 raw label 调一次 `ccw learn:resolve-topic`：
- 性能差（N+1）
- 输出聚合复杂（还要去重/减已有）
- 无法在“展示候选前”统一 canonicalize

## Goals
- 输入一组 raw labels，一次性返回“按输入顺序对齐”的解析结果
- 每条结果可表达：found / ambiguous / not_found
- 不改变现有单条命令的行为（兼容）

## CLI Shape（两种等价方案）

### Option A: 新命令（推荐：最清晰）
`ccw learn:resolve-topics --raw-topic-labels <json-array> [--json]`

### Option B: 兼容参数扩展
`ccw learn:resolve-topic --raw-topic-labels <json-array> [--json]`
（单条参数 `--raw-topic-label` 仍保留）

## Input / Output Contract (Proposed)

### Input
- `--raw-topic-labels '["Cocos Creator","跨平台开发","TypeScript"]'`

### Output (JSON)
```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "input": "Cocos Creator",
        "found": true,
        "topic_id": "cocos_creator",
        "resolution_source": "alias",
        "matched_alias": "Cocos Creator",
        "redirect_chain": [],
        "status": "active"
      },
      {
        "input": "跨平台开发",
        "found": false,
        "ambiguous": false,
        "candidates": []
      },
      {
        "input": "TypeScript",
        "found": true,
        "topic_id": "typescript",
        "resolution_source": "alias",
        "matched_alias": "TypeScript",
        "redirect_chain": [],
        "status": "active"
      }
    ]
  }
}
```

说明：
- `items[i]` 必须与输入数组 `raw-topic-labels[i]` 对齐
- ambiguous 时：
  - `found=false, ambiguous=true, candidates=[{topic_id,status,match_on}]`

## How /learn:profile uses it (Proposed)
1) 主 Agent 生成候选 `[{label, reason, source}]`（label 是 raw label）
2) 调用 resolve-topics 批量 canonicalize → 得到 `topic_id` 或 candidates
3) 在主进程做集合约束：
   - 按 canonical `topic_id` 去重
   - subtract 既有 profile topics
   - ambiguous 的 raw label 走“让用户选一个 candidate”的分支（不自动 ensure）
4) 再做 4x4 AskUserQuestion 分组展示（每组 <=4 options）

## Edge Cases / Risks
- 输入包含空字符串/重复：输出仍需对齐；去重由调用方负责
- 解析索引不存在/损坏：整体失败（IO_ERROR），但不应部分成功导致调用方难以处理
- 大批量输入：可以加上限（例如 128）防止滥用

## Success Criteria
- 同样 16 个候选 topics 的解析，从 16 次 CLI 调用降为 1 次
- ambiguous/not_found 的处理路径更清晰（先 canonicalize，再进入交互）

