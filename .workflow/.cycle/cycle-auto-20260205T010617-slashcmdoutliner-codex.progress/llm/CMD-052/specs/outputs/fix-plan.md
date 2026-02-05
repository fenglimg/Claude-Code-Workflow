# Fix Plan: workflow:session:solidify

## P0 (Must)

- [command-doc] Resolve command identity: confirm `/workflow:session:solidify` as canonical; if `/workflow:solidify` is required, add it explicitly as an alias and document it.
- [command-doc] Add `allowed-tools: Read(*), Write(*), AskUserQuestion(*), Bash(*)` to frontmatter (and keep it accurate as implementation evolves).
- [implementation] Ensure `.workflow/project-guidelines.json` scaffold is created when missing (schema-aligned) before first update.
- [implementation] Preserve existing guidelines content; do not overwrite on JSON parse error.
- [implementation] Enforce type/category validation and duplicate detection with clear user-facing output.

## P1 (Should)

- [command-doc] Specify valid categories per type (and exact error messages for invalid combinations).
- [implementation] Define interactive question flow + defaults; ensure `--yes` skips confirmations but still validates inputs.
- [tooling] Sanity-check compatibility with existing consumers (`ccw/src/core/data-aggregator.ts`, `ccw/src/core/routes/ccw-routes.ts`).

## P2 (Optional)

- [command-doc] Add troubleshooting section (malformed JSON recovery, duplicate rule behavior).
