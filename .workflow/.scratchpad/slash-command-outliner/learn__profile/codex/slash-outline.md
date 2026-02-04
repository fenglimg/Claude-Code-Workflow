---
name: profile
description: 管理用户学习档案，包括偏好采集、背景解析及基于区间的自适应能力评估
argument-hint: "[create|update] [profile-id] [--goal=\"<learning goal>\"] [--full-assessment[=true|false]]"
allowed-tools: TodoWrite(*), Task(*), AskUserQuestion(*), Bash(*), Read(*)
group: learn
---

# Learn:Profile（/learn:profile）

## Overview

- Goal：创建/更新用户学习档案（Profile），并可对指定 Topic 执行 Cycle-4 区间评估（Interval Assessment），产出 `proficiency`（0.0～1.0）与可追溯证据（events）。
- Persistence：所有状态写入必须通过 `ccw learn:*` CLI（原子化 + schema 校验 + lock），命令本身不直接编辑 `.workflow/learn/**`。

## Quick Start

```bash
/learn:profile create
/learn:profile create --goal="Master React Server Components"
/learn:profile update
/learn:profile update my-profile-id
```

## Usage

```bash
/learn:profile [create|update] [profile-id] [--goal="<learning goal>"] [--full-assessment[=true|false]]
```

## Arguments / Flags

- `op`（可选，默认 `create`）：`create` | `update`
- `profile-id`（可选）：
  - `create`：可不填（自动生成）
  - `update`：可不填（默认使用当前 `active_profile_id`）
- `--goal`（可选，仅 `create` 有效）：学习目标（用于后续偏好与计划生成联动）
- `--full-assessment`（可选，默认 `true`）：创建后是否立即进入 Topic 评估入口

## Core Data Model：Topic V0（扁平化 + Hash）

### Normalization（标准化）

- `raw_label` → NFKC → trim → 内部空白折叠 → lowercase
- 保留中文/Unicode 字符（不做 ASCII 限制）

### ID Generation（ID 生成）

- `topic_id = "t_" + sha1(normalized_label).slice(0, 12)`

### Dedup / Merge（去重/合并）

- 仅通过 `topic_id` 判重
- 别名合并必须显式声明：`profile.custom_fields.topic_v0.alias_to_canonical[alias_topic_id] = canonical_topic_id`

## UX Hard Constraints（P0）

- 单次 `AskUserQuestion` 调用：`questions.length <= 4`
- 单题 `options` 数量：保持在 2～4（multiSelect 场景也同样控制每题的 options）
- 同一次调用内：每个 `question` 文案唯一；同一题内 `option.label` 唯一

## Execution Phase Diagram (Code-Level)

```
Parse args → (Create|Update)
  ├─ Create:
  │   pre_context(2 batches) → background → topic candidates → coverage loop(≤3)
  │   → ccw learn:write-profile → best-effort events + set active_profile_id
  │   → optional full assessment
  └─ Update:
      load profile → menu(preferences | assess topic)
        ├─ preferences: rerun pre_context → FIELD_SET events → write-profile
        └─ assess topic: Cycle-4 assessment → update known_topics + summarized event → propose inferred skill
```

## Execution Process

### Phase A：Create Flow（/learn:profile create）

#### A1. Pre-Context 采集（两批各 4 题）

- Tool：`AskUserQuestion`
- Fields：
  - `learning_style`
  - `preferred_sources`
  - `hours_per_week`
  - `session_length`
  - `practice_intensity`
  - `feedback_style`
  - `pace`
  - `motivation`
- Output：写入 `profile.pre_context.parsed`（或 `profile.custom_fields.pre_context.parsed`，以现有 schema 为准）
- Event：`PRECONTEXT_CAPTURED`（best-effort）

#### A2. 背景录入（background_text）

- Bash（CLI）：
  - `ccw learn:read-state --json`
  - 如存在 `active_profile_id`：`ccw learn:read-profile --profile-id <id> --json`（best-effort）
- AskUserQuestion：
  - 若存在旧背景：询问“复用”/“更新”
  - 若不存在：强制要求输入（提供“查看示例”的 option）

#### A3. Topic 候选生成（<= 16）

- Source：背景文本（background_text）+ 轻量规则（regex/keywords）+ 简单联想（不引入新 taxonomy 推导）
- Output：`candidates[]`，每项包含：
  - `display_label`（原始展示）
  - `normalized_label`
  - `topic_id`
  - `why`（1 句推荐理由）

#### A4. 覆盖校验 Loop（最多 3 轮）

- UI：4x4 网格（概念上 16 个候选，分摊到 4 个 questions，每题 2～4 个 options）
- 每轮：
  1) multiSelect：用户勾选“我需要覆盖/评估的 topics”
  2) free text：补漏（允许输入中文 label；进入 Normalization → Hash）
  3) confirm：`Covered` / `More`
- Termination：用户选择 `Covered` 或达到 3 轮
- Output：
  - `topic_ids: string[]`
  - `topics_by_id: Record<topic_id, {display_label, normalized_label}>`

#### A5. 持久化（Profile + Active）

- Bash（CLI）：
  - `ccw learn:write-profile --profile-id <id> --data '<json>' --json`
  - `ccw learn:update-state --field active_profile_id --value <id> --json`
- Events（best-effort，允许失败不阻断）：
  - `ccw learn:append-profile-events-batch --profile-id <id> --events '<json-array>' --json`
  - `ccw learn:append-telemetry-event --event PROFILE_CREATED --profile-id <id> --payload '<json>' --json`

#### A6. 即时评估入口（默认开启）

- 条件：`--full-assessment !== false`
- AskUserQuestion：选择一个 Topic（支持输入 display_label；内部转换为 `topic_id`）
- 调用 Cycle-4 Assessment（见下文）

### Phase B：Update Flow（/learn:profile update）

#### B1. 加载 Profile

- Bash（CLI）：`ccw learn:read-profile --profile-id <id> --json`

#### B2. 菜单选择

- AskUserQuestion：
  - `Preferences`：重新运行 A1（pre-context）→ 写入 profile → `FIELD_SET` events
  - `Assess Topic`：输入/选择 Topic → Cycle-4 Assessment → 写入评估结果

## Cycle-4 Interval Assessment（核心算法）

### 初始化

- Inputs：`profileId`, `topicId`
- Skip：若在当前 Pack 版本下已存在 `ASSESSMENT_SESSION_SUMMARIZED` 且 `completed=true` → 提示复用并跳过
- State：
  - `lo = 0`, `hi = 1`
  - `sigma = 1`（不确定度，用于收敛判定）

### Pack Strategy（题库准备）

- Seed Pack（阻塞）：
  - `ccw learn:ensure-pack --mode seed --topic-id <topicId> --language zh-CN --json`
  - Fallback：生成失败 → 使用确定性题库（deterministic）
- Full Pack（异步）：
  - `ccw learn:ensure-pack --mode full --topic-id <topicId> --language zh-CN --json`（不等待）

### Assessment Loop（最多 6 题）

- Stop Conditions：
  1) 收敛：`sigma <= 0.1` 且 Must Evidence 满足
  2) 上限：`n_answered >= 6`
  3) 低置信度：到上限仍未收敛（仍要结算，但标注 `completed=false` 或 `confidence_low=true`）

#### Loop Steps

1) Pick Question：
   - `midpoint = (lo + hi) / 2`
   - 从 Seed Pack 选 `difficulty` 最接近 `midpoint` 且未作答的题
   - Seed 耗尽 → 从 Full Pack 选
   - 无题可选 → 生成动态 session 题（debug）
2) Ask：
   - Tool：`AskUserQuestion`（题干 + 输入框）
3) Score：
   - Text scorer：产出 `p_correct`（0-1）与 `confidence`（0-1）
   - Code challenge：走 `_internal/mcp-runner.js` 沙箱执行（必要时）
4) Update Interval：
   - `d = question.difficulty`
   - Pass：`confidence >= 0.6 && p_correct >= 0.75` → `lo = max(lo, d)`
   - Fail：`confidence >= 0.6 && p_correct <= 0.25` → `hi = min(hi, d)`
5) Append Events（缓存 + batch）：
   - `ASSESSMENT_QUESTION_ASKED`
   - `ASSESSMENT_ANSWER_RECORDED`
   - `ASSESSMENT_SCORED`
   - 每 4 题触发一次 `ccw learn:append-profile-events-batch`

### 结果结算

- `proficiency = (lo + hi) / 2`
- 更新 Profile（in-memory）：
  - `known_topics[topic_id] = { proficiency, evidence, updated_at, pack_key? }`
- 持久化：
  - `ccw learn:write-profile ...`
  - 追加 `ASSESSMENT_SESSION_SUMMARIZED`（含 completed/low_confidence、题目数量、最终区间等）
- 推断技能（best-effort）：
  - `ccw learn:propose-inferred-skill --profile-id ... --topic-id ... --proficiency ... --confidence ... --evidence ...`

## Outputs / Artifacts

- Reads：
  - `.workflow/learn/state.json`（或 `.workflow/learn/state.v2.json`）
  - `.workflow/learn/profiles/<profile-id>.json`
  - `.workflow/learn/profiles/events/<profile-id>.ndjson`
  - `.workflow/learn/profiles/snapshots/<profile-id>.json`
  - `.workflow/learn/packs/**`
  - `.workflow/learn/taxonomy/**`
- Writes（via `ccw learn:*`）：
  - `.workflow/learn/state.json`（或 `.workflow/learn/state.v2.json`）
  - `.workflow/learn/profiles/<profile-id>.json`
  - `.workflow/learn/profiles/events/<profile-id>.ndjson`
  - `.workflow/learn/profiles/snapshots/<profile-id>.json`
  - `.workflow/learn/telemetry/events.ndjson`
  - `.workflow/learn/packs/**`

## Error Handling

- Shell 转义：传入 `Bash` 的 JSON 字符串必须先做单引号转义（例如 `escapeSingleQuotesForShell`）
- JSON 解析：CLI 输出可能混入噪音，使用 `lastJsonObjectFromText`/健壮解析
- Best Effort：
  - telemetry/events batch 追加失败：记录 warning，不阻断 profile 写入与用户交互
  - full pack 异步触发失败：不阻断 seed assessment
- 不泄露敏感信息：错误信息避免包含完整背景文本或用户原始答案

## Reality Check (Matches Current Backend)

- Learn root：`.workflow/learn/`
- State：`.workflow/learn/state.json`（写入失败时可能回退到 `.workflow/learn/state.v2.json`）
- Profiles：
  - `.workflow/learn/profiles/<profile-id>.json`
  - `.workflow/learn/profiles/events/<profile-id>.ndjson`
  - `.workflow/learn/profiles/snapshots/<profile-id>.json`
- 任何写入必须通过 `ccw learn:*`（不要直接 Write/编辑上述文件）

## Implementation

- Slash 命令文档（用户可读 + 执行提示）：
  - `.claude/commands/learn/profile.md`
- 内部模块（可复用逻辑；被 profile.md 引用/调用）：
  - `.claude/commands/learn/_internal/assess.js`（必须导出 `createAssess({ AskUserQuestion, Bash, Read })`）
  - `.claude/commands/learn/_internal/mcp-runner.js`（代码题沙箱执行器）
  - `.claude/commands/learn/_internal/error-handler.js`（统一错误处理 + best-effort 包装）
  - `.claude/commands/learn/_internal/json-parser.js`（`lastJsonObjectFromText` 等）

> 注：若你的 Slash runtime 支持 `.js` 作为入口，也可增加 `.claude/commands/learn/profile.js` 作为“编排层”。在本仓库现有 corpus 中，`*.md` 是命令入口，`_internal/*.js` 提供可复用逻辑。

## Example Scenario (Topic V0 + Seed/Full Pack)

1) 用户输入背景：“3 年前端，TypeScript 熟练，想学 RSC”
2) 生成候选：`react-server-components`、`nextjs-app-router`、`streaming-ssr`…（<=16）
3) 覆盖 loop 选中 6 个 topic + free text 补充 “server actions”
4) 写入 profile + 设置 active
5) 选择 `t_<...>`（RSC）进入评估：seed 4～6 题，最多 6 题收敛，产出 `proficiency=0.62`
