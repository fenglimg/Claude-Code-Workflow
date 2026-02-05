---
name: ccw-plan
description: Planning coordinator - analyze requirements, select planning strategy, execute planning workflow in main process
argument-hint: "[--mode lite|multi-cli|full|plan-verify|replan|cli|issue|rapid-to-issue|brainstorm-with-file|analyze-with-file] [--yes|-y] \"task description\""
allowed-tools: Skill(*), TodoWrite(*), AskUserQuestion(*), Read(*), Grep(*), Glob(*)
---

# CCW-Plan Command - Planning Coordinator

## Overview

- Goal: Analyze a task, select a planning strategy/mode, then execute the appropriate planning command chain (with optional/mandatory verification depending on mode).
- Command: `/ccw-plan`

## Usage

```bash
/ccw-plan [--mode lite|multi-cli|full|plan-verify|replan|cli|issue|rapid-to-issue|brainstorm-with-file|analyze-with-file] [--yes|-y] "task description"
```

## Inputs

- Required inputs:
  - Task description (natural language)
- Optional inputs:
  - `--mode <mode>`: explicit mode override
  - `--yes` / `-y`: auto-confirm to skip interactive confirmations
  - `--session <id>`: replan an existing session (mode: `replan`)

## Outputs / Artifacts

- Writes:
  - `.workflow/.ccw-plan/{session_id}/status.json` (planning coordinator state)
- Reads:
  - `.workflow/.ccw-plan/{session_id}/status.json` (replan/resume)

## Implementation Pointers

- Command doc: `.claude/commands/ccw-plan.md`
- Likely code locations:
  - Command doc parsing / metadata extraction: `ccw/src/tools/command-registry.ts`
  - CLI-assisted mode implementation (ccw cli): `ccw/src/commands/cli.ts`
  - Skill execution plumbing (streaming output): `ccw/src/core/routes/skills-routes.ts`

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/ccw-plan.md` | Existing | docs: `.claude/commands/ccw-plan.md` / `CCW-Plan Command - Planning Coordinator` ; ts: `ccw/src/tools/command-registry.ts` / `private parseYamlHeader(content: string)` | `Test-Path .claude/commands/ccw-plan.md` | Source of truth for the slash command contract (frontmatter + workflow sections) |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `CCW Coordinator Command` ; ts: `ccw/src/tools/command-registry.ts` / `export class CommandRegistry {` | `Test-Path ccw/src/tools/command-registry.ts ; rg "export class CommandRegistry \\{" ccw/src/tools/command-registry.ts` | Provides command-metadata discovery used by coordinator-style flows |
| `ccw/src/commands/cli.ts` | Existing | docs: `.claude/commands/ccw-plan.md` / `CLI-Assisted Planning (cli mode)` ; ts: `ccw/src/commands/cli.ts` / `loadProtocol, loadTemplate` | `Test-Path ccw/src/commands/cli.ts ; rg "loadProtocol, loadTemplate" ccw/src/commands/cli.ts` | Underlying CLI execution path for "cli" mode recommendations |
| `ccw/src/core/routes/skills-routes.ts` | Existing | docs: `.claude/commands/ccw-plan.md` / `Execution Model` ; ts: `ccw/src/core/routes/skills-routes.ts` / `executeCliTool({` | `Test-Path ccw/src/core/routes/skills-routes.ts ; rg "executeCliTool\\(\\{" ccw/src/core/routes/skills-routes.ts` | Skill execution/streaming path used by main-process coordinator workflows |
| `.workflow/.ccw-plan/{session_id}/status.json` | Planned | docs: `.claude/commands/ccw-plan.md` / `Phase 4: Setup TODO Tracking & Status File` ; ts: `ccw/src/core/routes/skills-routes.ts` / `executeCliTool({` | `Test-Path .workflow/.ccw-plan` | Runtime state artifact for resumability and progress tracking |

## Execution Process

- Phase 1: Analyze requirements (goal/scope/constraints; complexity/clarity/criticality)
- Phase 1.5: Clarify requirements if clarity < 2
- Phase 2: Detect/choose mode, then build the command chain for that mode
- Phase 3: Ask user to confirm or adjust mode/chain (skipped when `--yes`)
- Phase 4: Setup TODO tracking + initialize status file
- Phase 5: Execute chain via Skill; update TODO/status as commands complete

## Error Handling

- Any command error:
  - Update status to `failed`
  - Ask user: Retry (same step) / Skip (next step) / Abort (stop planning)
- Plan-verify mode:
  - If verification fails, ask user: Refine (replan + re-verify) / Override (continue) / Abort

## Examples

```bash
/ccw-plan "Add user authentication"
/ccw-plan --mode plan-verify "Payment processing (production)"
/ccw-plan --mode replan --session WFS-auth-2025-01-28
```

