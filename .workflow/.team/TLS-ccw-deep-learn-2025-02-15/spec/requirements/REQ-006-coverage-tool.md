---
id: REQ-006
type: functional
priority: Must
traces_to: [G-005]
status: draft
---

# REQ-006: 覆盖率验证工具

**Priority**: Must

## Description

开发覆盖率验证脚本，自动检测知识库对代码库的覆盖程度，生成覆盖率报告。

## User Story

As a **技术维护人员**, I want to **运行覆盖率验证脚本** so that **我能够了解知识库的完整性并发现遗漏**。

## Acceptance Criteria

- [ ] 自动扫描 ccw/src/commands/ 发现所有命令
- [ ] 自动扫描 .claude/skills/ 发现所有技能
- [ ] 自动扫描 ccw/src/core/routes/ 发现所有 MCP 工具
- [ ] 比对知识库文档，计算覆盖率
- [ ] 生成 JSON 格式覆盖率报告
- [ ] 生成 Markdown 格式覆盖率摘要
- [ ] 支持增量检测（仅检测变更部分）

## Content Requirements

### 检测算法

```
覆盖率 = (已文档化项 / 总项数) × 100%

已文档化项判定标准：
1. 文件存在
2. 内容完整（包含描述、参数、示例）
3. 元数据正确（YAML frontmatter）
```

### 报告格式

```json
{
  "timestamp": "2026-02-15T13:30:00Z",
  "git_sha": "abc123",
  "summary": {
    "total_items": 100,
    "covered_items": 95,
    "coverage_percentage": 95.0
  },
  "categories": {
    "commands": { "total": 48, "covered": 46 },
    "skills": { "total": 30, "covered": 30 },
    "mcp_tools": { "total": 22, "covered": 19 }
  },
  "gaps": [
    { "type": "command", "id": "workflow:new-command", "status": "missing" }
  ]
}
```

## Traces

- **Goal**: [G-005](../product-brief.md#goals--success-metrics)
- **Implemented by**: 待生成 EPIC
