---
session_id: TLS-ccw-deep-learn-2025-02-15
phase: 2
document_type: product-brief
status: draft
generated_at: 2025-02-15T13:15:00.000Z
version: 1
dependencies:
  - spec/spec-config.json
  - spec/discovery-context.json
  - discussions/discuss-001-scope.md
---

# Project Learning Brief: Claude-Code-Workflow 知识系统

## Vision

建立一套**完整、可验证、可维护**的知识系统，让开发者能够系统性掌握 Claude-Code-Workflow 框架的每一个细节——从核心架构到 48+ 命令、27+ 技能、MCP 集成和服务器交互模式——并确保知识库与代码库永远同步。

## Problem Statement

Claude-Code-Workflow (CCW) 是一个功能强大的多代理开发框架，但因其复杂性和规模（27 Skills, 48 Commands, 21 Agents），新用户面临陡峭的学习曲线：

1. **认知负担** - 大量命令和技能难以系统化学习
2. **文档分散** - 知识散落在各处，缺乏统一入口
3. **同步困难** - 代码更新后文档容易过时
4. **覆盖验证** - 无法确认是否已覆盖所有功能

## Target Users

| 用户类型 | 目标 | 痛点 |
|----------|------|------|
| **框架使用者** | 理解如何使用 CCW 提升开发效率 | 不知道有哪些命令/技能可用 |
| **开发者** | 扩展或定制 CCW 功能 | 不理解内部架构和扩展点 |
| **贡献者** | 为 CCW 贡献代码或技能 | 不清楚技能/命令的规范 |
| **维护者** | 确保文档与代码同步 | 缺乏自动化验证机制 |

## Goals & Success Metrics

### Goal 1: 完整覆盖
**Metric**: 100% 命令和技能有对应文档
- Skills: 27/27 文档化
- Commands: 48/48 文档化
- Agents: 21/21 文档化

### Goal 2: 可验证性
**Metric**: 覆盖率检测脚本通过率 = 100%
- 新增命令自动检测
- 缺失文档 CI 报警

### Goal 3: 可维护性
**Metric**: 文档更新与代码提交同步率 > 90%
- PR 门禁检查
- 每日全量验证

### Goal 4: 可学习性
**Metric**: 用户能在 30 分钟内理解框架核心概念
- 渐进式学习路径
- 每个技能有示例

## Scope

### In Scope ✅

| 模块 | 内容 |
|------|------|
| **核心架构** | CLI 入口、MCP Server、Tool Registry、路由系统 |
| **命令系统** | 所有 48 个命令的定义、参数、触发条件 |
| **技能系统** | 所有 27 个技能的 SKILL.md、phases、specs |
| **代理系统** | 所有 21 个代理的职责和能力 |
| **MCP 集成** | 可用工具、配置、调用模式 |
| **CLI 工具** | Gemini/Qwen/Codex/Claude 的调用方式 |
| **工作流系统** | 4-level workflow 和 session 管理 |
| **覆盖率验证** | 自动化检测脚本和 CI 集成 |

### Out of Scope ❌

- CCW 源码的逐行分析（聚焦概念和用法）
- 外部依赖库（如 better-sqlite3）的内部实现
- 历史版本和废弃功能
- 非公开 API

## Key Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CCW Knowledge System                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │  Architecture   │    │   Commands      │    │    Skills       │ │
│  │  核心架构文档    │    │   命令清单       │    │   技能清单       │ │
│  │                 │    │                 │    │                 │ │
│  │  - CLI 入口     │    │  - 48 commands  │    │  - 27 skills    │ │
│  │  - MCP Server   │    │  - 分类索引      │    │  - phases       │ │
│  │  - Tool Registry│    │  - 参数说明      │    │  - specs        │ │
│  │  - Routes       │    │  - 使用示例      │    │  - templates    │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘ │
│                                                                     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │    Agents       │    │   MCP 集成      │    │   CLI 工具      │ │
│  │   代理清单       │    │   工具映射       │    │   外部调用       │ │
│  │                 │    │                 │    │                 │ │
│  │  - 21 agents    │    │  - ccw-tools    │    │  - Gemini       │ │
│  │  - 职责定义      │    │  - ace-tool     │    │  - Codex        │ │
│  │  - 能力边界      │    │  - web-reader   │    │  - Claude       │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    Coverage Verification                        │ │
│  │                                                                 │ │
│  │  scripts/coverage-check.ts  →  .github/workflows/coverage.yml  │ │
│  │  - 扫描 .claude/ 目录                                            │ │
│  │  - 对比 docs/knowledge-base/                                    │ │
│  │  - 输出覆盖率报告                                                │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Technical Constraints

| 约束 | 说明 |
|------|------|
| 格式 | Markdown 为主，JSON 元数据为辅 |
| 存储 | `docs/knowledge-base/` 目录 |
| 验证 | TypeScript 脚本 + GitHub Actions |
| 触发 | PR 检查 + 每日 schedule |
| 覆盖率 | 必须 100% |

## Assumptions

1. CCW 的 Skills/Commands/Agents 目录结构稳定
2. 每个 Skill 都有 SKILL.md 入口文件
3. 每个命令都有 .md 定义文件
4. MCP 工具可通过 .mcp.json 发现

## Risks & Mitigations

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| 新增命令/技能遗漏 | 高 | CI 自动检测，PR 门禁 |
| 文档内容过时 | 中 | 每日全量验证，关联 commit hash |
| 组织结构混乱 | 中 | 分类索引，建立目录规范 |
| 学习路径缺失 | 低 | 后续添加渐进式指南 |

## Timeline (MVP)

| 阶段 | 内容 | 产出 |
|------|------|------|
| Phase 1 | 架构文档 | `architecture.md` |
| Phase 2 | 命令清单 | `commands/*.md` + 索引 |
| Phase 3 | 技能清单 | `skills/*.md` + 索引 |
| Phase 4 | MCP + CLI 文档 | `mcp.md` + `cli-tools.md` |
| Phase 5 | 覆盖率验证 | `coverage-check.ts` + CI |

## Success Definition

知识系统成功的标志是：

1. **完整性** - 所有 27 Skills + 48 Commands + 21 Agents 都有文档
2. **准确性** - 文档内容与代码实现一致
3. **可用性** - 新用户能在 30 分钟内理解核心概念
4. **可持续** - 任何新增功能都会自动触发文档更新提醒

---

*Generated by writer @ TLS-ccw-deep-learn-2025-02-15*
*Discussion feedback integrated from: discuss-001-scope.md*
