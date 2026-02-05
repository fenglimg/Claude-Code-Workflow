# Gap Report: workflow:ui-design:layout-extract

## Reference

- Selected reference: /workflow:ui-design:animation-extract (`.claude/commands/workflow/ui-design/animation-extract.md`)

## P0 Gaps (Must Fix)

- Command identity consistency: requirement header mentions `/workflow:layout-extract`, but corpus command listing uses `/workflow:ui-design:layout-extract`. Align the outline + any consuming orchestrators to a single slash form.
- Broken artifact reference risk: `INTERACTIVE-DATA-SPEC.md` is referenced by the command doc family but does not exist under `.claude/commands/workflow/ui-design/` in this repo; either add it or remove/replace the reference.
- Tool-surface clarity: `mcp__exa__web_search_exa(*)` is allowed; the outline must specify when it is used (e.g., URL/pattern lookup) and ensure it is not used implicitly in non-interactive mode.

## P1 Gaps (Should Fix)

- Output schema specificity: document the minimal required fields for each template entry in `layout-templates.json` (enough for `/workflow:ui-design:generate` consumption).
- Cache/skip rules: define the exact criteria for reusing `analysis-options.json` and for early-exit when `layout-templates.json` already exists (especially under `--yes`).

## P2 Gaps (Optional)

- URL input support: repo-wide command reference mentions URLs for layout-extract; if desired, explicitly support a URL input path (and document it) or update the reference to reflect supported inputs.

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
| `.claude/commands/workflow/ui-design/layout-extract.md` | Existing | docs: `.claude/commands/workflow/ui-design/layout-extract.md` / Overview ; ts: `ccw/src/core/routes/commands-routes.ts` / return join(projectPath, '.claude', 'commands'); | `Test-Path .claude/commands/workflow/ui-design/layout-extract.md` | primary behavior spec for the command |
| `.claude/commands/workflow/ui-design/animation-extract.md` | Existing | docs: `.claude/commands/workflow/ui-design/layout-extract.md` / Auto Mode ; ts: `ccw/src/core/routes/commands-routes.ts` / function getCommandsDir(location: CommandLocation, projectPath: string): string { | `Test-Path .claude/commands/workflow/ui-design/animation-extract.md` | reference pattern for refine + interactive + Task-based extraction |
| `.claude/agents/ui-design-agent.md` | Existing | docs: `.claude/commands/workflow/ui-design/layout-extract.md` / Execution Process ; ts: `ccw/src/core/services/flow-executor.ts` / private async runSlashCommand(node: FlowNode) | `Test-Path .claude/agents/ui-design-agent.md` | agent that receives the layout tasks |
| `ccw/src/core/services/flow-executor.ts` | Existing | docs: `.claude/commands/workflow/ui-design/layout-extract.md` / Execution Process ; ts: `ccw/src/core/services/flow-executor.ts` / private async runSlashCommand(node: FlowNode) | `Test-Path ccw/src/core/services/flow-executor.ts` | flow runtime that can invoke slash commands as nodes |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/workflow/ui-design/layout-extract.md` / Overview ; ts: `ccw/src/core/routes/commands-routes.ts` / function parseCommandFrontmatter(content: string): CommandMetadata { | `Test-Path ccw/src/core/routes/commands-routes.ts` | command discovery/grouping for dashboard/API |
| `.claude/commands/workflow/ui-design/INTERACTIVE-DATA-SPEC.md` | Planned | docs: `.claude/commands/workflow/ui-design/layout-extract.md` / Phase 1: Layout Concept or Refinement Options Generation ; ts: `ccw/src/core/routes/commands-routes.ts` / return join(projectPath, '.claude', 'commands'); | `Test-Path .claude/commands/workflow/ui-design/INTERACTIVE-DATA-SPEC.md` | missing schema reference; add or replace |

Notes:
- Use **one row per pointer**.
- Evidence format recommendation:
  - `docs: <file> / <section heading>`
  - `ts: <file> / <function|case|pattern>`

## Implementation Hints (Tooling/Server)

- Command discovery/grouping (dashboard): `ccw/src/core/routes/commands-routes.ts` scans `.claude/commands/**` recursively and extracts frontmatter.
- Flow execution composition: `ccw/src/core/services/flow-executor.ts` includes a slash-command node runner (`runSlashCommand`) that builds a prompt from command + args.

## Proposed Fix Plan (Minimal)

- P0 (docs): standardize on `/workflow:ui-design:layout-extract` everywhere (command doc title/usage, COMMAND_REFERENCE.md/docs if needed).
- P0 (docs): either create `.claude/commands/workflow/ui-design/INTERACTIVE-DATA-SPEC.md` (schema for analysis-options.json) or remove the reference and inline the minimal schema in each extractor doc.
- P0 (behavior): explicitly document the decision points for when `mcp__exa__web_search_exa` is used (and when it must not be used).
- P1 (schema): add a minimal, stable schema section for `layout-templates.json` that downstream commands can rely on.
