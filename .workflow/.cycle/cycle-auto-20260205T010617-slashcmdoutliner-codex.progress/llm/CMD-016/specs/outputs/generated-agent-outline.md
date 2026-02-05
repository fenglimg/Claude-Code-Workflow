# Agent Outline: issue:plan

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions
- Orchestration vs execution:
  - Command doc (/issue:plan) orchestrates batching, parallelism, and user interaction
  - issue-plan-agent performs deep exploration + solution generation

## State & Artifacts

- Session folder (if used): `.workflow/...`
- Required outputs:
  - Slash MD (command doc): `.claude/commands/issue/plan.md`
  - Agent definition: `.codex/agents/issue-plan-agent.md`
  - Solution artifacts: `.workflow/issues/solutions/{issue-id}.jsonl`

## Tooling

- Allowed tools: TodoWrite(*), Task(*), Skill(*), AskUserQuestion(*), Bash(*), Read(*), Write(*)
- Non-negotiables:
  - no unrelated changes
  - use CLI for issue CRUD (no direct edits of issues.jsonl / solutions/*.jsonl)
  - verify evidence tables (Existing vs Planned + dual-source)

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Evidence gate:
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-016/specs/outputs/generated-slash-outline.md`
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-016/specs/outputs/gap-report.md`
- Smoke checks (CLI):
  - `ccw issue list --status pending --brief`
  - `ccw issue status <id> --json`
  - `ccw issue bind <id> <solution-id>`
