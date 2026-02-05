# Agent Outline: workflow:explore-auto

## Purpose

Implement and/or evolve `/workflow:ui-design:explore-auto` as an autonomous, multi-phase UI design workflow orchestrator with one interactive confirmation point and deterministic artifact outputs.

## Execution Model

- Default: incremental, testable changes.
- Evidence-first: locate and mirror existing UI-design orchestrator patterns before changing abstractions.
- Interaction rule: only Phase 5 target confirmation is interactive; phases 7-10 must auto-continue.

## State & Artifacts

- Run root (computed):
  - no `--session`: `.workflow/{design_id}/`
  - with `--session`: `.workflow/active/WFS-{session}/{design_id}/`
- Key outputs:
  - `{base_path}/.run-metadata.json`
  - `{base_path}/style-extraction/**`
  - `{base_path}/animation-extraction/**` (conditional)
  - `{base_path}/layout-extraction/**`
  - `{base_path}/prototypes/**` (including compare.html + PREVIEW.md)

## Tooling

- Allowed tools: Skill(*), TodoWrite(*), Read(*), Bash(*), Glob(*), Write(*), Task(conceptual-planning-agent)
- Non-negotiables:
  - no unrelated changes outside the run/session folder
  - no extra user interaction after target confirmation
  - verify nested command discovery assumptions (ui-design subfolder)

## Validation Strategy

- P0 doc gates: frontmatter + allowed-tools + core sections + artifact references.
- Evidence gates: all implementation pointers labeled Existing/Planned with dual-source evidence.
- Regression mindset: align explore-auto behavior and artifacts with imitate-auto + generate conventions before adding new features.

