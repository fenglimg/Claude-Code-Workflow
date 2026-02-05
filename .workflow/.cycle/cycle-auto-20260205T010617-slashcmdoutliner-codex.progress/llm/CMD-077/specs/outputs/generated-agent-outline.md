# Agent Outline: workflow:unified-execute-with-file

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions

## State & Artifacts

- Session folder (per plan): `.workflow/.execution/{sessionId}/`
- Required outputs:
  - Slash MD (command doc)
  - `execution.md` + `execution-events.md` (per session)
  - Validation notes / regression snapshots (if iterating on a completed corpus)

## Tooling

- Allowed tools: TodoWrite(*), Task(*), AskUserQuestion(*), Read(*), Grep(*), Glob(*), Bash(*), Edit(*), Write(*)
- Non-negotiables:
  - no unrelated changes
  - verify non-regression against completed corpus

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Evidence gate: `verify-evidence.js` passes for outline/gap-report tables
- Regression: compare against snapshots for already-completed commands

