---
name: test-cycle-execute
description: Execute test-fix workflow with dynamic task generation and iterative fix cycles until test pass rate >= 95% or max iterations reached. Uses @cli-planning-agent for failure analysis and task generation.
argument-hint: "[--resume-session=\"session-id\"] [--max-iterations=N]"
allowed-tools: Skill(*), TodoWrite(*), Read(*), Bash(*), Task(*)
group: workflow
---

# Workflow Test-Cycle-Execute

## Overview

- Goal: Iteratively run tests, analyze failures, generate fix tasks, apply fixes, and re-test until pass rate >= 95% (criticality-aware) or max iterations reached.
- Command: `/workflow:test-cycle-execute`

## Usage

```bash
/workflow:test-cycle-execute [--resume-session="session-id"] [--max-iterations=N]
```

## Inputs

- Required inputs:
  - An active workflow test session (auto-discovered under `.workflow/active/`) containing initial `IMPL-*.json` tasks.
- Optional inputs:
  - `--resume-session="session-id"`: Skip discovery and load the specified session state to continue.
  - `--max-iterations=N`: Override default max iterations (default: 10).

## Outputs / Artifacts

- Writes:
  - `.workflow/active/<session>/.task/IMPL-fix-<N>.json` (generated fix tasks)
  - `.workflow/active/<session>/.process/iteration-state.json`
  - `.workflow/active/<session>/.process/test-results.json`
  - `.workflow/active/<session>/.process/iteration-<N>-analysis.md`
  - `.workflow/active/<session>/.process/iteration-<N>-cli-output.txt`
  - `.workflow/active/<session>/TODO_LIST.md` (TodoWrite updates)
- Reads:
  - `.workflow/active/<session>/.task/IMPL-*.json`
  - `.workflow/active/<session>/.process/iteration-state.json` (resume + trend checks)
  - `.workflow/active/<session>/.process/test-results.json` (pass rate + criticality)

## Implementation Pointers

- Command doc: `.claude/commands/workflow/test-cycle-execute.md`
- Likely code locations:
  - `ccw/src/tools/command-registry.ts` (command doc discovery/metadata)
  - `ccw/src/tools/session-manager.ts` (session path conventions + file routing)
  - `ccw/src/tools/cli-executor-core.ts` (Gemini/Qwen/Codex CLI execution + resume)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/test-cycle-execute.md` | Existing | docs: `.claude/commands/workflow/test-cycle-execute.md` / `Workflow Test-Cycle-Execute Command` ; ts: `ccw/src/tools/command-registry.ts` / `const relativePath = join('.claude', 'commands', 'workflow')` | `Test-Path .claude/commands/workflow/test-cycle-execute.md; rg "name: test-cycle-execute" .claude/commands/workflow/test-cycle-execute.md` | Primary command doc to implement/evolve |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/test-cycle-execute.md` / `Quick Start` ; ts: `ccw/src/tools/command-registry.ts` / `export class CommandRegistry {` | `Test-Path ccw/src/tools/command-registry.ts; rg "export class CommandRegistry" ccw/src/tools/command-registry.ts` | Registry used to scan/parse command frontmatter |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/test-cycle-execute.md` / `Session File Structure` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active'` | `Test-Path ccw/src/tools/session-manager.ts; rg \"const ACTIVE_BASE = '\\.workflow/active'\" ccw/src/tools/session-manager.ts` | Canonical location + routing for workflow session artifacts |
| `ccw/src/tools/cli-executor-core.ts` | Existing | docs: `.claude/commands/workflow/test-cycle-execute.md` / `CLI Tool Configuration` ; ts: `ccw/src/tools/cli-executor-core.ts` / `Supports Gemini, Qwen, and Codex with streaming output` | `Test-Path ccw/src/tools/cli-executor-core.ts; rg \"Supports Gemini, Qwen, and Codex with streaming output\" ccw/src/tools/cli-executor-core.ts` | Provides deterministic CLI execution surface for analysis/generation steps |
| `.workflow/active/<session>/.process/iteration-state.json` | Planned | docs: `.claude/commands/workflow/test-cycle-execute.md` / `Iteration State JSON` ; ts: `ccw/src/tools/session-manager.ts` / `process: '{base}/.process/{filename}'` | `rg \"process: '\\{base\\}/\\.process/\\{filename\\}'\" ccw/src/tools/session-manager.ts` | Runtime state file for resume, trends, and strategy selection |

## Execution Process

1. Discover or resume session
   - If `--resume-session` present: load that session id, then load `.process/iteration-state.json` (if present) and current task queue.
   - Else: auto-discover active test session under `.workflow/active/`.
2. Main loop (until completion or iteration cap)
   - For each active task:
     - Run tests (progressive/affected-tests when available; full suite on final validation).
     - Compute pass rate and assess failure criticality.
     - If pass rate >= 95% and failures are low criticality: proceed; else enter fix loop.
3. Fix loop (bounded by max iterations)
   - Ask `@cli-planning-agent` (via `Task`) to analyze failures and generate `IMPL-fix-<N>.json` (including modification points + affected tests).
   - Ask `@test-fix-agent` (via `Task`) to apply fixes and rerun tests, writing updated results/state.
4. Completion
   - Success: pass rate reaches threshold and tasks complete; write summary notes and close out TodoWrite state.
   - Failure: max iterations reached without threshold; produce a failure report and stop.

## Error Handling

- Session not found: explain discovery rules and ask for explicit `--resume-session`.
- Invalid iteration/task JSON: stop and request regeneration (do not proceed with partial/invalid state).
- CLI execution failure: follow the configured fallback chain; persist logs/artifacts before retry.
- Test runner failure (non-test errors): capture output, retry once with reduced scope, then stop with actionable message.
- Safety: do not run destructive git operations (reset/revert) unless explicitly requested/opted-in.

## Examples

```bash
# Execute test-fix workflow (auto-discovers active session)
/workflow:test-cycle-execute

# Resume interrupted session
/workflow:test-cycle-execute --resume-session="WFS-test-user-auth"

# Custom iteration limit (default: 10)
/workflow:test-cycle-execute --max-iterations=15
```

