# Agent Outline: workflow:design-sync

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions

## State & Artifacts

- Session folder (runtime): `.workflow/active/WFS-{session}/`
- Required outputs:
  - Slash MD (command doc): `.claude/commands/workflow/ui-design/design-sync.md`
  - Updated brainstorming artifacts (session-scoped): `.workflow/active/WFS-{session}/.brainstorming/**`
  - Updated context package: `.workflow/active/WFS-{session}/.process/context-package.json`

## Tooling

- Allowed tools: Read(*), Write(*), Edit(*), TodoWrite(*), Glob(*), Bash(*)
- Non-negotiables:
  - no unrelated changes
  - keep updates session-scoped
  - references only via `@...` (no content duplication)

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Evidence gate: run verifier on generated outlines:

```bash
node .codex/skills/slash-command-outliner/scripts/verify-evidence.js \
  --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-069/specs/outputs/generated-slash-outline.md \
  --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-069/specs/outputs/gap-report.md
```

- Functional spot-check (when implementing):
  - Run the command against a small test session.
  - Confirm `role analysis documents` contains `## UI/UX Guidelines` with `@` references.
  - Confirm `.process/context-package.json` includes `design_system_references`.

