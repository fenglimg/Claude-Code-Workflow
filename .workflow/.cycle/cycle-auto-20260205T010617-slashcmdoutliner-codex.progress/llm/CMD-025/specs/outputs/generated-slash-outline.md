---
name: update-related
description: Update CLAUDE.md for git-changed modules using batched agent execution (4 modules/agent) with gemini->qwen->codex fallback, <15 modules uses direct execution
argument-hint: "[--tool gemini|qwen|codex]"
allowed-tools: Task(*), AskUserQuestion(*), Read(*), Write(*), Bash(*)
group: memory
---

# memory:update-related

## Overview

- Goal: Update CLAUDE.md only for git-changed modules (plus parent context), with batching, tool fallback, and safety verification.
- Command: `/memory:update-related`

## Usage

```bash
/memory:update-related [--tool gemini|qwen|codex]
```

## Inputs

- Required inputs:
  - Run inside a git worktree (for change detection).
- Optional inputs:
  - `--tool <gemini|qwen|codex>`: Primary tool (default: gemini).

## Outputs / Artifacts

- Writes:
  - `CLAUDE.md` in each selected module directory (changed modules + parent context; may include repo root).
- Reads:
  - `.git/` (diff/status for change detection and safety verification).
  - Working tree content under selected modules (to regenerate/update CLAUDE.md).

## Implementation Pointers

- Command doc: `.claude/commands/memory/update-related.md`
- Likely code locations:
  - `ccw/src/tools/detect-changed-modules.ts` (tool: `detect_changed_modules`)
  - `ccw/src/tools/update-module-claude.js` (tool: `update_module_claude`)
  - `ccw/src/core/routes/files-routes.ts` (spawns: `ccw tool exec update_module_claude`)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/memory/update-related.md` | Existing | docs: `.claude/commands/memory/update-related.md` / Related Documentation Update (/memory:update-related) ; ts: `ccw/src/tools/update-module-claude.js` / name: 'update_module_claude', | `Test-Path .claude/commands/memory/update-related.md` | Primary slash command doc (oracle). |
| `ccw/src/tools/detect-changed-modules.ts` | Existing | docs: `.claude/commands/memory/update-related.md` / Phase 1: Change Detection & Analysis ; ts: `ccw/src/tools/detect-changed-modules.ts` / name: 'detect_changed_modules', | `Test-Path ccw/src/tools/detect-changed-modules.ts; rg \"name: 'detect_changed_modules',\" ccw/src/tools/detect-changed-modules.ts` | Implements `ccw tool exec detect_changed_modules` used to discover changed modules. |
| `ccw/src/tools/update-module-claude.js` | Existing | docs: `.claude/commands/memory/update-related.md` / Phase 3A: Direct Execution (<15 modules) ; ts: `ccw/src/tools/update-module-claude.js` / name: 'update_module_claude', | `Test-Path ccw/src/tools/update-module-claude.js; rg \"name: 'update_module_claude',\" ccw/src/tools/update-module-claude.js` | Implements the per-module CLAUDE.md updater invoked for each selected path. |
| `ccw/src/core/routes/files-routes.ts` | Existing | docs: `.claude/commands/memory/update-related.md` / Phase 3A: Direct Execution (<15 modules) ; ts: `ccw/src/core/routes/files-routes.ts` / spawn('ccw', ['tool', 'exec', 'update_module_claude', params], { | `Test-Path ccw/src/core/routes/files-routes.ts; rg \"spawn\\('ccw', \\['tool', 'exec', 'update_module_claude', params\\], \\{\" ccw/src/core/routes/files-routes.ts` | Shows in-app orchestration path that shells out to `ccw tool exec update_module_claude`. |

## Execution Process

1. Parse args:
   - `--tool` (default: gemini)
   - Construct fallback order: gemini->qwen->codex (or rotate when primary is qwen/codex).
2. Phase 1: Change detection & analysis:
   - Run `ccw tool exec detect_changed_modules '{"format":"list"}'` and parse `depth:N|path:<PATH>|change:<TYPE>`.
   - Best-effort cache git changes (`git add -A ... || true`) for later safety verification.
   - Smart-filter paths (skip tests/build/config/docs-like folders); if no changes, fall back to recent modules.
3. Phase 2: Plan presentation:
   - Print filtered plan (tool order, selected modules, skipped paths with reasons, depth grouping).
   - Ask user to confirm (y/n). Abort on "n".
4. Phase 3: Execution (depth N->0, parallel within depth):
   - If moduleCount < 15: direct execution; run up to 4 concurrent module updates within each depth.
   - If moduleCount >= 15: agent batch execution; batch 4 modules/agent and spawn workers per batch; each worker applies per-module tool fallback.
   - For each module: run `ccw tool exec update_module_claude '{"strategy":"single-layer","path":".","tool":"<tool>"}'` and retry with next tool on non-zero exit.
5. Phase 4: Safety verification:
   - Ensure only `CLAUDE.md` files changed (report and stop if non-CLAUDE.md diffs exist).
   - Show `git diff --stat` and a per-module success/failure summary.

## Error Handling

- Not in a git repo: explain requirement and abort (no change detection).
- User declines plan: abort without changes.
- Tool failure:
  - Retry with fallback tools (up to 3 attempts per module).
  - After exhaustion, record module failure and continue (batch isolation).
- Safety check failure (non-CLAUDE.md modified): stop and revert staging (or instruct user to review diffs before continuing).

## Examples

```bash
# Default tool (gemini) with fallback
/memory:update-related

# Force qwen first
/memory:update-related --tool qwen
```
