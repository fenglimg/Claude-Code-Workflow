---
id: EPIC-006
priority: Must
mvp: true
size: L
requirements: [REQ-006, REQ-007, NFR-C-001, NFR-M-001]
architecture: [ADR-002, ADR-004]
dependencies: [EPIC-002, EPIC-003, EPIC-004, EPIC-005]
status: draft
---

# EPIC-006: 覆盖率验证系统

**Priority**: Must
**MVP**: Yes
**Estimated Size**: L

## Description

开发覆盖率验证脚本和新增命令检测机制，确保知识库与代码库同步。

## Requirements

- [REQ-006](../requirements/REQ-006-coverage-tool.md): 覆盖率验证工具
- [REQ-007](../requirements/REQ-007-new-command-detection.md): 新命令检测机制
- [NFR-C-001](../requirements/NFR-C-001-full-coverage.md): 100% 覆盖率
- [NFR-M-001](../requirements/NFR-M-001-auto-detection.md): 新增命令自动检测

## Architecture

- [ADR-002](../architecture/ADR-002-coverage-detection.md): 覆盖率检测方案
- [ADR-004](../architecture/ADR-004-script-language.md): 脚本语言选择
- Components: 格式验证器, 覆盖率计算器, 变更检测器

## Dependencies

- [EPIC-002](EPIC-002-commands-doc.md) (blocking): 需要命令知识库作为检测基准
- [EPIC-003](EPIC-003-skills-doc.md) (blocking): 需要技能知识库作为检测基准
- [EPIC-004](EPIC-004-mcp-doc.md) (blocking): 需要 MCP 知识库作为检测基准
- [EPIC-005](EPIC-005-server-doc.md) (blocking): 需要服务器知识库作为检测基准

## Stories

### STORY-006-001: 命令扫描器开发

**User Story**: As a 知识系统开发者, I want to 开发命令扫描器 so that 我能够自动发现所有命令.

**Acceptance Criteria**:
- [ ] 扫描 ccw/src/commands/ 目录
- [ ] 提取命令元数据（名称、描述、参数）
- [ ] 输出 JSON 格式的命令清单
- [ ] 支持 TypeScript 解析

**Size**: M
**Traces to**: [REQ-006](../requirements/REQ-006-coverage-tool.md)

---

### STORY-006-002: 技能扫描器开发

**User Story**: As a 知识系统开发者, I want to 开发技能扫描器 so that 我能够自动发现所有技能.

**Acceptance Criteria**:
- [ ] 扫描 .claude/skills/ 目录
- [ ] 提取技能元数据（名称、描述、触发条件）
- [ ] 输出 JSON 格式的技能清单
- [ ] 支持 SKILL.md 解析

**Size**: M
**Traces to**: [REQ-006](../requirements/REQ-006-coverage-tool.md)

---

### STORY-006-003: MCP 工具扫描器开发

**User Story**: As a 知识系统开发者, I want to 开发 MCP 扫描器 so that 我能够自动发现所有 MCP 工具.

**Acceptance Criteria**:
- [ ] 扫描 ccw/src/core/routes/ 目录
- [ ] 提取工具元数据（名称、描述、参数）
- [ ] 输出 JSON 格式的工具清单

**Size**: S
**Traces to**: [REQ-006](../requirements/REQ-006-coverage-tool.md)

---

### STORY-006-004: 覆盖率计算器开发

**User Story**: As a 技术维护人员, I want to 运行覆盖率计算器 so that 我能够了解知识库完整性.

**Acceptance Criteria**:
- [ ] 比对代码清单与知识库文档
- [ ] 计算覆盖率百分比
- [ ] 生成 JSON 格式覆盖率报告
- [ ] 生成 Markdown 格式摘要

**Size**: M
**Traces to**: [REQ-006](../requirements/REQ-006-coverage-tool.md)

---

### STORY-006-005: 变更检测器开发

**User Story**: As a 技术维护人员, I want to 运行变更检测器 so that 我能够发现新增的命令和技能.

**Acceptance Criteria**:
- [ ] 基于 Git diff 检测文件变更
- [ ] 识别新增的命令/技能/工具
- [ ] 生成新增项报告
- [ ] 支持增量检测模式

**Size**: M
**Traces to**: [REQ-007](../requirements/REQ-007-new-command-detection.md)

---

### STORY-006-006: 格式验证器开发

**User Story**: As a 知识系统开发者, I want to 运行格式验证器 so that 我能够确保文档格式正确.

**Acceptance Criteria**:
- [ ] 验证 YAML frontmatter 格式
- [ ] 验证必需字段存在性
- [ ] 验证字段类型正确性
- [ ] 输出验证错误报告

**Size**: M
**Traces to**: [REQ-006](../requirements/REQ-006-coverage-tool.md)
