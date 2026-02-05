# Gap Report: workflow:session:solidify

## Reference

- Selected reference: /workflow:session:solidify (`.claude/commands/workflow/session/solidify.md`)

## P0 Gaps (Must Fix)

- Canonical command identity mismatch: requirements header says `/workflow:solidify`, but oracle doc defines `/workflow:session:solidify`.
- Missing artifact in repo: `.workflow/project-guidelines.json` does not exist today; command must create scaffold safely before first write.
- Frontmatter/tool surface drift: oracle doc lacks `allowed-tools`; implementation must declare tools it uses (Read/Write/AskUserQuestion/Bash) to meet CCW P0 gates.
- Schema compatibility risk: guidelines JSON shape must remain compatible with CCW consumers (core aggregation + API routes) before adding new fields.

## P1 Gaps (Should Fix)

- Tighten validation rules: explicitly list valid categories per `--type` and error messaging for invalid combinations.
- Interactive mode detail: define exact question flow and defaults when `--type/--category` omitted.
- Error recovery guidance: document how to recover from malformed `.workflow/project-guidelines.json` without data loss.

## P2 Gaps (Optional)

- Add a short troubleshooting section (common mistakes + quick fixes).
- Add a minimal "integration sanity check" snippet (how to confirm downstream commands see the updated guidelines).

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/session/solidify.md` | Existing | docs: `.claude/commands/workflow/session/solidify.md` / `Session Solidify Command (/workflow:session:solidify)` ; ts: `ccw/src/core/data-aggregator.ts` / `Successfully loaded project guidelines` | `Test-Path .claude/commands/workflow/session/solidify.md` | oracle command behavior (do not leak full contents into spec) |
| `.workflow/project-guidelines.json` | Planned | docs: `.claude/commands/workflow/session/solidify.md` / `Implementation` ; ts: `ccw/src/core/data-aggregator.ts` / `project-guidelines.json` | `Test-Path .workflow/project-guidelines.json` | must be created if missing; preserve + append if present |
| `.claude/commands/workflow/init-guidelines.md` | Existing | docs: `.claude/commands/workflow/init-guidelines.md` / `Workflow Init Guidelines Command (/workflow:init-guidelines)` ; ts: `ccw/src/core/routes/ccw-routes.ts` / `project-guidelines.json` | `Test-Path .claude/commands/workflow/init-guidelines.md` | scaffold precedent and related initialization flow |
| `.claude/commands/workflow/tools/context-gather.md` | Existing | docs: `.claude/commands/workflow/tools/context-gather.md` / `Execution Process` ; ts: `ccw/src/core/data-aggregator.ts` / `Successfully loaded project guidelines` | `Test-Path .claude/commands/workflow/tools/context-gather.md` | downstream consumer; ensures new fields do not break packaging |
| `.claude/workflows/cli-templates/schemas/project-guidelines-schema.json` | Existing | docs: `.claude/commands/workflow/init-guidelines.md` / `Implementation` ; ts: `ccw/src/core/data-aggregator.ts` / `interface ProjectGuidelines` | `Test-Path .claude/workflows/cli-templates/schemas/project-guidelines-schema.json` | schema reference for scaffolding + validation |
| `ccw/src/core/data-aggregator.ts` | Existing | docs: `.claude/commands/workflow/tools/context-gather.md` / `Overview` ; ts: `ccw/src/core/data-aggregator.ts` / `Failed to parse project-guidelines.json:` | `Test-Path ccw/src/core/data-aggregator.ts` | consumer: parsing + logging; treat malformed JSON as error path |
| `ccw/src/core/routes/ccw-routes.ts` | Existing | docs: `.claude/commands/workflow/session/solidify.md` / `Integration with Planning` ; ts: `ccw/src/core/routes/ccw-routes.ts` / `const guidelinesFile = join(resolvedPath, '.workflow', 'project-guidelines.json');` | `Test-Path ccw/src/core/routes/ccw-routes.ts` | consumer: API endpoint reads guidelines; keep shape compatible |

## Implementation Hints (Tooling/Server)

- Corpus integration points to keep compatible:
  - `ccw/src/core/data-aggregator.ts` loads `.workflow/project-guidelines.json` into the aggregated project overview.
  - `ccw/src/core/routes/ccw-routes.ts` reads guidelines under `.workflow/project-guidelines.json` for the CCW API.
- Prefer strict, additive JSON evolution (new optional fields only) to avoid breaking consumers.

## Proposed Fix Plan (Minimal)

- Decide canonical invocation: `/workflow:session:solidify` vs `/workflow:solidify` (alias) and update docs accordingly.
- Update command doc frontmatter to include `allowed-tools` and ensure listed tools match actual usage.
- Implement safe scaffold creation when `.workflow/project-guidelines.json` is missing (match schema).
- Add explicit validation + errors for `--type`/`--category`, and define interactive prompt flow.
