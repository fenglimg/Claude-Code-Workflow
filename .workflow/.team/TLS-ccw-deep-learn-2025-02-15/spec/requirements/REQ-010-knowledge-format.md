---
id: REQ-010
type: functional
priority: Must
traces_to: [G-001]
status: draft
---

# REQ-010: 知识库格式规范

**Priority**: Must

## Description

定义知识库的文件格式和组织结构规范，确保知识文档的一致性和可维护性。

## User Story

As a **知识系统开发者**, I want to **遵循统一的格式规范** so that **知识库易于维护和扩展**。

## Acceptance Criteria

- [ ] 定义 Markdown 文档格式规范
- [ ] 定义 JSON 元数据格式规范
- [ ] 定义目录组织结构
- [ ] 定义命名规范
- [ ] 提供 JSON Schema 验证
- [ ] 提供文档模板

## Content Requirements

### 目录结构

```
docs/knowledge-base/
├── _index.md                    # 知识库首页
├── architecture/                # 架构知识
│   ├── overview.md
│   ├── modules.md
│   └── data-flow.md
├── commands/                    # 命令知识
│   ├── _index.md
│   ├── workflow/
│   ├── issue/
│   ├── memory/
│   └── ccw/
├── skills/                      # 技能知识
│   ├── _index.md
│   └── {skill-name}.md
├── mcp/                         # MCP 知识
│   ├── _index.md
│   └── tools.md
└── meta/                        # 元数据
    ├── coverage.json
    └── manifest.json
```

### 文档格式

```markdown
---
id: {unique-id}
type: command|skill|mcp|architecture
category: {category}
status: draft|review|complete
generated_at: {ISO8601}
traces_to: [G-XXX]
---

# {Title}

**分类**: {category}
**优先级**: Must|Should|Could

## 描述

{详细描述}

## 参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|

## 使用场景

- 场景1
- 场景2

## 示例

```bash
# 示例代码
```

## 关联

- [相关文档](link)
```

### JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "type", "status"],
  "properties": {
    "id": { "type": "string", "pattern": "^(REQ|NFR|CMD|SKILL)-[0-9]+$" },
    "type": { "enum": ["command", "skill", "mcp", "architecture"] },
    "status": { "enum": ["draft", "review", "complete"] }
  }
}
```

## Traces

- **Goal**: [G-001](../product-brief.md#goals--success-metrics)
- **Implemented by**: 待生成 EPIC
