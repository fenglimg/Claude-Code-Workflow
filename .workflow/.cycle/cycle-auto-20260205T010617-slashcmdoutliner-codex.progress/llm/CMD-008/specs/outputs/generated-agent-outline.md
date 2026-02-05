# Agent Outline: other:codex-coordinator

## Purpose

Implement and/or evolve the `/codex-coordinator` command so it can analyze tasks, recommend a Codex command chain, confirm with the user, execute sequentially, and persist resumable state.

## Execution Model

- Default: incremental, testable changes
- Prefer reusing established orchestration and state patterns (reference: `/ccw-coordinator`)
- For deep mode: every implementation pointer must be evidence-backed (docs + TS) and verifiable

## State & Artifacts

- Session folder (planned): `.workflow/.codex-coordinator/<session-id>/`
- Required outputs:
  - Command doc: `.claude/commands/codex-coordinator.md` (frontmatter + core sections)
  - State: `.workflow/.codex-coordinator/<session-id>/state.json`
  - Logs: `.workflow/.codex-coordinator/<session-id>/runs.jsonl`

## Tooling

- Allowed tools: AskUserQuestion(*), Read(*), Write(*), Bash(*), Glob(*), Grep(*)
- Non-negotiables:
  - no unrelated changes
  - do not mark pointers as Existing unless they are verifiable in the repo
  - confirmation gate before execution unless `--auto-confirm`

## Validation Strategy

- P0 gates:
  - frontmatter completeness (name/description/allowed-tools)
  - core sections present (Overview, Usage, Execution Process, Outputs/Artifacts, Error Handling)
  - no broken artifact references (writes are created by the command; reads already exist)
  - evidence tables pass `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js`
- Behavior checks (manual):
  - chain recommendation prints atomic units clearly
  - resume picks up from first pending step and updates state deterministically