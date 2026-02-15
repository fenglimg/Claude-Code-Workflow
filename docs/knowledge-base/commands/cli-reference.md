# CCW Commands Reference

## CLI Commands

### Core Commands

#### `ccw install`
Install workflow files to the project.

```bash
ccw install           # Install to current project
ccw install -m Global # Install globally
```

#### `ccw view`
Open the dashboard UI.

```bash
ccw view              # Open dashboard in browser
```

#### `ccw cli`
Execute CLI tools with intelligent orchestration.

```bash
ccw cli -p "Analyze authentication module" --tool gemini --mode analysis
ccw cli -p "Implement rate limiting" --tool codex --mode write
```

**Options**:
- `-p, --prompt` - Task prompt
- `--tool` - CLI tool (gemini, codex, qwen, claude)
- `--mode` - Execution mode (analysis, write, review)
- `--cd` - Working directory
- `--resume` - Resume previous session
- `--rule` - Load template rules

#### `ccw upgrade`
Upgrade installed workflow files.

```bash
ccw upgrade -a        # Upgrade all
```

#### `ccw team`
Team collaboration commands.

```bash
ccw team create       # Create team session
ccw team join         # Join team session
```

## Slash Commands

### Primary Commands

#### `/ccw`
Auto workflow orchestrator - analyzes intent and selects workflow level.

```bash
/ccw "Add user authentication"
/ccw "Fix memory leak in WebSocket"
/ccw "Implement with TDD"
```

#### `/ccw-coordinator`
Smart orchestrator with manual chain adjustment.

```bash
/ccw-coordinator "Implement OAuth2 system"
```

### Workflow Commands

#### Level 1: Rapid Execution

```bash
/workflow:lite-lite-lite "Fix typo in README"
```
- Instant execution
- No artifacts
- Auto CLI selection

#### Level 2: Lightweight Planning

```bash
/workflow:lite-plan "Add JWT authentication"
/workflow:lite-fix "User upload fails with 413 error"
/workflow:multi-cli-plan "Analyze security from multiple perspectives"
```

#### Level 3: Standard Planning

```bash
/workflow:plan "Implement payment gateway"
/workflow:tdd-plan "Create user service with tests"
/workflow:test-fix-gen "Generate tests and fixes"
```

#### Level 4: Brainstorm

```bash
/workflow:brainstorm:auto-parallel "Design real-time collaboration" --count 5
```

### Issue Workflow Commands

```bash
/issue:discover       # Discover issues from codebase
/issue:plan           # Plan issue resolution
/issue:queue          # Queue issues for execution
/issue:execute        # Execute queued issues
```

### Memory Commands

```bash
/memory:capture       # Capture current context
/memory:manage        # Manage memory store
```

### Team Commands

```bash
/team-lifecycle       # Team session lifecycle
/team-skill-designer  # Design team skills
/team-issue           # Team issue management
```

## Command Options Reference

### Mode Options

| Mode | Description | Permissions |
|------|-------------|-------------|
| `analysis` | Read-only analysis | Safe for auto-execution |
| `write` | Create/Modify/Delete | Requires explicit flag |
| `review` | Git-aware code review | Read-only output |

### Tool Selection

| Tool | Primary Use |
|------|-------------|
| `gemini` | General analysis, architecture |
| `codex` | Autonomous coding, review |
| `qwen` | Code generation |
| `claude` | General purpose, review |

### Rule Templates

| Template | Use Case |
|----------|----------|
| `analysis-diagnose-bug-root-cause` | Bug diagnosis |
| `analysis-review-architecture` | Architecture review |
| `development-implement-feature` | Feature implementation |
| `planning-plan-architecture-design` | Architecture design |

## CLI Execution Modes

### Background Execution (Default)
```bash
ccw cli -p "..." --tool gemini  # Runs in background
```

### Synchronous Execution
For agent calls, use `run_in_background: false`.

## Session Resume

```bash
ccw cli -p "Continue..." --resume           # Resume last
ccw cli -p "Continue..." --resume <id>      # Resume specific
ccw cli -p "Merge..." --resume <id1>,<id2>  # Merge sessions
```
