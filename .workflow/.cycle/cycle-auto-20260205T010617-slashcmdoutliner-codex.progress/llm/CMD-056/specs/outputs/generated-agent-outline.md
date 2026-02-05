# Agent Outline: workflow:test-cycle-execute

## Purpose

Implement and/or evolve the `/workflow:test-cycle-execute` command doc so it reliably orchestrates an iterative test-and-fix loop (>= 95% pass rate or max iterations) while preserving resume-ability and evidence-based pointers.

## Execution Model

- Iterative loop with explicit stop conditions:
  - Stop on pass rate >= 95% (criticality-aware) or pass rate === 100%
  - Stop on max iterations (default: 10; override via `--max-iterations`)
- Orchestrator boundary:
  - The slash command doc is the only orchestrator for test failure handling
  - Delegate analysis/generation to `@cli-planning-agent` via `Task`
  - Delegate fix execution/testing to `@test-fix-agent` via `Task`

## State & Artifacts

- Session root: `.workflow/active/<session>/`
- Key files:
  - Session metadata: `workflow-session.json`
  - Tasks: `.task/IMPL-*.json` and `.task/IMPL-fix-<N>.json`
  - Process state: `.process/iteration-state.json`, `.process/test-results.json`, `.process/test-output.log`
  - Logs: `.process/iteration-<N>-analysis.md`, `.process/iteration-<N>-cli-output.txt`
  - Tracking: `TODO_LIST.md` (TodoWrite updates)

## Tooling

- Allowed tools (frontmatter): Skill(*), TodoWrite(*), Read(*), Bash(*), Task(*)
- Critical conventions:
  - Keep changes incremental and testable
  - Do not touch unrelated repo changes
  - Do not mark pointers as Existing without verification; downgrade to Planned with verify steps

## Validation Strategy

- P0 gates (must pass):
  - Frontmatter correctness
  - Core sections present
  - Evidence tables pass the deterministic gate:
    - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=<md>`
- Behavioral validation (doc-driven):
  - Resume path explains how iteration-state/test-results are loaded and continued
  - Max-iteration behavior explains hard stop and failure-report output

