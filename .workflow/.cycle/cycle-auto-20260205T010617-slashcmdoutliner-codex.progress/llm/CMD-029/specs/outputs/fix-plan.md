# Fix Plan: workflow:brainstorm:auto-parallel

## P0 (Must)

- Evidence gate: run `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=<md>` on the generated outline and gap report; keep all pointers evidence-backed.

## P1 (Should)

- Define deterministic arg parsing for `--count N` (default and invalid inputs) and session selection when multiple sessions exist.
- Document coordinator boundaries: orchestrator delegates interactive steps to invoked subcommands; orchestrator reports artifacts and next steps.

## P2 (Optional)

- Standardize completion report format across brainstorm commands (session path + artifact paths).

