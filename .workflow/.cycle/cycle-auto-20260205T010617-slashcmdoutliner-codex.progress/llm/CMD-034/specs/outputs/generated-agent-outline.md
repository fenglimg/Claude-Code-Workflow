# Agent Outline: workflow:debug-with-file

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes (small diffs, validate often)
- Use ACE-tool to find existing patterns before adding new abstractions
- Prefer evidence-first debugging: instrument -> reproduce -> analyze -> correct understanding -> fix -> verify -> cleanup

## State & Artifacts

- Session folder: `.workflow/.debug/DBG-<bugSlug>-<YYYY-MM-DD>/`
- Required outputs:
  - Slash MD (command doc): `.claude/commands/workflow/debug-with-file.md`
  - Session artifacts: `understanding.md`, `debug.log` (NDJSON), `hypotheses.json`
  - Validation notes (what was verified + how instrumentation was removed)

## Tooling

- Allowed tools: TodoWrite(*), Task(*), AskUserQuestion(*), Read(*), Grep(*), Glob(*), Bash(*), Edit(*), Write(*)
- Non-negotiables:
  - no unrelated changes
  - do not claim runtime artifacts already exist in repo
  - verify evidence tables with `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js`

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + no broken artifact references
- Evidence gate: dual-source (docs + TS) for each pointer row
- Regression (when applying changes to existing commands): avoid introducing P0 failures in already-completed corpus commands

