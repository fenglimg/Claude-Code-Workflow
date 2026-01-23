# T1: /workflow:plan Implementation Patterns (5-Phase Orchestrator)

## Overview

`/workflow:plan` is a **pure orchestrator** command: it starts immediately, drives a deterministic multi-phase planning pipeline via `SlashCommand(...)`, and uses **TodoWrite task attachment/collapse** plus **auto-continue** to run to completion without stopping. It ultimately delegates plan artifact generation to `action-planning-agent` via `/workflow:tools:task-generate-agent`.

## High-Level Architecture

### Phase Flow (Data + Control)

```
User input (text or file)
  -> Phase 0: Input normalization (GOAL/SCOPE/CONTEXT)
  -> Phase 1: Session discovery  (/workflow:session:start)
       output: sessionId (WFS-*)
  -> Phase 2: Context gather     (/workflow:tools:context-gather)
       output: contextPath + conflict_risk
  -> Phase 3: Conflict resolution (conditional)
       if conflict_risk >= medium -> /workflow:tools:conflict-resolution
       else -> auto-skip
  -> Phase 4: Task generation    (/workflow:tools:task-generate-agent)
       output: IMPL_PLAN.md + TODO_LIST.md + task JSONs
  -> Phase 5: Quality gate (recommended)
       /workflow:action-plan-verify

Artifacts live under .workflow/active/{sessionId}/
```

### Coordinator Contract

The orchestrator must:

- Initialize a TodoWrite plan *before* doing any analysis.
- Execute each phase command.
- Parse each phase output to build the next phase input.
- Attach sub-tasks from sub-commands into its TodoWrite, then collapse back to phase-level view.
- Continue automatically until all phases complete.

## Slash Command Registration (Declarative)

Slash commands are declared as markdown files with YAML frontmatter under `.claude/commands/**`. The file path defines the slash command name (e.g. `.claude/commands/workflow/plan.md` -> `/workflow:plan`) while frontmatter provides routing metadata (`name`, `description`, `argument-hint`, `allowed-tools`).

This repository also packages `.claude/commands/` as distributable content (so commands ship with the toolchain).

## TodoWrite Task Attachment / Collapse Pattern

Key idea: a `SlashCommand` invocation *expands the orchestrator's TodoWrite* by attaching the called command's internal tasks. After completion, the orchestrator collapses these detailed tasks into a single completed phase summary.

This makes the workflow observable (detailed tasks during execution) while keeping the final checklist high-level.

## Phase-by-Phase Implementation Notes

### Phase 0: Input Normalization

Input is normalized into a structured multi-line prompt (GOAL / SCOPE / CONTEXT) before invoking phase commands.

### Phase 1: Session Discovery

Command:

- `/workflow:session:start --auto "[structured-task-description]"`

Output:

- `sessionId` (e.g. `WFS-123`)

### Phase 2: Context Gathering

Command:

- `/workflow:tools:context-gather --session [sessionId] "[structured-task-description]"`

Output:

- A context artifact path (often used as `contextPath`)
- A `conflict_risk` signal used to decide whether to run Phase 3.

### Phase 3: Conflict Resolution (Conditional)

Decision:

- If `conflict_risk >= medium`: run `/workflow:tools:conflict-resolution --session [sessionId] --context [contextPath]`.
- Otherwise: auto-skip and continue.

Optional memory pressure guard:

- `/compact` may be used when the context approaches token limits.

### Phase 4: Task Generation (Agent-Driven)

Command:

- `/workflow:tools:task-generate-agent --session [sessionId]`

Responsibilities of `/workflow:tools:task-generate-agent`:

- Collect user configuration (`executionMethod`, `preferredCliTool`, supplementary materials).
- Spawn one or more `action-planning-agent` runs (often parallel by module).
- Produce planning artifacts only (no code execution):
  - `.workflow/active/{sessionId}/IMPL_PLAN.md`
  - `.workflow/active/{sessionId}/TODO_LIST.md`
  - One or more task JSON files

### Phase 5: Quality Gate (Recommended)

Although `/workflow:plan` can complete after Phase 4, a quality gate command is recommended:

- `/workflow:action-plan-verify --session [sessionId]`

## JSON Schema Contract: plan-json-schema.json

`/workflow:plan` and `/workflow:lite-plan` both rely on schema-driven planning artifacts. The canonical contract for plan tasks is `plan-json-schema.json`.

Highlights:

- Root required fields include: `summary`, `approach`, `tasks`, `estimated_time`, `recommended_execution`, `complexity`, `_metadata`.
- Each task requires: `id`, `title`, `scope`, `action`, `description`, `implementation`, `acceptance`.
- `modification_points[]` is required (minItems=1); each item requires `file`, `target`, `change`.

### modification_points Example

```json
{
  "id": "T2",
  "title": "Add validation to login endpoint",
  "scope": "src/auth",
  "action": "Update",
  "description": "Validate inputs and return consistent errors",
  "modification_points": [
    { "file": "src/auth/login.ts", "target": "validateLogin:45-90", "change": "Add schema validation + error mapping" },
    { "file": "src/auth/routes.ts", "target": "POST /login handler", "change": "Call validateLogin and handle failures" }
  ],
  "implementation": [
    "Add validation schema",
    "Wire into handler",
    "Update tests"
  ],
  "acceptance": [
    "Invalid payload returns 400 with structured error",
    "Existing valid login still succeeds"
  ]
}
```

## CCW Server / CLI Interaction (Execution Substrate)

Although slash commands run inside the Claude environment, **agents and workflows frequently call external CLIs** (Gemini/Qwen/Codex/npm/etc.). CCW provides server routes that execute these tools, track executions, and optionally stream output.

Key pieces:

- `handleCliRoutes(...)` exposes endpoints such as `/api/cli/execute`.
- `executeCliTool(...)` (backed by `cli-executor-core.ts`) manages spawn, streaming, resume/merge, and conversation persistence.

## Testing / Verification Checklist (Doc-Level)

- All referenced files exist.
- All schema field names and constraints match the actual JSON schema files.
- Phase order and conditional branching match the command definition.
- Code snippets are syntactically valid and reflect actual tool/agent invocation patterns.

## Code References (Implementation Evidence)

- `.claude/commands/workflow/plan.md:1` - `/workflow:plan` frontmatter (name/allowed-tools).
- `.claude/commands/workflow/plan.md:14` - Auto-continue execution model description.
- `.claude/commands/workflow/plan.md:25` - Task attachment model (TodoWrite expand/collapse).
- `.claude/commands/workflow/plan.md:32` - Auto-continue mechanism rules.
- `.claude/commands/workflow/plan.md:56` - Phase 1 command invocation.
- `.claude/commands/workflow/plan.md:60` - Phase 2 command invocation.
- `.claude/commands/workflow/plan.md:66` - Phase 3 conditional decision by `conflict_risk`.
- `.claude/commands/workflow/plan.md:72` - Phase 4 task generation command.
- `.claude/commands/workflow/plan.md:86` - `SlashCommand(...)` for phase 1.
- `.claude/commands/workflow/plan.md:140` - TodoWrite update example for phase 2 attachment.
- `.claude/commands/workflow/plan.md:199` - TodoWrite update example for phase 3 attachment.
- `.claude/commands/workflow/plan.md:290` - TodoWrite update example for phase 4 agent task attachment.
- `.claude/commands/workflow/plan.md:328` - TodoWrite pattern section (attach/collapse behavior).
- `.claude/commands/workflow/plan.md:542` - Explicit list of called sub-commands (phase mapping).
- `.claude/commands/workflow/tools/task-generate-agent.md:3` - Task generation command purpose (planning artifacts, not execution).
- `.claude/commands/workflow/tools/task-generate-agent.md:52` - Parallel spawning of `action-planning-agent` by module.
- `.claude/commands/workflow/tools/task-generate-agent.md:220` - `Task(subagent_type=\"action-planning-agent\", ...)` invocation pattern.
- `.claude/agents/action-planning-agent.md:26` - IMPL_PLAN.md and TODO_LIST.md generation responsibilities.
- `.claude/agents/action-planning-agent.md:860` - IMPL_PLAN template loading requirement.
- `.claude/workflows/cli-templates/schemas/plan-json-schema.json:6` - Root required fields for plan object.
- `.claude/workflows/cli-templates/schemas/plan-json-schema.json:30` - Task required fields (`id`, `title`, `scope`, `action`, `description`, `implementation`, `acceptance`).
- `.claude/workflows/cli-templates/schemas/plan-json-schema.json:58` - `modification_points` structure and required fields.
- `ccw/src/core/routes/cli-routes.ts:156` - `handleCliRoutes(...)` entry point.
- `ccw/src/core/routes/cli-routes.ts:604` - `/api/cli/execute` route.
- `ccw/src/core/routes/cli-routes.ts:657` - `executeCliTool(...)` call site.
- `ccw/src/tools/cli-executor-core.ts:392` - `executeCliTool(...)` core implementation.
- `ccw/src/tools/cli-executor-core.ts:217` - Process spawning via `spawn(...)`.
- `ccw/src/commands/workflow.ts:326` - `workflowCommand(...)` CLI entry for workflow management.
- `ccw/src/commands/workflow.ts:241` - `workflow-version.json` marker written after install.
- `package.json:55` - `.claude/commands/` included in package files list.

