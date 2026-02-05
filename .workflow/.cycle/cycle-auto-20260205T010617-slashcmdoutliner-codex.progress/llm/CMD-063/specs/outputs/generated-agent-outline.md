# Agent Outline: workflow:tools:tdd-coverage-analysis

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: single-shot analysis (no interactive rounds)
- Primary operations:
  - run tests with coverage (Bash)
  - read session artifacts (Read)
  - write standardized reports (Write)

## State & Artifacts

- Session scope: `.workflow/active/{session_id}/`
- Required outputs:
  - `.workflow/active/{session_id}/.process/test-results.json`
  - `.workflow/active/{session_id}/.process/coverage-report.json`
  - `.workflow/active/{session_id}/.process/tdd-cycle-report.md`

## Tooling

- Allowed tools: Read(*), Write(*), Bash(*)
- Non-negotiables:
  - no unrelated changes
  - do not claim implementation pointers are Existing unless verifiable in-repo

## Validation Strategy

- P0 doc gates:
  - frontmatter: `name`, `description`, `allowed-tools`
  - required sections: Overview, Usage, Execution Process, Outputs/Artifacts, Error Handling
  - no broken artifact references (paths are either created by the command or documented as pre-existing)
- Evidence gates:
  - add/update evidence tables in generated outlines/gap report and verify with:
    - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-063/specs/outputs/generated-slash-outline.md`
    - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-063/specs/outputs/gap-report.md`

