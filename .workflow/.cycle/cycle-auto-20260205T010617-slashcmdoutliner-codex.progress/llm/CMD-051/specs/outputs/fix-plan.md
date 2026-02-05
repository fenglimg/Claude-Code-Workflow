# Fix Plan: workflow:resume

## P0 (Must)

- Scope: Docs
  - Decide canonical invocation:
    - Option A: keep `/workflow:session:resume` as canonical and update CMD-051 to match.
    - Option B: implement `/workflow:resume` as a documented alias/wrapper.
  - Verify: `Test-Path .claude/commands/workflow/session/resume.md`

- Scope: Tooling (ccw/src)
  - Implement deterministic target selection:
    - If session id arg is provided, only allow `.workflow/active/<id>/workflow-session.json`.
    - Else select “most recent paused” using a single rule (prefer JSON `updated_at`, fallback to file mtime).
  - Implement atomic metadata update:
    - Set `status="active"`.
    - Set `resumed_at=<UTC ISO-8601>`.
  - Verify (anchors exist / edit points):
    - `rg \"const ACTIVE_BASE = '.workflow/active';\" ccw/src/tools/session-manager.ts`
    - `rg \"status: (data.status as 'active' | 'paused' | 'completed' | 'archived')\" ccw/src/core/session-scanner.ts`

## P1 (Should)

- Scope: Docs
  - Update the oracle doc example to avoid using a fixed `temp.json` filename in the repo root; prefer session-local temp file naming.

- Scope: Tests
  - Add tests for:
    - no sessions found
    - sessions exist but none paused
    - specific session id provided but not paused
    - JSON parse error / missing file

## P2 (Optional)

- Scope: UX
  - Print a compact success block including `SESSION_ID`, `paused_at` (if present), `resumed_at`, and a next-step hint.

