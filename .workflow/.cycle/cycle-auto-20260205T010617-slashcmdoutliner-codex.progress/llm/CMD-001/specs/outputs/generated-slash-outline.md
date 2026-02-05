---
name: ccw-coordinator
description: Command orchestration tool - analyze requirements, recommend chain, execute sequentially with state persistence
argument-hint: "[task description]"
allowed-tools: Task(*), AskUserQuestion(*), Read(*), Write(*), Bash(*), Glob(*), Grep(*)
group: (none)
---

# CCW Coordinator Command

## Overview

- Goal: Analyze a task, propose a CCW command chain (grouped into minimum execution units), get confirmation, then execute sequentially with durable state.
- Command: `/ccw-coordinator`

## Usage

```bash
/ccw-coordinator "<task description>"
```

## Inputs

- Required inputs:
  - Task description (plain text)
- Optional inputs:
  - None (but the command may ask clarifying questions)

## Outputs / Artifacts

- Writes:
  - `.workflow/.ccw-coordinator/<session_id>/state.json`
- Reads:
  - `.claude/commands/**/*.md` (command discovery)
  - `.workflow/.ccw-coordinator/**/state.json` (resume / continuity)

## Implementation Pointers

- Command doc: `.claude/commands/ccw-coordinator.md`
- Likely code locations:
  - `ccw/src/tools/command-registry.ts`
  - `ccw/src/core/routes/commands-routes.ts`
  - `.workflow/.ccw-coordinator/`

### Evidence (Existing vs Planned)

You MUST label each pointer as `Existing` (verifiable in repo now) or `Planned` (will be created/modified).

Rules:
- `Existing` MUST include evidence from BOTH:
  - a command doc source: `.claude/commands/**.md` (section heading is sufficient)
  - a TypeScript source: `ccw/src/**` (function name / subcommand case / a ripgrep-able string)
- If you cannot verify, downgrade to `Planned` and add a concrete `Verify` step (e.g. `Test-Path <path>`, `rg "<pattern>" <path>`).

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/ccw-coordinator.md` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `CCW Coordinator Command` ; ts: `ccw/src/tools/command-registry.ts` / `export class CommandRegistry {` | `Test-Path .claude/commands/ccw-coordinator.md` | Canonical command behavior + orchestration rules |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `CommandRegistry Integration` ; ts: `ccw/src/tools/command-registry.ts` / `export class CommandRegistry {` | `Test-Path ccw/src/tools/command-registry.ts; rg "export class CommandRegistry {" ccw/src/tools/command-registry.ts` | Deterministic command discovery + metadata extraction |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `Available Commands` ; ts: `ccw/src/core/routes/commands-routes.ts` / `pathname === '/api/commands'` | `Test-Path ccw/src/core/routes/commands-routes.ts; rg "pathname === '/api/commands'" ccw/src/core/routes/commands-routes.ts` | Server-side command listing patterns (groups/config) for tooling/UI |
| `.workflow/.ccw-coordinator/` | Planned | docs: `.claude/commands/ccw-coordinator.md` / `State File Structure` ; ts: `ccw/src/tools/command-registry.ts` / `export class CommandRegistry {` | `Test-Path .workflow/.ccw-coordinator` | Session state persistence root (created per run) |

Notes:
- Expand `code pointers` into **one row per pointer**.
- For TS evidence, prefer anchors like `function <name>` / `case '<subcommand>'` / a stable string literal that can be found via `rg`.

## Execution Process

1. Initialize session
   - Generate `session_id`, create `.workflow/.ccw-coordinator/<session_id>/`, write an initial `state.json`.
2. Phase 1: Analyze requirements
   - Extract goal, constraints, scope, and complexity from the task description.
3. Phase 2: Discover commands & recommend chain
   - Enumerate available commands + metadata.
   - Build a recommended chain grouped into minimum execution units (atomic groups).
   - Present alternatives when ambiguous.
4. Phase 2b: Get user confirmation
   - Show the proposed chain + why; accept edits (add/remove/reorder) and confirm.
5. Phase 3: Execute sequential command chain
   - For each command in the chain:
     - Format prompt content so the slash command is first (e.g. `/workflow:<cmd> -y ...`).
     - Launch via `Bash("ccw cli -p \"...\" --tool <tool> --mode <mode>", { run_in_background: true })`.
     - Checkpoint state and stop (serial blocking).
     - Resume on completion signal; persist results and continue.
6. Completion
   - Mark state `completed` and print session + artifact summary.

## Error Handling

- Validate inputs: empty task description -> ask user to rephrase.
- Discovery failures: no command corpus found -> explain expected locations and stop.
- Execution failures: background task creation fails -> record failure in state and stop.
- Resume failures: missing/invalid state.json -> offer to start a fresh session.
- Safety: never run destructive commands without explicit user request; keep execution strictly serial.

## Examples

- Implement feature:
  - `/ccw-coordinator "Implement OAuth2 login with refresh tokens"`
- Fix bug:
  - `/ccw-coordinator "Fix intermittent timeout in payment webhook handler"`

