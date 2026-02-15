---
id: REQ-002
type: functional
priority: Must
traces_to: [G-002]
status: draft
---

# REQ-002: 命令清单生成

**Priority**: Must

## Description

生成 CCW 所有命令的完整清单文档，包括命令分类、参数说明、使用场景和组合规则。

## User Story

As a **CCW 框架使用者**, I want to **查阅完整的命令清单** so that **我能够快速找到适合当前任务的命令**。

## Acceptance Criteria

- [ ] 包含所有 workflow:* 命令 (30+)
- [ ] 包含所有 cli:* 命令
- [ ] 包含所有 issue:* 命令 (discover, resolve, manage)
- [ ] 包含所有 memory:* 命令 (capture, manage)
- [ ] 包含所有 ccw:* 命令 (plan, test, debug, coordinator)
- [ ] 每个命令包含：描述、参数、使用场景、示例
- [ ] 包含命令分类索引
- [ ] 命令覆盖率 100%

## Content Requirements

### 命令分类

| 类别 | 命令数量 | 示例命令 |
|------|---------|---------|
| workflow:session | 5 | start, list, resume, complete |
| workflow:core | 6 | plan, execute, lite-plan, lite-fix, replan, status |
| workflow:brainstorm | 12 | auto-parallel, synthesis, artifacts, *-designer |
| workflow:review | 5 | review-module-cycle, review-session-cycle, review-fix |
| issue | 3 | discover, resolve, manage |
| memory | 2 | capture, manage |
| cli | 1 | cli-init |
| ccw | 5 | plan, test, debug, coordinator, ccw |

### 每个命令文档结构

```markdown
## /{category}:{command}

**描述**: 一句话说明
**分类**: {category}
**触发方式**: /{category}:{command}

### 参数

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|

### 使用场景
- 场景1
- 场景2

### 示例
```bash
# 示例1
/{category}:{command} --param value
```

### 关联技能
- skill-name
```

## Traces

- **Goal**: [G-002](../product-brief.md#goals--success-metrics)
- **Implemented by**: 待生成 EPIC
