# Agent Outline: workflow:tools:task-generate-agent

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes (documentation + supporting tooling as needed)
- Use ACE-tool to find existing patterns before adding new abstractions
- This command is planning-only; it generates artifacts but must not execute implementation

## State & Artifacts

- Session folder: `.workflow/active/WFS-{session-id}/`
- Required outputs:
  - `.claude/commands/workflow/tools/task-generate-agent.md` (command doc)
  - `IMPL_PLAN.md`, `TODO_LIST.md`, `.task/IMPL-*.json` (session artifacts)
  - `planning-notes.md` (append-only planning record)

## Tooling

- Allowed tools: Read(*), Write(*), Edit(*), AskUserQuestion(*), Task(*)
- Non-negotiables:
  - no unrelated changes
  - do not execute code implementation
  - verify evidence tables (docs + TS anchors) for any claimed `Existing` pointers

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Evidence gate: run `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js` on generated docs
- Regression: compare against snapshots for already-completed commands (if applicable in the cycle)

