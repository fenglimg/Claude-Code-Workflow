---
id: ADR-002
title: "覆盖率检测方案"
status: Accepted
traces_to: [REQ-006, NFR-C-001]
---

# ADR-002: 覆盖率检测方案

## Context

需要自动检测知识库对代码库的覆盖程度，确保 100% 覆盖率目标的实现。

## Decision

采用 **文件扫描 + 元数据比对** 的双重检测方案：

1. **文件扫描**: 扫描代码目录发现所有命令/技能/工具
2. **元数据比对**: 比对知识库中是否有对应文档
3. **内容验证**: 检查文档是否包含必需字段

## Alternatives

### Option 1: 手动维护清单
- **Pros**: 简单，无需开发
- **Cons**: 容易遗漏，维护成本高

### Option 2: 代码注解提取
- **Pros**: 与代码紧密关联
- **Cons**: 需要修改现有代码，侵入性强

### Option 3: 文件扫描 + 元数据比对（选中）
- **Pros**: 非侵入性，自动化程度高
- **Cons**: 需要开发扫描脚本

## Consequences

### Positive
- 完全自动化，无需人工干预
- 可以准确计算覆盖率百分比
- 支持增量检测，性能好

### Negative
- 初始开发成本较高
- 需要维护扫描规则

## Implementation

```typescript
interface CoverageChecker {
  // 扫描命令
  scanCommands(): CommandInfo[];
  // 扫描技能
  scanSkills(): SkillInfo[];
  // 扫描 MCP 工具
  scanMCPTools(): MCPToolInfo[];
  // 计算覆盖率
  calculateCoverage(): CoverageReport;
  // 检测新增项
  detectNewItems(): NewItemReport;
}
```

### 覆盖率公式

```
覆盖率 = (已文档化项 / 总项数) × 100%

已文档化判定：
1. 知识文档文件存在
2. YAML frontmatter 格式正确
3. 包含必需字段（描述、参数、示例）
```
