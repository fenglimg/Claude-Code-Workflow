# Section 19.1: 添加新 Skill

本章介绍如何为 CCW 系统扩展新的 Skill。Skill 是 CCW 的核心能力单元，封装了特定领域的工作流程和执行逻辑。

## 19.1.1 Skill 概述

### 什么是 Skill

Skill 是 CCW 系统中的能力模块，定义了特定任务的执行流程、工具权限和阶段划分。每个 Skill 都是一个独立目录，包含完整的执行规范。

**核心特征**:
- **入口文件**: `SKILL.md` 作为唯一入口点
- **YAML Front Matter**: 定义元数据和权限
- **阶段化执行**: 通过 `phases/` 目录组织执行步骤
- **模板系统**: 通过 `templates/` 提供可复用模板
- **规范文档**: 通过 `specs/` 定义领域规范

### Skill 目录结构

```
.claude/skills/{skill-name}/
├── SKILL.md                        # 入口文件 (必需)
├── phases/                         # 执行阶段目录
│   ├── _orchestrator.md            # 顺序模式: 声明式编排器
│   ├── orchestrator.md             # 自主模式: 状态驱动编排器
│   ├── state-schema.md             # 自主模式: 状态结构定义
│   ├── workflow.json               # 顺序模式: 工作流定义
│   ├── actions/                    # 自主模式: 动作目录
│   │   ├── action-{name}.md        # 独立动作文件
│   │   └── ...
│   ├── 01-{phase-name}.md          # 顺序模式: Phase 1
│   ├── 02-{phase-name}.md          # 顺序模式: Phase 2
│   └── ...
├── specs/                          # 规范目录
│   ├── {domain}-requirements.md    # 领域需求规范
│   ├── quality-standards.md        # 质量标准
│   └── action-catalog.md           # 自主模式: 动作目录
├── templates/                      # 模板目录
│   ├── {template-name}.md          # 领域模板
│   └── ...
├── scripts/                        # 脚本目录 (可选)
│   ├── {script-name}.sh            # Bash 脚本
│   └── {script-name}.py            # Python 脚本
└── README.md                       # 使用说明 (推荐)
```

## 19.1.2 SKILL.md 结构详解

### YAML Front Matter

`SKILL.md` 的开头必须是 YAML Front Matter，定义 Skill 的基本属性和工具权限。

```yaml
---
name: skill-name                    # Skill 标识符 (必需)
description: |                      # Skill 描述 (必需)
  详细描述 Skill 的功能和用途。
  支持多行文本。
  Triggers on "trigger-keyword", "触发关键词".
allowed-tools: Tool1, Tool2, ...    # 允许的工具列表 (必需)
argument-hint: "[options] \"args\"" # 参数提示 (可选)
---
```

### 字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `name` | string | 是 | Skill 唯一标识符，用于触发调用 |
| `description` | string | 是 | 功能描述，包含触发关键词 |
| `allowed-tools` | string | 是 | 逗号分隔的工具权限列表 |
| `argument-hint` | string | 否 | 命令行参数格式提示 |

### allowed-tools 权限控制

`allowed-tools` 定义了 Skill 可以使用的工具集合，遵循最小权限原则。

**工具类别**:

| 类别 | 工具示例 | 用途 |
|------|----------|------|
| **文件操作** | `Read`, `Write`, `Edit`, `Glob` | 读写文件和目录遍历 |
| **搜索** | `Grep`, `mcp__ace-tool__search_context` | 代码搜索和语义检索 |
| **执行** | `Bash`, `Task` | Shell 命令和子任务 |
| **交互** | `AskUserQuestion`, `TodoWrite` | 用户交互和进度跟踪 |
| **Skill 调用** | `Skill(*)`, `Skill(skill-name)` | 调用其他 Skill |

**权限语法**:
```
allowed-tools: Skill(*), Task(agent1, agent2), AskUserQuestion(*), Read(*), Write(*), Edit(*), Glob(*), Bash(*)
```

**语法规则**:
- `Tool(*)` - 允许该工具的所有功能
- `Tool(func1, func2)` - 仅允许指定功能
- `Tool` - 基本权限 (无参数限制)

### SKILL.md 模板

```markdown
---
name: {skill-name}
description: |
  {Detailed description of what the skill does.}
  Triggers on "trigger-keyword", "触发关键词".
allowed-tools: Skill(*), Task, AskUserQuestion, TodoWrite, Read, Write, Edit, Glob, Grep, Bash
argument-hint: "[--option] \"task description\""
---

# {Skill Name}

{One-paragraph summary of the skill's purpose.}

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    {Skill Name} Orchestrator                     │
│                                                                  │
│  Input: User Request ({input description})                      │
│                         ↓                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Phase 1-N: Execution Pipeline                           │    │
│  │  ┌────┐ ┌────┐ ┌────┐                                    │    │
│  │  │ P1 │→│ P2 │→│ PN │                                    │    │
│  │  └────┘ └────┘ └────┘                                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                         ↓                                        │
│  Output: {output description}                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Key Design Principles

1. **{Principle 1}**: {Description}
2. **{Principle 2}**: {Description}
3. **{Principle 3}**: {Description}

## Execution Flow

```
Input Parsing:
   └─ {How input is processed}

Phase 1: {Phase Name}
   - {Purpose}
   - Tool: {ToolName}
   - Output: {Output description}

Phase 2: {Phase Name}
   - {Purpose}
   - Tool: {ToolName}
   - Output: {Output description}

... (additional phases)
```

## Reference Documents

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [phases/01-{name}.md](phases/01-{name}.md) | {Purpose} | {Usage timing} |
| [specs/{name}-requirements.md](specs/{name}-requirements.md) | {Purpose} | {Usage timing} |
| [templates/{name}.md](templates/{name}.md) | {Purpose} | {Usage timing} |

## Related Skills

**Prerequisites**:
- `/skill:name` - {Purpose}

**Follow-ups**:
- `/skill:name` - {Purpose}
```

## 19.1.3 执行模式

CCW 支持两种 Skill 执行模式: **顺序模式 (Sequential)** 和 **自主模式 (Autonomous)**。

### 顺序模式 (Sequential)

固定顺序执行，阶段按数字前缀顺序运行。

**特点**:
- 线性流程: `Phase 01 → Phase 02 → Phase 03 → ...`
- 强依赖关系: 后一阶段依赖前一阶段输出
- 固定输出结构

**适用场景**:
- 管道任务 (收集 → 分析 → 生成)
- 有强依赖关系的阶段
- 需要固定输出结构

**目录结构**:
```
phases/
├── _orchestrator.md    # 声明式编排器
├── workflow.json       # 工作流定义
├── 01-collect.md       # Phase 1
├── 02-analyze.md       # Phase 2
└── 03-generate.md      # Phase 3
```

**编排器示例** (`_orchestrator.md`):
```markdown
# Orchestrator: {Skill Name}

## Workflow Definition

Execute phases in order:
1. `01-collect.md` - Collect data
2. `02-analyze.md` - Analyze data
3. `03-generate.md` - Generate output

## State Passing

- Phase 1 → Phase 2: `{output_var}`
- Phase 2 → Phase 3: `{analysis_result}`
```

**workflow.json 示例**:
```json
{
  "name": "skill-name",
  "mode": "sequential",
  "phases": [
    { "id": "01-collect", "name": "Collect Data" },
    { "id": "02-analyze", "name": "Analyze Data" },
    { "id": "03-generate", "name": "Generate Output" }
  ]
}
```

### 自主模式 (Autonomous)

智能路由执行，根据上下文动态选择执行路径。

**特点**:
- 状态驱动: 读取状态 → 选择阶段 → 执行 → 更新
- 无强依赖: 各阶段可独立执行
- 动态响应用户意图

**适用场景**:
- 交互任务 (聊天、问答)
- 阶段间无强依赖
- 需要动态响应用户意图

**目录结构**:
```
phases/
├── orchestrator.md     # 状态驱动编排器
├── state-schema.md     # 状态结构定义
└── actions/
    ├── action-init.md
    ├── action-create.md
    ├── action-list.md
    └── ...
```

**编排器示例** (`orchestrator.md`):
```markdown
# Orchestrator: {Skill Name}

## State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│                    Orchestrator (State-Driven)                   │
│   (Read state -> Select Action -> Execute -> Update)            │
└───────────────┬─────────────────────────────────────────────────┘
                │
    ┌───────────┼───────────┬───────────┐
    ↓           ↓           ↓           ↓
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Action1 │ │ Action2 │ │ Action3 │ │ Action4 │
│(standalone)│(standalone)│(standalone)│(standalone)│
└─────────┘ └─────────┘ └─────────┘ └─────────┘
```

## Action Selection

Read `state.json`, determine next action:
- `status === "init"` → `action-init.md`
- `status === "collecting"` → `action-collect.md`
- `status === "analyzing"` → `action-analyze.md`
- `status === "complete"` → Exit
```

**状态结构示例** (`state-schema.md`):
```markdown
# State Schema

## State Structure

```json
{
  "status": "init|collecting|analyzing|complete",
  "data": {
    "collected": [],
    "analysis": null,
    "output": null
  },
  "errors": [],
  "metadata": {
    "started_at": "ISO-8601",
    "updated_at": "ISO-8601"
  }
}
```

## Status Values

| Status | Description | Next Action |
|--------|-------------|-------------|
| `init` | Initial state | action-init |
| `collecting` | Data collection in progress | action-collect |
| `analyzing` | Analysis in progress | action-analyze |
| `complete` | Workflow finished | Exit |
```

## 19.1.4 Phases 与 Agents 的映射

### Phase 文件结构

每个 Phase 文件定义一个执行阶段的详细逻辑。

```markdown
# Phase N: {Phase Name}

## Purpose
{What this phase accomplishes}

## Input
- `{input_var}`: {Description}

## Output
- `{output_var}`: {Description}

## Execution Steps

1. **Step 1**: {Action}
   - Tool: {ToolName}
   - Command: `{command}`

2. **Step 2**: {Action}
   - Tool: {ToolName}
   - Command: `{command}`

## Validation
- [ ] {Validation criterion 1}
- [ ] {Validation criterion 2}

## Error Handling
- **Error Type 1**: {Recovery strategy}
- **Error Type 2**: {Recovery strategy}
```

### Agent 调用模式

Skill 可以通过 `Task` 工具调用 Agent 执行特定任务。

**在 SKILL.md 中声明 Agent 权限**:
```yaml
allowed-tools: Task(agent-name1, agent-name2), ...
```

**在 Phase 中调用 Agent**:
```markdown
## Execution Steps

1. **Analyze Codebase**
   - Tool: Task
   - Agent: context-search-agent
   - Prompt: "Analyze project structure for {purpose}"
```

**常用 Agent 映射**:

| 任务类型 | 推荐 Agent | 用途 |
|----------|------------|------|
| 上下文搜索 | `context-search-agent` | 分析项目结构，收集上下文 |
| 规划生成 | `action-planning-agent` | 生成实施计划和任务 JSON |
| 代码实现 | `code-developer` | 执行代码编写任务 |
| 测试修复 | `test-fix-agent` | 修复失败的测试 |
| 通用执行 | `universal-executor` | 执行通用任务 |
| 文档生成 | `doc-generator` | 生成文档 |

## 19.1.5 最佳实践

### 命名规范

| 元素 | 规范 | 示例 |
|------|------|------|
| Skill 目录 | kebab-case | `workflow-plan/` |
| Skill 名称 | kebab-case | `workflow-plan` |
| Phase 文件 | 数字前缀 + kebab-case | `01-session-discovery.md` |
| Action 文件 | action- 前缀 + kebab-case | `action-collect.md` |
| Spec 文件 | kebab-case + -requirements | `planning-requirements.md` |
| Template 文件 | kebab-case | `impl-plan-template.md` |

### 权限最小化原则

仅授予 Skill 必需的最小权限:

```yaml
# 好的做法 - 仅授予必需权限
allowed-tools: Read, Write, Edit, Glob, Bash

# 避免 - 过度授权
allowed-tools: Skill(*), Task(*), *
```

### 描述与触发词

`description` 字段应包含触发关键词，便于意图识别:

```yaml
description: |
  Multi-dimensional code review with structured reports.
  Analyzes correctness, readability, performance, security.
  Triggers on "review code", "code review", "审查代码", "代码审查".
```

### 参考文档组织

按阶段组织参考文档，明确使用时机:

```markdown
## Reference Documents

### Phase 1: Data Collection
| Document | Purpose | When to Use |
|----------|---------|-------------|
| [phases/01-collect.md](phases/01-collect.md) | Collect data | Before starting Phase 1 |

### Phase 2: Analysis
| Document | Purpose | When to Use |
|----------|---------|-------------|
| [phases/02-analyze.md](phases/02-analyze.md) | Analyze data | After Phase 1 completes |
```

## 19.1.6 示例: 现有 Skill 参考

### brainstorm (复杂交互型)

**路径**: `.claude/skills/brainstorm/SKILL.md`

**特点**:
- 双模式操作 (Auto / Single Role)
- 四阶段执行流程
- 并行角色分析
- 丰富的参数解析

**权限配置**:
```yaml
allowed-tools: Skill(*), Task(conceptual-planning-agent, context-search-agent), 
  AskUserQuestion(*), TodoWrite(*), Read(*), Write(*), Edit(*), Glob(*), Bash(*)
```

### workflow-execute (编排型)

**路径**: `.claude/skills/workflow-execute/SKILL.md`

**特点**:
- Agent 协调执行
- 自动会话发现
- 懒加载任务 JSON
- 进度追踪

**权限配置**:
```yaml
allowed-tools: Skill, Task, AskUserQuestion, TaskCreate, TaskUpdate, TaskList, 
  Read, Write, Edit, Bash, Glob, Grep
```

### review-code (审查型)

**路径**: `.claude/skills/review-code/SKILL.md`

**特点**:
- 六维度审查
- 分层执行 (快速扫描 + 深入审查)
- 状态驱动决策

**权限配置**:
```yaml
allowed-tools: Task, AskUserQuestion, Read, Write, Glob, Grep, Bash, 
  mcp__ace-tool__search_context, mcp__ide__getDiagnostics
```

## 19.1.7 创建 Skill 检查清单

创建新 Skill 前，确认以下事项:

- [ ] **确定执行模式**: Sequential (固定顺序) 或 Autonomous (动态路由)
- [ ] **规划阶段划分**: 每个阶段的输入、输出、依赖关系
- [ ] **定义工具权限**: 遵循最小权限原则
- [ ] **编写 SKILL.md**: 包含架构图、执行流程、参考文档
- [ ] **创建 Phase 文件**: 按顺序或动作组织
- [ ] **添加规范文档**: 领域需求、质量标准
- [ ] **提供模板文件**: 可复用的输出模板
- [ ] **编写 README**: 使用说明和示例
