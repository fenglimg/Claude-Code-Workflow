# Gap Report: issue:convert-to-plan

## Reference

- Selected reference: /issue:from-brainstorm (`.claude/commands/issue/from-brainstorm.md`)

## P0 Gaps (Must Fix)

- Supplement semantics: explicitly define how `--supplement` updates an existing solution without creating duplicate IDs (in-place update vs create-new-and-rebind).
- Persistence path: ensure the implementation consistently uses the issue CLI for creation/binding, and only falls back to direct JSONL edits when there is no CLI support (document the exception clearly).

## P1 Gaps (Should Fix)

- Add concrete CLI call sequence per mode (create issue vs existing issue) so the implementation stays aligned with the Core Data Access Principle.
- Tighten source detection/validation (directory vs file path; WFS id vs folder path; required file presence checks) with clear error messages.

## P2 Gaps (Optional)

- Add a small, deterministic fallback for markdown extraction failures (e.g., ask user to confirm/trim inputs, then retry once).

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/issue/convert-to-plan.md` | Existing | docs: `.claude/commands/issue/convert-to-plan.md` / Overview ; ts: `ccw/src/core/routes/commands-routes.ts` / function scanCommandsRecursive( | `Test-Path .claude/commands/issue/convert-to-plan.md; rg \"function scanCommandsRecursive\" ccw/src/core/routes/commands-routes.ts` | primary command doc and command discovery |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/issue/convert-to-plan.md` / Overview ; ts: `ccw/src/core/routes/commands-routes.ts` / function scanCommandsRecursive( | `Test-Path ccw/src/core/routes/commands-routes.ts; rg \"function scanCommandsRecursive\" ccw/src/core/routes/commands-routes.ts` | command listing surface used by CCW UI/server |
| `ccw/src/commands/issue.ts` | Existing | docs: `.claude/commands/issue/convert-to-plan.md` / Core Data Access Principle ; ts: `ccw/src/commands/issue.ts` / async function bindAction( | `Test-Path ccw/src/commands/issue.ts; rg \"async function bindAction\" ccw/src/commands/issue.ts` | authoritative CLI for issue/solution ops |
| `ccw/src/core/routes/issue-routes.ts` | Existing | docs: `.claude/commands/issue/convert-to-plan.md` / Core Data Access Principle ; ts: `ccw/src/core/routes/issue-routes.ts` / function bindSolutionToIssue( | `Test-Path ccw/src/core/routes/issue-routes.ts; rg \"function bindSolutionToIssue\" ccw/src/core/routes/issue-routes.ts` | binding behavior + side effects |
| `.claude/workflows/cli-templates/schemas/solution-schema.json` | Existing | docs: `.claude/commands/issue/convert-to-plan.md` / Solution Schema Reference ; ts: `ccw/src/commands/issue.ts` / bound_solution_id | `Test-Path .claude/workflows/cli-templates/schemas/solution-schema.json; rg \"bound_solution_id\" ccw/src/commands/issue.ts` | source-of-truth schema shape for normalized output |
| `.workflow/issues/solutions` | Planned | docs: `.claude/commands/issue/convert-to-plan.md` / Phase 6: Confirm & Persist ; ts: `ccw/src/commands/issue.ts` / .workflow/issues/solutions | `Test-Path .workflow/issues/solutions; rg \"\\.workflow/issues/solutions\" ccw/src/commands/issue.ts` | runtime directory created on demand |
| `.workflow/issues/solutions/<issue-id>.jsonl` | Planned | docs: `.claude/commands/issue/convert-to-plan.md` / Phase 5: Generate Solution ; ts: `ccw/src/commands/issue.ts` / export function writeSolutions( | `rg \"export function writeSolutions\" ccw/src/commands/issue.ts` | persisted solutions per issue (CLI-backed) |

## Implementation Hints (Tooling/Server)

- Prefer the issue CLI for creation and binding:
  - create/init issue: `ccw issue init ...`
  - create solution: `ccw issue solution <issue-id> --data '<json>' --json`
  - bind: `ccw issue bind <issue-id> <solution-id>`
  - status: `ccw issue status <issue-id> --json`
- For supplement, if no CLI update exists, plan for a single-file rewrite of `.workflow/issues/solutions/<issue-id>.jsonl` with strict ID preservation and immediate validation by re-reading via `ccw issue solution ...`.

## Proposed Fix Plan (Minimal)

See `fix-plan.md`.

