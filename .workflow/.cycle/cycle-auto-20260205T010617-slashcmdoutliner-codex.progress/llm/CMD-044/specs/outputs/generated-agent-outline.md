# Agent Outline: workflow:replan

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions

## State & Artifacts

- Session folder (if used): `.workflow/active/{session_id}/`
- Required outputs:
  - Slash MD (command doc): `.claude/commands/workflow/replan.md`
  - Backup artifacts under `.workflow/active/{session_id}/.process/backup/`
  - Validation notes / regression snapshots (if applicable to the workflow corpus)

## Tooling

- Allowed tools: Read(*), Write(*), Edit(*), TodoWrite(*), Glob(*), Bash(*)
- Non-negotiables:
  - no unrelated changes
  - verify non-regression against completed corpus

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Evidence gate: `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=<md>`
- Regression: compare against snapshots for already-completed commands (when running corpus-wide)

