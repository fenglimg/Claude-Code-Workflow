# Agent Outline: {{command.group}}:{{command.name}}

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions

## State & Artifacts

- Session folder (if used): `.workflow/...`
- Required outputs:
  - Slash MD (command doc)
  - Any scripts/modules referenced by the command
  - Validation notes / regression snapshots

## Tooling

- Allowed tools: {{command.allowed_tools_csv}}
- Non-negotiables:
  - no unrelated changes
  - verify non-regression against completed corpus

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Regression: compare against snapshots for already-completed commands

