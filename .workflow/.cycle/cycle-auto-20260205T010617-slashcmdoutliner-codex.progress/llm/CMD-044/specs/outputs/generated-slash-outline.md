---
name: replan
description: Interactive workflow replanning with session-level artifact updates and boundary clarification through guided questioning
argument-hint: "[-y|--yes] [--session session-id] [task-id] \"requirements\"|file.md [--interactive]"
allowed-tools: Read(*), Write(*), Edit(*), TodoWrite(*), Glob(*), Bash(*)
group: workflow
---

# Workflow Replan Command

## Overview

- Goal: Replan an active workflow session or a specific task via guided clarification, then apply consistent artifact updates with backups and rollback.
- Command: `/workflow:replan`

## Usage

```bash
/workflow:replan [-y|--yes] [--session session-id] [task-id] "requirements"|file.md [--interactive]
```

## Inputs

- Required inputs:
  - Replan request (string) OR a markdown file describing requirement changes
- Optional inputs:
  - `task-id` (e.g., `IMPL-1`, `IMPL-001`, `IMPL-2.1`) to switch to Task Replan mode
  - `--session <session-id>` to target a specific active session (otherwise auto-detect)
  - `--interactive` to force guided clarification questions
  - `-y|--yes` to apply safe defaults and reduce questioning

## Outputs / Artifacts

- Writes:
  - `.workflow/active/{session_id}/workflow-session.json`
  - `.workflow/active/{session_id}/IMPL_PLAN.md`
  - `.workflow/active/{session_id}/TODO_LIST.md`
  - `.workflow/active/{session_id}/.task/*.json`
  - `.workflow/active/{session_id}/.process/backup/replan-{timestamp}/` (backups)
  - `.workflow/active/{session_id}/.process/backup/replan-{timestamp}/MANIFEST.md`
- Reads:
  - `.workflow/active/` (session discovery)
  - `.workflow/active/{session_id}/workflow-session.json`
  - `.workflow/active/{session_id}/IMPL_PLAN.md`
  - `.workflow/active/{session_id}/TODO_LIST.md`
  - `.workflow/active/{session_id}/.task/*.json`
  - `{requirements_string_or_md_file}`

## Implementation Pointers

- Command doc: `.claude/commands/workflow/replan.md`
- Likely code locations:
  - `ccw/src/tools/session-manager.ts` (session discovery + `.process/` support)
  - `ccw/src/commands/session-path-resolver.ts` (map IMPL_PLAN/TODO/task files)
  - `ccw/src/core/session-scanner.ts` (read/validate `workflow-session.json`)

### Evidence (Existing vs Planned)

You MUST label each pointer as `Existing` (verifiable in repo now) or `Planned` (will be created/modified).

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/replan.md` | Existing | docs: `.claude/commands/workflow/replan.md` / `Workflow Replan Command` ; ts: `ccw/src/commands/session-path-resolver.ts` / `'workflow-session.json': 'session'` | `Test-Path .claude/commands/workflow/replan.md` | Oracle doc for modes, phases, artifacts |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/replan.md` / `Phase 4: Backup Creation` ; ts: `ccw/src/tools/session-manager.ts` / `ensureDir(join(sessionPath, '.process'))` | `Test-Path ccw/src/tools/session-manager.ts; rg "ensureDir(join(sessionPath, '.process'))" ccw/src/tools/session-manager.ts` | Session lifecycle + `.process/` directory where backups live |
| `ccw/src/commands/session-path-resolver.ts` | Existing | docs: `.claude/commands/workflow/replan.md` / `Phase 5: Apply Modifications` ; ts: `ccw/src/commands/session-path-resolver.ts` / `'IMPL_PLAN.md': 'plan'` | `Test-Path ccw/src/commands/session-path-resolver.ts; rg "'IMPL_PLAN.md': 'plan'" ccw/src/commands/session-path-resolver.ts` | Resolves canonical artifact paths (plan/todo/task/session) |
| `ccw/src/core/session-scanner.ts` | Existing | docs: `.claude/commands/workflow/replan.md` / `Phase 1: Mode Detection & Session Discovery` ; ts: `ccw/src/core/session-scanner.ts` / `const sessionFile = join(sessionPath, 'workflow-session.json')` | `Test-Path ccw/src/core/session-scanner.ts; rg "const sessionFile = join(sessionPath, 'workflow-session.json')" ccw/src/core/session-scanner.ts` | Loads session metadata to drive replan decisions |
| `.workflow/active/{session_id}/.process/backup/replan-{timestamp}/MANIFEST.md` | Planned | docs: `.claude/commands/workflow/replan.md` / `Replan Backup Manifest` ; ts: `ccw/src/tools/session-manager.ts` / `process: '{base}/.process/{filename}'` | `Test-Path .workflow/active` | Backup manifest location used for rollback / auditability |

## Execution Process

1. Input parsing
   - Parse flags (`--session`, `--interactive`, `-y|--yes`)
   - Detect mode:
     - Task mode if a task ID is present
     - Session mode otherwise
2. Phase 1: Mode detection & session discovery
   - Resolve session from `--session` or auto-detect under `.workflow/active/`
   - Load `workflow-session.json`, `IMPL_PLAN.md`, `TODO_LIST.md`, task files
3. Phase 2: Interactive requirement clarification (if `--interactive` or needed)
   - Ask a small number of questions to bound scope and expected modifications
   - Respect CCW AskUserQuestion option limits (<= 4 options)
4. Phase 3: Impact analysis & planning
   - Determine affected artifacts/tasks
   - Present a concrete change plan; confirm Execute / Adjust / Cancel
5. Phase 4: Backup creation
   - Create timestamped backup directory under `.process/backup/`
   - Write a manifest including restore instructions
6. Phase 5: Apply modifications
   - Update plan/todo/task JSONs/session metadata as required by the chosen scope
7. Phase 6: Verification & summary
   - Validate JSON + task limits + dependency acyclicity
   - Summarize changed files + rollback instructions

## Error Handling

- Session errors:
  - No active session found
  - Session not found / invalid `--session`
  - No changes specified
- Task errors:
  - Task not found
  - Task completed (requires explicit override if supported)
  - Circular dependency introduced
- Validation errors:
  - Task limit exceeded
  - Invalid JSON

## Examples

```bash
# Auto-detect active session (session mode)
/workflow:replan "Add 2FA support"

# Explicit session + file-based input
/workflow:replan --session WFS-auth requirements-update.md

# Task mode (direct task update)
/workflow:replan IMPL-1 "Switch to OAuth2"

# Force interactive clarification
/workflow:replan --interactive
```

