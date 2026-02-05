# Gap Report: workflow:tools:tdd-coverage-analysis

## Reference

- Selected reference: /workflow:tools:code-validation-gate (`.claude/commands/workflow/tools/code-validation-gate.md`)

## P0 Gaps (Must Fix)

- None identified against CCW P0 gates (frontmatter + core sections + artifact references + evidence discipline).

## P1 Gaps (Should Fix)

- Add an explicit note about how `test-results.json` is normalized when the underlying framework cannot emit JSON (store wrapper with stdout/stderr + metadata).
- Clarify the “continue on partial data” contract (coverage-only vs cycle-only vs full report) to reduce brittle failures.

## P2 Gaps (Optional)

- Add lightweight heuristics for mapping TEST tasks to specific test commands (e.g., prefer `npm test` when `package.json` exists even if no known framework keyword is found).
- Add a brief “cross-platform” note: prefer PowerShell-friendly equivalents when presenting verify commands (the command itself can stay Bash-based).

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
| `.claude/commands/workflow/tools/tdd-coverage-analysis.md` | Existing | docs: `.claude/commands/workflow/tools/tdd-coverage-analysis.md` / `Overview` ; ts: `ccw/src/tools/session-manager.ts` / `.workflow/active` | `Test-Path .claude/commands/workflow/tools/tdd-coverage-analysis.md` | Canonical behavior + artifact contract for this tool command |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/tools/tdd-coverage-analysis.md` / `Output Files` ; ts: `ccw/src/tools/session-manager.ts` / `ACTIVE_BASE` | `Test-Path ccw/src/tools/session-manager.ts` | Defines session storage roots and routing for `.process/` artifacts |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/workflow/tools/code-validation-gate.md` / `Overview` ; ts: `ccw/src/core/routes/commands-routes.ts` / `getCommandsDir` | `Test-Path ccw/src/core/routes/commands-routes.ts` | Command corpus discovery/management for `.claude/commands/**` |

## Implementation Hints (Tooling/Server)

- Session storage conventions (`.workflow/active/<id>/.process/`) are standardized in `ccw/src/tools/session-manager.ts`; keep artifacts aligned to avoid breaking downstream commands (e.g., `/workflow:tdd-verify`).
- Command docs are managed by the Commands routes; avoid assuming only flat `.claude/commands/workflow/*.md` layouts.

## Proposed Fix Plan (Minimal)

1. In the command doc, clarify the normalization strategy for `test-results.json` when native JSON output is unavailable (P1).
2. In the command doc, document partial-success behavior (coverage-only vs cycle-only) and ensure the report always emits actionable next steps (P1).

