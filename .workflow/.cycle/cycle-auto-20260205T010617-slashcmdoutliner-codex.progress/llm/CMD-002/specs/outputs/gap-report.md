# Gap Report: ccw-debug

## Reference

- Selected reference: /ccw-coordinator (`.claude/commands/ccw-coordinator.md`)

## P0 Gaps (Must Fix)

- Evidence gate compliance: ensure every pointer row is labeled Existing/Planned and has dual-source evidence (docs + TS) with literal TS anchors.
- Command formatting: use `/ccw-debug` (no `group:name` form) and keep allowed-tools exactly aligned to the oracle doc.
- Artifact contracts: clearly distinguish planned session artifacts (`.workflow/.ccw-debug/...`) from pre-existing docs/tooling.

## P1 Gaps (Should Fix)

- Add a compact mode selection decision tree in the outline (auto-detect vs explicit `--mode`; escalation from `cli`).
- Add a compact bidirectional merge policy (how to reconcile debug vs test findings; confidence labeling).

## P2 Gaps (Optional)

- Note how `/api/commands` discovery or `CommandRegistry` should treat non-workflow root commands (e.g. `/ccw-debug`) consistently in UI/listing.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/ccw-debug.md` | Existing | docs: `.claude/commands/ccw-debug.md` / `CCW-Debug Command - Debug Coordinator` ; ts: `ccw/src/core/routes/commands-routes.ts` / `return join(projectPath, '.claude', 'commands')` | `Test-Path .claude/commands/ccw-debug.md` | oracle behavior + headings; do not copy full content into spec |
| `.claude/commands/ccw-coordinator.md` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `CCW Coordinator Command` ; ts: `ccw/src/tools/command-registry.ts` / `getAllCommandsSummary()` | `Test-Path .claude/commands/ccw-coordinator.md` | primary style reference for orchestration + state patterns |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `CommandRegistry Integration` ; ts: `ccw/src/core/routes/commands-routes.ts` / `function getCommandsDir(location: CommandLocation, projectPath: string): string {` | `Test-Path ccw/src/core/routes/commands-routes.ts` | server-side command discovery + frontmatter parsing (group defaults, allowed-tools parsing) |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `CommandRegistry Integration` ; ts: `ccw/src/tools/command-registry.ts` / `export class CommandRegistry {` | `Test-Path ccw/src/tools/command-registry.ts` | command metadata cache/scan pattern for chain recommendation |
| `ccw/src/core/routes/cli-routes.ts` | Existing | docs: `.claude/commands/ccw-debug.md` / `Phase 2: Select Debug Strategy & Build Command Chain` ; ts: `ccw/src/core/routes/cli-routes.ts` / `executeCliTool({` | `Test-Path ccw/src/core/routes/cli-routes.ts` | execution substrate for CLI analysis and chained workflows |
| `.workflow/.ccw-debug/{session_id}/status.json` | Planned | docs: `.claude/commands/ccw-debug.md` / `Phase 4: Setup TODO Tracking & Status File` ; ts: `ccw/src/commands/hook.ts` / `ccw hook parse-status --path .workflow/.ccw/ccw-123/status.json` | `rg \"parse-status --path \\.workflow/\\.ccw/ccw-123/status\\.json\" ccw/src/commands/hook.ts` | planned persistent state file (align to existing `.workflow/*/status.json` patterns) |

## Implementation Hints (Tooling/Server)

- `ccw/src/core/routes/commands-routes.ts` scans `.claude/commands` (project + user) and parses frontmatter including `allowed-tools` and `group` (default `other`).
- `ccw/src/tools/command-registry.ts` currently targets `.claude/commands/workflow` by default; if ccw-debug needs registry-based discovery, confirm whether root-level commands should also be scanned or use the commands API instead.
- For status.json conventions, reuse existing patterns that already mention `.workflow/*/status.json` parsing and session-style directories.

## Proposed Fix Plan (Minimal)

1. Slash doc outline: add a short, explicit decision tree for mode selection + escalation from `cli` into `debug`/`test`.
2. Bidirectional mode: define merge rules (what to merge, how to resolve conflicts, what to record in `status.json`).
3. Tooling note: decide and document whether discovery is via `CommandRegistry` (extend to root-level commands) or via `/api/commands` listing.

