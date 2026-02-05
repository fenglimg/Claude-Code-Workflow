# Gap Report: (none):ccw-coordinator

## Reference

- Selected reference: /codex-coordinator (`.claude/commands/codex-coordinator.md`)

## P0 Gaps (Must Fix)

- Command discovery scope mismatch
  - Doc implies cross-group discovery (e.g. workflow + issue), but `CommandRegistry` auto-detects `.claude/commands/workflow` only.
  - Fix is either: (a) extend discovery to additional groups/roots, or (b) update the coordinator docs to match actual discovery behavior.
- Serial execution + completion signaling must be unambiguous
  - Coordinator relies on strict serial blocking and a clear completion signal to resume (avoid TaskOutput polling). Ensure the runtime mechanism is explicitly defined/implemented where needed.

## P1 Gaps (Should Fix)

- Single source of truth for command metadata
  - Decide whether `/ccw-coordinator` should use `ccw/src/tools/command-registry.ts`, the server listing (`/api/commands`), or a unified adapter.
- Test coverage for expanded discovery
  - If discovery is extended beyond workflow, add tests for nested directories and multiple roots.

## P2 Gaps (Optional)

- Flag parity with other coordinators
  - Consider optional flags like `--depth` / `--auto-confirm` / `--verbose` if they fit CCW usage patterns.

## Implementation Pointers (Evidence)

You MUST provide an evidence table for all key implementation pointers mentioned in the outlines.

Rules (P0):
- Every pointer MUST be labeled `Existing` or `Planned`.
- `Existing` MUST be verifiable (path exists). Include a concrete `Verify` command for each existing pointer.
- Do NOT describe `Planned` pointers as "validated/exists".
- Evidence MUST reference BOTH sources somewhere in this section:
  - command docs: `.claude/commands/**.md` (section heading is enough)
  - TypeScript implementation: `ccw/src/**` (function name / subcommand case / ripgrep-able string)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/ccw-coordinator.md` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `CCW Coordinator Command` ; ts: `ccw/src/tools/command-registry.ts` / `export class CommandRegistry {` | `Test-Path .claude/commands/ccw-coordinator.md` | Command behavior oracle + headings used for evidence |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `CommandRegistry Integration` ; ts: `ccw/src/tools/command-registry.ts` / `export class CommandRegistry {` | `Test-Path ccw/src/tools/command-registry.ts; rg "export class CommandRegistry {" ccw/src/tools/command-registry.ts` | Current command discovery implementation |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `Available Commands` ; ts: `ccw/src/core/routes/commands-routes.ts` / `pathname === '/api/commands'` | `Test-Path ccw/src/core/routes/commands-routes.ts; rg "pathname === '/api/commands'" ccw/src/core/routes/commands-routes.ts` | Server-side listing patterns (may be preferred discovery backend) |
| `.workflow/.ccw-coordinator/` | Planned | docs: `.claude/commands/ccw-coordinator.md` / `State File Structure` ; ts: `ccw/src/tools/command-registry.ts` / `export class CommandRegistry {` | `Test-Path .workflow/.ccw-coordinator` | Runtime session state root |

Notes:
- Use **one row per pointer**.
- Evidence format recommendation:
  - `docs: <file> / <section heading>`
  - `ts: <file> / <function|case|pattern>`

## Implementation Hints (Tooling/Server)

- `ccw/src/tools/command-registry.ts` currently auto-detects `.claude/commands/workflow` (project-relative) and falls back to `~/.claude/commands/workflow`.
- `ccw/src/core/routes/commands-routes.ts` exposes an `/api/commands` listing that can incorporate groups/config, which may better match coordinator needs.

## Proposed Fix Plan (Minimal)

1. [docs] Update `.claude/commands/ccw-coordinator.md` to explicitly state the current discovery scope (workflow-only) OR define the intended multi-root scope.
2. [ts] If multi-root is intended, extend `CommandRegistry` (or add an adapter) to scan additional roots (e.g. `.claude/commands/issue` and top-level `.claude/commands/*.md`).
3. [tests] Add/extend tests for multi-root discovery + nested directories.
4. [docs] Ensure state path + resume semantics in docs match actual runtime behavior.

