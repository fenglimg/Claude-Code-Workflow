# Codebase Exploration - v1.0.0

## Document Status
| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Iteration | 1 |
| Updated | 2026-01-30T01:09:10+08:00 |
| Cycle | cycle-v1-20260130T010750-p0-aicdpz |

---

## Architecture Overview (Current)

- `/learn:profile` 的交互式流程主要定义在 `.claude/commands/learn/profile.md`。
- Learn 状态与 profile 的读写由 `ccw/src/commands/learn.ts` 提供（JSON 文件存储 + AJV schema 校验 + withLearnLock + atomicWriteJson）。
- Profile schema 在两处存在且目前内容一致：
  - `.claude/workflows/cli-templates/schemas/learn-profile.schema.json`（运行时 validator 使用）
  - `.workflow/learn/profiles/schemas/learn-profile.schema.json`（同 SHA256，注意避免未来漂移）

---

## Existing Patterns (3+ references)

1) AskUserQuestion 负载限制（max 4 questions per call）
- 参考：`.claude/commands/workflow/brainstorm/artifacts.md`（明确提示 max 4 questions per call）

2) 当前 learn:profile 初始化流程包含强制字段
- 参考：`.claude/commands/learn/profile.md`（存在 goal_type 与 experience_level 的 AskUserQuestion，并且是流程内必经）

3) Learn 存储与原子写入/校验
- 参考：`ccw/src/commands/learn.ts`（withLearnLock + atomicWriteJson + AJV validators）

---

## Integration Points for P0

### A) Init Flow（删强制项）
- `.claude/commands/learn/profile.md`
  - 现状：goal_type / experience_level 被作为交互式必答字段。
  - P0：将其改为可选或后置（不阻塞创建）。

### B) Profile 写入校验（experience_level）
- `ccw/src/commands/learn.ts` -> `learnWriteProfileCommand`
  - 现状：若 data.experience_level 缺失会抛错（阻塞写入）。
  - P0：与“不强制问经验自评”冲突，需要与 schema/validator 策略一起调整（见 DEC-001）。

### C) pre_context_v1.3（固定 4 问 + versioned）
- `.claude/commands/learn/profile.md`
  - 需要新增/替换为单次 AskUserQuestion(4 questions) 的模板化实现。

### D) 持久化 raw/parsed/provenance + events
- `ccw/src/commands/learn.ts`
  - P0 最小闭环：写入 PRECONTEXT_CAPTURED / FIELD_SET（事件模型细化在 Milestone B）。

---

## Risks & Mitigations

- Risk: `experience_level` schema/validator 目前强制必填，P0 不问会导致 write 失败
  - Mitigation: 做成可选字段（推荐），或引入 default + confidence（需要 schema 扩展）

- Risk: pre_context 模板文案与结构发生无意漂移
  - Mitigation: 模板版本化 + 快照测试/契约测试

- Risk: telemetry 字段变更导致仪表盘断裂
  - Mitigation: telemetry payload 契约测试 + 版本字段
