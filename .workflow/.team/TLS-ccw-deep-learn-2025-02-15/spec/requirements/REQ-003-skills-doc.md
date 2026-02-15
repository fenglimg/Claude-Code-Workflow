---
id: REQ-003
title: "Skills Documentation"
priority: Must
status: draft
traces:
  - ../product-brief.md
---

# REQ-003: Skills Documentation

## Description

为所有 27 个 CCW 技能生成标准化文档，包括 SKILL.md、phases、specs 和 templates 的说明。

## User Story

**As a** 贡献者
**I want** 理解每个技能的结构和执行流程
**So that** 我能正确使用技能或创建新技能

## Acceptance Criteria

1. 所有 27 个技能都有对应文档
2. 每个文档包含：概述、phases 说明、specs 规范、templates 用法
3. 技能按类别分组（workflow_core/team/issue/analysis/docs/memory/other）
4. 提供分类索引页
5. 标注技能间的依赖关系
6. 包含创建新技能的指南

## Skill Categories

| 类别 | 数量 | 示例 |
|------|------|------|
| workflow_core | 7 | workflow-plan, workflow-execute, workflow-tdd |
| team | 4 | team-lifecycle, team-issue |
| issue | 3 | issue-discover, issue-resolve |
| analysis | 4 | project-analyze, review-code, brainstorm |
| docs | 3 | copyright-docs, software-manual |
| memory | 2 | memory-capture, memory-manage |
| other | 4 | ccw-help, skill-generator |

## Output

- `docs/knowledge-base/skills/*.md` (27 files)
- `docs/knowledge-base/skills/_index.md`
- `docs/knowledge-base/skills/creating-new-skill.md`
