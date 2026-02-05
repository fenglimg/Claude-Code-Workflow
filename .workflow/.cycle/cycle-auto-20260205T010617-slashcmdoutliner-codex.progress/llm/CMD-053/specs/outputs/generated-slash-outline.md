---
name: start
description: Discover existing sessions or start new workflow session with intelligent session management and conflict detection
argument-hint: "[--type <workflow|review|tdd|test|docs>] [--auto|--new] [optional: task description for new session]"
allowed-tools: Skill(*), AskUserQuestion(*), Read(*), Write(*), Bash(*)
group: workflow
---

# Start Workflow Session (/workflow:session:start)

## Overview

- Goal: Discover existing sessions or start a new workflow session, with safe defaults and conflict handling.
- Command: `/workflow:session:start`

## Usage

```bash
/workflow:session:start [--type <workflow|review|tdd|test|docs>] [--auto|--new] [task description]
```

## Inputs

- Required inputs:
  - None (Discovery mode)
- Optional inputs:
  - `--type <workflow|review|tdd|test|docs>` (default: `workflow`)
  - `--auto "<task description>"` (intelligent mode; requires task description)
  - `--new "<task description>"` (force-new mode; requires task description)

## Outputs / Artifacts

- Writes:
  - `.workflow/project-tech.json` (first-time only; via `/workflow:init`)
  - `.workflow/project-guidelines.json` (first-time only; via `/workflow:init`)
  - `.workflow/active/WFS-*/` (session directory)
  - `.workflow/active/WFS-*/workflow-session.json` (session metadata; includes `type`)
  - `.workflow/active/WFS-*/.process/`
  - `.workflow/active/WFS-*/.task/`
  - `.workflow/active/WFS-*/.summaries/`
- Reads:
  - `.workflow/project-tech.json` + `.workflow/project-guidelines.json` (presence check)
  - `.workflow/active/` (active session discovery)
  - `.workflow/active/WFS-*/workflow-session.json` (session metadata for reuse decision)

## Implementation Pointers

- Command doc: `.claude/commands/workflow/session/start.md`
- Likely code locations:
  - `ccw/src/tools/session-manager.ts`
  - `ccw/src/core/session-scanner.ts`

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/session/start.md` | Existing | docs: `.claude/commands/workflow/session/start.md` / `Overview` ; ts: `ccw/src/tools/session-manager.ts` / `function executeInit(params: Params): any {` | `Test-Path .claude/commands/workflow/session/start.md` | Oracle command doc and structure hints |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/session/start.md` / `Mode 2: Auto Mode (Intelligent)` ; ts: `ccw/src/tools/session-manager.ts` / `function executeInit(params: Params): any {` | `Test-Path ccw/src/tools/session-manager.ts` | Session lifecycle operations (init/list/read/write/archive) used by session start |
| `ccw/src/core/session-scanner.ts` | Existing | docs: `.claude/commands/workflow/session/list.md` / `Implementation Flow` ; ts: `ccw/src/core/session-scanner.ts` / `export async function scanSessions(workflowDir: string): Promise<ScanSessionsResult> {` | `Test-Path ccw/src/core/session-scanner.ts` | Cross-platform session discovery (WFS-* scanning + metadata parsing) |

## Execution Process

1. Step 0 (always): ensure project state exists
   - If `.workflow/project-tech.json` or `.workflow/project-guidelines.json` missing, delegate to `/workflow:init` and continue.
2. Mode selection (based on args)
   - Discovery (default): list active sessions + show metadata; prompt user to reuse or create new.
   - Auto (`--auto`): if 0 active sessions create new; if 1 active session decide reuse vs new; if many choose first and warn.
   - Force-new (`--new`): always create new session; ensure unique session slug.
3. Session creation (when needed)
   - Generate `WFS-<slug>` (lowercase; max 50; append numeric suffix on collision).
   - Create session directory structure + write `workflow-session.json` including `type` (defaults to `workflow`).
4. Output
   - Print `SESSION_ID: WFS-...`
   - If multiple active sessions were detected in auto mode, also print warning + chosen session id.

## Error Handling

- Invalid `--type`: `ERROR: Invalid session type. Valid types: workflow, review, tdd, test, docs`
- `--auto` or `--new` without a task description: `ERROR: --auto mode requires task description`
- Filesystem failures (mkdir/write): `ERROR: Failed to create session directory`

## Examples

- `/workflow:session:start`
- `/workflow:session:start --auto "implement OAuth2 authentication"`
- `/workflow:session:start --type review "Code review for auth module"`

