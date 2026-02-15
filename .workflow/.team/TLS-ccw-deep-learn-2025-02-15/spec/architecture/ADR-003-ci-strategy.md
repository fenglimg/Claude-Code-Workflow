---
id: ADR-003
title: "CI 触发策略"
status: Accepted
traces_to: [REQ-008, NFR-P-001]
---

# ADR-003: CI 触发策略

## Context

需要确定 CI 自动化验证的触发时机，平衡及时性和资源消耗。

## Decision

采用 **PR + 每日 schedule** 的双重触发策略：

1. **PR 触发**: 涉及知识相关文件的 PR 提交时触发
2. **每日 schedule**: 每天凌晨执行全量覆盖率检测
3. **发布触发**: 版本发布时执行完整验证

## Alternatives

### Option 1: 仅 PR 触发
- **Pros**: 资源消耗低
- **Cons**: 可能遗漏非 PR 方式的变更

### Option 2: 每次提交触发
- **Pros**: 最及时
- **Cons**: 资源消耗高，可能阻塞开发

### Option 3: PR + 每日 schedule（选中）
- **Pros**: 平衡及时性和资源消耗
- **Cons**: 每日检测可能延迟发现问题

## Consequences

### Positive
- PR 保障关键变更的及时检测
- 每日检测确保全量覆盖
- 资源消耗可控

### Negative
- 每日检测可能在非工作日产生噪音

## Implementation

```yaml
# .github/workflows/knowledge-coverage.yml
on:
  pull_request:
    paths:
      - 'ccw/src/**'
      - '.claude/**'
      - 'docs/knowledge-base/**'
  schedule:
    - cron: '0 0 * * *'  # 每日 UTC 00:00
  release:
    types: [published]
```

### 触发路径

| 触发方式 | 检测范围 | 阻塞行为 |
|---------|---------|---------|
| PR | 变更相关项 | 低于阈值阻止合并 |
| Schedule | 全量 | 仅报告 |
| Release | 全量 | 阻止发布（可选） |
