# Gap Report: workflow:debug-with-file

## Reference

- Selected reference: /workflow:analyze-with-file (`.claude/commands/workflow/analyze-with-file.md`)

## P0 Gaps (Must Fix)

- Evidence tables must be kept non-placeholder and dual-source (docs + TS) for every pointer row; run `verify-evidence.js` after edits.
- The command text references `/workflow:debug` as a comparison, but there is no `.claude/commands/workflow/debug.md` in the current corpus; avoid implying it exists.
- Runtime artifacts under `.workflow/.debug/...` must not be labeled `Existing` (they are created at execution time).

## P1 Gaps (Should Fix)

- Make the `.workflow/.debug/...` session folder naming scheme and resume behavior explicit and unambiguous (what constitutes same session, how to handle date changes).
- Define minimal NDJSON schema for `debug.log` (required fields, hypothesis id, timestamp) and how to redact sensitive values.
- Specify a mandatory cleanup checklist (remove instrumentation, delete/rotate logs if sensitive, confirm tests/repro pass).

## P2 Gaps (Optional)

- Add a short "Quick Start" block and 1-2 more end-to-end examples (explore -> analyze -> fix) to reduce first-run friction.
- Add a small "When not to use this command" safety note (e.g., prod-only issues requiring external observability).

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/debug-with-file.md` | Existing | docs: `.claude/commands/workflow/debug-with-file.md / Execution Process` ; ts: `ccw/src/tools/command-registry.ts / // Normalize command name` | `Test-Path .claude/commands/workflow/debug-with-file.md` | command doc is the implementation surface for Claude Code |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md / CommandRegistry Integration` ; ts: `ccw/src/tools/command-registry.ts / export class CommandRegistry` | `Test-Path ccw/src/tools/command-registry.ts` | workflow command discovery and metadata scanning |
| `ccw/src/commands/cli.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md / CLI Invocation Format` ; ts: `ccw/src/commands/cli.ts / Usage: ccw cli -p "<prompt>" --tool gemini` | `Test-Path ccw/src/commands/cli.ts` | ensures `ccw cli -p ...` usage referenced by docs is grounded in tooling |
| `.workflow/.debug/DBG-<bugSlug>-<YYYY-MM-DD>` | Planned | docs: `.claude/commands/workflow/debug-with-file.md / Session Folder Structure` ; ts: `ccw/src/commands/loop.ts / join(currentCwd, '.workflow'` | `Test-Path .workflow/.debug` | runtime session root created by the command |

## Implementation Hints (Tooling/Server)

- Use `CommandRegistry` to map `/workflow:<name>` to command metadata when building any "list/help" flows.
- Prefer `ccw cli -p` for deterministic prompt execution in analysis/write flows; it has explicit usage and tool selection in `ccw/src/commands/cli.ts`.
- Follow existing `.workflow/*` conventions in tooling (`ccw/src/commands/loop.ts`) when defining session paths.

## Proposed Fix Plan (Minimal)

1. Docs: tighten session ID and resume rules; document what "same bug" means and what happens across dates.
2. Docs: define NDJSON schema + redaction; add a cleanup checklist.
3. Docs: adjust `/workflow:debug` comparison section to avoid implying a missing command doc exists (or add that command doc separately).
4. Validation: re-run `verify-evidence.js` after any pointer/table edits.
