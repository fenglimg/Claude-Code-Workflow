# Agent Outline: workflow:plan

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions

## State & Artifacts

- Session folder (runtime): `.workflow/active/<sessionId>/`
- Required outputs:
  - Slash MD (command doc): `.claude/commands/workflow/plan.md`
  - Runtime artifacts: `planning-notes.md`, `IMPL_PLAN.md`, `.task/IMPL-*.json`
  - Validation notes (if applied): `/workflow:plan-verify` outputs

## Tooling

- Allowed tools: Skill(*), TodoWrite(*), Read(*), Bash(*)
- Non-negotiables:
  - no unrelated changes
  - evidence-based pointers (docs + TS)
  - verify non-regression against completed corpus

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Evidence gate: `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=<md>`
- Regression: compare against snapshots for already-completed commands (if enabled by the cycle)

