# Agent Outline: workflow:tools:test-context-gather

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions

## State & Artifacts

- Session folder (existing CCW convention): `.workflow/active/{test_session_id}/...`
- Required outputs:
  - Slash MD (command doc): `.claude/commands/workflow/tools/test-context-gather.md`
  - Subagent doc (invoked by Task): `.codex/agents/test-context-search-agent.md`
  - Output artifact: `.workflow/active/{test_session_id}/.process/test-context-package.json`

## Tooling

- Allowed tools: Task(*), Read(*), Glob(*)
- Non-negotiables:
  - no unrelated changes
  - verify non-regression against completed corpus

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Deterministic evidence gate: ensure evidence tables in outline/gap-report cite both `.claude/commands/**.md` headings and `ccw/src/**` anchors
- Regression: compare against snapshots for already-completed commands (if enabled in this cycle)

