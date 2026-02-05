# Gap Report: workflow:tdd-plan

## Reference

- Selected reference: `/workflow:plan` (`.claude/commands/workflow/plan.md`)

## P0 Gaps (Must Fix)

- **Core sections not CCW-gated in oracle doc**: `.claude/commands/workflow/tdd-plan.md` lacks explicit `Overview`, `Usage`, and `Outputs / Artifacts` sections (required by the outliner quality gates); restructure by adding these headings while retaining existing phase content.
- **Frontmatter group missing**: add `group: workflow` to `.claude/commands/workflow/tdd-plan.md` to match corpus conventions used by workflow commands.
- **Evidence table missing in oracle doc**: add an evidence table for key implementation pointers (command + orchestrated subcommands + core TS touchpoints) to prevent unverifiable `Existing` claims.

## P1 Gaps (Should Fix)

- **Inputs clarity**: make the string-vs-file input contract explicit (mirror the argument-hint), and document how file input is structured into the TDD format.
- **Phase 6 output contract**: standardize the Phase 6 summary (artifact counts + first-task structure check) so downstream `/workflow:plan-verify` is repeatable.

## P2 Gaps (Optional)

- **Surface warnings**: add a short warning policy summary near Phase 6 (non-blocking warnings + where the log is written).

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/tdd-plan.md` | Existing | docs: `.claude/commands/workflow/tdd-plan.md` / `TDD Workflow Plan Command (/workflow:tdd-plan)` ; ts: `ccw/src/tools/command-registry.ts` / `commandName.startsWith('/workflow:')` | `Test-Path .claude/commands/workflow/tdd-plan.md` | command oracle + target doc to align to gates |
| `.claude/commands/workflow/plan.md` | Existing | docs: `.claude/commands/workflow/plan.md` / `Workflow Plan Command (/workflow:plan)` ; ts: `ccw/src/tools/command-registry.ts` / `commandName.startsWith('/workflow:')` | `Test-Path .claude/commands/workflow/plan.md` | reference orchestrator pattern |
| `.claude/commands/workflow/session/start.md` | Existing | docs: `.claude/commands/workflow/session/start.md` / `Start Workflow Session (/workflow:session:start)` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path .claude/commands/workflow/session/start.md` | Phase 1 dependency |
| `.claude/commands/workflow/tools/context-gather.md` | Existing | docs: `.claude/commands/workflow/tools/context-gather.md` / `Context Gather Command (/workflow:tools:context-gather)` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path .claude/commands/workflow/tools/context-gather.md` | Phase 2 dependency |
| `.claude/commands/workflow/tools/test-context-gather.md` | Existing | docs: `.claude/commands/workflow/tools/test-context-gather.md` / `Test Context Gather Command (/workflow:tools:test-context-gather)` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path .claude/commands/workflow/tools/test-context-gather.md` | Phase 3 dependency |
| `.claude/commands/workflow/tools/conflict-resolution.md` | Existing | docs: `.claude/commands/workflow/tools/conflict-resolution.md` / `Conflict Resolution Command` ; ts: `ccw/src/core/routes/commands-routes.ts` / `function parseCommandFrontmatter(content: string): CommandMetadata {` | `Test-Path .claude/commands/workflow/tools/conflict-resolution.md` | Phase 4 conditional gate |
| `.claude/commands/workflow/tools/task-generate-tdd.md` | Existing | docs: `.claude/commands/workflow/tools/task-generate-tdd.md` / `Autonomous TDD Task Generation Command` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path .claude/commands/workflow/tools/task-generate-tdd.md` | Phase 5 task generation |
| `.claude/commands/workflow/plan-verify.md` | Existing | docs: `.claude/commands/workflow/plan-verify.md` / `Execution Steps` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path .claude/commands/workflow/plan-verify.md` | Phase 6 recommended verification |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/plan.md` / `5-Phase Execution` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path ccw/src/tools/session-manager.ts` | shared session artifact routing |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/plan.md` / `Core Rules` ; ts: `ccw/src/tools/command-registry.ts` / `commandName.startsWith('/workflow:')` | `Test-Path ccw/src/tools/command-registry.ts` | frontmatter parsing (allowed-tools, argument-hint) |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/workflow/plan.md` / `Execution Process` ; ts: `ccw/src/core/routes/commands-routes.ts` / `function parseCommandFrontmatter(content: string): CommandMetadata {` | `Test-Path ccw/src/core/routes/commands-routes.ts` | server reads/parses project command docs |

## Implementation Hints (Tooling/Server)

- Command docs are parsed and surfaced via the commands API routes; keep frontmatter consistent (especially `allowed-tools` and `group`) so UI/registry behavior remains predictable.
- Prefer session artifact routing via the session-manager tool conventions for `.workflow/active/{sessionId}/...` paths.

## Proposed Fix Plan (Minimal)

1. Update `.claude/commands/workflow/tdd-plan.md` frontmatter to include `group: workflow`.
2. Insert CCW-gated headings (`Overview`, `Usage`, `Inputs`, `Outputs / Artifacts`) near the top; keep existing detailed phase sections intact.
3. Add an evidence table section listing the orchestrated subcommand docs and core TS touchpoints.
4. Re-run the deterministic evidence gate after any pointer changes.