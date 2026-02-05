# Fix Plan: workflow:lite-plan

## Minimal Fix List

1) [docs] Add a file-input example to the slash outline (demonstrate `<file.md>` mode).
   - Verify: confirm `.claude/commands/workflow/lite-plan.md` already documents file input under `Usage`/`Arguments`; keep outline consistent.

2) [docs] Add a “planning only (no code execution)” safety note in the slash outline’s Execution Process section.
   - Verify: ensure the note does not change intended behavior; it should only constrain agent behavior in Phase 1-3.

3) [tooling/ccw] Verify lite-plan artifact filenames are fully supported by session tooling; if any are missing, add mappings.
   - Verify: `rg \"explorations-manifest\\.json\" ccw/src/commands/session-path-resolver.ts`
   - Verify: `rg \"execution-context\\.json\" ccw/src/commands/session-path-resolver.ts`
   - Verify: `rg \"planning-context\" ccw/src/commands/session-path-resolver.ts`

4) [tooling/ccw] Verify lite-plan base directory constant matches documented output location; if docs diverge, align docs to `.workflow/.lite-plan`.
   - Verify: `rg \"const LITE_PLAN_BASE = '\\.workflow/\\.lite-plan'\" ccw/src/tools/session-manager.ts`
   - Verify: confirm `.claude/commands/workflow/lite-plan.md` `Output Artifacts` and `Output Location` sections describe `.workflow/.lite-plan/...`.

