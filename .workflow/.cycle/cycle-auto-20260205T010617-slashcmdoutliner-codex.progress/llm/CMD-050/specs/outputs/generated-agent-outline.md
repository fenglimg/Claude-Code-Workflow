# Agent Outline: workflow:session:list

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions

## State & Artifacts

- Session folder (if used): `.workflow/active/WFS-*/`
- Required outputs:
  - Slash MD (command doc): `.claude/commands/workflow/session/list.md`
  - Any scripts/modules referenced by the command (prefer existing tooling: `session_manager`)
  - Validation notes (evidence table + verify-evidence gate)

## Tooling

- Allowed tools: Bash(*)
- Non-negotiables:
  - no unrelated changes
  - verify non-regression against completed corpus

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Evidence: dual-source pointers (docs + ccw/src anchors) and pass `verify-evidence.js`
