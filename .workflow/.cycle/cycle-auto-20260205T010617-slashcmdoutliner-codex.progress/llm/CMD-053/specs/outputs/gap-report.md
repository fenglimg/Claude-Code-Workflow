# Gap Report: workflow:session:start

## Reference

- Selected reference: /workflow:session:start (`.claude/commands/workflow/session/start.md`)

## P0 Gaps (Must Fix)

- None observed in the generated outline (frontmatter keys present; core sections present; evidence table provided).

## P1 Gaps (Should Fix)

- Align the slash outline's execution steps with the oracle's mode substeps (Mode 1/2/3) so implementers can map 1:1.
- Ensure the output contract is explicit for all modes (Discovery vs Auto vs Force-new) including warning lines for multi-session auto mode.

## P2 Gaps (Optional)

- Add a brief note on whether to implement via `session_manager` tool calls vs direct bash filesystem primitives (prefer tool for portability).

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/session/start.md` | Existing | docs: `.claude/commands/workflow/session/start.md` / `Overview` ; ts: `ccw/src/tools/session-manager.ts` / `function executeInit(params: Params): any {` | `Test-Path .claude/commands/workflow/session/start.md` | Primary spec/oracle for the command behavior |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/session/start.md` / `Mode 2: Auto Mode (Intelligent)` ; ts: `ccw/src/tools/session-manager.ts` / `function executeInit(params: Params): any {` | `Test-Path ccw/src/tools/session-manager.ts` | Session creation + metadata write; supports list/read/write/archive primitives |
| `ccw/src/core/session-scanner.ts` | Existing | docs: `.claude/commands/workflow/session/list.md` / `Implementation Flow` ; ts: `ccw/src/core/session-scanner.ts` / `export async function scanSessions(workflowDir: string): Promise<ScanSessionsResult> {` | `Test-Path ccw/src/core/session-scanner.ts` | Reliable discovery of WFS-* sessions and metadata parsing |

## Implementation Hints (Tooling/Server)

- Prefer `ccw/src/tools/session-manager.ts` operations (`init`, `list`, `read`, `write`) to avoid shell-specific behavior when implementing session start logic.
- For discovery and metadata, reuse `ccw/src/core/session-scanner.ts` parsing rules to keep dashboard/CLI outputs consistent.

## Proposed Fix Plan (Minimal)

1. Docs: Add `allowed-tools` (and optionally `group`) frontmatter to `.claude/commands/workflow/session/start.md` to satisfy P0 gates consistently across the corpus.
2. Implementation: Use `session_manager(operation="list")` for active sessions and `session_manager(operation="init")` for creation; keep the existing output contract (`SESSION_ID: ...`).
3. Validation: Run verify-evidence on the updated command doc and ensure headings referenced in evidence remain stable.

