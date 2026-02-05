# Gap Report: workflow:resume

## Reference

- Selected reference: `/workflow:session:list` (`.claude/commands/workflow/session/list.md`)

## P0 Gaps (Must Fix)

- Command identity mismatch in corpus: requirements/spec outline target `/workflow:resume`, but the oracle doc title uses `/workflow:session:resume`. Decide a single canonical invocation and document/alias accordingly.
- Resume metadata field is not standardized in existing TS: `resumed_at` is not referenced in `ccw/src/**` today; if required, define and propagate it consistently (scan, display, update).
- “Most recent paused session” selection needs a deterministic rule (mtime vs `updated_at` vs explicit paused timestamp) to avoid resuming the wrong session.

## P1 Gaps (Should Fix)

- Oracle doc uses ad-hoc `jq > temp.json && mv`; the outline should prefer session-aware atomic writes (temp file next to target, unique name) to avoid collisions.
- If a specific session id is supplied, behavior should explicitly validate it is under `.workflow/active/` and has `status="paused"` before modifying anything.

## P2 Gaps (Optional)

- Consider printing a short “next command” hint (e.g. `/workflow:execute`) and optionally the paused-at timestamp when present.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/session/resume.md` | Existing | docs: `.claude/commands/workflow/session/resume.md` / `Resume Workflow Session (/workflow:session:resume)` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path .claude/commands/workflow/session/resume.md` | Oracle behavior reference (do not copy full content into spec). |
| `ccw/src/core/session-scanner.ts` | Existing | docs: `.claude/commands/workflow/session/list.md` / `Implementation Flow` ; ts: `ccw/src/core/session-scanner.ts` / `const sessionFile = join(sessionPath, 'workflow-session.json');` | `Test-Path ccw/src/core/session-scanner.ts; rg \"const sessionFile = join(sessionPath, 'workflow-session.json');\" ccw/src/core/session-scanner.ts` | Existing session discovery + metadata parsing to support filtering by `status`. |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/session/resume.md` / `Step 4: Update Session Status` ; ts: `ccw/src/tools/session-manager.ts` / `session: '{base}/workflow-session.json',` | `Test-Path ccw/src/tools/session-manager.ts; rg \"session: '{base}/workflow-session.json'\" ccw/src/tools/session-manager.ts` | Centralized read/write router for session content; good extension point for a resume operation. |
| `.claude/commands/workflow/resume.md` | Planned | docs: `.claude/commands/workflow/session/resume.md` / `Usage` ; ts: `ccw/src/commands/session.ts` / `const result = await executeTool('session_manager', params);` | `Test-Path .claude/commands/workflow/resume.md` | Optional alias doc to make `/workflow:resume` exist as a top-level command without nested naming ambiguity. |

## Implementation Hints (Tooling/Server)

- Prefer building resume on top of `session_manager` (read + update/write) instead of raw shell edits, to keep behavior cross-platform and consistent.
- Reuse `scanSessions(...)` parsing behavior for status normalization (`paused`, `active`, etc.) so resume selection logic matches dashboard/CLI views.

## Proposed Fix Plan (Minimal)

1. Docs: pick canonical command string; if `/workflow:resume` is desired, add an alias doc and cross-link from the existing `session/resume.md`.
2. Tooling: add a deterministic “resume” operation (or helper) that selects most recent paused session and atomically updates status + timestamp.
3. Validation: add a small set of tests around selection + JSON update behavior; re-run evidence gate for outlines.

