---
id: NFR-M-001
type: non-functional
category: Maintainability
priority: Must
status: draft
---

# NFR-M-001: 新增命令自动检测

**Category**: Maintainability (可维护性)
**Priority**: Must

## Requirement

系统必须能够自动检测代码库中新增的命令和技能，并生成报告提醒维护人员更新知识库。

## Measurement Criteria

| 指标 | 目标 |
|------|------|
| 检测延迟 | ≤ 5 分钟（从代码提交到报告生成） |
| 误报率 | ≤ 5% |
| 漏报率 | 0% |

## Detection Scope

- 新增命令文件 (`ccw/src/commands/*.ts`)
- 新增技能目录 (`.claude/skills/*/`)
- 新增 MCP 路由 (`ccw/src/core/routes/*.ts`)
- 新增代理文件 (`.claude/agents/*.md`)

## Implementation Requirements

1. 基于 Git diff 检测文件变更
2. 解析新增文件提取元数据
3. 比对现有知识库识别新增项
4. 生成报告并通知

## Traces

- **Goal**: [G-006](../product-brief.md#goals--success-metrics)
