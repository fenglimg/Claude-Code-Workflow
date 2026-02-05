# Gap Report: workflow:tools:test-context-gather

## Reference

- Selected reference: /workflow:tools:test-context-gather (`.claude/commands/workflow/tools/test-context-gather.md`)

## P0 Gaps (Must Fix)

- `test-context-search-agent` doc uses `mcp__ccw-tools__codex_lens(...)` calls, but CCW tool registry indicates `codex_lens` has been removed/integrated into `smart_search`. Align the agent doc tool calls to currently-registered tooling to avoid dead instructions.

## P1 Gaps (Should Fix)

- Output path inconsistency in command doc examples (`.workflow/${test_session_id}/...` vs `.workflow/active/{test_session_id}/...`) risks confusing callers and breaking “broken artifact reference” checks in downstream tooling/docs.
- “Valid package” criteria is described conceptually; consider adding a small explicit checklist (required top-level keys) in the command doc’s Quality Validation section to make the detection-first decision deterministic.

## P2 Gaps (Optional)

- Clarify whether the command should prefer `session_manager` tool routing (`content_type="process"`) when writing/reading the package, or keep direct path reads/writes in the doc examples for simplicity.

## Implementation Pointers (Evidence)

You MUST provide an evidence table for all key implementation pointers mentioned in the outlines.

Rules (P0):
- Every pointer MUST be labeled `Existing` or `Planned`.
- `Existing` MUST be verifiable (path exists). Include a concrete `Verify` command for each existing pointer.
- Do NOT describe `Planned` pointers as “validated/exists”.
- Evidence MUST reference BOTH sources somewhere in this section:
  - command docs: `.claude/commands/**.md` (section heading is enough)
  - TypeScript implementation: `ccw/src/**` (function name / subcommand case / ripgrep-able string)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/tools/test-context-gather.md` | Existing | docs: `.claude/commands/workflow/tools/test-context-gather.md` / `Execution Flow` ; ts: `ccw/src/tools/session-manager.ts` / `process: '{base}/.process/{filename}',` | `Test-Path .claude/commands/workflow/tools/test-context-gather.md` | Oracle behavior/flow; keep outline aligned to headings and artifacts. |
| `.codex/agents/test-context-search-agent.md` | Existing | docs: `.claude/commands/workflow/tools/test-context-gather.md` / `Mission` ; ts: `ccw/src/tools/index.ts` / `// codex_lens removed - functionality integrated into smart_search` | `Test-Path .codex/agents/test-context-search-agent.md; rg "mcp__ccw-tools__codex_lens" .codex/agents/test-context-search-agent.md` | Needs tooling call alignment (codex_lens -> smart_search or codex_lens_lsp). |
| `ccw/src/tools/index.ts` | Existing | docs: `.claude/commands/workflow/tools/test-context-gather.md` / `Integration` ; ts: `ccw/src/tools/index.ts` / `// codex_lens removed - functionality integrated into smart_search` | `Test-Path ccw/src/tools/index.ts; rg \"codex_lens removed\" ccw/src/tools/index.ts` | Tool registry ground-truth for what MCP tools exist. |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/tools/test-context-gather.md` / `Session Information` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path ccw/src/tools/session-manager.ts; rg \"const ACTIVE_BASE = '.workflow/active';\" ccw/src/tools/session-manager.ts` | Session + `.process` routing for `.workflow/active/{session}` artifacts. |
| `.workflow/active/{test_session_id}/.process/test-context-package.json` | Planned | docs: `.claude/commands/workflow/tools/test-context-gather.md` / `Output Requirements` ; ts: `ccw/src/tools/session-manager.ts` / `process: '{base}/.process/{filename}',` | `Test-Path .workflow/active/WFS-test-auth/.process/test-context-package.json` | Output artifact produced/reused by the command. |

## Implementation Hints (Tooling/Server)

- If updating the agent doc away from `codex_lens`, prefer `mcp__ccw-tools__smart_search` for file discovery and symbol search (and/or `codex_lens_lsp` for LSP-backed symbol operations).
- When documenting filesystem artifacts under `.workflow/active/{session}`, align examples to `session_manager` routing conventions (`content_type="process"`, `path_params.filename="test-context-package.json"`) when possible.

## Proposed Fix Plan (Minimal)

See `fix-plan.md`.

