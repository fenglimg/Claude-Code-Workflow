# Summary (Cycle-2): learn:profile Flow vNext

✅ `/learn:profile` create/update/select/show 的 AskUserQuestion 交互已中文化。  
✅ create 阶段背景信息必填，且支持复用/更新历史背景。  
✅ pre_context_vNext 已提前到背景解析前，并按“每次<=4题”分批采集。  
✅ topic 覆盖校验 loop 已落地（推荐 topics + free text 补漏），手工 Add Topic 流程已移除。  
✅ create 默认 `--full-assessment=true`，并强制进入单 topic 评估入口（internal assess.js）。  
✅ `p-e2e-*` profile 永久隔离：不会出现在 list/select，也不能成为 active_profile_id。  
✅ `npm test` 全绿（205/205）。

主要代码落点：
- `.claude/commands/learn/profile.md`
- `ccw/src/commands/learn.ts`

下一步建议：进入 Cycle-3（taxonomy index + pack completeness + full assessment algorithm）。

