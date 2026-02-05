# Gap Report: workflow:review-session-cycle

## Reference

- Selected reference: `/workflow:review-module-cycle` (`.claude/commands/workflow/review-module-cycle.md`)

## P0 Gaps (Must Fix)

- None detected for outline quality gates (frontmatter, allowed-tools, core sections, and artifact references are present).

## P1 Gaps (Should Fix)

- Tooling parity: CCW session path inference supports `.review/dimensions/*`, `.review/iterations/*`, `.review/fixes/*`, but does not appear to support `.review/review-state.json`, `.review/review-progress.json`, or `.review/reports/*` as first-class read/write targets.
- Session selection edge case: multiple active sessions require explicit `session-id`; ensure the command doc’s error messaging is consistent with other session-scoped commands.

## P2 Gaps (Optional)

- Standardize iteration file naming in tooling/docs (ensure deep-dive outputs are easy to discover via predictable globbing patterns).

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/review-session-cycle.md` | Existing | docs: `.claude/commands/workflow/review-session-cycle.md` / Session File Structure ; ts: `ccw/src/core/routes/commands-routes.ts` / scanCommandsRecursive( | `Test-Path .claude/commands/workflow/review-session-cycle.md ; rg \"scanCommandsRecursive\\(\" ccw/src/core/routes/commands-routes.ts` | Command doc and CCW command discovery |
| `.claude/commands/workflow/review-module-cycle.md` | Existing | docs: `.claude/commands/workflow/review-module-cycle.md` / Quick Start ; ts: `ccw/src/core/routes/commands-routes.ts` / parseCommandFrontmatter | `Test-Path .claude/commands/workflow/review-module-cycle.md ; rg \"function parseCommandFrontmatter\" ccw/src/core/routes/commands-routes.ts` | Closest reference for orchestration + artifact contracts |
| `ccw/src/commands/session-path-resolver.ts` | Existing | docs: `.claude/commands/workflow/review-session-cycle.md` / Session File Structure ; ts: `ccw/src/commands/session-path-resolver.ts` / .review/iterations/ | `Test-Path ccw/src/commands/session-path-resolver.ts ; rg \"\\.review/iterations/\" ccw/src/commands/session-path-resolver.ts` | Current `.review/*` path inference surface |
| `ccw/src/commands/session.ts` | Existing | docs: `.claude/commands/workflow/review-session-cycle.md` / Review Progress JSON ; ts: `ccw/src/commands/session.ts` / .review/dimensions/security.json | `Test-Path ccw/src/commands/session.ts ; rg \"\\.review/dimensions/security\\.json\" ccw/src/commands/session.ts` | Session read/write entry point; shows review dimension example |
| `.workflow/active/WFS-{session-id}/.review/review-state.json` | Planned | docs: `.claude/commands/workflow/review-session-cycle.md` / Review State JSON ; ts: `ccw/src/commands/session-path-resolver.ts` / PATH_PREFIX_TO_CONTENT_TYPE | `Test-Path .workflow/active/WFS-{session-id}/.review/review-state.json (after running the command)` | Key orchestrator state file produced by this command |
| `.workflow/active/WFS-{session-id}/.review/reports/` | Planned | docs: `.claude/commands/workflow/review-session-cycle.md` / Session File Structure ; ts: `ccw/src/commands/session-path-resolver.ts` / PATH_PREFIX_TO_CONTENT_TYPE | `Test-Path .workflow/active/WFS-{session-id}/.review/reports/ (after running the command)` | Human-readable artifacts; consider adding resolver support for discoverability |

## Implementation Hints (Tooling/Server)

- Command discovery/UI: `ccw/src/core/routes/commands-routes.ts` infers command groups from `.claude/commands/**` directory structure and parses frontmatter for name/description/argument-hint/allowed-tools.
- Session operations: `ccw/src/commands/session.ts` routes to the `session_manager` tool and already documents `.review/dimensions/*` as a supported read target; extending it for other `.review/*` artifacts would improve ergonomics.

## Proposed Fix Plan (Minimal)

See `fix-plan.md`.

