# Fix Plan: workflow:analyze-with-file

## Goals (P0)

- Preserve the documented behavior and artifact contract in `.claude/commands/workflow/analyze-with-file.md`.
- Ensure all implementation pointers are evidence-based (Existing vs Planned) and verifiable.

## Minimal Steps

1) Runtime verification (no code changes)
- Confirm the slash command executes end-to-end and produces:
  - `.workflow/.analysis/{session-id}/discussion.md`
  - `.workflow/.analysis/{session-id}/exploration-codebase.json`
  - `.workflow/.analysis/{session-id}/perspectives.json` (multi) or `explorations.json` (single)
- Confirm resume mode (`--continue`) reuses the session folder and appends new rounds without overwriting.

2) If runtime integration is missing
- Locate the command runner/dispatcher and ensure it can load `.claude/commands/workflow/analyze-with-file.md`.
- Reuse existing CLI plumbing:
  - `ccw/src/tools/cli-executor-core.ts` (`async function executeCliTool(`)
  - `ccw/src/core/routes/cli-routes.ts` (`if (pathname === '/api/cli/execution')`)

3) Consistency & guardrails
- Ensure artifact naming is consistent across modes (single vs multi-perspective).
- Add explicit error handling for:
  - missing session on `--continue`
  - CLI timeouts (retry once, then degrade)
  - cli-explore-agent failure (continue with empty context)

