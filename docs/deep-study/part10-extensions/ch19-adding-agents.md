# Section 19.3: 添加新 Agent

本章介绍如何为 CCW 系统扩展新的 Agent。Agent 是 CCW 系统的执行单元，负责具体任务的实现，接收上下文并产出结果。

## 19.3.1 Agent 概述

### 什么是 Agent

Agent 是 CCW 系统的执行单元，专注于具体任务的实现。Agent 接收来自 Skill 或 Command 的上下文，执行代码编写、分析、测试等具体工作，并产出结构化结果。

**核心特征**:
- **纯执行**: 专注于"如何做"，不做决策
- **上下文驱动**: 接收完整上下文后执行
- **结果导向**: 产出可验证的交付物
- **工具绑定**: 通过 `allowed-tools` 与 Skill 协调权限

### Agent 与 Skill 的关系

```
┌─────────────────────────────────────────────────────────────────┐
│                    Skill (协调器)                                │
│  → 分析任务、划分阶段、调用 Agent                                │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Task(agent-name, prompt)
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Agent (执行器)                                │
│  → 接收上下文、执行任务、产出结果                                │
└─────────────────────────────────────────────────────────────────┘
```

**调用模式**:
- Skill 通过 `Task` 工具调用 Agent
- Agent 在 Skill 的 `allowed-tools` 中声明
- Agent 接收 prompt 形式的上下文

### Agent 目录结构

```
.claude/agents/
├── action-planning-agent.md    # 规划生成 Agent
├── cli-execution-agent.md      # CLI 执行 Agent
├── cli-planning-agent.md       # CLI 规划 Agent
├── code-developer.md           # 代码开发 Agent
├── context-search-agent.md     # 上下文搜索 Agent
├── debug-explore-agent.md      # 调试探索 Agent
├── doc-generator.md            # 文档生成 Agent
├── issue-plan-agent.md         # Issue 规划 Agent
├── issue-queue-agent.md        # Issue 队列 Agent
├── memory-bridge.md            # 内存桥接 Agent
├── tdd-developer.md            # TDD 开发 Agent
├── test-fix-agent.md           # 测试修复 Agent
├── ui-design-agent.md          # UI 设计 Agent
└── universal-executor.md       # 通用执行 Agent
```

## 19.3.2 Agent 定义格式

### YAML Front Matter

```yaml
---
name: agent-name                      # Agent 标识符 (必需)
description: |                        # 功能描述 (必需)
  {Description of what the agent does.}
  
  Examples:
  - Context: {scenario}
    user: "{example input}"
    assistant: "{example response}"
    commentary: {what this demonstrates}
color: blue                           # 显示颜色 (可选)
---
```

### 字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `name` | string | 是 | Agent 标识符，用于 Task 调用 |
| `description` | string | 是 | 功能描述，包含使用示例 |
| `color` | string | 否 | 显示颜色 (blue/yellow/green/red) |

### description 字段结构

`description` 字段应包含:
1. **功能概述**: Agent 的核心能力
2. **使用示例**: 至少 2-3 个场景示例
3. **上下文说明**: 需要什么样的输入

**示例**:
```yaml
description: |
  Pure execution agent for implementing programming tasks and writing 
  corresponding tests. Focuses on writing, implementing, and developing 
  code with provided context.

  Examples:
  - Context: User provides task with sufficient context
    user: "Implement email validation function following these patterns: [context]"
    assistant: "I'll implement the email validation function using the provided patterns"
    commentary: Execute code implementation directly with user-provided context

  - Context: User provides insufficient context
    user: "Add user authentication"
    assistant: "I need to analyze the codebase first to understand the patterns"
    commentary: Use Gemini to gather implementation context, then execute
```

## 19.3.3 Prompt 设计最佳实践

### 核心原则

1. **纯执行定位**: Agent 是执行器，不是决策者
2. **上下文完整性**: 所有需要的信息通过 prompt 传递
3. **输出结构化**: 产出可解析、可验证的结果
4. **错误处理**: 明确的错误处理和恢复策略

### Prompt 模板结构

```markdown
---
name: {agent-name}
description: |
  {Agent description with examples}
color: {color}
---

You are a {role description}. You receive tasks with context and 
execute them efficiently using {methodology}.

## Core Execution Philosophy

- **{Principle 1}** - {Description}
- **{Principle 2}** - {Description}
- **{Principle 3}** - {Description}

## Execution Process

### 1. Context Assessment
**Input Sources**:
- {Input source 1}
- {Input source 2}

**Context Evaluation**:
```
IF context sufficient:
    → Proceed with execution
ELIF context insufficient:
    → Gather context first
    → Then execute
```

### 2. Execution Standards

**{Standard Category}**:
- {Requirement 1}
- {Requirement 2}

### 3. Quality Gates
**Before Completion**:
- [ ] {Criterion 1}
- [ ] {Criterion 2}

### 4. Task Completion

**Upon completing any task:**
1. {Step 1}
2. {Step 2}

## Quality Checklist

Before completing any task, verify:
- [ ] {Check 1}
- [ ] {Check 2}

## Key Reminders

**NEVER:**
- {Anti-pattern 1}
- {Anti-pattern 2}

**ALWAYS:**
- {Best practice 1}
- {Best practice 2}
```

### Prompt 设计要点

**1. 角色定义清晰**:
```markdown
You are a code execution specialist focused on implementing 
high-quality, production-ready code.
```

**2. 输入输出明确**:
```markdown
## Input Sources:
- User-provided task description
- Context package (JSON)
- Existing code patterns

## Output:
- Modified files
- Generated summary document
```

**3. 执行流程结构化**:
```markdown
## Execution Process

### Phase 1: Context Loading
1. Load context package
2. Extract requirements
3. Identify patterns

### Phase 2: Implementation
1. Follow extracted patterns
2. Implement required changes
3. Validate against criteria
```

**4. 错误处理指南**:
```markdown
## Error Handling

**When facing challenges** (max 3 attempts):
1. Document specific error messages
2. Try 2-3 alternative approaches
3. After 3 attempts, escalate for consultation
```

## 19.3.4 Tools 绑定与 allowed-tools 关系

### 权限控制机制

Agent 的工具权限通过**调用它的 Skill** 的 `allowed-tools` 控制。

**Skill 中声明 Agent 权限**:
```yaml
# 在 Skill 的 SKILL.md 中
allowed-tools: Task(agent-name1, agent-name2), ...
```

**语法**:
- `Task(agent1, agent2)` - 允许调用指定 Agent
- `Task(*)` - 允许调用所有 Agent
- `Task` - 基本权限 (无限制)

### Agent 内部工具使用

Agent 定义中**不包含** `allowed-tools` 字段，因为它继承自调用者 (Skill) 的权限。

**Agent 可用的工具** (由 Skill 授权):
- `Read`, `Write`, `Edit` - 文件操作
- `Glob`, `Grep` - 搜索
- `Bash` - 命令执行
- `mcp__*` - MCP 工具
- `Skill` - 调用其他 Skill
- `Task` - 调用其他 Agent (需要授权)

### 权限传递示例

```yaml
# Skill: workflow-execute/SKILL.md
allowed-tools: Skill, Task, AskUserQuestion, Read, Write, Edit, Bash, Glob, Grep
```

这意味着 `workflow-execute` 调用的 Agent (如 `code-developer`) 可以使用:
- `Skill` - 调用其他 Skill
- `Task` - 调用其他 Agent
- `AskUserQuestion` - 用户交互
- `Read`, `Write`, `Edit` - 文件操作
- `Bash`, `Glob`, `Grep` - 搜索和执行

## 19.3.5 Agent 类型与职责映射

### 专用 Agent

| Agent | 职责 | 典型任务 |
|-------|------|----------|
| `code-developer` | 代码实现 | 编写新功能、修复 Bug |
| `action-planning-agent` | 规划生成 | 生成实施计划、任务 JSON |
| `context-search-agent` | 上下文收集 | 分析项目结构、收集依赖 |
| `test-fix-agent` | 测试修复 | 修复失败的测试 |
| `doc-generator` | 文档生成 | 编写文档、README |
| `ui-design-agent` | UI 设计 | 界面设计、样式实现 |

### 通用 Agent

| Agent | 职责 | 适用场景 |
|-------|------|----------|
| `universal-executor` | 通用执行 | 任何类型的任务 |
| `debug-explore-agent` | 调试探索 | 问题诊断、代码分析 |

### CLI 相关 Agent

| Agent | 职责 | 与 CLI 工具的关系 |
|-------|------|-------------------|
| `cli-execution-agent` | CLI 执行 | 接收 CLI 分析结果，执行实现 |
| `cli-planning-agent` | CLI 规划 | 接收 CLI 分析结果，生成计划 |
| `cli-discuss-agent` | CLI 讨论 | 多轮 CLI 对话 |
| `cli-explore-agent` | CLI 探索 | CLI 辅助的代码探索 |

## 19.3.6 Agent 与 Skill 调用关系图

```
┌─────────────────────────────────────────────────────────────────┐
│                         SKILL                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    allowed-tools                          │    │
│  │  Task(agent1, agent2), Skill(*), Read, Write, ...        │    │
│  └─────────────────────────────────────────────────────────┘    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ↓                   ↓                   ↓
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│    Agent 1    │   │    Agent 2    │   │    Agent 3    │
│               │   │               │   │               │
│  (继承 Skill  │   │  (继承 Skill  │   │  (继承 Skill  │
│   的工具权限) │   │   的工具权限) │   │   的工具权限) │
│               │   │               │   │               │
│  可用工具:    │   │  可用工具:    │   │  可用工具:    │
│  - Skill     │   │  - Skill     │   │  - Skill     │
│  - Task*     │   │  - Task*     │   │  - Task*     │
│  - Read      │   │  - Read      │   │  - Read      │
│  - Write     │   │  - Write     │   │  - Write     │
│  - ...       │   │  - ...       │   │  - ...       │
└───────────────┘   └───────────────┘   └───────────────┘
```

**调用示例**:
```javascript
// Skill 中调用 Agent
Task({
  subagent_type: "code-developer",
  run_in_background: false,
  prompt: `Implement task ${task.id}: ${task.title}

  [FLOW_CONTROL]

  **Input**:
  - Task JSON: ${taskJsonPath}
  - Context Package: ${contextPackagePath}

  **Output Location**:
  - Workflow: ${workflowDir}
  - TODO List: ${todoListPath}

  **Execution**: Read task JSON → Execute pre_analysis → 
  Implement → Update TODO_LIST.md → Generate summary`,
  description: `Implement: ${task.id}`
})
```

## 19.3.7 示例: 现有 Agent 参考

### code-developer (代码实现)

**路径**: `.claude/agents/code-developer.md`

**职责**: 纯代码执行，实现编程任务并编写对应测试

**特点**:
- 增量式进度
- 上下文驱动
- 质量优先
- TDD 支持

**Description 示例**:
```yaml
description: |
  Pure code execution agent for implementing programming tasks and 
  writing corresponding tests. Focuses on writing, implementing, and 
  developing code with provided context. Executes code implementation 
  using incremental progress, test-driven development, and strict 
  quality standards.

  Examples:
  - Context: User provides task with sufficient context
    user: "Implement email validation function following these patterns: [context]"
    assistant: "I'll implement the email validation function using the provided patterns"
    commentary: Execute code implementation directly with user-provided context
```

### action-planning-agent (规划生成)

**路径**: `.claude/agents/action-planning-agent.md`

**职责**: 将需求和头脑风暴产物转换为结构化实施计划

**特点**:
- 多源上下文加载
- 统一扁平 Schema
- CLI 执行策略
- N+1 上下文记录

**关键能力**:
- 加载上下文包 (context-package.json)
- 加载头脑风暴产物 (guidance, feature specs)
- 生成任务 JSON (task-schema.json)
- 生成 plan.json (plan-overview-base-schema)
- 创建 IMPL_PLAN.md 和 TODO_LIST.md

### universal-executor (通用执行)

**路径**: `.claude/agents/universal-executor.md`

**职责**: 跨领域的通用执行，适应任何任务类型

**特点**:
- 增量式进度
- 上下文驱动
- 质量优先
- 高适应性

**适用场景**:
- 分析任务
- 实现任务
- 文档任务
- 研究任务
- 复杂多步骤工作流

## 19.3.8 创建 Agent 检查清单

创建新 Agent 前，确认以下事项:

- [ ] **确定职责**: Agent 是执行器，专注"如何做"
- [ ] **定义角色**: 清晰的角色描述和能力边界
- [ ] **设计输入**: 需要什么样的上下文
- [ ] **设计输出**: 产出什么样的结果
- [ ] **编写 Description**: 包含使用示例
- [ ] **规划执行流程**: 结构化的执行步骤
- [ ] **定义质量标准**: 完成前的检查清单
- [ ] **设置错误处理**: 失败时的恢复策略
- [ ] **文档化 Reminders**: DO 和 DON'T 列表
