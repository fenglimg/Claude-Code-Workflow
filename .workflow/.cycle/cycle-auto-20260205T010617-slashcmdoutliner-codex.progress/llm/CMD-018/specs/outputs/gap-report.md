# Gap Report: memory:compact

## Reference

- Selected reference: /memory:compact (`.claude/commands/memory/compact.md`)

## P0 Gaps (Must Fix)

- None identified in the generated outline structure (frontmatter + core sections + evidence table present).

## P1 Gaps (Should Fix)

- Clarify the tool-surface boundary explicitly:
  - The command should use MCP (`mcp__ccw-tools__core_memory`) for persistence; CLI snippets in the reference doc are informational and should not imply `Bash(*)` is required.
- Make path resolution requirements unambiguous in the outline:
  - how to pick project root when multiple repos/workspaces are involved
  - when absolute path conversion is required vs best-effort

## P2 Gaps (Optional)

- Add one short “recovery” mini-example in the outline (import id + how to export/search later) to improve UX.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/memory/compact.md` | Existing | docs: `.claude/commands/memory/compact.md` / `5. Execution Flow` ; ts: `ccw/src/tools/core-memory.ts` / `name: 'core_memory',` | `Test-Path .claude/commands/memory/compact.md` | reference behavior, headings, and output contract |
| `ccw/src/tools/core-memory.ts` | Existing | docs: `.claude/commands/memory/compact.md` / `Step 3: Import to Core Memory via MCP` ; ts: `ccw/src/tools/core-memory.ts` / `Parameter "text" is required for import operation` | `Test-Path ccw/src/tools/core-memory.ts` | MCP tool definition and import validation |
| `ccw/src/mcp-server/index.ts` | Existing | docs: `.claude/commands/memory/compact.md` / `Step 3: Import to Core Memory via MCP` ; ts: `ccw/src/mcp-server/index.ts` / `const DEFAULT_TOOLS: string[] = ['write_file', 'edit_file', 'read_file', 'core_memory'];` | `Test-Path ccw/src/mcp-server/index.ts` | confirms `core_memory` is included in the default MCP tools set |
| `ccw/src/core/core-memory-store.ts` | Existing | docs: `.claude/commands/memory/compact.md` / `3. Structured Output Format` ; ts: `ccw/src/core/core-memory-store.ts` / `export function importMemories(` | `Test-Path ccw/src/core/core-memory-store.ts` | underlying store APIs used by tool/CLI layers |
| `ccw/src/commands/session-path-resolver.ts` | Existing | docs: `.claude/commands/memory/compact.md` / `7. Path Resolution Rules` ; ts: `ccw/src/commands/session-path-resolver.ts` / `'IMPL_PLAN.md': 'plan',` | `Test-Path ccw/src/commands/session-path-resolver.ts` | path naming conventions useful for plan/source detection |
| `.workflow/IMPL_PLAN.md` | Planned | docs: `.claude/commands/memory/compact.md` / `8. Plan Detection (Priority Order)` ; ts: `ccw/src/commands/session-path-resolver.ts` / `'IMPL_PLAN.md': 'plan',` | `Test-Path .workflow/IMPL_PLAN.md` | optional input file; read when present to preserve plan verbatim |

## Implementation Hints (Tooling/Server)

- Use MCP tool `core_memory` (TS: `ccw/src/tools/core-memory.ts`) for import; do not assume CLI availability in the slash-command runtime.
- MCP server exports a default tool set that includes `core_memory` (TS: `ccw/src/mcp-server/index.ts`).

## Proposed Fix Plan (Minimal)

1. (docs) Add a short note in the outline that CLI examples are optional and not required for the slash command (keep allowed-tools unchanged).
2. (docs) Add a compact “Path Resolution Rules” subsection clarifying project root selection and absolute path conversion requirements.
3. (docs) Add a tiny recovery snippet showing how to export/search by the returned `CMEM-...` id.

