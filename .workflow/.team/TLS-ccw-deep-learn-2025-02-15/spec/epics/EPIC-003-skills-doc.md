---
id: EPIC-003
priority: Must
mvp: true
size: L
requirements: [REQ-003]
architecture: [ADR-001, ADR-002]
dependencies: [EPIC-001]
status: draft
---

# EPIC-003: 技能知识库

**Priority**: Must
**MVP**: Yes
**Estimated Size**: L

## Description

生成 CCW 所有技能的完整知识文档，包括技能功能、触发条件、执行流程和模板规范。

## Requirements

- [REQ-003](../requirements/REQ-003-skill-inventory.md): 技能清单生成

## Architecture

- [ADR-001](../architecture/ADR-001-knowledge-format.md): 知识库格式选择
- [ADR-002](../architecture/ADR-002-coverage-detection.md): 覆盖率检测方案
- Component: 技能扫描器

## Dependencies

- [EPIC-001](EPIC-001-architecture-doc.md) (blocking): 需要架构文档作为模板基础

## Stories

### STORY-003-001: 工作流技能文档

**User Story**: As a 开发者, I want to 查阅所有工作流技能 so that 我能够理解和使用工作流系统.

**Acceptance Criteria**:
- [ ] 包含 workflow-plan 技能文档
- [ ] 包含 workflow-execute 技能文档
- [ ] 包含 brainstorm 技能文档
- [ ] 包含所有 workflow 相关技能 (9个)
- [ ] 每个技能包含触发条件、执行流程、模板文件

**Size**: L
**Traces to**: [REQ-003](../requirements/REQ-003-skill-inventory.md)

---

### STORY-003-002: 代码审查技能文档

**User Story**: As a 代码审查者, I want to 查阅代码审查技能 so that 我能够使用审查工具.

**Acceptance Criteria**:
- [ ] 包含 review-code 技能文档
- [ ] 包含 review-cycle 技能文档
- [ ] 包含 review-module-cycle 技能文档

**Size**: M
**Traces to**: [REQ-003](../requirements/REQ-003-skill-inventory.md)

---

### STORY-003-003: 团队协作技能文档

**User Story**: As a 团队负责人, I want to 查阅团队协作技能 so that 我能够组织团队工作.

**Acceptance Criteria**:
- [ ] 包含 team-lifecycle 技能文档
- [ ] 包含 team-skill-designer 技能文档
- [ ] 包含 team-issue 技能文档
- [ ] 包含 team-command-designer 技能文档
- [ ] 包含 flow-coordinator 技能文档

**Size**: M
**Traces to**: [REQ-003](../requirements/REQ-003-skill-inventory.md)

---

### STORY-003-004: 知识管理技能文档

**User Story**: As a 知识管理者, I want to 查阅知识管理技能 so that 我能够维护知识库.

**Acceptance Criteria**:
- [ ] 包含 memory-capture 技能文档
- [ ] 包含 memory-manage 技能文档

**Size**: S
**Traces to**: [REQ-003](../requirements/REQ-003-skill-inventory.md)

---

### STORY-003-005: 其他技能文档

**User Story**: As a 开发者, I want to 查阅其他辅助技能 so that 我能够使用完整的工具集.

**Acceptance Criteria**:
- [ ] 包含 spec-generator 技能文档
- [ ] 包含 skill-generator 技能文档
- [ ] 包含 project-analyze 技能文档
- [ ] 包含 software-manual 技能文档
- [ ] 包含 ccw-help 技能文档
- [ ] 包含所有其他技能 (11个)

**Size**: L
**Traces to**: [REQ-003](../requirements/REQ-003-skill-inventory.md)

---

### STORY-003-006: 技能依赖关系图

**User Story**: As a 开发者, I want to 查看技能依赖关系 so that 我能够理解技能间的调用关系.

**Acceptance Criteria**:
- [ ] 使用 Mermaid graph LR 格式
- [ ] 标注技能间的前置/后置依赖
- [ ] 标注可选/必需依赖

**Size**: S
**Traces to**: [REQ-003](../requirements/REQ-003-skill-inventory.md)
