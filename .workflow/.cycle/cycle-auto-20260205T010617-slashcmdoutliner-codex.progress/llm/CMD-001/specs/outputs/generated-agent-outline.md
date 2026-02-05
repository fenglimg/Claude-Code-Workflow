# Agent Outline: ccw-coordinator

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions

## State & Artifacts

- Session folder (if used): `.workflow/.ccw-coordinator/<session_id>/`
- Required outputs:
  - Slash MD (command doc)
  - Any scripts/modules referenced by the command
  - Validation notes / regression snapshots

## Tooling

- Allowed tools: Task(*), AskUserQuestion(*), Read(*), Write(*), Bash(*), Glob(*), Grep(*)
- Non-negotiables:
  - no unrelated changes
  - verify non-regression against completed corpus

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Evidence gate: `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js` on outline + gap-report
- Regression: compare against snapshots for already-completed commands

