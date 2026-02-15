---
id: EPIC-005
priority: Must
mvp: true
size: M
requirements: [REQ-005]
architecture: [ADR-001]
dependencies: [EPIC-001]
status: draft
---

# EPIC-005: 服务器知识库

**Priority**: Must
**MVP**: Yes
**Estimated Size**: M

## Description

生成 CCW Dashboard 服务器和 CLI 交互的完整知识文档，包括 API 调用、会话管理和状态同步机制。

## Requirements

- [REQ-005](../requirements/REQ-005-server-interaction.md): 服务器交互文档

## Architecture

- [ADR-001](../architecture/ADR-001-knowledge-format.md): 知识库格式选择
- Component: Dashboard Server

## Dependencies

- [EPIC-001](EPIC-001-architecture-doc.md) (blocking): 需要架构文档作为模板基础

## Stories

### STORY-005-001: Dashboard API 文档

**User Story**: As a 前端开发者, I want to 查阅 Dashboard API so that 我能够开发 Dashboard 扩展.

**Acceptance Criteria**:
- [ ] 包含所有 /api/sessions 端点文档
- [ ] 包含所有 /api/memory 端点文档
- [ ] 包含所有 /api/search 端点文档
- [ ] 每个端点包含请求/响应格式

**Size**: M
**Traces to**: [REQ-005](../requirements/REQ-005-server-interaction.md)

---

### STORY-005-002: CLI 交互模式文档

**User Story**: As a 工具开发者, I want to 理解 CLI 交互模式 so that 我能够开发 CLI 扩展.

**Acceptance Criteria**:
- [ ] 包含命令解析流程说明
- [ ] 包含 Handler 调用链说明
- [ ] 包含 Core Service 调用说明
- [ ] 包含响应格式化说明

**Size**: M
**Traces to**: [REQ-005](../requirements/REQ-005-server-interaction.md)

---

### STORY-005-003: 会话管理文档

**User Story**: As a 技术维护人员, I want to 理解会话管理机制 so that 我能够排查会话问题.

**Acceptance Criteria**:
- [ ] 包含会话创建和恢复流程
- [ ] 包含会话状态持久化说明 (SQLite)
- [ ] 包含会话聚类和历史导入说明
- [ ] 包含会话生命周期图

**Size**: M
**Traces to**: [REQ-005](../requirements/REQ-005-server-interaction.md)

---

### STORY-005-004: WebSocket 通信文档

**User Story**: As a 前端开发者, I want to 理解 WebSocket 通信 so that 我能够实现实时更新.

**Acceptance Criteria**:
- [ ] 包含 WebSocket 连接说明
- [ ] 包含所有事件类型文档
- [ ] 包含消息格式说明
- [ ] 包含断线重连策略

**Size**: S
**Traces to**: [REQ-005](../requirements/REQ-005-server-interaction.md)
