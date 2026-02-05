---
name: style-extract
description: Extract design style from reference images or text prompts using Claude analysis with variant generation or refinement mode
argument-hint: "[-y|--yes] [--design-id <id>] [--session <id>] [--images <glob>] [--prompt <desc>] [--variants <count>] [--interactive] [--refine]"
allowed-tools: TodoWrite(*), Read(*), Write(*), Glob(*), AskUserQuestion(*)
group: workflow
---

# Style Extract

## Overview

- Goal: Generate one or more production-ready design token sets by extracting style direction from images and/or a text prompt.
- Command: `/workflow:style-extract`

## Usage

```bash
/workflow:style-extract [-y|--yes] [--design-id <id>] [--session <id>] [--images <glob>] [--prompt <desc>] [--variants <count>] [--interactive] [--refine]
```

## Inputs

- Required inputs:
  - One of: `--images <glob>` OR `--prompt <desc>` (or both for hybrid)
- Optional inputs:
  - `--design-id <id>` (preferred base-path selector)
  - `--session <id>` (base-path selector within a session)
  - `--variants <count>` (exploration mode only; default 3; range 1..5)
  - `--refine` (refinement mode; forces variants_count=1)
  - `--interactive` (ask user to select directions/options before generation)
  - `-y|--yes` (auto mode; skip clarification)

## Outputs / Artifacts

- Writes:
  - `<base_path>/.intermediates/style-analysis/analysis-options.json` (options + optional selection)
  - `<base_path>/style-extraction/style-*/design-tokens.json` (final tokens per variant)
- Reads:
  - `.workflow/**/design-run-*` (base-path discovery)
  - `<images resolved from --images glob>` (image mode / hybrid)
  - `<base_path>/style-extraction/style-1/design-tokens.json` (refine mode seed, if present)
  - `<base_path>/.brainstorming/**` (optional context)

## Implementation Pointers

- Command doc: `.claude/commands/workflow/ui-design/style-extract.md`
- Likely code locations:
  - `ccw/src/core/routes/commands-routes.ts` (discovers command docs + infers groups from path)
  - `ccw/src/utils/path-validator.ts` (repo-safe path validation patterns)
  - `ccw/src/utils/file-utils.ts` (read/write helpers used by tooling code)

### Evidence (Existing vs Planned)

You MUST label each pointer as `Existing` (verifiable in repo now) or `Planned` (will be created/modified).

Rules:
- `Existing` MUST include evidence from BOTH:
  - a command doc source: `.claude/commands/**.md` (section heading is sufficient)
  - a TypeScript source: `ccw/src/**` (function name / subcommand case / a ripgrep-able string)
- If you cannot verify, downgrade to `Planned` and add a concrete `Verify` step (e.g. `Test-Path <path>`, `rg "<pattern>" <path>`).

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/ui-design/style-extract.md` | Existing | docs: `.claude/commands/workflow/ui-design/style-extract.md` / `Overview` ; ts: `ccw/src/core/routes/commands-routes.ts` / `function parseCommandFrontmatter(content: string): CommandMetadata {` | `Test-Path .claude/commands/workflow/ui-design/style-extract.md` ; `rg \"## Overview\" .claude/commands/workflow/ui-design/style-extract.md` | Oracle command doc and CCW command frontmatter conventions |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/workflow/ui-design/style-extract.md` / `Execution Process` ; ts: `ccw/src/core/routes/commands-routes.ts` / `function getCommandGroup(commandName: string, relativePath: string, location: CommandLocation, projectPath: string): string {` | `Test-Path ccw/src/core/routes/commands-routes.ts` ; `rg \"function getCommandGroup\" ccw/src/core/routes/commands-routes.ts` | How command docs are discovered and grouped (path-inferred groups like workflow/ui-design) |
| `ccw/src/utils/path-validator.ts` | Existing | docs: `.claude/commands/workflow/ui-design/style-extract.md` / `Phase 0: Setup & Input Validation` ; ts: `ccw/src/utils/path-validator.ts` / `export async function validatePath(` | `Test-Path ccw/src/utils/path-validator.ts` ; `rg \"export async function validatePath\" ccw/src/utils/path-validator.ts` | Secure path validation pattern for repo-scoped operations |
| `.workflow/**/.intermediates/style-analysis/analysis-options.json` | Planned | docs: `.claude/commands/workflow/ui-design/style-extract.md` / `Output Structure` ; ts: `ccw/src/utils/file-utils.ts` / `export function readJsonFile(filePath: string): unknown | null {` | `rg \"analysis-options.json\" .claude/commands/workflow/ui-design/style-extract.md` ; `Test-Path <base_path>/.intermediates/style-analysis/analysis-options.json` | Deterministic options handoff for interactive selection and downstream generation |
| `.workflow/**/style-extraction/style-*/design-tokens.json` | Planned | docs: `.claude/commands/workflow/ui-design/style-extract.md` / `design-tokens.json Format` ; ts: `ccw/src/utils/file-utils.ts` / `export function writeTextFile(filePath: string, content: string): void {` | `rg \"design-tokens.json\" .claude/commands/workflow/ui-design/style-extract.md` ; `Test-Path <base_path>/style-extraction/style-1/design-tokens.json` | Final output contract (one directory per selected variant) |

Notes:
- Expand any new pointers into **one row per pointer**.
- For TS evidence, prefer anchors like `function <name>` / `case '<subcommand>'` / a stable string literal that can be found via `rg`.

## Execution Process

1. Phase 0: Setup & input validation
   - Detect input mode:
     - `--images` + `--prompt` => hybrid
     - `--images` only => image
     - `--prompt` only => text (validate non-empty)
   - Detect extraction mode:
     - `--refine` => refinement mode; force `variants_count = 1`
     - else exploration mode; `variants_count = --variants || 3`, validate 1..5
   - Determine `<base_path>` (priority): `--design-id` > `--session` > auto-detect latest `design-run-*` under `.workflow/**`
   - Create output dirs:
     - `<base_path>/.intermediates/style-analysis/`
     - `<base_path>/style-extraction/`
2. Phase 0.5: Memory check (skip work if already done)
   - If `<base_path>/style-extraction/style-1/design-tokens.json` exists, report and exit (unless user opts to overwrite).
3. Phase 1: Generate analysis options (always)
   - Write `<base_path>/.intermediates/style-analysis/analysis-options.json` with:
     - detected mode(s), variants_count, and (in refine mode) a single refinement plan
4. Phase 1.5: Optional user confirmation (`--interactive`)
   - If `--interactive`:
     - Present options/directions
     - Capture selection and update `analysis-options.json` (persist selection)
5. Phase 2: Generate design-tokens.json (variants)
   - For each selected variant (or all by default):
     - Create `<base_path>/style-extraction/style-{i}/`
     - Write `<base_path>/style-extraction/style-{i}/design-tokens.json`
6. Phase 3: Verify outputs
   - Confirm expected files exist and are non-empty.
7. Completion
   - Update todo (if used) and print a short output summary with paths.

## Error Handling

- No input provided:
  - If neither `--images` nor `--prompt` is present: ask for one (unless `--yes`, then fail fast with guidance).
- Invalid prompt:
  - If `--prompt` is present but empty/whitespace: request a non-empty description.
- No images matched:
  - If `--images` provided but glob matches nothing: ask to correct the glob (or fail fast in `--yes` mode).
- Base path not found:
  - If no matching design run found for `--design-id` / `--session` / auto-detect: provide a next-step hint (e.g., run the UI design generator/list command).
- Output validation failure:
  - If a required JSON file cannot be parsed or is empty: report which file and stop (do not silently continue).

## Examples

```bash
# Exploration from images (default 3 variants)
/workflow:style-extract --images ".workflow/**/refs/*.png"

# Hybrid exploration (5 variants) + interactive selection
/workflow:style-extract --images ".workflow/**/refs/*.png" --prompt "Calm fintech dashboard, high-contrast typography" --variants 5 --interactive

# Refinement (forces 1 variant)
/workflow:style-extract --design-id D-123 --refine --prompt "Refine for WCAG AA and tighten spacing"
```

