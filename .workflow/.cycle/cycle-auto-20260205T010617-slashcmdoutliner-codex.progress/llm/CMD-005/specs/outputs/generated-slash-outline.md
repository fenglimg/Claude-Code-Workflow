---
name: ccw
description: Main workflow orchestrator - analyze intent, select workflow, execute command chain in main process
argument-hint: "\"task description\""
allowed-tools: Skill(*), TodoWrite(*), AskUserQuestion(*), Read(*), Grep(*), Glob(*)
group: other
---

# CCW Command - Main Workflow Orchestrator

## Overview

- Goal: Analyze user intent, select the best-fit CCW workflow, then execute a command chain as a single main-process pipeline with state + TODO tracking.
- Command: `/ccw` (root command; `group` is for cataloging only)

## Usage

```bash
/ccw "task description"
```

## Inputs

- Required inputs:
  - `"task description"` (natural-language description of the work to do)
- Optional inputs:
  - None (workflow hints are inferred from the task text; the command may ask clarifying questions)

## Outputs / Artifacts

- Writes:
  - `.workflow/.ccw/<session_id>/status.json`
- Reads:
  - `.claude/commands/**.md` (workflow catalog / routing targets)
  - Workspace context via `Read`, `Grep`, `Glob` (for intent + constraint analysis)

## Implementation Pointers

- Command doc: `.claude/commands/ccw.md`
- Likely code locations:
  - `.claude/commands/ccw.md` (main orchestrator spec + phases)
  - `.claude/commands/ccw-plan.md` (planning-chain mapping + clarification threshold)
  - `.claude/commands/ccw-coordinator.md` (unit concept + chain recommendation; contrast execution model)
  - `.claude/commands/workflow/execute.md` (execution lifecycle patterns + TODO generation)
  - `ccw/src/core/routes/commands-routes.ts` (command catalog scan + grouping)
  - `ccw/src/core/routes/help-routes.ts` (help registry surface for commands)
  - `ccw/src/commands/hook.ts` (status path conventions used by hook tooling)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/ccw.md` | Existing | docs: `.claude/commands/ccw.md` / `CCW Command - Main Workflow Orchestrator` ; ts: `ccw/src/core/routes/commands-routes.ts` / `scanCommandsRecursive` | `Test-Path .claude/commands/ccw.md` | canonical orchestrator command doc |
| `.claude/commands/ccw-plan.md` | Existing | docs: `.claude/commands/ccw-plan.md` / `CCW-Plan Command - Planning Coordinator` ; ts: `ccw/src/core/routes/commands-routes.ts` / `getCommandGroup(` | `Test-Path .claude/commands/ccw-plan.md` | reuse planning-chain selection + clarification conventions |
| `.claude/commands/ccw-coordinator.md` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `CCW Coordinator Command` ; ts: `ccw/src/core/routes/help-routes.ts` / `.claude/skills/ccw-help/command.json` | `Test-Path .claude/commands/ccw-coordinator.md` | contrast main-process vs external execution model |
| `.claude/commands/workflow/execute.md` | Existing | docs: `.claude/commands/workflow/execute.md` / `Execution Process` ; ts: `ccw/src/commands/workflow.ts` / `export async function workflowCommand(` | `Test-Path .claude/commands/workflow/execute.md` | reference execution lifecycle + task execution patterns |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/ccw.md` / `Usage` ; ts: `ccw/src/core/routes/commands-routes.ts` / `scanCommandsRecursive` | `Test-Path ccw/src/core/routes/commands-routes.ts` | cataloging and grouping commands for discovery/UI |
| `ccw/src/core/routes/help-routes.ts` | Existing | docs: `.claude/commands/ccw.md` / `Usage` ; ts: `ccw/src/core/routes/help-routes.ts` / `.claude/skills/ccw-help/command.json` | `Test-Path ccw/src/core/routes/help-routes.ts` | help surface uses command registry data for discovery |
| `ccw/src/commands/hook.ts` | Existing | docs: `.claude/commands/ccw.md` / `State Management` ; ts: `ccw/src/commands/hook.ts` / `.workflow/.ccw/ccw-123/status.json` | `Test-Path ccw/src/commands/hook.ts` | status-file path conventions appear in existing tooling |
| `.workflow/.ccw/<session_id>/status.json` | Planned | docs: `.claude/commands/ccw.md` / `State Management` ; ts: `ccw/src/commands/hook.ts` / `.workflow/.ccw/ccw-123/status.json` | `Test-Path .workflow/.ccw/<session_id>/status.json` | runtime state artifact created per execution session |

## Execution Process

1) Phase 1: Analyze intent
   - Extract goal, scope, constraints, task type, complexity, and clarity from the input.
2) Phase 1.5: Clarify requirements (only if clarity is low)
   - Ask targeted questions to remove ambiguity and confirm constraints.
3) Phase 2: Select workflow and build command chain
   - Map task type/complexity to a workflow level.
   - Build a command chain grouped into minimum execution units (atomic groups that must not be split).
4) Phase 3: User confirmation (optional)
   - Present the proposed chain (with unit boundaries) and allow adjustments.
5) Phase 4: Setup TODO tracking and status file
   - Initialize TODO tracking for the run.
   - Initialize `.workflow/.ccw/<session_id>/status.json` to track progress.
6) Phase 5: Execute command chain (main process)
   - For each command in the chain:
     - Update status to `running` for the current command/unit.
     - Execute the command via `Skill` (blocking).
     - Update status to `completed` (or `failed`) and proceed according to error policy.

## Error Handling

- If the task is unclear: fall back to Phase 1.5 clarification before selecting a workflow.
- If user declines confirmation: either replan (Phase 2) or stop cleanly without side effects.
- If status file cannot be written: continue with TODO-only tracking and log a clear, non-sensitive error.
- If a command in a unit fails: preserve unit boundaries (retry/skip applies to the whole unit), then update status accordingly.
- If a downstream command depends on an earlier artifact that is missing: stop and ask the user whether to regenerate or change approach.

## Examples

```bash
# Auto-select workflow
/ccw "Add user authentication to the API"

# Bug fix
/ccw "Fix memory leak in WebSocket handler"

# With-file exploration (keyword-driven routing)
/ccw "Analyze with file: investigate flaky CI failures from last run"
```
