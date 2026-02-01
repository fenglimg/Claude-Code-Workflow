# Requirements (Cycle-2): learn:profile Flow vNext

Version: v1.0.0  
Cycle: `cycle-v1-20260131T223026-profileflow-jiehna`  
Source: `.workflow/.brainstorm/BS-learn-profile优化-2026-01-29/cycle-task-profile-flow-vnext.md`

---

## Goal

把 `/learn:profile` 做到：
- 全中文交互（AskUserQuestion question/header/options.description 都中文；option.value 可保持稳定枚举）
- create：
  - 强制背景输入（若已有历史背景可复用/更新）
  - pre_context_vNext 在背景解析前采集（每次 AskUserQuestion <= 4 题，可分批）
  - topic 覆盖校验 loop（推荐 topics + free text 补漏），替代 Add Topic
  - 默认 `--full-assessment=true` 且进入单 topic 评估入口（internal assess.js）
- update：
  - 不做背景联想（目标已明确）
  - （若能判定同 pack_key 已评估）提示无需评估并退出；否则进入单 topic 评估入口
- 彻底移除/隐藏：`--no-assessment`、Add Topic、英文碎片；selectFlow 在 UI 中不作为主路径
- 永久隔离/隐藏 `p-e2e-*` profiles（不展示、不允许成为 active_profile_id）

## Constraints

- 不新增 `/learn:assess` slash command；评估逻辑仍由 `.claude/commands/learn/_internal/assess.js` 提供
- `/learn:profile` 不添加 `Write(*)`；所有落盘继续走 `ccw learn:*` CLI
- 必须保持现有 profile.md doc contract tests 通过（特别是 Phase 4/5 headings + select/show API usage + scratchpad markers）

## Deliverables

- `.claude/commands/learn/profile.md`：
  - create/update 的交互与文案中文化
  - 背景强制输入（含复用/更新）
  - topic 覆盖校验 loop
  - 移除 Add Topic（不再对用户暴露）
  - select/show 仍存在且保持 ccw API 使用（测试约束）
- `ccw`：
  - `learn:list-profiles` 过滤 `p-e2e-*`
  - `learn:set-active-profile` / `learn:update-state active_profile_id` 禁止 `p-e2e-*`

## Non-goals (Cycle-2 不做)

- taxonomy-first resolve 的真实实现（仅解释概念；真正 mapping 在 Cycle-3）
- full assessment algorithm / stop conditions（Cycle-3）

## Acceptance

- create 跑通：
  - 必填背景 -> parse background -> topic 覆盖校验 loop -> 选择 1 topic -> 调用 assess.js
- update 跑通：
  - 不触发背景联想 -> 可手动进入单 topic 评估入口
- `p-e2e-*` 不会出现在列表/选择中，也不能成为 active_profile_id

