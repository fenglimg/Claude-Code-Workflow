# Agent Outline: workflow:brainstorm:auto-parallel

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions

## State & Artifacts

- Session folder (if used): `.workflow/active/WFS-{topic}/.brainstorming/`
- Required outputs:
  - Slash MD (command doc): `.claude/commands/workflow/brainstorm/auto-parallel.md`
  - Any invoked subcommand docs remain stable (artifacts/role-analysis/synthesis)
  - Validation notes (evidence-gate pass)

## Tooling

- Allowed tools: Skill(*), Task(*), TodoWrite(*), Read(*), Write(*), Bash(*), Glob(*)
- Non-negotiables:
  - no unrelated changes
  - verify non-regression against completed corpus

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Evidence gate: `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=<md>` on:
  - `generated-slash-outline.md`
  - `gap-report.md`
- Regression: compare against snapshots for already-completed commands (if/when running corpus-wide regress)

