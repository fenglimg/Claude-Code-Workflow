# Fix Plan: (none):ccw-coordinator

## P0 (Must)

1. [docs] Reconcile discovery claims vs implementation
   - Either scope coordinator to workflow-only discovery OR define multi-root discovery as the contract.
2. [ts] If multi-root is required, implement it deterministically
   - Extend `ccw/src/tools/command-registry.ts` or introduce a small adapter used by the coordinator.

## P1 (Should)

3. [tests] Add coverage for discovery behavior
   - Multiple roots (workflow + issue + top-level), nested dirs, disabled commands.
4. [docs] Make completion/resume signaling explicit
   - Document the exact mechanism that resumes the chain without TaskOutput polling.

## P2 (Optional)

5. [docs] Add optional coordinator flags (only if consistent with CCW)
   - `--depth`, `--auto-confirm`, `--verbose`.

