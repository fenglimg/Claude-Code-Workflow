---
name: debug-with-file
description: Interactive hypothesis-driven debugging with documented exploration, understanding evolution, and Gemini-assisted correction
argument-hint: "[-y|--yes] \"bug description or error message\""
allowed-tools: TodoWrite(*), Task(*), AskUserQuestion(*), Read(*), Grep(*), Glob(*), Bash(*), Edit(*), Write(*)
group: workflow
---

# Workflow Debug-With-File Command

## Overview

- Goal: Evidence-based debugging with durable session artifacts (understanding timeline + NDJSON debug log) and explicit correction of wrong assumptions.
- Command: `/workflow:debug-with-file`
- Auto mode: when `-y/--yes`, auto-confirm hypotheses, instrumentation, and recommended fix/verify steps.

## Usage

```bash
/workflow:debug-with-file [-y|--yes] "<bug description or error message>"
```

## Inputs

- Required inputs:
  - Bug description, error message, or stack trace (single string)
- Optional inputs:
  - `-y/--yes` to auto-confirm recommended decisions and defaults

## Outputs / Artifacts

- Writes:
  - `.workflow/.debug/DBG-<bugSlug>-<YYYY-MM-DD>/understanding.md` (timeline + consolidated understanding)
  - `.workflow/.debug/DBG-<bugSlug>-<YYYY-MM-DD>/debug.log` (NDJSON evidence log from temporary instrumentation)
  - `.workflow/.debug/DBG-<bugSlug>-<YYYY-MM-DD>/hypotheses.json` (testable hypotheses + verdicts)
- Reads:
  - Project source files (to locate error + place/remove instrumentation)
  - Existing session artifacts (if resuming): `understanding.md`, `debug.log`, `hypotheses.json`

## Implementation Pointers

- Command doc: `.claude/commands/workflow/debug-with-file.md`
- Likely code locations:
  - `ccw/src/tools/command-registry.ts` (command metadata scanning / listing)
  - `ccw/src/commands/cli.ts` (unified CLI executor used by docs via `ccw cli -p ...`)
  - `ccw/src/commands/loop.ts` (existing `.workflow/*` path conventions)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/debug-with-file.md` | Existing | docs: `.claude/commands/workflow/debug-with-file.md / Overview` ; ts: `ccw/src/tools/command-registry.ts / // Normalize command name` | `Test-Path .claude/commands/workflow/debug-with-file.md` | primary command doc target for CCW execution |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md / CommandRegistry Integration` ; ts: `ccw/src/tools/command-registry.ts / export class CommandRegistry` | `Test-Path ccw/src/tools/command-registry.ts` | shared mechanism for discovering `/workflow:*` commands and their YAML headers |
| `ccw/src/commands/cli.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md / CLI Invocation Format` ; ts: `ccw/src/commands/cli.ts / Usage: ccw cli -p "<prompt>" --tool gemini` | `Test-Path ccw/src/commands/cli.ts` | backing implementation for `ccw cli -p ... --tool ... --mode ...` calls referenced by the workflow docs |
| `.workflow/.debug` | Planned | docs: `.claude/commands/workflow/debug-with-file.md / Session Folder Structure` ; ts: `ccw/src/commands/loop.ts / join(currentCwd, '.workflow'` | `Test-Path .workflow/.debug` | session root for debug-with-file artifacts (created on first run) |
| `.workflow/.debug/DBG-<bugSlug>-<YYYY-MM-DD>/understanding.md` | Planned | docs: `.claude/commands/workflow/debug-with-file.md / Understanding Document Template` ; ts: `ccw/src/commands/loop.ts / join(currentCwd, '.workflow'` | `Test-Path .workflow/.debug/DBG-<bugSlug>-<YYYY-MM-DD>/understanding.md` | durable understanding timeline + consolidation + corrections |
| `.workflow/.debug/DBG-<bugSlug>-<YYYY-MM-DD>/debug.log` | Planned | docs: `.claude/commands/workflow/debug-with-file.md / Execution Process` ; ts: `ccw/src/commands/loop.ts / join(currentCwd, '.workflow'` | `Test-Path .workflow/.debug/DBG-<bugSlug>-<YYYY-MM-DD>/debug.log` | NDJSON evidence log used to validate/reject hypotheses |

## Execution Process

1. Session setup + mode detection
   - Derive `bugSlug` from bug description; build session ID: `DBG-<bugSlug>-<YYYY-MM-DD>`.
   - If session folder exists:
     - If `debug.log` has content: enter Analyze mode.
     - Else if `understanding.md` exists: Continue mode.
     - Else: Explore mode.
2. Explore mode (first pass / no usable log yet)
   - Locate likely source of the bug (files, functions, call sites).
   - Write initial understanding to `understanding.md` (Iteration 1).
   - Propose testable hypotheses (each with evidence to collect).
   - Add temporary, minimal debug logging (NDJSON lines keyed by hypothesis ID).
   - Ask user to reproduce and provide/confirm `debug.log` contents.
3. Analyze mode (log-driven)
   - Parse NDJSON `debug.log`, group evidence by hypothesis.
   - For each hypothesis: verdict = confirmed | rejected | inconclusive (with rationale).
   - Update `understanding.md` with:
     - Corrected Understanding (explicitly mark wrong -> corrected)
     - Consolidated Understanding (what we know / disproven / focus / remaining questions)
4. Fix + verify
   - Apply smallest safe change(s) to resolve root cause.
   - Verify with tests/repro steps and update artifacts.
   - Remove temporary instrumentation and ensure logs do not contain sensitive content.

## Error Handling

- If session folder exists but artifacts are missing/corrupt: fall back to Explore mode and recreate artifacts.
- If `debug.log` contains invalid JSON lines: skip bad lines, report line numbers, and continue with remaining evidence.
- If no reproduction is available: switch to static analysis + targeted assertions/tests, and record limitation in `understanding.md`.
- If proposed instrumentation is risky (PII/secrets, performance, behavior): propose safer alternatives and require confirmation unless `-y`.

## Examples

```bash
/workflow:debug-with-file "TypeError: Cannot read properties of undefined (reading 'x')"
```

```bash
/workflow:debug-with-file -y "Crash when saving settings after upgrading to v2.3"
```
