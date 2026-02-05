# Gap Report: workflow:workflow:ui-design:codify-style

## Reference

- Selected reference: /workflow:ui-design:codify-style (`.claude/commands/workflow/ui-design/codify-style.md`)

## P0 Gaps (Must Fix)

- None identified for the outline scaffolding (core sections present + evidence table included).

## P1 Gaps (Should Fix)

- Command identity consistency: oracle doc usage strings show `/workflow:ui-design:codify-style`, while the frontmatter-derived slash format for this cycle spec is `/workflow:workflow:ui-design:codify-style`. Verify how the runtime resolves nested command paths vs `name:` frontmatter, and align the outline/usage accordingly.
- Cross-platform Bash assumptions: the orchestrator uses `mkdir -p`, `rm -rf`, `date`, and optional `jq`; confirm availability in the target execution environment and document prerequisites/recovery.

## P2 Gaps (Optional)

- Expand quick verification reporting (component count, absolute paths) into a small, stable checklist to reduce operator uncertainty.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/ui-design/codify-style.md` | Existing | docs: .claude/commands/workflow/ui-design/codify-style.md / Overview & Execution Model ; ts: ccw/src/core/routes/commands-routes.ts / function scanCommandsRecursive( | `Test-Path .claude/commands/workflow/ui-design/codify-style.md` | Primary orchestrator doc; defines 4-phase flow and delegate calls |
| `.claude/commands/workflow/ui-design/import-from-code.md` | Existing | docs: .claude/commands/workflow/ui-design/import-from-code.md / Execution Process ; ts: ccw/src/core/routes/commands-routes.ts / function scanCommandsRecursive( | `Test-Path .claude/commands/workflow/ui-design/import-from-code.md` | Delegate for extraction outputs consumed by Phase 2 |
| `.claude/commands/workflow/ui-design/reference-page-generator.md` | Existing | docs: .claude/commands/workflow/ui-design/reference-page-generator.md / Execution Process ; ts: ccw/src/core/routes/commands-routes.ts / function scanCommandsRecursive( | `Test-Path .claude/commands/workflow/ui-design/reference-page-generator.md` | Delegate for reference package + preview generation |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: .claude/commands/workflow/ui-design/codify-style.md / Architecture ; ts: ccw/src/core/routes/commands-routes.ts / function scanCommandsRecursive( | `Test-Path ccw/src/core/routes/commands-routes.ts; rg \"function scanCommandsRecursive\\(\" ccw/src/core/routes/commands-routes.ts` | Confirms how commands are discovered and grouped in CCW tooling/server |

## Implementation Hints (Tooling/Server)

- Command discovery/grouping is implemented in `ccw/src/core/routes/commands-routes.ts` (recursive scan + group inference). This impacts how nested `.claude/commands/workflow/ui-design/*.md` commands are surfaced and may explain the frontmatter vs invocation mismatch.

## Proposed Fix Plan (Minimal)

1. Verify command resolution: confirm whether invocation is derived from relative path (e.g. `workflow/ui-design/codify-style.md`) or from `name:` frontmatter, then update usage strings to a single canonical form.
2. Add a short prerequisites note for Bash utilities used (`rm`, `mkdir`, `date`, optional `jq`), with fallback behavior when missing.

