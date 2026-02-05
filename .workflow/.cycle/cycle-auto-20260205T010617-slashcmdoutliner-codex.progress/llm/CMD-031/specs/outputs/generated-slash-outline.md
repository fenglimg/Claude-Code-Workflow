---
name: synthesis
description: Clarify and refine role analyses through intelligent Q&A and targeted updates with synthesis agent
argument-hint: "[-y|--yes] [optional: --session session-id]"
allowed-tools: Task(conceptual-planning-agent), TodoWrite(*), Read(*), Write(*), Edit(*), Glob(*), AskUserQuestion(*)
group: workflow
---

# Synthesis (Workflow Brainstorm)

## Overview

- Goal: Collect targeted clarifications, propose enhancements, and apply selected updates across role analysis documents within a workflow session.
- Command (expected): `/workflow:brainstorm:synthesis`

## Usage

```bash
/workflow:brainstorm:synthesis [-y|--yes] [--session <WFS-id>]
```

## Inputs

- Required inputs:
  - A workflow session (via `--session <WFS-id>` or by detecting `.workflow/active/WFS-*`)
  - One or more role analysis files: `.workflow/active/WFS-*/.brainstorming/*/analysis*.md`
- Optional inputs:
  - `guidance-specification.md` (if present)
  - `-y|--yes` to run in Auto Mode (skip clarification questions)

## Outputs / Artifacts

- Writes:
  - `.workflow/active/WFS-*/.brainstorming/*/analysis*.md` (updated with Enhancements + Clarifications sections)
  - `.workflow/active/WFS-*/.process/context-package.json` (synced with updated analyses)
  - `.workflow/active/WFS-*/workflow-session.json` (session metadata update, if applicable)
- Reads:
  - `.workflow/active/WFS-*/workflow-session.json`
  - `.workflow/active/WFS-*/.brainstorming/*/analysis*.md`
  - `.workflow/active/WFS-*/.process/context-package.json`
  - `guidance-specification.md`

## Implementation Pointers

- Command doc: `.claude/commands/workflow/brainstorm/synthesis.md`
- Likely code locations:
  - `ccw/src/core/routes/commands-routes.ts` (recursive command discovery + grouping)
  - `ccw/src/tools/command-registry.ts` (workflow command metadata extraction; note limitations vs nested command paths)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/brainstorm/synthesis.md` | Existing | docs: `.claude/commands/workflow/brainstorm/synthesis.md` / `Overview` ; ts: `ccw/src/core/routes/commands-routes.ts` / `scanCommandsRecursive(` | `Test-Path .claude/commands/workflow/brainstorm/synthesis.md; rg \"^## Overview\" .claude/commands/workflow/brainstorm/synthesis.md; rg \"scanCommandsRecursive\\(\" ccw/src/core/routes/commands-routes.ts` | Primary command doc and the server-side scanner that discovers nested command docs |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/workflow/brainstorm/synthesis.md` / `Execution Phases` ; ts: `ccw/src/core/routes/commands-routes.ts` / `getCommandGroup(commandName: string, relativePath: string, location: CommandLocation, projectPath: string): string {` | `Test-Path ccw/src/core/routes/commands-routes.ts; rg \"function scanCommandsRecursive\\(\" ccw/src/core/routes/commands-routes.ts` | Governs how commands are discovered and grouped from `.claude/commands/**` (including subdirectories) |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/brainstorm/synthesis.md` / `Quick Reference` ; ts: `ccw/src/tools/command-registry.ts` / `commandName.startsWith('/workflow:')` | `Test-Path ccw/src/tools/command-registry.ts; rg \"commandName\\.startsWith\\('/workflow:'\\)\" ccw/src/tools/command-registry.ts` | Tooling that reads command YAML headers; important to reconcile with nested command file locations |

## Execution Process

1. Phase 1: Discovery & Validation
   - Detect or accept session id (`--session` or `.workflow/active/WFS-*`)
   - Validate inputs: `*/analysis*.md` (required), `guidance-specification.md` (optional)
   - Load intent from `workflow-session.json`
2. Phase 2: Role Discovery & Path Preparation
   - Glob role analyses under `.workflow/active/WFS-{session}/.brainstorming/*/analysis*.md`
   - Prepare per-role update targets
3. Phase 3A: Analysis & Enhancement Agent
   - Run `Task(conceptual-planning-agent)` to produce cross-role enhancement recommendations and candidate clarifying questions
4. Phase 4: User Interaction (skipped in Auto Mode)
   - Ask user to select enhancements
   - Ask clarification questions (AskUserQuestion; max 4 questions per call; allow multi-round)
   - Build a concrete per-role update plan
5. Phase 5: Parallel Document Update Agents
   - Spawn parallel update tasks (one per role analysis file) to apply selected enhancements and incorporate clarifications
6. Phase 6: Finalization
   - Sync updated analyses into `.process/context-package.json`
   - Update session metadata (if required by the workflow)
   - Produce a completion report (what changed + next steps)

## Error Handling

- Session not found: surface actionable guidance (pass `--session`, or start/resume a session).
- No analysis files found: error with the glob that was attempted and expected directory layout.
- Missing optional inputs (e.g. `guidance-specification.md`): warn and continue.
- AskUserQuestion failures or empty answers: re-ask with narrower questions; avoid blocking indefinitely.
- File write conflicts: re-read latest content, apply minimal diff, and report any skipped changes.

## Examples

```bash
# Interactive (asks enhancement selection + clarification questions)
/workflow:brainstorm:synthesis --session WFS-123

# Auto Mode (skip clarification questions)
/workflow:brainstorm:synthesis -y --session WFS-123
```

