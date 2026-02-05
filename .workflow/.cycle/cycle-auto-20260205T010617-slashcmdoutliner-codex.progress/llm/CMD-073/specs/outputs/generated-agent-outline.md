# Agent Outline: workflow:ui-design:import-from-code

## Purpose

Implement and/or evolve `/workflow:ui-design:import-from-code` following CCW conventions: resolve an existing design-run base path, auto-discover code files, and run 3 parallel extraction agents that each write their own outputs and completeness report (no synthesis phase).

## Execution Model

- Default: incremental, testable changes (setup + discovery first; then parallel agents)
- Use ACE-tool to find existing patterns (UI-design command family, ccw tool exec patterns) before adding new abstractions
- Parallelism: use `Task` for 3 agents; tolerate partial failures (one agent can fail without discarding others)

## State & Artifacts

- Session folder: the resolved design-run `<base_path>` under `.workflow/**`
- Required outputs (written under `<base_path>`):
  - `.intermediates/import-analysis/discovered-files.json`
  - `style-extraction/style-1/design-tokens.json` + `style-extraction/style-1/completeness-report.json`
  - `animation-extraction/animation-tokens.json` + `animation-extraction/completeness-report.json`
  - `layout-extraction/layout-templates.json` + `layout-extraction/completeness-report.json`

## Tooling

- Allowed tools: Read,Write,Bash,Glob,Grep,Task,TodoWrite
- Non-negotiables:
  - never claim pointers are Existing without repo verification
  - base path resolution priority: `--design-id` > `--session` > error
  - each agent writes its own `completeness-report.json` directly; no synthesis

## Validation Strategy

- P0 gates: frontmatter completeness, allowed-tools correctness, core sections present, artifact references not broken
- Evidence: evidence tables must pass `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js`
- Runtime checks (implementation time): verify discovery JSON exists and each agent's output files exist/non-empty
