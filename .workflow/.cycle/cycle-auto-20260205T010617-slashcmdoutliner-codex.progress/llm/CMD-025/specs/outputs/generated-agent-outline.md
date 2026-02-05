# Agent Outline: memory:update-related

## Purpose

Implement and/or evolve the `/memory:update-related` slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes (small diffs; validate each phase).
- Prefer reusing existing CCW tools (`detect_changed_modules`, `update_module_claude`) over introducing new abstractions.
- Ensure y/n confirmation gate before any write behavior.

## State & Artifacts

- Primary command doc:
  - `.claude/commands/memory/update-related.md`
- Expected artifacts:
  - Writes: `CLAUDE.md` files for selected modules (changed modules + parent context).
  - Optional scratch/state (if needed by implementation): `.workflow/` (must be documented if introduced).

## Tooling

- Allowed tools: Task(*), AskUserQuestion(*), Read(*), Write(*), Bash(*)
- Non-negotiables:
  - no unrelated changes
  - batch size = 4 modules/agent (when in agent mode)
  - tool fallback order must be deterministic from `--tool`

## Validation Strategy

- P0 gates:
  - frontmatter includes `name`, `description`, `allowed-tools`
  - core sections present: Overview, Usage, Outputs / Artifacts, Execution Process, Error Handling
  - implementation pointers evidence-based (Existing vs Planned + dual-source docs+TS)
- Safety verification:
  - confirm only `CLAUDE.md` files are modified for a run
- Deterministic evidence gate:
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-025/specs/outputs/generated-slash-outline.md`
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-025/specs/outputs/gap-report.md`
