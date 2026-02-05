---
name: execute
description: Coordinate agent execution for workflow tasks with automatic session discovery, parallel task processing, and status tracking
argument-hint: "[-y|--yes] [--resume-session=\"session-id\"] [--with-commit]"
allowed-tools: TodoWrite(*), Task(*), AskUserQuestion(*), Read(*), Skill(*), Bash(*)
group: workflow
---

# workflow:execute

## Overview

- Goal: Coordinate end-to-end execution of a workflow session (discover/resume session, validate plan artifacts, generate TodoWrite, execute tasks with status tracking, optional auto-commit).
- Command: `/workflow:execute`

## Usage

```bash
/workflow:execute [-y|--yes] [--resume-session="session-id"] [--with-commit]
```

## Inputs

- Required inputs:
  - A workflow session (auto-discovered from `.workflow/active/` or explicitly via `--resume-session`)
  - Planning artifacts for the session (at minimum: `IMPL_PLAN.md` + task JSONs)
- Optional inputs:
  - `-y|--yes` (auto mode: skip confirmations, use defaults)
  - `--resume-session="session-id"` (explicit session selection)
  - `--with-commit` (auto-commit after each completed task; minimal commits only)

## Outputs / Artifacts

- Writes:
  - `.workflow/active/<session>/TODO_LIST.md` (TodoWrite-derived tracking aligned to task status)
  - `.workflow/active/<session>/.task/<task_id>.json` (status transitions: pending/in_progress/completed/blocked)
  - `.workflow/active/<session>/.process/<filename>` (optional: execution logs / progress snapshots)
- Reads:
  - `.workflow/active/<session>/workflow-session.json`
  - `.workflow/active/<session>/IMPL_PLAN.md`
  - `.workflow/active/<session>/.task/<task_id>.json`
  - `.workflow/active/<session>/.summaries/<task_id>-summary.md` (only when `--with-commit` is enabled)

## Implementation Pointers

- Command doc: `.claude/commands/workflow/execute.md`
- Likely code locations:
  - `ccw/src/tools/session-manager.ts`
  - `ccw/src/tools/command-registry.ts`
  - `ccw/src/templates/dashboard-js/views/help.js`

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/execute.md` | Existing | docs: `.claude/commands/workflow/execute.md` / `Workflow Execute Command` ; ts: `ccw/src/templates/dashboard-js/views/help.js` / `/workflow:execute` | `Test-Path .claude/commands/workflow/execute.md` | Source command behavior + section structure (oracle) |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/execute.md` / `Execution Lifecycle` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path ccw/src/tools/session-manager.ts` | Session discovery + status persistence for `.workflow/active/<session>/...` |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/execute.md` / `Usage` ; ts: `ccw/src/tools/command-registry.ts` / `ERROR: ~/.claude/commands/workflow directory not found` | `Test-Path ccw/src/tools/command-registry.ts` | How CCW discovers/parses `.claude/commands/workflow/*.md` (including execute) |
| `ccw/src/templates/dashboard-js/views/help.js` | Existing | docs: `.claude/commands/workflow/execute.md` / `Overview` ; ts: `ccw/src/templates/dashboard-js/views/help.js` / `/workflow:execute` | `Test-Path ccw/src/templates/dashboard-js/views/help.js` | UI help/workflow graph includes the command for discoverability |

## Execution Process

1. Discovery
   - Auto-detect active session(s) in `.workflow/active/`
   - If multiple sessions: AskUserQuestion to select, unless `--resume-session` provided
2. Planning Document Validation
   - Validate required session files exist and are parseable (IMPL_PLAN + task JSONs)
3. TodoWrite Generation
   - Generate/refresh `TODO_LIST.md` from task JSON status (idempotent)
4. Execution Strategy Selection & Task Execution
   - Choose execution model based on plan metadata and dependencies:
     - sequential (safe default)
     - parallel (independent tasks)
     - phased (dependency layers)
     - fallback (circular deps or invalid metadata)
   - For each task:
     - mark in-progress, run agent via Task, then mark completed/blocked with recovery steps
5. Completion
   - Finalize status + produce completion notes; optionally run post-completion expansion
6. Optional: Auto-Commit (`--with-commit`)
   - Read `.summaries/<task_id>-summary.md`, extract "Files Modified", then `git add <files>` + `git commit -m "<type>: <title> - <summary>"`

## Error Handling

- Discovery errors: no sessions / multiple sessions / corrupted metadata -> prompt user or require `--resume-session`.
- Execution errors: agent failure/timeout -> retry with reduced context; fail critical tasks, skip optional tasks.
- File errors: missing/invalid JSON -> re-derive from plan, fall back to defaults, and log recoverable errors.
- Auto-commit errors: missing summary/no changes -> skip commit, continue workflow (never block core execution).

## Examples

```bash
# Interactive mode
/workflow:execute

# Auto mode (skip confirmations)
/workflow:execute -y

# Resume a specific session
/workflow:execute --resume-session="WFS-auth"

# Auto mode + per-task auto-commit
/workflow:execute -y --with-commit
```

