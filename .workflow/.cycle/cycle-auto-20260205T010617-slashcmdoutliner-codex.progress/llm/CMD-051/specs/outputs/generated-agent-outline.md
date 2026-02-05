# Agent Outline: workflow:resume

## Purpose

Implement and/or evolve `/workflow:resume` to reliably resume the most recently paused workflow session with minimal regressions.

## Execution Model

- Default: incremental, testable changes (small diffs; validate after each change)
- Evidence-first: confirm existing session tooling patterns before adding new abstractions

## State & Artifacts

- Session root: `.workflow/active/WFS-*/`
- Primary metadata file: `.workflow/active/WFS-*/workflow-session.json`
- Required outputs (for implementation work):
  - Slash command doc (alias if needed): `.claude/commands/workflow/resume.md`
  - Any updated tooling code (likely in `ccw/src/tools/session-manager.ts`)
  - Validation notes + regression snapshots (if the corpus requires them)

## Tooling

- Allowed tools: Read(*), Write(*), Bash(*)
- Non-negotiables:
  - no unrelated changes
  - no false `Existing` claims in evidence tables
  - validate deterministic evidence gate for the affected outlines/docs

## Validation Strategy

- P0 gates: frontmatter completeness + allowed-tools correctness + core sections + no broken artifact references
- Deterministic evidence gate:
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-051/specs/outputs/generated-slash-outline.md`
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-051/specs/outputs/gap-report.md`

