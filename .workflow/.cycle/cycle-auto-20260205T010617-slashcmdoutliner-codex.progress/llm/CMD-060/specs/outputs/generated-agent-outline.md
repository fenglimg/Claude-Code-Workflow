# Agent Outline: workflow:gather

## Purpose

Implement and/or evolve the slash command to gather project context into a standardized `context-package.json` for implementation planning.

## Execution Model

- Default: incremental, testable changes; prefer reuse of existing workflow/session patterns.
- First action: locate existing reference commands and tooling code before adding new abstractions.
- Detection-first: return an existing valid `context-package.json` when present for the same session.

## State & Artifacts

- Session root: `.workflow/active/<session_id>/`
- Primary outputs:
  - `.workflow/active/<session_id>/.process/context-package.json`
  - `.workflow/active/<session_id>/.process/explorations-manifest.json`
  - `.workflow/active/<session_id>/.process/exploration-<angle>.json`

## Tooling

- Allowed tools: Task(*), Read(*), Glob(*)
- Non-negotiables:
  - no unrelated changes
  - do not claim code/doc pointers exist unless verifiable in repo
  - keep artifacts under the session folder

## Validation Strategy

- P0 gates:
  - frontmatter completeness (`name`, `description`, `allowed-tools`, `group`)
  - allowed-tools reflects actual behavior (or explicitly route writes through Task subagents)
  - core sections present (Overview, Usage, Execution Process, Outputs/Artifacts, Error Handling)
- Deterministic evidence gate:
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=<generated md>`

