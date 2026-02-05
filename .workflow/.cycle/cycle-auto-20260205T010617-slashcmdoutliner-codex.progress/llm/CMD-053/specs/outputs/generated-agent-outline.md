# Agent Outline: workflow:session:start

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions

## State & Artifacts

- Session folder (if used): `.workflow/...`
- Required outputs:
  - Slash MD (command doc): `.claude/commands/workflow/session/start.md`
  - Any scripts/modules referenced by the command (prefer existing `ccw/src/tools/session-manager.ts`)
  - Validation notes (evidence gate) for pointers

## Tooling

- Allowed tools: Skill(*), AskUserQuestion(*), Read(*), Write(*), Bash(*)
- Non-negotiables:
  - no unrelated changes
  - verify evidence tables (docs + TS anchors) for all key pointers

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Evidence: run `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=<md>`
- Regression: avoid introducing new P0 failures for completed corpus commands
