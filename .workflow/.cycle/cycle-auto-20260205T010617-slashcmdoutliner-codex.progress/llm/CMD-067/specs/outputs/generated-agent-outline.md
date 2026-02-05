# Agent Outline: workflow:animation-extract

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions

## State & Artifacts

- Session folder (if used): `.workflow/...`
- Required outputs:
  - Slash MD (command doc): `.claude/commands/workflow/ui-design/animation-extract.md`
  - Intermediates: `{base_path}/.intermediates/animation-analysis/*`
  - Final output: `{base_path}/animation-extraction/animation-tokens.json`
  - Validation notes / regression snapshots (if running corpus regression)

## Tooling

- Allowed tools: TodoWrite(*), Read(*), Write(*), Glob(*), Bash(*), AskUserQuestion(*), Task(ui-design-agent)
- Non-negotiables:
  - no unrelated changes
  - verify non-regression against completed corpus

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Evidence gates: every implementation pointer labeled Existing/Planned with docs+TS anchors
- Functional checks (command behavior):
  - explore mode writes `analysis-options.json`, refine mode writes `refinement-options.json`
  - interactive mode persists `user_selection` and influences final token output
  - output JSON is readable and includes duration/easing tokens + per-animation specs

