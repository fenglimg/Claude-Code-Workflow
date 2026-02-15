---
id: EPIC-004
priority: Must
mvp: true
size: M
requirements: [REQ-004]
architecture: [ADR-001, ADR-002]
dependencies: [EPIC-001]
status: draft
---

# EPIC-004: MCP 知识库

**Priority**: Must
**MVP**: Yes
**Estimated Size**: M

## Description

生成 CCW MCP 集成的完整知识文档，包括 MCP 服务器架构、工具定义和调用模式。

## Requirements

- [REQ-004](../requirements/REQ-004-mcp-integration.md): MCP 集成文档

## Architecture

- [ADR-001](../architecture/ADR-001-knowledge-format.md): 知识库格式选择
- [ADR-004](../architecture/ADR-004-script-language.md): 脚本语言选择
- Component: MCP 扫描器

## Dependencies

- [EPIC-001](EPIC-001-architecture-doc.md) (blocking): 需要架构文档作为模板基础

## Stories

### STORY-004-001: MCP 服务器架构文档

**User Story**: As a AI 工程师, I want to 理解 MCP 服务器架构 so that 我能够正确配置和使用 MCP.

**Acceptance Criteria**:
- [ ] 包含 ccw-mcp 服务器启动说明
- [ ] 包含 MCP 协议版本说明
- [ ] 包含服务器配置选项
- [ ] 包含与 Claude Code 的集成方式

**Size**: M
**Traces to**: [REQ-004](../requirements/REQ-004-mcp-integration.md)

---

### STORY-004-002: MCP 工具清单

**User Story**: As a 开发者, I want to 查阅所有 MCP 工具 so that 我能够使用正确的工具完成任务.

**Acceptance Criteria**:
- [ ] 包含 read_file 工具文档
- [ ] 包含 write_file 工具文档
- [ ] 包含 edit_file 工具文档
- [ ] 包含 team_msg 工具文档
- [ ] 包含 smart_search 工具文档
- [ ] 包含所有 MCP 工具 (22+)
- [ ] 每个工具包含参数说明和使用示例

**Size**: L
**Traces to**: [REQ-004](../requirements/REQ-004-mcp-integration.md)

---

### STORY-004-003: MCP 调用模式文档

**User Story**: As a 技术维护人员, I want to 理解 MCP 调用模式 so that 我能够排查集成问题.

**Acceptance Criteria**:
- [ ] 包含 JSON-RPC 2.0 协议说明
- [ ] 包含同步/异步调用说明
- [ ] 包含错误处理机制说明
- [ ] 包含重试策略说明

**Size**: S
**Traces to**: [REQ-004](../requirements/REQ-004-mcp-integration.md)
