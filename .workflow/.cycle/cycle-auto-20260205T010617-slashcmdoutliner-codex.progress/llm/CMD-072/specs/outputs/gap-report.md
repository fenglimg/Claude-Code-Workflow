# Gap Report: workflow:imitate-auto

## Reference

- Selected reference: /workflow:ui-design:imitate-auto (`.claude/commands/workflow/ui-design/imitate-auto.md`)

## P0 Gaps (Must Fix)

- Integration command name mismatch risk: `imitate-auto.md` references `/workflow:ui-design:update` in Integration Points, but the repo command doc present is `.claude/commands/workflow/ui-design/design-sync.md` (name: `design-sync`). Align the orchestrator to call the existing command (or document/create an explicit alias) to avoid pointing at a non-existent command doc.
- Evidence gate coverage: ensure every key pointer mentioned in the outline is represented in the evidence table with both docs + TS anchors.

## P1 Gaps (Should Fix)

- Output artifacts precision: outline lists directory-level outputs; reference doc also calls out `compare.html` preview and example completion message. If implementing from the outline, copy the preview + directory structure expectations into the execution steps.
- Legacy flag behavior: keep the exact deprecation warning + normalization semantics consistent with the reference (legacy `--images/--prompt` should not silently change behavior).

## P2 Gaps (Optional)

- Add a short “Recovery strategies” checklist per phase (already present in the reference doc) to make failure handling more deterministic.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/ui-design/imitate-auto.md` | Existing | docs: .claude/commands/workflow/ui-design/imitate-auto.md / Overview ; ts: ccw/src/core/routes/commands-routes.ts / function scanCommandsRecursive( | `Test-Path .claude/commands/workflow/ui-design/imitate-auto.md` | Oracle behavior + phase model |
| `.claude/commands/workflow/ui-design/import-from-code.md` | Existing | docs: .claude/commands/workflow/ui-design/import-from-code.md / Overview ; ts: ccw/src/core/routes/commands-routes.ts / const group = getCommandGroup(commandName, relativePath, location, projectPath); | `Test-Path .claude/commands/workflow/ui-design/import-from-code.md` | Phase 0.5 conditional code import |
| `.claude/commands/workflow/ui-design/style-extract.md` | Existing | docs: .claude/commands/workflow/ui-design/style-extract.md / Overview ; ts: ccw/src/core/routes/commands-routes.ts / function scanCommandsRecursive( | `Test-Path .claude/commands/workflow/ui-design/style-extract.md` | Phase 2 style extraction |
| `.claude/commands/workflow/ui-design/animation-extract.md` | Existing | docs: .claude/commands/workflow/ui-design/animation-extract.md / Overview ; ts: ccw/src/core/routes/commands-routes.ts / function scanCommandsRecursive( | `Test-Path .claude/commands/workflow/ui-design/animation-extract.md` | Phase 2.3 animation extraction |
| `.claude/commands/workflow/ui-design/layout-extract.md` | Existing | docs: .claude/commands/workflow/ui-design/layout-extract.md / Overview ; ts: ccw/src/core/routes/commands-routes.ts / function scanCommandsRecursive( | `Test-Path .claude/commands/workflow/ui-design/layout-extract.md` | Phase 2.5 layout extraction |
| `.claude/commands/workflow/ui-design/generate.md` | Existing | docs: .claude/commands/workflow/ui-design/generate.md / Overview ; ts: ccw/src/core/routes/commands-routes.ts / function scanCommandsRecursive( | `Test-Path .claude/commands/workflow/ui-design/generate.md` | Phase 3 assembly + preview |
| `.claude/commands/workflow/ui-design/design-sync.md` | Existing | docs: .claude/commands/workflow/ui-design/design-sync.md / Overview ; ts: ccw/src/core/routes/commands-routes.ts / function scanCommandsRecursive( | `Test-Path .claude/commands/workflow/ui-design/design-sync.md` | Existing session sync command doc (reference-only updates) |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: .claude/commands/workflow/ui-design/imitate-auto.md / Integration Points ; ts: ccw/src/core/routes/commands-routes.ts / return join(projectPath, '.claude', 'commands'); | `Test-Path ccw/src/core/routes/commands-routes.ts` | Recursively scans `.claude/commands/**` so nested `workflow/ui-design/*` is discoverable |
| `ccw/src/tools/command-registry.ts` | Existing | docs: .claude/commands/workflow/plan.md / Execution Process ; ts: ccw/src/tools/command-registry.ts / const relativePath = join('.claude', 'commands', 'workflow'); | `Test-Path ccw/src/tools/command-registry.ts` | Workflow-only command helper; non-recursive (won’t see ui-design subfolder) |

## Implementation Hints (Tooling/Server)

- `ccw/src/core/routes/commands-routes.ts` scans `.claude/commands` recursively and infers grouping from relative path directories, which is compatible with nested ui-design commands.
- `ccw/src/tools/command-registry.ts` is limited to `.claude/commands/workflow` and does not traverse subdirectories; avoid using it as the source of truth for nested `workflow/*/*` command discovery.

## Proposed Fix Plan (Minimal)

- Update the orchestrator’s Phase 4 integration pointer to call the existing session sync command (`design-sync`) or create a documented alias for `update`.
- Keep the phase sequence and attach→execute→collapse semantics identical to the oracle doc; add explicit “continue immediately” checks between phases.
- Add concrete output verification (e.g., confirm `prototypes/compare.html` exists) after Phase 3.
