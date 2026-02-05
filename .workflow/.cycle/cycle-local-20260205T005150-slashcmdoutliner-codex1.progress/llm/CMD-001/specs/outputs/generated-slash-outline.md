---
name: ccw-coordinator
description: Command orchestration tool - analyze requirements, recommend chain, execute sequentially with state persistence
argument-hint: "[task description]"
allowed-tools: Task(*), AskUserQuestion(*), Read(*), Write(*), Bash(*), Glob(*), Grep(*)
group: ""
---

# CCW Coordinator Command

## Overview

- Goal: Analyze a task, recommend a CCW command chain, and (optionally) execute it sequentially with persisted state for resume.
- Command: `/ccw-coordinator`

## Usage

```bash
/ccw-coordinator [task description]
```

## Inputs

- Required inputs:
  - Task description (goal, constraints, scope; optionally include repo/context pointers)
- Optional inputs:
  - Follow-up invocation can reference the persisted session state (see Outputs / Artifacts)

## Outputs / Artifacts

- Writes:
  - `.workflow/.ccw-coordinator/{session_id}/state.json`
- Reads:
  - `.claude/commands/**/*.md` (command discovery + metadata)
  - `.workflow/.ccw-coordinator/{session_id}/state.json` (resume)

## Implementation Pointers

- Command doc: `.claude/commands/ccw-coordinator.md`
- Likely code locations:
  - `ccw/src/templates/dashboard-js/views/commands-manager.js`
  - `ccw/src/tools/command-registry.ts`
  - `ccw/src/commands/cli.ts`
  - `ccw/src/commands/hook.ts`
  - `ccw/src/core/routes/hooks-routes.ts`
  - `ccw/src/core/websocket.ts`

### Evidence (Existing vs Planned)

You MUST label each pointer as `Existing` (verifiable in repo now) or `Planned` (will be created/modified).

Rules:
- `Existing` MUST include evidence from BOTH:
  - a command doc source: `.claude/commands/**.md` (section heading is sufficient)
  - a TypeScript source: `ccw/src/**` (function name / subcommand case / a ripgrep-able string)
- If you cannot verify, downgrade to `Planned` and add a concrete `Verify` step (e.g. `Test-Path <path>`, `rg "<pattern>" <path>`).

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/ccw-coordinator.md` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `CCW Coordinator Command` ; ts: `ccw/src/templates/dashboard-js/views/commands-manager.js` / `Manages Claude Code commands (.claude/commands/)` | `Test-Path .claude/commands/ccw-coordinator.md` | canonical slash command doc (oracle) |
| `ccw/src/templates/dashboard-js/views/commands-manager.js` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `Phase 2: Discover Commands & Recommend Chain` ; ts: `ccw/src/templates/dashboard-js/views/commands-manager.js` / `Manages Claude Code commands (.claude/commands/)` | `Test-Path ccw/src/templates/dashboard-js/views/commands-manager.js` | UI/UX surface that manages command docs under `.claude/commands/` |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `CommandRegistry Integration` ; ts: `ccw/src/tools/command-registry.ts` / `export class CommandRegistry {` | `Test-Path ccw/src/tools/command-registry.ts` | command discovery helper used by the coordinator to list and hydrate commands |
| `ccw/src/commands/cli.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `CLI Execution Model` ; ts: `ccw/src/commands/cli.ts` / `export async function cliCommand(` | `Test-Path ccw/src/commands/cli.ts` | CLI execution entry used by coordinator when spawning `ccw cli -p ...` calls |
| `ccw/src/commands/hook.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `Execution Flow` ; ts: `ccw/src/commands/hook.ts` / `async function parseStatusAction(options: HookOptions): Promise<void> {` | `Test-Path ccw/src/commands/hook.ts` | hook-side continuation and status parsing used in coordinator-style workflows |
| `ccw/src/core/routes/hooks-routes.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `Phase 3: Execute Sequential Command Chain` ; ts: `ccw/src/core/routes/hooks-routes.ts` / `const { pathname, url, req, res, initialPath, handlePostRequest, broadcastToClients, extractSessionIdFromPath } = ctx;` | `Test-Path ccw/src/core/routes/hooks-routes.ts` | server endpoints that accept hook callbacks and propagate updates |
| `ccw/src/core/websocket.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `State File Structure` ; ts: `ccw/src/core/websocket.ts` / `export function broadcastCoordinatorUpdate(message: CoordinatorMessage): void {` | `Test-Path ccw/src/core/websocket.ts` | coordinator state/log/question broadcast plumbing for Dashboard visibility |
| `.workflow/.ccw-coordinator/{session_id}/state.json` | Planned | docs: `.claude/commands/ccw-coordinator.md` / `State File Structure` ; ts: `ccw/src/core/websocket.ts` / `export function broadcastCoordinatorUpdate(message: CoordinatorMessage): void {` | `Test-Path .workflow/.ccw-coordinator` | runtime state persisted per session for resume + progress display |

Notes:
- Expand code pointers into one row per pointer (done).
- TS anchors are literal strings present in the referenced `ccw/src/**` files.

## Execution Process

1. Phase 1: Analyze requirements
   - Parse the task into goal/scope/constraints/complexity.
2. Phase 2: Discover commands & recommend chain
   - Discover available commands from `.claude/commands/**/*.md` (metadata via registry/tooling).
   - Recommend an ordered chain that respects minimum execution units (atomic groups).
3. Phase 2b: Get user confirmation
   - Present chain (with args + expected outputs) and request confirmation / edits.
4. Phase 3: Execute sequentially with state persistence
   - Write initial `.workflow/.ccw-coordinator/{session_id}/state.json`.
   - For each command: spawn execution, update per-step status, persist, and continue on hook callbacks.
5. Report results
   - Summarize final status + key artifacts and provide resume instructions.

## Error Handling

- Validate input:
  - if task description is empty/ambiguous, ask focused clarifying questions before recommending a chain
- Command discovery failures:
  - if `.claude/commands` is missing/unreadable, explain and fall back to a minimal default chain
- Execution failures:
  - capture error, mark state as failed, and provide next-step options (retry step, skip, abort)
- Resume:
  - if state file is missing/corrupt, fail gracefully and offer to start a new session

## Examples

```bash
/ccw-coordinator "Add caching to the command registry and verify with tests"
```

