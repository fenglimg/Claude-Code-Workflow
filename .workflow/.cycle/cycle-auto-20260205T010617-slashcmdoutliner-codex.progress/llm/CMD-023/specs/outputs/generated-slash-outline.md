---
name: tips
description: Quick note-taking command to capture ideas, snippets, reminders, and insights for later reference
argument-hint: "<note content> [--tag <tag1,tag2>] [--context <context>]"
allowed-tools: mcp__ccw-tools__core_memory(*), Read(*)
group: memory
---

# Memory Tips Command (/memory:tips)

## Overview

- Goal: Capture a quick, searchable note (idea/snippet/reminder/insight) as structured text in core memory.
- Command: `/memory:tips`

## Usage

```bash
/memory:tips "<note content>" [--tag <tag1,tag2>] [--context <context>]
```

## Inputs

- Required inputs:
  - `<note content>`: the note to capture (keep it short; use `/memory:compact` for long multi-paragraph state)
- Optional inputs:
  - `--tag <tag1,tag2>`: comma-separated tags
  - `--context <context>`: file/module/feature reference (free text)

## Outputs / Artifacts

- Writes:
  - One core-memory entry via `mcp__ccw-tools__core_memory(operation="import")`
- Reads:
  - Workspace/project root (implicit)
  - Optional: lightweight context from local files if needed (via `Read(*)`)

## Implementation Pointers

- Command doc: `.claude/commands/memory/tips.md`
- Likely code locations:
  - `ccw/src/tools/core-memory.ts` (MCP tool schema + handler for `operation: "import"`)
  - `ccw/src/tools/index.ts` (tool registration)
  - `ccw/src/mcp-server/index.ts` (default enabled tools includes `core_memory`)
  - `ccw/src/cli.ts` + `ccw/src/commands/core-memory.ts` (CLI entrypoint + `core-memory search` for retrieval guidance)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/memory/tips.md` | Existing | docs: `.claude/commands/memory/tips.md` / `Memory Tips Command (/memory:tips)` ; ts: `ccw/src/tools/core-memory.ts` / `name: 'core_memory',` | `Test-Path .claude/commands/memory/tips.md` | oracle command doc and required frontmatter/sections |
| `ccw/src/tools/core-memory.ts` | Existing | docs: `.claude/commands/memory/tips.md` / `Step 4: Save to Core Memory` ; ts: `ccw/src/tools/core-memory.ts` / `name: 'core_memory',` | `Test-Path ccw/src/tools/core-memory.ts` | provides `core_memory(operation="import")` for persistence |
| `ccw/src/tools/index.ts` | Existing | docs: `.claude/commands/memory/tips.md` / `Step 4: Save to Core Memory` ; ts: `ccw/src/tools/index.ts` / `registerTool(toLegacyTool(coreMemoryMod));` | `Test-Path ccw/src/tools/index.ts` | ensures the tool is registered/exposed to MCP |
| `ccw/src/mcp-server/index.ts` | Existing | docs: `.claude/commands/memory/tips.md` / `7. Search Integration` ; ts: `ccw/src/mcp-server/index.ts` / `const DEFAULT_TOOLS: string[] = ['write_file', 'edit_file', 'read_file', 'core_memory'];` | `Test-Path ccw/src/mcp-server/index.ts` | confirms core_memory is part of the default MCP tool set |
| `ccw/src/cli.ts` | Existing | docs: `.claude/commands/memory/tips.md` / `7. Search Integration` ; ts: `ccw/src/cli.ts` / `.command('core-memory [subcommand] [args...]')` | `Test-Path ccw/src/cli.ts` | CLI surface for retrieval instructions (e.g. `ccw core-memory search ...`) |
| `ccw/src/commands/core-memory.ts` | Existing | docs: `.claude/commands/memory/tips.md` / `7. Search Integration` ; ts: `ccw/src/commands/core-memory.ts` / `Usage: ccw core-memory search <keyword> [--type core|workflow|cli|all]` | `Test-Path ccw/src/commands/core-memory.ts` | retrieval behavior and user-facing usage hints |

## Execution Process

1) Parse arguments
- Extract required note content (string)
- Parse optional `--tag` into a normalized list (trim, drop empties)
- Parse optional `--context` as a raw string

2) Gather minimal context (no extra tools)
- Timestamp: local now
- Project root: current workspace root (best-effort; if unknown, leave `(unknown)`)
- Auto-detected context: best-effort from the current conversation or recently mentioned file paths (do not read large files)
- Session link: include if a session identifier is already known in the current workflow; otherwise `(none)`

3) Generate structured markdown text
- Emit stable headings in this exact order:
  - `Tip ID`, `Timestamp`, `Project Root`, `Content`, `Tags`, `Context`, `Session Link`, `Auto-Detected Context`
- Ensure missing optional fields are rendered as `(none)`

4) Save to core memory
- Call `mcp__ccw-tools__core_memory` with:
  - `operation: "import"`
  - `text: <structured markdown>`

5) Confirm to user
- Show returned `CMEM-...` id
- Echo tags/context summary
- Provide retrieval hint:
  - MCP: `core_memory(operation="search", query="<keyword>")`
  - CLI: `ccw core-memory search "<keyword>"`

## Error Handling

- Missing content:
  - Print a brief usage line and request the user re-run with a quoted note.
- Tag parsing:
  - If tags are provided but parse to empty, treat as `(none)`.
- Tool failure:
  - Surface the tool error message (no stack trace) and suggest retrying once.

## Examples

```bash
/memory:tips "Remember to use Redis for rate limiting" --tag performance,backend
/memory:tips "Auth pattern: refresh tokens with rotation" --tag architecture,auth --context src/auth
/memory:tips "Bug: memory leak in WebSocket handler after 24h" --tag bug --context websocket-service
```

