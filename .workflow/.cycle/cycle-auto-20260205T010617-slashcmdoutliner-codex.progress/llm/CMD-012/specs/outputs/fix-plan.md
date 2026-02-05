# Fix Plan: issue:discover

## P0

- None (evidence gates + required sections are satisfied by the generated outlines).

## P1

1. Decide naming convention for issue commands:
   - Option A: `group: issue` + `name: discover` (preferred for consistency with other `issue/*` docs)
   - Option B: `name: issue:discover` with no `group` field (current oracle style)
2. Update `/issue:discover` doc frontmatter and any derivation tooling to match the chosen convention.

## P2

1. Add a short "ID format" note for `{discovery-id}` and how collisions are avoided.
2. Add a one-line validation summary in errors (invalid perspectives, empty file match).

