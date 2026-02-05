# Agent Outline: workflow:tdd-verify

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions
- Keep the command read-only with respect to workflow inputs (tasks/implementation) and limit writes to report artifacts

## State & Artifacts

- Session folder: `.workflow/active/WFS-{session-id}/`
- Required outputs:
  - Slash MD (command doc): `.claude/commands/workflow/tdd-verify.md`
  - Primary report: `.workflow/active/WFS-{session-id}/TDD_COMPLIANCE_REPORT.md`
  - Intermediate artifacts (from coverage analysis): `.workflow/active/WFS-{session-id}/.process/*`

## Tooling

- Allowed tools: Skill(*), TodoWrite(*), Read(*), Write(*), Bash(*), Glob(*)
- Non-negotiables:
  - no unrelated changes
  - do not modify task JSONs or implementation code
  - verify non-regression against completed corpus where applicable

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Evidence: all key pointers labeled Existing vs Planned, with docs + TS anchors and concrete Verify commands
- Deterministic gate: run `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=<md>` on the slash outline and gap report

