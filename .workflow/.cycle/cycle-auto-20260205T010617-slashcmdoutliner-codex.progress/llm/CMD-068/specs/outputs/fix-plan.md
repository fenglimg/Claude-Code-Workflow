# Fix Plan: workflow:workflow:ui-design:codify-style

## P0 (Must)

- No P0 fixes required for the generated outline artifacts (sections + evidence tables are present).

## P1 (Should)

1. Command identity verification
   - Decide canonical invocation string for this command in the runtime.
   - Update `/workflow:...` usage strings and any cross-references to match the canonical resolution.
2. Bash runtime prerequisites
   - Document required utilities used by the orchestrator (`mkdir`, `rm`, `date`; `jq` optional).
   - Add explicit recovery notes for when prerequisites are missing.

## P2 (Optional)

1. Tighten verification output
   - Provide a stable completion report format (absolute package path, key file list, component count if available).

