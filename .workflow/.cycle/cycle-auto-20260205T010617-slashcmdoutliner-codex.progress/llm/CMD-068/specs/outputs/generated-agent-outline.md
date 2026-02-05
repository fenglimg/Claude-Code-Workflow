# Agent Outline: workflow:workflow:ui-design:codify-style

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes; keep edits small and phase-scoped.
- Before changes: inspect 3+ similar commands (orchestrators + ui-design pipeline delegates).

## State & Artifacts

- Session folder: `.workflow/codify-temp-<timestamp>/` (temporary; must be cleaned up)
- Required outputs:
  - `.claude/commands/workflow/ui-design/codify-style.md` (orchestrator command doc)
  - Delegate command docs: `import-from-code`, `reference-page-generator` (already present; verify anchors)
  - Final package: `.workflow/reference_style/<package-name>/`

## Tooling

- Allowed tools: Skill,Bash,Read,TodoWrite
- Non-negotiables:
  - no unrelated changes outside the command’s scope
  - preserve auto-continue behavior across phases
  - verify evidence tables (docs + TS anchors) when updating pointers

## Validation Strategy

- P0 gates:
  - frontmatter has `name`, `description`, `allowed-tools`
  - core sections exist: `Overview`, `Usage`, `Execution Process`, `Outputs / Artifacts`, `Error Handling`
  - artifact paths are consistent with `.workflow/reference_style` and temp workspace cleanup rules
- Deterministic evidence gate:
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=<outline_or_gap_report.md>`

