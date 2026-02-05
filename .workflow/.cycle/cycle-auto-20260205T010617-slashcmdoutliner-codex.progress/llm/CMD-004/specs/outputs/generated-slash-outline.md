---
name: ccw-test
description: Test coordinator - analyze testing needs, select test strategy, execute test workflow in main process
argument-hint: "[--mode gen|fix|verify|tdd] [--yes|-y] \"test description\""
allowed-tools: Skill(*), TodoWrite(*), AskUserQuestion(*), Read(*), Bash(*)
group: other
---

# CCW-Test Command - Test Coordinator

## Overview

- Goal: Coordinate testing (gen/fix/verify/tdd) by selecting a mode, building a command chain, tracking progress, and executing the chain in the main process.
- Command: `/ccw-test`

## Usage

```bash
/ccw-test [--mode gen|fix|verify|tdd] [--yes|-y] "test description"
```

## Inputs

- Required inputs:
  - A single test request string: `"test description"`
- Optional inputs:
  - `--mode gen|fix|verify|tdd` (explicit mode selection)
  - `--yes|-y` (skip confirmation prompts where applicable)
  - Optional config flags supported by the workflow (if implemented): `--target`, `--max-iterations`, `--pass-threshold`

## Outputs / Artifacts

- Writes:
  - `.workflow/.ccw-test/<session_id>/status.json` (planned runtime artifact)
- Reads:
  - Project source/tests as needed (via `Read`/`Bash`)
  - Workflow subcommand docs (invoked via `Skill`): `.claude/commands/workflow/*.md`

## Implementation Pointers

- Command doc: `.claude/commands/ccw-test.md`
- Likely code locations:
  - `ccw/src/core/routes/commands-routes.ts` (dashboard API parses command frontmatter, including `allowed-tools`)
  - `ccw/src/core/routes/ccw-routes.ts` (CCW routes reference `.workflow` as the project workflow directory)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/ccw-test.md` | Existing | docs: `.claude/commands/ccw-test.md` / CCW-Test Command - Test Coordinator ; ts: `ccw/src/core/routes/commands-routes.ts` / function parseCommandFrontmatter(content: string): CommandMetadata { | `Test-Path .claude/commands/ccw-test.md` | Source of truth for the command behavior and required sections |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/ccw-test.md` / Usage ; ts: `ccw/src/core/routes/commands-routes.ts` / function parseCommandFrontmatter(content: string): CommandMetadata { | `Test-Path ccw/src/core/routes/commands-routes.ts` | Confirms command docs are parsed/served with frontmatter (name/description/allowed-tools/group) |
| `.workflow/.ccw-test/<session_id>/status.json` | Planned | docs: `.claude/commands/ccw-test.md` / Phase 4: Setup TODO Tracking & Status File ; ts: `ccw/src/core/routes/ccw-routes.ts` / const workflowDir = join(resolvedPath, '.workflow'); | `Test-Path .workflow/.ccw-test` | Runtime state tracking artifact for sessions; directory/file created by the command workflow |

Notes:
- One row per pointer (no aggregated cells).
- For TS evidence, use a literal anchor string that exists in the file.

## Execution Process

1. Phase 1: Analyze testing needs
   - Parse the user request to infer: goal (gen/fix/verify/tdd), target module/files, test framework hints, coverage target, whether existing tests exist.
2. Phase 1.5: Clarification (if needed)
   - If goal/target/framework are unclear, ask minimal questions (AskUserQuestion), then update the analysis summary.
3. Phase 2: Select test strategy & build command chain
   - Map mode -> command chain:
     - gen: `/workflow:test-fix-gen` (generate only)
     - fix: `/workflow:test-fix-gen` -> `/workflow:test-cycle-execute` (auto-iterate)
     - verify: execute existing tests -> coverage report (as defined by available workflow commands)
     - tdd: tdd plan -> execute -> verify (as defined by available workflow commands)
4. Phase 3: User confirmation (skippable with `--yes|-y`)
   - Show the mode, chain, and key thresholds (pass rate target / iteration cap). Allow mode change or cancel.
5. Phase 4: Setup TODO tracking & status file
   - Create a session id and initialize `.workflow/.ccw-test/<session_id>/status.json`.
   - Initialize TodoWrite items using a stable prefix (e.g. `CCWT:<mode>:`) and keep them updated through execution.
6. Phase 5: Execute the chain
   - For each step: update status.json -> run step via Skill -> update test metrics and TodoWrite.
   - Fix mode: iterate until pass_rate >= threshold or max iterations reached.

## Error Handling

- If a subcommand fails:
  - Record failure context in status.json (planned), keep TodoWrite accurate, and ask user whether to Retry/Skip/Abort.
  - If aborting: mark session status as failed and stop further commands.

## Examples

```bash
# Auto-select mode
/ccw-test "Test user authentication module"

# Explicit mode selection
/ccw-test --mode gen "Generate tests for payment module"
/ccw-test --mode fix "Fix failing authentication tests"
/ccw-test --mode verify "Validate current test suite"
/ccw-test --mode tdd "Implement user profile with TDD"

# Auto mode (skip confirmations)
/ccw-test --yes "Quick test validation"
```
