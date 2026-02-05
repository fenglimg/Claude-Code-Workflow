# Gap Report: other:ccw

## Reference

- Selected reference: `/ccw` (`.claude/commands/ccw.md`)

## P0 Gaps (Must Fix)

- None found for this outline generation run (frontmatter + core sections + evidence tables are present).

## P1 Gaps (Should Fix)

- Add a concise decision tree for workflow selection (task_type/complexity -> workflow level).
- Add a minimal, explicit mapping of "minimum execution units" to command pairs/groups (to prevent partial execution).
- Specify the status file schema (required fields + lifecycle transitions) referenced by `.workflow/.ccw/<session_id>/status.json`.
- Make with-file routing explicit (keywords -> target with-file workflow commands) with 1-2 ASCII examples.

## P2 Gaps (Optional)

- Expand examples to cover: auto-confirm, replan after user adjustment, and failure/retry at unit boundary.
- Add a short "why" note clarifying the difference between `/ccw` (main process) and `/ccw-coordinator` (external/CLI execution).

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/ccw.md` | Existing | docs: `.claude/commands/ccw.md` / `CCW Command - Main Workflow Orchestrator` ; ts: `ccw/src/core/routes/commands-routes.ts` / `scanCommandsRecursive` | `Test-Path .claude/commands/ccw.md` | oracle command doc; primary behavioral reference |
| `.workflow/.ccw/<session_id>/status.json` | Planned | docs: `.claude/commands/ccw.md` / `State Management` ; ts: `ccw/src/commands/hook.ts` / `.workflow/.ccw/ccw-123/status.json` | `Test-Path .workflow/.ccw/<session_id>/status.json` | runtime artifact for per-command/unit progress tracking |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/ccw.md` / `Usage` ; ts: `ccw/src/core/routes/commands-routes.ts` / `getCommandGroup(` | `Test-Path ccw/src/core/routes/commands-routes.ts` | command discovery/grouping surface used by UI/API |
| `ccw/src/core/routes/help-routes.ts` | Existing | docs: `.claude/commands/ccw.md` / `Usage` ; ts: `ccw/src/core/routes/help-routes.ts` / `.claude/skills/ccw-help/command.json` | `Test-Path ccw/src/core/routes/help-routes.ts` | help endpoint surfaces slash-command metadata |
| `ccw/src/commands/hook.ts` | Existing | docs: `.claude/commands/ccw.md` / `State Management` ; ts: `ccw/src/commands/hook.ts` / `.workflow/.ccw/ccw-123/status.json` | `Test-Path ccw/src/commands/hook.ts` | existing tool chain expects status-path conventions |

## Implementation Hints (Tooling/Server)

- Command grouping defaults exist in `ccw/src/core/routes/commands-routes.ts` (default group and group inference).
- Help routing references `.claude/skills/ccw-help/command.json` from `ccw/src/core/routes/help-routes.ts`; keep `/ccw` metadata consistent with that registry.
- Status-path conventions already appear in `ccw/src/commands/hook.ts`; align any session/status file naming with those conventions to avoid drift.

## Proposed Fix Plan (Minimal)

See `fix-plan.md`.
