---
name: clean
description: Intelligent code cleanup with mainline detection, stale artifact discovery, and safe execution
argument-hint: "[-y|--yes] [--dry-run] [\"focus area\"]"
allowed-tools: TodoWrite(*), Task(*), AskUserQuestion(*), Read(*), Glob(*), Bash(*), Write(*)
group: workflow
---

# Clean Command (/workflow:clean)

## Overview

- Goal: Mainline-aware drift discovery and safe cleanup of stale sessions, drifted documents, and dead code.
- Command: `/workflow:clean`

## Usage

```bash
/workflow:clean
/workflow:clean --yes
/workflow:clean --dry-run
/workflow:clean -y "auth module"
```

## Inputs

- Required inputs:
  - Repository workspace (current working directory)
- Optional inputs:
  - Flags: `-y|--yes`, `--dry-run`
  - Focus area: free-text string (narrows discovery scope)

## Outputs / Artifacts

- Writes:
  - `.workflow/.clean/clean-<YYYY-MM-DD>/mainline-profile.json`
  - `.workflow/.clean/clean-<YYYY-MM-DD>/cleanup-manifest.json`
  - `.workflow/.clean/clean-<YYYY-MM-DD>/cleanup-report.md` (human-readable summary)
- Reads:
  - `.workflow/**` (session directories + manifests)
  - `.claude/**` (rules/docs candidates)
  - `ccw/src/**` (dead-code discovery targets)
  - git history (via `Bash(git ...)`)

## Implementation Pointers

- Command doc: `.claude/commands/workflow/clean.md`
- Likely code locations:
  - `.codex/prompts/clean.md` (prompt source for discovery/execution flow)
  - `ccw/src/tools/command-registry.ts` (parses `.claude/commands/**` frontmatter)
  - `ccw/src/tools/native-session-discovery.ts` (native session discovery helpers)
  - `ccw/src/tools/detect-changed-modules.ts` (git/mtime change detection helpers)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/clean.md` | Existing | docs: `.claude/commands/workflow/clean.md` / `Overview` ; ts: `ccw/src/tools/command-registry.ts` / `const relativePath = join('.claude', 'commands', 'workflow');` | `Test-Path .claude/commands/workflow/clean.md` | oracle command doc and required slash structure |
| `.codex/prompts/clean.md` | Existing | docs: `.claude/commands/workflow/clean.md` / `Implementation` ; ts: `ccw/src/tools/command-registry.ts` / `public getCommand(commandName: string): CommandMetadata | null {` | `Test-Path .codex/prompts/clean.md` | canonical prompt text used by the command |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/clean.md` / `Usage` ; ts: `ccw/src/tools/command-registry.ts` / `export class CommandRegistry {` | `Test-Path ccw/src/tools/command-registry.ts` | CCW loads/understands `.claude/commands/**` |
| `ccw/src/tools/native-session-discovery.ts` | Existing | docs: `.claude/commands/workflow/clean.md` / `Phase 2: Drift Discovery` ; ts: `ccw/src/tools/native-session-discovery.ts` / `// Claude Code stores session files directly in project folder (not in 'sessions' subdirectory)` | `Test-Path ccw/src/tools/native-session-discovery.ts` | session discovery building blocks for stale-session cleanup |
| `ccw/src/tools/detect-changed-modules.ts` | Existing | docs: `.claude/commands/workflow/clean.md` / `Phase 1: Mainline Detection` ; ts: `ccw/src/tools/detect-changed-modules.ts` / `name: 'detect_changed_modules',` | `Test-Path ccw/src/tools/detect-changed-modules.ts` | reusable git/mtime change detection for mainline signals |
| `.workflow/.clean/` | Planned | docs: `.claude/commands/workflow/clean.md` / `Phase 1: Mainline Detection` ; ts: `ccw/src/tools/command-registry.ts` / `const normalized = commandName.startsWith('/workflow:')` | `Test-Path .workflow/.clean` | session workspace for generated manifests + reports |

## Execution Process

```
Phase 1: Mainline Detection
- Create session folder `.workflow/.clean/clean-<YYYY-MM-DD>`
- Collect mainline signals (git recent activity; commit frequency by dir; recent branches)
- Write mainline profile JSON

Phase 2: Drift Discovery (Task: cli-explore-agent)
- Scan workflow session dirs for staleness + orphaned artifacts
- Scan docs for broken references
- Scan TS code for dead/unused exports and orphan files
- Write cleanup manifest JSON

Phase 3: Confirmation
- Present summary (by category + risk)
- AskUserQuestion to select categories + risk level
- Auto mode (--yes): sessions only + low risk; skip confirmations

Phase 4: Execution (unless --dry-run)
- Execute cleanup per selected categories
- Record deleted + failed items
- Write cleanup report
```

## Error Handling

- Not a git repo: fall back to filesystem signals (mtime) and warn; still produce manifest.
- Permission errors on traversal/delete: skip item; record failure in report.
- Missing directories: treat as empty category; do not error the whole run.
- `--dry-run`: never delete; still generate manifest + report.

## Examples

- Full run with confirmation: `/workflow:clean`
- Auto safe cleanup: `/workflow:clean --yes`
- Explore only: `/workflow:clean --dry-run`
- Focused auto cleanup: `/workflow:clean -y "auth module"`

