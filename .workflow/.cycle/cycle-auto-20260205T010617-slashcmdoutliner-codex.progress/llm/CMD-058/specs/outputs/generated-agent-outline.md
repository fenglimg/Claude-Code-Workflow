# Agent Outline: workflow:tools:code-validation-gate

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions

## State & Artifacts

- Session folder: `.workflow/active/{session_id}/`
- Required outputs:
  - Slash MD (command doc): `.claude/commands/workflow/tools/code-validation-gate.md`
  - Gate reports:
    - `.workflow/active/{session_id}/.process/code-validation-report.md`
    - `.workflow/active/{session_id}/.process/code-validation-report.json`

## Tooling

- Allowed tools: Read(*), Write(*), Edit(*), Bash(*), Glob(*), Grep(*)
- Non-negotiables:
  - no unrelated changes
  - compilation errors block further validation
  - keep `--fix` changes safe and explicitly reported

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Evidence gate: run `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js` on generated markdown outputs
- Regression: if adopting changes into the corpus, ensure no P0 regressions for already-completed commands

