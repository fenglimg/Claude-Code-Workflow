# Agent Outline: workflow:ui-design:layout-extract

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions

## State & Artifacts

- Session folder (if used): `{base_path}/.intermediates/layout-analysis/`
- Required outputs:
  - Slash MD (command doc): `.claude/commands/workflow/ui-design/layout-extract.md`
  - Options: `{base_path}/.intermediates/layout-analysis/analysis-options.json`
  - Templates: `{base_path}/layout-extraction/layout-templates.json`
  - Validation notes (optional): counts + sample structure checks

## Tooling

- Allowed tools: TodoWrite(*), Read(*), Write(*), Glob(*), Bash(*), AskUserQuestion(*), Task(ui-design-agent), mcp__exa__web_search_exa(*)
- Non-negotiables:
  - no unrelated changes
  - verify non-regression against completed corpus

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Evidence gate: run verify-evidence.js on the command outline and gap report
- Regression: if the command is part of a completed corpus set, compare against snapshots for already-completed commands
