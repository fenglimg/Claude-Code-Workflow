# Requirements (Cycle-1): Assessment Plumbing

Version: v1.0.0  
Cycle: `cycle-v1-20260131T215441-assess-owxkvc`  
Source: `.workflow/.brainstorm/BS-learn-profile优化-2026-01-29/cycle-task-assess-plumbing.md`

---

## Goal

把“topic 评估闭环”的最小可运行链路接起来，使 `/learn:profile` 能：
1) 加载内部模块 `.claude/commands/learn/_internal/assess.js`（函数工厂注入）
2) 通过 `ccw learn:*` 写入 assessment pack（resolve-pack-key/read-pack/write-pack）
3) 通过 `ccw learn:append-profile-event` 写入 `ASSESSMENT_*` events（显式白名单）

## Non-Goals（本 cycle 不做）

- 不实现最终 full assessment 算法（max=20/stop conditions/must-cover 等放到 Cycle-3）
- 不实现 taxonomy-first resolve / taxonomy index 治理（放到 Cycle-3）
- 不重写 `/learn:profile` 的最终 create/update 流程（中文化/去 AddTopic 等放到 Cycle-2）
- 不新增 `/learn:assess` slash command（评估逻辑仅 internal module）

## Hard Constraints

- `/learn:profile` 不增加 `Write(*)`；所有落盘必须走 `ccw learn:*` CLI
- `/learn:profile` 需要增加 `Read(*)`（为 internal module / future reads）
- 禁止 `eval` 式全局污染：internal module 通过 ESM + 工厂注入
- `ccw learn:append-profile-event` 必须执行显式 type 白名单（包含 `ASSESSMENT_*`），拒绝任意 type
- 交互中文（本 cycle 至少保证 assessment 相关问答中文）

## Deliverables

### D1) `/learn:profile` 最小改动

- `.claude/commands/learn/profile.md`
  - frontmatter `allowed-tools` 增加 `Read(*)`
  - 文档/解析逻辑移除 `--no-assessment`（改为只保留 `--full-assessment`）
  - 最小评估入口：在 create/update 的可达路径中调用 internal assess（至少跑 1 题）

### D2) Internal module：`assess.js`

- 新增 `.claude/commands/learn/_internal/assess.js`
  - `export function createAssess(deps) { ... }`
  - `deps` 至少包含：`AskUserQuestion`, `Bash`, `Read`
  - 对外提供：`assessTopic({ profileId, topicId, language })`（或等价 API）
  - 最小交互：问 1 题（中文，允许 type），并写入 `ASSESSMENT_*` events
  - 通过 `ccw learn:write-pack` 生成/保存最小 pack（至少包含 1 题）

### D3) Pack CLI（P0）

在 `ccw` 中新增命令：
- `ccw learn:resolve-pack-key`
- `ccw learn:read-pack`
- `ccw learn:write-pack`（overwrite）

存储根目录：`.workflow/learn/packs/`

### D4) 事件白名单

- `ccw learn:append-profile-event`：
  - 支持写入：既有 profile events + `ASSESSMENT_*`
  - 非白名单 type：返回清晰错误（含允许列表）

### D5) Tests

- CLI roundtrip：
  - write-pack -> read-pack 内容一致
  - resolve-pack-key 默认值稳定
- whitelist：
  - 允许的 `ASSESSMENT_*` 可写
  - 非法 type 失败（exit code 非 0 + json error）

## Acceptance Criteria（验收）

- `/learn:profile` 运行时：
  - 能 `import` internal module 并注入依赖
  - 能至少完成 1 次“问 -> 答 -> 写 event -> 写 pack”
- `ccw`：
  - 3 个 pack 命令存在且可用
  - append-profile-event 白名单生效且不破坏已有测试

## Edge Cases

- pack 不存在：assess 生成最小 pack 并写入
- pack 已存在：assess 读 pack 并复用题目
- 用户选择 skip：仍写入 session started + question asked，但 answer recorded 可为空（或标记 skipped）
- schema/snapshot：assessment event 被 snapshot fold 忽略（forward compatible），但必须能写入 events 文件

