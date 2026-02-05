---
name: update-full
description: Update all CLAUDE.md files using layer-based execution (Layer 3->1) with batched agents (4 modules/agent) and gemini->qwen->codex fallback; <20 modules uses direct parallel.
argument-hint: "[--tool gemini|qwen|codex] [--path <directory>]"
allowed-tools: TodoWrite(*), Task(*), AskUserQuestion(*), Read(*), Grep(*), Glob(*), Bash(*), Write(*)
group: memory
---

# Full Documentation Update

## Overview

- Goal: Safely update CLAUDE.md across all project modules using layer-based batching with tool fallback and a final safety verification.
- Command: `/memory:update-full`

## Usage

```bash
/memory:update-full [--tool gemini|qwen|codex] [--path <directory>]
```

## Inputs

- Required inputs:
  - Workspace with one or more module directories to document.
- Optional inputs:
  - `--path <directory>`: Limit scope to a subtree (default: project root).
  - `--tool <gemini|qwen|codex>`: Primary tool to start the fallback chain (default: gemini).

## Outputs / Artifacts

- Writes:
  - `<target>/**/CLAUDE.md`
- Reads:
  - `<target>/**/*` (source + existing docs used as context)

## Implementation Pointers

- Command doc: `.claude/commands/memory/update-full.md`
- Likely code locations:
  - `ccw/src/cli.ts` (CLI execution entrypoint for gemini/qwen/codex)
  - `ccw/src/tools/cli-executor-utils.ts` (per-tool argument wiring + stream-json mode)
  - `ccw/src/tools/memory-update-queue.js` (batching/queue helper for CLAUDE.md updates)
  - `ccw/src/core/claude-freshness.ts` (tracking/metadata hooks for CLAUDE.md freshness)

### Evidence (Existing vs Planned)

You MUST label each pointer as `Existing` (verifiable in repo now) or `Planned` (will be created/modified).

Rules:
- `Existing` MUST include evidence from BOTH:
  - a command doc source: `.claude/commands/**.md` (section heading is sufficient)
  - a TypeScript source: `ccw/src/**` (function name / subcommand case / a ripgrep-able string)
- If you cannot verify, downgrade to `Planned` and add a concrete `Verify` step (e.g. `Test-Path <path>`, `rg "<pattern>" <path>`).

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/memory/update-full.md` | Existing | docs: `.claude/commands/memory/update-full.md` / `Full Documentation Update (/memory:update-full)` ; ts: `ccw/src/tools/memory-update-queue.js` / `name: 'memory_queue'` | `Test-Path .claude/commands/memory/update-full.md` | Source of truth for user-facing workflow and rules |
| `ccw/src/cli.ts` | Existing | docs: `.claude/commands/memory/update-full.md` / `Tool Fallback Hierarchy` ; ts: `ccw/src/cli.ts` / `Unified CLI tool executor (gemini/qwen/codex/claude)` | `Test-Path ccw/src/cli.ts` | Entrypoint to execute gemini/qwen/codex with consistent flags |
| `ccw/src/tools/cli-executor-utils.ts` | Existing | docs: `.claude/commands/memory/update-full.md` / `Execution Phases` ; ts: `ccw/src/tools/cli-executor-utils.ts` / `case 'qwen':` | `rg "case 'qwen':" ccw/src/tools/cli-executor-utils.ts` | Tool-specific invocation details (resume/write/include-dirs/stream-json) |
| `ccw/src/tools/memory-update-queue.js` | Existing | docs: `.claude/commands/memory/update-full.md` / `Execution Phases` ; ts: `ccw/src/tools/memory-update-queue.js` / `export const memoryQueueTool = {` | `Test-Path ccw/src/tools/memory-update-queue.js` | Queue/batching primitives for large module counts |
| `ccw/src/core/claude-freshness.ts` | Existing | docs: `.claude/commands/memory/update-full.md` / `Phase 4: Safety Verification` ; ts: `ccw/src/core/claude-freshness.ts` / `export function markFileAsUpdated(` | `rg "export function markFileAsUpdated\\(" ccw/src/core/claude-freshness.ts` | Track/update metadata after successful CLAUDE.md writes |

## Execution Process

1. Phase 1: Discovery & Analysis
   - Enumerate candidate module directories under `--path` (or project root).
   - Assign each directory to Layer 3/2/1 by depth; determine strategy per layer.
   - Apply ignore filters (tests/build/config/docs) to avoid low-signal modules.

2. Phase 2: Plan Presentation
   - Present a plan grouped by depth (process N->0).
   - Show estimated module count and the selected execution mode:
     - `<20 modules`: direct parallel execution
     - `>=20 modules`: agent batch execution (4 modules/agent)
   - Require explicit user confirmation before writes.

3. Phase 3A: Direct Execution (<20 modules)
   - Execute updates in depth order N->0.
   - For each depth level, run up to 4 modules concurrently.
   - For each module, attempt tool chain derived from `--tool` (fallback on non-zero exit).

4. Phase 3B: Agent Batch Execution (>=20 modules)
   - Batch modules into groups of 4 per agent within each depth level.
   - Run batches in parallel per depth, then proceed to the next shallower depth.
   - Enforce tool fallback per module within each batch.

5. Phase 4: Safety Verification
   - Verify only `CLAUDE.md` files changed (or abort and print a diff summary).
   - Report success/failure counts by depth and by tool used.

## Error Handling

- Invalid arguments: reject with usage hint (unknown tool, missing/invalid path, etc.).
- Tool failures: retry via fallback chain; if all tools fail for a module, record failure and continue.
- Partial success: summarize failed modules with next actions (re-run with narrower `--path`, switch `--tool`).
- Safety check failure: stop and require explicit user confirmation before keeping non-CLAUDE.md changes.

## Examples

```bash
# Full project update (auto-strategy selection)
/memory:update-full

# Target specific directory
/memory:update-full --path .claude
/memory:update-full --path src/features/auth

# Use specific tool
/memory:update-full --tool qwen
/memory:update-full --path .claude --tool qwen
```

