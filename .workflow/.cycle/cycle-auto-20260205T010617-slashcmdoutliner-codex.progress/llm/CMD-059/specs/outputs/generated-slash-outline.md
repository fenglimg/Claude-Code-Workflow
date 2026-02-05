---
name: tools:conflict-resolution
description: Detect and resolve conflicts between plan and existing codebase using CLI-powered analysis with Gemini/Qwen
argument-hint: "[-y|--yes] --session WFS-session-id --context path/to/context-package.json"
allowed-tools: Task(*), AskUserQuestion(*), Read(*), Write(*)
group: workflow
---

# Conflict Resolution Command

## Overview

- Goal: Detect and resolve conflicts between a workflow plan/context-package and the current repo state, producing a structured resolution report and applying user-approved edits.
- Command: `/workflow:tools:conflict-resolution`

## Usage

```bash
/workflow:tools:conflict-resolution [-y|--yes] --session WFS-session-id --context path/to/context-package.json
```

## Inputs

- Required inputs:
  - `--session WFS-session-id`
  - `--context path/to/context-package.json`
- Optional inputs:
  - `-y|--yes` (auto mode: skip interactive confirmations where safe)

## Outputs / Artifacts

- Writes:
  - `.workflow/active/<WFS-session-id>/.process/conflict-resolution.json`
  - (may update) `.workflow/active/<WFS-session-id>/.process/context-package.json`
- Reads:
  - `--context` JSON (context package)
  - repository files referenced by the context package and/or discovered during analysis

## Implementation Pointers

- Command doc: `.claude/commands/workflow/tools/conflict-resolution.md`
- Likely code locations:
  - `ccw/src/tools/cli-executor-core.ts` (gemini/qwen execution surface)
  - `ccw/src/core/routes/cli-routes.ts` (CLI config/entry points used by execution agents)

### Evidence (Existing vs Planned)

You MUST label each pointer as `Existing` (verifiable in repo now) or `Planned` (will be created/modified).

Rules:
- `Existing` MUST include evidence from BOTH:
  - a command doc source: `.claude/commands/**.md` (section heading is sufficient)
  - a TypeScript source: `ccw/src/**` (function name / subcommand case / a ripgrep-able string)
- If you cannot verify, downgrade to `Planned` and add a concrete `Verify` step (e.g. `Test-Path <path>`, `rg "<pattern>" <path>`).

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/tools/conflict-resolution.md` | Existing | docs: `.claude/commands/workflow/tools/conflict-resolution.md` / `Conflict Resolution Command` ; ts: `ccw/src/tools/cli-executor-core.ts` / `const BUILTIN_CLI_TOOLS = ['gemini', 'qwen', 'codex', 'opencode', 'claude'] as const` | `Test-Path .claude/commands/workflow/tools/conflict-resolution.md` | Oracle command doc to update/keep in sync (missing P0 frontmatter like allowed-tools) |
| `ccw/src/tools/cli-executor-core.ts` | Existing | docs: `.claude/commands/workflow/tools/conflict-resolution.md` / `Execution Process` ; ts: `ccw/src/tools/cli-executor-core.ts` / `const BUILTIN_CLI_TOOLS = ['gemini', 'qwen', 'codex', 'opencode', 'claude'] as const` | `Test-Path ccw/src/tools/cli-executor-core.ts; rg "BUILTIN_CLI_TOOLS = \\['gemini', 'qwen'" ccw/src/tools/cli-executor-core.ts` | Provides the unified CLI execution layer for Gemini/Qwen referenced by the command |
| `ccw/src/core/routes/cli-routes.ts` | Existing | docs: `.claude/commands/workflow/tools/conflict-resolution.md` / `Integration` ; ts: `ccw/src/core/routes/cli-routes.ts` / `const configMatch = pathname.match(/^\/api\/cli\/config\/(gemini|qwen|codex|claude|opencode)$/)` | `Test-Path ccw/src/core/routes/cli-routes.ts; rg "configMatch = pathname.match" ccw/src/core/routes/cli-routes.ts` | Defines CLI API integration points/config routing used by CLI-driven workflows |

Notes:
- Expand code pointers into **one row per pointer**.
- For TS evidence, prefer anchors like `function <name>` / `case '<subcommand>'` / a stable string literal that can be found via `rg`.

## Execution Process

- Phase 1: Validation
  - Validate `--session` format and session directory presence.
  - Validate `--context` exists and is parseable JSON.
- Phase 2: CLI-Powered Analysis
  - Use CLI execution agent(s) to analyze the context package + current repo state.
  - Produce a structured set of conflicts with categories: architecture, API, data model, dependency, module overlap.
- Phase 3: User Interaction Loop
  - Present conflicts in priority order.
  - Ask user to choose resolution actions (edit plan, edit code, defer, or re-run analysis).
  - Re-run analysis after applying a batch of changes until conflicts are resolved or user stops.
- Phase 4: Apply Modifications
  - Apply approved file edits (via `Write`) and update context package if required.
  - Emit final `conflict-resolution.json` capturing decisions and applied changes.

## Error Handling

- Validation failures:
  - missing/invalid `--context`: stop and request a correct path
  - missing session directory: instruct how to create/discover the session
- CLI analysis failures:
  - tool unavailable or execution error: surface stderr safely; offer fallback tool order (gemini -> qwen -> codex)
  - non-parseable analyzer output: retry once with stricter JSON schema prompt; otherwise fall back to manual conflict entry
- Apply failures:
  - write conflicts / file changed mid-run: re-read and rebase edits; if unsafe, stop and require user decision
  - rollback: keep a minimal change log in `conflict-resolution.json` so the user can revert manually

## Examples

```bash
/workflow:tools:conflict-resolution --session WFS-auth --context .workflow/active/WFS-auth/.process/context-package.json
/workflow:tools:conflict-resolution -y --session WFS-payment --context .workflow/active/WFS-payment/.process/context-package.json
```
