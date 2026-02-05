---
name: cli-init
description: Generate .gemini/ and .qwen/ config directories with settings.json and ignore files based on workspace technology detection
argument-hint: "[--tool gemini|qwen|all] [--output path] [--preview]"
allowed-tools: Bash(*), Read(*), Write(*), Glob(*)
group: cli
---

# CLI Initialization Command (/cli:cli-init)

## Overview

- Goal: Initialize `.gemini/` and/or `.qwen/` settings plus `.geminiignore`/`.qwenignore` based on detected workspace technology.
- Command: `/cli:cli-init`

## Usage

```bash
/cli:cli-init [--tool gemini|qwen|all] [--output path] [--preview]
```

## Inputs

- Required inputs:
  - Workspace root (current directory)
- Optional inputs:
  - `--tool gemini|qwen|all` (default: all)
  - `--output <path>` (default: workspace root)
  - `--preview` (no writes; show planned outputs)

## Outputs / Artifacts

- Writes:
  - `<output>/.gemini/settings.json` (when `--tool gemini|all`)
  - `<output>/.qwen/settings.json` (when `--tool qwen|all`)
  - `<output>/.geminiignore` (when `--tool gemini|all`)
  - `<output>/.qwenignore` (when `--tool qwen|all`)
  - backups (if files/dirs already exist): `.gemini.backup/`, `.qwen.backup/`, `.geminiignore.backup`, `.qwenignore.backup` (optionally timestamped)
- Reads:
  - Workspace structure and indicators (e.g. `package.json`, `requirements.txt`, `pyproject.toml`, `pom.xml`, `Dockerfile`)
  - Tool output: `ccw tool exec get_modules_by_depth` (json)

## Implementation Pointers

- Command doc: `.claude/commands/cli/cli-init.md`
- Likely code locations:
  - `ccw/src/core/routes/commands-routes.ts` (command discovery/serving)
  - `ccw/src/tools/get-modules-by-depth.ts` (workspace scan tool used by multiple commands)
  - `ccw/src/commands/workflow.ts` (workflow installer includes `.gemini`/`.qwen` sources)
  - `ccw/src/commands/install.ts` (package install includes `.gemini`/`.qwen` source dirs)

### Evidence (Existing vs Planned)

You MUST label each pointer as `Existing` (verifiable in repo now) or `Planned` (will be created/modified).

Rules:
- `Existing` MUST include evidence from BOTH:
  - a command doc source: `.claude/commands/**.md` (section heading is sufficient)
  - a TypeScript source: `ccw/src/**` (function name / subcommand case / a ripgrep-able string)
- If you cannot verify, downgrade to `Planned` and add a concrete `Verify` step (e.g. `Test-Path <path>`, `rg "<pattern>" <path>`).

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/cli/cli-init.md` | Existing | docs: `.claude/commands/cli/cli-init.md` / `Overview` ; ts: `ccw/src/core/routes/commands-routes.ts` / `function scanCommandsRecursive(` | `Test-Path .claude/commands/cli/cli-init.md` | command spec/oracle doc |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/cli/cli-init.md` / `Core Functionality` ; ts: `ccw/src/core/routes/commands-routes.ts` / `function scanCommandsRecursive(` | `Test-Path ccw/src/core/routes/commands-routes.ts; rg "function scanCommandsRecursive\\(" ccw/src/core/routes/commands-routes.ts` | how command docs are discovered/exposed |
| `ccw/src/tools/get-modules-by-depth.ts` | Existing | docs: `.claude/commands/cli/cli-init.md` / `Step 2: Workspace Analysis (MANDATORY FIRST)` ; ts: `ccw/src/tools/get-modules-by-depth.ts` / `name: 'get_modules_by_depth',` | `Test-Path ccw/src/tools/get-modules-by-depth.ts; rg \"name: 'get_modules_by_depth',\" ccw/src/tools/get-modules-by-depth.ts` | mandatory first step: structural scan |
| `ccw/src/commands/workflow.ts` | Existing | docs: `.claude/commands/cli/cli-init.md` / `Generated Files` ; ts: `ccw/src/commands/workflow.ts` / `{ name: '.gemini', description: 'Gemini configuration' },` | `Test-Path ccw/src/commands/workflow.ts; rg \"\\{ name: '\\.gemini'\" ccw/src/commands/workflow.ts` | `.gemini`/`.qwen` treated as workflow sources |
| `ccw/src/commands/install.ts` | Existing | docs: `.claude/commands/cli/cli-init.md` / `Configuration Directories` ; ts: `ccw/src/commands/install.ts` / `const SOURCE_DIRS = ['.claude', '.codex', '.gemini', '.qwen'];` | `Test-Path ccw/src/commands/install.ts; rg \"const SOURCE_DIRS = \\['\\.claude', '\\.codex', '\\.gemini', '\\.qwen'\\];\" ccw/src/commands/install.ts` | packaging/install includes `.gemini`/`.qwen` directories |

Notes:
- Expand code pointers into **one row per pointer** (do not keep it as a single aggregated cell).
- For TS evidence, prefer anchors like `function <name>` / `case '<subcommand>'` / a stable string literal that can be found via `rg`.

## Execution Process

1. Parse arguments:
   - `--tool` (default `all`), `--output` (default `.`), `--preview` (default false).
2. Workspace analysis (MANDATORY FIRST):
   - Run: `ccw tool exec get_modules_by_depth '{"format":"json"}'`.
3. Technology detection:
   - Use module list + lightweight file checks to detect stacks (Node, Python, Java, Docker, etc.).
4. Build generated content:
   - `settings.json` content for selected tools (default context file: `CLAUDE.md`).
   - ignore rules:
     - base rules (VCS, OS, IDE, logs)
     - add tech-specific rules for detected stacks
     - sort/dedupe and keep sections clearly labeled
5. Backups + write/preview:
   - If target exists and not preview: create backups before overwriting.
   - If `--preview`: print planned paths + snippets (no `Write`, no `mkdir`).
   - Else: create target directories and write files.
6. Validation:
   - Verify expected files exist (or would exist in preview), and print a short summary.

## Error Handling

- Missing dependencies:
  - If `ccw tool exec get_modules_by_depth` fails, stop with a clear message and fallback instructions.
- Invalid arguments:
  - Reject unsupported `--tool` values; show allowed values.
  - Validate `--output` is a directory (or can be created).
- Write permissions / collisions:
  - If write fails, report which path failed and whether a backup was created.
  - Never overwrite without backup (unless `--preview`).

## Examples

```bash
# Initialize all (Gemini + Qwen)
/cli:cli-init

# Gemini only
/cli:cli-init --tool gemini

# Qwen only
/cli:cli-init --tool qwen

# Preview only
/cli:cli-init --preview

# Custom output directory
/cli:cli-init --output=.config/
```

