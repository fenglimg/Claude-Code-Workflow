# Fix Plan: workflow:ui-design:import-from-code

## P0 (Must)

- Evidence gate: keep evidence tables in generated docs valid (dual-source + verifiable Existing rows) and re-run `verify-evidence.js` after edits.

## P1 (Should)

- Docs: normalize frontmatter `name` so it matches the invocation (`/workflow:ui-design:import-from-code`).
- Execution: document exact output paths for each agent’s `completeness-report.json` and ensure all agents follow the same conventions.
- Resilience: define the partial-failure policy (continue other agents; summarize which outputs are available).

## P2 (Optional)

- Add a compact best-practices section (recommended `--source` roots, how to interpret completeness reports, common causes of empty extraction).
