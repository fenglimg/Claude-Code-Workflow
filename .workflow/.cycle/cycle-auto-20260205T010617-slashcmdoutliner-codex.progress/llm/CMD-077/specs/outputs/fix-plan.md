# Fix Plan: workflow:unified-execute-with-file (Minimal)

## P0 (Must)

1) Docs: make `-y/--yes` semantics explicit (what prompts are skipped; what is still blocked without explicit flags).
2) Docs: make multi-plan behavior explicit (ordering, one session per plan, failure handling).
3) Evidence: keep pointer rows accurate (`Existing` only when verifiable) and keep docs/TS anchors literal and current.

## P1 (Should)

1) Docs: define a compact event schema for `execution-events.md` (event types + required fields) and keep it append-only.
2) Docs: add resume rules and a single concrete resume example.
3) Optional tooling: if schema parsing becomes important, add a tiny parser/validator (keep it repo-local and deterministic).

## P2 (Optional)

1) Docs: add troubleshooting table + best practices for task-scoped commits under `--auto-commit`.

