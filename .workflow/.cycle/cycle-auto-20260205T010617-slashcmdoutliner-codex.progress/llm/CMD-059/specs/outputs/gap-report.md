# Gap Report: workflow:tools:conflict-resolution

## Reference

- Selected reference: /workflow:tools:conflict-resolution (`.claude/commands/workflow/tools/conflict-resolution.md`)

## P0 Gaps (Must Fix)

- Missing frontmatter `allowed-tools` in the oracle command doc (`.claude/commands/workflow/tools/conflict-resolution.md`).
- Evidence-based implementation pointers are not explicitly documented as `Existing` vs `Planned` with dual-source anchors (docs + TS).

## P1 Gaps (Should Fix)

- Make the output paths explicit as repo-relative session artifacts (especially `conflict-resolution.json` and any context-package updates) and ensure they are described as writes/updates.
- Clarify a deterministic fallback chain when Gemini/Qwen analysis fails and when to stop the loop.

## P2 Gaps (Optional)

- Add a short "Quick Start" section and a minimal JSON schema snippet for `conflict-resolution.json`.

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
| `.claude/commands/workflow/tools/conflict-resolution.md` | Existing | docs: `.claude/commands/workflow/tools/conflict-resolution.md` / `Conflict Resolution Command` ; ts: `ccw/src/tools/cli-executor-core.ts` / `const BUILTIN_CLI_TOOLS = ['gemini', 'qwen', 'codex', 'opencode', 'claude'] as const` | `Test-Path .claude/commands/workflow/tools/conflict-resolution.md` | Source-of-truth command doc; update frontmatter to satisfy P0 gates |
| `ccw/src/tools/cli-executor-core.ts` | Existing | docs: `.claude/commands/workflow/tools/conflict-resolution.md` / `Execution Flow` ; ts: `ccw/src/tools/cli-executor-core.ts` / `const BUILTIN_CLI_TOOLS = ['gemini', 'qwen', 'codex', 'opencode', 'claude'] as const` | `Test-Path ccw/src/tools/cli-executor-core.ts; rg "BUILTIN_CLI_TOOLS = \\['gemini', 'qwen'" ccw/src/tools/cli-executor-core.ts` | Provides built-in Gemini/Qwen CLI support used by conflict analysis |
| `ccw/src/core/routes/cli-routes.ts` | Existing | docs: `.claude/commands/workflow/tools/conflict-resolution.md` / `Integration` ; ts: `ccw/src/core/routes/cli-routes.ts` / `const configMatch = pathname.match(/^\/api\/cli\/config\/(gemini|qwen|codex|claude|opencode)$/)` | `Test-Path ccw/src/core/routes/cli-routes.ts; rg "configMatch = pathname.match" ccw/src/core/routes/cli-routes.ts` | Establishes CLI config routing/integration points referenced by CLI execution workflows |

## Implementation Hints (Tooling/Server)

- Prefer the unified CLI executor surface when invoking Gemini/Qwen so tool selection and streaming output behave consistently.
- Keep conflict analysis output machine-readable; treat it as an intermediate that drives the user interaction loop and final JSON artifact.

## Proposed Fix Plan (Minimal)

- Docs: add `allowed-tools: Task(*), AskUserQuestion(*), Read(*), Write(*)` to `.claude/commands/workflow/tools/conflict-resolution.md` frontmatter.
- Docs: add/confirm explicit Writes/Reads lists with repo-relative `.workflow/active/<session>/.process/...` paths.
- Validation: run the evidence gate on the updated command doc (and this outline) to prevent unverifiable `Existing` claims.
