# Issues / Follow-ups (Cycle-2)

## Done in this cycle

- 全中文 create/update/select/show 交互（AskUserQuestion 文案/选项）
- create 背景必填（支持复用/更新）
- pre_context_vNext（分批<=4题）提前到背景解析前
- topic 覆盖校验 loop 替代 Add Topic（推荐 + free text 补漏）
- create 默认进入单 topic 评估（full-assessment=true 时必须进入）
- p-e2e-* 永久隔离/隐藏（list/select/active_profile_id）

## Still pending (next cycles)

- Update 分支的“目标 topic 已评估（同 pack_key）则直接退出”判定（需要 Cycle-3 的 pack_key/noop/索引）
- taxonomy-first resolve + `.workflow/learn/taxonomy/index.json` 治理（Cycle-3）
- 完整 full assessment loop（max=20 + must-cover/coverage/confidence/stability stop conditions，Cycle-3）

