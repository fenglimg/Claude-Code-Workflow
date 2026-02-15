# CCW Architecture Overview

## System Architecture

Claude-Code-Workflow (CCW) is a JSON-driven multi-agent development framework with intelligent CLI orchestration.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              User Interface                                  │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐     │
│  │   CLI       │   │  Dashboard  │   │   Skills    │   │   Agents    │     │
│  │  (ccw/bin)  │   │ (Frontend)  │   │ (.claude/)  │   │ (.claude/)  │     │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘     │
└─────────┼─────────────────┼─────────────────┼─────────────────┼─────────────┘
          │                 │                 │                 │
          ▼                 ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Core Layer (ccw/src/)                          │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐     │
│  │   CLI.ts    │   │  Commands   │   │    Core     │   │   Tools     │     │
│  │  (Entry)    │   │ (Handlers)  │   │ (Services)  │   │ (Utilities) │     │
│  └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
          │                 │                 │                 │
          ▼                 ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           External Services                                  │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐     │
│  │   Gemini    │   │   Codex     │   │    Qwen     │   │   Claude    │     │
│  │    CLI      │   │    CLI      │   │    CLI      │   │    CLI      │     │
│  └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. CLI Layer (`ccw/bin/`, `ccw/src/cli.ts`)

**Entry Point**: `ccw/bin/ccw.js`

**Main Commands**:
- `ccw install` - Install workflow files
- `ccw view` - Open dashboard
- `ccw cli` - Execute CLI tools
- `ccw upgrade` - Upgrade installations
- `ccw team` - Team collaboration

### 2. Commands Layer (`ccw/src/commands/`)

| File | Purpose |
|------|---------|
| `cli.ts` | CLI execution orchestration |
| `install.ts` | Workflow installation |
| `issue.ts` | Issue workflow management |
| `session.ts` | Session management |
| `memory.ts` | Memory/context management |
| `workflow.ts` | Workflow orchestration |
| `team.ts` | Team collaboration |

### 3. Core Services (`ccw/src/core/`)

| Component | File | Description |
|-----------|------|-------------|
| **Server** | `server.ts` | HTTP/WebSocket server for dashboard |
| **Memory Store** | `core-memory-store.ts` | Persistent memory storage |
| **Session Scanner** | `session-scanner.ts` | Session discovery and indexing |
| **Data Aggregator** | `data-aggregator.ts` | Data aggregation for dashboard |
| **Lite Scanner** | `lite-scanner.ts` | Lightweight code analysis |

### 4. Tools Layer (`ccw/src/tools/`)

| Tool | Purpose |
|------|---------|
| `cli-executor.ts` | External CLI execution |
| `smart-search.ts` | Intelligent code search |
| `session-manager.ts` | Session state management |
| `write-file.ts` | Safe file operations |
| `edit-file.ts` | File editing utilities |

## Workflow Levels

### Level 1: Rapid Execution (lite-lite-lite)
- Instant execution
- No artifacts
- Auto CLI selection

### Level 2: Lightweight Planning
- `lite-plan` - In-memory planning
- `lite-fix` - Bug diagnosis and fix
- `multi-cli-plan` - Multi-perspective analysis

### Level 3: Standard Planning
- `plan` - Multi-module development
- `tdd-plan` - Test-driven development
- `test-fix-gen` - Test and fix generation

### Level 4: Brainstorm
- `brainstorm:auto-parallel` - Multi-role analysis
- Parallel agent execution
- Comprehensive planning

### Level 5: Intelligent Orchestration
- `ccw-coordinator` - Auto workflow recommendation
- Smart chain orchestration
- Resumable sessions

## Data Flow

```
User Input
    │
    ▼
┌─────────────┐
│ Intent      │
│ Analysis    │
└─────┬───────┘
      │
      ▼
┌─────────────┐
│ Workflow    │
│ Selection   │
└─────┬───────┘
      │
      ▼
┌─────────────┐
│ CLI Tool    │
│ Selection   │
└─────┬───────┘
      │
      ▼
┌─────────────┐
│ Execution   │
│ & Tracking  │
└─────┬───────┘
      │
      ▼
┌─────────────┐
│ Result      │
│ Synthesis   │
└─────────────┘
```

## Configuration Files

| File | Purpose |
|------|---------|
| `.claude/CLAUDE.md` | Claude instructions |
| `.claude/cli-settings.json` | CLI tool configuration |
| `.mcp.json` | MCP server configuration |
| `package.json` | NPM package definition |

## Session Management

Sessions are stored in `.workflow/` directory:
- `.workflow/.sessions/` - Active sessions
- `.workflow/.team/` - Team collaboration sessions
- `.workflow/.scratchpad/` - Temporary files

## Key Design Principles

1. **JSON-First State**: `.task/IMPL-*.json` as single source of truth
2. **Dependency-Aware Parallelism**: Agents execute in parallel without worktree
3. **Semantic CLI Invocation**: Natural language tool selection
4. **Context-First Architecture**: Memory and context are central
