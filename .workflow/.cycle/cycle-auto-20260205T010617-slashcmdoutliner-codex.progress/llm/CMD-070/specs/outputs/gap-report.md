# Gap Report: workflow:explore-auto

## Reference

- Selected reference: `imitate-auto` (`.claude/commands/workflow/ui-design/imitate-auto.md`)

## P0 Gaps (Must Fix)

- Add explicit `## Usage` and `## Error Handling` sections to `.claude/commands/workflow/ui-design/explore-auto.md` (quality-gates core sections: Overview + Usage + Execution Process + Output/Artifacts + Error Handling).
- Add a short `## Outputs / Artifacts` summary section (or rename/alias `## Completion Output`) so artifact references are discoverable without scanning the full 10-phase body.

## P1 Gaps (Should Fix)

- Align explore-auto with imitate-auto's structure for early phases:
  - parameter parsing, base-path resolution, and TodoWrite initialization ordering (keep Phase 5 as the only interaction point).
- Clarify command discovery expectations for nested ui-design commands:
  - CCW routes scan recursively, but `CommandRegistry` reads only top-level workflow docs; ensure user-facing command lists include ui-design subfolder commands.

## P2 Gaps (Optional)

- Add one minimal \"happy path\" example and one \"session mode\" example to explore-auto for quick onboarding.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/ui-design/explore-auto.md` | Existing | docs: `.claude/commands/workflow/ui-design/explore-auto.md` / `UI Design Auto Workflow Command` ; ts: `ccw/src/core/routes/commands-routes.ts` / `function scanCommandsRecursive(` | `Test-Path .claude/commands/workflow/ui-design/explore-auto.md` | primary doc to update with missing core sections |
| `.claude/commands/workflow/ui-design/imitate-auto.md` | Existing | docs: `.claude/commands/workflow/ui-design/imitate-auto.md` / `UI Design Imitate-Auto Workflow Command` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path .claude/commands/workflow/ui-design/imitate-auto.md` | reference structure for orchestrator ordering + session artifact layout |
| `.claude/commands/workflow/ui-design/generate.md` | Existing | docs: `.claude/commands/workflow/ui-design/generate.md` / `Phase 3: Generate Preview Files` ; ts: `ccw/src/tools/ui-generate-preview.js` / `Generate compare.html and index.html for UI prototypes` | `Test-Path .claude/commands/workflow/ui-design/generate.md` | ensures explore-auto completion output matches actual preview artifacts |
| `ccw/src/tools/ui-generate-preview.js` | Existing | docs: `.claude/commands/workflow/ui-design/explore-auto.md` / `Completion Output` ; ts: `ccw/src/tools/ui-generate-preview.js` / `writeFileSync(resolve(targetPath, 'compare.html'), compareHtml, 'utf8');` | `Test-Path ccw/src/tools/ui-generate-preview.js; rg "writeFileSync\\(resolve\\(targetPath, 'compare\\.html'\\)" ccw/src/tools/ui-generate-preview.js` | grounds compare.html/PREVIEW.md behavior in repo tooling |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/ui-design/explore-auto.md` / `Parameter Requirements` ; ts: `ccw/src/tools/command-registry.ts` / `const normalized = commandName.startsWith('/workflow:')` | `Test-Path ccw/src/tools/command-registry.ts; rg "const normalized = commandName\\.startsWith\\('/workflow:'\\)" ccw/src/tools/command-registry.ts` | validate command naming + nested discovery assumptions |
| `.workflow/active/WFS-{session}/{design_id}/prototypes/compare.html` | Planned | docs: `.claude/commands/workflow/ui-design/explore-auto.md` / `Completion Output` ; ts: `ccw/src/tools/ui-generate-preview.js` / `Generate compare.html and index.html for UI prototypes` | `Test-Path ".workflow/active/WFS-<session>/<design_id>/prototypes/compare.html"` | primary user-facing artifact for variant selection in session mode |

## Implementation Hints (Tooling/Server)

- Prefer recursive command scanning patterns in `ccw/src/core/routes/commands-routes.ts` for any UI that lists command docs under `.claude/commands/`.
- Keep explore-auto's \"continuous execution\" semantics explicit: after confirmation, phases must not pause for user input.

## Proposed Fix Plan (Minimal)

See `fix-plan.md` for the concrete checklist and verify commands.

