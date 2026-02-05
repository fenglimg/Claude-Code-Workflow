# Agent Outline: issue:discover-by-prompt

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions

## State & Artifacts

- Session folder: `.workflow/issues/discoveries/{DISCOVERY_ID}/`
- Required outputs:
  - `discovery-state.json` (session state; iteration tracking)
  - `iterations/{N}/{dimension}.json` (dimension findings per iteration)
  - `comparison-analysis.json` (optional; comparison intent)
  - `discovery-issues.jsonl` (issue candidates)

## Tooling

- Allowed tools: Skill(*), TodoWrite(*), Read(*), Bash(*), Task(*), AskUserQuestion(*), Glob(*), Grep(*), mcp__ace-tool__search_context(*), mcp__exa__search(*)
- Non-negotiables:
  - no unrelated changes
  - verify non-regression against completed corpus

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Evidence gate: verify evidence tables (docs + TS anchors) for key pointers
- Regression: compare against snapshots for already-completed commands
