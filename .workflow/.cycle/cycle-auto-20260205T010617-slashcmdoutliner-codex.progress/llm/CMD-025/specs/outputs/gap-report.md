# Gap Report: memory:update-related

## Reference

- Selected reference: /memory:update-related (`.claude/commands/memory/update-related.md`)

## P0 Gaps (Must Fix)

- Add `allowed-tools` to `.claude/commands/memory/update-related.md` frontmatter if this command doc is expected to satisfy CCW quality gates (the current oracle doc omits it).

## P1 Gaps (Should Fix)

- Make the safety verification step cross-platform in the command doc examples (avoid relying on `grep` in verify snippets when PowerShell is the default on Windows).

## P2 Gaps (Optional)

- Align sibling memory command docs (`update-full`, `docs-related-cli`, `docs-full-cli`) to the same `allowed-tools` frontmatter convention for consistency.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/memory/update-related.md` | Existing | docs: `.claude/commands/memory/update-related.md` / Related Documentation Update (/memory:update-related) ; ts: `ccw/src/tools/update-module-claude.js` / name: 'update_module_claude', | `Test-Path .claude/commands/memory/update-related.md` | Oracle command doc for behavior and headings. |
| `ccw/src/tools/detect-changed-modules.ts` | Existing | docs: `.claude/commands/memory/update-related.md` / Phase 1: Change Detection & Analysis ; ts: `ccw/src/tools/detect-changed-modules.ts` / name: 'detect_changed_modules', | `Test-Path ccw/src/tools/detect-changed-modules.ts; rg \"name: 'detect_changed_modules',\" ccw/src/tools/detect-changed-modules.ts` | Changed-module detector used by the coordinator. |
| `ccw/src/tools/update-module-claude.js` | Existing | docs: `.claude/commands/memory/update-related.md` / Phase 3A: Direct Execution (<15 modules) ; ts: `ccw/src/tools/update-module-claude.js` / name: 'update_module_claude', | `Test-Path ccw/src/tools/update-module-claude.js; rg \"name: 'update_module_claude',\" ccw/src/tools/update-module-claude.js` | Per-module CLAUDE.md update tool invoked with tool fallback. |
| `ccw/src/core/routes/files-routes.ts` | Existing | docs: `.claude/commands/memory/update-related.md` / Phase 3A: Direct Execution (<15 modules) ; ts: `ccw/src/core/routes/files-routes.ts` / spawn('ccw', ['tool', 'exec', 'update_module_claude', params], { | `Test-Path ccw/src/core/routes/files-routes.ts; rg \"spawn\\('ccw', \\['tool', 'exec', 'update_module_claude', params\\], \\{\" ccw/src/core/routes/files-routes.ts` | Existing spawn-based orchestration surface for running `ccw tool exec update_module_claude`. |

## Implementation Hints (Tooling/Server)

- `detect_changed_modules` output should include `depth:` and `path:` fields to support depth-first scheduling. (See `ccw/src/tools/detect-changed-modules.ts`.)
- `update_module_claude` should accept `{ strategy, path, tool }` JSON params and return a JSON result (success/error) for coordinator reporting. (See `ccw/src/tools/update-module-claude.js` and `ccw/src/core/routes/files-routes.ts`.)

## Proposed Fix Plan (Minimal)

- Add `allowed-tools: Task(*), AskUserQuestion(*), Read(*), Write(*), Bash(*)` to `.claude/commands/memory/update-related.md` frontmatter.
- Replace `grep`-based safety checks in docs with a PowerShell-compatible alternative (or provide both variants).
