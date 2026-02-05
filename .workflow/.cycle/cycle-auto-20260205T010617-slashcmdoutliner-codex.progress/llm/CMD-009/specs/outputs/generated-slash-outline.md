---
name: flow-create
description: Interactive generator that creates workflow template JSON for the flow-coordinator meta-skill.
argument-hint: "[template-name] [--output <path>]"
allowed-tools: AskUserQuestion(*), Read(*), Write(*)
---

# Flow Template Generator

## Overview

- Goal: Generate a reusable workflow/flow template (JSON) by guiding the user through template design and step definition.
- Command: `/flow-create`

## Usage

```bash
/flow-create [template-name] [--output <path>]
```

## Inputs

- Required inputs:
  - None (interactive prompts can collect all required fields)
- Optional inputs:
  - `template-name` (if omitted, prompt for it)
  - `--output <path>` (directory path for writing the generated template file)

## Outputs / Artifacts

- Writes:
  - `<output-dir>/<template-name>.json`
- Reads:
  - `.claude/commands/flow-create.md` (spec/oracle; used for behavior definition)

## Implementation Pointers

- Command doc: `.claude/commands/flow-create.md`
- Likely code locations:
  - `ccw/src/core/routes/commands-routes.ts`
  - `ccw/src/templates/dashboard-js/views/commands-manager.js`
  - `ccw/docs-site/docs/commands/general/flow-create.mdx`

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/flow-create.md` | Existing | docs: `.claude/commands/flow-create.md` / Flow Template Generator ; ts: `ccw/src/core/routes/commands-routes.ts` / function parseCommandFrontmatter(content: string): CommandMetadata | `Test-Path .claude/commands/flow-create.md` | primary command doc that needs CCW-aligned frontmatter and sections |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/flow-create.md` / Flow Template Generator ; ts: `ccw/src/core/routes/commands-routes.ts` / function getCommandsDir(location: CommandLocation, projectPath: string): string { | `Test-Path ccw/src/core/routes/commands-routes.ts` | command metadata API parses YAML frontmatter for commands UI |
| `ccw/src/templates/dashboard-js/views/commands-manager.js` | Existing | docs: `.claude/commands/flow-create.md` / Flow Template Generator ; ts: `ccw/src/templates/dashboard-js/views/commands-manager.js` / async function renderCommandsManager() { | `Test-Path ccw/src/templates/dashboard-js/views/commands-manager.js` | dashboard view that surfaces commands and groups |
| `ccw/docs-site/docs/commands/general/flow-create.mdx` | Existing | docs: `.claude/commands/flow-create.md` / Flow Template Generator ; ts: `ccw/src/core/routes/commands-routes.ts` / function parseCommandFrontmatter(content: string): CommandMetadata | `Test-Path ccw/docs-site/docs/commands/general/flow-create.mdx` | public docs confirm invocation and user-facing behavior |

## Execution Process

1. Parse input args: `template-name` and `--output <path>`.
2. Phase 1: Template Design
   - Prompt for purpose/description and complexity level (1-4).
   - Confirm final template name and destination output directory.
3. Phase 2: Step Definition
   - Offer suggested step templates based on purpose/level.
   - If customizing, loop steps:
     - Select command category.
     - Select specific command.
     - Select execution unit.
     - Select execution mode.
     - Capture per-step context hint.
4. Phase 3: Generate JSON
   - Assemble template JSON with metadata + ordered steps.
   - Validate required fields (name, description, steps[]).
   - Write file to `<output-dir>/<template-name>.json`.
5. Print a concise summary (template name, step count, output path).

## Error Handling

- Missing/invalid output directory: prompt again; if still invalid, abort without writing.
- Write failures (permission/path): return a clear error and keep the in-memory template for re-try.
- User cancels at any phase: abort gracefully without partial writes.

## Examples

```bash
/flow-create
/flow-create bugfix-v2
/flow-create my-workflow --output ~/.claude/skills/my-skill/templates/
```

