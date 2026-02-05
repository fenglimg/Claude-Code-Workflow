# Gap Report: workflow:review

## Reference

- Selected reference: /workflow:review (`.claude/commands/workflow/review.md`)

## P0 Gaps (Must Fix)

- Missing CCW-required frontmatter in the existing oracle doc
  - `.claude/commands/workflow/review.md` has `name/description/argument-hint` but no `allowed-tools` (and no `group`), which breaks the P0 frontmatter/allowed-tools gates and reduces compatibility with `ccw/src/tools/command-registry.ts`.
- Broken redirect target
  - `.claude/commands/workflow/review.md` references `/workflow:tools:docs`, but there is no `.claude/commands/workflow/tools/docs.md` in the repo right now.

## P1 Gaps (Should Fix)

- Cross-platform execution template clarity
  - The reference doc's execution template is bash-oriented; consider adding a short PowerShell variant or a note when running on Windows.

## P2 Gaps (Optional)

- Align terminology with the newer review-cycle family
  - Optionally harmonize report naming/location with `.review/` conventions used by `review-*-cycle` commands, if you want review results to be consumed by `/workflow:review-cycle-fix`.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/review.md` | Existing | docs: `.claude/commands/workflow/review.md` / `Command Overview: /workflow:review` ; ts: `ccw/src/tools/command-registry.ts` / `commandName.startsWith('/workflow:')` | `Test-Path .claude/commands/workflow/review.md` | Update frontmatter to include `allowed-tools` + `group` |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/review.md` / `Review Types` ; ts: `ccw/src/tools/command-registry.ts` / `commandName.startsWith('/workflow:')` | `Test-Path ccw/src/tools/command-registry.ts` | Consumer of command frontmatter (`allowed-tools`, `group`) |
| `.claude/commands/workflow/tools/docs.md` | Planned | docs: `.claude/commands/workflow/review.md` / `Execution Process` ; ts: `ccw/src/tools/command-registry.ts` / `commandName.startsWith('/workflow:')` | `Test-Path .claude/commands/workflow/tools/docs.md` | Either create this command doc or remove/replace the redirect reference |
| `ccw/src/commands/cli.ts` | Existing | docs: `.claude/commands/workflow/review.md` / `Execution Template` ; ts: `ccw/src/commands/cli.ts` / `ccw cli -p "<prompt>" --tool <tool>` | `Test-Path ccw/src/commands/cli.ts` | Ensures `ccw cli` usage in templates is grounded in actual CLI surface |

## Implementation Hints (Tooling/Server)

- Command discovery/parsing is implemented in `ccw/src/tools/command-registry.ts` and expects `allowed-tools` to be present and comma-splittable.
- If you add `/workflow:tools:docs`, it should live under `.claude/commands/workflow/tools/docs.md` so it can be found by the workflow command registry.

## Proposed Fix Plan (Minimal)

See `fix-plan.md`.
