# conceptual-planning

> **分类**: Documentation
> **源文件**: [.claude/agents/conceptual-planning-agent.md](../../.claude/agents/conceptual-planning-agent.md)

## 概述

**Conceptual Planning Agent** 是一个专门化的单角色概念规划和头脑风暴分析 Agent。它执行分配的规划角色视角（system-architect、ui-designer、product-manager 等），进行全面的角色特定分析和结构化文档生成。

**核心职责**:
- **专用角色执行**: 执行恰好一个分配的规划角色视角
- **头脑风暴集成**: 与自动头脑风暴工作流集成
- **模板驱动分析**: 使用通过 `$(cat template)` 加载的规划角色模板
- **结构化文档**: 在指定的头脑风暴目录结构中生成角色特定分析
- **用户上下文集成**: 整合交互式上下文收集阶段的用户响应

**关键原则**: 一个 Agent = 一个角色，专注于概念性的"做什么"和"为什么"。

## 工作流程

```mermaid
flowchart LR
    A[检测激活] --> B[提取参数]
    B --> C[加载角色模板]
    C --> D[执行分析]
    D --> E[生成文档]
```

### 参数提取

从任务 prompt 中提取:
- **ASSIGNED_ROLE** - 单一角色分配（必需）
- **OUTPUT_LOCATION** - 指定的头脑风暴目录
- **USER_CONTEXT** - 交互式问答阶段的用户响应

### 角色模板加载

```bash
# 通过 bash 命令加载角色模板
bash($(cat ~/.ccw/workflows/cli-templates/planning-roles/{role}.md))
```

### 可用角色

| 角色 | 职责 |
|------|------|
| system-architect | 系统架构分析 |
| ui-designer | UI/UX 设计分析 |
| product-manager | 产品规划分析 |
| backend-developer | 后端技术分析 |
| frontend-developer | 前端技术分析 |
| security-engineer | 安全性分析 |
| devops-engineer | DevOps 分析 |

## 使用场景

### 什么时候使用这个 Agent

- **单角色头脑风暴**: 专门的角色分析（一个 Agent = 一个角色）
- **角色特定概念规划**: 需要领域专家视角的战略分析
- **模板驱动分析**: 使用预定义模板进行结构化分析
- **头脑风暴工作流**: 作为自动头脑风暴工作流的一部分

### 与 brainstorm Skill 的关系

由 auto-parallel.md 等头脑风暴命令调用:
- 每个角色分配一个 dedicated Agent
- Agent 在指定的 OUTPUT_LOCATION 生成分析
- 结果整合到头脑风暴产物中

## 输出结构

```
.brainstorming/{role}/
├── analysis.md           # 主要分析文档
├── analysis-{topic}.md   # 特定主题分析
└── recommendations.md    # 角色特定建议
```

## 与其他 Agent 的协作

| 协作 Agent/Skill | 协作方式 |
|------------------|----------|
| brainstorm Skill | 上游调用者，分配角色 |
| action-planning-agent | 下游，使用分析结果 |

## 关联组件

- **相关 Skills**: [brainstorm](../skills/brainstorm.md)
- **相关 Agents**: [action-planning](action-planning.md)

## 最佳实践

1. **单一角色专注**: 不接受多角色分配
2. **使用角色模板**: 确保分析一致性
3. **集成用户上下文**: 利用交互式收集的信息
4. **概念性分析**: 专注于"做什么"和"为什么"，而非实现细节
5. **结构化输出**: 按照模板格式生成文档
