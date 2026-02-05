# Agent Outline: other:ccw-plan

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions
- Keep coordinator logic in the main process; delegate actual work to existing slash commands or CLI tools via `Skill(*)`

## State & Artifacts

- Session folder (runtime): `.workflow/.ccw-plan/{session_id}/`
- Required outputs:
  - Command doc: `.claude/commands/ccw-plan.md`
  - Status: `.workflow/.ccw-plan/{session_id}/status.json`
  - TODO tracking updates via `TodoWrite(*)`

## Tooling

- Allowed tools: Skill(*), TodoWrite(*), AskUserQuestion(*), Read(*), Grep(*), Glob(*)
- Non-negotiables:
  - no unrelated changes
  - keep pointers evidence-based (Existing vs Planned)
  - verify the deterministic evidence gate for any produced outline/gap-report

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Evidence gate: run `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js` on generated outline + gap report
- Regression: when changing established commands, compare against snapshots for already-completed corpus commands

