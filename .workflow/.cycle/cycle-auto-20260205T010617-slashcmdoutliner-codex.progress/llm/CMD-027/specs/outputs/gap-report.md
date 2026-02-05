# Gap Report: workflow:brainstorm-with-file

## Reference

- Selected reference: /workflow:brainstorm-with-file (`.claude/commands/workflow/brainstorm-with-file.md`)

## P0 Gaps (Must Fix)

- Ensure the generated outline explicitly preserves the safety-critical flow controls present in the oracle:
  - "MANDATORY FIRST STEPS" (run exploration before multi-role divergence)
  - Context overflow protection (per-role/output limits + recovery steps)
- Ensure evidence tables remain deterministic and verifiable (no placeholders; literal TS anchors).

## P1 Gaps (Should Fix)

- Add (or keep) explicit section coverage for:
  - Output Structure (how `brainstorm.md` is organized)
  - Configuration details (dimensions, role selection, collaboration patterns)
  - Best Practices and Usage Recommendations (requires user confirmation)

## P2 Gaps (Optional)

- Add a short “comparison matrix” for creative vs structured mode and continue vs new session.

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
| `.claude/commands/workflow/brainstorm-with-file.md` | Existing | docs: `.claude/commands/workflow/brainstorm-with-file.md` / `MANDATORY FIRST STEPS` ; ts: `ccw/src/core/routes/commands-routes.ts` / `function scanCommandsRecursive(` | `Test-Path .claude/commands/workflow/brainstorm-with-file.md` | oracle doc used to validate outline completeness |
| `.workflow/.brainstorm/<session-id>/` | Planned | docs: `.claude/commands/workflow/brainstorm-with-file.md` / `Quick Start` ; ts: `ccw/src/core/routes/commands-routes.ts` / `scanCommandsRecursive(projectDir, projectDir, 'project', projectPath);` | `Test-Path .workflow` | planned session root for artifacts |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/workflow/plan.md` / `Coordinator Role` ; ts: `ccw/src/core/routes/commands-routes.ts` / `function scanCommandsRecursive(` | `Test-Path ccw/src/core/routes/commands-routes.ts` | command list scanning and grouping support |
| `ccw/src/core/routes/cli-routes.ts` | Existing | docs: `.claude/commands/workflow/multi-cli-plan.md` / `Core Responsibilities` ; ts: `ccw/src/core/routes/cli-routes.ts` / `type: 'CLI_EXECUTION_STARTED',` | `Test-Path ccw/src/core/routes/cli-routes.ts` | multi-CLI execution infrastructure (streaming) |
| `ccw/src/tools/cli-executor-core.ts` | Existing | docs: `.claude/commands/workflow/brainstorm-with-file.md` / `Implementation` ; ts: `ccw/src/tools/cli-executor-core.ts` / `async function executeCliTool(` | `Test-Path ccw/src/tools/cli-executor-core.ts` | execution primitive used by server routes |

Notes:
- Evidence format: `docs: <file> / <section heading> ; ts: <file> / <literal anchor>`

## Implementation Hints (Tooling/Server)

- CCW discovers project/user commands by scanning the commands folders (server route reads markdown frontmatter and groups commands).
- CLI execution is exposed through the server (route emits `CLI_EXECUTION_STARTED` events and streams parsed output); reuse this when the workflow needs multi-CLI collaboration.

## Proposed Fix Plan (Minimal)

- Align the generated slash outline headings with the oracle’s safety-critical sections (MANDATORY FIRST STEPS + overflow protection).
- Keep artifact paths stable under `.workflow/.brainstorm/<session-id>/` and document the exact files written.
- Re-run deterministic evidence verification on both markdown outputs.
