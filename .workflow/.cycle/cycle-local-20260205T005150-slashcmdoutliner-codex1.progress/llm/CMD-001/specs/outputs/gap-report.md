# Gap Report: :ccw-coordinator

## Reference

- Selected reference: /ccw-coordinator (`.claude/commands/ccw-coordinator.md`)

## P0 Gaps (Must Fix)

- None identified against the templates + P0 quality gates (frontmatter, allowed-tools, core sections, evidence-backed pointers).

## P1 Gaps (Should Fix)

- Minimum Execution Units section:
  - The outline mentions units, but does not include the concrete unit list + mapping table present in the oracle doc.
- Recommendation algorithm + UX:
  - The outline is missing deterministic scoring/selection criteria and the exact “display to user” layout described in the oracle.
- Universal prompt template:
  - The outline does not enumerate the standard prompt format, variables, and parameter patterns.
- State schema details:
  - The outline references the state file but does not include field-level schema expectations (status flow, execution_results fields).

## P2 Gaps (Optional)

- Add examples for the “planning command”, “execution command (with session reference)”, and “lite execution” follow-ups as separate example blocks.
- Add explicit safety rails for skipping steps, partial execution, and abort semantics.

## Implementation Pointers (Evidence)

You MUST provide an evidence table for all key implementation pointers mentioned in the outlines.

Rules (P0):
- Every pointer MUST be labeled `Existing` or `Planned`.
- `Existing` MUST be verifiable (path exists). Include a concrete `Verify` command for each existing pointer.
- Do NOT describe `Planned` pointers as “validated/exists”.
- Evidence MUST reference BOTH sources somewhere in this section:
  - command docs: `.claude/commands/**.md` (section heading is enough)
  - TypeScript implementation: `ccw/src/**` (function name / subcommand case / ripgrep-able string)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/ccw-coordinator.md` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `CCW Coordinator Command` ; ts: `ccw/src/templates/dashboard-js/views/commands-manager.js` / `Manages Claude Code commands (.claude/commands/)` | `Test-Path .claude/commands/ccw-coordinator.md` | source-of-truth command doc for behavior + sections |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `CommandRegistry Integration` ; ts: `ccw/src/tools/command-registry.ts` / `export class CommandRegistry {` | `Test-Path ccw/src/tools/command-registry.ts` | command discovery metadata surface used by coordinator |
| `ccw/src/commands/cli.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `CLI Execution Model` ; ts: `ccw/src/commands/cli.ts` / `export async function cliCommand(` | `Test-Path ccw/src/commands/cli.ts` | CLI execution entry point (used when spawning CLI runs) |
| `ccw/src/commands/hook.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `Execution Flow` ; ts: `ccw/src/commands/hook.ts` / `async function parseStatusAction(options: HookOptions): Promise<void> {` | `Test-Path ccw/src/commands/hook.ts` | hook parsing and continuation hooks for coordinator workflows |
| `ccw/src/core/routes/hooks-routes.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `Phase 3: Execute Sequential Command Chain` ; ts: `ccw/src/core/routes/hooks-routes.ts` / `const { pathname, url, req, res, initialPath, handlePostRequest, broadcastToClients, extractSessionIdFromPath } = ctx;` | `Test-Path ccw/src/core/routes/hooks-routes.ts` | server hook endpoints + session extraction |
| `ccw/src/core/websocket.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `State File Structure` ; ts: `ccw/src/core/websocket.ts` / `export function broadcastCoordinatorUpdate(message: CoordinatorMessage): void {` | `Test-Path ccw/src/core/websocket.ts` | coordinator progress/log broadcast to Dashboard clients |
| `.workflow/.ccw-coordinator/{session_id}/state.json` | Planned | docs: `.claude/commands/ccw-coordinator.md` / `State File Structure` ; ts: `ccw/src/core/websocket.ts` / `export function broadcastCoordinatorUpdate(message: CoordinatorMessage): void {` | `Test-Path .workflow/.ccw-coordinator` | runtime artifact: persisted session state for resume + UI status |

## Implementation Hints (Tooling/Server)

- Prefer `.claude/commands/**/*.md` as the doc-based command surface; use `ccw/src/tools/command-registry.ts` where workflow commands are needed as candidates.
- For long-running multi-step execution, rely on state persistence + hook callbacks; use coordinator websocket broadcasts for Dashboard visibility.

## Proposed Fix Plan (Minimal)

1. Expand P1 doc sections in the slash outline to match oracle headings (units list, mapping, recommendation algorithm, universal prompt template, state schema).
2. Add 2-3 concrete end-to-end examples (plan-only, plan+execute, resume from state).
3. Keep all new pointers evidence-backed; if adding new TS glue, mark as Planned until implemented and verifiable.

