# Agent Outline: workflow:session:solidify

## Purpose

Implement and/or evolve the `/workflow:session:solidify` slash command so session decisions (conventions/constraints/learnings) persist in `.workflow/project-guidelines.json` and remain compatible with CCW tooling.

## Execution Model

- Default: incremental, testable changes; update the command doc first, then validate tooling integration.
- Discovery first: use ACE-tool to confirm existing patterns for guidelines schema and consumers before changing JSON shape.

## State & Artifacts

- Primary artifact:
  - `.workflow/project-guidelines.json` (create scaffold if missing; preserve existing content if present)
- Related consumers to sanity-check:
  - `/workflow:tools:context-gather` output packaging
  - CCW server/core guidelines loading (project overview)

## Tooling

- Allowed tools: Read(*), Write(*), AskUserQuestion(*), Bash(*)
- Non-negotiables:
  - no unrelated changes
  - avoid new abstractions; follow existing `.workflow/*` state patterns
  - do not overwrite malformed JSON; fail loudly with a clear recovery path

## Validation Strategy

- P0 gates:
  - frontmatter has `name`, `description`, `allowed-tools`, `argument-hint`
  - core sections present (Overview, Usage, Outputs/Artifacts, Execution Process, Error Handling)
  - evidence tables pass: `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=<md>`
- Functional checks (manual):
  - create scaffold when missing, then append a convention/constraint/learning
  - duplicate rule detection
  - interactive prompts cover type/category/rule and honor `--yes`
