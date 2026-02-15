---
id: REQ-008
type: functional
priority: Must
traces_to: [G-005]
status: draft
---

# REQ-008: CI 集成配置

**Priority**: Must

## Description

配置 GitHub Actions CI 工作流，实现覆盖率验证和新命令检测的自动化。

## User Story

As a **技术维护人员**, I want to **CI 自动验证知识库覆盖率** so that **每次代码变更都能确保知识库同步**。

## Acceptance Criteria

- [ ] PR 提交时触发覆盖率检查
- [ ] 每日定时执行全量覆盖率报告
- [ ] 发布时触发完整验证
- [ ] 覆盖率低于阈值时阻止合并（可配置）
- [ ] 生成 CI 报告并上传 artifact
- [ ] 支持 PR 评论展示覆盖率摘要

## Content Requirements

### CI 工作流配置

```yaml
# .github/workflows/knowledge-coverage.yml
name: Knowledge Coverage Check

on:
  pull_request:
    paths:
      - 'ccw/src/**'
      - '.claude/**'
  schedule:
    - cron: '0 0 * * *'  # 每日
  release:
    types: [published]

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run coverage:check
      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage-report.json
```

### 阈值配置

```json
{
  "coverage_threshold": {
    "block_merge_below": 90,
    "warn_below": 95,
    "target": 100
  }
}
```

## Traces

- **Goal**: [G-005](../product-brief.md#goals--success-metrics)
- **Implemented by**: 待生成 EPIC
