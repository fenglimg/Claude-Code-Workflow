---
name: list
description: List all workflow sessions with status filtering, shows session metadata and progress information
argument-hint: ""
allowed-tools: Bash(*)
group: workflow:session
---

# List Workflow Sessions

## Overview

- Goal: List workflow sessions (active + archived) with key metadata and quick progress counts.
- Command: `/workflow:session:list`

## Usage

```bash
/workflow:session:list [--location <active|archived|both>] [--recent <n>]
```

## Inputs

- Required inputs:
  - None
- Optional inputs:
  - `--location <active|archived|both>`: which session sets to display (default: `both`)
  - `--recent <n>`: show only the N most recently created sessions (requires reading `created_at` metadata)

## Outputs / Artifacts

- Writes:
  - None (read-only)
- Reads:
  - `.workflow/active/WFS-*/workflow-session.json` (session metadata)
  - `.workflow/archives/WFS-*/workflow-session.json` (archived session metadata, if present)
  - `.workflow/active/WFS-*/.task/*.json` (task count)
  - `.workflow/active/WFS-*/.summaries/*.md` (completed/summary count)

## Implementation Pointers

- Command doc: `.claude/commands/workflow/session/list.md`
- Likely code locations:
  - `ccw/src/tools/session-manager.ts` (tooling path conventions; list operation)
  - `ccw/src/commands/session.ts` (CLI adapter patterns for listing sessions + formatting output)

### Evidence (Existing vs Planned)

You MUST label each pointer as `Existing` (verifiable in repo now) or `Planned` (will be created/modified).

Rules:
- `Existing` MUST include evidence from BOTH:
  - a command doc source: `.claude/commands/**.md` (section heading is sufficient)
  - a TypeScript source: `ccw/src/**` (function name / subcommand case / a ripgrep-able string)
- If you cannot verify, downgrade to `Planned` and add a concrete `Verify` step (e.g. `Test-Path <path>`, `rg "<pattern>" <path>`).

| Pointer | Status | Evidence | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/session/list.md` | Existing | docs: `.claude/commands/workflow/session/list.md` / `Implementation Flow` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path .claude/commands/workflow/session/list.md` | Command oracle + expected user-facing behavior |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/session/list.md` / `Simple Output Format` ; ts: `ccw/src/tools/session-manager.ts` / `function executeList(params: Params): any {` | `Test-Path ccw/src/tools/session-manager.ts` | Centralizes session storage paths and list semantics (active/archived/lite) |
| `ccw/src/commands/session.ts` | Existing | docs: `.claude/commands/workflow/session/list.md` / `Usage` ; ts: `ccw/src/commands/session.ts` / `async function listAction(options: ListOptions): Promise<void> {` | `Test-Path ccw/src/commands/session.ts` | Demonstrates expected list output formatting + option plumbing via session_manager |

## Execution Process

1) Resolve session roots:
   - Active: `.workflow/active/`
   - Archived: `.workflow/archives/` (if used by the project)
2) Enumerate session directories (prefix `WFS-`) in the selected location(s).
3) For each session directory:
   - Read `workflow-session.json` fields (at minimum: `session_id`, `status`, `project/description`, `created_at` when present).
   - Count progress artifacts:
     - task count: `.task/*.json` (or `.task/` count if used)
     - summaries count: `.summaries/*.md`
4) Optionally filter:
   - `--recent <n>`: sort by `created_at` (fallback to filesystem mtime when missing).
5) Print a compact session list:
   - status badge per session (ACTIVE/PAUSED/COMPLETED/ERROR)
   - key metadata (project/description, created_at)
   - progress summary (completed/total when derivable)
6) Print a final totals line (total sessions and per-status counts).

## Error Handling

- No sessions found:
  - Print a clear message and exit successfully (read-only utility).
- Corrupted/missing metadata:
  - Mark the session as `[ERROR]` and continue listing others.
- Missing tools for parsing (e.g. `jq` in bash-based implementation):
  - Fall back to a minimal display (session directory name + location) and continue.
- Unexpected filesystem errors (permission, unreadable dirs):
  - Report the error for that directory and continue.

## Examples

```bash
# Show all sessions
/workflow:session:list

# Only active sessions
/workflow:session:list --location active

# Show the 5 most recent sessions (by created_at when available)
/workflow:session:list --recent 5
```
