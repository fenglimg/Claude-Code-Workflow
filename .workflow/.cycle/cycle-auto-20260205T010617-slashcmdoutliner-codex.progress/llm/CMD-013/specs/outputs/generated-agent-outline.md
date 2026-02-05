# Agent Outline: issue:execute

## Purpose

Implement and/or evolve the `/issue:execute` slash command as a minimal orchestrator for queue execution with DAG-driven parallel batching (one commit per solution).

## Execution Model

- Default: incremental, testable changes; one solution at a time is a valid incremental milestone.
- Evidence-first: use ACE search to locate existing queue/DAG/detail/done implementations before adding new abstractions.

## State & Artifacts

- Runtime state:
  - Queue state under `.workflow/issues/queues/` (created/updated by `ccw issue queue ...` + `ccw issue done ...`).
  - Optional queue-scoped worktree under `.ccw/worktrees/queue-exec-<queue-id>/`.
- Required outputs:
  - Command doc: `.claude/commands/issue/execute.md`
  - Any prompt scaffolding used for orchestration: `.codex/prompts/issue-execute.md`

## Tooling

- Allowed tools: TodoWrite(*), Bash(*), Read(*), AskUserQuestion(*)
- Non-negotiables:
  - no unrelated changes
  - do not auto-select a queue unless `--yes`
  - enforce single commit per solution

## Validation Strategy

- P0 gates:
  - frontmatter keys present (name/description/allowed-tools)
  - allowed-tools surface matches intended workflow
  - core sections present
  - no broken artifact references
  - evidence tables pass `verify-evidence.js`
- Functional checks:
  - `--queue` required behavior and interactive selection fallback
  - DAG empty / queue not found paths
  - worktree create/resume paths
  - executor dispatch completes with exactly one commit per solution

