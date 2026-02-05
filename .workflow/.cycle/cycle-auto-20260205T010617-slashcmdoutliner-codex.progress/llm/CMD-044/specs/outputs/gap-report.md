# Gap Report: workflow:replan

## Reference

- Selected reference: /workflow:replan (`.claude/commands/workflow/replan.md`)

## P0 Gaps (Must Fix)

- None identified against the quality-gates core requirements (frontmatter/tools/sections/artifacts + evidence table present).

## P1 Gaps (Should Fix)

- Generated outline is intentionally minimal; it does not enumerate the exact question sets per mode (Session vs Task) or the detailed validation checklist used during Phase 6.
- If implementing automation beyond documentation, align the backup manifest content and restore command to the existing `.process/` conventions used by CCW tooling.

## P2 Gaps (Optional)

- None.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/replan.md` | Existing | docs: `.claude/commands/workflow/replan.md` / `Overview` ; ts: `ccw/src/commands/session-path-resolver.ts` / `'workflow-session.json': 'session'` | `Test-Path .claude/commands/workflow/replan.md` | Oracle behavior + sections |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/replan.md` / `Phase 4: Backup Creation` ; ts: `ccw/src/tools/session-manager.ts` / `ensureDir(join(sessionPath, '.process'))` | `Test-Path ccw/src/tools/session-manager.ts; rg "ensureDir(join(sessionPath, '.process'))" ccw/src/tools/session-manager.ts` | `.process/` directory + session operations |
| `ccw/src/commands/session-path-resolver.ts` | Existing | docs: `.claude/commands/workflow/replan.md` / `Phase 5: Apply Modifications` ; ts: `ccw/src/commands/session-path-resolver.ts` / `'IMPL_PLAN.md': 'plan'` | `Test-Path ccw/src/commands/session-path-resolver.ts; rg "'IMPL_PLAN.md': 'plan'" ccw/src/commands/session-path-resolver.ts` | Maps plan/todo/tasks to canonical paths |
| `ccw/src/core/session-scanner.ts` | Existing | docs: `.claude/commands/workflow/replan.md` / `Execution Lifecycle` ; ts: `ccw/src/core/session-scanner.ts` / `const sessionFile = join(sessionPath, 'workflow-session.json')` | `Test-Path ccw/src/core/session-scanner.ts; rg "const sessionFile = join(sessionPath, 'workflow-session.json')" ccw/src/core/session-scanner.ts` | Reads session metadata |
| `.workflow/active/{session_id}/.process/backup/replan-{timestamp}/MANIFEST.md` | Planned | docs: `.claude/commands/workflow/replan.md` / `Replan Backup Manifest` ; ts: `ccw/src/tools/session-manager.ts` / `process: '{base}/.process/{filename}'` | `Test-Path .workflow/active` | Backup manifest path + restore guidance |

## Implementation Hints (Tooling/Server)

- Reuse `.process/` conventions for operational artifacts (backups/manifest) to stay consistent with `session-manager`.
- Use `session-path-resolver` mappings to avoid hardcoding plan/todo/task filenames and to keep path resolution consistent.

## Proposed Fix Plan (Minimal)

1. Validate the evidence tables with the deterministic gate script (treat failures as P0).
2. If any paths or anchors drift, downgrade pointers to Planned and add concrete Verify commands.
3. When expanding from outline to full doc/implementation, copy only headings/structure from the oracle (no bulk leakage), and keep edits scoped to this command.

