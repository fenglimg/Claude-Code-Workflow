---
id: ADR-004
title: "脚本语言选择"
status: Accepted
traces_to: [REQ-006, REQ-007, REQ-009]
---

# ADR-004: 脚本语言选择

## Context

需要选择用于实现覆盖率检测、变更检测和验证测试的脚本语言。

## Decision

采用 **TypeScript** 作为主要脚本语言：

1. 与 CCW 主项目技术栈一致
2. 可以复用现有的类型定义和工具函数
3. 支持类型安全，减少运行时错误

## Alternatives

### Option 1: Shell Script (Bash)
- **Pros**: 轻量，无需编译，CI 原生支持
- **Cons**: 复杂逻辑难以维护，缺乏类型安全

### Option 2: Python
- **Pros**: 丰富的库生态，易于编写
- **Cons**: 与主项目技术栈不一致，增加依赖

### Option 3: TypeScript（选中）
- **Pros**: 与主项目一致，类型安全，可复用代码
- **Cons**: 需要编译步骤

## Consequences

### Positive
- 团队无需学习新语言
- 可以复用 ccw/src/tools/ 中的工具函数
- 类型检查减少错误
- 测试框架统一（Vitest/Jest）

### Negative
- 需要编译步骤（但可以配置为开发时自动编译）

### Neutral
- 需要在 package.json 中添加相关脚本

## Implementation

```json
// package.json
{
  "scripts": {
    "build": "tsc -p ccw/tsconfig.json",
    "coverage:check": "node dist/scripts/coverage-check.js",
    "coverage:report": "node dist/scripts/coverage-report.js",
    "knowledge:validate": "node dist/scripts/knowledge-validate.js",
    "test:knowledge": "vitest run tests/knowledge/"
  }
}
```

### 代码结构

```
ccw/src/scripts/
├── coverage-check.ts      # 覆盖率检测
├── coverage-report.ts     # 报告生成
├── knowledge-validate.ts  # 文档验证
└── change-detector.ts     # 变更检测
```
