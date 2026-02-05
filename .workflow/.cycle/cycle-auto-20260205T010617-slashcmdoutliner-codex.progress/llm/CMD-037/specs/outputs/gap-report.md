# Gap Report: workflow:init

## Reference

- Selected reference: /workflow:init (`.claude/commands/workflow/init.md`)

## P0 Gaps (Must Fix)

- `allowed-tools` + `group` missing from the oracle frontmatter; required by CCW quality gates for tool-surface safety.
- “Existing vs Planned” evidence tables do not exist in the oracle (acceptable historically), but are required for this outliner output; ensure any “Existing” pointers in future updates remain repo-verifiable.

## P1 Gaps (Should Fix)

- Oracle doc embeds inputs/outputs implicitly in prose; the generated outline adds explicit `Inputs` and `Outputs / Artifacts` sections for consistency with other workflow commands.
- Regeneration behavior is described, but could be made more “checklist-like” (preconditions + backup + overwrite rules) to reduce accidental destructive runs.

## P2 Gaps (Optional)

- Add a short “Next steps” snippet that points users to `/workflow:init-guidelines` (or dashboard navigation) after init completes.

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
| `.claude/commands/workflow/init.md` | Existing | docs: `.claude/commands/workflow/init.md` / `Workflow Init Command (/workflow:init)` ; ts: `ccw/src/templates/dashboard-js/views/project-overview.js` / `/workflow:init` | `Test-Path .claude/commands/workflow/init.md` | Command oracle and canonical behavior reference. |
| `.claude/commands/workflow/init-guidelines.md` | Existing | docs: `.claude/commands/workflow/init-guidelines.md` / `Workflow Init Guidelines Command (/workflow:init-guidelines)` ; ts: `ccw/src/templates/dashboard-js/views/project-overview.js` / `function renderGuidelinesSection` | `Test-Path .claude/commands/workflow/init-guidelines.md` | Follow-up wizard for populating `.workflow/project-guidelines.json`. |
| `ccw/src/tools/get-modules-by-depth.ts` | Existing | docs: `.claude/commands/workflow/init.md` / `Step 3: Invoke cli-explore-agent` ; ts: `ccw/src/tools/get-modules-by-depth.ts` / `name: 'get_modules_by_depth'` | `Test-Path ccw/src/tools/get-modules-by-depth.ts` | Tool invoked by analysis to enumerate modules/structure. |
| `ccw/src/core/data-aggregator.ts` | Existing | docs: `.claude/commands/workflow/init.md` / `Overview` ; ts: `ccw/src/core/data-aggregator.ts` / `project-tech.json` | `Test-Path ccw/src/core/data-aggregator.ts` | Loads `.workflow/project-tech.json` + `.workflow/project-guidelines.json` for dashboard/workflow data. |
| `ccw/src/templates/dashboard-js/views/project-overview.js` | Existing | docs: `.claude/commands/workflow/init.md` / `Project Overview` ; ts: `ccw/src/templates/dashboard-js/views/project-overview.js` / `renderProjectOverview` | `Test-Path ccw/src/templates/dashboard-js/views/project-overview.js` | UI expects init artifacts and prompts `/workflow:init` when missing. |

## Implementation Hints (Tooling/Server)

- The CCW dashboard/aggregator loads `.workflow/project-tech.json` and `.workflow/project-guidelines.json`; keeping schema stability reduces downstream rendering errors.
- Prefer `ccw tool exec get_modules_by_depth` as the stable, repo-supported structure enumerator for delegated analysis.

## Proposed Fix Plan (Minimal)

1. Update `.claude/commands/workflow/init.md` frontmatter to add:
   - `allowed-tools: Bash(*), Task(cli-explore-agent), AskUserQuestion(*), Skill(workflow:init-guidelines), Read(*), Write(*)`
   - `group: workflow`
2. Add explicit `Inputs` and `Outputs / Artifacts` sections (keep contents aligned with the oracle flow).
3. Make `--regenerate` safety explicit:
   - backup before overwrite; do not overwrite without flag.
4. Ensure the “ask to configure guidelines” branch only runs when guidelines are not populated, and the skip branch provides next-step commands.

