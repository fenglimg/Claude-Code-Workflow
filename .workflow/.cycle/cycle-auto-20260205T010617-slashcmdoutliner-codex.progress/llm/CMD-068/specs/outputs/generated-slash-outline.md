---
name: workflow:ui-design:codify-style
description: Orchestrator to extract styles from code and generate shareable reference package with preview (automatic file discovery)
argument-hint: "<path> [--package-name <name>] [--output-dir <path>] [--overwrite]"
allowed-tools: Skill,Bash,Read,TodoWrite
group: workflow
---

# UI Design: Codify Style (Orchestrator)

## Overview

- Goal: Extract styles from a codebase path and generate a shareable reference-style package with preview.
- Command: `/workflow:workflow:ui-design:codify-style`
- Execution model: fully autonomous orchestrator; delegates work to sub-commands via `Skill(...)` and tracks phases via `TodoWrite`.

## Usage

```bash
/workflow:workflow:ui-design:codify-style <path> [--package-name <name>] [--output-dir <path>] [--overwrite]
```

## Inputs

- Required inputs:
  - `<path>`: source path to analyze (directory or file, repo-relative or absolute)
- Optional inputs:
  - `--package-name <name>`: output package name (default: derived from source path or timestamp)
  - `--output-dir <path>`: output base directory (default: `.workflow/reference_style`)
  - `--overwrite`: allow overwriting an existing package directory

## Outputs / Artifacts

- Writes:
  - `.workflow/reference_style/<package-name>/` (final package + preview)
  - `.workflow/codify-temp-<timestamp>/` (temporary workspace; cleaned up after completion)
- Reads:
  - `<path>` (source code)
  - `.workflow/reference_style/**` (existence/overwrite checks)

## Implementation Pointers

- Command doc: `.claude/commands/workflow/ui-design/codify-style.md`
- Likely code locations:
  - `.claude/commands/workflow/ui-design/import-from-code.md` (Phase 1 delegate)
  - `.claude/commands/workflow/ui-design/reference-page-generator.md` (Phase 2 delegate)
  - `ccw/src/core/routes/commands-routes.ts` (command discovery + metadata used by CCW UI/tooling)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/ui-design/codify-style.md` | Existing | docs: .claude/commands/workflow/ui-design/codify-style.md / Overview & Execution Model ; ts: ccw/src/core/routes/commands-routes.ts / function scanCommandsRecursive( | `Test-Path .claude/commands/workflow/ui-design/codify-style.md` | Primary orchestrator command doc |
| `.claude/commands/workflow/ui-design/import-from-code.md` | Existing | docs: .claude/commands/workflow/ui-design/import-from-code.md / Execution Process ; ts: ccw/src/core/routes/commands-routes.ts / function scanCommandsRecursive( | `Test-Path .claude/commands/workflow/ui-design/import-from-code.md` | Phase 1 delegate (style extraction + file discovery) |
| `.claude/commands/workflow/ui-design/reference-page-generator.md` | Existing | docs: .claude/commands/workflow/ui-design/reference-page-generator.md / Execution Process ; ts: ccw/src/core/routes/commands-routes.ts / function scanCommandsRecursive( | `Test-Path .claude/commands/workflow/ui-design/reference-page-generator.md` | Phase 2 delegate (package + preview generation) |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: .claude/commands/workflow/ui-design/codify-style.md / Architecture ; ts: ccw/src/core/routes/commands-routes.ts / function scanCommandsRecursive( | `Test-Path ccw/src/core/routes/commands-routes.ts; rg \"function scanCommandsRecursive\\(\" ccw/src/core/routes/commands-routes.ts` | Ground-truth TS location for command scanning/grouping behavior |

## Execution Process

1. Phase 0: Parameter validation & session preparation
   - Parse positional `<path>` (first non-flag argument); reject missing/empty.
   - Validate source path exists; normalize to absolute for reporting.
   - Determine `package_name` (flag or auto-generated) and `output_dir` (flag or default).
   - Create temporary workspace `.workflow/codify-temp-<timestamp>/`; store `temp_id` and absolute `design_run_path`.
   - Initialize `TodoWrite` with 4 high-level phases; auto-continue.
2. Phase 1: Style extraction from source code (delegate)
   - Build delegate command with required parameters only (use `temp_id` as `--design-id`).
   - Invoke `Skill(...)` to attach delegate tasks and execute them; verify required outputs exist in temp workspace.
3. Phase 2: Reference package generation (delegate)
   - Build delegate command with `--design-run <design_run_path>`, `--package-name`, `--output-dir`.
   - Invoke `Skill(...)` to attach and execute tasks; verify expected package files exist under `<output_dir>/<package_name>/`.
4. Phase 3: Cleanup & verification
   - Remove temporary workspace directory under `.workflow/`.
   - Quick verification: report absolute final package path + component count when available.
   - Emit completion message and final `TodoWrite` update.

## Error Handling

- Missing required `<path>`: print usage + examples; exit non-zero.
- Invalid/non-existent source path: report error; exit non-zero (no partial outputs).
- Temp workspace create failure: abort early; do not proceed to delegates.
- Delegate failure (Phase 1/2): report phase-specific failure, attempt `.workflow/` cleanup, keep temp path for inspection if relevant.
- Overwrite protection: if output package path exists and `--overwrite` is not set, abort with a clear remediation.

## Examples

```bash
/workflow:workflow:ui-design:codify-style ./src
/workflow:workflow:ui-design:codify-style ./app --package-name design-system-v2 --output-dir .workflow/reference_style --overwrite
```

