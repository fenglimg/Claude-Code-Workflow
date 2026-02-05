# Gap Report: workflow:complete

## Reference

- Selected reference: /workflow:session:complete (`.claude/commands/workflow/session/complete.md`)

## P0 Gaps (Must Fix)

- Decide whether `/workflow:complete` is a pure alias (recommended) or a duplicate of the full completion procedure. If alias, the doc must explicitly delegate to `/workflow:session:complete` and avoid duplicating long bash blocks.
- Confirm allowed-tools for the alias doc are consistent with CCW conventions for workflow commands (at minimum, must not omit tools needed by the described behavior).
- Ensure all key implementation pointers are evidence-based (Existing vs Planned) with dual-source evidence (docs + `ccw/src/**` anchors) and pass deterministic verification.

## P1 Gaps (Should Fix)

- Update discovery surfaces so users find `/workflow:complete`:
  - command registry/index (ccw-help)
  - dashboard help/flow graph (if it should prefer the alias)
  - command reference docs (if present)
- Clarify resume semantics: how `.archiving` marker is used to allow safe retry after failure.

## P2 Gaps (Optional)

- Add a short "Quick Reference" section in the alias doc with the minimal invocations + expected outputs.
- If `--detailed` is supported, define what additional details are emitted (extra manifest fields vs extra console output).

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/complete.md` | Planned | docs: `.claude/commands/workflow/session/complete.md` / Complete Workflow Session (/workflow:session:complete) ; ts: `ccw/src/tools/session-manager.ts` / const ARCHIVE_BASE = '.workflow/archives'; | `Test-Path .claude/commands/workflow/complete.md` | new alias command doc |
| `.claude/commands/workflow/session/complete.md` | Existing | docs: `.claude/commands/workflow/session/complete.md` / Complete Workflow Session (/workflow:session:complete) ; ts: `ccw/src/tools/session-manager.ts` / function executeArchive(params: Params): any { | `Test-Path .claude/commands/workflow/session/complete.md` | oracle reference |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/session/complete.md` / Complete Workflow Session (/workflow:session:complete) ; ts: `ccw/src/tools/session-manager.ts` / const ACTIVE_BASE = '.workflow/active'; | `Test-Path ccw/src/tools/session-manager.ts` | implementation surface for session archive |
| `ccw/src/templates/dashboard-js/views/help.js` | Existing | docs: `.claude/commands/workflow/session/complete.md` / Complete Workflow Session (/workflow:session:complete) ; ts: `ccw/src/templates/dashboard-js/views/help.js` / label: '/workflow:session:complete' | `Test-Path ccw/src/templates/dashboard-js/views/help.js` | may need UI label switch to `/workflow:complete` |
| `.claude/skills/ccw-help/command.json` | Existing | docs: `.claude/commands/workflow/session/complete.md` / Complete Workflow Session (/workflow:session:complete) ; ts: `ccw/src/templates/dashboard-js/views/help.js` / label: '/workflow:session:complete' | `Test-Path .claude/skills/ccw-help/command.json` | add alias entry (and regenerate derived indexes if required) |

## Implementation Hints (Tooling/Server)

- `ccw/src/tools/session-manager.ts` already defines workflow session locations (`.workflow/active`, `.workflow/archives`) and includes an archive operation; prefer reusing it if/when the completion flow is moved from doc-only to tool-backed execution.

## Proposed Fix Plan (Minimal)

1) Docs (P0)
   - Create `.claude/commands/workflow/complete.md` with CCW frontmatter + core sections.
   - State explicitly: delegates to `/workflow:session:complete` and forwards `[-y|--yes] [--detailed]` args.

2) Indexing / Discovery (P1)
   - Add `/workflow:complete` to `.claude/skills/ccw-help/command.json` (and any derived index JSONs, if this repo requires regeneration).
   - Decide whether `ccw/src/templates/dashboard-js/views/help.js` should display `/workflow:complete` instead of `/workflow:session:complete`.

3) Validation (P0)
   - Run evidence gate on the updated doc + gap report outputs.

