# Part XI: Commands — The Executive Branch

> **Deep Study Module**: Command Layer Architecture and Implementation
> **Version**: 1.0
> **Last Updated**: 2025-02-18

---

## Overview

This module covers the command layer of CCW, which serves as the executive branch of the system. Commands are the user-facing entry points that orchestrate workflows, manage issues, and coordinate between agents, CLI tools, and storage systems.

The command layer implements a sophisticated architecture that includes:
- Intent analysis and workflow selection
- Issue lifecycle management (new → discover → plan → queue → execute)
- Session state management
- Multi-CLI collaboration for brainstorming
- Memory context preparation

---

## Chapters

### Chapter 25: /ccw — The Speaker

**File**: [ch25-ccw-speaker.md](./ch25-ccw-speaker.md)

**Topics Covered**:
- 5-phase workflow: Intent Analysis → Clarification → Workflow Selection → Confirmation → Execution
- Clarity score calculation and decision logic
- Command chain construction and MEU (Minimum Execution Unit)
- Level 1-4 workflow selection

**Key Insights**:
| Metric | Value |
|--------|-------|
| Phases | 5 (1, 1.5, 2, 3, 4, 5) |
| Workflow Levels | 4 (quick, lite, standard, explore) |
| Allowed Tools | Skill(*), TodoWrite(*), AskUserQuestion(*), Read(*), Grep(*), Glob(*) |

---

### Chapter 26: /issue:new — From Chaos to Structure

**File**: [ch26-issue-new.md](./ch26-issue-new.md)

**Topics Covered**:
- Dual input modes: GitHub URL and text description
- ACE search integration for component hints
- Clarity score determination and conditional clarification
- GitHub publishing workflow

**Key Insights**:
| Input Type | Clarity Score | Processing |
|------------|---------------|------------|
| GitHub URL | 3 | Direct creation |
| Structured text | 2 | Direct creation |
| Long text | 1 | ACE search hints |
| Vague input | 0 | Clarification questions |

---

### Chapter 27: /issue:discover — Searchlights in the Mist

**File**: [ch27-issue-discover.md](./ch27-issue-discover.md)

**Topics Covered**:
- 8 analysis perspectives: bug, UX, test, quality, security, performance, maintainability, best-practices
- Parallel cli-explore-agent execution
- Exa integration for security and best-practices research
- Finding aggregation and prioritization

**Key Insights**:
| Perspective | Focus | Exa Integration |
|-------------|-------|-----------------|
| bug | Logic errors, edge cases | No |
| security | Vulnerabilities, OWASP | Yes |
| performance | Bottlenecks, N+1 queries | No |
| best-practices | Industry standards | Yes |

---

### Chapter 28: Issue Lifecycle Trilogy — plan → queue → execute

**File**: [ch28-issue-lifecycle.md](./ch28-issue-lifecycle.md)

**Topics Covered**:
- Three-phase issue resolution workflow
- Solution-level DAG construction
- Worktree isolation for execution
- Per-solution commit strategy

**Key Insights**:
| Phase | Agent | Output |
|-------|-------|--------|
| plan | issue-plan-agent | Solution JSON |
| queue | issue-queue-agent | Queue JSON + DAG |
| execute | Executor (codex/gemini) | Git commits |

---

### Chapter 29: /workflow:init — The Project's First Heartbeat

**File**: [ch29-workflow-init.md](./ch29-workflow-init.md)

**Topics Covered**:
- Dual-file system: project-tech.json and project-guidelines.json
- cli-explore-agent deep analysis
- Technology stack detection
- Guidelines configuration workflow

**Key Insights**:
| File | Purpose | Maintainer |
|------|---------|------------|
| project-tech.json | Tech stack, architecture | cli-explore-agent |
| project-guidelines.json | Conventions, constraints | User |

---

### Chapter 30: Session Lifecycle — start/resume/complete

**File**: [ch30-session-lifecycle.md](./ch30-session-lifecycle.md)

**Topics Covered**:
- Three operation modes: Discovery, Auto, Force New
- Session state persistence on disk
- Archive workflow and lessons learned generation
- Solidify integration for learning capture

**Key Insights**:
| Command | Responsibility | Output |
|---------|---------------|--------|
| start | Create/discover session | Session ID |
| resume | Restore paused session | Updated state |
| complete | Archive session | Manifest entry |

---

### Chapter 31: /workflow:brainstorm-with-file — The Dance of Creative Chaos

**File**: [ch31-brainstorm-with-file.md](./ch31-brainstorm-with-file.md)

**Topics Covered**:
- 4-phase brainstorm: Seed → Diverge → Refine → Converge
- Multi-CLI parallel analysis (Gemini/Codex/Claude)
- Diverge-converge cycles (max 6 rounds)
- Synthesis and next-step options

**Key Insights**:
| Role | CLI Tool | Focus |
|------|----------|-------|
| Creative | Gemini | Innovation, cross-domain |
| Pragmatic | Codex | Implementation, feasibility |
| Systematic | Claude | Architecture, decomposition |

---

### Chapter 32: CLI Boundaries — cli-init and codex-review

**File**: [ch32-cli-commands.md](./ch32-cli-commands.md)

**Topics Covered**:
- Technology detection and ignore rule generation
- CLI configuration for Gemini and Qwen
- Codex review workflow and target selection
- Prompt template construction

**Key Insights**:
| Command | Responsibility | Output |
|---------|---------------|--------|
| cli-init | Generate CLI configs | .gemini/, .qwen/, ignore files |
| codex-review | Guide code review | Review results |

---

### Chapter 33: Context Boundaries — memory commands

**File**: [ch33-memory-commands.md](./ch33-memory-commands.md)

**Topics Covered**:
- Temporary context (prepare) vs permanent memory (style-skill-memory)
- Content package generation and size limits
- SKILL memory structure and generation
- Context lifecycle management

**Key Insights**:
| Command | Lifecycle | Storage | Size Limit |
|---------|-----------|---------|------------|
| prepare | Session | Memory | < 5KB |
| style-skill-memory | Permanent | Disk | Unlimited |

---

### Chapter 35: Team Pulse — team-lifecycle, team-issue, team-skill-designer, team-command-designer

**File**: [ch35-team-commands.md](./ch35-team-commands.md)

**Topics Covered**:
- Unified entry point + --role routing architecture
- team-lifecycle: 8 roles, 3 modes (spec-only, impl-only, full-lifecycle)
- team-issue: 6 roles, 3 modes (quick, full, batch)
- team-skill-designer: Meta-skill for generating skill packages
- team-command-designer: Meta-skill for generating command files
- Shared infrastructure: message bus, task lifecycle, role isolation

**Key Insights**:
| Skill | Roles | Modes | Task Chain |
|-------|-------|-------|------------|
| team-lifecycle | 8 | spec-only, impl-only, full-lifecycle | 16 tasks |
| team-issue | 6 | quick, full, batch | 4-6 tasks |
| team-skill-designer | N/A | N/A | Generates SKILL.md + roles/ |
| team-command-designer | N/A | N/A | Generates single .md file |

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         COMMAND LAYER ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  User Entry Point                                                        │
│  ├─ /ccw (The Speaker)                                                   │
│  │   └─ Intent Analysis → Workflow Selection → Command Chain Execution   │
│  │                                                                       │
│  Issue Subsystem                                                         │
│  ├─ /issue:new     (Chaos → Structure)                                   │
│  ├─ /issue:discover (Multi-perspective Analysis)                        │
│  ├─ /issue:plan    (Solution Generation)                                │
│  ├─ /issue:queue   (DAG Construction)                                   │
│  └─ /issue:execute (Worktree Isolation)                                 │
│                                                                          │
│  Workflow Subsystem                                                      │
│  ├─ /workflow:init      (Project Initialization)                        │
│  ├─ /workflow:session:* (Session Lifecycle)                             │
│  └─ /workflow:brainstorm-with-file (Creative Collaboration)             │
│                                                                          │
│  CLI Subsystem                                                           │
│  ├─ /cli:cli-init    (Configuration Generation)                         │
│  └─ /cli:codex-review (Code Review Wrapper)                             │
│                                                                          │
│  Memory Subsystem                                                        │
│  ├─ /memory:prepare          (Temporary Context)                        │
│  └─ /memory:style-skill-memory (Permanent SKILL)                        │
│                                                                          │
│  Team Subsystem (Multi-Agent Collaboration)                              │
│  ├─ team-lifecycle      (Full Lifecycle: spec → impl → test)            │
│  ├─ team-issue          (Issue Resolution Pipeline)                     │
│  ├─ team-skill-designer (Generate Skill Packages)                       │
│  └─ team-command-designer (Generate Command Files)                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Key Design Patterns

### 1. Command Chain Pattern
Complex tasks are decomposed into atomic command chains:
```
/ccw "feature" → lite-plan → lite-execute → test-fix-gen → test-cycle
```

### 2. Agent Delegation Pattern
Heavy analysis tasks are delegated to specialized agents:
```
/issue:plan → issue-plan-agent
/issue:discover → cli-explore-agent (x8)
```

### 3. Multi-CLI Collaboration Pattern
Different perspectives are gathered through parallel CLI calls:
```
brainstorm → cli-explore-agent → [Gemini || Codex || Claude]
```

### 4. State Persistence Pattern
Session state is persisted to disk for recovery and audit:
```
session → workflow-session.json → archives/
```

### 5. Unified Entry + Role Routing Pattern
Team skills use a single entry point with --role parameter:
```
Skill(skill="team-lifecycle", args="--role=coordinator")
  → Read(roles/coordinator.md) → Execute 5-phase process
```

---

## Memory Ghost Investigation

Throughout this Part, we tracked "Memory Ghosts" - the accumulation and leakage of context:

| Location | Issue | Impact |
|----------|-------|--------|
| Parallel Agents (Ch27) | Same context loaded N times | 8x memory |
| Multi-CLI (Ch31) | Context loaded 4 times | 4x memory |
| Session Archive (Ch30) | Multiple file reads | Cumulative I/O |
| Issue Lifecycle (Ch28) | State passed 3 phases | Repeated loading |

### Recommended Optimizations
1. **Shared Context Mechanism**: Pre-load and share context across parallel agents
2. **Layered Loading Strategy**: Load only needed context layers
3. **Context Caching**: Cache frequently accessed configurations
4. **File Read Batching**: Combine multiple reads into single operations

---

## Quick Navigation

- **Main Outline**: [../OUTLINE.md](../OUTLINE.md)
- **Previous Part**: [../part10-extension](../part10-extension) (if exists)
- **Next Part**: [../part12-testing](../part12-testing) (if exists)

---

## Related Documentation

### Internal Documentation
- Agent Specifications: `.claude/agents/`
- Command Definitions: `.claude/commands/`
- Skill Definitions: `.claude/skills/`
- Schema Definitions: `~/.ccw/workflows/cli-templates/schemas/`

### External References
- [Codex CLI Documentation](https://github.com/openai/codex)
- [Gemini CLI Documentation](https://ai.google.dev/docs)
- [Claude Code Documentation](https://docs.anthropic.com)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1 | 2025-02-18 | Added Chapter 35: Team commands documentation |
| 1.0 | 2025-02-18 | Initial documentation - 9 chapters covering command layer |

---

*Generated for CCW Architecture Deep Study*
*Part 11: Commands — The Executive Branch*
