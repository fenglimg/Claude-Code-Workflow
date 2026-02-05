# Gap Report: memory:tips

## Reference

- Selected reference: /memory:tips (`.claude/commands/memory/tips.md`)

## P0 Gaps (Must Fix)

- None detected for the generated outline versus CCW P0 gates (frontmatter/core sections/allowed-tools/evidence).

## P1 Gaps (Should Fix)

- Session link strategy: reference doc mentions a session-manager-like lookup, but `/memory:tips` allowed-tools does not include it.
  - Proposed: keep `Session Link` field best-effort and explicitly document it as `(none)` unless the session id is already known from the surrounding workflow context.
- Auto-detected context: define "best-effort" as only paths/topics already present in the conversation (avoid reading large files).

## P2 Gaps (Optional)

- Normalize tag conventions (suggested categories) into a short "recommended tags" list to keep the command lightweight.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/memory/tips.md` | Existing | docs: `.claude/commands/memory/tips.md` / `Memory Tips Command (/memory:tips)` ; ts: `ccw/src/tools/core-memory.ts` / `name: 'core_memory',` | `Test-Path .claude/commands/memory/tips.md` | source of truth for slash command doc |
| `ccw/src/tools/core-memory.ts` | Existing | docs: `.claude/commands/memory/tips.md` / `Step 4: Save to Core Memory` ; ts: `ccw/src/tools/core-memory.ts` / `name: 'core_memory',` | `Test-Path ccw/src/tools/core-memory.ts` | MCP tool used by the command |
| `ccw/src/tools/index.ts` | Existing | docs: `.claude/commands/memory/tips.md` / `Step 4: Save to Core Memory` ; ts: `ccw/src/tools/index.ts` / `registerTool(toLegacyTool(coreMemoryMod));` | `Test-Path ccw/src/tools/index.ts` | tool registration confirms availability |
| `ccw/src/commands/core-memory.ts` | Existing | docs: `.claude/commands/memory/tips.md` / `7. Search Integration` ; ts: `ccw/src/commands/core-memory.ts` / `Usage: ccw core-memory search <keyword> [--type core|workflow|cli|all]` | `Test-Path ccw/src/commands/core-memory.ts` | retrieval command surfaced in docs |

## Implementation Hints (Tooling/Server)

- Keep `/memory:tips` strictly within `mcp__ccw-tools__core_memory` + `Read`.
- Use `core_memory(operation="import")` as the only persistence step.
- Retrieval guidance should prefer `core_memory(operation="search")` and optionally mention `ccw core-memory search` (CLI).

## Proposed Fix Plan (Minimal)

- Clarify that `Session Link` is best-effort and does not require extra tools.
- Clarify auto-detected context rules (no heavy file reads; only conversation-derived paths/topics).
- Ensure usage/examples show quoting rules and tag/context flags.

