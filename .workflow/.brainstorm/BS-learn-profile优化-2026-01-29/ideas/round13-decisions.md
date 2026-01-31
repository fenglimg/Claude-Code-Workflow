# Round 13 - Decisions Locked

Timestamp: 2026-01-31T17:54:13+08:00

## Decisions

1) create 默认 full-assessment = “更完整采集 + topic 自动扩展 + is_minimal=false/metadata” + “必须进入题目评估（闭环）”

2) p-e2e-* 永远隐藏/隔离
- 不进入真实交互（select/list/默认 active）
- 不应写入 `.workflow/learn/state.json` 作为 active_profile_id
- fixture 必须迁移到测试/沙盒目录

3) Add Topic 完全移除
- topics 只来自 “用户描述 + Agent 联想拓展”
- 仍保留 AskUserQuestion 作为确认/纠错入口（但不是手工逐条录入）

