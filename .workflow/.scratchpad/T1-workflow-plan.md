# T1: workflow:plan Implementation - 5-Phase Orchestration

## Overview

`/workflow:plan` is a pure orchestrator command that executes a 5-phase planning workflow autonomously. It transforms user task descriptions into executable implementation plans (IMPL_PLAN.md) and task JSON files through sequential phase execution with automatic continuation.

**Core Principle**: No preliminary analysis—execute phases immediately and parse outputs to drive next phase.

## Architecture

### Phase Execution Model

```
User Input → Phase 1 (Session) → Phase 2 (Context) → Phase 3 (Conflicts) → Phase 4 (Tasks) → Output
                                                            ↓
                                                      [conditional]
```

**Key Characteristics**:
- **Fully autonomous**: No user interaction between phases
- **Output-driven**: Each phase output determines next phase input
- **Task attachment/collapse**: TodoWrite dynamically expands/collapses for visibility
- **Conditional Phase 3**: Only executes if conflict_risk ≥ medium

### Data Flow

```javascript
Input: "Build JWT authentication"
  ↓
[Structured Format]: GOAL/SCOPE/CONTEXT
  ↓
Phase 1: /workflow:session:start --auto "structured"
  Output: sessionId (WFS-xxx)
  ↓
Phase 2: /workflow:tools:context-gather --session WFS-xxx "structured"
  Output: contextPath + conflict_risk
  ↓
[Decision]: conflict_risk ≥ medium?
  ├─ YES → Phase 3: /workflow:tools:conflict-resolution
  │         Output: Modified artifacts
  └─ NO → Skip to Phase 4
  ↓
Phase 4: /workflow:tools:task-generate-agent --session WFS-xxx
  Output: IMPL_PLAN.md, IMPL-*.json, TODO_LIST.md
  ↓
Return: Summary + next steps
```

## Phase Details

### Phase 1: Session Discovery

**Command**: `/workflow:session:start --auto "GOAL: ...\nSCOPE: ...\nCONTEXT: ..."`

**Execution**:
1. Parse user input into structured format (GOAL/SCOPE/CONTEXT)
2. Execute SlashCommand with structured description
3. Extract sessionId from output (pattern: `SESSION_ID: WFS-[id]`)
4. Validate session directory exists: `.workflow/active/[sessionId]/`

**Output**: `sessionId` (stored in memory for Phase 2)

**File References**:
- `.claude/commands/workflow/session/start.md` (lines 1-150): Session discovery logic
- `.workflow/active/[sessionId]/workflow-session.json`: Session metadata

### Phase 2: Context Gathering

**Command**: `/workflow:tools:context-gather --session [sessionId] "structured-description"`

**Execution**:
1. Pass sessionId and same structured description from Phase 1
2. Execute SlashCommand
3. Extract context-package.json path from output
4. Read context-package.json to extract `conflict_risk` field
5. Store contextPath and conflict_risk in memory

**Output**: `contextPath`, `conflict_risk`

**Task Attachment Pattern**:
- SlashCommand attaches 3 sub-tasks to TodoWrite:
  - Analyze codebase structure
  - Identify integration points
  - Generate context package
- Orchestrator executes these sequentially
- After completion, tasks collapse to single "Phase 2: Context Gathering" entry

**File References**:
- `.claude/commands/workflow/tools/context-gather.md` (lines 1-210): Context gathering orchestration
- `.workflow/active/[sessionId]/.process/context-package.json`: Generated context package
- `.workflow/active/[sessionId]/.process/explorations-manifest.json`: Exploration index

### Phase 3: Conflict Resolution (Conditional)

**Trigger**: Only if `conflict_risk >= "medium"`

**Command**: `/workflow:tools:conflict-resolution --session [sessionId] --context [contextPath]`

**Execution**:
1. Check conflict_risk from Phase 2 context-package.json
2. If conflict_risk < "medium": Skip to Phase 4
3. If conflict_risk >= "medium":
   - Execute SlashCommand with sessionId and contextPath
   - Wait for conflict-resolution.json generation
   - Verify file exists: `.workflow/active/[sessionId]/.process/conflict-resolution.json`

**Task Attachment Pattern**:
- SlashCommand attaches 3 sub-tasks:
  - Detect conflicts with CLI analysis
  - Present conflicts to user
  - Apply resolution strategies
- Orchestrator executes sequentially
- After completion, tasks collapse to single "Phase 3: Conflict Resolution" entry

**Memory Optimization**:
- After Phase 3, evaluate context window usage
- If approaching limits (>120K tokens), execute `/compact` before Phase 4

**File References**:
- `.claude/commands/workflow/tools/conflict-resolution.md`: Conflict detection and resolution
- `.workflow/active/[sessionId]/.process/conflict-resolution.json`: Conflict analysis output

### Phase 4: Task Generation

**Command**: `/workflow:tools:task-generate-agent --session [sessionId]`

**Execution**:
1. Pass sessionId to task-generate-agent
2. Agent autonomously:
   - Loads session metadata and context package
   - Reads brainstorm artifacts (if exist)
   - Generates implementation plan
   - Creates task JSON files
3. Verify outputs exist:
   - `.workflow/active/[sessionId]/IMPL_PLAN.md`
   - `.workflow/active/[sessionId]/.task/IMPL-*.json` (at least one)
   - `.workflow/active/[sessionId]/TODO_LIST.md`

**Output**: IMPL_PLAN.md, task JSONs, TODO_LIST.md

**File References**:
- `.claude/commands/workflow/tools/task-generate-agent.md` (lines 1-550): Task generation orchestration
- `.claude/agents/action-planning-agent.md`: Agent implementation details

## TodoWrite Pattern

### Task Attachment/Collapse Lifecycle

**Initial State**:
```json
[
  {"content": "Phase 1: Session Discovery", "status": "pending"},
  {"content": "Phase 2: Context Gathering", "status": "pending"},
  {"content": "Phase 4: Task Generation", "status": "pending"}
]
```

**Phase 1 Execution**:
```json
[
  {"content": "Phase 1: Session Discovery", "status": "in_progress"},
  {"content": "Phase 2: Context Gathering", "status": "pending"},
  {"content": "Phase 4: Task Generation", "status": "pending"}
]
```

**Phase 2 Attached** (tasks expanded):
```json
[
  {"content": "Phase 1: Session Discovery", "status": "completed"},
  {"content": "Phase 2: Context Gathering", "status": "in_progress"},
  {"content": "  → Analyze codebase structure", "status": "in_progress"},
  {"content": "  → Identify integration points", "status": "pending"},
  {"content": "  → Generate context package", "status": "pending"},
  {"content": "Phase 4: Task Generation", "status": "pending"}
]
```

**Phase 2 Collapsed** (tasks completed):
```json
[
  {"content": "Phase 1: Session Discovery", "status": "completed"},
  {"content": "Phase 2: Context Gathering", "status": "completed"},
  {"content": "Phase 4: Task Generation", "status": "pending"}
]
```

**Phase 3 Attached** (if conflict_risk >= medium):
```json
[
  {"content": "Phase 1: Session Discovery", "status": "completed"},
  {"content": "Phase 2: Context Gathering", "status": "completed"},
  {"content": "Phase 3: Conflict Resolution", "status": "in_progress"},
  {"content": "  → Detect conflicts with CLI analysis", "status": "in_progress"},
  {"content": "  → Present conflicts to user", "status": "pending"},
  {"content": "  → Apply resolution strategies", "status": "pending"},
  {"content": "Phase 4: Task Generation", "status": "pending"}
]
```

## Input Processing

### Structured Format Conversion

**Simple Input**:
```
User: "Build authentication system"
↓
GOAL: Build authentication system
SCOPE: Core authentication features
CONTEXT: New implementation
```

**Detailed Input**:
```
User: "Add JWT with email/password login and token refresh"
↓
GOAL: Implement JWT-based authentication
SCOPE: Email/password login, token generation, token refresh
CONTEXT: JWT token-based security, refresh token rotation
```

**File Reference Input**:
```
User: "requirements.md"
↓
Read file → Extract goal/scope/requirements → Format as structured
```

## Error Handling

| Error | Resolution |
|-------|-----------|
| Phase 1 fails | Retry once, report error, abort |
| Phase 2 fails | Retry once, report error, abort |
| Phase 3 fails | Log error, skip to Phase 4 |
| Phase 4 fails | Report error, suggest manual planning |
| Output parsing fails | Retry command, then report error |
| Validation fails | Report missing file/data, abort |

## Integration Points

**Called Commands**:
- `/workflow:session:start` (Phase 1)
- `/workflow:tools:context-gather` (Phase 2)
- `/workflow:tools:conflict-resolution` (Phase 3, conditional)
- `/compact` (Phase 3, optional memory optimization)
- `/workflow:tools:task-generate-agent` (Phase 4)

**Input Sources**:
- User task description
- Session metadata (`.workflow/active/[sessionId]/workflow-session.json`)
- Context package (`.workflow/active/[sessionId]/.process/context-package.json`)
- Brainstorm artifacts (if exist in session)

**Output Consumers**:
- `/workflow:action-plan-verify` (verify plan quality)
- `/workflow:status` (review task breakdown)
- `/workflow:execute` (begin implementation)

## Code References

**Key Files**:
- `.claude/commands/workflow/plan.md` (lines 1-552): Full command specification
- `.claude/commands/workflow/session/start.md` (lines 1-150): Session discovery
- `.claude/commands/workflow/tools/context-gather.md` (lines 1-210): Context gathering
- `.claude/commands/workflow/tools/task-generate-agent.md` (lines 1-550): Task generation
- `.claude/agents/action-planning-agent.md`: Agent implementation

**Key Patterns**:
- SlashCommand execution with output parsing (lines 85-87, 123-124, 178-179, 276-277)
- Task attachment/collapse pattern (lines 140-163)
- Conditional Phase 3 execution (lines 173-194)
- Memory optimization check (lines 230-241)

## Execution Checklist

- [ ] Convert user input to structured format (GOAL/SCOPE/CONTEXT)
- [ ] Initialize TodoWrite with 3 orchestrator-level tasks
- [ ] Execute Phase 1, extract sessionId
- [ ] Execute Phase 2, extract contextPath and conflict_risk
- [ ] Check conflict_risk: if >= medium, execute Phase 3
- [ ] Evaluate memory usage after Phase 3
- [ ] Execute Phase 4, verify all outputs
- [ ] Update TodoWrite after each phase
- [ ] Return summary with next steps

## Quality Criteria

✓ All 4 phases execute in sequence
✓ Output from each phase drives next phase input
✓ TodoWrite reflects task attachment/collapse pattern
✓ Phase 3 only executes when conflict_risk >= medium
✓ All output files verified before proceeding
✓ Error handling with retry logic
✓ Memory optimization before Phase 4 (if needed)
