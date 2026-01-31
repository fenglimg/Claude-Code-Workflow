# Cycle Issues (P0): Assessment Plumbing

**Generated**: 2026-01-31T21:39:30+08:00  
**Source**: `BS-learn-profile优化-2026-01-29/synthesis.json` addenda + 最新讨论决策（internal assess module + pack CLI + assessment events）

---

## AP-1: `/learn:profile` 增加 `Read(*)` + 移除 `--no-assessment`（默认 full-assessment=true）

**Goal**: 让 profile 能加载 internal 模块并对齐最新 flags 约定。

**Acceptance**
- `.claude/commands/learn/profile.md` allowed-tools 增加 `Read(*)`
- argument-hint 移除 `--no-assessment`；`--full-assessment` 默认 true（create/update 逻辑一致）
- AskUserQuestion 文案全中文（保留 option.value 作为稳定枚举即可）

**Tests**
- profile 配置解析/渲染不会因缺少 `Read(*)` 报错
- flags 回归：传 `--full-assessment=false` 时不进入评估；默认进入评估

---

## AP-2: 新增 `.claude/commands/learn/_internal/assess.js`（函数工厂 + 最小 topic 评估）

**Goal**: 把评估闭环抽成内部模块，供 profile 读取复用。

**Acceptance**
- 新增 `.claude/commands/learn/_internal/assess.js`
- 模块导出 `createAssess(deps)`（或等价），由 profile 通过 `Read()` 加载并调用
- 依赖通过注入传入：`AskUserQuestion`, `Bash`, `Read`（以及必要的工具），避免污染全局/避免 eval
- 最小流程可跑通：对单 topic 至少完成 1 轮（问 -> 答 -> 写事件）

**Tests**
- 单测：`createAssess` 依赖缺失时报错清晰
- 单测：构造假 deps（mock Bash/AskUserQuestion）可模拟“问答一次”并产出 expected 事件调用

---

## AP-3: `ccw` 新增 pack I/O 最小命令：read/write/resolve-pack-key

**Goal**: 让 profile/assess 能通过 `ccw learn:*` 落盘 pack（避免 profile 直接写文件）。

**Acceptance**
- `ccw learn:resolve-pack-key`：输入 topic_id + 版本号/语言 -> 返回 pack_key（规范化字段顺序/默认值）
- `ccw learn:read-pack`：按 pack_key 读出 pack（不存在返回明确状态）
- `ccw learn:write-pack`：overwrite 写 pack 到 `.workflow/learn/packs/{topic_id}/...`（路径/文件名可由实现定，但必须可逆）
- pack 结构至少包含：`pack_key`, `topic_id`, `language`, `taxonomy_version`, `question_bank_version`, `rubric_version`, `questions[]`（哪怕只有 seed）

**Tests**
- e2e（CLI）：write-pack -> read-pack roundtrip（内容一致）
- 契约：resolve-pack-key 对 language/version 字段缺省有稳定默认

---

## AP-4: `ASSESSMENT_*` 事件白名单 + 兼容已有事件类型

**Goal**: 禁止任意 type 写入；只允许 catalog 中的事件。

**Acceptance**
- `ccw learn:append-profile-event` 增加 `ASSESSMENT_*` 事件类型白名单
- 不破坏历史事件类型（已有 `PROFILE_CREATED` 等仍可写）
- 非白名单 type 写入报错清晰（包含允许列表/链接到文档位置）

**Tests**
- 单测：允许事件类型写入成功
- 单测：非法 type 写入失败（错误信息稳定）

---

## AP-5: 最小闭环验证脚本/说明（人工可复现）

**Goal**: 让“profile 加载 assess + 写 pack + 写 assessment events”可被快速验证。

**Acceptance**
- 文档/脚本说明包含：
  - 如何启动 `/learn:profile` 并触发评估入口
  - 验证 pack 生成位置（`.workflow/learn/packs/...`）
  - 验证 assessment events 已写入（events 文件/存储）
- 包含 1 个示例 topic_id（可用 `game_dev_core` 或临时 `provisional/*`）

**Tests**
- 无（此 issue 以可复现步骤为验收）

