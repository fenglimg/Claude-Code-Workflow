# Agent Outline: workflow:imitate-auto

## Purpose

Implement and/or evolve the UI-design orchestrator `/workflow:ui-design:imitate-auto` according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes (phase-by-phase)
- Before edits: use ACE-tool to locate 3+ similar workflows (ui-design family) and match their TodoWrite + auto-continue patterns
- Orchestration rule: Skill execute expands tasks; this orchestrator executes attached tasks itself and collapses them into phase summaries

## State & Artifacts

- Run directory (standalone): `.workflow/active/<run_id>/`
- Session directory (integrated): `.workflow/active/WFS-<session>/` (pre-existing; referenced/updated)
- Required outputs:
  - `style-extraction/`, `animation-extraction/`, `layout-extraction/`, `prototypes/`
  - completion report (phase status + paths)

## Tooling

- Allowed tools: Skill(*), TodoWrite(*), Read(*), Write(*), Bash(*)
- Non-negotiables:
  - no unrelated changes
  - keep the workflow continuous until Phase 4 completion criteria are met

## Validation Strategy

- P0 gates:
  - frontmatter + allowed-tools
  - core sections + artifact references
  - evidence tables pass `verify-evidence.js` for outline + gap-report
- Behavioral validation:
  - simulate parameter parsing paths (glob-only, path-only, pure text, multi-part via `|`, legacy flags)
  - confirm phase-to-phase auto-continue and proper collapse of attached tasks
