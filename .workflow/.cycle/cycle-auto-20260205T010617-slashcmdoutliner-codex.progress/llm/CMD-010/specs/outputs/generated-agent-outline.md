# Agent Outline: issue:convert-to-plan

## Purpose

Implement and/or evolve `/issue:convert-to-plan` to convert upstream planning artifacts into a normalized Solution and bind it to an issue via CCW CLI conventions.

## Execution Model

- Default: incremental, testable changes (one behavior slice at a time: arg parsing -> extractors -> persistence -> binding)
- Pattern-first: use repo references (especially `/issue:from-brainstorm`) before introducing new abstractions
- Confirmation-first: auto mode only when `-y/--yes` is present

## State & Artifacts

- Inputs:
  - lite-plan: `.workflow/.lite-plan/**/plan.json`
  - workflow sessions: `.workflow/active/WFS-*/` (metadata + `.task/IMPL-*.json`)
  - markdown/json sources: `<SOURCE>.md` / `<SOURCE>.json`
- Outputs:
  - `.workflow/issues/solutions/<issue-id>.jsonl`
  - issue/solution binding via `ccw issue bind` + status update via `ccw issue update`

## Tooling

- Allowed tools: TodoWrite(*), Bash(*), Read(*), Write(*), Glob(*), AskUserQuestion(*)
- Non-negotiables:
  - do not directly edit issue stores for operations that have a CLI equivalent
  - no unrelated changes outside the command implementation
  - keep evidence-based pointers (Existing vs Planned) accurate

## Validation Strategy

- P0 gates:
  - frontmatter + allowed-tools + core sections + no broken artifact references
  - evidence table passes: `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=<md>`
- Behavioral checks:
  - one example per source type + supplement + auto mode
  - error paths: missing source, bad json, unknown session, CLI failure surfaces clean message

