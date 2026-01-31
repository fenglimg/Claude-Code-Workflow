# Codebase Exploration - v1.1.0

## Document Status
| Field | Value |
|-------|-------|
| Version | 1.1.0 |
| Iteration | 2 |
| Updated | 2026-01-31T14:37:10+08:00 |
| Cycle | cycle-v1-20260130T010751-b-fwxlcr |

---

## Iteration 2 Delta

- DEC-101 已决策：JSONL per profile events（append-only）
- 已落地 CLI：snapshot rebuild / rollback（见 `cd/implementation.md`）
- 已添加 golden tests 覆盖 determinism + rollback

## Current Storage (Learn Profiles)

- Profile 文件存储：`ccw/src/commands/learn.ts`
  - 读取：`learnReadProfileCommand` -> `.workflow/learn/profiles/{id}.json` + AJV 校验
  - 写入：`learnWriteProfileCommand` -> `atomicWriteJson(profilePath, data, validator)`
  - 并发保护：`withLearnLock`（`.workflow/learn/.lock`）

- Profile schema：
  - `.claude/workflows/cli-templates/schemas/learn-profile.schema.json`（运行时使用）
  - `.workflow/learn/profiles/schemas/learn-profile.schema.json`（当前同 hash）

---

## Reusable Patterns (3+ references)

1) 原子写 + schema 校验 + 备份
- `ccw/src/commands/learn.ts` -> `atomicWriteJson`

2) JSONL append（可复用为事件日志）
- `.claude/commands/learn/_internal/logger.js` + `ccw/tests/learn-logger.test.js`
- `.workflow/issues/issues.jsonl` / `.workflow/issues/solutions/*.jsonl` 的 JSONL 读写与测试模式（`ccw/tests/issue-command.test.ts`）

3) 锁（避免并发写冲突）
- `ccw/src/commands/learn.ts` -> `withLearnLock`

---

## Integration Points for Milestone B

- 新增/扩展：profile_events 的存储与读写 API（建议与 learn 存储同目录体系：`.workflow/learn/profiles/...`）
- fold/rebuild：从 event stream 生成 snapshot（可能复用 atomicWriteJson 写 snapshot）
- inferred 状态机：需要落地在 schema + 业务逻辑（可能触及 `.claude/commands/learn/profile.md` 的交互确认/否认）

---

## Risks & Mitigations

- Risk: 事件存储格式选型影响原子性与恢复策略（DEC-101）
  - Mitigation: 优先 JSONL per profile + 严格一行一事件；读取时可跳过坏行并报警

- Risk: rebuild 成本随事件增长
  - Mitigation: 周期性 snapshot（fold checkpoints）或按版本增量 fold

- Risk: 旧 profile JSON 迁移
  - Mitigation: 首次写事件时生成 PROFILE_CREATED + 从旧 snapshot 生成“导入事件”，确保可回放
