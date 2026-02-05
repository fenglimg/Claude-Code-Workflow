---
name: ui-design:reference-page-generator
description: Generate multi-component reference pages and documentation from design run extraction
argument-hint: "[--design-run <path>] [--package-name <name>] [--output-dir <path>]"
allowed-tools: Read, Write, Bash, Task, TodoWrite
group: workflow
---

# UI Design: Reference Page Generator

## Overview

- Goal: Convert an existing UI design-run extraction into a shareable reference package (tokens + templates + preview page).
- Command: `/workflow:ui-design:reference-page-generator`

## Usage

```bash
/workflow:ui-design:reference-page-generator --design-run <path> --package-name <name> [--output-dir <path>]
```

## Inputs

- Required inputs:
  - `--design-run <path>`: Design run directory containing prior extraction outputs
  - `--package-name <name>`: Lowercase package identifier used as output folder name
- Optional inputs:
  - `--output-dir <path>`: Base output directory (default: `.workflow/reference_style`)

## Outputs / Artifacts

- Writes:
  - `<output-dir>/<package-name>/layout-templates.json`
  - `<output-dir>/<package-name>/design-tokens.json`
  - `<output-dir>/<package-name>/animation-tokens.json` (optional)
  - `<output-dir>/<package-name>/preview.html`
  - `<output-dir>/<package-name>/preview.css`
- Reads:
  - `<design-run>/layout-extraction/layout-templates.json`
  - `<design-run>/style-extraction/style-1/design-tokens.json`
  - `<design-run>/animation-extraction/animation-tokens.json` (optional)
  - `<output-dir>/<package-name>/metadata.json` (optional; overwrite detection)

## Implementation Pointers

- Command doc: `.claude/commands/workflow/ui-design/reference-page-generator.md`
- Likely code locations:
  - `.claude/agents/ui-design-agent.md` (agent prompt contract for preview generation)
  - `ccw/src/core/routes/commands-routes.ts` (command discovery + frontmatter parsing for dashboard/management)
  - `ccw/src/config/storage-paths.ts` (repo-local `.workflow/` conventions)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/ui-design/reference-page-generator.md` | Existing | docs: `.claude/commands/workflow/ui-design/reference-page-generator.md` / UI Design: Reference Page Generator ; ts: `ccw/src/core/routes/commands-routes.ts` / function scanCommandsRecursive( | `Test-Path .claude/commands/workflow/ui-design/reference-page-generator.md` | Canonical command behavior and artifact contract |
| `.claude/agents/ui-design-agent.md` | Existing | docs: `.claude/commands/workflow/ui-design/reference-page-generator.md` / Phase 2: Preview Generation (Final Phase) ; ts: `ccw/src/core/routes/commands-routes.ts` / function parseCommandFrontmatter(content: string): CommandMetadata | `Test-Path .claude/agents/ui-design-agent.md` | Defines Task(ui-design-agent) expectations for generating preview files |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / Universal Prompt Template ; ts: `ccw/src/core/routes/commands-routes.ts` / function scanCommandsRecursive( | `Test-Path ccw/src/core/routes/commands-routes.ts; rg \"scanCommandsRecursive\" ccw/src/core/routes/commands-routes.ts` | Source of truth for how command docs are scanned and surfaced in CCW tooling |
| `.workflow/reference_style` | Planned | docs: `.claude/commands/workflow/ui-design/reference-page-generator.md` / Output Structure ; ts: `ccw/src/config/storage-paths.ts` / join(projectPath, '.workflow', '.cli-history') | `Test-Path .workflow/reference_style` | Default output root for generated reference packages |
| `ccw/src/config/storage-paths.ts` | Existing | docs: `.claude/commands/workflow/execute.md` / Workflow File Structure Reference ; ts: `ccw/src/config/storage-paths.ts` / join(projectPath, '.workflow', '.cli-history') | `Test-Path ccw/src/config/storage-paths.ts; rg \"\\.workflow\" ccw/src/config/storage-paths.ts` | Establishes repo-local `.workflow/` conventions used by many commands |

## Execution Process

1. Parse flags: `--design-run`, `--package-name`, `--output-dir` (default to `.workflow/reference_style`).
2. Validate required flags are present; otherwise print usage and exit with error.
3. Validate `--package-name` matches `^[a-z0-9][a-z0-9-]*$`; otherwise error with example.
4. Validate `--design-run` exists and is a directory.
5. Validate required inputs exist inside the design-run:
   - `style-extraction/style-1/design-tokens.json`
   - `layout-extraction/layout-templates.json`
6. Prepare output package directory: `<output-dir>/<package-name>`.
   - If the directory exists and is non-empty:
     - If `metadata.json` exists: allow overwrite (log the detected version if available).
     - Else: error and exit (do not clobber an unknown directory).
7. Copy extraction artifacts into package directory:
   - Always copy `layout-templates.json` + `design-tokens.json`.
   - Copy `animation-tokens.json` only if present.
8. Run `Task(ui-design-agent)` to generate:
   - `<package-dir>/preview.html`
   - `<package-dir>/preview.css`
9. Print completion message including package path and file list; include a `file://.../preview.html` open hint.

## Error Handling

- Missing required flags: print usage and exit non-zero.
- Invalid package name: error + example + exit non-zero.
- Design run not found: error + hint to run prerequisite extraction commands.
- Required extraction file missing: error with missing path(s) + exit non-zero.
- Output directory exists but not a prior package: refuse to overwrite and exit non-zero.
- Agent preview generation fails: keep copied artifacts; surface agent failure and point to package directory for inspection.

## Examples

```bash
# Default output directory (.workflow/reference_style)
/workflow:ui-design:reference-page-generator --design-run .workflow/active/WFS-demo/design-run-001 --package-name main-app-style-v1

# Custom output directory
/workflow:ui-design:reference-page-generator --design-run .workflow/active/WFS-demo/design-run-001 --package-name main-app-style-v1 --output-dir .workflow/reference_style_alt
```

