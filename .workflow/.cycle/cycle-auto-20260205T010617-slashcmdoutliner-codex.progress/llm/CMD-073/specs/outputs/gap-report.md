# Gap Report: workflow:ui-design:import-from-code

## Reference

- Selected reference: /workflow:ui-design:import-from-code (`.claude/commands/workflow/ui-design/import-from-code.md`)

## P0 Gaps (Must Fix)

- None identified for the outline skeleton itself (core sections + evidence table present). Validate via `verify-evidence.js`.

## P1 Gaps (Should Fix)

- Frontmatter naming consistency: reference doc uses `name: workflow:ui-design:import-from-code` but usage is `/workflow:ui-design:import-from-code`. Decide and normalize to avoid confusing tooling/users.
- Output path specificity: confirm final locations for each agent's `completeness-report.json` (style/animation/layout) and keep them consistent with the token/template outputs.
- Parallel Task resilience: define minimal behavior when one agent fails (what gets reported, and whether to continue other agents).

## P2 Gaps (Optional)

- Add explicit best-practices checklist for choosing `--source` and for interpreting completeness reports.
- Add a short “what to do next” section that links to related ui-design commands.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/ui-design/import-from-code.md` | Existing | docs: `.claude/commands/workflow/ui-design/import-from-code.md / Overview` ; ts: `ccw/src/core/routes/commands-routes.ts / return join(projectPath, '.claude', 'commands');` | `Test-Path .claude/commands/workflow/ui-design/import-from-code.md` | Oracle doc + command contract |
| `ccw/src/tools/discover-design-files.ts` | Existing | docs: `.claude/commands/workflow/ui-design/import-from-code.md / Step 1: Setup & File Discovery` ; ts: `ccw/src/tools/discover-design-files.ts / name: 'discover_design_files',` | `Test-Path ccw/src/tools/discover-design-files.ts` | Tool invoked for automatic file discovery |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/workflow/ui-design/import-from-code.md / Execution Process` ; ts: `ccw/src/core/routes/commands-routes.ts / function scanCommandsRecursive(` | `Test-Path ccw/src/core/routes/commands-routes.ts` | Commands scanning/grouping patterns (nested dirs supported) |

## Implementation Hints (Tooling/Server)

- Prefer the existing CCW tool entry `discover_design_files` for discovery instead of re-implementing ad-hoc `find` logic.
- Keep discovery output as a single JSON manifest (`discovered-files.json`) so all agents share the same file list and counts.

## Proposed Fix Plan (Minimal)

1) Docs: normalize frontmatter `name` to match invocation (`ui-design:import-from-code`) and keep examples consistent.
2) Runtime: define and document exact output paths for the 3 `completeness-report.json` files.
3) Execution: run discovery first; then launch 3 `Task`s in parallel; each task must write its own outputs and report status.
4) Validation: add post-run checks for required artifacts; if one task fails, report partial success with clear next actions.
