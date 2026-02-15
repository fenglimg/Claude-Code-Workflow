---
id: ADR-001
title: "知识库格式选择"
status: Accepted
traces_to: [REQ-010]
---

# ADR-001: 知识库格式选择

## Context

知识库需要同时满足人类可读性和机器可解析性，用于：
1. 开发者查阅学习
2. AI 助手（Claude Code）理解和使用
3. 自动化验证和覆盖率检测

## Decision

采用 **Markdown + JSON 元数据** 的混合格式：

- **主文档**: Markdown 格式，包含 YAML frontmatter
- **元数据索引**: JSON 格式，用于快速查询和验证
- **覆盖率报告**: JSON + Markdown 双格式

## Alternatives

### Option 1: 纯 Markdown
- **Pros**: 简单，无需额外工具，GitHub 原生支持
- **Cons**: 难以程序化验证，元数据提取复杂

### Option 2: 纯 JSON
- **Pros**: 易于程序化处理，Schema 验证成熟
- **Cons**: 人类阅读体验差，需要额外渲染

### Option 3: 混合格式（选中）
- **Pros**: 兼顾人类阅读和机器解析
- **Cons**: 需要维护两种格式的同步

## Consequences

### Positive
- 开发者可以直接在 GitHub 上阅读 Markdown
- Claude Code 可以高效解析结构化内容
- 可以使用 JSON Schema 进行自动验证
- YAML frontmatter 提供元数据支持

### Negative
- 需要额外的同步脚本确保两种格式一致
- 增加了一定的维护复杂度

### Neutral
- 团队需要熟悉 YAML frontmatter 格式

## Implementation

```markdown
---
id: CMD-workflow-plan
type: command
category: workflow
status: complete
traces_to: [G-002]
---

# /workflow:plan

**描述**: 5阶段规划工作流...
```

## Review Feedback

讨论中确认此方案为最佳选择（D-001 决策）。
