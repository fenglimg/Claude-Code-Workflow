# Gap Report: workflow:multi-cli-plan

## Reference

- Selected reference: /workflow:collaborative-plan-with-file (`.claude/commands/workflow/collaborative-plan-with-file.md`)

## P0 Gaps (Must Fix)

- Command frontmatter name format appears inconsistent with registry composition: `ccw/src/tools/command-registry.ts` composes `command: \`/workflow:${header.name}\``, so a doc `name` that already includes `workflow:` can produce a doubled slash command (e.g. `/workflow:workflow:multi-cli-plan`). Normalize the doc frontmatter to `name: multi-cli-plan` + `group: workflow` (or teach the registry to strip an embedded `workflow:` prefix).
- Session typing mismatch: `ccw/src/core/lite-scanner.ts` and `ccw/src/core/routes/session-routes.ts` use `type: 'multi-cli-plan'`, but `ccw/src/types/session.ts` does not include `'multi-cli-plan'` in `SessionType`.

## P1 Gaps (Should Fix)

- Ensure the command doc clearly distinguishes orchestrator vs agent responsibilities (orchestrator boundary) and explicitly documents what is delegated to `cli-discuss-agent` vs `cli-lite-planning-agent`.

## P2 Gaps (Optional)

- Add a short "resume a prior session" example (reading `.workflow/.multi-cli-plan/<session-id>/...`) and clarify how `--mode=serial` affects the CLI execution fallback chain.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/multi-cli-plan.md` | Existing | docs: `.claude/commands/workflow/multi-cli-plan.md` / `Quick Start` ; ts: `ccw/src/tools/command-registry.ts` / `join('.claude', 'commands', 'workflow')` | `Test-Path .claude/commands/workflow/multi-cli-plan.md` | Command spec surface; must be parseable by registry |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/lite-plan.md` / `Usage` ; ts: `ccw/src/tools/command-registry.ts` / `const normalized = commandName.startsWith('/workflow:')` | `rg -n \"const normalized = commandName\\.startsWith\\('/workflow:'\\)\" ccw/src/tools/command-registry.ts` | Potential `/workflow:workflow:*` composition risk |
| `ccw/src/core/lite-scanner.ts` | Existing | docs: `.claude/commands/workflow/multi-cli-plan.md` / `Output File Structure` ; ts: `ccw/src/core/lite-scanner.ts` / `type: 'multi-cli-plan'` | `rg -n \"type: 'multi-cli-plan'\" ccw/src/core/lite-scanner.ts` | Session discovery + UI listing |
| `ccw/src/core/routes/session-routes.ts` | Existing | docs: `.claude/commands/workflow/multi-cli-plan.md` / `Output File Structure` ; ts: `ccw/src/core/routes/session-routes.ts` / `// Load multi-cli discussion rounds (rounds/*/synthesis.json)` | `rg -n \"rounds/\\*\\/synthesis\\.json\" ccw/src/core/routes/session-routes.ts` | Server-side loading of per-round synthesis |
| `ccw/src/types/session.ts` | Planned | docs: `.claude/commands/workflow/multi-cli-plan.md` / `Output File Structure` ; ts: `ccw/src/types/session.ts` / `export type SessionType = 'workflow'` | `rg -n \"export type SessionType\" ccw/src/types/session.ts` | Update union to include `multi-cli-plan` |

## Implementation Hints (Tooling/Server)

- `ccw/src/core/lite-scanner.ts` already scans `.workflow/.multi-cli-plan/*` and returns sessions with `type: 'multi-cli-plan'`.
- `ccw/src/core/routes/session-routes.ts` already supports loading `rounds/*/synthesis.json` and exposes a `multiCli` payload.
- `ccw/src/tools/command-registry.ts` is the likely chokepoint for how workflow command docs are mapped to slash commands.

## Proposed Fix Plan (Minimal)

1. Normalize `.claude/commands/workflow/multi-cli-plan.md` frontmatter to avoid doubled `/workflow:` (either adjust the doc `name` and add `group: workflow`, or adjust the registry to strip embedded `workflow:`).
2. Add `'multi-cli-plan'` to `SessionType` in `ccw/src/types/session.ts`; fix any downstream exhaustiveness checks.
3. Add a small regression test around command registry parsing for `multi-cli-plan` (mirroring existing `lite-plan` tests).
