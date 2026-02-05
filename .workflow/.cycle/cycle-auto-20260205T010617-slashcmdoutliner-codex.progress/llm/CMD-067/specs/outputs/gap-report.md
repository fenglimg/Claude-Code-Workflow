# Gap Report: workflow:animation-extract

## Reference

- Selected reference: /workflow:layout-extract (`.claude/commands/workflow/ui-design/layout-extract.md`)

## P0 Gaps (Must Fix)

- None identified for the outline: core sections + frontmatter + evidence table are present and verifiable.

## P1 Gaps (Should Fix)

- Confirm runtime/tooling discovery expectations for nested command docs under `.claude/commands/workflow/**`:
  - Some tooling (e.g. `CommandRegistry`) targets `.claude/commands/workflow/*.md` only; ui-design docs live under a subdirectory.
  - If “list/get command metadata” must cover ui-design commands, plan a recursive scan or a broader commands root.
- Clarify overwrite semantics for existing `{base_path}/animation-extraction/animation-tokens.json`:
  - Ensure behavior is consistent across `--yes`, `--interactive`, and `--refine` combinations.

## P2 Gaps (Optional)

- Add lightweight JSON schema validation for `animation-tokens.json` (top-level keys + token shapes) to catch partial/invalid generations early.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/ui-design/animation-extract.md` | Existing | docs: `.claude/commands/workflow/ui-design/animation-extract.md` / `Animation Extraction Command` ; ts: `ccw/src/commands/install.ts` / `scanDisabledCommandsRecursive(commandsDir, commandsDir, result.commands)` | `Test-Path .claude/commands/workflow/ui-design/animation-extract.md` | Oracle command doc |
| `.claude/commands/workflow/ui-design/layout-extract.md` | Existing | docs: `.claude/commands/workflow/ui-design/layout-extract.md` / `Layout Extraction Command` ; ts: `ccw/src/commands/install.ts` / `scanDisabledCommandsRecursive(commandsDir, commandsDir, result.commands)` | `Test-Path .claude/commands/workflow/ui-design/layout-extract.md` | Reference sibling pipeline |
| `.claude/commands/workflow/ui-design/style-extract.md` | Existing | docs: `.claude/commands/workflow/ui-design/style-extract.md` / `Style Extraction Command` ; ts: `ccw/src/commands/install.ts` / `scanDisabledCommandsRecursive(commandsDir, commandsDir, result.commands)` | `Test-Path .claude/commands/workflow/ui-design/style-extract.md` | Reference for artifact verification |
| `.claude/commands/workflow/ui-design/imitate-auto.md` | Existing | docs: `.claude/commands/workflow/ui-design/imitate-auto.md` / `UI Design Imitate-Auto Workflow Command` ; ts: `ccw/src/commands/install.ts` / `scanDisabledCommandsRecursive(commandsDir, commandsDir, result.commands)` | `Test-Path .claude/commands/workflow/ui-design/imitate-auto.md` | Orchestration reference |
| `ccw/src/commands/install.ts` | Existing | docs: `.claude/commands/workflow/ui-design/animation-extract.md` / `Execution Process` ; ts: `ccw/src/commands/install.ts` / `scanDisabledCommandsRecursive(commandsDir, commandsDir, result.commands)` | `Test-Path ccw/src/commands/install.ts` | Tooling corpus anchor (repo command scanning recursion) |
| `{base_path}/.intermediates/animation-analysis/image-references.json` | Planned | docs: `.claude/commands/workflow/ui-design/animation-extract.md` / `Phase 0: Setup & Input Validation` ; ts: `ccw/src/commands/install.ts` / `scanDisabledCommandsRecursive(commandsDir, commandsDir, result.commands)` | `Test-Path \"{base_path}/.intermediates/animation-analysis/image-references.json\"` | Prepared image metadata |
| `{base_path}/.intermediates/animation-analysis/analysis-options.json` | Planned | docs: `.claude/commands/workflow/ui-design/animation-extract.md` / `Phase 1: Animation Specification Generation` ; ts: `ccw/src/commands/install.ts` / `scanDisabledCommandsRecursive(commandsDir, commandsDir, result.commands)` | `Test-Path \"{base_path}/.intermediates/animation-analysis/analysis-options.json\"` | Explore-mode options (+ user_selection) |
| `{base_path}/.intermediates/animation-analysis/refinement-options.json` | Planned | docs: `.claude/commands/workflow/ui-design/animation-extract.md` / `Phase 1: Animation Specification Generation` ; ts: `ccw/src/commands/install.ts` / `scanDisabledCommandsRecursive(commandsDir, commandsDir, result.commands)` | `Test-Path \"{base_path}/.intermediates/animation-analysis/refinement-options.json\"` | Refine-mode options (+ selection) |
| `{base_path}/animation-extraction/animation-tokens.json` | Planned | docs: `.claude/commands/workflow/ui-design/animation-extract.md` / `animation-tokens.json Format` ; ts: `ccw/src/commands/install.ts` / `scanDisabledCommandsRecursive(commandsDir, commandsDir, result.commands)` | `Test-Path \"{base_path}/animation-extraction/animation-tokens.json\"` | Final tokens output |

## Implementation Hints (Tooling/Server)

- Repo command corpus scripts and install tooling already assume recursive `.claude/commands/**` scanning; align any new “command list/get” feature with that expectation if ui-design commands must be discoverable.

## Proposed Fix Plan (Minimal)

- See `fix-plan.md` for a concrete, low-risk sequence (verify → update discovery if needed → add tests → re-run evidence gate).

