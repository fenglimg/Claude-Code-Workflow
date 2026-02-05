# Gap Report: workflow:session:list

## Reference

- Selected reference: /workflow:session:list (`.claude/commands/workflow/session/list.md`)

## P0 Gaps (Must Fix)

- None identified for the generated outlines (required sections present; evidence table is fully verifiable).

## P1 Gaps (Should Fix)

- Clarify whether `--location` and `--recent` are supported arguments for the slash command (docs currently show only the base form).
- Align the listing logic with the canonical tooling path:
  - prefer `session_manager(operation="list", location=..., include_metadata=true)` semantics to avoid bash-only dependencies (`jq`, `find`, `wc`) when possible.

## P2 Gaps (Optional)

- Normalize output formatting to match other workflow/session commands (badge casing, totals line wording).
- Consider adding a short "Quick Commands" section mirroring the oracle doc for common shell one-liners.

## Implementation Pointers (Evidence)

You MUST provide an evidence table for all key implementation pointers mentioned in the outlines.

Rules (P0):
- Every pointer MUST be labeled `Existing` or `Planned`.
- `Existing` MUST be verifiable (path exists). Include a concrete `Verify` command for each existing pointer.
- Do NOT describe `Planned` pointers as “validated/exists”.
- Evidence MUST reference BOTH sources somewhere in this section:
  - command docs: `.claude/commands/**.md`
  - TypeScript implementation: `ccw/src/**`

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/session/list.md` | Existing | docs: `.claude/commands/workflow/session/list.md` / `Implementation Flow` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path .claude/commands/workflow/session/list.md` | Oracle command behavior and headings to match |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/session/list.md` / `Step 1: Find All Sessions` ; ts: `ccw/src/tools/session-manager.ts` / `function executeList(params: Params): any {` | `Test-Path ccw/src/tools/session-manager.ts` | Canonical path roots + list semantics (active/archived/lite) |
| `ccw/src/commands/session.ts` | Existing | docs: `.claude/commands/workflow/session/list.md` / `Simple Output Format` ; ts: `ccw/src/commands/session.ts` / `const result = await executeTool('session_manager', params);` | `Test-Path ccw/src/commands/session.ts` | CLI formatting patterns and tool invocation plumbing |

## Implementation Hints (Tooling/Server)

- Prefer reusing `session_manager` for listing and metadata aggregation:
  - it already resolves `.workflow` root and supports `location` and `include_metadata` inputs.
- When bash parsing is used, degrade gracefully when metadata keys are missing (`created_at` null/absent).

## Proposed Fix Plan (Minimal)

1) Decide argument surface:
   - keep slash command as no-args, or document `--location`/`--recent` explicitly.
2) If adding args, document parsing rules and defaults in the command doc.
3) If migrating to tooling-backed listing, specify the `session_manager` call contract and output mapping.
