# Agent Outline: workflow:clean

## Purpose

Implement and/or evolve `/workflow:clean` according to CCW conventions: mainline detection -> drift discovery -> confirmation -> safe execution.

## Execution Model

- Default: incremental and testable (start with report-only / --dry-run, then add execution)
- Use ACE-tool to find 3+ existing patterns before introducing new abstractions

## State & Artifacts

- Session folder: `.workflow/.clean/clean-<YYYY-MM-DD>`
- Required outputs:
  - Slash MD (command doc): `.claude/commands/workflow/clean.md`
  - Discovery prompt (if used): `.codex/prompts/clean.md`
  - Generated artifacts (per run): `mainline-profile.json`, `cleanup-manifest.json`, `cleanup-report.md`

## Tooling

- Allowed tools: TodoWrite(*), Task(*), AskUserQuestion(*), Read(*), Glob(*), Bash(*), Write(*)
- Non-negotiables:
  - no unrelated changes
  - mark pointers Existing vs Planned with dual-source evidence in docs + TS

## Validation Strategy

- P0 gates:
  - frontmatter completeness + allowed-tools correctness
  - core sections present (Overview/Usage/Execution Process/Outputs/Error Handling)
  - evidence tables pass `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js`
- Safety:
  - `--dry-run` never deletes
  - `--yes/-y` uses safe defaults (sessions-only + low-risk)

