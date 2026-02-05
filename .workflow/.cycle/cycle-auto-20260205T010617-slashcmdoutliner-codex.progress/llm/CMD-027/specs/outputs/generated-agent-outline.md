# Agent Outline: workflow:brainstorm-with-file

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions

## State & Artifacts

- Session folder: `.workflow/.brainstorm/<session-id>/`
- Required outputs:
  - Slash MD (command doc): `.claude/commands/workflow/brainstorm-with-file.md`
  - Brainstorm artifacts (brainstorm.md, perspectives.json, synthesis.json, idea docs)
  - Validation notes (evidence gate outputs)

## Tooling

- Allowed tools: TodoWrite(*), Task(*), AskUserQuestion(*), Read(*), Grep(*), Glob(*), Bash(*), Edit(*), Write(*)
- Non-negotiables:
  - no unrelated changes
  - pointers must be labeled Existing vs Planned with dual-source evidence (docs + TS)

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Evidence gate: `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=<md>`
- Regression: avoid breaking previously completed commands (if running in corpus mode)
