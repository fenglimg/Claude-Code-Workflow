# Gap Report: workflow:gather

## Reference

- Selected reference: /workflow:gather (`.claude/commands/workflow/tools/context-gather.md`)

## P0 Gaps (Must Fix)

- Allowed-tools vs described behavior: the oracle doc contains `Write(...)` but frontmatter omits `Write(*)`. Decide one:
  - Update allowed-tools to include `Write(*)`, or
  - Ensure the orchestrator does not call Write directly (all writes happen inside Task subagents).
- Artifact path inconsistency: the oracle mixes `.workflow/active/<session_id>/...` with `.workflow/<session_id>/...`. Pick one canonical layout (prefer `.workflow/active/<session_id>` to align with CCW tooling).
- Command discovery mismatch risk: `ccw/src/tools/command-registry.ts` resolves `.claude/commands/workflow/<name>.md` and does not recurse into `tools/`. If registry-based discovery is required for `/workflow:gather`, move/duplicate docs or enhance discovery.

## P1 Gaps (Should Fix)

- Canonical command naming: examples/headings use `/workflow:tools:context-gather` while the frontmatter `name: gather` implies `/workflow:gather`. Pick one canonical slash and treat the other as an alias (explicitly documented).
- Make “who writes what” explicit: clarify which agent/tool creates each artifact (orchestrator vs subagent) so allowed-tools stays accurate.

## P2 Gaps (Optional)

- Add a short JSON schema excerpt (required fields only) for `context-package.json`.
- Add explicit timeouts/limits for parallel explore tasks (cap angles for high complexity).

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/tools/context-gather.md` | Existing | docs: `.claude/commands/workflow/tools/context-gather.md` / `Context Gather Command (/workflow:tools:context-gather)` ; ts: `ccw/src/tools/command-registry.ts` / `const relativePath = join('.claude', 'commands', 'workflow');` | `Test-Path .claude/commands/workflow/tools/context-gather.md` | oracle doc (command behavior + artifacts) |
| `.claude/agents/context-search-agent.md` | Existing | docs: `.claude/commands/workflow/tools/context-gather.md` / `Step 3: Invoke Context-Search Agent` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path .claude/agents/context-search-agent.md` | subagent responsible for discovery + packaging |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/tools/context-gather.md` / `Core Philosophy` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path ccw/src/tools/session-manager.ts` | canonical artifact routing for `.workflow/active/<session_id>/...` |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/tools/context-gather.md` / `Notes` ; ts: `ccw/src/tools/command-registry.ts` / `ERROR: ~/.claude/commands/workflow directory not found` | `Test-Path ccw/src/tools/command-registry.ts` | explains why nested `tools/` docs may not be discoverable |
| `.workflow/active/<session_id>/.process/context-package.json` | Planned | docs: `.claude/commands/workflow/tools/context-gather.md` / `Core Philosophy` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path .workflow` | runtime artifact produced by command |

## Implementation Hints (Tooling/Server)

- Prefer `.workflow/active/<session_id>/...` conventions (see `ccw/src/tools/session-manager.ts`).
- If CCW command discovery is used (dashboard/help), align docs layout with `ccw/src/tools/command-registry.ts` expectations or extend it to recurse.

## Proposed Fix Plan (Minimal)

1. Resolve allowed-tools vs write behavior (add `Write(*)` or route all writes through Task subagents).
2. Normalize artifact paths to a single canonical layout.
3. Align doc location/naming with command registry discovery expectations (or explicitly state this command is not registry-discovered).
