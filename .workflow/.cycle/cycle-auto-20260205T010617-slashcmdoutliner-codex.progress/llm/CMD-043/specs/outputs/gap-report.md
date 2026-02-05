# Gap Report: workflow:plan

## Reference

- Selected reference: /workflow:plan (`.claude/commands/workflow/plan.md`)

## P0 Gaps (Must Fix)

- None

## P1 Gaps (Should Fix)

- None (outline intentionally condenses the oracle into an implementation-oriented summary; expand sections only if the goal is doc parity rather than a development outline)

## P2 Gaps (Optional)

- Add explicit cross-links to follow-up commands (`/workflow:plan-verify`, `/workflow:execute`) in the generated slash outline if you want the outline to serve as a navigation index.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/plan.md` | Existing | docs: `.claude/commands/workflow/plan.md` / `Workflow Plan Command (/workflow:plan)` ; ts: `ccw/src/tools/command-registry.ts` / `commandName.startsWith('/workflow:')` | `Test-Path .claude/commands/workflow/plan.md; rg "commandName.startsWith('/workflow:')" ccw/src/tools/command-registry.ts` | Canonical spec/oracle for CMD-043; TS registry is the repo-side mechanism for resolving command docs |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/plan.md` / `Input Processing` ; ts: `ccw/src/tools/command-registry.ts` / `const filePath = join(this.commandDir,` | `Test-Path ccw/src/tools/command-registry.ts; rg "const filePath = join(this.commandDir," ccw/src/tools/command-registry.ts` | Links the markdown slash-command corpus to repo-side tooling |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/plan.md` / `Data Flow` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path ccw/src/tools/session-manager.ts; rg "const ACTIVE_BASE = '.workflow/active';" ccw/src/tools/session-manager.ts` | Defines the active session base directory used by workflow artifacts |
| `ccw/src/core/routes/session-routes.ts` | Existing | docs: `.claude/commands/workflow/plan.md` / `Data Flow` ; ts: `ccw/src/core/routes/session-routes.ts` / `if (pathname === '/api/session-detail') {` | `Test-Path ccw/src/core/routes/session-routes.ts; rg "pathname === '/api/session-detail'" ccw/src/core/routes/session-routes.ts` | Server route that exposes session details (incl. impl-plan + conflict) for dashboards |
| `.workflow/active/<sessionId>/IMPL_PLAN.md` | Planned | docs: `.claude/commands/workflow/tools/task-generate-agent.md` / `Document Generation Lifecycle` ; ts: `ccw/src/core/routes/session-routes.ts` / `join(normalizedPath, 'IMPL_PLAN.md')` | `rg "join(normalizedPath, 'IMPL_PLAN.md')" ccw/src/core/routes/session-routes.ts` | Primary runtime plan output; not committed in repo |
| `.workflow/active/<sessionId>/.task/IMPL-*.json` | Planned | docs: `.claude/commands/workflow/plan-verify.md` / `Execution Steps` ; ts: `ccw/src/commands/session-path-resolver.ts` / `'.task/': 'task'` | `rg "'.task/': 'task'" ccw/src/commands/session-path-resolver.ts` | Runtime task artifacts validated by plan verification and consumed by execution tooling |

## Implementation Hints (Tooling/Server)

- `ccw/src/tools/command-registry.ts`: normalizes `/workflow:*` names and maps them to `.claude/commands/workflow/*.md`.
- `ccw/src/core/routes/session-routes.ts`: serves IMPL plan and conflict/context slices via `/api/session-detail`.
- `ccw/src/commands/session-path-resolver.ts`: maps `.task/*.json` paths to typed content.

## Proposed Fix Plan (Minimal)

- No code changes required for CMD-043 outline generation; keep evidence rows in sync with repo paths/anchors.
- Re-run evidence gate whenever updating pointer lists or swapping reference commands.

