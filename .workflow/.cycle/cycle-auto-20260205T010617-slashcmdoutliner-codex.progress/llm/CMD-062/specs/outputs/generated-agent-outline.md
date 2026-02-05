# Agent Outline: workflow:tools:task-generate-tdd

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions

## State & Artifacts

- Session folder (required): `.workflow/active/{session-id}/`
- Required outputs:
  - Command doc updates (frontmatter completeness, allowed-tools accuracy)
  - Planning artifacts written per session:
    - `IMPL_PLAN.md`
    - `.task/IMPL-*.json`
    - `TODO_LIST.md`
- Deterministic validation:
  - Evidence tables in docs/notes must pass verify-evidence gate

## Tooling

- Allowed tools: Task(action-planning-agent), AskUserQuestion(*), Read(*), Write(*), Glob(*), Bash(*), mcp__ace-tool__search_context(*)
- Non-negotiables:
  - no unrelated changes
  - do not claim `Existing` pointers unless verifiable in repo

## Validation Strategy

- P0 gates:
  - frontmatter + allowed-tools + core sections + artifact references
  - evidence-based pointers (dual-source)
- Regression:
  - compare against snapshots for already-completed commands (if enabled in this repo)

