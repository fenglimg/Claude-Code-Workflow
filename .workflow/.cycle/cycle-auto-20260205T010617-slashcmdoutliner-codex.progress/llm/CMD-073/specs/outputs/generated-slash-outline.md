---
name: ui-design:import-from-code
description: Import design system from code files (CSS/JS/HTML/SCSS) with automatic file discovery and parallel agent analysis
argument-hint: "[--design-id <id>] [--session <id>] [--source <path>]"
allowed-tools: Read,Write,Bash,Glob,Grep,Task,TodoWrite
group: workflow
---

# UI Design: Import from Code

## Overview

- Goal: Import a design system from an existing codebase into an existing design run by auto-discovering relevant files and running 3 parallel extraction agents.
- Command: `/workflow:ui-design:import-from-code`

## Usage

```bash
/workflow:ui-design:import-from-code [--design-id <id>] [--session <id>] --source <path>
```

## Inputs

- Required inputs:
  - One of: `--design-id <id>` or `--session <id>` (base path resolution)
  - `--source <path>` (directory to scan)
- Optional inputs:
  - None

## Outputs / Artifacts

- Writes:
  - `<base_path>/.intermediates/import-analysis/discovered-files.json`
  - `<base_path>/style-extraction/style-1/design-tokens.json`
  - `<base_path>/style-extraction/style-1/completeness-report.json`
  - `<base_path>/animation-extraction/animation-tokens.json`
  - `<base_path>/animation-extraction/completeness-report.json`
  - `<base_path>/layout-extraction/layout-templates.json`
  - `<base_path>/layout-extraction/completeness-report.json`
- Reads:
  - `<sourceDir>/**/*.{css,scss,js,ts,html}`
  - `.workflow/**` (existing design runs for resolving `<base_path>`)

## Implementation Pointers

- Command doc: `.claude/commands/workflow/ui-design/import-from-code.md`
- Likely code locations:
  - `ccw/src/tools/discover-design-files.ts` (tool: `discover_design_files`)
  - `ccw/src/core/routes/commands-routes.ts` (commands discovery + grouping)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/ui-design/import-from-code.md` | Existing | docs: `.claude/commands/workflow/ui-design/import-from-code.md / Overview` ; ts: `ccw/src/core/routes/commands-routes.ts / return join(projectPath, '.claude', 'commands');` | `Test-Path .claude/commands/workflow/ui-design/import-from-code.md` | Oracle command doc + contract |
| `ccw/src/tools/discover-design-files.ts` | Existing | docs: `.claude/commands/workflow/ui-design/import-from-code.md / Step 1: Setup & File Discovery` ; ts: `ccw/src/tools/discover-design-files.ts / name: 'discover_design_files',` | `Test-Path ccw/src/tools/discover-design-files.ts` | File discovery tool invoked by the command |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/workflow/ui-design/import-from-code.md / Execution Process` ; ts: `ccw/src/core/routes/commands-routes.ts / function scanCommandsRecursive(` | `Test-Path ccw/src/core/routes/commands-routes.ts` | Canonical commands scanning/grouping patterns |

## Execution Process

```
Input parsing
  - Parse flags: --design-id, --session, --source
  - Validate: --source required

Base path resolution (priority)
  1) If --design-id: locate matching design run directory under .workflow
  2) Else if --session: pick latest design run under .workflow/active/WFS-<session>/design-run-*
  3) Else: error (must provide --design-id or --session)

Phase 0: Setup & file discovery
  - Initialize: <base_path>/.intermediates/import-analysis/
  - Run discovery:
      ccw tool exec discover_design_files {"sourceDir":"<source>","outputPath":"<discovery_file>"}

Phase 1: Parallel agent analysis (no synthesis)
  - Task 1 (Style): read discovered-files.json + sources -> design-tokens.json + completeness-report.json
  - Task 2 (Animation): read discovered-files.json + sources -> animation-tokens.json + completeness-report.json
  - Task 3 (Layout): read discovered-files.json + sources -> layout-templates.json + completeness-report.json

Finalize
  - Verify expected files exist
  - Print per-agent artifact paths and a short status summary
```

## Error Handling

- Missing `--source` -> exit with clear message
- Missing both `--design-id` and `--session` -> exit with clear message
- Design run not found for provided id/session -> exit with hint to list design runs
- Discovery tool fails or produces empty output -> exit with actionable hint (verify source dir + supported extensions)
- Any agent task fails -> report which agent failed; keep the other agents' outputs if available

## Examples

```bash
# Import into a specific design run
/workflow:ui-design:import-from-code --design-id design-run-20260101-120000 --source ./src

# Import into latest design run of a session
/workflow:ui-design:import-from-code --session 20260205-001 --source ./app
```
