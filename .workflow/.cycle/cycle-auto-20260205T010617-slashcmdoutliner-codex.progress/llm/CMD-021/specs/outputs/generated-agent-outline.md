# Agent Outline: memory:load

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions
- Core behavior: delegate project analysis to a universal-executor agent; prefer structured CLI output to reduce token usage

## State & Artifacts

- Session folder (optional): `.workflow/...` (only if you need persistent scratch for analysis outputs)
- Required outputs:
  - Slash MD (command doc): `.claude/commands/memory/load.md`
  - Any scripts/modules referenced by the command (only if missing today)
  - Validation notes (evidence verification)

## Tooling

- Allowed tools: Task(*), Bash(*)
- Non-negotiables:
  - no unrelated changes
  - keep analysis read-only unless user explicitly requests writes
  - verify evidence tables are dual-sourced (docs + TS)

## Validation Strategy

- P0 gates:
  - frontmatter completeness + allowed-tools correctness
  - core sections present + no broken artifact references
  - evidence tables pass `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js`
- Regression:
  - if implementing changes, validate nearby memory commands remain consistent (format/sections)

