---
name: task-generate-agent
description: Generate implementation plan documents (IMPL_PLAN.md, task JSONs, TODO_LIST.md) using action-planning-agent - produces planning artifacts, does NOT execute code implementation
argument-hint: "[-y|--yes] --session WFS-session-id"
allowed-tools: Read(*), Write(*), Edit(*), AskUserQuestion(*), Task(*)
group: workflow
---

# workflow:tools:task-generate-agent

## Overview

- Goal: Generate planning artifacts (IMPL_PLAN.md, TODO_LIST.md, .task task JSONs) for a workflow session by delegating planning to action-planning-agent; do not implement code.
- Command: `/workflow:tools:task-generate-agent`

## Usage

```bash
/workflow:tools:task-generate-agent --session WFS-session-id
```

## Inputs

- Required inputs:
  - `--session WFS-session-id`
- Optional inputs:
  - `-y|--yes` (auto mode; skip questions, use defaults)

## Outputs / Artifacts

- Writes:
  - `.workflow/active/WFS-{session-id}/IMPL_PLAN.md`
  - `.workflow/active/WFS-{session-id}/TODO_LIST.md`
  - `.workflow/active/WFS-{session-id}/.task/IMPL-*.json`
  - `.workflow/active/WFS-{session-id}/planning-notes.md` (append-only planning record)
- Reads:
  - `.workflow/active/WFS-{session-id}/workflow-session.json`
  - `.workflow/active/WFS-{session-id}/.process/context-package.json`
  - `.workflow/active/WFS-{session-id}/.process/conflict-resolution.json` (if present)

## Implementation Pointers

- Command doc: `.claude/commands/workflow/tools/task-generate-agent.md`
- Likely code locations:
  - `ccw/src/tools/ask-question.ts` (interactive config surface)
  - `ccw/src/tools/session-manager.ts` (session path routing for plan/todo/task artifacts)
  - `ccw/src/tools/command-registry.ts` (command metadata parsing; if used by UI/registry flows)

### Evidence (Existing vs Planned)

You MUST label each pointer as `Existing` (verifiable in repo now) or `Planned` (will be created/modified).

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/tools/task-generate-agent.md` | Existing | docs: `.claude/commands/workflow/tools/task-generate-agent.md` / `Execution Process` ; ts: `ccw/src/tools/command-registry.ts` / `const relativePath = join('.claude', 'commands', 'workflow');` | `Test-Path .claude/commands/workflow/tools/task-generate-agent.md` | Oracle command doc + primary behavior reference |
| `ccw/src/tools/ask-question.ts` | Existing | docs: `.claude/commands/workflow/tools/task-generate-agent.md` / `Document Generation Lifecycle` ; ts: `ccw/src/tools/ask-question.ts` / `name: 'ask_question',` | `Test-Path ccw/src/tools/ask-question.ts` | Interactive Phase 0 questions surface |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/tools/task-generate-agent.md` / `Execution Process` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path ccw/src/tools/session-manager.ts` | Canonical session storage + routing for plan/todo/task artifacts |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/tools/task-generate-agent.md` / `Overview` ; ts: `ccw/src/tools/command-registry.ts` / `export class CommandRegistry {` | `Test-Path ccw/src/tools/command-registry.ts` | Command metadata parsing/lookup (frontmatter) |
| `.workflow/active/WFS-{session-id}/IMPL_PLAN.md` | Planned | docs: `.claude/commands/workflow/tools/task-generate-agent.md` / `Execution Process` ; ts: `ccw/src/tools/session-manager.ts` / `plan: '{base}/IMPL_PLAN.md',` |  | Primary planning document output |
| `.workflow/active/WFS-{session-id}/TODO_LIST.md` | Planned | docs: `.claude/commands/workflow/tools/task-generate-agent.md` / `Execution Process` ; ts: `ccw/src/tools/session-manager.ts` / `todo: '{base}/TODO_LIST.md',` |  | Human-friendly checklist output |
| `.workflow/active/WFS-{session-id}/.task/IMPL-*.json` | Planned | docs: `.claude/commands/workflow/tools/task-generate-agent.md` / `Execution Process` ; ts: `ccw/src/tools/session-manager.ts` / `task: '{base}/.task/{task_id}.json',` |  | Task JSON outputs (single-module + multi-module variants) |

## Execution Process

1. Parse args; validate `--session` (required).
2. Auto mode:
   - If `-y|--yes`, skip Phase 0 questions; use defaults (no supplementary materials; agent execution; Codex CLI preference if needed).
3. Phase 0 (interactive config; skipped in auto mode):
   - Ask: supplementary materials (none | paths | inline).
   - Ask: execution method preference (agent | hybrid | cli).
   - Ask: preferred CLI tool if CLI/hybrid (codex | gemini | qwen | auto).
4. Phase 1 (command responsibility):
   - Resolve session paths; load session metadata and context package.
   - Detect modules (single vs multi-module) without re-sorting context priorities.
5. Phase 2A (single-module):
   - Invoke `Task(subagent_type="action-planning-agent")` once with consolidated prompt sections.
   - Write `.task/IMPL-*.json`, `IMPL_PLAN.md`, `TODO_LIST.md`; append `planning-notes.md`.
6. Phase 2B (multi-module):
   - Invoke N `action-planning-agent` tasks in parallel (one per module; <=9 tasks per module).
7. Phase 3 (integration; multi-module only):
   - Invoke +1 coordinator planning task to resolve CROSS:: dependencies and emit unified `IMPL_PLAN.md` + `TODO_LIST.md`.
8. Return summary (task count, IDs, dependency highlights).

## Error Handling

- Missing/invalid `--session`: fail fast with a clear message and usage.
- Missing `context-package.json`: explain prerequisite (`/workflow:tools:context-gather`) and stop (no planning outputs).
- Agent failure (Task error/timeouts): do not claim outputs exist; report what was produced; keep partial artifacts if already written.
- File IO errors: include path and operation; avoid leaking secrets from file contents.

## Examples

```bash
/workflow:tools:task-generate-agent --session WFS-auth
/workflow:tools:task-generate-agent -y --session WFS-auth
```

