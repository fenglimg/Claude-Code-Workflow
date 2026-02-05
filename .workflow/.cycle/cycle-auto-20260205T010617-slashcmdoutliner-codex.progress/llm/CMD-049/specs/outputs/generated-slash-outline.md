---
name: complete
description: Mark active workflow session as complete (archive it, update manifest, remove active flag).
argument-hint: "[-y|--yes] [--detailed]"
allowed-tools: Skill(*), AskUserQuestion(*), Read(*), Write(*), Bash(*)
group: workflow
---

# Complete Workflow Session (/workflow:complete)

## Overview

- Goal: Close out the active workflow session safely and leave an archived record + updated manifest.
- Command: `/workflow:complete`
- Relationship: This is a thin, user-friendly alias for `/workflow:session:complete`.

## Usage

```bash
/workflow:complete [-y|--yes] [--detailed]
```

## Inputs

- Required inputs:
  - An active workflow session directory under `.workflow/active/` (typically `WFS-*`).
- Optional inputs:
  - `-y` / `--yes`: auto mode (minimize prompts; skip optional follow-ups).
  - `--detailed`: include more detailed manifest/lesson output (if supported).

## Outputs / Artifacts

- Writes:
  - `.workflow/archives/<SESSION_ID>/` (moved session)
  - `.workflow/archives/manifest.json` (append archive entry)
  - `.workflow/project-tech.json` (optional update)
  - `.workflow/active/<SESSION_ID>/.archiving` (temporary marker; removed on success)
- Reads:
  - `.workflow/active/<SESSION_ID>/workflow-session.json`
  - `.workflow/active/<SESSION_ID>/IMPL_PLAN.md`
  - `.workflow/active/<SESSION_ID>/.tasks/*.json`
  - `.workflow/active/<SESSION_ID>/.summaries/*.md`
  - `.workflow/active/<SESSION_ID>/.review/dimensions/*.json` (optional)
  - `.workflow/archives/manifest.json` (or initialize as `[]`)

## Implementation Pointers

- Command doc (to create): `.claude/commands/workflow/complete.md`
- Oracle reference (do not copy verbatim): `.claude/commands/workflow/session/complete.md`
- Likely code locations:
  - `ccw/src/tools/session-manager.ts` (session archive + lifecycle helpers)
  - `ccw/src/templates/dashboard-js/views/help.js` (workflow flow graph lists completion command)
  - `.claude/skills/ccw-help/command.json` (command registry/index)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/complete.md` | Planned | docs: `.claude/commands/workflow/session/complete.md` / Complete Workflow Session (/workflow:session:complete) ; ts: `ccw/src/tools/session-manager.ts` / const ACTIVE_BASE = '.workflow/active'; | `Test-Path .claude/commands/workflow/complete.md` | add alias command doc (`/workflow:complete`) |
| `.claude/commands/workflow/session/complete.md` | Existing | docs: `.claude/commands/workflow/session/complete.md` / Complete Workflow Session (/workflow:session:complete) ; ts: `ccw/src/tools/session-manager.ts` / function executeArchive(params: Params): any { | `Test-Path .claude/commands/workflow/session/complete.md`; `rg "^# Complete Workflow Session" .claude/commands/workflow/session/complete.md` | oracle reference for phases/artifacts |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/session/complete.md` / Complete Workflow Session (/workflow:session:complete) ; ts: `ccw/src/tools/session-manager.ts` / function executeArchive(params: Params): any { | `Test-Path ccw/src/tools/session-manager.ts`; `rg "function executeArchive" ccw/src/tools/session-manager.ts` | existing implementation surface for archiving sessions |
| `ccw/src/templates/dashboard-js/views/help.js` | Existing | docs: `.claude/commands/workflow/session/complete.md` / Complete Workflow Session (/workflow:session:complete) ; ts: `ccw/src/templates/dashboard-js/views/help.js` / label: '/workflow:session:complete' | `Test-Path ccw/src/templates/dashboard-js/views/help.js`; `rg "label: '/workflow:session:complete'" ccw/src/templates/dashboard-js/views/help.js` | help/UI flow references completion command; may switch to alias |
| `.claude/skills/ccw-help/command.json` | Existing | docs: `.claude/commands/workflow/session/complete.md` / Complete Workflow Session (/workflow:session:complete) ; ts: `ccw/src/templates/dashboard-js/views/help.js` / label: '/workflow:session:complete' | `Test-Path .claude/skills/ccw-help/command.json` | registry entry may need add `/workflow:complete` |

## Execution Process

1) Resolve the active workflow session
   - Locate the active session directory under `.workflow/active/` (expect `WFS-*`).
   - If none found: stop with a clear error.
   - If multiple found: ask user to select (unless `--yes`, then pick the most recent deterministically).

2) Create/resume an archiving marker
   - If `.archiving` marker exists, treat as resume mode.
   - Otherwise create `.archiving` to mark the process as in-progress.

3) Generate archive metadata (read-only)
   - Read minimal session metadata from `workflow-session.json` and `IMPL_PLAN.md`.
   - Compute basic counts from `.tasks/` + `.summaries/` (and optional `.review/`).

4) Archive atomically
   - Ensure `.workflow/archives/<SESSION_ID>/` exists.
   - Move session from `.workflow/active/<SESSION_ID>/` to `.workflow/archives/<SESSION_ID>/`.
   - Update `.workflow/archives/manifest.json`: read (or `[]`), append new archive entry, write.
   - Remove `.archiving` marker after success.

5) Optional project registry update
   - If `.workflow/project-tech.json` exists, append a completed feature entry that links back to `<SESSION_ID>`.

6) Post-archive follow-up (always)
   - If `--yes`: skip optional follow-ups.
   - Otherwise: ask whether to run the next-step capture (e.g., `/workflow:session:solidify`).

## Error Handling

- No active session found: explain expected location `.workflow/active/WFS-*`.
- Multiple active sessions: prompt user to select; default deterministically in `--yes` mode.
- Manifest missing or invalid JSON: initialize as `[]` (or fail with recovery instructions if unrecoverable).
- Partial failure after marker set: keep `.archiving` and provide resume instructions.
- Move/rename failure: stop and report the failing path(s); do not remove `.archiving`.

## Examples

```bash
/workflow:complete
/workflow:complete --yes
/workflow:complete --detailed
```

