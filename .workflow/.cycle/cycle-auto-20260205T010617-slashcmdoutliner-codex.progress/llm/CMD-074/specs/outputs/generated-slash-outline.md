---
name: layout-extract
description: Extract structural layout information from reference images or text prompts using Claude analysis with variant generation or refinement mode
argument-hint: "[-y|--yes] [--design-id <id>] [--session <id>] [--images \"<glob>\"] [--prompt \"<desc>\"] [--targets \"<list>\"] [--variants <count>] [--device-type <desktop|mobile|tablet|responsive>] [--interactive] [--refine]"
allowed-tools: TodoWrite(*), Read(*), Write(*), Glob(*), Bash(*), AskUserQuestion(*), Task(ui-design-agent), mcp__exa__web_search_exa(*)
group: "workflow:ui-design"
---

# Layout Extract

## Overview

- Goal: Extract structural layout templates (DOM structure + component hierarchy + layout rules) from images or a text prompt, with exploration (variants) or refinement (single) modes.
- Command: `/workflow:ui-design:layout-extract`

## Usage

```bash
/workflow:ui-design:layout-extract [--design-id <id>] [--session <id>] [--images "<glob>"] [--prompt "<desc>"] [--targets "<list>"] [--variants <count>] [--device-type <desktop|mobile|tablet|responsive>] [--interactive] [--refine]
```

## Inputs

- Required inputs:
  - Either `--images "<glob>"` (preferred) or `--prompt "<desc>"`
- Optional inputs:
  - `--design-id <id>` or `--session <id>` (base path resolution)
  - `--targets "<list>"` (comma-separated)
  - `--variants <count>` (exploration only; clamped to 1-5)
  - `--device-type <desktop|mobile|tablet|responsive>`
  - `--interactive` (ask user to pick options per target)
  - `--refine` (refinement mode; forces variants_count=1)
  - `-y|--yes` (auto mode: skip clarification questions)

## Outputs / Artifacts

- Writes:
  - `{base_path}/.intermediates/layout-analysis/analysis-options.json` (generated options; may embed `user_selection` in interactive mode)
  - `{base_path}/layout-extraction/layout-templates.json` (final templates)
- Reads:
  - Input images from `--images` glob (if provided)
  - Input prompt text from `--prompt` (if provided)
  - `{base_path}/.intermediates/layout-analysis/analysis-options.json` (cache + interactive selections)
  - `{base_path}/layout-extraction/layout-templates.json` (skip-if-exists / refinement input)

## Implementation Pointers

- Command doc: `.claude/commands/workflow/ui-design/layout-extract.md`
- Likely code locations:
  - `.claude/agents/ui-design-agent.md` (Task prompts for layout concept + template generation)
  - `ccw/src/core/services/flow-executor.ts` (executes slash-command nodes when composed into flows)
  - `ccw/src/core/routes/commands-routes.ts` (discovers and groups command docs under `.claude/commands/**`)

### Evidence (Existing vs Planned)

You MUST label each pointer as `Existing` (verifiable in repo now) or `Planned` (will be created/modified).

Rules:
- `Existing` MUST include evidence from BOTH:
  - a command doc source: `.claude/commands/**.md` (section heading is sufficient)
  - a TypeScript source: `ccw/src/**` (function name / subcommand case / a ripgrep-able string)
- If you cannot verify, downgrade to `Planned` and add a concrete `Verify` step (e.g. `Test-Path <path>`, `rg "<pattern>" <path>`).

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/ui-design/layout-extract.md` | Existing | docs: `.claude/commands/workflow/ui-design/layout-extract.md` / Overview ; ts: `ccw/src/core/routes/commands-routes.ts` / return join(projectPath, '.claude', 'commands'); | `Test-Path .claude/commands/workflow/ui-design/layout-extract.md` | source command doc that defines the slash command behavior |
| `.claude/agents/ui-design-agent.md` | Existing | docs: `.claude/commands/workflow/ui-design/layout-extract.md` / Execution Process ; ts: `ccw/src/core/services/flow-executor.ts` / private async runSlashCommand(node: FlowNode) | `Test-Path .claude/agents/ui-design-agent.md` | deep layout analysis is delegated via `Task(ui-design-agent)` |
| `.claude/commands/workflow/ui-design/animation-extract.md` | Existing | docs: `.claude/commands/workflow/ui-design/layout-extract.md` / Auto Mode ; ts: `ccw/src/core/routes/commands-routes.ts` / function getCommandsDir(location: CommandLocation, projectPath: string): string { | `Test-Path .claude/commands/workflow/ui-design/animation-extract.md` | closest reference pattern for refine + interactive + Task-based extraction |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/workflow/ui-design/layout-extract.md` / Overview ; ts: `ccw/src/core/routes/commands-routes.ts` / function parseCommandFrontmatter(content: string): CommandMetadata { | `Test-Path ccw/src/core/routes/commands-routes.ts` | command discovery/grouping used by CCW dashboard/API |
| `ccw/src/core/services/flow-executor.ts` | Existing | docs: `.claude/commands/workflow/ui-design/layout-extract.md` / Execution Process ; ts: `ccw/src/core/services/flow-executor.ts` / private async runSlashCommand(node: FlowNode) | `Test-Path ccw/src/core/services/flow-executor.ts` | flow execution path that can run slash commands as nodes |
| `.claude/commands/workflow/ui-design/INTERACTIVE-DATA-SPEC.md` | Planned | docs: `.claude/commands/workflow/ui-design/layout-extract.md` / Phase 1: Layout Concept or Refinement Options Generation ; ts: `ccw/src/core/routes/commands-routes.ts` / return join(projectPath, '.claude', 'commands'); | `Test-Path .claude/commands/workflow/ui-design/INTERACTIVE-DATA-SPEC.md` | schema reference for interactive `analysis-options.json` (currently referenced by docs) |

Notes:
- Expand `{{implementation.code_pointers}}` into **one row per pointer** (do not keep it as a single aggregated cell).
- For TS evidence, prefer anchors like `function <name>` / `case '<subcommand>'` / a stable string literal that can be found via `rg`.

## Execution Process

Phase 0: Setup & Input Validation
- Step 1: Detect Input, Mode & Targets
  - Detect input source priority: `--images` (image mode) > `--prompt` (text mode); require at least one.
  - Detect refinement mode: `--refine` enables refinement.
  - Set variants count:
    - Refinement: force `variants_count = 1` (ignore `--variants`).
    - Exploration: use `--variants` or default to `3`, then clamp to `1..5`.
  - Resolve targets priority: `--targets` > inferred from prompt > default `["page"]`.
  - Resolve device type: use `--device-type` (default to `responsive` if omitted).
  - Determine `base_path` priority: `--design-id` > `--session` > auto-detect; validate and convert to absolute path.
- Step 2: Load Inputs & Create Directories
  - Resolve image list from glob (image mode) and validate at least one match.
  - Validate `--prompt` is non-empty (text mode).
  - Create `{base_path}/.intermediates/layout-analysis/` and `{base_path}/layout-extraction/`.
- Step 3: Memory Check
  - If `{base_path}/.intermediates/layout-analysis/analysis-options.json` exists and inputs match, reuse it.
  - If `{base_path}/layout-extraction/layout-templates.json` already exists, exit early (or require explicit overwrite via `--yes`).

Phase 1: Layout Concept or Refinement Options Generation (Agent Task 1)
- If refinement mode:
  - Load existing layout templates (or prior analysis) as refinement context.
  - Task(ui-design-agent): generate refinement options per target (density/responsiveness/grid/arrangement categories).
- If exploration mode:
  - Task(ui-design-agent): generate `variants_count` structurally distinct layout concepts per target.
- Write `{base_path}/.intermediates/layout-analysis/analysis-options.json`.
- Quick validation:
  - Verify file exists and contains expected top-level keys (`layout_concepts` and/or `refinement_options`).

Phase 1.5: User Confirmation (Optional - Triggered by --interactive)
- If `--interactive`:
  - Read `analysis-options.json`.
  - For each target, present options and capture user selection via AskUserQuestion.
  - Update `analysis-options.json` with embedded `user_selection` and persist.

Phase 2: Layout Template Generation (Agent Task 2)
- Load user selections if present; otherwise default to “generate templates for all concepts”.
- Build a task list across `(targets × selected concepts)`.
- Launch parallel Task(ui-design-agent) tasks to generate templates.
- Write consolidated `{base_path}/layout-extraction/layout-templates.json`.
- Verify outputs:
  - Count expected vs generated templates (sample check).
  - Validate JSON structure for required fields.

Completion
- TodoWrite: mark tasks complete (with counts and output paths).
- Output message: summarize base_path, mode, targets, variants, and key artifact paths.

## Error Handling

- Missing input source: if neither `--images` nor `--prompt`, stop with a clear usage message.
- Empty glob match: if `--images` resolves to 0 files, request a corrected glob (unless `--yes`, then fail fast).
- Invalid `--variants`: coerce to integer and clamp to `1..5`; in refine mode ignore and log.
- Base path resolution failure: print the resolution priority and the failing step; suggest `--design-id` or `--session`.
- Agent task failure: retry once (same inputs), then fall back to a reduced target set (single target) or exit with actionable remediation.
- JSON validation failure: write a minimal error report and keep intermediates for debugging.

## Examples

```bash
# Exploration from images (3 variants default), interactive selection
/workflow:ui-design:layout-extract --design-id "D-123" --images "design-refs/*.png" --targets "page" --device-type responsive --interactive

# Exploration from text prompt with explicit variants
/workflow:ui-design:layout-extract --session "WFS-ui-001" --prompt "Dashboard page with sidebar + top nav, dense data tables" --targets "page" --variants 4 --device-type desktop

# Refinement mode (forces variants_count=1)
/workflow:ui-design:layout-extract --design-id "D-123" --images "design-refs/*.png" --refine --interactive
```
