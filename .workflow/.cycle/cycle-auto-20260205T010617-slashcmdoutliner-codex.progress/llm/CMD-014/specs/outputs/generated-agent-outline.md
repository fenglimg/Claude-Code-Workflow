# Agent Outline: issue:from-brainstorm

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes.
- Modes:
  - Interactive selection (AskUserQuestion) unless `--auto` or `-y|--yes` indicates no confirmations.
  - Deterministic idea selection when `--idea=<index>` or `--auto` is provided.
- Use ACE-tool to find existing patterns before adding new abstractions.

## State & Artifacts

- Brainstorm session input root: `.workflow/.brainstorm/<session>/`
- Reads:
  - `synthesis.json` (required)
  - `perspectives.json` (optional)
  - `.brainstorming/**` (optional)
- Writes (via `ccw issue` CLI + JSONL append):
  - `.workflow/issues/issues.jsonl`
  - `.workflow/issues/solutions/<issue-id>.jsonl`

## Tooling

- Allowed tools: TodoWrite(*), Bash(*), Read(*), Write(*), Glob(*), AskUserQuestion(*)
- Non-negotiables:
  - no unrelated changes
  - use `ccw issue create|bind|update` for lifecycle changes (avoid direct edits to issues store)
  - verify non-regression against completed corpus

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references.
- Evidence gates: implementation pointers must be labeled Existing/Planned with dual-source evidence.
- Runtime validation:
  - dry-run with a known session folder and `--idea=0`
  - auto mode with `--auto -y`
  - failure paths: missing session, invalid index, CLI failure

