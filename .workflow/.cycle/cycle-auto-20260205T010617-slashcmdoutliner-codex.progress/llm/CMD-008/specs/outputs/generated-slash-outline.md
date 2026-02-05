---
name: codex-coordinator
description: Command orchestration tool for Codex - analyze requirements, recommend command chain, execute sequentially with state persistence
argument-hint: "TASK=\"<task description>\" [--depth=standard|deep] [--auto-confirm] [--verbose]"
allowed-tools: AskUserQuestion(*), Read(*), Write(*), Bash(*), Glob(*), Grep(*)
group: other
---

# Codex Coordinator

## Overview

- Goal: Analyze a task, recommend an atomic Codex command pipeline (minimum execution units), confirm, then execute sequentially with resumable state.
- Command: `/codex-coordinator` (top-level)

## Usage

```bash
/codex-coordinator TASK="<task description>" [--depth=standard|deep] [--auto-confirm] [--verbose]
```

## Inputs

- Required inputs:
  - `TASK`: task description
- Optional inputs:
  - `--depth`: `standard|deep` (deep mode emphasizes evidence + pointer verification in outputs)
  - `--auto-confirm`: skip the confirmation gate and start execution immediately
  - `--verbose`: include routing details, recommended chain rationale, and state diffs

## Outputs / Artifacts

- Writes:
  - `.workflow/.codex-coordinator/<session-id>/state.json` (planned; persisted execution + resume state)
  - `.workflow/.codex-coordinator/<session-id>/runs.jsonl` (planned; append-only per-step logs)
- Reads:
  - `.codex/prompts/*.md` (Codex command catalog)
  - `.workflow/.codex-coordinator/<session-id>/state.json` (resume)

## Implementation Pointers

- Command doc: `.claude/commands/codex-coordinator.md`
- Likely code locations:
  - `.codex/prompts/issue-plan.md` (planning / issue lifecycle)
  - `.codex/prompts/unified-execute-with-file.md` (execution runner used by the chain)
  - `ccw/src/commands/cli.ts` (how `ccw cli -p ... --tool codex` is invoked)
  - `ccw/src/commands/workflow.ts` (codex prompt installation surface: `.codex/prompts`)
  - `ccw/src/commands/hook.ts` (hook utilities for parsing `.workflow/.../*.json` status/state)
  - `ccw/src/tools/loop-manager.ts` (sequential step execution loop pattern)
  - `ccw/src/tools/codex-prompt-registry.ts` (planned; codex prompt discovery helper mirroring CommandRegistry)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/codex-coordinator.md` | Existing | docs: .claude/commands/codex-coordinator.md / Codex Coordinator Command ; ts: ccw/src/commands/cli.ts / ccw cli -p | Test-Path .claude/commands/codex-coordinator.md | Slash command doc (oracle) that defines the intended behavior and headings |
| `.codex/prompts/issue-plan.md` | Existing | docs: .claude/commands/codex-coordinator.md / Discovery Commands ; ts: ccw/src/commands/workflow.ts / .codex/prompts | Test-Path .codex/prompts/issue-plan.md | A concrete Codex command that appears in recommended chains (issue workflow) |
| `.codex/prompts/unified-execute-with-file.md` | Existing | docs: .claude/commands/codex-coordinator.md / Execution Commands ; ts: ccw/src/commands/cli.ts / --tool codex | Test-Path .codex/prompts/unified-execute-with-file.md | Execution primitive for running the planned steps with file-based state |
| `ccw/src/commands/cli.ts` | Existing | docs: .claude/commands/codex-coordinator.md / Command Invocation Format ; ts: ccw/src/commands/cli.ts / ccw cli -p | Test-Path ccw/src/commands/cli.ts ; rg "ccw cli -p" ccw/src/commands/cli.ts | Provides the CLI runner surface used to execute Codex via `--tool codex` |
| `ccw/src/commands/workflow.ts` | Existing | docs: .claude/commands/codex-coordinator.md / Available Codex Commands (Discovery) ; ts: ccw/src/commands/workflow.ts / .codex/prompts | Test-Path ccw/src/commands/workflow.ts ; rg "\.codex/prompts" ccw/src/commands/workflow.ts | Establishes that `.codex/prompts` is an explicit workflow source and can be enumerated |
| `.workflow/.codex-coordinator/<session-id>/state.json` | Planned | docs: .claude/commands/codex-coordinator.md / State File Structure ; ts: ccw/src/commands/hook.ts / .workflow/.ccw/ccw-123/status.json | rg "State File Structure" .claude/commands/codex-coordinator.md | New coordinator state file for resume + progress; reuse existing hook/status parsing conventions |
| `ccw/src/commands/hook.ts` | Existing | docs: .claude/commands/codex-coordinator.md / Session Management ; ts: ccw/src/commands/hook.ts / .workflow/.ccw/ccw-123/status.json | Test-Path ccw/src/commands/hook.ts ; rg "\.workflow/\.ccw/ccw-123/status\.json" ccw/src/commands/hook.ts | Reuse/align with existing hook tooling for tracking/resuming long-running flows |
| `ccw/src/tools/loop-manager.ts` | Existing | docs: .claude/commands/codex-coordinator.md / Phase 3: Execute Sequential Command Chain ; ts: ccw/src/tools/loop-manager.ts / setImmediate(() => this.runNextStep(loopId) | Test-Path ccw/src/tools/loop-manager.ts ; rg "setImmediate\(\(\) => this\.runNextStep\(loopId\)" ccw/src/tools/loop-manager.ts | Reference for a robust sequential multi-step executor that persists state between steps |
| `ccw/src/tools/codex-prompt-registry.ts` | Planned | docs: .claude/commands/codex-coordinator.md / Available Codex Commands (Discovery) ; ts: ccw/src/tools/command-registry.ts / export class CommandRegistry | Test-Path ccw/src/tools/codex-prompt-registry.ts | Implement prompt discovery similar to `CommandRegistry`, but for `.codex/prompts/*.md` |

## Execution Process

1. Parse args: `TASK`, `--depth`, `--auto-confirm`, `--verbose`.
2. Phase 1 (Analyze Requirements): classify task type + complexity; extract constraints.
3. Phase 2 (Discover + Recommend):
   - enumerate available Codex prompts from `.codex/prompts/*.md` (and optionally the installed `~/.codex/prompts` mirror if present)
   - map candidate commands to Minimum Execution Units (atomic groups)
   - recommend a single chain (and optionally 1-2 alternatives in `--verbose`)
4. Phase 2b (Confirm): display pipeline with unit boundaries; ask for confirmation unless `--auto-confirm`.
5. Phase 3 (Execute Sequential Chain):
   - create session dir `.workflow/.codex-coordinator/<session-id>/`
   - persist initial `state.json` immediately after confirmation
   - execute steps one-by-one; after each step, append to `runs.jsonl` and update `state.json`
6. Completion: mark state as completed/failed; print artifacts and resume instructions.

## Error Handling

- Validate required `TASK` and flag values; show usage on invalid input.
- Unknown/unsupported task type: default to a safe feature pipeline (plan -> execute) and explain why.
- Command not found (prompt missing): fail before execution with a suggested closest-match prompt.
- Step failure:
  - record error in `runs.jsonl` + `state.json`
  - offer: retry step / skip step (only if it does not violate atomic unit rules) / abort
- Resume:
  - if `state.json` exists for a session, continue from first pending step.

## Examples

```bash
/codex-coordinator TASK="Generate issues for src/auth/** then execute fixes" --depth=deep

/codex-coordinator TASK="Quickly fix failing unit tests" --auto-confirm
```