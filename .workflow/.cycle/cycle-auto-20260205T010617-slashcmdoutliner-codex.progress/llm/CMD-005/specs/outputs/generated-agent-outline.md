# Agent Outline: other:ccw

## Purpose

Implement and/or evolve the `/ccw` slash command as the main CCW workflow orchestrator (intent analysis -> workflow selection -> command-chain execution) while minimizing regressions.

## Execution Model

- Default: incremental, testable changes
- Before changing behavior, locate 3+ similar command patterns in `.claude/commands/**.md`
- Use repo-verifiable pointers only (no false `Existing` claims)

## State & Artifacts

- Session state (runtime):
  - `.workflow/.ccw/<session_id>/status.json` (planned runtime artifact)
- Command catalog (inputs for routing):
  - `.claude/commands/**.md`

## Tooling

- Allowed tools: Skill(*), TodoWrite(*), AskUserQuestion(*), Read(*), Grep(*), Glob(*)
- Non-negotiables:
  - no unrelated changes
  - keep orchestration logic deterministic and explainable
  - evidence tables (docs + TS) for key implementation pointers

## Validation Strategy

- P0 gates:
  - frontmatter completeness: `name`, `description`, `allowed-tools`
  - core sections present: Overview, Usage, Execution Process, Outputs/Artifacts, Error Handling
  - implementation pointers labeled `Existing` vs `Planned` with dual-source evidence
- Deterministic gate:
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=<generated md>`
