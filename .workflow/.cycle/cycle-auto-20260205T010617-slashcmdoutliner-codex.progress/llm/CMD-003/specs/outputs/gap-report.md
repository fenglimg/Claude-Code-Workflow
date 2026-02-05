# Gap Report: other:ccw-plan

## Reference

- Selected reference: /ccw-debug (`.claude/commands/ccw-debug.md`)

## P0 Gaps (Must Fix)

- Command surface must remain consistent with existing general (no-group) CCW coordinator commands:
  - invocation is `/ccw-plan` (not `/workflow:...`); frontmatter should not invent a `group` field unless the corpus uses it for general commands.
- Evidence tables must remain dual-source and verifiable:
  - Every pointer row needs `docs: .claude/commands/**.md / <real heading>` and `ts: ccw/src/** / <literal anchor string>`.
  - Any pointer that is runtime-only (e.g. `.workflow/.ccw-plan/...`) must be `Planned` (avoid false existence claims).

## P1 Gaps (Should Fix)

- Mode-selection decision tree should be explicitly represented in the outline (mirrors coordinator pattern, reduces ambiguity between `issue` vs `rapid-to-issue` vs `with-file` modes).
- State lifecycle should be clearer for `replan`:
  - what minimum data must exist in `status.json`, and which fields are required to resume/modify the chain.

## P2 Gaps (Optional)

- Consider aligning TODO prefixes and status schema conventions with other coordinators for easier dashboard aggregation.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/ccw-plan.md` | Existing | docs: `.claude/commands/ccw-plan.md` / `CCW-Plan Command - Planning Coordinator` ; ts: `ccw/src/tools/command-registry.ts` / `private parseYamlHeader(content: string)` | `Test-Path .claude/commands/ccw-plan.md` | Command contract and workflow definition |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `CCW Coordinator Command` ; ts: `ccw/src/tools/command-registry.ts` / `export class CommandRegistry {` | `Test-Path ccw/src/tools/command-registry.ts ; rg "export class CommandRegistry \\{" ccw/src/tools/command-registry.ts` | Command metadata discovery used by orchestrators |
| `ccw/src/commands/cli.ts` | Existing | docs: `.claude/commands/ccw-plan.md` / `CLI-Assisted Planning (cli mode)` ; ts: `ccw/src/commands/cli.ts` / `loadProtocol, loadTemplate` | `Test-Path ccw/src/commands/cli.ts ; rg "loadProtocol, loadTemplate" ccw/src/commands/cli.ts` | CLI execution path used by ccw-plan's `cli` mode |
| `ccw/src/core/routes/skills-routes.ts` | Existing | docs: `.claude/commands/ccw-plan.md` / `Execution Model` ; ts: `ccw/src/core/routes/skills-routes.ts` / `executeCliTool({` | `Test-Path ccw/src/core/routes/skills-routes.ts ; rg "executeCliTool\\(\\{" ccw/src/core/routes/skills-routes.ts` | Skill plumbing for main-process orchestration |
| `.workflow/.ccw-plan/{session_id}/status.json` | Planned | docs: `.claude/commands/ccw-plan.md` / `Phase 4: Setup TODO Tracking & Status File` ; ts: `ccw/src/core/routes/skills-routes.ts` / `executeCliTool({` | `Test-Path .workflow/.ccw-plan` | Runtime state artifact; must not be treated as pre-existing |

## Implementation Hints (Tooling/Server)

- Coordinator commands often rely on:
  - command-doc metadata extraction (frontmatter + headings)
  - a stable chain representation (mode -> ordered commands)
  - a resumable status file in `.workflow/.<command>/{session_id}/...`
- CLI-assisted mode should leverage existing `ccw cli` infrastructure (template discovery + rule selection).

## Proposed Fix Plan (Minimal)

- See `fix-plan.md`.

