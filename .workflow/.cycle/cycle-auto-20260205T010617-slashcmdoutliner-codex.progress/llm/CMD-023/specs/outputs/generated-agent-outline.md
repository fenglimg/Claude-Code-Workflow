# Agent Outline: memory:tips

## Purpose

Implement and/or evolve the `/memory:tips` slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use evidence from `.claude/commands/**.md` + `ccw/src/**` before adding new abstractions

## State & Artifacts

- Session folder (if used): `.workflow/...`
- Required outputs:
  - Slash MD (command doc): `.claude/commands/memory/tips.md`
  - Any supporting code referenced by the command (none required beyond existing `core_memory` tool)
  - Validation notes (evidence-gate output)

## Tooling

- Allowed tools: mcp__ccw-tools__core_memory(*), Read(*)
- Non-negotiables:
  - no unrelated changes
  - do not expand tool surface without updating frontmatter and docs

## Validation Strategy

- P0 gates:
  - frontmatter completeness (name/description/allowed-tools)
  - allowed-tools correctness (no unlisted tools referenced in the workflow)
  - core sections present (Overview, Usage, Execution Process, Outputs/Artifacts, Error Handling)
- Deterministic evidence gate:
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-023/specs/outputs/generated-slash-outline.md`
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-023/specs/outputs/gap-report.md`

