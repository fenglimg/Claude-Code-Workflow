# Gap Report: workflow:execute

## Reference

- Selected reference: `/workflow:execute` (`.claude/commands/workflow/execute.md`)

## P0 Gaps (Must Fix)

- None (evidence + core outline sections are present and verifiable).

## P1 Gaps (Should Fix)

- The oracle command doc `.claude/commands/workflow/execute.md` has no `allowed-tools` frontmatter (add for consistency with other workflow commands).
- The generated outline keeps execution details concise; the oracle includes a much more detailed lifecycle and sub-steps (expand only as needed when editing the command doc).

## P2 Gaps (Optional)

- Add a small "Verify" subsection in the command doc that lists safe repo-relative checks (session-manager paths, command registry detection).

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/execute.md` | Existing | docs: `.claude/commands/workflow/execute.md` / `Workflow Execute Command` ; ts: `ccw/src/templates/dashboard-js/views/help.js` / `/workflow:execute` | `Test-Path .claude/commands/workflow/execute.md` | Oracle reference + target command doc |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/execute.md` / `Execution Lifecycle` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path ccw/src/tools/session-manager.ts` | Defines session storage conventions used by discovery/status updates |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/execute.md` / `Usage` ; ts: `ccw/src/tools/command-registry.ts` / `ERROR: ~/.claude/commands/workflow directory not found` | `Test-Path ccw/src/tools/command-registry.ts` | Discovers/parses `.claude/commands/workflow/*.md` into registry |
| `ccw/src/templates/dashboard-js/views/help.js` | Existing | docs: `.claude/commands/workflow/execute.md` / `Overview` ; ts: `ccw/src/templates/dashboard-js/views/help.js` / `/workflow:execute` | `Test-Path ccw/src/templates/dashboard-js/views/help.js` | UI help graph includes this command |

## Implementation Hints (Tooling/Server)

- Session file routing is centralized in `ccw/src/tools/session-manager.ts` (e.g., `IMPL_PLAN.md`, `.task/*.json`, `.summaries/*-summary.md`, `TODO_LIST.md`).
- Command doc parsing/discovery is centralized in `ccw/src/tools/command-registry.ts` (workflow command directory detection + YAML header parsing).

## Proposed Fix Plan (Minimal)

1. Add `allowed-tools` (and optionally `group: workflow`) to `.claude/commands/workflow/execute.md` frontmatter, matching the tool surface used in the doc body.
2. Keep command doc behavior stable; only adjust sections that are missing P0 keys or are ambiguous about auto mode defaults and commit safety.
3. If implementing new behavior (session status idempotency, commit parsing), prefer extending existing tooling (`session-manager`, registry) instead of introducing new file formats.

