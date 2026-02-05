# Agent Outline: workflow:review-cycle-fix

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions
- Preserve orchestrator boundary: delegate batch planning to `@cli-planning-agent` and fix execution to `@cli-execution-agent`

## State & Artifacts

- Session folder (per review session): `.workflow/active/*/.review/fixes/<fix-session-id>/`
- Required outputs:
  - Slash MD (command doc): `.claude/commands/workflow/review-cycle-fix.md`
  - Fix session artifacts: `partial-plan-*.json`, `fix-plan.json`, `fix-progress-*.json`, logs
  - Validation notes (including evidence-gate pass)

## Tooling

- Allowed tools: Skill(*), TodoWrite(*), Read(*), Bash(*), Task(*), Edit(*), Write(*)
- Non-negotiables:
  - no unrelated changes
  - verify non-regression against completed corpus
  - never mark implementation pointers as Existing unless they are verifiable in-repo

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Evidence gate (deep mode): run verify-evidence.js on gap-report + slash outline
- Regression: compare against snapshots for already-completed commands

