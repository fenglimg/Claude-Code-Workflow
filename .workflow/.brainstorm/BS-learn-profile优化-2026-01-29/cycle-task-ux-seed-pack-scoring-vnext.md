# Cycle-4 Task (Draft): UX Polish + Seed 4Q Generator + No Self-Rating + Bash Noise Reduction

**Source Session**: `BS-learn-profile优化-2026-01-29`  
**Based On**: 真实体验反馈（Round 41）  
**Depends On**: Cycle-1/2/3 已完成（pack CLI + profile vNext + taxonomy/pack/assessment vNext）

---

# Main Objective

把当前“能跑通”的 learn:profile create/full-assessment 流程，升级为“体验顺滑 + 评估更可信”的版本：
- pre_context 批次体验稳定（每批 <=4，尽量 4/批）
- profile 默认复用（不每次 new）
- topic 覆盖校验加入主 Agent 联想拓展引导
- seed 题改为主 Agent 阻塞生成 4 题（有区分度、覆盖 4 个能力节点）
- 去掉用户自评（完全移除）
- 补齐“答题确认/校准”交互（不是自评对错）
- 减少可见 Bash/CLI 噪音（批量写入/合并调用/阶段性 flush）

---

# Locked Decisions

1) **去自评**：完全移除（不使用 correct/partial/wrong 自评，也不做 fallback）。  
2) **Seed=4**：主 Agent 阻塞生成 4 题，4 题≈4 个能力节点（每题约 25%）。  
3) **profile 默认复用**：create 不再默认创建新 profile id。

---

# Acceptance Criteria

## A) pre_context 批次与体验
- AskUserQuestion 的 pre_context 采集：
  - 每次调用最多 4 题
  - 体验上应呈现为“4 题/批”（若 UI 只显示 2 题/批，则需要确认是 UI 限制还是脚本逻辑问题）

## B) profile 默认复用
- 默认 profileId 解析优先级：
  1) 显式 `--profile-id <id>`
  2) 否则复用 `active_profile_id`（前提：不是 `p-e2e-*`）
  3) 否则使用固定默认 id：`profile`
- create 语义变为 upsert（不存在则创建；存在则复用并按策略更新）。
- background 强制输入语义：
  - 若不存在 background：必须输入
  - 若已存在 background：必须让用户选择 `复用` / `更新`
- background 持久化策略：profile 文件保留 latest（覆盖写），历史在 events 保留审计。

## C) topic 覆盖校验加入联想拓展
- 在背景粘贴/更新完成后，加入 **一轮** “联想拓展”阶段：
  - 主 Agent 输出 Top-4 关联 topics（含理由）
  - AskUserQuestion 让用户确认/否认/补充（type something）
- 后续依赖 topic 覆盖校验 AskUserQuestion loop 基于用户反馈继续补全遗漏 topics

## D) Seed 4 题生成（阻塞，保证区分度）
- seed 题不再固定模板；必须依据：
  - topic_id
  - 用户背景（background.raw_text/summary）
  - taxonomy must/core subpoints（如存在）
- 4 题覆盖 4 个“能力节点”，要求：
  - 覆盖 must/core 的不同子点（至少 2 个 must）
  - 难度分布有梯度（例如 2/3/4/5 或 2/3/3/4）
  - 题干明确“可判定”的输出（要求例子 + 边界 + 取舍）
 - **字段级 contract（用于可测试）**：seed 4 题输出应包含：
   - `id`（稳定、可追踪，建议 `seed-q1..seed-q4`）
   - `phase`（固定为 `seed`，便于后续 full bank 混入同一 pack）
   - `capability_node`（四选一；每题必须不同，表示“25% 能力节点”）
   - `difficulty`（0..1，固定 4 个难度点；建议 `0.25/0.45/0.65/0.85`）
   - `subpoint_ids[]`（如 taxonomy 存在则必填；至少 2 题命中 must）
   - `prompt`（中文；必须包含：例子 + 边界/坑 + 推理链/取舍）

## D2) 连续能力收敛（0..1，0.1 粒度停止）
- 维护 `ability_interval=[lo,hi]`，初始 `[0,1]`。
- 允许结束本 topic 评估的必要条件之一：`hi-lo <= 0.1`（并叠加 must/core 覆盖条件）。
- Seed 4 题的作用：快速把区间从 `[0,1]` 缩小到一个“可继续收敛”的窗口（通常 <=0.2~0.35）。

## E) 评分与校准（去自评）
- 不再 AskUserQuestion 让用户评“对/错/部分对”。  
- 取而代之：
  - 自动评分（rubric + evidence extraction）
  - 答题确认：用户提交后可“确认提交/重新编辑/跳过”（避免采集错误）
  - 校准入口：当系统置信度不足或结论跳变时，向用户展示“系统理解/判定摘要”，允许用户纠正（纠正触发继续追问，而不是简单盖章确认）

## F) Bash/CLI 降噪
- 目标：一次 topic 评估过程中，明显减少 CLI 调用次数与可见中断感。
- 至少落地一项：
  - `ccw learn:append-profile-events-batch`（批量追加事件）
  - 或“每 4 题 flush 一次事件”（降低调用频率）
  - 或把 pack ensure/read/status 合并成更粗粒度命令

---

# Deliverables

1) `/learn:profile` UX 改动（create/update/assessment 入口）
2) Seed 4 题生成器（主 Agent 阻塞生成）
3) 自动评分 + 校准交互设计（无自评）
4) CLI/事件写入降噪（batch/flush/合并命令）
5) 回归测试与体验用例（至少覆盖：profile reuse、seed 生成、无自评、事件写入次数下降的 smoke 级验证）
