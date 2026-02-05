# Agent Outline: other:ccw-test

## Purpose

Implement and/or evolve the `/ccw-test` slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- First step: read existing oracle doc and align behavior before any refactors
- Coordinator behavior: analyze -> strategy select -> confirm -> tracking -> execute (with optional fix-mode iteration)

## State & Artifacts

- Session folder (runtime): `.workflow/.ccw-test/<session_id>/`
- Required outputs (command implementation task):
  - `.claude/commands/ccw-test.md` (command doc kept consistent with behavior)
  - Runtime artifacts created by execution: `status.json` (per-session)

## Tooling

- Allowed tools: Skill(*), TodoWrite(*), AskUserQuestion(*), Read(*), Bash(*)
- Non-negotiables:
  - no unrelated changes
  - evidence-based pointers (Existing vs Planned)

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Deterministic evidence gate:
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=<outline.md>`
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=<gap-report.md>`

