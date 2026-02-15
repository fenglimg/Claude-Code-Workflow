---
id: REQ-007
type: functional
priority: Must
traces_to: [G-006]
status: draft
---

# REQ-007: 新命令检测机制

**Priority**: Must

## Description

开发自动检测新增命令和技能的机制，当代码库有新增项时自动报告，确保知识库与代码同步。

## User Story

As a **技术维护人员**, I want to **自动发现新增的命令和技能** so that **我能够及时更新知识库，避免遗漏**。

## Acceptance Criteria

- [ ] 检测 ccw/src/commands/ 目录下新增的命令文件
- [ ] 检测 .claude/skills/ 目录下新增的技能目录
- [ ] 检测 ccw/src/core/routes/ 目录下新增的 API 端点
- [ ] 生成新增项报告（JSON + Markdown）
- [ ] 支持基于 Git diff 的增量检测
- [ ] 集成到 CI 流程中

## Content Requirements

### 检测逻辑

```javascript
// 增量检测
function detectNewItems(previousCommit, currentCommit) {
  const changedFiles = git.diff(previousCommit, currentCommit)
  const newCommands = scanCommands(changedFiles)
  const newSkills = scanSkills(changedFiles)
  const newRoutes = scanRoutes(changedFiles)
  
  return {
    commands: newCommands,
    skills: newSkills,
    routes: newRoutes
  }
}
```

### 报告格式

```json
{
  "detection_time": "2026-02-15T13:35:00Z",
  "base_commit": "abc123",
  "head_commit": "def456",
  "new_items": [
    {
      "type": "command",
      "id": "workflow:new-feature",
      "file": "ccw/src/commands/workflow.ts",
      "detected_at": "2026-02-15T13:35:00Z"
    }
  ],
  "action_required": "请为新增命令生成知识文档"
}
```

## Traces

- **Goal**: [G-006](../product-brief.md#goals--success-metrics)
- **Implemented by**: 待生成 EPIC
