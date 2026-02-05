# Fix Plan: workflow:review-session-cycle

## P0 (Must)

- No P0 fixes identified for the generated outlines (evidence + core sections are present).

## P1 (Should)

1. Tooling: extend session path inference for review state/progress/reports
   - Scope: `ccw/src/commands/session-path-resolver.ts`
   - Change: add explicit handling for:
     - `.review/review-state.json`
     - `.review/review-progress.json`
     - `.review/reports/*`
   - Verify:
     - `rg \"\\.review/dimensions/\" ccw/src/commands/session-path-resolver.ts` (baseline)
     - Add new anchors and confirm `rg \"review-progress\" ccw/src/commands/session-path-resolver.ts` finds them
2. UX: document/read examples for newly supported review artifacts
   - Scope: `ccw/src/commands/session.ts`
   - Change: add help examples for `.review/review-state.json`, `.review/review-progress.json`, `.review/reports/*`
   - Verify:
     - `rg \"\\.review/dimensions/security\\.json\" ccw/src/commands/session.ts` (baseline)
     - Add new anchors and confirm `rg \"review-state\" ccw/src/commands/session.ts` finds them

## P2 (Optional)

- Harmonize deep-dive iteration naming/globs across docs and any consumer tooling so report discovery is consistent.

