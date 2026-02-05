# Agent Outline: workflow:lite-plan

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions

## State & Artifacts

- Session folder (if used): `.workflow/.lite-plan/{session-id}/`
- Required outputs:
  - Slash MD (command doc): `.claude/commands/workflow/lite-plan.md`
  - Exploration outputs: `exploration-{angle}.json` + `explorations-manifest.json`
  - Planning outputs: `planning-context.md` + `plan.json`
  - Handoff payload: `execution-context.json` (consumed by `/workflow:lite-execute`)
  - Validation notes / regression snapshots (if running the outliner across corpus)

## Tooling

- Allowed tools: TodoWrite(*), Task(*), Skill(*), AskUserQuestion(*)
- Non-negotiables:
  - no unrelated changes
  - verify non-regression against completed corpus

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Evidence: pointers labeled Existing vs Planned with dual-source (docs + TS) anchors and concrete verify commands for Existing
- Regression: compare against snapshots for already-completed commands

