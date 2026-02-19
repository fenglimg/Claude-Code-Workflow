# Part XI Section C: Agent Layer - Intelligent Execution

> **Deep Study Module**: Agent Architecture and Intelligence Patterns
> **Version**: 1.0
> **Last Updated**: 2025-02-18

---

## Overview

Section C covers the Agent layer of CCW architecture, focusing on intelligent execution patterns, multi-step reasoning, and self-correction mechanisms. These agents are the "hands" of the system, executing tasks with varying degrees of autonomy and intelligence.

---

## Chapters

### Chapter 43: Planning Agents - Multi-Step Reasoning Models

**File**: [ch43-planning-agents.md](./ch43-planning-agents.md)

**Topics Covered**:
- 4-phase planning workflow (Context Loading, Synthesis, Task Generation, Validation)
- Action-planning-agent, cli-planning-agent, cli-lite-planning-agent, cli-roadmap-plan-agent
- Task JSON unified flat schema
- CLI execution strategy selection (new/resume/fork/merge_fork)
- Quantification requirements for task specifications

**Key Insights**:
| Agent | Specialty | Output |
|-------|-----------|--------|
| action-planning-agent | Complex multi-module planning | plan.json + IMPL_PLAN.md |
| cli-planning-agent | CLI execution strategy | Enhanced cli_execution field |
| cli-lite-planning-agent | Lightweight fast planning | Simplified task JSON |
| cli-roadmap-plan-agent | Long-term roadmap | Multi-stage milestone plan |

---

### Chapter 44: CLI Explore Agent - Dual-Source Analysis Strategy

**File**: [ch44-cli-explore-agent.md](./ch44-cli-explore-agent.md)

**Topics Covered**:
- 4-phase exploration workflow (Task Understanding, Analysis Execution, Schema Validation, Output Generation)
- Dual-source strategy (Bash + Gemini)
- Analysis modes: quick-scan, deep-scan, dependency-map
- Schema validation protocol (CRITICAL phase)
- File rationale validation requirements

**Key Insights**:
| Mode | Tools | Time | Use Case |
|------|-------|------|----------|
| quick-scan | Bash only | 10-30s | Fast structure overview |
| deep-scan | Bash + Gemini | 2-5min | Deep design analysis |
| dependency-map | Bash + Gemini | 3-8min | Dependency graph building |

---

### Chapter 45: Debug Explore Agent - Hypothesis-Driven Debugging

**File**: [ch45-debug-explore-agent.md](./ch45-debug-explore-agent.md)

**Topics Covered**:
- 5-phase debugging workflow (Bug Analysis, Hypothesis Generation, Instrumentation, Log Analysis, Fix Verification)
- NDJSON log format with session structure
- Hypothesis generation patterns and category mapping
- Iterative feedback loop
- Instrumentation templates for Python and TypeScript

**Key Insights**:
| Error Pattern | Hypothesis Category |
|---------------|---------------------|
| not found, missing, undefined | data_mismatch |
| 0, empty, zero, no results | logic_error |
| timeout, connection, sync | integration_issue |
| type, format, parse, invalid | type_mismatch |
| race, concurrent, async | timing_issue |

---

### Chapter 46: Context Search Agent - Semantic Index Building

**File**: [ch46-context-search-agent.md](./ch46-context-search-agent.md)

**Topics Covered**:
- 3-phase execution (Initialization, Multi-Source Discovery, Synthesis & Packaging)
- 3-source strategy: Reference docs, Web examples, Existing code
- CodexLens MCP tool priority over ripgrep
- context-package.json schema structure
- Brainstorm artifacts integration

**Key Insights**:
| Source | Priority | Value |
|--------|----------|-------|
| Reference docs | High | Project conventions, architecture decisions |
| Existing code | Medium | Actual implementation, real patterns |
| Web examples | Low | Best practices, modern patterns |

---

### Chapter 47: CLI Execution Agent - 5-Stage Execution Flow

**File**: [ch47-cli-execution-agent.md](./ch47-cli-execution-agent.md)

**Topics Covered**:
- 5-phase workflow (Task Understanding, Context Discovery, Prompt Enhancement, Tool Selection, Output Routing)
- Tool selection hierarchy: Gemini (Primary) -> Qwen -> Codex
- Intent detection and complexity scoring
- Prompt enhancement with template selection
- Plan-aware prompt enhancement for plan.json execution

**Key Insights**:
| Intent | Template |
|--------|----------|
| analyze | analysis/code-execution-tracing.txt |
| execute | development/feature.txt |
| plan | planning/architecture-planning.txt |
| bug-fix | development/bug-diagnosis.txt |

---

### Chapter 48: Test Fix Agent - Self-Correction Loop

**File**: [ch48-test-fix-agent.md](./ch48-test-fix-agent.md)

**Topics Covered**:
- Multi-layered test execution (L0-L3)
- Layer-aware diagnosis with different approaches per layer
- Criticality assessment: high, medium, low
- "Tests Are the Review" philosophy
- test-results.json format for orchestrator consumption

**Key Insights**:
| Layer | Type | Framework |
|-------|------|-----------|
| L0 | Static | ESLint, TSC |
| L1 | Unit | Vitest, Jest |
| L2 | Integration | Jest |
| L3 | E2E | Playwright |

---

### Chapter 49: Code Developer Agent - Incremental Implementation

**File**: [ch49-code-developer.md](./ch49-code-developer.md)

**Topics Covered**:
- 5-phase implementation workflow (Context Assessment, Pre-Analysis, Implementation, Quality Gates, Task Completion)
- Dual-mode execution (Agent direct vs CLI handoff)
- Module verification protocol with search tool priority
- Context sufficiency scoring (0.0-1.0 threshold)
- Resume strategies (new/resume/fork/merge_fork)

**Key Insights**:
| Context Score | Action | Tool |
|---------------|--------|------|
| < 0.6 | Supplement with Gemini analysis | Gemini |
| >= 0.6 | Direct implementation | Agent/CLI |
| Module reference | Verify existence first | ACE/Grep |

---

## Agent Role Classification

| Classification | Agents | Core Responsibility |
|----------------|--------|---------------------|
| **Planning** | action-planning-agent, cli-planning-agent, cli-lite-planning-agent, cli-roadmap-plan-agent | Transform requirements into structured tasks |
| **Analysis** | cli-explore-agent, context-search-agent, debug-explore-agent | Discover and analyze codebase context |
| **Execution** | cli-execution-agent, code-developer | Intelligently execute CLI commands and implement code |
| **Quality** | test-fix-agent | Ensure code quality through testing |

---

## MEU Drift Report - Part XI Agents

> **MEU (Module Execution Unit)** stability tracking for Agent layer components.

### Stability Summary

| Agent | MEU Status | Drift Risk | Last Audit |
|-------|------------|------------|------------|
| action-planning-agent | Stable | Low | 2025-01-20 |
| cli-planning-agent | Stable | Low | 2025-01-18 |
| cli-lite-planning-agent | Stable | Low | 2025-01-15 |
| cli-roadmap-plan-agent | Stable | Low | 2025-01-12 |
| cli-explore-agent | Stable | Medium | 2025-01-20 |
| debug-explore-agent | Stable | Medium | 2025-01-25 |
| context-search-agent | Stable | Medium | 2025-01-28 |
| cli-execution-agent | Stable | Medium | 2025-02-01 |
| test-fix-agent | Stable | Low | 2025-02-05 |
| code-developer | Stable | Medium | 2025-02-10 |

### Drift Indicators

| Indicator | Description | Affected Agents |
|-----------|-------------|-----------------|
| **Context Accumulation** | Context grows across agent handoffs | action-planning, context-search |
| **Template Mismatch** | Wrong template selection affects output | cli-execution |
| **Schema Drift** | Output format changes break downstream | cli-explore, context-search |
| **Loop Detection** | Missing loop detection causes infinite cycles | debug-explore |
| **Coverage False Sense** | High coverage masks quality issues | test-fix |
| **Module Verification Skip** | Skipping module existence check causes runtime errors | code-developer |
| **Context Score False Positive** | Threshold just above limit still missing critical context | code-developer |

### Recommended Actions

1. **Context Accumulation**: Implement context pruning in action-planning-agent
2. **Template Mismatch**: Add intent validation before template selection
3. **Schema Drift**: Add version field to all JSON outputs
4. **Loop Detection**: Add iteration counter to debug-explore-agent
5. **Coverage False Sense**: Add quality metrics alongside coverage
6. **Module Verification Skip**: Enforce mandatory module verification before any import
7. **Context Score False Positive**: Add critical context validation beyond score threshold

---

## Ghost Tracking Progress

```markdown
调查进度: ██████████ 45%
幽灵位置: Part XI Agent 层 — 7 个章节完成

本章完成:
├── Chapter 43: 规划智能体 — 多步推理模型 ✅
├── Chapter 44: 探索智能体 — 双源分析策略 ✅
├── Chapter 45: 调试智能体 — 假设驱动调试 ✅
├── Chapter 46: 上下文搜索智能体 — 语义索引构建 ✅
├── Chapter 47: CLI 执行智能体 — 5 阶段执行流 ✅
├── Chapter 48: 测试修复智能体 — 自我修正循环 ✅
└── Chapter 49: 代码开发智能体 — 增量实现与质量守护 ✅

幽灵线索:
├── CLI 执行策略配置异常 (Ch43)
├── Schema 验证失败模式 (Ch44)
├── 假设验证循环异常 (Ch45)
├── 上下文收集不完整 (Ch46)
├── 模板选择错误模式 (Ch47)
├── 层级诊断错误模式 (Ch48)
└── 模块验证遗漏模式 (Ch49)
```

---

## Quick Navigation

- **Main Outline**: [../OUTLINE.md](../OUTLINE.md)
- **Previous Part**: [../part10-extension](../part10-extension) (if exists)
- **Next Part**: [../part12-integration](../part12-integration) (if exists)

---

## Related Documentation

### Internal Documentation

- Agent Definitions: `.claude/agents/*.md`
- Skill Definitions: `.claude/skills/*/SKILL.md`
- Task Schema: `ccw/schemas/task-schema.json`
- Context Package Schema: `ccw/schemas/context-package.json`

### Related Chapters

- Part IV Orchestration Layer: Skill phases and execution
- Part VII Storage Layer: Session and artifact persistence
- Part VIII Frontend: Dashboard agent monitoring

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-02-18 | Initial documentation with 6 chapters |
| 1.1 | 2025-02-18 | Added Chapter 49: Code Developer Agent |

---

*Generated for CCW Architecture Deep Study*
*Part XI Section C: Agent Layer*
