# Agent Outline: workflow:tools:test-task-generate

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions

## State & Artifacts

- Session folder (required): `.workflow/active/<session>/`
- Required outputs:
  - Slash command MD (command doc)
  - Agent prompt/contract references (test-action-planning-agent, cli-execution-agent)
  - Validation notes (including evidence-table gate results)

## Tooling

- Allowed tools: Task(*), Read(*), Write(*), Glob(*)
- Non-negotiables:
  - no unrelated changes
  - verify non-regression against completed corpus

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Evidence gate: run verify-evidence.js on generated gap-report and slash outline
- Regression: compare against snapshots for already-completed commands

