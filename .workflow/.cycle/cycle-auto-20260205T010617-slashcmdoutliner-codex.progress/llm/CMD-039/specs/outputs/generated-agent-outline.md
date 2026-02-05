# Agent Outline: workflow:lite-fix

## Purpose

Implement and/or evolve the slash command `/workflow:lite-fix` according to CCW conventions with minimal regressions.

## Execution Model

- Incremental, testable edits
- Prefer reusing the existing lite-family patterns (`/workflow:lite-plan`, `/workflow:lite-execute`) over introducing new abstractions

## State & Artifacts

- Session folder: `.workflow/lite-fix/<session>/`
- Required outputs:
  - `diagnosis-*.json` + `diagnoses-manifest.json`
  - `planning-context.md`
  - `fix-plan.json`

## Tooling

- Allowed tools: TodoWrite(*), Task(*), Skill(*), AskUserQuestion(*)
- Non-negotiables:
  - no unrelated changes
  - keep pointers evidence-based (Existing vs Planned)

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Deterministic gate: evidence tables must pass `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js`
- Regression: do not regress previously completed commands (if snapshots are used)
