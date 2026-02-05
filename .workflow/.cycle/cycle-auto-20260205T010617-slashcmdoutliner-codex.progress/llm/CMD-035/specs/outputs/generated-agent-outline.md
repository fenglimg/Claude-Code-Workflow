# Agent Outline: workflow:execute

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions
- Prefer idempotent updates (safe to re-run against an active session)

## State & Artifacts

- Session folder (runtime): `.workflow/active/<session>/`
- Key artifacts:
  - `IMPL_PLAN.md`
  - `.task/<task_id>.json`
  - `.summaries/<task_id>-summary.md`
  - `TODO_LIST.md`

## Tooling

- Allowed tools: TodoWrite(*), Task(*), AskUserQuestion(*), Read(*), Skill(*), Bash(*)
- Non-negotiables:
  - no unrelated changes
  - auto-commit only when `--with-commit` is set; commit only per-task files
  - verify non-regression against completed corpus when updating shared tooling

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Evidence gate: verify evidence tables for pointers (docs + TS)
- Runtime checks:
  - session discovery works for 0/1/N active sessions
  - parallel/phased scheduling respects dependencies and updates status deterministically

