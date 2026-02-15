---
id: REQ-003
type: functional
priority: Must
traces_to: [G-003]
status: draft
---

# REQ-003: 技能清单生成

**Priority**: Must

## Description

生成 CCW 所有技能的完整清单文档，包括技能功能、触发条件、执行流程和模板规范。

## User Story

As a **开发者**, I want to **查阅完整的技能清单** so that **我能够理解每个技能的作用并正确使用它们**。

## Acceptance Criteria

- [ ] 包含所有 .claude/skills/ 下的技能 (30个)
- [ ] 每个技能包含：描述、触发条件、执行流程
- [ ] 包含技能依赖关系图
- [ ] 包含技能模板规范说明
- [ ] 技能覆盖率 100%

## Content Requirements

### 技能分类

| 类别 | 技能数量 | 示例技能 |
|------|---------|---------|
| 工作流 | 9 | workflow-plan, workflow-execute, brainstorm |
| 代码审查 | 3 | review-code, review-cycle |
| 团队协作 | 5 | team-lifecycle, team-skill-designer, team-issue |
| 知识管理 | 2 | memory-capture, memory-manage |
| 规格生成 | 2 | spec-generator, team-command-designer |
| 其他 | 9 | skill-generator, project-analyze, software-manual |

### 每个技能文档结构

```markdown
## {skill-name}

**描述**: 一句话说明
**位置**: .claude/skills/{skill-name}/

### 触发条件
- 触发方式1
- 触发方式2

### 执行流程
1. Phase 1: ...
2. Phase 2: ...

### 模板文件
- template1.md
- template2.md

### 依赖技能
- skill-a
- skill-b

### 使用示例
```

## Traces

- **Goal**: [G-003](../product-brief.md#goals--success-metrics)
- **Implemented by**: 待生成 EPIC
