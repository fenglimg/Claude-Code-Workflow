# Agent Outline: workflow:tdd-plan

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Orchestrator behavior: initialize TodoWrite, then auto-run Phases 1-6 without pausing
- Use ACE-tool to find existing patterns before adding new abstractions

## State & Artifacts

- Session folder: `.workflow/active/{sessionId}/`
- Required outputs:
  - Slash MD (command doc): `.claude/commands/workflow/tdd-plan.md`
  - Planned artifacts:
    - `.workflow/active/{sessionId}/IMPL_PLAN.md`
    - `.workflow/active/{sessionId}/TODO_LIST.md`
    - `.workflow/active/{sessionId}/.task/IMPL-*.json`

## Tooling

- Allowed tools: Skill(*), TodoWrite(*), Read(*), Bash(*)
- Non-negotiables:
  - no unrelated changes
  - no production-code implementation during planning (planning + validation only)
  - verify evidence gates for any pointer labeled Existing

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + no broken artifact references
- Deterministic evidence gate:
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-054/specs/outputs/generated-slash-outline.md`
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-054/specs/outputs/gap-report.md`