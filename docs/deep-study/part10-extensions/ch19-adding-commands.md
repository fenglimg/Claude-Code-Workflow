# Section 19.2: 添加新 Command

本章介绍如何为 CCW 系统扩展新的 Command。Command 是用户交互的入口点，负责意图分析、工作流选择和命令链执行。

## 19.2.1 Command 概述

### 什么是 Command

Command 是 CCW 系统的用户入口，负责接收用户输入、分析意图、选择工作流并执行命令链。与 Skill 不同，Command 专注于**意图分析和流程编排**，而非具体执行逻辑。

**核心职责**:
- **意图分析**: 理解用户输入的目标和范围
- **工作流选择**: 根据意图选择合适的执行流程
- **命令链构建**: 组装最小执行单元 (Minimum Execution Units)
- **流程编排**: 协调 Skill 调用和状态管理

### Command 与 Skill 的区别

| 维度 | Command | Skill |
|------|---------|-------|
| **职责** | 意图分析 + 流程编排 | 具体执行逻辑 |
| **用户交互** | 直接接收用户输入 | 被 Command 或其他 Skill 调用 |
| **输出** | 工作流选择 + 命令链 | 具体执行结果 |
| **复杂度** | 决策逻辑 | 执行逻辑 |
| **文件位置** | `.claude/commands/` | `.claude/skills/` |

### Command 目录结构

```
.claude/commands/
├── ccw.md                    # 主入口编排器
├── ccw-plan.md               # 规划协调器
├── ccw-debug.md              # 调试协调器
├── ccw-test.md               # 测试协调器
├── ccw-coordinator.md        # 外部 CLI 协调器
└── flow-create.md            # 流程创建器
```

## 19.2.2 Command 定义格式

### YAML Front Matter

```yaml
---
name: command-name                    # Command 标识符 (必需)
description: |                        # 功能描述 (必需)
  {Description of what the command does.}
  This description is used for intent analysis.
argument-hint: "[options] \"args\""   # 参数提示 (可选)
allowed-tools: Skill(*), Tool1, ...   # 允许的工具列表 (必需)
---
```

### 字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `name` | string | 是 | Command 标识符，用于调用 |
| `description` | string | 是 | 功能描述，影响意图分析匹配 |
| `argument-hint` | string | 否 | 参数格式提示，显示在帮助中 |
| `allowed-tools` | string | 是 | 逗号分隔的工具权限列表 |

### description 字段的重要性

`description` 字段不仅用于文档，还用于**意图分析匹配**。CCW 通过分析 description 中的关键词来匹配用户输入。

**好的 description 示例**:
```yaml
description: |
  Main workflow orchestrator - analyze intent, select workflow, 
  execute command chain in main process.
  Supports: feature, bugfix, tdd, review, brainstorm workflows.
```

**避免模糊描述**:
```yaml
# 不好 - 太模糊
description: Does stuff

# 不好 - 缺少关键词
description: Handles user requests
```

## 19.2.3 参数解析逻辑

### 参数格式

Command 接收的参数格式在 `argument-hint` 中定义:

```yaml
argument-hint: "[--mode lite|full] [--yes|-y] \"task description\""
```

### 参数解析示例

```javascript
// 从用户输入解析参数
const args = parseArguments(user_input);

// 标志解析
const autoYes = args.includes('--yes') || args.includes('-y');
const mode = extractFlag(args, '--mode', 'default');
const session = extractFlag(args, '--session', null);

// 位置参数
const taskDescription = extractPositional(args, 0);
```

### 常用参数模式

| 参数 | 作用 | 示例 |
|------|------|------|
| `--yes`, `-y` | 自动模式，跳过确认 | `/ccw-plan --yes "task"` |
| `--mode` | 指定执行模式 | `/ccw-plan --mode full "task"` |
| `--session` | 指定会话 ID | `/ccw-plan --session WFS-xxx` |
| `--tool` | 指定 CLI 工具 | `/ccw cli --tool gemini` |
| `--resume` | 恢复之前的会话 | `/ccw cli --resume session-id` |

### ccw/src/commands/cli.ts 解析逻辑参考

参数解析的核心逻辑位于 `ccw/src/commands/cli.ts`:

```typescript
// 参数解析核心逻辑
interface ParsedArgs {
  positional: string[];
  flags: Record<string, string | boolean>;
}

function parseArguments(input: string): ParsedArgs {
  const args = input.split(/\s+/);
  const result: ParsedArgs = { positional: [], flags: {} };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    // 长标志: --flag value 或 --flag
    if (arg.startsWith('--')) {
      const flagName = arg.slice(2);
      const nextArg = args[i + 1];
      
      if (nextArg && !nextArg.startsWith('-')) {
        result.flags[flagName] = nextArg;
        i++; // 跳过下一个参数
      } else {
        result.flags[flagName] = true;
      }
    }
    // 短标志: -f value 或 -f
    else if (arg.startsWith('-') && arg.length === 2) {
      const flagName = arg.slice(1);
      const nextArg = args[i + 1];
      
      if (nextArg && !nextArg.startsWith('-')) {
        result.flags[flagName] = nextArg;
        i++;
      } else {
        result.flags[flagName] = true;
      }
    }
    // 位置参数
    else {
      result.positional.push(arg);
    }
  }
  
  return result;
}

// 标志提取辅助函数
function extractFlag(args: ParsedArgs, flag: string, defaultValue: any): any {
  return args.flags[flag] ?? defaultValue;
}
```

## 19.2.4 命令定义模板

### 基础模板

```markdown
---
name: {command-name}
description: |
  {One-line summary of command purpose.}
  {Additional details about capabilities.}
argument-hint: "[--option] \"task description\""
allowed-tools: Skill(*), TodoWrite(*), AskUserQuestion(*), Read(*), Grep(*), Glob(*)
---

# {Command Name}

{One-paragraph summary of the command's role.}

## Core Concept: {Key Concept}

{Explain the core concept this command implements.}

## Execution Model

**Synchronous (Main Process)**: Commands execute via Skill, blocking until complete.

```
User Input → Analyze → Select → Execute → Result
```

## N-Phase Workflow

### Phase 1: {Phase Name}

{Description of what happens in this phase.}

**Output**: `{output_description}`

---

### Phase 2: {Phase Name}

{Description of what happens in this phase.}

**Output**: `{output_description}`

---

## Usage

```bash
# Basic usage
/{command-name} "task description"

# With options
/{command-name} --option value "task description"
```

## Related Commands

**Prerequisites**:
- `/prerequisite-cmd` - {Purpose}

**Follow-ups**:
- `/followup-cmd` - {Purpose}
```

### 复杂 Command 模板 (ccw.md 风格)

```markdown
---
name: {command-name}
description: |
  {Detailed description with keywords for intent analysis.}
  Supports: feature, bugfix, tdd, review, exploration workflows.
argument-hint: "\"task description\""
allowed-tools: Skill(*), TodoWrite(*), AskUserQuestion(*), Read(*), Grep(*), Glob(*)
---

# {Command Name} - {Subtitle}

{One-paragraph summary of the command's role.}

## Core Concept: {Concept Name}

**Definition**: {Define the core concept.}

**Key Units**:

| Unit Type | Pattern | Example |
|-----------|---------|---------|
| **Unit 1** | pattern → pattern | example |

**Atomic Rules**:
1. {Rule 1}
2. {Rule 2}

## Execution Model

**Synchronous (Main Process)**: Commands execute via Skill in main process.

```
User Input → Analyze Intent → Select Workflow → [Confirm] → Execute Chain
```

## N-Phase Workflow

### Phase 1: Analyze Intent

```javascript
function analyzeIntent(input) {
  return {
    goal: extractGoal(input),
    scope: extractScope(input),
    task_type: detectTaskType(input),
    complexity: assessComplexity(input),
    clarity_score: calculateClarity(input)
  };
}

// Task type detection (priority order)
function detectTaskType(text) {
  const patterns = {
    'bugfix-hotfix': /urgent|production|critical/ && /fix|bug/,
    'bugfix': /fix|bug|error|crash|fail|debug/,
    'feature': /implement|add|create|build|develop/,
    'exploration': /uncertain|explore|research/
  };
  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) return type;
  }
  return 'feature';
}
```

**Output**: `Type: [task_type] | Goal: [goal] | Complexity: [complexity]`

---

### Phase 2: Select Workflow & Build Chain

```javascript
function selectWorkflow(analysis) {
  const levelMap = {
    'bugfix-hotfix': { level: 2, flow: 'bugfix.hotfix' },
    'bugfix': { level: 2, flow: 'bugfix.standard' },
    'feature': { level: analysis.complexity === 'high' ? 3 : 2, flow: '...' },
    'exploration': { level: 4, flow: 'full' }
  };

  const selected = levelMap[analysis.task_type] || levelMap['feature'];
  return buildCommandChain(selected, analysis);
}
```

**Output**: `Level [X] - [flow] | Pipeline: [...] | Commands: [...]`

---

### Phase 3: User Confirmation

{Confirmation dialog implementation.}

---

### Phase 4: Setup Tracking

{TodoWrite and status file setup.}

---

### Phase 5: Execute Chain

{Command execution loop.}

---

## Pipeline Examples

| Input | Type | Level | Pipeline |
|-------|------|-------|----------|
| "{example}" | {type} | {level} | {pipeline} |

## Key Design Principles

1. **{Principle 1}** - {Description}
2. **{Principle 2}** - {Description}
3. **{Principle 3}** - {Description}

## State Management

{State tracking implementation.}
```

## 19.2.5 Command 与 Skill 的边界

### 职责边界表

| 职责 | Command | Skill |
|------|---------|-------|
| 用户意图分析 | ✅ 是 | ❌ 否 |
| 工作流选择 | ✅ 是 | ❌ 否 |
| 命令链构建 | ✅ 是 | ❌ 否 |
| 进度追踪初始化 | ✅ 是 | ❌ 否 |
| Skill 调用协调 | ✅ 是 | ❌ 否 |
| 具体执行逻辑 | ❌ 否 | ✅ 是 |
| Agent 调用 | ❌ 否 | ✅ 是 |
| 文件读写 | ❌ 否 | ✅ 是 |
| 结果生成 | ❌ 否 | ✅ 是 |

### 调用关系

```
User Input
    ↓
Command (意图分析 + 流程编排)
    ↓
Skill (执行逻辑)
    ↓
Agent (具体任务)
```

### 判断标准

**何时创建 Command**:
- 需要分析用户意图并选择工作流
- 需要组合多个 Skill 形成命令链
- 需要提供用户交互入口

**何时创建 Skill**:
- 需要实现具体的执行逻辑
- 需要定义阶段化的工作流程
- 需要被 Command 或其他 Skill 调用

## 19.2.6 参数解析流程图

```
User Input: "/ccw-plan --mode full --yes \"Implement OAuth2\""
                              ↓
                    ┌─────────────────┐
                    │  Parse Arguments │
                    └────────┬────────┘
                             ↓
         ┌───────────────────┼───────────────────┐
         ↓                   ↓                   ↓
   ┌───────────┐       ┌───────────┐       ┌───────────┐
   │ Flags     │       │ Positional│       │ Task      │
   │ --mode:   │       │ Args:     │       │ Description│
   │   full    │       │   (none)  │       │ "Implement │
   │ --yes:    │       │           │       │  OAuth2"  │
   │   true    │       │           │       │           │
   └───────────┘       └───────────┘       └───────────┘
         ↓                   ↓                   ↓
    ┌─────────────────────────────────────────────────┐
    │              Analysis Result                     │
    │  mode: "full"                                    │
    │  autoYes: true                                   │
    │  task: "Implement OAuth2"                        │
    └─────────────────────────────────────────────────┘
                             ↓
                    ┌─────────────────┐
                    │ Select Workflow │
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │ Build Chain     │
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │ Execute Chain   │
                    └─────────────────┘
```

## 19.2.7 示例: 现有 Command 参考

### ccw.md (主入口)

**路径**: `.claude/commands/ccw.md`

**职责**: 主工作流编排器 - 意图分析、工作流选择、命令链执行

**特点**:
- 10 种工作流模式
- 最小执行单元概念
- 意图类型检测 (正则匹配)
- 用户澄清机制

**权限配置**:
```yaml
allowed-tools: Skill(*), TodoWrite(*), AskUserQuestion(*), Read(*), Grep(*), Glob(*)
```

**工作流选择逻辑**:
```javascript
const levelMap = {
  'bugfix-hotfix':     { level: 2, flow: 'bugfix.hotfix' },
  'brainstorm':        { level: 4, flow: 'brainstorm-with-file' },
  'bugfix':            { level: 2, flow: 'bugfix.standard' },
  'exploration':       { level: 4, flow: 'full' },
  'quick-task':        { level: 1, flow: 'lite-lite-lite' },
  'tdd':               { level: 3, flow: 'tdd' },
  'feature':           { level: analysis.complexity === 'high' ? 3 : 2 }
};
```

### ccw-plan.md (规划协调器)

**路径**: `.claude/commands/ccw-plan.md`

**职责**: 规划协调 - 需求分析、策略选择、规划工作流执行

**特点**:
- 规划单元概念 (Quick/Verified/Collaborative)
- 10 种规划模式
- CLI 集成分析
- Issue 工作流桥接

**权限配置**:
```yaml
allowed-tools: Skill(*), TodoWrite(*), AskUserQuestion(*), Read(*), Grep(*), Glob(*)
```

**规划模式**:
| Mode | Purpose | Command Chain |
|------|---------|---------------|
| lite | Fast simple planning | lite-plan |
| multi-cli | Collaborative planning | multi-cli-plan → [plan-verify] |
| full | Brainstorm + planning | brainstorm → plan → [plan-verify] |
| plan-verify | Mandatory quality gate | plan → plan-verify |

### ccw-coordinator.md (外部 CLI)

**路径**: `.claude/commands/ccw-coordinator.md`

**职责**: 外部 CLI 协调 - 后台任务执行和 Hook 回调

**特点**:
- 后台执行模式
- Hook 回调机制
- 会话恢复支持

## 19.2.8 创建 Command 检查清单

创建新 Command 前，确认以下事项:

- [ ] **确定职责**: Command 负责"决策"，Skill 负责"执行"
- [ ] **定义意图类型**: 需要识别的用户意图类别
- [ ] **设计工作流选择**: 意图到工作流的映射逻辑
- [ ] **规划命令链**: 最小执行单元的划分
- [ ] **编写 description**: 包含关键词用于意图匹配
- [ ] **定义参数格式**: argument-hint 和解析逻辑
- [ ] **设置工具权限**: 仅授予必需权限 (通常 Skill + TodoWrite + AskUserQuestion)
- [ ] **编写使用示例**: 各种场景的调用方式
