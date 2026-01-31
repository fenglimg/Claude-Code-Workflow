# Generated Task (Cycle 2): learn:profile Flow vNext（中文化 + 去除无效分支 + 进入单 topic 评估）

**Generated**: 2026-01-31T21:43:00+08:00  
**Source Session**: BS-learn-profile优化-2026-01-29  
**Depends On**: Cycle-1 `cycle-task-assess-plumbing.md`（assess.js + pack + assessment events 已打通）

---

# Main Objective

把 `/learn:profile` 的交互与文档（`profile.md`）按最新讨论方案落地成“可跑、全中文、闭环明确”的最终流程：
- create 强制背景输入（可复用历史背景），先做 pre_context_vNext（个人画像），再做 topic 覆盖校验 loop，默认进入 **单 topic** 评估
- update 不做背景联想；基于目标解析出的 topic，如果已在同 pack_key 下评估完成则直接提示“无需评估”并退出
- 移除/隐藏所有突兀与无意义分支：`--no-assessment`、手工 Add Topic、selectFlow、英文提问碎片
- 永久隔离/隐藏 `p-e2e-*` 测试 profiles（不进入真实交互，不污染 active_profile_id）

# Success Criteria / Acceptance

- `/learn:profile` 全链路 AskUserQuestion 文案/选项为中文（允许 option.value 为英文/稳定枚举）
- create：
  - 未提供背景时必须要求输入背景；存在历史背景时提供“复用/更新”选项
  - pre_context_vNext（通用学习画像）在背景解析前完成采集（每次 AskUserQuestion <= 4 题；可分批直到问完）
  - 进入 “topic 覆盖校验 loop”：展示推荐 topics + “type something” 补充缺失技能点；用户确认后进入评估
  - 默认 `--full-assessment=true` 且必须进入单 topic 评估入口（调用 internal assess 模块）
- update：
  - 不执行背景联想拓展（已有明确目标）
  - 若目标 topic 已评估（同 pack_key），直接提示并退出；否则进入单 topic 评估入口
- 交互中不出现 `p-e2e-001` 或任何 `p-e2e-*`
- `--no-assessment` 不再存在；`--full-assessment` 默认 true（可显式关闭）

# Deliverables

- `.claude/commands/learn/profile.md`：
  - 结构调整为 “流程图（非 mermaid）+ Phase 分段说明 + 关键约束”
  - 所有用户可见提问中文化
  - 删掉/隐藏：`--no-assessment`、Add Topic、selectFlow、英文碎片
  - create/update 分支行为按最新决策重写
  - 明确解释：Topic resolve (taxonomy-first) 的含义与输出（映射到 canonical topic_id）
- `ccw`（如需）：
  - profile list/select 时对 `p-e2e-*` 的过滤与隔离（不允许成为 active profile）

# Notes

- 本 cycle 侧重“交互与流程落地”，评估算法/pack 完整性/taxonomy 治理放到 Cycle-3。

