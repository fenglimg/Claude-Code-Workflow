# Agent Outline: workflow:complete

## Purpose

Implement and/or evolve the slash command `/workflow:complete` as a thin alias for session completion, aligned with existing CCW workflow session lifecycle behavior.

## Execution Model

- Default: incremental, testable changes (docs + indexes first)
- Prefer reuse over duplication: delegate to `/workflow:session:complete` instead of copying large scripts
- Use repo searches (ACE-tool / rg) to confirm exact existing paths and anchors before marking anything `Existing`

## State & Artifacts

- Workflow state:
  - Active sessions: `.workflow/active/`
  - Archives: `.workflow/archives/`
- Required outputs:
  - New command doc: `.claude/commands/workflow/complete.md`
  - Any index/registry updates that surface the new alias (help + command indexes)

## Tooling

- Allowed tools: Skill(*), AskUserQuestion(*), Read(*), Write(*), Bash(*)
- Non-negotiables:
  - no unrelated changes
  - keep pointers evidence-based (Existing vs Planned + dual-source evidence)

## Validation Strategy

- P0 gates:
  - frontmatter completeness + core sections present
  - allowed-tools is plausible for described behavior (or explicitly delegates)
  - no broken artifact references
  - evidence tables pass deterministic verification
- Deterministic check:
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=<generated md>`

