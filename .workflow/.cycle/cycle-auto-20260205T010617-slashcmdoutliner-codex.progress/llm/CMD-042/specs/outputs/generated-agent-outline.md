# Agent Outline: workflow:plan-verify

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions

## State & Artifacts

- Session folder: `.workflow/active/WFS-{session}/`
- Required outputs:
  - Slash MD (command doc): `.claude/commands/workflow/plan-verify.md`
  - Verification report: `.workflow/active/WFS-{session}/.process/PLAN_VERIFICATION.md`

## Tooling

- Allowed tools: Read(*), Write(*), Glob(*), Bash(*)
- Non-negotiables:
  - no unrelated changes
  - do not modify source planning/synthesis artifacts (read-only inputs)

## Validation Strategy

- P0 gates:
  - frontmatter present (name/description/allowed-tools)
  - core sections present (Overview, Usage, Execution Process, Outputs/Artifacts, Error Handling)
  - artifact references are consistent with session-manager conventions
- Evidence gate:
  - run `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js` on the generated outline + gap report

