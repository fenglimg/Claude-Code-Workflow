# Agent Outline: workflow:ui-design:reference-page-generator

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions

## State & Artifacts

- Session folder (if used): `.workflow/...`
- Required outputs:
  - Slash MD (command doc): `.claude/commands/workflow/ui-design/reference-page-generator.md`
  - Generated package under `.workflow/reference_style/<package-name>/`:
    - `layout-templates.json`, `design-tokens.json`, `animation-tokens.json` (optional)
    - `preview.html`, `preview.css`

## Tooling

- Allowed tools: Read, Write, Bash, Task, TodoWrite
- Non-negotiables:
  - no unrelated changes
  - verify non-regression against completed corpus

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Deterministic: run evidence gate on both files:
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=<generated-slash-outline.md>`
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=<gap-report.md>`
- Runtime checks (manual/smoke):
  - Validate required input files exist in the provided design-run
  - Confirm overwrite protection behaves correctly for non-empty directories
  - Confirm preview.html/preview.css are created by ui-design-agent

