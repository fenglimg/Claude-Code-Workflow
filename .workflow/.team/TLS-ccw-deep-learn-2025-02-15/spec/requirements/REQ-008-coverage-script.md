---
id: REQ-008
title: "Coverage Detection Script"
priority: Must
status: draft
traces:
  - ../product-brief.md
---

# REQ-008: Coverage Detection Script

## Description

开发一个 TypeScript 脚本，自动扫描 `.claude/` 目录并检测知识库的覆盖情况。

## User Story

**As a** 维护者
**I want** 自动检测哪些命令/技能缺少文档
**So that** 我能确保知识库与代码库同步

## Acceptance Criteria

1. 脚本能扫描 `.claude/skills/` 并列出所有 SKILL.md
2. 脚本能扫描 `.claude/commands/` 并列出所有命令
3. 脚本能扫描 `.claude/agents/` 并列出所有代理
4. 脚本能对比 `docs/knowledge-base/` 中的文档
5. 脚本输出覆盖率报告（JSON + Markdown）
6. 脚本支持 `--fail-on-missing` 参数（CI 模式）

## Technical Requirements

```typescript
interface CoverageReport {
  timestamp: string;
  skills: {
    total: number;
    documented: number;
    missing: string[];
  };
  commands: {
    total: number;
    documented: number;
    missing: string[];
  };
  agents: {
    total: number;
    documented: number;
    missing: string[];
  };
  overall_coverage: number; // percentage
}
```

## Output

- `scripts/coverage-check.ts`
- `scripts/coverage-report.json` (generated)
- `scripts/coverage-report.md` (generated)
