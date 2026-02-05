# Gap Report: other:ccw-test

## Reference

- Selected reference: /ccw-test (`.claude/commands/ccw-test.md`)

## P0 Gaps (Must Fix)

- None identified: outline matches the oracle's coordinator structure (modes, 5-phase workflow, tracking, and examples) and includes evidence tables required by the quality gate.

## P1 Gaps (Should Fix)

- None required for outline completeness.

## P2 Gaps (Optional)

- Consider documenting the supported optional flags (`--target`, `--max-iterations`, `--pass-threshold`) only if they are actually implemented/handled by the coordinator workflow (avoid doc drift).

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/ccw-test.md` | Existing | docs: `.claude/commands/ccw-test.md` / CCW-Test Command - Test Coordinator ; ts: `ccw/src/core/routes/commands-routes.ts` / function parseCommandFrontmatter(content: string): CommandMetadata { | `Test-Path .claude/commands/ccw-test.md` | Oracle doc; ensures frontmatter/sections are present and stable |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/ccw-test.md` / Usage ; ts: `ccw/src/core/routes/commands-routes.ts` / function parseCommandFrontmatter(content: string): CommandMetadata { | `Test-Path ccw/src/core/routes/commands-routes.ts` | Confirms how `.claude/commands/**/*.md` frontmatter is parsed for the dashboard commands manager |
| `.workflow/.ccw-test/<session_id>/status.json` | Planned | docs: `.claude/commands/ccw-test.md` / Phase 4: Setup TODO Tracking & Status File ; ts: `ccw/src/core/routes/ccw-routes.ts` / const workflowDir = join(resolvedPath, '.workflow'); | `Test-Path .workflow/.ccw-test` | Runtime session state; created by coordinator during execution |

## Implementation Hints (Tooling/Server)

- Dashboard integration for command docs uses `.claude/commands` parsing (frontmatter keys: name/description/group/argument-hint/allowed-tools).
- Coordinator commands are synchronous in the main process and typically delegate real work to workflow commands via `Skill`, while using `TodoWrite` for progress visibility.

## Proposed Fix Plan (Minimal)

- No outline changes required.
- If implementing behavior changes later, update the oracle doc and re-run the evidence gate to prevent accidental "Existing" drift.

