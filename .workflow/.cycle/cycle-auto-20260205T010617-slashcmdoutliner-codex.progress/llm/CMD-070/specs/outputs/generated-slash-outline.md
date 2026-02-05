---
name: explore-auto
description: Interactive exploratory UI design workflow with style-centric batch generation, creates design variants from prompts/images with parallel execution and user selection
argument-hint: "[--input \"<value>\"] [--targets \"<list>\"] [--target-type \"page|component\"] [--session <id>] [--style-variants <count>] [--layout-variants <count>]"
allowed-tools: Skill(*), TodoWrite(*), Read(*), Bash(*), Glob(*), Write(*), Task(conceptual-planning-agent)
group: workflow
---

# UI Design Auto Workflow Command

## Overview

- Goal: Produce multiple UI design variants (styles x layouts x targets) from prompts/images/code with a single confirmation step, then run phases automatically to completion.
- Command: `/workflow:ui-design:explore-auto`

## Usage

```bash
/workflow:ui-design:explore-auto --input "design-refs/*|modern dashboard" --targets "dashboard,settings" --target-type "page" --style-variants 3 --layout-variants 2
```

## Inputs

- Required inputs:
  - One of: `--input "<value>"` OR `--targets "<list>"` (targets can also be inferred from prompt)
- Optional inputs:
  - `--input "<value>"`: unified input (glob/path/prompt); multiple inputs split by `|`
  - `--targets "<list>"`: explicit targets (comma-separated string)
  - `--target-type "page|component"`: explicit type (or inferred when omitted)
  - `--session <id>`: write under `.workflow/active/WFS-<id>/...` instead of `.workflow/...`
  - `--style-variants <count>`: style variants to generate (default inferred; bounded)
  - `--layout-variants <count>`: layout variants to generate (default inferred; bounded)

## Outputs / Artifacts

- Writes (run-scoped):
  - `{base_path}/.run-metadata.json`
  - `{base_path}/style-extraction/**`
  - `{base_path}/animation-extraction/**` (conditional)
  - `{base_path}/layout-extraction/**`
  - `{base_path}/prototypes/**` (HTML/CSS variants + preview files)
- Reads (existence checks / pass-through):
  - `{base_path}/style-extraction/**/design-tokens.json`
  - `{base_path}/animation-extraction/animation-tokens.json`
  - `{base_path}/layout-extraction/layout-*.json`

## Implementation Pointers

- Command doc: `.claude/commands/workflow/ui-design/explore-auto.md`
- Likely code locations (tooling used by the pipeline):
  - `ccw/src/core/routes/commands-routes.ts` (nested command discovery in CCW UI/API)
  - `ccw/src/tools/session-manager.ts` (session path conventions)
  - `ccw/src/tools/ui-generate-preview.js` (compare.html/PREVIEW.md generation)
  - `ccw/src/tools/ui-instantiate-prototypes.js` (prototype + preview orchestration notes)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/ui-design/explore-auto.md` | Existing | docs: `.claude/commands/workflow/ui-design/explore-auto.md` / `UI Design Auto Workflow Command` ; ts: `ccw/src/core/routes/commands-routes.ts` / `function scanCommandsRecursive(` | `Test-Path .claude/commands/workflow/ui-design/explore-auto.md` | source of truth for intended multi-phase behavior |
| `.claude/commands/workflow/ui-design/imitate-auto.md` | Existing | docs: `.claude/commands/workflow/ui-design/imitate-auto.md` / `UI Design Imitate-Auto Workflow Command` ; ts: `ccw/src/core/routes/commands-routes.ts` / `return join(projectPath, '.claude', 'commands');` | `Test-Path .claude/commands/workflow/ui-design/imitate-auto.md` | closest reference for orchestrator structure + TodoWrite patterns |
| `.claude/commands/workflow/ui-design/generate.md` | Existing | docs: `.claude/commands/workflow/ui-design/generate.md` / `Generate UI Prototypes (/workflow:ui-design:generate)` ; ts: `ccw/src/tools/ui-generate-preview.js` / `Generate compare.html and index.html for UI prototypes` | `Test-Path .claude/commands/workflow/ui-design/generate.md` | defines Phase 10 artifacts + preview output expectations |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/ui-design/explore-auto.md` / `Parameter Requirements` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path ccw/src/tools/session-manager.ts; rg "const ACTIVE_BASE = '\\.workflow/active';" ccw/src/tools/session-manager.ts` | aligns `--session` writes with shared workflow tooling |
| `ccw/src/tools/ui-generate-preview.js` | Existing | docs: `.claude/commands/workflow/ui-design/explore-auto.md` / `Completion Output` ; ts: `ccw/src/tools/ui-generate-preview.js` / `writeFileSync(resolve(targetPath, 'compare.html'), compareHtml, 'utf8');` | `Test-Path ccw/src/tools/ui-generate-preview.js; rg "writeFileSync\\(resolve\\(targetPath, 'compare\\.html'\\)" ccw/src/tools/ui-generate-preview.js` | concrete implementation for compare.html generation |
| `{base_path}/prototypes/compare.html` | Planned | docs: `.claude/commands/workflow/ui-design/explore-auto.md` / `Completion Output` ; ts: `ccw/src/tools/ui-generate-preview.js` / `Generate compare.html and index.html for UI prototypes` | `Test-Path "{base_path}/prototypes/compare.html"` | primary interactive preview artifact for selecting variants |
| `.workflow/active/WFS-{session}/{design_id}/` | Planned | docs: `.claude/commands/workflow/ui-design/explore-auto.md` / `10-Phase Execution` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path ".workflow/active/WFS-<session>/<design_id>/"` | session-scoped run root when `--session` is provided |

## Execution Process

1. Parse parameters and infer input types (glob/path/prompt; allow `|`-split multi-input).
2. Infer device type and run configuration (style/layout variant counts; target type).
3. Initialize run directory under `.workflow/...` and write minimal run metadata.
4. Infer targets (explicit params -> prompt analysis -> session synthesis -> fallback) and perform a single interactive confirmation.
5. After confirmation: initialize TodoWrite and execute phases automatically with task-attachment + collapse pattern:
   - Phase 6: optional import-from-code + completeness assessment
   - Phase 7: style-extract (variants)
   - Phase 8: animation-extract (conditional)
   - Phase 9: layout-extract (targets x variants x device)
   - Phase 10: generate (assemble prototypes + preview artifacts)
6. Emit completion output pointing to `{base_path}/prototypes/compare.html` and next workflow steps.

## Error Handling

- Invalid inputs: missing `--input` and no inferable targets -> error with a minimal usage hint.
- Empty/invalid globs: warn with resolved matches count; fail if required image mode has zero matches.
- Unsafe deletes: only remove run-scoped subfolders under `{base_path}`.
- Missing prerequisites: if expected artifacts are absent for a phase, run the corresponding phase command (do not silently continue).
- Task execution: if an attached task fails, stop the phase, record failure in TodoWrite, and emit a recovery hint (rerun from last successful phase).

## Examples

```bash
/workflow:ui-design:explore-auto --input "design-refs/*|mobile settings screen" --style-variants 3 --layout-variants 3
```

```bash
/workflow:ui-design:explore-auto --targets "dashboard,settings" --target-type "page" --session demo-123
```

