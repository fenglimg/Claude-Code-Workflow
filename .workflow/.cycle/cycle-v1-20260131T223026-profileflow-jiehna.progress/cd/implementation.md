# Implementation (Cycle-2): learn:profile Flow vNext

Version: v1.0.0  
Cycle: `cycle-v1-20260131T223026-profileflow-jiehna`

---

## Changes Implemented

### 1) p-e2e-* 永久隔离/隐藏（后端强约束）

Updated `ccw/src/commands/learn.ts`:
- `learn:list-profiles`: filters out any profile file starting with `p-e2e-`
- `learn:set-active-profile`: rejects `p-e2e-*` with `FORBIDDEN_TEST_PROFILE`
- `learn:update-state --field active_profile_id`: rejects `p-e2e-*` with `FORBIDDEN_TEST_PROFILE`

This prevents both UX exposure and accidental `active_profile_id` pollution.

### 2) /learn:profile create vNext（全中文 + 背景必填 + pre_context 在前 + topic 覆盖校验 loop + 默认进入单 topic 评估）

Updated `.claude/commands/learn/profile.md`:
- `collectBackgroundTextRequired()`:
  - background is required on create
  - if an existing active profile has background, offers reuse/update
- `preContextVNext()`:
  - personal-only question set
  - asked in 2 batches (4 questions each) to satisfy “AskUserQuestion <= 4 per call”
- Create flow order:
  1) pre_context_vNext
  2) background capture (required)
  3) `ccw learn:parse-background` -> recommended topics
  4) `topicCoverageValidationLoop()` -> confirm + free-text补漏 (max 3 rounds)
  5) persist profile (background stored in `profile.background.raw_text/summary`)
  6) default `--full-assessment=true` -> must enter single-topic assessment via internal `assess.js`

### 3) Update flow（不做背景联想 + 入口中文）

Updated `.claude/commands/learn/profile.md`:
- update options are Chinese
- removed manual “Add Topic” UI option and implementation
- kept an explicit “单 topic 评估” entry (calls internal assess module)

### 4) Select/Show flow 中文化（保持 doc tests 的 Phase 4/5 约束）

Updated `.claude/commands/learn/profile.md`:
- selectFlow/showFlow prompts/messages translated to Chinese
- preserved headings `### Phase 4` / `### Phase 5` and ccw learn:* API usage for tests

## Notes

- “Topic resolve (taxonomy-first)”目前仅在文档/解释层面出现；真实 taxonomy index/mapping 在 Cycle-3 落地。
- full assessment 算法与 pack 完整性 gate 仍在 Cycle-3。

