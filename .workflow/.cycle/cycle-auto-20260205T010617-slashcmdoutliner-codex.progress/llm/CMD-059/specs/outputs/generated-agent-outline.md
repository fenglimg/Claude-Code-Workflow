# Agent Outline: workflow:tools:conflict-resolution

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions

## State & Artifacts

- Session folder (if used): `.workflow/active/<WFS-session-id>/`
- Required outputs:
  - Slash MD (command doc): `.claude/commands/workflow/tools/conflict-resolution.md`
  - Primary artifact: `.workflow/active/<WFS-session-id>/.process/conflict-resolution.json`
  - Secondary: structured Agent JSON response (stdout)

## Tooling

- Allowed tools: Task(*), AskUserQuestion(*), Read(*), Write(*)
- Non-negotiables:
  - no unrelated changes
  - verify non-regression against completed corpus

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Evidence gate: `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=<generated-md>`
- Regression: compare against snapshots for already-completed commands

