# lite-plan 工作流解释

## 概述

**lite-plan** 是一个轻量级交互式规划命令，用于动态适配任务复杂度并生成实现计划。它关注规划阶段（探索、澄清、规划、确认），而将实际执行委托给 `/workflow:lite-execute`。

### 基本信息

| 属性     | 值                                             |
| -------- | ---------------------------------------------- |
| 类型     | Command                                        |
| 名称     | lite-plan                                      |
| 路径     | `~/.claude/commands/workflow/lite-plan.md`     |
| 触发词   | /workflow:lite-plan                            |
| 执行模式 | Sequential (5 phases)                          |
| 阶段数   | 5                                              |
| 允许工具 | TodoWrite, Task, SlashCommand, AskUserQuestion |

---

## 核心概念

| 概念                        | 类别 | 定义                                                                                           | 出现次数 |
| --------------------------- | ---- | ---------------------------------------------------------------------------------------------- | -------- |
| **lite-plan**               | 架构 | 轻量级交互式规划命令，通过动态工作流适配实现任务规划，关注探索、澄清、规划、确认四个阶段       | 50       |
| **Exploration**             | 流程 | 代码探索阶段，通过 cli-explore-agent 从多个角度（architecture/security/performance）分析代码库 | 30       |
| **Complexity**              | 数据 | 任务复杂度评估（Low/Medium/High），决定探索深度、规划策略和推荐执行方法                        | 20       |
| **Exploration Angle**       | 数据 | 探索视角，如 architecture、security、performance，每个 Agent 从指定角度分析                    | 18       |
| **plan.json**               | 数据 | 结构化实现计划文件，包含 summary、approach、tasks、flow_control 等字段                         | 25       |
| **cli-explore-agent**       | 工具 | 只读代码探索 Agent，采用双源分析策略（Bash + Gemini CLI），生成结构化探索结果                  | 15       |
| **cli-lite-planning-agent** | 工具 | 通用规划 Agent，执行 CLI 规划工具，生成符合 schema 的 planObject                               | 12       |
| **executionContext**        | 数据 | 执行上下文对象，包含完整规划数据，通过全局变量传递给 lite-execute                              | 15       |
| **Clarification**           | 流程 | 澄清阶段，聚合多角度探索的 clarification_needs，多轮用户交互收集决策                           | 12       |
| **lite-execute**            | 架构 | 轻量级执行命令，接收 executionContext 或独立输入，协调 Agent/Codex 执行                        | 10       |
| **Session**                 | 数据 | 工作会话，包含 id 和 folder，用于存储所有工作产物                                              | 10       |
| **Auto Mode**               | 流程 | 自动模式（--yes），跳过所有确认，使用默认值快速执行                                            | 8        |

---

## 执行流程

### Phase 1: Task Analysis & Exploration

**目标**:

- 解析用户输入（任务描述或 .md 文件）
- 智能复杂度评估（Low/Medium/High）
- 探索决策（自动检测或 --explore 标志）
- 启动并行 cli-explore-agents（1-4 个基于复杂度）

**输入**:

- `$ARGUMENTS`（任务描述或文件路径）
- `--explore` 标志（强制探索）
- `--yes` 标志（自动模式）

**输出**:

- `exploration-{angle}.json`（1-4 个文件）
- `explorations-manifest.json`

**关键步骤**:

1. 解析输入，提取任务描述
2. 分析任务复杂度（Scope/Depth/Risk/Dependencies）
3. 确定是否需要探索（needsExploration）
4. 根据任务类型选择探索角度（ANGLE_PRESETS）
5. 并行启动 cli-explore-agent 实例

**条件分支**:

- `needsExploration=true`: 启动并行 cli-explore-agents
- `needsExploration=false`: 跳过探索，进入 Phase 2/3
- **Context Protection**: 文件读取 >= 50k 字符时强制使用 cli-explore-agent

**复杂度决定探索数量**:
| 复杂度 | 探索 Agent 数量 |
|--------|-----------------|
| Low | 1 |
| Medium | 3 |
| High | 4 |

---

### Phase 2: Clarification (Optional, Multi-Round)

**目标**:

- 聚合所有探索角度的 clarification_needs
- 智能去重相似问题
- 多轮用户交互（每轮最多 4 个问题）

**输入**:

- `exploration-{angle}.json` 文件
- `explorations-manifest.json`

**输出**:

- `clarificationContext`（内存中）

**关键步骤**:

1. 加载 manifest 和所有探索文件
2. 聚合 clarification_needs，按 source_angle 标记
3. 智能合并相似意图的问题
4. 分批执行 AskUserQuestion（每批 4 个）
5. 存储用户响应到 clarificationContext

**跳过条件**:

- 未执行探索
- clarification_needs 为空
- `--yes` 标志已设置

---

### Phase 3: Planning

**目标**:

- 基于复杂度选择规划策略
- 生成符合 schema 的 plan.json

**输入**:

- 探索结果（exploration-{angle}.json）
- clarificationContext
- `plan-json-schema.json`

**输出**:

- `plan.json`

**关键步骤**:

1. 读取 plan-json-schema.json
2. 根据复杂度选择规划策略
3. 读取并整合所有探索文件
4. 生成 plan.json

**规划策略路由**:
| 复杂度 | 规划策略 |
|--------|----------|
| Low | Direct Claude Planning（无 Agent） |
| Medium | cli-lite-planning-agent |
| High | cli-lite-planning-agent |

**重要**: Phase 3 只做规划，不执行代码。所有执行在 Phase 5 通过 lite-execute 完成。

---

### Phase 4: Confirmation & Selection

**目标**:

- 展示计划摘要
- 收集用户确认（Allow/Modify/Cancel）
- 选择执行方法和代码审查工具

**输入**:

- `plan.json`

**输出**:

- `userSelection`（confirmation, execution_method, code_review_tool）

**关键步骤**:

1. 读取并展示 plan.json 摘要
2. AskUserQuestion 收集三项选择：
   - Confirm: Allow / Modify / Cancel
   - Execution: Agent / Codex / Auto
   - Review: Gemini / Codex / Agent / Skip

**Auto Mode 默认值**（--yes 标志）:

- Confirmation: Allow
- Execution: Auto
- Review: Skip

---

### Phase 5: Execute Handoff

**目标**:

- 构建完整的 executionContext
- 委托给 lite-execute 执行

**输入**:

- plan.json
- 探索结果
- clarificationContext
- userSelection

**输出**:

- executionContext（全局变量）

**关键步骤**:

1. 加载 manifest 和所有探索文件
2. 构建 executionContext 对象
3. 调用 SlashCommand("/workflow:lite-execute --in-memory")

**executionContext 结构**:

```
{
  planObject: {...},
  explorationsContext: {...},
  explorationAngles: [...],
  explorationManifest: {...},
  clarificationContext: {...},
  executionMethod: "Agent" | "Codex" | "Auto",
  codeReviewTool: "Skip" | "Gemini Review" | ...,
  originalUserInput: "...",
  executorAssignments: {...},
  session: { id, folder, artifacts }
}
```

---

## 数据流

### 数据产物

| 产物                         | 生产者                      | 消费者                   | 说明                       |
| ---------------------------- | --------------------------- | ------------------------ | -------------------------- |
| `exploration-{angle}.json`   | Phase 1 (cli-explore-agent) | Phase 2, 3, 5            | 特定角度的代码探索结果     |
| `explorations-manifest.json` | Phase 1                     | Phase 2, 3, 5            | 所有探索文件的索引         |
| `clarificationContext`       | Phase 2                     | Phase 3, 5               | 用户澄清响应（内存）       |
| `plan.json`                  | Phase 3                     | Phase 4, 5, lite-execute | 结构化实现计划             |
| `executionContext`           | Phase 5                     | lite-execute             | 完整执行上下文（全局变量） |

### 数据流转路径

| 阶段    | 输入      | 输出                          | 流向         |
| ------- | --------- | ----------------------------- | ------------ |
| Phase 1 | 任务描述  | exploration-\*.json, manifest | Phase 2/3    |
| Phase 2 | 探索结果  | clarificationContext          | Phase 3      |
| Phase 3 | 探索+澄清 | plan.json                     | Phase 4      |
| Phase 4 | plan.json | userSelection                 | Phase 5      |
| Phase 5 | 所有产物  | executionContext              | lite-execute |

### Session 文件夹结构

```
.workflow/.lite-plan/{task-slug}-{YYYY-MM-DD}/
  exploration-architecture.json
  exploration-security.json
  exploration-patterns.json
  explorations-manifest.json
  plan.json
```

---

## 设计思考

### 分离规划与执行

**设计决策**: lite-plan 只负责规划，执行完全委托给 lite-execute

**权衡考虑**:

- 优势：关注点分离，每个命令职责单一
- 优势：lite-execute 可独立使用（Mode 2/3）
- 劣势：增加了调用链长度

### 动态复杂度适配

**设计决策**: 根据任务复杂度动态调整探索深度和规划策略

**权衡考虑**:

- Low 任务直接规划，避免过度探索开销
- Medium/High 任务使用 Agent，确保质量
- 通过 ANGLE_PRESETS 预设探索角度，提高针对性

### 多角度并行探索

**设计决策**: 启动 1-4 个 cli-explore-agent 从不同角度并行分析

**权衡考虑**:

- 优势：覆盖更全面，发现隐藏问题
- 优势：并行执行提高效率
- 劣势：Token 消耗随复杂度增加

### Context Protection

**设计决策**: 文件读取 >= 50k 字符时强制使用 cli-explore-agent

**权衡考虑**:

- 防止主 Claude 上下文爆炸
- 委托给专门的 Agent 处理大文件
- 保护会话稳定性

---

## 使用示例

### 基本用法

```bash
/workflow:lite-plan "实现JWT认证"
```

### 自动模式

```bash
/workflow:lite-plan --yes "实现JWT认证"
```

### 强制探索

```bash
/workflow:lite-plan -y -e "优化数据库查询性能"
```

### 从文件读取

```bash
/workflow:lite-plan ./task-requirements.md
```

---

_本文档由 skill-explainer 自动生成_
_生成时间: 2026-01-29_
_流程图请查看同目录下的 lite-plan-flowchart.md_
