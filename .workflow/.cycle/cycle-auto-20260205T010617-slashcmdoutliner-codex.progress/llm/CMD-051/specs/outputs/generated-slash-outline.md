---
name: resume
description: Resume the most recently paused workflow session with automatic session discovery and status update
argument-hint: "[WFS-<session-id>]"
allowed-tools: Read(*), Write(*), Bash(*)
group: workflow
---

# workflow:resume

## Overview

- Goal: Resume a paused workflow session (auto-pick most recent) and mark it active so work can continue.
- Command: `/workflow:resume`

## Usage

```bash
/workflow:resume [WFS-<session-id>]
```

## Inputs

- Required inputs:
  - None
- Optional inputs:
  - `WFS-<session-id>`: Resume a specific session under `.workflow/active/` instead of auto-discovery.

## Outputs / Artifacts

- Writes:
  - `.workflow/active/WFS-*/workflow-session.json` (updates `status`, adds/updates `resumed_at`)
- Reads:
  - `.workflow/active`
  - `.workflow/active/WFS-*/workflow-session.json`

## Implementation Pointers

- Command doc: `.claude/commands/workflow/session/resume.md`
- Likely code locations:
  - `ccw/src/core/session-scanner.ts`
  - `ccw/src/tools/session-manager.ts`
  - `ccw/src/commands/session.ts`
  - `.claude/commands/workflow/resume.md` (optional alias doc for `/workflow:resume`)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/session/resume.md` | Existing | docs: `.claude/commands/workflow/session/resume.md` / `Resume Workflow Session (/workflow:session:resume)` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path .claude/commands/workflow/session/resume.md` | Oracle command doc that defines the intended behavior flow. |
| `ccw/src/core/session-scanner.ts` | Existing | docs: `.claude/commands/workflow/session/resume.md` / `Implementation Flow` ; ts: `ccw/src/core/session-scanner.ts` / `status: (data.status as 'active' | 'paused' | 'completed' | 'archived') || 'active',` | `Test-Path ccw/src/core/session-scanner.ts; rg \"status: (data.status as 'active' | 'paused' | 'completed' | 'archived')\" ccw/src/core/session-scanner.ts` | Existing session enumeration + status parsing to support “most recent paused session” selection. |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/session/resume.md` / `Step 4: Update Session Status` ; ts: `ccw/src/tools/session-manager.ts` / `session: '{base}/workflow-session.json',` | `Test-Path ccw/src/tools/session-manager.ts; rg \"session: '{base}/workflow-session.json'\" ccw/src/tools/session-manager.ts` | Canonical tool for reading/writing `workflow-session.json` (preferred over ad-hoc shell edits when available). |
| `ccw/src/commands/session.ts` | Existing | docs: `.claude/commands/workflow/session/resume.md` / `Usage` ; ts: `ccw/src/commands/session.ts` / `const result = await executeTool('session_manager', params);` | `Test-Path ccw/src/commands/session.ts; rg \"executeTool('session_manager'\" ccw/src/commands/session.ts` | CLI adapter pattern to reuse for implementing a resume helper/operation if needed. |
| `.claude/commands/workflow/resume.md` | Planned | docs: `.claude/commands/workflow/session/resume.md` / `Overview` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path .claude/commands/workflow/resume.md` | Optional: add a top-level alias doc so `/workflow:resume` exists without relying on nested `session/` doc naming. |

## Execution Process

1. Resolve target session ID
   - If `WFS-<session-id>` is provided:
     - Verify the directory exists under `.workflow/active/`.
     - Load `.workflow/active/<id>/workflow-session.json`.
   - Else (auto mode):
     - Enumerate `.workflow/active/WFS-*/workflow-session.json` (newest first by file mtime or `updated_at` field when present).
     - Pick the first session whose `status` is exactly `"paused"`.

2. Validate resumability
   - If no session metadata files exist: error and exit (no sessions).
   - If no session has `status="paused"`: error and exit (nothing to resume).
   - If session JSON is missing or invalid: error and exit (do not guess).

3. Update session metadata (atomic)
   - Set `status` to `"active"`.
   - Set `resumed_at` to current UTC ISO-8601 (e.g. `2026-02-05T01:06:17Z`).
   - Write back atomically (write temp file next to target then replace).

4. Print result summary
   - Include: `SESSION_ID`, `Status: active`, and `Resumed at: <timestamp>`.
   - Suggest next step: `/workflow:execute` (only as a hint, do not auto-run).

## Error Handling

- No session directory: print `ERROR: No workflow sessions found under .workflow/active/`.
- No paused session: print `ERROR: No paused session found to resume.` (optionally list the newest 3 sessions and their status).
- Invalid/missing `workflow-session.json`: print `ERROR: Session metadata missing or invalid: <path>`.
- Attempt to resume non-paused session: print `ERROR: Session is not paused (status=<value>)` and do not modify files.

## Examples

```bash
/workflow:resume
```

```bash
/workflow:resume WFS-user-auth
```

