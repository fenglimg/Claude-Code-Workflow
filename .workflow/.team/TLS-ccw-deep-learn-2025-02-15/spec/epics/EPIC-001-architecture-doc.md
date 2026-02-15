---
id: EPIC-001
priority: Must
mvp: true
size: M
requirements: [REQ-001]
architecture: [ADR-001]
dependencies: []
status: draft
---

# EPIC-001: 架构知识库

**Priority**: Must
**MVP**: Yes
**Estimated Size**: M

## Description

生成 CCW 核心架构的完整知识文档，包括设计理念、模块关系图、数据流图和四级工作流系统设计。

## Requirements

- [REQ-001](../requirements/REQ-001-architecture-docs.md): 架构文档生成

## Architecture

- [ADR-001](../architecture/ADR-001-knowledge-format.md): 知识库格式选择
- Component: 知识生成层

## Dependencies

无前置依赖（基础 Epic）

## Stories

### STORY-001-001: 核心设计理念文档

**User Story**: As a AI 工程师, I want to 查阅 CCW 的核心设计理念 so that 我能够理解框架的设计哲学.

**Acceptance Criteria**:
- [ ] 包含 JSON-First State 设计理念说明
- [ ] 包含 Context-First 设计理念说明
- [ ] 包含 Dependency-Aware Parallelism 说明
- [ ] 包含 Plugin Architecture 说明
- [ ] 文档使用 Markdown 格式，包含 YAML frontmatter

**Size**: S
**Traces to**: [REQ-001](../requirements/REQ-001-architecture-docs.md)

---

### STORY-001-002: 模块关系图

**User Story**: As a 开发者, I want to 查看模块关系图 so that 我能够理解各模块之间的依赖关系.

**Acceptance Criteria**:
- [ ] 使用 Mermaid graph TD 格式
- [ ] 包含 ccw/src/ 下所有核心模块
- [ ] 标注模块间的依赖方向
- [ ] 按层级组织（CLI → Commands → Core → Tools）

**Size**: M
**Traces to**: [REQ-001](../requirements/REQ-001-architecture-docs.md)

---

### STORY-001-003: 数据流图

**User Story**: As a 技术维护人员, I want to 查看数据流图 so that 我能够追踪请求的处理流程.

**Acceptance Criteria**:
- [ ] 使用 Mermaid 流程图格式
- [ ] 包含 CLI → Core → Tools → MCP 的完整链路
- [ ] 标注关键数据节点
- [ ] 说明状态流转

**Size**: M
**Traces to**: [REQ-001](../requirements/REQ-001-architecture-docs.md)

---

### STORY-001-004: 四级工作流系统文档

**User Story**: As a CCW 框架使用者, I want to 理解四级工作流系统 so that 我能够选择合适的工作流级别.

**Acceptance Criteria**:
- [ ] 包含 Level 1 (lite-lite-lite) 说明
- [ ] 包含 Level 2 (lite-plan, lite-fix, multi-cli-plan) 说明
- [ ] 包含 Level 3 (plan, tdd-plan) 说明
- [ ] 包含 Level 4 (brainstorm, coordinator) 说明
- [ ] 每个级别包含使用场景和示例

**Size**: M
**Traces to**: [REQ-001](../requirements/REQ-001-architecture-docs.md)
