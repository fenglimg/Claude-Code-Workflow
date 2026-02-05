# Agent Outline: workflow:multi-cli-plan

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions

## State & Artifacts

- Session folder: `.workflow/.multi-cli-plan/<session-id>/`
- Required outputs:
  - Slash MD (command doc): `.claude/commands/workflow/multi-cli-plan.md`
  - Session artifacts: `session-state.json`, `rounds/<n>/synthesis.json`, `context-package.json`, `plan.json`
  - Validation notes (evidence + regression)

## Tooling

- Allowed tools: TodoWrite(*), Task(*), AskUserQuestion(*), Read(*), Bash(*), Write(*), mcp__ace-tool__search_context(*)
- Non-negotiables:
  - no unrelated changes
  - verify evidence tables (docs + TS anchors)

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Evidence: every key pointer labeled Existing/Planned with dual-source evidence
- Regression: avoid breaking completed command corpus behaviors

