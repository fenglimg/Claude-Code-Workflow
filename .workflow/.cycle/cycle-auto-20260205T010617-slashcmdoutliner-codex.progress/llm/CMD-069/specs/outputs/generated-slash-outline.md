---
name: design-sync
description: Synchronize finalized design system references to brainstorming artifacts, preparing them for /workflow:plan consumption
argument-hint: "--session <session_id> [--selected-prototypes \"<list>\"]"
allowed-tools: Read(*), Write(*), Edit(*), TodoWrite(*), Glob(*), Bash(*)
group: workflow
---

# Design Sync Command

## Overview

- Goal: Update brainstorming artifacts to reference the latest design system (via @ links) so `/workflow:plan` can discover tokens, style guide, and selected prototypes.
- Command: `/workflow:design-sync`

## Usage

```bash
/workflow:design-sync --session <session_id> [--selected-prototypes "proto-a,proto-b"]
```

## Inputs

- Required inputs:
  - `--session <session_id>`: workflow session id (maps to `.workflow/active/WFS-<session_id>/`)
- Optional inputs:
  - `--selected-prototypes "<list>"`: comma-separated prototype basenames (defaults to all prototypes found)

## Outputs / Artifacts

- Writes:
  - `.workflow/active/WFS-{session}/.brainstorming/role analysis documents`
  - `.workflow/active/WFS-{session}/.brainstorming/ui-designer/analysis*.md`
  - `.workflow/active/WFS-{session}/.brainstorming/ui-designer/design-system-reference.md`
  - `.workflow/active/WFS-{session}/.brainstorming/ux-expert/analysis*.md` (if animations exist)
  - `.workflow/active/WFS-{session}/.brainstorming/system-architect/analysis*.md` (if layouts exist)
  - `.workflow/active/WFS-{session}/.brainstorming/product-manager/analysis*.md` (if prototypes are referenced)
  - `.workflow/active/WFS-{session}/.process/context-package.json`
- Reads:
  - `.workflow/active/WFS-{session}/.brainstorming/role analysis documents`
  - `.workflow/active/WFS-{session}/.brainstorming/**/analysis*.md` (targeted updates)
  - `.workflow/active/WFS-{session}/design-run-*` (existence checks only)
  - `{latest_design}/style-extraction/**/design-tokens.json` (existence checks only)
  - `{latest_design}/style-extraction/**/style-guide.md` (existence checks only)
  - `{latest_design}/prototypes/*.html` (existence checks only)
  - `{latest_design}/prototypes/*-notes.md` (optional; minimal context like page_name/layout_strategy)

## Implementation Pointers

- Command doc: `.claude/commands/workflow/ui-design/design-sync.md`
- Likely code locations:
  - `ccw/src/core/routes/commands-routes.ts` (command discovery + group mapping)
  - `ccw/src/tools/session-manager.ts` (canonical `.workflow/active` base paths)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/ui-design/design-sync.md` | Existing | docs: `.claude/commands/workflow/ui-design/design-sync.md` / `Design Sync Command` ; ts: `ccw/src/core/routes/commands-routes.ts` / `return join(projectPath, '.claude', 'commands');` | `Test-Path .claude/commands/workflow/ui-design/design-sync.md` | source of truth for the slash command behavior |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/workflow/ui-design/design-sync.md` / `Overview` ; ts: `ccw/src/core/routes/commands-routes.ts` / `function scanCommandsRecursive(` | `Test-Path ccw/src/core/routes/commands-routes.ts; rg "scanCommandsRecursive" ccw/src/core/routes/commands-routes.ts` | proves nested command docs (e.g., ui-design/) are discoverable in CCW UI/API |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/ui-design/design-sync.md` / `Output Structure` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path ccw/src/tools/session-manager.ts; rg "const ACTIVE_BASE = '.workflow/active';" ccw/src/tools/session-manager.ts` | aligns session-scoped artifact paths with shared tooling |
| `.workflow/active/WFS-{session}/.brainstorming/role analysis documents` | Planned | docs: `.claude/commands/workflow/ui-design/design-sync.md` / `Execution Protocol` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path ".workflow/active/WFS-<session>/.brainstorming/role analysis documents"` | primary synthesis file updated with UI/UX Guidelines + @ references |
| `.workflow/active/WFS-{session}/.brainstorming/ui-designer/design-system-reference.md` | Planned | docs: `.claude/commands/workflow/ui-design/design-sync.md` / `Output Structure` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path ".workflow/active/WFS-<session>/.brainstorming/ui-designer/design-system-reference.md"` | creates/updates a dedicated UI-designer reference doc for design tokens/style guide/prototypes |
| `.workflow/active/WFS-{session}/.process/context-package.json` | Planned | docs: `.claude/commands/workflow/ui-design/design-sync.md` / `Phase 5: Update Context Package` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path ".workflow/active/WFS-<session>/.process/context-package.json"` | keeps context package in sync so later tools can consume design references |

## Execution Process

1. Validate `--session` and resolve `.workflow/active/WFS-{session}/`.
2. Find latest design run under the session (e.g., `design-run-*`).
3. Detect design system structure (tokens + style guide paths) via existence checks.
4. Determine prototypes list (all by default; validate `--selected-prototypes` if provided).
5. Memory check: if `role analysis documents` already references current design run in `## UI/UX Guidelines`, exit early.
6. Update target brainstorming artifacts with reference-only `@` links:
   - edit/append `## UI/UX Guidelines` in `role analysis documents`
   - update `ui-designer/analysis*.md` always; update other role analyses conditionally
   - write/update `ui-designer/design-system-reference.md`
7. Update `.process/context-package.json` with `design_system_references` metadata.
8. Report updated artifacts and next step: `/workflow:plan`.

## Error Handling

- Missing session folder: error with hint to list/initialize session.
- Missing latest design run: error with hint to run the design pipeline first.
- Missing design tokens/style guide: error (prompt to run `/workflow:ui-design:style-extract` and `/workflow:ui-design:generate`).
- Invalid prototype names in `--selected-prototypes`: warn/skip invalid entries, continue.
- Target files missing: create minimal scaffolds (append required sections).
- Edit conflicts: preserve unrelated sections; replace/append only `## UI/UX Guidelines`.

## Examples

```bash
/workflow:design-sync --session demo-123
```

```bash
/workflow:design-sync --session demo-123 --selected-prototypes "dashboard-variant-1,settings-variant-2"
```

