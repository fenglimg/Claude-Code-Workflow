# Round 12 Deep Dive - Execution Issues Triage

Timestamp: 2026-01-31T17:46:08+08:00
Context: 2026-01-29 brainstorm 的后续执行反馈，聚焦 learn:profile 的交互与 full-assessment 预期。

---

## 0) What “Good” Looks Like（目标体验）

用户输入学习目标与（可选）背景后：
1. 系统用中文问完必要问题（偏好/约束），不出现突兀的英文确认句。
2. 系统可以基于背景 + 联想自动生成/补全 topic 列表，并清晰说明“为什么推断”。
3. 不出现测试 profile id（如 p-e2e-001）干扰真实使用。
4. full assessment 的定义明确，且存在完整闭环（能评估某 topic、写入事件、可回滚/可解释）。

---

## 1) Issue -> Root Cause -> Fix Candidates

### 1.1 “Confirm your familiarity with typescript” 突兀
Root cause:
- `.claude/commands/learn/profile.md` 在背景 parse 后直接进入 inferred skills 逐条确认，且 question 是英文句式。

Fix candidates:
- UX：增加过渡说明 + 中文化 + 批量跳过选项（Top-N 只确认最关键的几个）。
- Flow：将 inferred skills 由“逐条问答”改为“summary + 纠错入口”，默认写入 inferred=proposed。

### 1.2 提问/选项中英混杂
Root cause:
- profile 的多个 AskUserQuestion 模板仍保留英文 header/question/description。

Fix candidates:
- 全面中文化 UI 文案；保留 `value` 为稳定英文枚举（避免数据/逻辑漂移）。
- 形成统一 i18n 约定：`label/description` 中文，`value` 英文常量。

### 1.3 出现 --profile-id p-e2e-001
Root cause hypotheses:
- `.workflow/learn/profiles/` 中存在 e2e fixture（p-e2e-001），`select`/`list` 可能无过滤；或全局 state 被测试写入。

Fix candidates:
- 隔离：把 e2e fixture 放到测试沙盒目录，不进入真实 `.workflow/learn/profiles/`。
- 过滤：list-profiles / select UI 默认隐藏 `p-e2e-*`，除非显式 `--include-test-profiles`。
- 状态保护：真实模式下拒绝将 active_profile_id 设为 `p-e2e-*`（fail fast）。

### 1.4 create 默认应为 --full-assessment
Root cause:
- `.claude/commands/learn/profile.md` 仅在用户显式传 `--full-assessment` 才将 `is_minimal=false`。

Fix candidates:
- 调整默认：`create` 默认 full assessment；新增 `--minimal` 反向开关（或保留 `--no-assessment`）。
- 明确 full assessment 的语义：是“更多采集 + topic 自动扩展”还是“必须进入题目评估”。

### 1.5 背景解析需要 Agent 联想拓宽技术栈
Root cause:
- 当前 background parsing 以 deterministic（KeywordDictionary）为主，缺少“生态/邻接技术栈”扩展层。

Fix candidates:
- 增加 Agent 推断层：输入（背景、目标、已知 topics）→ 输出（proposed topics + reasons + confidence）。
- 约束输出 schema：topic_id、reason、evidence、confidence、source（deterministic/agent/goal）。

### 1.6 full assessment 下 Add Topic 流程突兀
Root cause:
- `collectKnownTopicsMinimal()` 有 “Do you want to add …” + “Add Topic” 的循环式录入，属于硬切换。

Fix candidates:
- full assessment 模式下禁用该循环；改为“系统生成 topics → 你觉得缺了什么？（一次性补充）”。
- 把“手工逐条添加”移动到 `update` 的高级入口（而不是 create 的主路径）。

### 1.7 完整评估某 topic 流程缺失
Root cause:
- `/learn:plan` 中明确“JIT Assessment removed”，说明评估链路目前不在 plan 阶段。
- profile/create 也没有“评估题目/任务 -> 评分 -> 写 events”的实现，导致“full-assessment”只有 metadata。

Fix candidates:
- 新增 `/learn:assess` 或在 `/learn:execute` 做 preflight assessment。
- 使用 assessment packs：topic -> taxonomy/subpoints + rubric + questions + regression skeleton。

### 1.8 是否 profile.md 更新导致失效
How to verify quickly:
- 以真实路径跑一遍：create → plan → execute（或至少 create → show）。
- 针对关键点做回归：背景 parse 成功/失败分支、AskUserQuestion key 读取、runCcwJson JSON 解析。

---

## 2) Proposed Next Actions（可落地任务草案）

P0（体验止血）:
1. profile 全面中文化（仅 UI 文案）
2. inferred skills 确认加入过渡说明 + Top-N + “跳过/稍后”
3. 过滤/隔离 e2e profiles（避免 p-e2e-001 出现在真实交互）

P1（行为对齐）:
1. create 默认 full assessment（与产品定义对齐）
2. 移除 create 主路径的“Add Topic 循环”（保留一个一次性补充入口）

P2（能力补齐）:
1. Agent 联想扩展 topics（proposed + provenance）
2. 落地 topic-level assessment 闭环（/learn:execute preflight 或 /learn:assess）

