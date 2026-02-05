---
name: docs-related-cli
description: Generate/update documentation for git-changed modules using CLI execution with batched agents (4 modules/agent) and gemini->qwen->codex fallback, <15 modules uses direct parallel
argument-hint: "[--tool <gemini|qwen|codex>]"
allowed-tools: Bash(*), AskUserQuestion(*), Read(*), Write(*), Task(*)
group: memory
---

# Related Documentation Generation - CLI Mode (/memory:docs-related-cli)

## Overview

- Goal: Generate/update documentation for only git-changed modules (and parent contexts) using CLI execution with batching and per-module tool fallback.
- Command: `/memory:docs-related-cli`

## Usage

```bash
/memory:docs-related-cli [--tool <gemini|qwen|codex>]
```

## Inputs

- Required inputs:
  - A git repo / working tree (for change detection)
- Optional inputs:
  - `--tool <gemini|qwen|codex>`: preferred primary tool; fallback order depends on this value

## Outputs / Artifacts

- Writes:
  - `.workflow/docs/<project_name>/**` (documentation output tree mirroring source structure)
- Reads:
  - `git diff` output (changed files)
  - source files under affected modules

## Implementation Pointers

- Command doc: `.claude/commands/memory/docs-related-cli.md`
- Likely code locations:
  - `ccw/src/tools/detect-changed-modules.ts`
  - `ccw/src/cli.ts`
  - `ccw/src/tools/command-registry.ts`

### Evidence (Existing vs Planned)

You MUST label each pointer as `Existing` (verifiable in repo now) or `Planned` (will be created/modified).

Rules:
- `Existing` MUST include evidence from BOTH:
  - a command doc source: `.claude/commands/**.md` (section heading is sufficient)
  - a TypeScript source: `ccw/src/**` (function name / subcommand case / a ripgrep-able string)
- If you cannot verify, downgrade to `Planned` and add a concrete `Verify` step (e.g. `Test-Path <path>`, `rg "<pattern>" <path>`).

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/memory/docs-related-cli.md` | Existing | docs: `.claude/commands/memory/docs-related-cli.md` / `Related Documentation Generation - CLI Mode (/memory:docs-related-cli)` ; ts: `ccw/src/tools/command-registry.ts` / `parseYamlHeader(content: string)` | `Test-Path .claude/commands/memory/docs-related-cli.md` | primary command doc (needs CCW-aligned frontmatter fields) |
| `ccw/src/tools/detect-changed-modules.ts` | Existing | docs: `.claude/commands/memory/docs-related-cli.md` / `Phase 1: Change Detection & Analysis` ; ts: `ccw/src/tools/detect-changed-modules.ts` / `git diff --name-only HEAD 2>/dev/null` | `Test-Path ccw/src/tools/detect-changed-modules.ts` | reusable change detection implementation for related scope |
| `ccw/src/cli.ts` | Existing | docs: `.claude/commands/memory/docs-related-cli.md` / `Tool Fallback Hierarchy` ; ts: `ccw/src/cli.ts` / `Unified CLI tool executor (gemini/qwen/codex/claude)` | `Test-Path ccw/src/cli.ts` | CLI entrypoint surface for tool selection + fallback orchestration |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/memory/docs-related-cli.md` / `Output Structure` ; ts: `ccw/src/tools/command-registry.ts` / `private parseYamlHeader(content: string)` | `Test-Path ccw/src/tools/command-registry.ts` | YAML frontmatter parsing conventions for command docs |

## Execution Process

1. Phase 1: Change Detection & Analysis
   - Use git diff to compute changed files and map them to affected modules/paths.
   - Derive per-module depth and process depth N->0.

2. Phase 2: Plan Presentation
   - Present filtered module list with skip reasons.
   - Ask for explicit y/n confirmation before running any generation.

3. Phase 3: Execution
   - Mode selection:
     - `<15 modules`: direct execution with bounded parallelism (e.g. max 4 concurrent per depth)
     - `>=15 modules`: batch workers (4 modules/agent) executed in parallel per depth
   - Per module: run documentation generation and retry with fallback tools on non-zero exit code/timeout.
   - Use incremental single strategy for updates.

4. Phase 4: Verification
   - Verify expected documentation files exist/updated under `.workflow/docs/<project_name>/**`.
   - Report per-module success/failure and any skipped modules.

## Error Handling

- No repo / no changes detected: present fallback plan (e.g. recent modules) and ask for confirmation.
- User declines plan: stop with no writes.
- Tool failure: retry same module with fallback tool order; continue other modules; summarize failures.
- Verification failure: report incomplete modules and next steps (rerun subset).

## Examples

```bash
/memory:docs-related-cli
/memory:docs-related-cli --tool qwen
/memory:docs-related-cli --tool codex
```

