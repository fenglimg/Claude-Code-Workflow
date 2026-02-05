---
name: gather
description: Intelligently collect project context using context-search-agent based on task description, packages into standardized JSON
argument-hint: "--session WFS-session-id \"task description\""
allowed-tools: Task(*), Read(*), Glob(*)
group: workflow
---

# workflow:gather

## Overview

- Goal: Intelligently collect and package project context into a standardized `context-package.json` for implementation planning.
- Command: `/workflow:gather` (oracle doc heading uses `/workflow:tools:context-gather`)

## Usage

```bash
/workflow:gather --session WFS-session-id "task description"
```

## Inputs

- Required inputs:
  - `--session <session_id>` (WFS-*)
  - `task description` (string; quote if it contains spaces)
- Optional inputs:
  - None (exploration angles and parallelism are derived from complexity)

## Outputs / Artifacts

- Writes:
  - `.workflow/active/<session_id>/.process/context-package.json`
  - `.workflow/active/<session_id>/.process/explorations-manifest.json`
  - `.workflow/active/<session_id>/.process/exploration-<angle>.json`
- Reads:
  - `.workflow/active/<session_id>/.process/context-package.json` (reuse if valid for session)
  - `.workflow/active/<session_id>/planning-notes.md` (user intent / constraints; may be absent)

## Implementation Pointers

- Command doc: `.claude/commands/workflow/tools/context-gather.md`
- Likely code locations:
  - `.claude/agents/context-search-agent.md` (subagent invoked for discovery + packaging)
  - `ccw/src/tools/session-manager.ts` (canonical `.workflow/active` routing)
  - `ccw/src/tools/command-registry.ts` (command discovery/indexing expectations)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/tools/context-gather.md` | Existing | docs: `.claude/commands/workflow/tools/context-gather.md` / `Context Gather Command (/workflow:tools:context-gather)` ; ts: `ccw/src/tools/command-registry.ts` / `const relativePath = join('.claude', 'commands', 'workflow');` | `Test-Path .claude/commands/workflow/tools/context-gather.md` | oracle command doc |
| `.claude/agents/context-search-agent.md` | Existing | docs: `.claude/commands/workflow/tools/context-gather.md` / `Execution Process` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path .claude/agents/context-search-agent.md` | subagent invoked to synthesize + package context |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/tools/context-gather.md` / `Core Philosophy` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path ccw/src/tools/session-manager.ts` | canonical session artifact routing used by WFS commands |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/tools/context-gather.md` / `Overview` ; ts: `ccw/src/tools/command-registry.ts` / `ERROR: ~/.claude/commands/workflow directory not found` | `Test-Path ccw/src/tools/command-registry.ts` | discovery/indexing constraints that may affect how this command is surfaced |
| `.claude/commands/workflow/tools/test-context-gather.md` | Existing | docs: `.claude/commands/workflow/tools/test-context-gather.md` / `Test Context Gather Command (/workflow:tools:test-context-gather)` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path .claude/commands/workflow/tools/test-context-gather.md` | closest peer command for “detection-first + package JSON” pattern |

## Execution Process

1. Parse inputs: `--session <session_id>` + `task description`.
2. Step 1: Context-package detection
   - If `.workflow/active/<session_id>/.process/context-package.json` exists and matches the session, return it.
3. Step 2: Complexity assessment & parallel explore
   - Classify complexity (low/medium/high) from task description.
   - Select 1-4 exploration angles and run `cli-explore-agent` tasks in parallel (each writes `exploration-<angle>.json`).
   - Write `.process/explorations-manifest.json`.
4. Step 3: Invoke `context-search-agent`
   - Provide planning notes + exploration manifest/results as structured input.
   - Produce `.process/context-package.json` including `exploration_results`.
5. Step 4: Output verification
   - Ensure `context-package.json` exists and includes `exploration_results` (non-empty for medium/high tasks).

## Error Handling

- Missing/invalid `--session`: fail fast with a single actionable error (expected `WFS-...`).
- Missing task description: fail fast (must be a non-empty string).
- Existing package present but invalid (session mismatch / parse failure): warn and regenerate.
- Subagent failure (explore or context-search): surface failing task angle and preserve partial artifacts for debugging.
- Output validation failure: report which required fields are missing in `context-package.json`.

## Examples

- `/workflow:gather --session WFS-user-auth "Implement user authentication system"`
- `/workflow:gather --session WFS-payment "Refactor payment module API"`

## Parameter Reference

- `--session <session_id>`: Workflow session identifier, used for `.workflow/active/<session_id>/...` routing.
- `<task description>`: The user goal/problem statement; used to choose exploration angles and search queries.

## Output Schema

Minimum expected structure for `.process/context-package.json`:

- `metadata.session_id`
- `statistics` (high-level counts)
- `exploration_results[]` (angle summaries + key file pointers)
- `conflict_detection` (risk level + hotspots)

## Notes

- Keep tool surface honest: if the orchestrator itself writes files, add `Write(*)` to allowed-tools; otherwise ensure writes happen inside Task subagents.

