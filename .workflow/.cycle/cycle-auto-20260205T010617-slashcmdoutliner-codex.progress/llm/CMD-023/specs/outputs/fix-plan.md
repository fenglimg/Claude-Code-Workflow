# Fix Plan: memory:tips

## Scope

Documentation-only refinement for `/memory:tips` (no new tool surface).

## Steps

1) Align allowed-tools with behavior
- Verify the doc does not require any tool beyond `mcp__ccw-tools__core_memory(*)` and `Read(*)`.
- If the doc references session-manager behavior, rephrase it as best-effort context (no extra tool call).

2) Tighten execution flow language
- Make "auto-detected context" explicitly conversation-derived (no heavy reads).
- Define the `(none)` behavior for missing tags/context/session.

3) Keep retrieval guidance concrete
- Prefer MCP retrieval: `core_memory(operation="search", query="...")`.
- Optionally mention CLI retrieval: `ccw core-memory search "..."`.

4) Validate evidence gates
- Run:
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-023/specs/outputs/generated-slash-outline.md`
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-023/specs/outputs/gap-report.md`

