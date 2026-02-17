# Agent 系统深度分析

> Session: .workflow/.analysis/ANL-docs-deep-dive-2025-02-16
> Focus: Agent 架构、执行模型、生命周期
> Generated: 2026-02-16

---

## 执行摘要

CCW (Claude Code Workflow) 项目实现了一个复杂的 Agent 系统，包含 **21 个专用代理**，通过 Markdown 配置文件定义，支持多种执行模式和工具集成。系统采用声明式配置 + 运行时发现的设计模式。

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

### 1.3 Agent 发现机制

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

## 2. 代理执行模型

### 2.1 执行模式

| 模式 | 描述 | 使用场景 | 超时设置 |
|------|------|---------|---------|
| `analysis` | 只读分析 | 代码审查、架构分析 | 20-40 分钟 |
| `write` | 文件修改 | 功能实现、重构 | 40-60 分钟 |
| `review` | 代码审查 (codex only) | Git diff 审查 | 20-30 分钟 |
| `mainprocess` | 阻塞同步 | 即时命令 | 无限制 |
| `async` | 后台执行 | 长时间任务 | 60+ 分钟 |

### 2.2 Task Tool 启动 Agent

**标准调用模式**:

```javascript
Task({
  subagent_type: "@agent-name",
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

### 2.3 Agent 工具访问权限

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

### 2.4 CLI 集成模式

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

## 3. 代理生命周期

### 3.1 生命周期阶段

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

### 3.2 状态传递机制

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

**变量引用语法**:
- `[variable_name]` - 引用 pre_analysis 输出
- `{{variable}}` - Template 占位符
- `${variable}` - Shell 变量

### 3.3 错误处理与重试

**错误处理策略** (pre_analysis 步骤):

| 策略 | 行为 | 使用场景 |
|------|------|---------|
| `fail` | 停止执行，报告错误 | 关键步骤失败 |
| `skip_optional` | 跳过继续 | 可选分析失败 |
| `retry_once` | 重试一次 | 网络问题 |

**Test-Fix 循环** (test-fix-agent):
```
WHILE tests_failing AND iterations < max_iterations:
  1. Run test suite
  2. IF pass_rate >= 95%: SUCCESS
  3. ELSE: Diagnose with Gemini CLI
  4. Apply fixes
  5. iterations++
END WHILE

IF iterations == max_iterations:
  Auto-revert changes
  Report failure
```

---

## 4. Agent 与 Skill 的关系

### 4.1 核心区别

| 特性 | Agent | Skill |
|------|-------|-------|
| **定义位置** | `.claude/agents/*.md` | `.claude/skills/*/SKILL.md` |
| **粒度** | 单一职责，可独立执行 | 多阶段工作流，编排 Agent |
| **调用方式** | `Task({ subagent_type: "@agent" })` | Slash command: `/skill-name` |
| **上下文** | 接收 Task JSON | 管理完整工作流状态 |

### 4.2 Skill 编排 Agent

**Skill 结构**:
```
skill-name/
├── SKILL.md           # 入口：元数据 + 执行流程
├── phases/            # 阶段定义
│   ├── 01-*.md        # 数字前缀控制顺序
│   └── 02-*.md
├── specs/             # 规范文件
├── templates/         # 模板
└── scripts/           # 辅助脚本
```

**Skill → Agent 调用** (通过 phases):
```markdown
<!-- phases/03-parallel-analysis.md -->
## Agent Configuration

| Agent | Role | Output File | Focus Areas |
|-------|------|-------------|-------------|
| @code-developer | Implement | section-api.md | API layer |
| @test-fix-agent | Test | section-test.md | Test coverage |
```

### 4.3 Flow Coordinator

**统一工作流格式** (`ccw/data/flows/*.json`):

```json
{
  "id": "demo-workflow",
  "nodes": [
    {
      "id": "node-1",
      "data": {
        "instruction": "Analyze codebase",
        "slashCommand": "workflow:plan",
        "tool": "gemini",
        "mode": "analysis",
        "outputName": "plan_result"
      }
    }
  ],
  "edges": [
    { "source": "node-1", "target": "node-2" }
  ]
}
```

**DAG 执行**:
1. 拓扑排序确定执行顺序
2. 并行执行无依赖节点
3. 上下文通过 `contextRefs` 传递

---

## 5. 扩展点

### 5.1 添加新 Agent

**步骤**:
1. 创建 `.claude/agents/my-agent.md`
2. 定义 Front Matter (name, description, color)
3. 编写执行流程 (遵循现有模式)
4. 无需注册 - 自动发现

**模板**:
```markdown
---
name: my-agent
description: |
  Agent description. Triggers on "keyword1", "keyword2".
color: green
---

You are a specialized agent for [purpose].

## Core Philosophy
- Principle 1
- Principle 2

## Execution Process

### 1. Context Assessment
...

### 2. Implementation
...

## Key Reminders

**ALWAYS:**
- Action 1
- Action 2

**NEVER:**
- Anti-pattern 1
```

### 5.2 添加新 Skill

**步骤**:
1. 创建 `.claude/skills/my-skill/` 目录
2. 创建 `SKILL.md` 入口文件
3. 创建 `phases/` 子目录定义阶段
4. 添加 `specs/` 规范和 `templates/` 模板

### 5.3 工具扩展

**添加 MCP 工具**:
1. 在 Agent 的 `allowed-tools` 中声明
2. 在执行逻辑中集成调用
3. 遵循工具优先级规则

---

## 6. 关键文件清单

| 文件路径 | 用途 | 角色 |
|---------|------|------|
| `.claude/agents/action-planning-agent.md` | 任务规划 Agent | modify_target |
| `.claude/agents/code-developer.md` | 代码实现 Agent | modify_target |
| `.claude/agents/tdd-developer.md` | TDD 开发 Agent | pattern_reference |
| `.claude/agents/test-fix-agent.md` | 测试修复 Agent | pattern_reference |
| `.claude/agents/context-search-agent.md` | 上下文收集 Agent | dependency |
| `.claude/agents/cli-execution-agent.md` | CLI 执行协调 Agent | dependency |
| `.claude/agents/universal-executor.md` | 通用执行 Agent | pattern_reference |
| `.claude/skills/_shared/SKILL-DESIGN-SPEC.md` | Skill 设计规范 | type_definition |
| `.claude/skills/flow-coordinator/SKILL.md` | 工作流协调器 | integration_point |
| `.claude/CLAUDE.md` | 项目配置入口 | config |
| `~/.claude/cli-tools.json` | CLI 工具配置 | config |

---

## 7. 设计决策

### 7.1 为什么使用 Markdown 定义 Agent？

**决策**: 使用 Markdown + YAML Front Matter 定义 Agent 配置

**理由**:
1. **人类可读**: 开发者可直接阅读和编辑
2. **版本控制友好**: Git diff 清晰
3. **Claude 原生支持**: 可直接作为 system prompt 注入
4. **无需编译**: 运行时解析，即时生效

### 7.2 为什么分离 Agent 和 Skill？

**决策**: Agent 处理单一职责，Skill 编排多阶段工作流

**理由**:
1. **单一职责**: Agent 专注一个领域，易于测试和维护
2. **复用性**: 同一 Agent 可被多个 Skill 使用
3. **关注点分离**: Agent 关注"怎么做"，Skill 关注"做什么"

### 7.3 为什么支持 Agent/CLI 双模式执行？

**决策**: `meta.execution_config.method` 控制执行路径

**理由**:
1. **灵活性**: 简单任务用 Agent 直接执行，复杂任务委托 CLI
2. **成本优化**: Agent 能力足够时不消耗 CLI 调用
3. **渐进增强**: 可随时切换模式而无需重写任务定义

---

## 8. 模块交互图

```
┌────────────────────────────────────────────────────────────────────────┐
│                           User Request                                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         Flow Coordinator                                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │
│  │ Discover    │ → │ Select      │ → │ Execute     │                 │
│  │ Templates   │    │ Template    │    │ DAG         │                 │
│  └─────────────┘    └─────────────┘    └─────────────┘                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ Planning Agents  │    │ Execution Agents │    │ Search Agents    │
│ ────────────────│    │ ────────────────│    │ ────────────────│
│ action-planning  │    │ code-developer   │    │ context-search   │
│ cli-planning     │    │ tdd-developer    │    │ cli-explore      │
│ issue-plan       │    │ test-fix-agent   │    │ debug-explore    │
└────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         Context Package                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │
│  │ metadata    │    │ project_ctx │    │ assets      │                 │
│  └─────────────┘    └─────────────┘    └─────────────┘                 │
│  ┌─────────────┐    ┌─────────────┐                                     │
│  │ brainstorm  │    │ conflict    │                                     │
│  └─────────────┘    └─────────────┘                                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ MCP Tools        │    │ CLI Tools        │    │ File System      │
│ ────────────────│    │ ────────────────│    │ ────────────────│
│ ACE search       │    │ Gemini/Qwen      │    │ Read/Write/Edit  │
│ CCW smart_search │    │ Codex/Claude     │    │ Glob/Grep        │
│ Exa web/code     │    │ ccw cli          │    │ Bash             │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

---

## 9. 质量检查清单

- [x] 识别所有 21 个 Agent 及其职责
- [x] 分析 Agent 配置和发现机制
- [x] 理解 Agent 与 Skill 的关系
- [x] 记录执行模式和 CLI 集成
- [x] 分析生命周期和状态传递
- [x] 识别扩展点
- [x] 提供关键文件清单
- [x] 绘制模块交互图

---

## 10. 下一步建议

1. **文档完善**: 为每个 Agent 添加使用示例和最佳实践
2. **测试覆盖**: 为关键 Agent 添加集成测试
3. **性能优化**: 分析 Agent 执行时间，优化热点路径
4. **错误恢复**: 增强失败状态下的恢复机制
5. **可观测性**: 添加 Agent 执行追踪和指标收集

---

*分析完成于 2026-02-16*
