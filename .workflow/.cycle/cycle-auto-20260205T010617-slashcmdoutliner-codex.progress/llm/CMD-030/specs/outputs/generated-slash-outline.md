---
name: role-analysis
description: Unified role-specific analysis generation with interactive context gathering and incremental updates
argument-hint: "[role-name] [--session session-id] [--update] [--include-questions] [--skip-questions]"
allowed-tools: Task(conceptual-planning-agent), AskUserQuestion(*), TodoWrite(*), Read(*), Write(*), Edit(*), Glob(*)
group: workflow:brainstorm
---

# Workflow Brainstorm Role Analysis

## Overview

- Goal: Generate or update a role-specific analysis file for an active brainstorming session.
- Command: `/workflow:brainstorm:role-analysis`

## Usage

```bash
/workflow:brainstorm:role-analysis <role-name> [--session <session-id>] [--update] [--include-questions] [--skip-questions]
```

## Inputs

- Required inputs:
  - `<role-name>`: one of the supported roles (e.g. `ux-expert`, `system-architect`, `product-manager`)
- Optional inputs:
  - `--session <session-id>`: target an existing brainstorming session (auto-detect if omitted)
  - `--update`: force incremental merge mode (auto-detect if analysis exists)
  - `--include-questions`: force asking questions even if an analysis exists
  - `--skip-questions`: skip interactive context gathering entirely

## Outputs / Artifacts

- Writes:
  - `.workflow/active/{session-id}/.brainstorming/{role-name}/analysis*.md`
  - `.workflow/active/{session-id}/.brainstorming/{role-name}/error.log` (only on agent failure)
- Reads:
  - `.workflow/active/{session-id}/.brainstorming/guidance-specification.md` (optional framework)
  - `.workflow/active/{session-id}/.process/context-package.json` (optional context)
  - `.workflow/active/{session-id}/.brainstorming/{role-name}/analysis*.md` (update mode)

## Implementation Pointers

- Command doc: `.claude/commands/workflow/brainstorm/role-analysis.md`
- Likely code locations:
  - `ccw/src/tools/session-manager.ts` (session base + brainstorm path conventions)
  - `ccw/src/commands/session-path-resolver.ts` (brainstorm path classification)
  - `ccw/src/tools/command-registry.ts` (command doc discovery/parsing patterns)
  - `ccw/src/templates/dashboard-js/views/help.js` (help/diagram slash command strings)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/brainstorm/role-analysis.md` | Existing | docs: `.claude/commands/workflow/brainstorm/role-analysis.md` / `Usage` ; ts: `ccw/src/tools/command-registry.ts` / `join('.claude', 'commands', 'workflow')` | `Test-Path .claude/commands/workflow/brainstorm/role-analysis.md` | canonical command doc target |
| `.claude/commands/workflow/brainstorm/auto-parallel.md` | Existing | docs: `.claude/commands/workflow/brainstorm/auto-parallel.md` / `3-Phase Execution` ; ts: `ccw/src/templates/dashboard-js/views/help.js` / `/workflow:brainstorm:auto-parallel` | `Test-Path .claude/commands/workflow/brainstorm/auto-parallel.md` | upstream coordinator that invokes role-analysis per-role |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/brainstorm/role-analysis.md` / `Execution Protocol` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active'` | `Test-Path ccw/src/tools/session-manager.ts` | session base path + brainstorming artifact conventions |
| `ccw/src/commands/session-path-resolver.ts` | Existing | docs: `.claude/commands/workflow/brainstorm/role-analysis.md` / `Context Loading` ; ts: `ccw/src/commands/session-path-resolver.ts` / `'.brainstorming/': 'brainstorm'` | `Test-Path ccw/src/commands/session-path-resolver.ts` | resolves brainstorm content types for session files |
| `.workflow/active/{session-id}/.brainstorming/{role-name}/analysis*.md` | Planned | docs: `.claude/commands/workflow/brainstorm/role-analysis.md` / `Output Structure` ; ts: `ccw/src/tools/session-manager.ts` / `brainstorm: '{base}/.brainstorming/{filename}'` | `Test-Path .workflow/active` | runtime artifact written per role (path varies by session) |

## Execution Process

1) Detection & validation
   - Validate `<role-name>` against supported role IDs.
   - Resolve session:
     - If `--session` provided: verify session exists under `.workflow/active/<session-id>/`.
     - Else: auto-detect active brainstorming sessions and ask user to select if ambiguous.
   - Resolve framework:
     - If `.brainstorming/guidance-specification.md` exists: load as framework input.
     - Else: continue in standalone mode with a warning.
   - Resolve update mode:
     - If `--update` or existing analysis exists: enter update flow (and optionally ask to confirm update vs regenerate).

2) Interactive context gathering (unless `--skip-questions`)
   - Determine whether to ask questions:
     - default: ask
     - `--include-questions`: always ask
     - `--skip-questions`: never ask
   - Generate role/framework-aware questions and collect answers in batches.
   - Persist/merge a user-context summary used by the agent prompt.

3) Agent execution
   - Run `conceptual-planning-agent` with:
     - role template focus
     - optional framework discussion points
     - optional prior analysis content (update mode)
     - gathered user context
   - Ensure output is a single `analysis*.md` file for the role.

4) Validation & finalization
   - Verify required sections exist in the analysis output.
   - If update mode: append clarifications timestamp + merge without losing prior content.
   - Record completion notes (and task status via TodoWrite if part of a larger workflow).

## Error Handling

- Invalid role name: show allowed roles and exit.
- No active session: instruct user to run `/workflow:brainstorm:artifacts` to create a session.
- Missing framework: warn and proceed in standalone mode.
- Agent execution failure: write an error log and suggest retry with `--skip-questions`.

## Examples

```bash
# New analysis with interactive context
/workflow:brainstorm:role-analysis ux-expert

# Target session + force questions
/workflow:brainstorm:role-analysis system-architect --session WFS-xxx --include-questions

# Incremental update
/workflow:brainstorm:role-analysis ui-designer --session WFS-xxx --update

# Quick generation (no questions)
/workflow:brainstorm:role-analysis product-manager --session WFS-xxx --skip-questions
```

