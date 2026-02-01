# Cycle-4 Issues (Draft): UX + Seed + Scoring/Calibration + Bash Noise

## UX-1: pre_context 批次呈现为 4 题/批（定位 UI vs 脚本）
**Goal**: 体验上每批 4 题（<=4），不出现“只显示 2 题/批”的困惑。  
**Acceptance**:
- 若 UI 限制：修 UI/渲染；若脚本问题：修脚本分批逻辑
- 最终用户观感：每批 4 题

## UX-2: profile 默认复用（默认 profileId 固定）
**Goal**: `/learn:profile create` 默认复用同一 profile。  
**Acceptance**:
- 默认 profileId 解析优先级：
  1) 显式 `--profile-id <id>`
  2) 否则复用 `active_profile_id`（前提：不是 `p-e2e-*`）
  3) 否则使用固定默认 id：`profile`
- create 语义变为 upsert（不存在则创建；存在则复用并按策略更新）
- background 强制输入语义：
  - 若不存在 background：必须输入
  - 若已存在 background：必须让用户选择 `复用` / `更新`
- background 持久化策略：profile 文件保留 latest（覆盖写），历史在 events 保留审计
- 仍支持 `--profile-id` 显式创建新 profile
- 不影响 `p-e2e-*` 隔离规则

## UX-3: topic 覆盖校验 loop 加入“主 Agent 联想拓展”
**Goal**: 覆盖校验不仅仅是 parse + 选择，还能引导用户补全遗漏方向。  
**Acceptance**:
- 背景粘贴/更新完成后：进行 **一轮** Top-4 推荐 + 理由
- 用户可“确认/否认/补充（type something）”
- 后续补漏依赖覆盖校验 AskUserQuestion loop（基于用户反馈继续添加）

## UX-4: Seed 4 题改为主 Agent 阻塞生成（有区分度）
**Goal**: seed 题不固定模板，强相关 topic+背景，4 题覆盖 4 个能力节点。  
**Acceptance**:
- 4 题覆盖不同 subpoints（至少 2 must）
- 难度有梯度
- 题干可判定（例子+边界+取舍/推理链）

## UX-5: 去自评（完全移除）+ 答题确认/校准
**Goal**: 不再让用户自评对错；补齐“答题确认/校准”入口。  
**Acceptance**:
- 题目作答后：AskUserQuestion 提供“确认提交/重新编辑/跳过”
- 校准触发：低置信或结论跳变时展示系统摘要，允许用户纠正；纠正会触发继续追问而非盖章确认

## UX-6: 自动评分（rubric + evidence extraction）
**Goal**: 用自动评分替代自评，产生可解释证据（subpoints 覆盖/正确性/边界意识）。  
**Acceptance**:
- 每题输出：score + evidence（命中 subpoints + 理由/引用片段）
- 评分失败：必须 graceful degradation（例如改为追问/换题/提示需要更多信息），但不回退到“自评”

## UX-7: Bash/CLI 降噪（batch/flush/合并）
**Goal**: 一次 topic 评估明显减少 CLI 调用次数与中断感。  
**Acceptance**（至少一项落地）:
- `learn:append-profile-events-batch` 或
- 每 4 题 flush 一次 或
- 合并 pack ensure/read/status 的粗粒度命令

## Tests
- profile reuse：create 两次不会产生新 profile id（默认），且 schema 仍 valid
- seed 生成：4 题输出结构稳定（id/level/subpoints）
- 无自评：评估流程中不出现 correct/partial/wrong 的 AskUserQuestion
- 事件写入：batch/flush 生效（smoke test：事件写入次数下降）
