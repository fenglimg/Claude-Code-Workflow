---
name: ccw-debug
description: Debug coordinator - analyze issue, select debug strategy, execute debug workflow in main process
argument-hint: "[--mode cli|debug|test|bidirectional] [--yes|-y] \"bug description\""
allowed-tools: Skill(*), TodoWrite(*), AskUserQuestion(*), Read(*), Bash(*)
---

# CCW-Debug Command - Debug Coordinator

## Overview

- Goal: Analyze a bug report, select a debug strategy (mode), execute the corresponding command chain, and track progress/state for resume/escalation.
- Command: `/ccw-debug`

## Usage

```bash
/ccw-debug [--mode cli|debug|test|bidirectional] [--yes|-y] "bug description"
```

## Inputs

- Required inputs:
  - Bug description (free-form text; include repro steps, error logs, expected vs actual)
- Optional inputs:
  - `--mode <cli|debug|test|bidirectional>`: force mode; otherwise auto-detect from input keywords and clarity/complexity
  - `--yes|-y`: skip confirmation prompts (auto mode)

## Outputs / Artifacts

- Writes:
  - `.workflow/.ccw-debug/{session_id}/status.json` (planned) - session state, chain, and findings
- Reads:
  - `.workflow/.ccw-debug/*/status.json` (optional) - resume/escalate from prior session
  - `.claude/commands/**/*.md` (optional) - command discovery for chain building (when implemented via registry/tools)

## Implementation Pointers

- Command doc: `.claude/commands/ccw-debug.md`
- Likely code locations:
  - `ccw/src/core/routes/commands-routes.ts` (command doc discovery + frontmatter parsing)
  - `ccw/src/tools/command-registry.ts` (command metadata scanning/caching patterns)
  - `ccw/src/core/routes/cli-routes.ts` (CLI execution; used by "cli" mode and CLI-driven chains)
  - `ccw/src/commands/hook.ts` (status.json parsing examples for `.workflow/*/status.json`)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/ccw-debug.md` | Existing | docs: `.claude/commands/ccw-debug.md` / `CCW-Debug Command - Debug Coordinator` ; ts: `ccw/src/core/routes/commands-routes.ts` / `return join(projectPath, '.claude', 'commands')` | `Test-Path .claude/commands/ccw-debug.md` | oracle command doc exists now; outlines should align to this behavior without copying full contents into spec |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `CommandRegistry Integration` ; ts: `ccw/src/core/routes/commands-routes.ts` / `function getCommandsDir(location: CommandLocation, projectPath: string): string {` | `Test-Path ccw/src/core/routes/commands-routes.ts` | server route parses command frontmatter and lists commands (supports discovery + grouping) |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `CommandRegistry Integration` ; ts: `ccw/src/tools/command-registry.ts` / `export class CommandRegistry {` | `Test-Path ccw/src/tools/command-registry.ts` | reusable pattern for scanning/parsing command docs into metadata used for chain recommendation |
| `ccw/src/core/routes/cli-routes.ts` | Existing | docs: `.claude/commands/ccw-debug.md` / `Phase 2: Select Debug Strategy & Build Command Chain` ; ts: `ccw/src/core/routes/cli-routes.ts` / `executeCliTool({` | `Test-Path ccw/src/core/routes/cli-routes.ts` | supports invoking CLI tooling for analysis/recommendations and chained workflows |
| `.workflow/.ccw-debug/{session_id}/status.json` | Planned | docs: `.claude/commands/ccw-debug.md` / `Phase 4: Setup TODO Tracking & Status File` ; ts: `ccw/src/commands/hook.ts` / `ccw hook parse-status --path .workflow/.ccw/ccw-123/status.json` | `rg \"parse-status --path \\.workflow/\\.ccw/ccw-123/status\\.json\" ccw/src/commands/hook.ts` | planned state persistence for ccw-debug sessions; use existing `.workflow/*/status.json` parsing patterns |

## Execution Process

1. Phase 1: Analyze Issue
   - Extract: symptoms, repro, affected components, environment
   - Assess: `error_type`, `clarity (0-3)`, `complexity`, `scope`
   - If `clarity < 2`, go to Phase 1.5
2. Phase 1.5: Issue Clarification (if needed)
   - Ask targeted questions (symptoms, when it occurs, reproducibility, affected components)
   - Re-assess clarity/complexity
3. Phase 2: Select Debug Strategy & Build Command Chain
   - Mode detection priority:
     - explicit `--mode`
     - input keywords / explicit user intent
     - fallback based on clarity/complexity
   - Build chain mapping:
     - `cli`: `ccw cli` analysis + recommendations; do not auto-apply changes
     - `debug`: `/workflow:debug-with-file` -> `/workflow:test-fix-gen` -> `/workflow:test-cycle-execute`
     - `test`: `/workflow:test-fix-gen` -> `/workflow:test-cycle-execute`
     - `bidirectional`: run debug + test in parallel, then merge findings
4. Phase 3: User Confirmation (skippable with `-y`)
   - Present: selected mode, strategy rationale, and full chain
   - User choices: confirm, change mode (back to Phase 2), cancel
5. Phase 4: Setup TODO Tracking & Status File
   - Create session id and session folder under `.workflow/.ccw-debug/`
   - Initialize `status.json` with issue analysis + chain plan
   - Create TodoWrite items with `CCWD:{mode}` prefix and per-step status
6. Phase 5: Execute Debug Chain
   - Sequential modes: execute each command, update TodoWrite + `status.json`
   - Bidirectional: execute debug/test subchains in parallel; merge findings; update `status.json`
   - CLI mode escalation: after analysis, ask whether to escalate into `debug` or `test`

## Error Handling

- Missing/empty bug description: ask for minimum repro + error output before selecting a strategy
- Invalid `--mode`: list accepted values and re-prompt
- Command execution failure:
  - capture stderr/summary into `status.json` and TodoWrite
  - provide next-step options: retry, change mode, reduce scope, run CLI analysis
- Parallel (bidirectional) failures:
  - isolate failing branch (debug vs test), continue with the other when safe
  - merge findings with explicit confidence level per branch
- State persistence errors (IO/permission):
  - continue in-memory; inform user that resume will be unavailable until fixed

## Examples

```bash
/ccw-debug "Login timeout occurs only in staging; error: ECONNRESET from auth service. Steps: ... Logs: ..."
```

```bash
/ccw-debug --mode test "Unit tests started failing after refactor; stack trace: ..."
```

```bash
/ccw-debug -y --mode cli "Quick diagnosis: build failing on CI with TypeScript error TS2322 in ..."
```

