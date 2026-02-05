# Gap Report: workflow:analyze-with-file

## Reference

- Selected reference: workflow:brainstorm-with-file (`.claude/commands/workflow/brainstorm-with-file.md`)

## P0 Gaps (Must Fix)

- No explicit TypeScript-level linkage for the slash command name was found (e.g. a registry entry containing `analyze-with-file`). Verify the runtime path: the command doc likely drives orchestration while `ccw/src/**` provides generic CLI execution/streaming primitives.
- Confirm the continue-mode selection logic matches the documented session folder detection and does not silently overwrite an existing session.

## P1 Gaps (Should Fix)

- Ensure the command doc clearly distinguishes single vs multi-perspective outputs (`explorations.json` vs `perspectives.json`) and keeps artifact naming consistent across phases.

## P2 Gaps (Optional)

- Add a short "recommended prompt format" snippet (GOAL/SCOPE/CONTEXT) to reduce ambiguous user topics and minimize rounds.

## Implementation Pointers (Evidence)

You MUST provide an evidence table for all key implementation pointers mentioned in the outlines.

Rules (P0):
- Every pointer MUST be labeled `Existing` or `Planned`.
- `Existing` MUST be verifiable (path exists). Include a concrete `Verify` command for each existing pointer.
- Do NOT describe `Planned` pointers as "validated/exists".
- Evidence MUST reference BOTH sources somewhere in this section:
  - command docs: `.claude/commands/**.md` (section heading is enough)
  - TypeScript implementation: `ccw/src/**` (function name / subcommand case / ripgrep-able string)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/analyze-with-file.md` | Existing | docs: `.claude/commands/workflow/analyze-with-file.md` / `Quick Start` ; ts: `ccw/src/tools/cli-executor-core.ts` / `async function executeCliTool(` | `Test-Path .claude/commands/workflow/analyze-with-file.md` | Oracle command doc defines behavior + artifacts |
| `ccw/src/tools/cli-executor-core.ts` | Existing | docs: `.claude/commands/workflow/analyze-with-file.md` / `Phase 2: CLI Exploration` ; ts: `ccw/src/tools/cli-executor-core.ts` / `async function executeCliTool(` | `Test-Path ccw/src/tools/cli-executor-core.ts` | Core execution path for CLI-assisted exploration |
| `ccw/src/core/routes/cli-routes.ts` | Existing | docs: `.claude/commands/workflow/analyze-with-file.md` / `Phase 2: CLI Exploration` ; ts: `ccw/src/core/routes/cli-routes.ts` / `if (pathname === '/api/cli/execution')` | `Test-Path ccw/src/core/routes/cli-routes.ts` | API endpoints for CLI execution / streaming output |
| `.workflow/.analysis/{session-id}/discussion.md` | Planned | docs: `.claude/commands/workflow/analyze-with-file.md` / `Templates` ; ts: `ccw/src/tools/cli-executor-core.ts` / `async function executeCliTool(` | `Test-Path .workflow/.analysis/{session-id}/discussion.md` | Main analysis transcript (round-by-round, evolving understanding) |
| `.workflow/.analysis/{session-id}/exploration-codebase.json` | Planned | docs: `.claude/commands/workflow/analyze-with-file.md` / `Output Structure` ; ts: `ccw/src/core/routes/cli-routes.ts` / `if (pathname === '/api/cli/native-session')` | `Test-Path .workflow/.analysis/{session-id}/exploration-codebase.json` | Captures codebase context to seed later CLI prompts |

Notes:
- Evidence anchors are literal substring matches; keep them stable and ripgrep-able.

## Implementation Hints (Tooling/Server)

- Prefer the existing CLI execution core (`ccw/src/tools/cli-executor-core.ts`) and the CLI routes (`ccw/src/core/routes/cli-routes.ts`) for any required server-side orchestration/streaming.
- Keep file outputs strictly within `.workflow/.analysis/{session-id}/` to avoid broken artifact references.

## Proposed Fix Plan (Minimal)

1) Verify the command is executed through the intended runner (doc-driven orchestration) and that `ccw cli` invocations route through existing CLI execution plumbing.
2) Align session folder detection/continue behavior with the doc contract; add a guard to prevent overwriting.
3) Keep artifact naming consistent across single vs multi-perspective modes.

