# 代理生命周期

> 21 个代理分类、配置结构、发现机制、执行模式

---

## 执行摘要

CCW 项目实现了复杂的 Agent 系统，包含 **21 个专用代理**，通过 Markdown 配置文件定义，支持多种执行模式和工具集成。

---

## 1. Agent 架构总览

### 1.1 Agent 分类

| 分类 | Agent 名称 | 职责 | 核心能力 |
|------|-----------|------|---------|
| **规划类** | action-planning-agent, cli-planning-agent, cli-lite-planning-agent, cli-roadmap-plan-agent, conceptual-planning-agent, issue-plan-agent | 生成任务计划、Task JSON | 上下文加载、需求量化、DAG 生成 |
| **执行类** | code-developer, tdd-developer, test-fix-agent, universal-executor | 代码实现、测试执行 | CLI 集成、TDD 周期、多层测试 |
| **搜索类** | context-search-agent, cli-explore-agent, debug-explore-agent | 上下文收集、依赖分析 | ACE 语义搜索、CodexLens MCP |
| **协调类** | cli-execution-agent, cli-discuss-agent, issue-queue-agent | 工具编排、冲突解决 | 多 CLI 协作、DAG 排序 |
| **专用类** | ui-design-agent, doc-generator, memory-bridge | 领域特定任务 | W3C 设计令牌、文档生成 |

### 1.2 Agent 配置结构

**文件位置**: `.claude/agents/*.md` / `.codex/agents/*.md`

**Front Matter 结构**:
```yaml
---
name: agent-name                    # 唯一标识
description: |                      # 描述 + 触发示例
  Agent description here.
  Examples:
  - Context: ...
color: green|blue|orange|...       # UI 显示颜色
extends: parent-agent              # 可选：继承父 Agent
tdd_aware: true                    # 可选：特殊能力标记
allowed-tools: Task, Read, ...     # 可选：工具白名单
---
```

---

## 2. Agent 发现机制

系统通过 **Glob 模式动态发现** Agent：

```javascript
// 伪代码：Agent 发现逻辑
const agentPaths = [
  '.claude/agents/*.md',
  '.codex/agents/*.md'
];

function discoverAgents() {
  return agentPaths.flatMap(pattern =>
    Glob(pattern).map(file => parseAgent(file))
  );
}
```

**关键发现点**:
- Agent 不需要注册，只需放入目录即可被发现
- 同名 Agent 在 `.codex/` 和 `.claude/` 中可存在差异版本
- Front Matter 中的 `name` 字段作为唯一标识

---

## 3. 代理生命周期

```
┌─────────────────────────────────────────────────────────────────┐
│                     Agent Lifecycle                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Discovery     Glob *.md → Parse Front Matter → Register     │
│       ↓                                                          │
│  2. Selection     Match task type → Select by capability        │
│       ↓                                                          │
│  3. Initialization                                                │
│       ├── Load session context (paths, metadata)                │
│       ├── Load context-package.json                              │
│       └── Initialize status tracking                            │
│       ↓                                                          │
│  4. Pre-Analysis  Execute pre_analysis steps sequentially       │
│       ├── Variable substitution ([var_name])                     │
│       ├── Error handling (fail/skip/retry)                      │
│       └── Context accumulation                                   │
│       ↓                                                          │
│  5. Execution                                                      │
│       ├── Agent mode: Direct implementation                     │
│       └── CLI mode: Build prompt → Execute CLI → Parse result   │
│       ↓                                                          │
│  6. Verification  Quality gates → Test execution                │
│       ↓                                                          │
│  7. Completion                                                      │
│       ├── Update task JSON status                               │
│       ├── Generate summary document                             │
│       └── Update TODO_LIST.md                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. 执行模式

| 模式 | 描述 | 使用场景 | 超时设置 |
|------|------|---------|---------|
| `analysis` | 只读分析 | 代码审查、架构分析 | 20-40 分钟 |
| `write` | 文件修改 | 功能实现、重构 | 40-60 分钟 |
| `review` | 代码审查 (codex only) | Git diff 审查 | 20-30 分钟 |
| `mainprocess` | 阻塞同步 | 即时命令 | 无限制 |
| `async` | 后台执行 | 长时间任务 | 60+ 分钟 |

---

## 5. Task Tool 启动 Agent

**标准调用模式**:

```javascript
Task({
  subagent_type: "code-developer",
  prompt: "Task description with context",
  run_in_background: false  // MANDATORY: 同步执行
})
```

**上下文传递**:
```
Agent 接收的上下文结构:
├── Session Paths
│   ├── session_metadata_path
│   └── context_package_path
├── Metadata
│   ├── session_id
│   └── mcp_capabilities
└── Task-specific fields
    ├── task_description
    └── configuration
```

---

## 6. Agent 工具访问权限

**默认工具集** (所有 Agent 可用):
- `Read`, `Write`, `Edit` - 文件操作
- `Bash` - 命令执行
- `Glob`, `Grep` - 搜索发现
- `Task` - 启动子 Agent
- `AskUserQuestion` - 用户交互

**MCP 工具** (按需启用):
- `mcp__ace-tool__search_context` - ACE 语义搜索
- `mcp__ccw-tools__smart_search` - CCW 智能搜索
- `mcp__exa__*` - Exa 网络搜索
- `mcp__4_5v_mcp__analyze_image` - 图像分析

**工具优先级规则**:
```
ACE search_context (semantic)
  → CCW smart_search (structured)
    → Built-in Grep/Glob
      → Shell fallback
```

---

## 7. CLI 集成模式

**Agent → CLI 切换** (基于 `meta.execution_config.method`):

```javascript
// code-developer 中的执行模式选择
if (executionMethod === 'cli') {
  // CLI Handoff: 完整上下文传递
  const cliPrompt = buildCliHandoffPrompt(preAnalysisResults, task, taskJsonPath);
  const cliCommand = buildCliCommand(task, cliTool, cliPrompt);
  Bash({ command: cliCommand, timeout: 3600000 });
} else {
  // Agent 直接执行
  executeImplementationSteps(task);
}
```

**CLI Resume 策略**:

| 策略 | 条件 | CLI 命令模式 |
|------|------|-------------|
| `new` | 无依赖 | `--id {session}-{task}` |
| `resume` | 1 父节点, 1 子节点 | `--resume {parent_id}` |
| `fork` | 1 父节点, N 子节点 | `--resume {parent} --id {new_id}` |
| `merge_fork` | N 父节点 | `--resume {id1},{id2} --id {new_id}` |

---

## 8. Agent 与 Skill 的关系

| 特性 | Agent | Skill |
|------|-------|-------|
| **定义位置** | `.claude/agents/*.md` | `.claude/skills/*/SKILL.md` |
| **粒度** | 单一职责，可独立执行 | 多阶段工作流，编排 Agent |
| **调用方式** | `Task({ subagent_type: "xxx" })` | Slash command: `/skill-name` |
| **上下文** | 接收 Task JSON | 管理完整工作流状态 |

**Skill 编排 Agent**:
```markdown
<!-- phases/03-parallel-analysis.md -->
## Agent Configuration

| Agent | Role | Output File | Focus Areas |
|-------|------|-------------|-------------|
| @code-developer | Implement | section-api.md | API layer |
| @test-fix-agent | Test | section-test.md | Test coverage |
```

---

## 9. 状态传递机制

**Context Package 结构** (Agent 间共享):

```json
{
  "metadata": {
    "task_description": "...",
    "session_id": "WFS-xxx",
    "complexity": "medium"
  },
  "project_context": {
    "tech_stack": ["TypeScript", "React"],
    "coding_conventions": {...}
  },
  "assets": {
    "source_code": [...],
    "documentation": [...],
    "tests": [...]
  },
  "brainstorm_artifacts": {
    "guidance_specification": {...},
    "feature_index": {...},
    "role_analyses": [...]
  },
  "conflict_detection": {
    "risk_level": "medium",
    "affected_modules": [...]
  }
}
```

---

## 10. 关键文件清单

| 文件路径 | 用途 |
|---------|------|
| `.claude/agents/action-planning-agent.md` | 任务规划 Agent |
| `.claude/agents/code-developer.md` | 代码实现 Agent |
| `.claude/agents/tdd-developer.md` | TDD 开发 Agent |
| `.claude/agents/test-fix-agent.md` | 测试修复 Agent |
| `.claude/agents/context-search-agent.md` | 上下文收集 Agent |
| `.claude/agents/cli-execution-agent.md` | CLI 执行协调 Agent |
| `.claude/agents/universal-executor.md` | 通用执行 Agent |

---

## 相关资源

- [心智模型](../architecture/mental-model.md) - 核心抽象
- [技能阶段系统](skill-phases.md) - 技能详解
- [添加新代理](../extension/add-new-agent.md) - 扩展指南

---

*代理生命周期 - CCW Deep Dive*
