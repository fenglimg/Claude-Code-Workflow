# Agent Outline: workflow:test-fix-gen

## Purpose

Implement and/or evolve `/workflow:test-fix-gen` as a pure orchestrator that creates a test workflow session and produces L0-L3 test planning artifacts with minimal regressions.

## Execution Model

- Default: incremental, testable changes (small edits; validate after each step)
- Before changing behavior, consult existing patterns (reference commands + ccw tooling)
- Orchestrator-only: delegate heavy work to the called slash commands/agents; do not inline analysis
- Auto-continue: do not stop between phases; use TodoWrite phase markers to drive continuation

## State & Artifacts

- Primary state: workflow session folder under `.workflow/active/<testSessionId>/`
- Key artifacts created/validated:
  - `.process/context-package.json`
  - `.process/TEST_ANALYSIS_RESULTS.md`
  - `IMPL_PLAN.md`, `TODO_LIST.md`, `.task/IMPL-*.json`

## Tooling

- Allowed tools: Skill(*), TodoWrite(*), Read(*), Bash(*)
- Non-negotiables:
  - no unrelated changes
  - no false `Existing` claims in pointers; downgrade to `Planned` with concrete verify steps if uncertain
  - keep outputs concise (command doc is the source of truth; outlines drive implementation)

## Validation Strategy

- P0 gates:
  - Frontmatter completeness + allowed-tools correctness
  - Core sections present: Overview, Usage, Execution Process, Outputs/Artifacts, Error Handling
  - Evidence tables: every pointer row has docs + `ccw/src/**` anchor; Existing pointers are verifiable
- Deterministic checks:
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=<generated-slash-outline.md>`
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=<gap-report.md>`

