---
id: REQ-002
title: "Commands Documentation"
priority: Must
status: draft
traces:
  - ../product-brief.md
---

# REQ-002: Commands Documentation

## Description

为所有 48 个 CCW 命令生成标准化文档，包括参数说明、使用示例和触发条件。

## User Story

**As a** 框架使用者
**I want** 快速查找和理解任何命令的用法
**So that** 我能高效使用 CCW 完成开发任务

## Acceptance Criteria

1. 所有 48 个命令都有对应文档
2. 每个文档包含：描述、参数、返回值、示例
3. 命令按类别分组（cli/issue/memory/workflow/core）
4. 提供分类索引页
5. 每个命令至少有一个使用示例
6. 标注命令间的依赖和组合关系

## Command Categories

| 类别 | 数量 | 示例 |
|------|------|------|
| cli | 2 | cli-init, codex-review |
| issue | 8 | new, plan, execute, queue |
| memory | 2 | prepare, style-skill-memory |
| workflow | 25 | session/*, ui-design/*, brainstorm/* |
| core | 6 | ccw, ccw-coordinator, ccw-test |

## Output

- `docs/knowledge-base/commands/*.md` (48 files)
- `docs/knowledge-base/commands/_index.md`
