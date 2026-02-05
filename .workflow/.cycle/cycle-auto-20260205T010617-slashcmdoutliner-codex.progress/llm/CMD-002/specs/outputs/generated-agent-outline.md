# Agent Outline: ccw-debug

## Purpose

Implement and/or evolve the `/ccw-debug` slash command doc and any supporting tooling to match CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Reference-first: confirm patterns in `.claude/commands/ccw-coordinator.md` and debug/test workflow commands before introducing new abstractions
- Main-process model: treat ccw-debug as a coordinator that runs sub-commands synchronously (Skill blocking), except in bidirectional mode where parallelization is simulated/managed

## State & Artifacts

- Session folder (planned): `.workflow/.ccw-debug/{session_id}/`
- Required outputs (when implemented):
  - `.workflow/.ccw-debug/{session_id}/status.json`
  - TodoWrite items prefixed with `CCWD:{mode}: [i/n] /<command> [status]`

## Tooling

- Allowed tools: Skill(*), TodoWrite(*), AskUserQuestion(*), Read(*), Bash(*)
- Non-negotiables:
  - no unrelated changes
  - no false `Existing` claims in pointers/evidence
  - keep user-visible flow aligned to 5-phase workflow + mode decision tree

## Validation Strategy

- P0 gates:
  - frontmatter: `name`, `description`, `allowed-tools` (argument-hint recommended)
  - core sections: Overview, Usage, Execution Process, Outputs/Artifacts, Error Handling
  - artifact references are consistent (paths are either created by the command or explicitly pre-existing)
  - implementation pointer evidence is dual-source (docs + TS) with verifiable `Existing` pointers
- Deterministic evidence gate:
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-002/specs/outputs/generated-slash-outline.md`
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-002/specs/outputs/gap-report.md`

