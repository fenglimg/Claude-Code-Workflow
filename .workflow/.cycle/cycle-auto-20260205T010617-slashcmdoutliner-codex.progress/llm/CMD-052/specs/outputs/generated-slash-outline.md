---
name: session:solidify
description: Crystallize session learnings and user-defined constraints into permanent project guidelines
argument-hint: "[-y|--yes] [--type <convention|constraint|learning>] [--category <category>] \"rule or insight\" [--interactive]"
allowed-tools: Read(*), Write(*), AskUserQuestion(*), Bash(*)
group: workflow
---

# workflow:session:solidify

## Overview

- Goal: Persist important session decisions as durable project rules so future planning and tooling automatically respects them.
- Command: `/workflow:session:solidify`

## Usage

```bash
/workflow:session:solidify "rule or insight" [--type <convention|constraint|learning>] [--category <category>] [-y|--yes] [--interactive]
```

## Inputs

- Required inputs:
  - `rule` (string) unless `--interactive`
- Optional inputs:
  - `--type` (enum): `convention` | `constraint` | `learning` (default: auto-detect)
  - `--category` (string): subcategory for organization (depends on `--type`)
  - `-y, --yes` (flag): auto mode (skip confirmation)
  - `--interactive` (flag): guided wizard

## Outputs / Artifacts

- Writes:
  - `.workflow/project-guidelines.json`
- Reads:
  - `.workflow/project-guidelines.json`

## Implementation Pointers

- Command doc: `.claude/commands/workflow/session/solidify.md`
- Likely code locations:
  - `.claude/commands/workflow/init-guidelines.md`
  - `.claude/commands/workflow/tools/context-gather.md`
  - `.claude/workflows/cli-templates/schemas/project-guidelines-schema.json`
  - `ccw/src/core/data-aggregator.ts`
  - `ccw/src/core/routes/ccw-routes.ts`

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/session/solidify.md` | Existing | docs: `.claude/commands/workflow/session/solidify.md` / `Session Solidify Command (/workflow:session:solidify)` ; ts: `ccw/src/core/data-aggregator.ts` / `Successfully loaded project guidelines` | `Test-Path .claude/commands/workflow/session/solidify.md` | oracle behavior + taxonomy + artifacts |
| `.workflow/project-guidelines.json` | Planned | docs: `.claude/commands/workflow/session/solidify.md` / `Overview` ; ts: `ccw/src/core/data-aggregator.ts` / `project-guidelines.json` | `Test-Path .workflow/project-guidelines.json` | primary artifact to create/update |
| `.claude/commands/workflow/init-guidelines.md` | Existing | docs: `.claude/commands/workflow/init-guidelines.md` / `Workflow Init Guidelines Command (/workflow:init-guidelines)` ; ts: `ccw/src/core/data-aggregator.ts` / `interface ProjectGuidelines` | `Test-Path .claude/commands/workflow/init-guidelines.md` | scaffold + guideline-structure precedent |
| `.claude/commands/workflow/tools/context-gather.md` | Existing | docs: `.claude/commands/workflow/tools/context-gather.md` / `Context Gather Command (/workflow:tools:context-gather)` ; ts: `ccw/src/core/data-aggregator.ts` / `Successfully loaded project guidelines` | `Test-Path .claude/commands/workflow/tools/context-gather.md` | downstream consumer; ensures integration |
| `.claude/workflows/cli-templates/schemas/project-guidelines-schema.json` | Existing | docs: `.claude/commands/workflow/init-guidelines.md` / `Implementation` ; ts: `ccw/src/core/data-aggregator.ts` / `interface ProjectGuidelines` | `Test-Path .claude/workflows/cli-templates/schemas/project-guidelines-schema.json` | schema reference for JSON shape |
| `ccw/src/core/data-aggregator.ts` | Existing | docs: `.claude/commands/workflow/tools/context-gather.md` / `Execution Process` ; ts: `ccw/src/core/data-aggregator.ts` / `Successfully loaded project guidelines` | `Test-Path ccw/src/core/data-aggregator.ts` | loads guidelines into project overview for tooling/UI |
| `ccw/src/core/routes/ccw-routes.ts` | Existing | docs: `.claude/commands/workflow/session/solidify.md` / `Integration with Planning` ; ts: `ccw/src/core/routes/ccw-routes.ts` / `const guidelinesFile = join(resolvedPath, '.workflow', 'project-guidelines.json');` | `Test-Path ccw/src/core/routes/ccw-routes.ts` | API surface for guidelines read/write workflows |

## Execution Process

1. Parse arguments:
   - `rule` (positional, unless `--interactive`)
   - flags: `--type`, `--category`, `--yes|-y`, `--interactive`
2. Ensure `.workflow/project-guidelines.json` exists:
   - If missing, create scaffold matching `project-guidelines-schema.json`.
3. Determine `type`:
   - If `--type` provided, validate enum.
   - Else auto-detect from rule text (constraint vs learning vs convention).
4. Determine `category`:
   - If provided, validate against the selected type.
   - Else pick a safe default (or prompt in interactive mode).
5. Update guidelines:
   - Load JSON, append to correct section, update metadata, and avoid duplicates.
6. Display confirmation:
   - Print type/category/rule and the JSON path where it was stored.
7. Interactive mode (`--interactive`):
   - Ask for type, then category, then rule text; confirm before write unless `--yes`.

## Error Handling

- Missing `rule` when not `--interactive` -> show usage + error.
- Invalid `--type` or incompatible `--category` -> error with valid options.
- Malformed `.workflow/project-guidelines.json` -> error; do not overwrite; suggest manual fix.
- Duplicate rule -> warn and no-op (or confirm overwrite if entry is structured).

## Examples

```bash
/workflow:session:solidify "Use functional components for all React code" --type convention --category coding_style
/workflow:session:solidify -y "No direct DB access from controllers" --type constraint --category architecture
/workflow:session:solidify --interactive
```
