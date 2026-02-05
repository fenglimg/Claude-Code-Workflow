# Agent Outline: workflow:collaborative-plan-with-file

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions
- Prefer reusing existing workflow session folder conventions under `.workflow/.planning/`

## State & Artifacts

- Session folder: `.workflow/.planning/{session-id}/`
- Required outputs:
  - Slash MD (command doc): `.claude/commands/workflow/collaborative-plan-with-file.md`
  - Prompt mirror (if used): `.codex/prompts/collaborative-plan-with-file.md`
  - Session artifacts (created at runtime): `plan-note.md`, `requirement-analysis.json`, per-agent `planning-context.md` + `plan.json`, `conflicts.json`, `plan.md`

## Tooling

- Allowed tools: TodoWrite(*), Task(*), AskUserQuestion(*), Read(*), Bash(*), Write(*), Glob(*), Grep(*), mcp__ace-tool__search_context(*)
- Non-negotiables:
  - no unrelated changes
  - sub-agents only write to pre-allocated plan-note sections (no merges)
  - verify evidence-based pointers (Existing vs Planned) when editing docs/tooling

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Deterministic gate (deep mode):
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=<generated md>`
- Regression: compare against snapshots for already-completed commands (if running corpus regression)

