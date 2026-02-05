# Agent Outline: memory:update-full

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions

## State & Artifacts

- Session folder (if used): `.workflow/memory/update-full/<timestamp>/`
- Required outputs:
  - Slash MD (command doc): `.claude/commands/memory/update-full.md`
  - Any scripts/modules referenced by the command (existing or newly introduced)
  - Validation notes / regression snapshots (if the corpus gate is enabled)

## Tooling

- Allowed tools: TodoWrite(*), Task(*), AskUserQuestion(*), Read(*), Grep(*), Glob(*), Bash(*), Write(*)
- Non-negotiables:
  - no unrelated changes
  - verify evidence tables for implementation pointers

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Evidence: run `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js` for the outline and gap report
- Safety: confirm only `CLAUDE.md` changes are produced by the execution path

