# Phase 05: Regression + Closure

## Goal

Make sure improvements do not regress previously-validated commands (non-regression).

## What to Update (Cycle Mode)

When iterating against the full corpus:
- Update per-command status in `corpus-manifest.json`
- Check off `TODO_LIST.md` items
- Save snapshots in `regression/expected/` for commands marked completed
- Write snapshot diffs into `regression/diff/` and block on unexpected changes

## Non-regression Policy

See `../specs/quality-gates.md`.

## Completion Criteria

- All commands in `.claude/commands/**/*.md` are marked completed in the corpus manifest
- Regression gate passes over the completed set
- The skill remains concise (avoid duplicating the entire CCW handbook)
