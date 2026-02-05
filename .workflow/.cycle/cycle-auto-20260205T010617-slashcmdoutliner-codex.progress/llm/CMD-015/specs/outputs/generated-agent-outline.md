# Agent Outline: issue:new

## Purpose

Implement and/or evolve the `/issue:new` slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Before editing: use `mcp__ace-tool__search_context` to find and match existing patterns for issue commands and JSONL storage
- Interaction model: single-pass for clear inputs; minimal questions for unclear inputs; optional GitHub publish prompt for non-GitHub sources

## State & Artifacts

- Runtime store (created/updated by CLI):
  - `.workflow/issues/issues.jsonl`
- Related artifacts:
  - Command doc: `.claude/commands/issue/new.md`
  - Prompt doc: `.codex/prompts/issue-new.md`
  - CLI implementation: `ccw/src/commands/issue.ts`

## Tooling

- Allowed tools: TodoWrite(*), Bash(*), Read(*), AskUserQuestion(*), mcp__ace-tool__search_context(*)
- Non-negotiables:
  - no unrelated changes
  - pointers labeled Existing vs Planned with dual-source evidence (docs + TS)
  - deterministic evidence gate must pass

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Deterministic evidence verification:
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-015/specs/outputs/generated-slash-outline.md`
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-015/specs/outputs/gap-report.md`

