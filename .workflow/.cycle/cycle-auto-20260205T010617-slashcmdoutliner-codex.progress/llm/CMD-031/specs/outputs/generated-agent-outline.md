# Agent Outline: workflow:synthesis

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes aligned to existing workflow/brainstorm command patterns
- Use ACE-tool to locate and compare 3+ similar commands before adding new abstractions
- Prefer boring orchestration: explicit phases + clear artifacts + minimal branching

## State & Artifacts

- Session scope: `.workflow/active/WFS-*`
- Primary inputs:
  - `.workflow/active/WFS-*/workflow-session.json`
  - `.workflow/active/WFS-*/.brainstorming/*/analysis*.md`
  - `.workflow/active/WFS-*/.process/context-package.json`
- Primary outputs:
  - Updated role analyses with Enhancements + Clarifications sections
  - Updated context package and session metadata (as applicable)

## Tooling

- Allowed tools: Task(conceptual-planning-agent), TodoWrite(*), Read(*), Write(*), Edit(*), Glob(*), AskUserQuestion(*)
- Non-negotiables:
  - No unrelated changes (only touch files required by this command)
  - Evidence-based pointers only (Existing vs Planned, with verify steps)

## Validation Strategy

- P0 gates:
  - Frontmatter completeness and allowed-tools correctness
  - Core sections present in the command doc
  - Artifact paths are either created by the workflow or explicitly pre-existing
- Deterministic evidence gate:
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=<md>`
- Regression (if touching shared tooling):
  - Re-scan `.claude/commands/**/*.md` and ensure no P0 regressions in previously completed commands

