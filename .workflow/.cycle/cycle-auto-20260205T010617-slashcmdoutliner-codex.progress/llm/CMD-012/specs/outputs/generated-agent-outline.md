# Agent Outline: issue:discover

## Purpose

Implement and/or evolve the `/issue:discover` orchestrator command following CCW conventions (multi-perspective discovery, optional external research, and optional export).

## Execution Model

- Default: interactive (perspective selection + next-step choice)
- Auto-mode (`-y|--yes`): choose all perspectives, skip confirmations
- Orchestration: command drives state/artifacts; per-perspective analysis runs via `Task` (cli explore agent)

## State & Artifacts

- Discovery session directory:
  - `.workflow/issues/discoveries/{discovery-id}/`
- Primary artifacts:
  - `discovery-state.json`, `perspectives/{perspective}.json`, `external-research.json` (optional)
  - `discovery-issues.jsonl`, `summary.md`
- Export artifact (optional):
  - `.workflow/issues/issues.jsonl`

## Tooling

- Allowed tools: Skill(*), TodoWrite(*), Read(*), Bash(*), Task(*), AskUserQuestion(*), Glob(*), Grep(*)
- Non-negotiables:
  - keep scope limited to user-provided `<path-pattern>`
  - do not run external research unless `--external`
  - do not export to `.workflow/issues/issues.jsonl` without confirmation unless `--yes`

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references are explicit
- Evidence gates (deep mode): keep evidence tables accurate (docs heading + TS anchor)
- Behavioral checks:
  - empty file match -> clear error
  - invalid perspectives -> clear error
  - partial task failures -> state reflects failures; summary/export behavior remains consistent

