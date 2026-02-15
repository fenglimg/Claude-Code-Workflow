# cli-execution

> **分类**: CLI-Related
> **源文件**: [.claude/agents/cli-execution-agent.md](../../.claude/agents/cli-execution-agent.md)

## 概述

**CLI Execution Agent** 是一个智能 CLI 执行 Agent，具有自动上下文发现和智能工具选择能力。它编排 5 阶段工作流：任务理解 → 上下文发现 → Prompt 增强 → 工具执行 → 输出路由。

**核心能力**:
- 智能意图检测和复杂度评分
- MCP + 搜索的上下文发现
- 结构化 Prompt 增强
- 智能工具选择
- 会话日志和摘要输出

**工具选择层次**:
1. **Gemini（主要）** - 分析、理解、探索和文档
2. **Qwen（备用）** - 与 Gemini 相同能力
3. **Codex（替代）** - 开发、实现和自动化

## 工作流程

```mermaid
flowchart LR
    A[Phase 1: 任务理解] --> B[Phase 2: 上下文发现]
    B --> C[Phase 3: Prompt 增强]
    C --> D[Phase 4: 工具执行]
    D --> E[Phase 5: 输出路由]
```

### Phase 1: 任务理解

**意图检测**:

| 关键词 | 意图类型 |
|--------|----------|
| analyze, review, understand, explain, debug | analyze |
| implement, add, create, build, fix, refactor | execute |
| design, plan, architecture, strategy | plan |
| discuss, evaluate, compare, trade-off | discuss |

**复杂度评分**:

```
Score = 0
+ ['system', 'architecture'] → +3
+ ['refactor', 'migrate'] → +2
+ ['component', 'feature'] → +1
+ 多技术栈 → +2
+ ['auth', 'payment', 'security'] → +2

≥5 Complex | ≥2 Medium | <2 Simple
```

### Phase 2: 上下文发现

**工具优先级**: ACE (`mcp__ace-tool__search_context`) → CCW (`mcp__ccw-tools__smart_search`) / 内置 (`Grep`, `Glob`, `Read`)

**相关性评分**:

```
路径精确匹配 +5 | 文件名 +3 | 内容 ×2 | 源码 +2 | 测试 +1 | 配置 +1
→ 按分数排序 → 选择前 15 个 → 按类型分组
```

### Phase 3: Prompt 增强

**结构化 Prompt**:

```bash
PURPOSE: {增强的意图}
TASK: {具体任务详情}
MODE: {analysis|write|auto}
CONTEXT: {结构化文件引用}
EXPECTED: {清晰输出期望}
CONSTRAINTS: {约束条件}
```

**模板选择** (`~/.ccw/workflows/cli-templates/prompts/`):

| 意图 | 模板 |
|------|------|
| analyze | analysis/code-execution-tracing.txt |
| execute | development/feature.txt |
| plan | planning/architecture-planning.txt |
| bug-fix | development/bug-diagnosis.txt |

### Phase 4: 工具执行

**执行策略**:
- 高复杂度 → Gemini
- 低复杂度 → Qwen
- 回退链: Gemini → Qwen → Codex

### Phase 5: 输出路由

- 会话日志保存
- 摘要生成
- 结果返回给调用者

## 使用场景

### 什么时候使用这个 Agent

- **智能 CLI 执行**: 需要自动上下文发现的 CLI 任务
- **复杂分析**: 需要多工具协调的复杂分析
- **Prompt 增强**: 需要结构化 Prompt 的任务

## 关联组件

- **相关 Skills**: [workflow-plan](../skills/workflow-plan.md)
- **相关 Agents**: [cli-planning-agent](cli-planning-agent.md), [cli-explore-agent](cli-explore-agent.md)

## 最佳实践

1. **使用意图检测**: 自动确定任务类型
2. **上下文发现优先**: 使用 ACE 进行语义搜索
3. **结构化 Prompt**: 使用模板确保一致性
4. **遵循回退链**: 工具失败时自动切换
5. **记录输出**: 保存会话日志用于参考
