# Part X: 扩展指南

本部分介绍如何为 CCW 系统扩展新的能力模块。CCW 采用三层扩展架构: **Skill**、**Command**、**Agent**，每层承担不同的职责。

## 扩展点总览

### 三层扩展架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    用户交互层 (User Interface)                   │
│                                                                  │
│  Command: 意图分析 + 工作流选择 + 命令链编排                      │
│  示例: /ccw "Implement OAuth2" → 分析 → 选择工作流 → 执行        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    协调层 (Coordination)                         │
│                                                                  │
│  Skill: 阶段划分 + Agent 调度 + 结果整合                         │
│  示例: workflow-plan → 4 Phase → Agent 调用 → 生成计划          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    执行层 (Execution)                            │
│                                                                  │
│  Agent: 具体任务执行 + 结果产出                                  │
│  示例: code-developer → 实现代码 → 生成文件 + Summary           │
└─────────────────────────────────────────────────────────────────┘
```

### 扩展点对比

| 类型 | 用途 | 复杂度 | 典型场景 |
|------|------|--------|----------|
| **Skill** | 定义工作流程 | 中-高 | 新增工作流、阶段化任务 |
| **Command** | 用户交互入口 | 低-中 | 新增命令入口、意图路由 |
| **Agent** | 具体执行逻辑 | 低-中 | 新增执行能力、领域专家 |

### 统计数据

| 类型 | 数量 | 位置 |
|------|------|------|
| **Skill** | 27 | `.claude/skills/` |
| **Command** | 6 | `.claude/commands/` |
| **Agent** | 21 | `.claude/agents/` |

## 章节导航

### Section 19.1: 添加新 Skill

**路径**: [ch19-adding-skills.md](ch19-adding-skills.md)

**内容概要**:
- SKILL.md 结构详解
- YAML Front Matter 字段说明
- allowed-tools 权限控制
- 执行模式 (Sequential / Autonomous)
- Phases 与 Agents 映射
- 最佳实践和命名规范

**适用场景**:
- 需要定义新的工作流程
- 需要阶段化的任务执行
- 需要组合多个 Agent 完成复杂任务

### Section 19.2: 添加新 Command

**路径**: [ch19-adding-commands.md](ch19-adding-commands.md)

**内容概要**:
- Command 定义格式
- description 字段与意图分析
- 参数解析逻辑
- 命令定义模板
- Command 与 Skill 的边界
- 参数解析流程图

**适用场景**:
- 需要新增用户交互入口
- 需要实现意图路由和工作流选择
- 需要组合多个 Skill 形成命令链

### Section 19.3: 添加新 Agent

**路径**: [ch19-adding-agents.md](ch19-adding-agents.md)

**内容概要**:
- Agent 定义格式
- Prompt 设计最佳实践
- Tools 绑定与 allowed-tools 关系
- Agent 类型与职责映射
- Agent 与 Skill 调用关系图

**适用场景**:
- 需要新增执行能力
- 需要领域专家 (如测试、UI、文档)
- 需要专用执行器

## 扩展决策树

根据你的需求，选择合适的扩展点:

```
需求: 我想要...
│
├─ 新增用户可见的命令入口
│  └─→ 创建 Command
│      └─ 参考: Section 19.2
│
├─ 定义新的工作流程
│  ├─ 需要阶段化执行?
│  │  ├─ 是，固定顺序 → 创建 Sequential Skill
│  │  ├─ 是，动态路由 → 创建 Autonomous Skill
│  │  └─ 参考: Section 19.1
│  └─ 需要调用多个 Agent?
│     └─→ 创建 Skill (协调器角色)
│         └─ 参考: Section 19.1
│
├─ 新增具体执行能力
│  ├─ 代码实现 → 创建或扩展 code-developer
│  ├─ 规划生成 → 创建或扩展 action-planning-agent
│  ├─ 测试相关 → 创建或扩展 test-fix-agent
│  ├─ 文档相关 → 创建或扩展 doc-generator
│  └─ 通用执行 → 创建或扩展 universal-executor
│     └─ 参考: Section 19.3
│
└─ 修改现有行为
   ├─ 修改工作流 → 编辑对应 Skill
   ├─ 修改入口 → 编辑对应 Command
   └─ 修改执行 → 编辑对应 Agent
```

## 快速参考

### Skill 核心字段

```yaml
---
name: skill-name
description: |
  {Description with trigger keywords}
allowed-tools: Skill(*), Task(agent1), Read, Write, Edit, Glob, Bash
argument-hint: "[--option] \"args\""
---
```

### Command 核心字段

```yaml
---
name: command-name
description: |
  {Description for intent analysis}
argument-hint: "[options] \"args\""
allowed-tools: Skill(*), TodoWrite, AskUserQuestion, Read, Grep, Glob
---
```

### Agent 核心字段

```yaml
---
name: agent-name
description: |
  {Description with usage examples}
color: blue
---
```

## 相关资源

### 规范文档

| 文档 | 路径 | 用途 |
|------|------|------|
| Skill 设计规范 | `.claude/skills/_shared/SKILL-DESIGN-SPEC.md` | Skill 结构和命名规范 |
| Task Schema | `.ccw/workflows/cli-templates/schemas/task-schema.json` | 任务 JSON 结构 |
| Plan Schema | `.ccw/workflows/cli-templates/schemas/plan-overview-base-schema.json` | 计划 JSON 结构 |

### 现有实现参考

**复杂 Skill 参考**:
- `brainstorm` - 双模式、四阶段、并行执行
- `workflow-execute` - Agent 协调、懒加载
- `workflow-plan` - 多模式路由

**复杂 Command 参考**:
- `ccw` - 10 种工作流模式、意图分析
- `ccw-plan` - 10 种规划模式、CLI 集成

**专用 Agent 参考**:
- `code-developer` - 代码实现、TDD
- `action-planning-agent` - 规划生成、上下文加载
- `universal-executor` - 通用执行、跨领域

## 扩展检查清单

### Skill 检查清单

- [ ] 确定执行模式 (Sequential / Autonomous)
- [ ] 规划阶段划分
- [ ] 定义工具权限 (最小权限原则)
- [ ] 编写 SKILL.md (架构图、执行流程)
- [ ] 创建 Phase 文件
- [ ] 添加规范文档
- [ ] 提供模板文件
- [ ] 编写 README

### Command 检查清单

- [ ] 确定职责 (决策 vs 执行)
- [ ] 定义意图类型
- [ ] 设计工作流选择逻辑
- [ ] 规划命令链
- [ ] 编写 description (关键词)
- [ ] 定义参数格式
- [ ] 设置工具权限
- [ ] 编写使用示例

### Agent 检查清单

- [ ] 确定职责 (执行器定位)
- [ ] 定义角色和能力边界
- [ ] 设计输入输出
- [ ] 编写 Description (示例)
- [ ] 规划执行流程
- [ ] 定义质量标准
- [ ] 设置错误处理
- [ ] 文档化 Reminders
