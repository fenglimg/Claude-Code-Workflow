---
name: style-skill-memory
description: Generate SKILL memory package from style reference for easy loading and consistent design system usage
argument-hint: "[package-name] [--regenerate]"
allowed-tools: Bash,Read,Write,TodoWrite
group: memory
---

# Memory: Style SKILL Memory Generator

## Overview

- Goal: Convert a style reference package into SKILL memory for fast, consistent design-system loading.
- Command: `/memory:style-skill-memory`

## Usage

```bash
/memory:style-skill-memory [package-name] [--regenerate]
```

## Inputs

- Required inputs:
  - Style reference package directory: `.workflow/reference_style/{package-name}/` (generated upstream)
- Optional inputs:
  - `package-name` (positional): If omitted, auto-detect from current directory name (strip leading `style-` if present)
  - `--regenerate`: Overwrite/recreate SKILL.md even if it already exists

## Outputs / Artifacts

- Writes:
  - `.claude/skills/style-{package-name}/SKILL.md`
- Reads:
  - `.workflow/reference_style/{package-name}/design-tokens.json`
  - `.workflow/reference_style/{package-name}/layout-templates.json`
  - `.workflow/reference_style/{package-name}/animation-tokens.json` (optional)
  - `.claude/skills/style-{package-name}/SKILL.md` (existence check)

## Implementation Pointers

- Command doc: `.claude/commands/memory/style-skill-memory.md`
- Likely code locations:
  - `.claude/commands/memory/style-skill-memory.md`
  - `.claude/commands/workflow/ui-design/codify-style.md`
  - `ccw/src/tools/command-registry.ts`
  - `ccw/src/commands/memory.ts`

### Evidence (Existing vs Planned)

You MUST label each pointer as `Existing` (verifiable in repo now) or `Planned` (will be created/modified).

Rules:
- `Existing` MUST include evidence from BOTH:
  - a command doc source: `.claude/commands/**.md` (section heading is sufficient)
  - a TypeScript source: `ccw/src/**` (function name / subcommand case / a ripgrep-able string)
- If you cannot verify, downgrade to `Planned` and add a concrete `Verify` step (e.g. `Test-Path <path>`, `rg "<pattern>" <path>`).

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/memory/style-skill-memory.md` | Existing | docs: `.claude/commands/memory/style-skill-memory.md` / `Execution Process` ; ts: `ccw/src/tools/command-registry.ts` / `'allowed-tools'` | `Test-Path .claude/commands/memory/style-skill-memory.md` | Slash command spec/oracle used to implement and validate behavior |
| `.claude/commands/workflow/ui-design/codify-style.md` | Existing | docs: `.claude/commands/memory/style-skill-memory.md` / `Common Errors` ; ts: `ccw/src/tools/command-registry.ts` / `'allowed-tools'` | `Test-Path .claude/commands/workflow/ui-design/codify-style.md` | Upstream producer of `.workflow/reference_style/{package-name}/` used as input |
| `.workflow/reference_style/{package-name}/` | Planned | docs: `.claude/commands/memory/style-skill-memory.md` / `Overview` ; ts: `ccw/src/tools/command-registry.ts` / `join('.claude', 'commands', 'workflow')` | `Test-Path .workflow/reference_style/{package-name}` | Input package location; must exist before generation |
| `.claude/skills/style-{package-name}/SKILL.md` | Planned | docs: `.claude/commands/memory/style-skill-memory.md` / `Overview` ; ts: `ccw/src/tools/command-registry.ts` / `parseYamlHeader(content: string)` | `Test-Path .claude/skills/style-{package-name}/SKILL.md` | Primary output artifact for later loading workflows |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/memory/style-skill-memory.md` / `Implementation Details` ; ts: `ccw/src/tools/command-registry.ts` / `parseYamlHeader(content: string)` | `Test-Path ccw/src/tools/command-registry.ts` | Reference for how command frontmatter is parsed/indexed in CCW tooling |
| `ccw/src/commands/memory.ts` | Existing | docs: `.claude/commands/memory/style-skill-memory.md` / `Implementation Details` ; ts: `ccw/src/commands/memory.ts` / `CCW Memory Module` | `Test-Path ccw/src/commands/memory.ts` | Nearby TS entrypoint for memory-related CLI behavior (pattern reference) |

Notes:
- Expand `likely code locations` into one row per pointer.
- For TS evidence, prefer anchors like `function <name>` / `case '<subcommand>'` / a stable string literal that can be found via `rg`.

## Execution Process

1. Initialize TodoWrite (first action) with 3 phases: validate, read/analyze, generate.
2. Parse `package-name`:
   - Prefer positional arg; if missing, auto-detect from `pwd` (strip leading `style-`).
3. Phase 1: Validate
   - Check `.workflow/reference_style/{package-name}/` exists.
   - If `.claude/skills/style-{package-name}/SKILL.md` exists and `--regenerate` is not set, stop with a clear message.
4. Phase 2: Read & analyze
   - Read `design-tokens.json` and `layout-templates.json`.
   - If `animation-tokens.json` exists, read it.
   - Compute summary metadata (component counts, token-system characteristics) for templating.
5. Phase 3: Generate
   - Create `.claude/skills/style-{package-name}/` directory.
   - Generate and Write `.claude/skills/style-{package-name}/SKILL.md` using the analyzed data.
   - Verify output file exists.
6. Mark all todos completed and print a concise completion message with output path + summary.

## Error Handling

- Package not found: `.workflow/reference_style/{package-name}/` missing; suggest running `/workflow:ui-design:codify-style` first.
- SKILL exists: do not overwrite unless `--regenerate`.
- Missing required JSON files: fail fast with file name and expected location.
- Invalid JSON: surface which file failed to parse, recommend regenerating the package.

## Examples

```bash
# Generate SKILL memory from a specific style reference package
/memory:style-skill-memory main-app-style-v1

# Force regeneration
/memory:style-skill-memory main-app-style-v1 --regenerate

# Auto-detect package-name from current directory
/memory:style-skill-memory
```

