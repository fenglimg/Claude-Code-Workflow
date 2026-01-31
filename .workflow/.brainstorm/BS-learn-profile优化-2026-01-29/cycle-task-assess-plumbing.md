# Generated Task (brainstorm-to-cycle)

**Generated**: 2026-01-31T21:39:30+08:00  
**Source Session**: BS-learn-profile优化-2026-01-29  
**Goal (per latest discussion)**: 先让 `/learn:profile` 能加载 `.claude/commands/learn/_internal/assess.js` + 能写 pack + 能写 assessment events。

---

# Main Objective

Assessment Plumbing（P0）：把“topic 评估闭环”的最小可运行链路接起来：
- `/learn:profile` 具备 `Read(*)`，可加载并调用 `assess.js`（函数工厂注入，避免 eval 污染）
- `assess.js` 能通过 `ccw learn:*` 写入：
  - assessment pack（read/write/resolve-pack-key）
  - `ASSESSMENT_*` events（append-only + 显式白名单）

# Success Criteria / Acceptance

- `/learn:profile`（create/update 任一入口）能够：
  1) `Read()` 加载 `.claude/commands/learn/_internal/assess.js`
  2) 进入“单 topic 评估”最小流程（至少 1 题/1 次回答）
  3) 触发 `ccw learn:write-pack` 写入 pack 到 `.workflow/learn/packs/...`
  4) 触发 `ccw learn:append-profile-event` 写入 `ASSESSMENT_*` 事件（且通过白名单校验）
- 所有交互中文（AskUserQuestion 文案/选项），不再出现突兀英文提问。

# Hard Constraints (Must Hold)

- 不新增 `/learn:assess` slash command；评估逻辑必须抽到 `.claude/commands/learn/_internal/assess.js`，由 `/learn:profile` 读取复用。
- `/learn:profile` 暂不添加 `Write(*)`；所有落盘通过 `ccw learn:*`（Bash 执行）。
- `--no-assessment` 删除，仅保留 `--full-assessment` 且默认 true。
- `ASSESSMENT_*` 事件类型必须显式白名单；不可继续“任意 type 都可写”。

# Deliverables

- `.claude/commands/learn/profile.md`：
  - allowed-tools 增加 `Read(*)`
  - 去掉 `--no-assessment`
  - 接入 internal assess 模块（factory injection）
  - 最小 topic 评估入口（先不追求最终算法与 pack 完整性）
- `.claude/commands/learn/_internal/assess.js`：
  - 导出 `createAssess(deps)`，返回可被 profile 调用的 `assessTopic()`（或等价 API）
  - 通过 `Bash` 调 `ccw learn:resolve-pack-key/read-pack/write-pack`
  - 写入 `ASSESSMENT_SESSION_STARTED/QUESTION_ASKED/ANSWER_RECORDED/SCORED/SESSION_SUMMARIZED` 等最小事件集
- `ccw` CLI：新增 P0 命令
  - `ccw learn:resolve-pack-key`
  - `ccw learn:read-pack`
  - `ccw learn:write-pack`（overwrite）
- `ccw learn:append-profile-event`：增加 `ASSESSMENT_*` types 白名单（并确保不破坏已有事件）
- Tests：覆盖 pack read/write/resolve-pack-key + assessment event 白名单（最少 80% 相关模块覆盖）

# Notes / Follow-ups (Not in this cycle)

- 本 cycle 只做“管道打通”。后续 cycle 再实现：
  - background 强制输入 + 背景联想拓展 + topic 覆盖校验 loop
  - taxonomy-first topic resolve + taxonomy index 治理
  - 完整评估算法（max=20 + must-cover/coverage/confidence/stability stop 条件）
  - seed=4 快速定位 + 同 pack 补全到 full completeness

