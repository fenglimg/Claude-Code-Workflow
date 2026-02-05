---
name: generate
description: Assemble UI prototypes by combining layout templates with design tokens (default animation support), pure assembler without new content generation
argument-hint: "[--design-id <id>] [--session <id>]"
allowed-tools: TodoWrite(*), Read(*), Write(*), Task(ui-design-agent), Bash(*)
group: workflow
---

# Generate UI Prototypes

## Overview

- Goal: Assemble UI prototypes (HTML/CSS) by combining layout templates with design tokens; no new content generation.
- Command: `/workflow:ui-design:generate`

## Usage

```bash
/workflow:ui-design:generate [--design-id <id>] [--session <id>]
```

## Inputs

- Required inputs:
  - A resolved design-run base path (selected by `--design-id`, `--session`, or auto-detect latest)
  - Layout templates: `{base_path}/layout-extraction/layout-*.json`
  - Design tokens for each style: `{base_path}/style-extraction/style-*/design-tokens.json`
- Optional inputs:
  - Animation tokens: `{base_path}/animation-extraction/animation-tokens.json`
  - Preview template override (tool default): `.claude/workflows/_template-compare-matrix.html`

## Outputs / Artifacts

- Writes:
  - `{base_path}/prototypes/{target}-style-{s}-layout-{l}.html`
  - `{base_path}/prototypes/{target}-style-{s}-layout-{l}.css`
  - `{base_path}/prototypes/compare.html`
  - `{base_path}/prototypes/index.html`
  - `{base_path}/prototypes/PREVIEW.md`
- Reads:
  - `{base_path}/layout-extraction/layout-*.json`
  - `{base_path}/style-extraction/style-*/design-tokens.json`
  - `{base_path}/animation-extraction/animation-tokens.json` (optional)

## Implementation Pointers

- Command doc: `.claude/commands/workflow/ui-design/generate.md`
- Likely code locations:
  - `ccw/src/tools/ui-generate-preview.js` (tool: `ui_generate_preview`)
  - `ccw/src/tools/index.ts` (tool registration)
  - `.claude/workflows/_template-compare-matrix.html` (preview template)

### Evidence (Existing vs Planned)

You MUST label each pointer as `Existing` (verifiable in repo now) or `Planned` (will be created/modified).

Rules:
- `Existing` MUST include evidence from BOTH:
  - a command doc source: `.claude/commands/**.md` (section heading is sufficient)
  - a TypeScript source: `ccw/src/**` (function name / subcommand case / a ripgrep-able string)
- If you cannot verify, downgrade to `Planned` and add a concrete `Verify` step (e.g. `Test-Path <path>`, `rg "<pattern>" <path>`).

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/ui-design/generate.md` | Existing | docs: `.claude/commands/workflow/ui-design/generate.md` / `Overview` ; ts: `ccw/src/tools/ui-generate-preview.js` / `name: 'ui_generate_preview'` | `Test-Path .claude/commands/workflow/ui-design/generate.md` | Canonical command behavior and artifact contract |
| `ccw/src/tools/ui-generate-preview.js` | Existing | docs: `.claude/commands/workflow/ui-design/generate.md` / `File Operations` ; ts: `ccw/src/tools/ui-generate-preview.js` / `name: 'ui_generate_preview'` | `Test-Path ccw/src/tools/ui-generate-preview.js; rg "name: 'ui_generate_preview'" ccw/src/tools/ui-generate-preview.js` | Generates preview artifacts (`compare.html`, `index.html`, `PREVIEW.md`) |
| `ccw/src/tools/index.ts` | Existing | docs: `.claude/commands/workflow/ui-design/generate.md` / `File Operations` ; ts: `ccw/src/tools/index.ts` / `registerTool(uiGeneratePreviewTool);` | `Test-Path ccw/src/tools/index.ts; rg "registerTool\(uiGeneratePreviewTool\);" ccw/src/tools/index.ts` | Registers preview tool for `ccw tool exec ui_generate_preview` |
| `.claude/workflows/_template-compare-matrix.html` | Existing | docs: `.claude/commands/workflow/ui-design/generate.md` / `Phase 3: Generate Preview Files` ; ts: `ccw/src/tools/ui-generate-preview.js` / `.claude/workflows/_template-compare-matrix.html` | `Test-Path .claude/workflows/_template-compare-matrix.html` | Default template consumed by preview generation tool |

Notes:
- Expand code pointers into one row per pointer.
- For TS evidence, prefer anchors like `function <name>` / `case '<subcommand>'` / a stable string literal that can be found via `rg`.

## Execution Process

1. Phase 1: Setup and validation
   - Resolve base path by priority: `--design-id` > `--session` > auto-detect latest design-run.
   - Load layout templates (multi-file `layout-*.json`) and extract targets/device metadata.
   - Load/validate design tokens for each style variant.
   - Optionally load animation tokens when present.
2. Phase 2: Assembly (agent)
   - Compute grouping plan across styles and layouts (balanced distribution; each agent handles one style).
   - Execute batched tasks; after each batch, verify generated files exist and basic HTML/CSS sanity.
3. Phase 3: Preview generation
   - Run `ccw tool exec ui_generate_preview` over `{base_path}/prototypes`.
   - Verify `compare.html`, `index.html`, `PREVIEW.md` exist.
4. Completion
   - Update todo state and report output summary (counts + locations).

## Error Handling

- Missing base path (no matching design-run): tell user to run `/workflow:ui-design:list` and re-run with `--design-id` or `--session`.
- Missing layout templates: instruct to run `/workflow:ui-design:layout-extract` first.
- Missing design tokens: instruct to run `/workflow:ui-design:style-extract` first.
- Partial generation: keep successfully generated files; re-run after fixing missing inputs.

## Examples

```bash
# Use explicit design id
/workflow:ui-design:generate --design-id "DESIGN-123"

# Use latest in a session
/workflow:ui-design:generate --session "WFS-ABC"

# Verify expected counts (example commands; adjust base_path)
ls "{base_path}/prototypes" | rg "-style-\d+-layout-\d+\.html$" | Measure-Object
Test-Path "{base_path}/prototypes/compare.html"
```
