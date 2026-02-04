# Phase 01: Collect Spec (No Leakage)

## Goal

Turn a human requirement/rules document into a **minimal, structured spec** that is sufficient to generate:

- Slash command outline (CCW command MD skeleton)
- Agent outline (execution + tools + state)

Do **not** copy/paste existing implementation docs as input; treat them as oracle only during gap analysis.

## Required Inputs (ask if missing)

1. Command identity:
   - `group` (workflow|issue|learn|cli|other)
   - `name` (kebab-case)
   - `description` (one sentence)
   - `argument-hint` (optional)
2. Allowed tools:
   - exact list for frontmatter `allowed-tools`
3. Intended workflow type:
   - `single-shot` (one pass) vs `iterative` (multi-round) vs `execute-loop`
4. Required artifacts:
   - which files should be created/updated (paths)
5. Hard constraints:
   - limits (max rounds, max options, timeouts, safety constraints)

## Output (write to file)

Write a single file:

- `specs/outputs/spec.json` (or in cycle mode: `{cycle}/specs/{command}.spec.json`)

Schema guidance: see `../specs/spec-input.md`.
