# Agent Outline: workflow:review-session-cycle

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Reference-first: align on `/workflow:review-module-cycle` patterns, then adjust scope selection to session git changes
- Hybrid execution:
  - parallel dimension scans (7 dimensions by default)
  - iterative deep-dive loop until completion criteria or `--max-iterations`

## State & Artifacts

- Session folder (required): `.workflow/active/WFS-{session-id}/`
- Review outputs (created/updated by this command):
  - `.workflow/active/WFS-{session-id}/.review/review-state.json`
  - `.workflow/active/WFS-{session-id}/.review/review-progress.json`
  - `.workflow/active/WFS-{session-id}/.review/dimensions/*.json`
  - `.workflow/active/WFS-{session-id}/.review/iterations/*.json`
  - `.workflow/active/WFS-{session-id}/.review/reports/*`

## Tooling

- Allowed tools: Skill(*), TodoWrite(*), Read(*), Bash(*), Task(*)
- Non-negotiables:
  - no unrelated changes
  - do not apply fixes in this command (delegate to `/workflow:review-cycle-fix`)
  - preserve the orchestrator boundary: coordinate + aggregate, delegate analysis to agents

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Evidence gate: every implementation pointer row includes docs + TS anchors; Existing claims verifiable
- Behavior checks:
  - session discovery: explicit session-id vs single active session vs multiple active sessions (error)
  - dimension filtering: subset selection produces only those dimension artifacts
  - iteration control: `--max-iterations=0` skips deep-dive; reaching max produces partial success warnings

