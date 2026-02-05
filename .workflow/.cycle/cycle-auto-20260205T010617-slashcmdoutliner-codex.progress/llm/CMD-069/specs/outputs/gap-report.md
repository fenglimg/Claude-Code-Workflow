# Gap Report: workflow:design-sync

## Reference

- Selected reference: `style-extract` (`.claude/commands/workflow/ui-design/style-extract.md`)

## P0 Gaps (Must Fix)

- Add an explicit `## Usage` section to `.claude/commands/workflow/ui-design/design-sync.md` so the doc meets the corpus P0 core-sections gate (Overview + Usage + Execution Process + Output/Artifacts + Error Handling).

## P1 Gaps (Should Fix)

- Consider adding/aligning an explicit `## Outputs / Artifacts` section (can keep `## Output Structure`, but add a short bullet list of Reads/Writes for quick scanning).
- Validate command discovery consistency across CCW tooling:
  - CCW UI/API route scanning is recursive (`scanCommandsRecursive`), but `CommandRegistry` may not include nested subfolders under `.claude/commands/workflow/`.

## P2 Gaps (Optional)

- Add a short example section showing default prototype selection vs `--selected-prototypes` filtering.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/ui-design/design-sync.md` | Existing | docs: `.claude/commands/workflow/ui-design/design-sync.md` / `Design Sync Command` ; ts: `ccw/src/core/routes/commands-routes.ts` / `return join(projectPath, '.claude', 'commands');` | `Test-Path .claude/commands/workflow/ui-design/design-sync.md` | primary command doc to update (Usage + quick Outputs/Artifacts summary) |
| `.claude/commands/workflow/ui-design/style-extract.md` | Existing | docs: `.claude/commands/workflow/ui-design/style-extract.md` / `Style Extraction Command` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path .claude/commands/workflow/ui-design/style-extract.md` | reference for multi-phase structure + output layout conventions |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/workflow/ui-design/design-sync.md` / `Overview` ; ts: `ccw/src/core/routes/commands-routes.ts` / `function scanCommandsRecursive(` | `Test-Path ccw/src/core/routes/commands-routes.ts; rg "scanCommandsRecursive" ccw/src/core/routes/commands-routes.ts` | CCW command discovery supports nested command docs (e.g., ui-design/) |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `Available Commands` ; ts: `ccw/src/tools/command-registry.ts` / `export class CommandRegistry {` | `Test-Path ccw/src/tools/command-registry.ts; rg "export class CommandRegistry" ccw/src/tools/command-registry.ts` | potential mismatch: registry scans workflow root; confirm nested command visibility |
| `.workflow/active/WFS-{session}/.process/context-package.json` | Planned | docs: `.claude/commands/workflow/ui-design/design-sync.md` / `Phase 5: Update Context Package` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path ".workflow/active/WFS-<session>/.process/context-package.json"` | design references should be written into a stable context package for later tools |

## Implementation Hints (Tooling/Server)

- Prefer reference-only updates: generate `@../...` / `@../../...` links; do not load design file contents.
- Keep writes session-scoped under `.workflow/active/WFS-{session}/`.

## Proposed Fix Plan (Minimal)

See `fix-plan.md` for the concrete checklist and verify commands.

