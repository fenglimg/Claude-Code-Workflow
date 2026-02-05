# Gap Report: workflow:brainstorm:role-analysis

## Reference

- Selected reference: `/workflow:brainstorm:role-analysis` (`.claude/commands/workflow/brainstorm/role-analysis.md`)

## P0 Gaps (Must Fix)

- Command identity mismatch in requirement wording: requirement header mentions `/workflow:role-analysis`, while the oracle command and corpus usage is `/workflow:brainstorm:role-analysis`.
  - Fix: treat `group=workflow:brainstorm` as canonical for the outline/spec (done in `spec.json` + outline).

## P1 Gaps (Should Fix)

- Tooling alignment: `ccw/src/tools/command-registry.ts` auto-detects `.claude/commands/workflow` but does not obviously cover nested `workflow/brainstorm/*.md` paths.
  - Fix (if tooling must list brainstorm commands): extend registry to recurse subdirectories or add a dedicated brainstorm registry.

## P2 Gaps (Optional)

- Help surface: dashboard help includes `/workflow:brainstorm:auto-parallel` but not `/workflow:brainstorm:role-analysis`; consider adding a link if discoverability matters.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/brainstorm/role-analysis.md` | Existing | docs: `.claude/commands/workflow/brainstorm/role-analysis.md` / `Usage` ; ts: `ccw/src/tools/command-registry.ts` / `join('.claude', 'commands', 'workflow')` | `Test-Path .claude/commands/workflow/brainstorm/role-analysis.md` | oracle doc + update target |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/brainstorm/role-analysis.md` / `Execution Protocol` ; ts: `ccw/src/tools/command-registry.ts` / `findCommandDir(): string | null` | `Test-Path ccw/src/tools/command-registry.ts` | determines how command docs are discovered/parsed |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/brainstorm/role-analysis.md` / `Context Loading` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active'` | `Test-Path ccw/src/tools/session-manager.ts` | session + brainstorm artifacts layout |
| `ccw/src/commands/session-path-resolver.ts` | Existing | docs: `.claude/commands/workflow/brainstorm/role-analysis.md` / `Output Structure` ; ts: `ccw/src/commands/session-path-resolver.ts` / `'.brainstorming/': 'brainstorm'` | `Test-Path ccw/src/commands/session-path-resolver.ts` | classifies brainstorm paths for tooling UX |
| `/workflow:brainstorm:auto-parallel` | Existing | docs: `.claude/commands/workflow/brainstorm/auto-parallel.md` / `3-Phase Execution` ; ts: `ccw/src/templates/dashboard-js/views/help.js` / `/workflow:brainstorm:auto-parallel` | `Test-Path .claude/commands/workflow/brainstorm/auto-parallel.md` | coordinator that should remain compatible with role-analysis |
| `.workflow/active/{session-id}/.brainstorming/{role-name}/analysis*.md` | Planned | docs: `.claude/commands/workflow/brainstorm/role-analysis.md` / `Output Structure` ; ts: `ccw/src/tools/session-manager.ts` / `brainstorm: '{base}/.brainstorming/{filename}'` | `Test-Path .workflow/active` | runtime output path (varies by session) |

## Implementation Hints (Tooling/Server)

- If CCW tooling must enumerate brainstorm commands, prefer a minimal change:
  - add recursive directory traversal under `.claude/commands/workflow/` and preserve current flat lookup behavior for top-level commands.
- If no tooling consumption is required, keep scope to command docs and runtime artifact conventions only.

## Proposed Fix Plan (Minimal)

1) Decide canonical invocation string: keep `/workflow:brainstorm:role-analysis` (aligns with corpus docs).
2) If needed, extend command discovery tooling to cover nested brainstorm docs:
   - update `ccw/src/tools/command-registry.ts` to recurse and map `workflow/brainstorm/*.md`.
   - add/adjust tests to prevent regression in top-level command lookup.
3) (Optional) add dashboard help link for role-analysis near existing brainstorm workflow diagram.

