---
id: EPIC-002
priority: Must
mvp: true
size: L
requirements: [REQ-002]
architecture: [ADR-001, ADR-002]
dependencies: [EPIC-001]
status: draft
---

# EPIC-002: 命令知识库

**Priority**: Must
**MVP**: Yes
**Estimated Size**: L

## Description

生成 CCW 所有命令的完整知识文档，包括命令分类、参数说明、使用场景和示例。

## Requirements

- [REQ-002](../requirements/REQ-002-command-inventory.md): 命令清单生成

## Architecture

- [ADR-001](../architecture/ADR-001-knowledge-format.md): 知识库格式选择
- [ADR-002](../architecture/ADR-002-coverage-detection.md): 覆盖率检测方案
- Component: 命令扫描器

## Dependencies

- [EPIC-001](EPIC-001-architecture-doc.md) (blocking): 需要架构文档作为模板基础

## Stories

### STORY-002-001: workflow:* 命令文档

**User Story**: As a 开发者, I want to 查阅所有 workflow 命令 so that 我能够使用工作流系统完成任务.

**Acceptance Criteria**:
- [ ] 包含所有 workflow:session:* 命令 (5个)
- [ ] 包含所有 workflow:core:* 命令 (6个)
- [ ] 包含所有 workflow:brainstorm:* 命令 (12个)
- [ ] 包含所有 workflow:review:* 命令 (5个)
- [ ] 每个命令包含描述、参数、使用场景、示例

**Size**: L
**Traces to**: [REQ-002](../requirements/REQ-002-command-inventory.md)

---

### STORY-002-002: issue:* 命令文档

**User Story**: As a 技术维护人员, I want to 查阅所有 issue 命令 so that 我能够使用 Issue 工作流管理问题.

**Acceptance Criteria**:
- [ ] 包含 /issue:discover 命令文档
- [ ] 包含 /issue:resolve 命令文档
- [ ] 包含 /issue:manage 命令文档
- [ ] 每个命令包含完整的使用示例

**Size**: S
**Traces to**: [REQ-002](../requirements/REQ-002-command-inventory.md)

---

### STORY-002-003: memory:* 命令文档

**User Story**: As a 开发者, I want to 查阅所有 memory 命令 so that 我能够使用记忆系统.

**Acceptance Criteria**:
- [ ] 包含 /memory:capture 命令文档
- [ ] 包含 /memory:manage 命令文档
- [ ] 说明记忆系统的工作原理

**Size**: S
**Traces to**: [REQ-002](../requirements/REQ-002-command-inventory.md)

---

### STORY-002-004: ccw:* 命令文档

**User Story**: As a CCW 框架使用者, I want to 查阅所有 ccw 命令 so that 我能够使用核心功能.

**Acceptance Criteria**:
- [ ] 包含 /ccw:plan 命令文档
- [ ] 包含 /ccw:test 命令文档
- [ ] 包含 /ccw:debug 命令文档
- [ ] 包含 /ccw:coordinator 命令文档
- [ ] 包含 /ccw 主命令文档

**Size**: M
**Traces to**: [REQ-002](../requirements/REQ-002-command-inventory.md)

---

### STORY-002-005: 命令分类索引

**User Story**: As a 新用户, I want to 查看命令分类索引 so that 我能够快速找到需要的命令.

**Acceptance Criteria**:
- [ ] 按功能域分组（workflow, issue, memory, ccw）
- [ ] 包含快速查找表
- [ ] 包含常用命令推荐

**Size**: S
**Traces to**: [REQ-002](../requirements/REQ-002-command-inventory.md)
