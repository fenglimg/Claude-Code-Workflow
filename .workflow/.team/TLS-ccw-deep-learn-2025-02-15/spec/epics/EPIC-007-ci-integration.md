---
id: EPIC-007
priority: Must
mvp: true
size: M
requirements: [REQ-008, REQ-009, NFR-V-001, NFR-P-001]
architecture: [ADR-003, ADR-004]
dependencies: [EPIC-006]
status: draft
---

# EPIC-007: CI 集成

**Priority**: Must
**MVP**: Yes
**Estimated Size**: M

## Description

配置 GitHub Actions CI 工作流，实现覆盖率验证和新命令检测的自动化。

## Requirements

- [REQ-008](../requirements/REQ-008-ci-integration.md): CI 集成配置
- [REQ-009](../requirements/REQ-009-validation-tests.md): 验证测试用例
- [NFR-V-001](../requirements/NFR-V-001-automated-tests.md): 自动化测试
- [NFR-P-001](../requirements/NFR-P-001-ci-time.md): CI 验证时间

## Architecture

- [ADR-003](../architecture/ADR-003-ci-strategy.md): CI 触发策略
- [ADR-004](../architecture/ADR-004-script-language.md): 脚本语言选择
- Components: GitHub Actions, 报告生成器

## Dependencies

- [EPIC-006](EPIC-006-coverage-verification.md) (blocking): 需要覆盖率验证工具

## Stories

### STORY-007-001: PR 触发工作流配置

**User Story**: As a 技术维护人员, I want to 在 PR 时自动验证覆盖率 so that 我能够确保变更不会降低覆盖率.

**Acceptance Criteria**:
- [ ] 配置 pull_request 触发器
- [ ] 配置路径过滤（ccw/src/**, .claude/**）
- [ ] 执行覆盖率检测
- [ ] 上传报告 artifact

**Size**: S
**Traces to**: [REQ-008](../requirements/REQ-008-ci-integration.md)

---

### STORY-007-002: 每日定时工作流配置

**User Story**: As a 技术维护人员, I want to 每日自动执行全量检测 so that 我能够定期检查覆盖率.

**Acceptance Criteria**:
- [ ] 配置 schedule 触发器（每日 UTC 00:00）
- [ ] 执行全量覆盖率检测
- [ ] 生成覆盖率趋势报告

**Size**: S
**Traces to**: [REQ-008](../requirements/REQ-008-ci-integration.md)

---

### STORY-007-003: 阈值门禁配置

**User Story**: As a 技术维护人员, I want to 配置覆盖率阈值 so that 我能够阻止覆盖率下降的合并.

**Acceptance Criteria**:
- [ ] 配置覆盖率阈值（90% 阻止合并）
- [ ] 配置警告阈值（95% 警告）
- [ ] PR 检查状态与覆盖率关联

**Size**: S
**Traces to**: [REQ-008](../requirements/REQ-008-ci-integration.md)

---

### STORY-007-004: PR 评论报告

**User Story**: As a 贡献者, I want to 在 PR 中看到覆盖率报告 so that 我能够了解变更的影响.

**Acceptance Criteria**:
- [ ] 生成 PR 评论内容
- [ ] 包含覆盖率百分比
- [ ] 包含遗漏项列表
- [ ] 包含改进建议

**Size**: M
**Traces to**: [REQ-008](../requirements/REQ-008-ci-integration.md)

---

### STORY-007-005: 验证测试用例开发

**User Story**: As a 知识系统开发者, I want to 开发验证测试 so that 我能够确保知识文档质量.

**Acceptance Criteria**:
- [ ] 开发格式验证测试
- [ ] 开发内容验证测试
- [ ] 开发一致性验证测试
- [ ] 集成到 CI 流程

**Size**: M
**Traces to**: [REQ-009](../requirements/REQ-009-validation-tests.md)

---

### STORY-007-006: 性能优化

**User Story**: As a 技术维护人员, I want to 优化 CI 执行时间 so that 我能够快速获得反馈.

**Acceptance Criteria**:
- [ ] 实现增量检测
- [ ] 配置依赖缓存
- [ ] 并行执行检测任务
- [ ] 总执行时间 ≤ 5 分钟

**Size**: M
**Traces to**: [NFR-P-001](../requirements/NFR-P-001-ci-time.md)
