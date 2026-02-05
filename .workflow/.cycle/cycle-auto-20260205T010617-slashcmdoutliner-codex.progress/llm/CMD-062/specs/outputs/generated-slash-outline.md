---
name: task-generate-tdd
description: Autonomous TDD task generation using action-planning-agent with Red-Green-Refactor cycles, test-first structure, and cycle validation
argument-hint: "[-y|--yes] --session WFS-session-id"
allowed-tools: Task(action-planning-agent), AskUserQuestion(*), Read(*), Write(*), Glob(*), Bash(*), mcp__ace-tool__search_context(*)
group: workflow:tools
---

# Autonomous TDD Task Generation Command

## Overview

- Goal: Generate TDD planning artifacts for a workflow session (IMPL_PLAN.md + IMPL-*.json + TODO_LIST.md) with quantified Red-Green-Refactor cycles.
- Command: `/workflow:tools:task-generate-tdd`

## Usage

```bash
/workflow:tools:task-generate-tdd --session WFS-<session-id> [-y|--yes]
```

## Inputs

- Required inputs:
  - `--session WFS-<session-id>`
- Optional inputs:
  - `-y|--yes`: auto mode (skip interactive configuration; use defaults)

## Outputs / Artifacts

- Writes:
  - `.workflow/active/{session-id}/IMPL_PLAN.md`
  - `.workflow/active/{session-id}/.task/IMPL-*.json`
  - `.workflow/active/{session-id}/TODO_LIST.md`
- Reads:
  - `.workflow/active/{session-id}/.process/context-package.json`
  - `.workflow/active/{session-id}/.process/ANALYSIS_RESULTS.md` (if present)
  - `.workflow/active/{session-id}/.process/test-context-package.json` (if present)

## Implementation Pointers

- Command doc: `.claude/commands/workflow/tools/task-generate-tdd.md`
- Likely code locations:
  - `.claude/agents/action-planning-agent.md`
  - `.claude/commands/workflow/tdd-plan.md`
  - `ccw/src/tools/command-registry.ts`
  - `ccw/src/tools/session-manager.ts`
  - `ccw/src/commands/session-path-resolver.ts`
  - `ccw/src/core/session-scanner.ts`

### Evidence (Existing vs Planned)

You MUST label each pointer as `Existing` (verifiable in repo now) or `Planned` (will be created/modified).

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/tools/task-generate-tdd.md` | Existing | docs: `.claude/commands/workflow/tools/task-generate-tdd.md` / `Overview` ; ts: `ccw/src/tools/command-registry.ts` / `Auto-detect ~/.claude/commands/workflow directory` | `Test-Path .claude/commands/workflow/tools/task-generate-tdd.md` | Canonical behavior + headings for the tool command |
| `.claude/agents/action-planning-agent.md` | Existing | docs: `.claude/commands/workflow/tools/task-generate-tdd.md` / `Phase 2: Agent Execution (TDD Document Generation)` ; ts: `ccw/src/core/routes/skills-routes.ts` / `executeCliTool({` | `Test-Path .claude/agents/action-planning-agent.md` | Agent contract for producing planning artifacts (planning-only) |
| `.claude/workflows/cli-templates/prompts/workflow-impl-plan-template.txt` | Existing | docs: `.claude/commands/workflow/tools/task-generate-tdd.md` / `IMPL_PLAN.md (TDD Variant)` ; ts: `ccw/src/commands/session-path-resolver.ts` / `'IMPL_PLAN.md': 'plan'` | `Test-Path .claude/workflows/cli-templates/prompts/workflow-impl-plan-template.txt` | Template source for IMPL_PLAN.md structure |
| `.workflow/active/{session-id}/IMPL_PLAN.md` | Planned | docs: `.claude/commands/workflow/tools/task-generate-tdd.md` / `SESSION PATHS` ; ts: `ccw/src/tools/session-manager.ts` / `plan: '{base}/IMPL_PLAN.md',` | `Test-Path .workflow/active` | Primary planning artifact written per session |
| `.workflow/active/{session-id}/.task/IMPL-*.json` | Planned | docs: `.claude/commands/workflow/tools/task-generate-tdd.md` / `1. TDD Task JSON Files (.task/IMPL-*.json)` ; ts: `ccw/src/core/session-scanner.ts` / `glob('IMPL-*.json', { cwd: taskDir, absolute: false })` | `Test-Path ccw/src/core/session-scanner.ts` | Task definitions (each contains internal Red-Green-Refactor cycle) |
| `.workflow/active/{session-id}/TODO_LIST.md` | Planned | docs: `.claude/commands/workflow/tools/task-generate-tdd.md` / `3. TODO_LIST.md` ; ts: `ccw/src/tools/session-manager.ts` / `todo: '{base}/TODO_LIST.md',` | `Test-Path ccw/src/tools/session-manager.ts` | Human-readable TODOs mirroring task plan and phases |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/tools/task-generate-tdd.md` / `Integration & Usage` ; ts: `ccw/src/tools/command-registry.ts` / `Auto-detect ~/.claude/commands/workflow directory` | `Test-Path ccw/src/tools/command-registry.ts` | How workflow command docs are discovered and exposed to tooling/UI |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/tools/task-generate-tdd.md` / `SESSION PATHS` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path ccw/src/tools/session-manager.ts` | Session root and canonical artifact paths |
| `ccw/src/commands/session-path-resolver.ts` | Existing | docs: `.claude/commands/workflow/tools/task-generate-tdd.md` / `Output Files Structure` ; ts: `ccw/src/commands/session-path-resolver.ts` / `'.task/': 'task'` | `Test-Path ccw/src/commands/session-path-resolver.ts` | File-type resolution for session artifacts (plan/todo/task) |
| `ccw/src/core/session-scanner.ts` | Existing | docs: `.claude/commands/workflow/tools/task-generate-tdd.md` / `Validation Rules` ; ts: `ccw/src/core/session-scanner.ts` / `glob('IMPL-*.json', { cwd: taskDir, absolute: false })` | `Test-Path ccw/src/core/session-scanner.ts` | Task file discovery (`IMPL-*.json`) used by session tooling |

Notes:
- For each `Existing` pointer: evidence must be dual-source (docs + TS) and verifiable in-repo.
- For `Planned` pointers: keep the pointer as an output artifact path (do not claim it exists before running).

## Execution Process

1. Parse args + validate session id
   - Require `--session WFS-<session-id>`.
   - If missing/invalid: error with usage hint.
2. Phase 0: User configuration (skippable with `-y|--yes`)
   - Ask for any required preferences that influence task structure (e.g., desired test framework conventions, execution strategy hints).
3. Phase 1: Context preparation & discovery
   - Resolve `.workflow/active/{session-id}` and verify the session exists.
   - Load context package: `.process/context-package.json`.
   - Optionally load test context and prior analysis if present.
4. Phase 2: Agent execution (planning artifacts only)
   - Invoke `action-planning-agent` to generate:
     - `.task/IMPL-*.json` tasks (each contains internal `red|green|refactor` phases)
     - `IMPL_PLAN.md` (TDD variant)
     - `TODO_LIST.md` (mirrors plan with phase indicators)
5. Validation (P0)
   - Enforce task limits (<= 18 tasks) and required metadata (quantification + TDD phases).
   - Verify artifacts are written under the session folder.
6. Output summary
   - Report counts: number of tasks, number of cycles, and key configuration choices.

## Error Handling

- Input validation errors:
  - Missing `--session`: print usage and stop.
  - Session folder missing: instruct user to initialize/start session first.
- TDD generation errors:
  - Task count exceeds 18: instruct user to merge features or split into multiple sessions.
  - Missing test framework signals in context: ask user for defaults or require test context gather step.
  - Invalid TDD structure: reject tasks missing internal `red|green|refactor` indicators and required quantification fields.

## Examples

```bash
/workflow:tools:task-generate-tdd --session WFS-auth
```

```bash
/workflow:tools:task-generate-tdd -y --session WFS-auth
```

```bash
/workflow:tools:task-generate-tdd --session WFS-payments-tdd
```

