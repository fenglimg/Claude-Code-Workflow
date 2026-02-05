# Agent Outline: workflow:init

## Purpose

Implement and/or evolve `/workflow:init` to initialize project-level `.workflow/*` state (tech analysis + guidelines scaffold) using CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Evidence-based: use repo-verifiable pointers (docs headings + `ccw/src/**` anchors) for any “Existing” claims
- Delegation: use `Task(cli-explore-agent)` for deep project analysis; keep orchestrator logic thin

## State & Artifacts

- Writes:
  - `.workflow/project-tech.json` (+ `.workflow/project-tech.json.backup` when `--regenerate`)
  - `.workflow/project-guidelines.json` (scaffold if missing; may be filled by the follow-up wizard)
- Reads:
  - `.workflow/project-tech.json`
  - `.workflow/project-guidelines.json`

## Tooling

- Allowed tools: Bash(*), Task(cli-explore-agent), AskUserQuestion(*), Skill(workflow:init-guidelines), Read(*), Write(*)
- Non-negotiables:
  - no unrelated changes
  - never claim “Existing” without verifiable evidence

## Validation Strategy

- P0 gates:
  - frontmatter completeness + allowed-tools correctness
  - core sections present (Overview/Usage/Execution Process/Outputs/Error Handling)
  - artifact references are consistent (no missing paths)
  - evidence tables pass: `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=<md>`
- Behavior checks:
  - idempotent when `.workflow/project-tech.json` + `.workflow/project-guidelines.json` already exist (no `--regenerate`)
  - safe regeneration: backup before overwrite
  - interactive branch only when guidelines are unpopulated

