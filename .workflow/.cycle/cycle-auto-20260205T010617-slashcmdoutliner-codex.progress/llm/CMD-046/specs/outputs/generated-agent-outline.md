# Agent Outline: workflow:review-module-cycle

## Purpose

Implement and/or evolve `/workflow:review-module-cycle` as an orchestrator that performs independent, multi-dimensional review over specified modules/files and persists review artifacts for follow-up actions.

## Execution Model

- Default: incremental, testable changes; prefer boring, repo-aligned patterns.
- Orchestrator boundary:
  - Orchestrator handles: argument parsing, file resolution/validation, session integration, launching dimension reviews, aggregation, iteration control, progress/state persistence, TodoWrite.
  - Delegates: per-dimension analysis to CLI/tool-driven workers (Skill/Task), and optional deep-dive iterations on selected findings.
- Evidence-first: use repo-verifiable pointers (docs + `ccw/src/**`) before creating new abstractions.

## State & Artifacts

- Review session base: `.workflow/active/WFS-{session-id}/`
- Review outputs: `.workflow/active/WFS-{session-id}/.review/`
  - `review-state.json` (aggregation + state machine)
  - `review-progress.json` (live progress)
  - `dimensions/{dimension}.json` + `reports/{dimension}.md`
  - `iterations/{iteration}.json` (deep-dive iteration snapshots)

## Tooling

- Allowed tools: Skill(*), TodoWrite(*), Read(*), Bash(*), Task(*)
- Non-negotiables:
  - no unrelated changes outside the review output directory (and required code/doc targets)
  - no false `Existing` claims; keep pointers evidence-based
  - preserve non-regression for existing commands and shared review artifacts

## Validation Strategy

- P0 gates:
  - frontmatter completeness and allowed-tools correctness
  - core sections present (Overview, Usage, Execution Process, Outputs/Artifacts, Error Handling)
  - artifact references are either pre-existing or explicitly created by this command
  - evidence tables pass `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js`
- Functional validation (when implementing):
  - unit tests for file pattern resolution + dimension selection + aggregation decisions
  - integration smoke test that creates a review directory and writes minimally valid JSON artifacts

