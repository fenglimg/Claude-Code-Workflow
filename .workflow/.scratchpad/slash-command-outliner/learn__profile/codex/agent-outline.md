# Agent Outline：learn:profile

## Purpose

实现 `/learn:profile`：在 CCW learn 工作流内提供 Profile 的 create/update 交互，并可触发 Cycle-4 区间评估；所有持久化通过 `ccw learn:*` 完成，确保原子化与 schema 校验。

## Execution Model

- 优先增量实现：先跑通 Create（含 pre-context + background + topic coverage）→ 再接入 assessment → 最后完善 Update 菜单。
- 复用既有模式：参考 `.claude/commands/learn/plan.md` / `.claude/commands/learn/execute.md` 的 CLI State API 用法、best-effort 事件/遥测策略与 UX 约束。

## Implementation Checklist（按最小可交付拆分）

1) Slash 文档骨架
   - 目标：frontmatter + 核心章节齐全（P0 gate）
   - 输出：`.claude/commands/learn/profile.md`
2) Topic V0 基础能力
   - label normalization + topic_id 生成
   - alias_to_canonical 显式合并策略（只读展示旧 known_topics，不进候选池）
3) Create Flow（Phase A）
   - pre_context：两批 AskUserQuestion（每批 4 题）
   - background_text：读 state/profile，复用或更新
   - candidates（<=16）：轻量启发式生成 + 单句 why
   - coverage loop（<=3）：4x4 grid 分摊到 4 questions + free text 补漏 + Covered/More
   - persist：`ccw learn:write-profile` + `ccw learn:update-state active_profile_id`
   - best-effort：events batch + telemetry
4) Assessment Flow（Cycle-4）
   - `_internal/assess.js`：实现 `createAssess` 工厂 + `assessTopic({profileId, topicId, language})`
   - pack：seed 阻塞 + full 异步
   - loop：最多 6 题 + stop conditions + interval update + batch events
   - settle：写回 profile.known_topics + summarized event + propose inferred skill（best-effort）
5) Update Flow（Phase B）
   - load profile
   - menu：Preferences（复跑 pre_context + FIELD_SET）/ Assess Topic（走 assess.js）

## Dependencies / Touchpoints（不新增不必要抽象）

- CLI：`ccw/src/commands/learn.ts`（state/profile/events/packs/taxonomy 的权威路径与 schema）
- Slash corpus：
  - `.claude/commands/learn/profile.md`（命令入口）
  - `.claude/commands/learn/_internal/assess.js`
  - `.claude/commands/learn/_internal/mcp-runner.js`
  - `.claude/commands/learn/_internal/error-handler.js`
  - `.claude/commands/learn/_internal/json-parser.js`

## Validation Strategy

- P0 gates（必须）：
  - frontmatter：`name/description/allowed-tools` 完整
  - allowed-tools：不缺工具、不引入未支持工具
  - core sections：`Overview/Usage/Execution Process/Outputs/Artifacts/Error Handling`
  - artifact references：全部落在 `.workflow/learn/**`，且写入通过 `ccw learn:*`
- CLI 快速验证（建议顺序）：
  - `ccw learn:read-state --json`
  - `ccw learn:list-profiles --json`
  - 走一遍 `/learn:profile create`（不评估：`--full-assessment=false`）
  - 再走 `/learn:profile update` + `Assess Topic`
- 非回归（可选）：
  - 参考现有 outliner cycle：`.workflow/.cycle/cycle-v1-20260203T001806-slashcmdoutliner-qmhuep.progress/`
  - 若修改了命令 frontmatter/章节结构：跑对应的 snapshot gate（避免影响已 completed 的 corpus）

## Error Handling Rules（统一口径）

- 任何 Bash JSON 参数必须做单引号转义
- CLI JSON 输出优先使用健壮解析（容忍噪音）
- telemetry / events append 失败不阻断主流程（best-effort）
