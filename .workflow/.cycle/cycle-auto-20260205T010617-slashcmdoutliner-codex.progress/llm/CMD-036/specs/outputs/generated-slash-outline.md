---
name: init-guidelines
description: Interactive wizard to fill project-guidelines.json based on project analysis
argument-hint: "[--reset]"
allowed-tools: Read(*), Write(*), AskUserQuestion(*)
group: workflow
---

# Workflow Init Guidelines Command (/workflow:init-guidelines)

## Overview

- Goal: Initialize or refine project rules in `.workflow/project-guidelines.json` via a multi-round wizard tailored to `.workflow/project-tech.json`.
- Command: `/workflow:init-guidelines`

## Usage

```bash
/workflow:init-guidelines
/workflow:init-guidelines --reset
```

## Inputs

- Required inputs:
  - `.workflow/project-tech.json` (must already exist; typically created by `/workflow:init`)
- Optional inputs:
  - Existing `.workflow/project-guidelines.json` (used for merge/append unless `--reset`)

## Outputs / Artifacts

- Writes:
  - `.workflow/project-guidelines.json`
- Reads:
  - `.workflow/project-tech.json`
  - `.workflow/project-guidelines.json`

## Implementation Pointers

- Command doc: `.claude/commands/workflow/init-guidelines.md`
- Likely code locations:
  - `ccw/src/tools/command-registry.ts`
  - `ccw/src/core/routes/commands-routes.ts`
  - `ccw/src/core/routes/ccw-routes.ts`

### Evidence (Existing vs Planned)

You MUST label each pointer as `Existing` (verifiable in repo now) or `Planned` (will be created/modified).

Rules:
- `Existing` MUST include evidence from BOTH:
  - a command doc source: `.claude/commands/**.md` (section heading is sufficient)
  - a TypeScript source: `ccw/src/**` (function name / subcommand case / a ripgrep-able string)
- If you cannot verify, downgrade to `Planned` and add a concrete `Verify` step (e.g. `Test-Path <path>`, `rg "<pattern>" <path>`).

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/init-guidelines.md` | Existing | docs: `.claude/commands/workflow/init-guidelines.md` / Workflow Init Guidelines Command (/workflow:init-guidelines) ; ts: `ccw/src/tools/command-registry.ts` / export class CommandRegistry { | `Test-Path .claude/commands/workflow/init-guidelines.md` | Primary command doc to update/align (frontmatter + behavior details) |
| `.claude/commands/workflow/session/solidify.md` | Existing | docs: `.claude/commands/workflow/session/solidify.md` / Session Solidify Command (/workflow:session:solidify) ; ts: `ccw/src/core/routes/ccw-routes.ts` / '.workflow', 'project-guidelines.json' | `Test-Path .claude/commands/workflow/session/solidify.md` | Closest reference for updating `.workflow/project-guidelines.json` safely |
| `.claude/commands/workflow/init.md` | Existing | docs: `.claude/commands/workflow/init.md` / Workflow Init Command (/workflow:init) ; ts: `ccw/src/tools/command-registry.ts` / readFileSync(filePath, 'utf-8') | `Test-Path .claude/commands/workflow/init.md` | Caller/entrypoint that establishes prerequisites and can delegate to this wizard |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / CommandRegistry Integration ; ts: `ccw/src/tools/command-registry.ts` / const toolsStr = header['allowed-tools'] | `Test-Path ccw/src/tools/command-registry.ts` | Evidence-based location where command frontmatter (allowed-tools, etc.) is parsed |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / Available Commands ; ts: `ccw/src/core/routes/commands-routes.ts` / interface CommandMetadata { | `Test-Path ccw/src/core/routes/commands-routes.ts` | Commands listing/metadata surface that depends on frontmatter correctness |
| `ccw/src/core/routes/ccw-routes.ts` | Existing | docs: `.claude/commands/workflow/plan.md` / Coordinator Role ; ts: `ccw/src/core/routes/ccw-routes.ts` / '.workflow', 'project-guidelines.json' | `Test-Path ccw/src/core/routes/ccw-routes.ts` | Tooling path that expects `.workflow/project-guidelines.json` to exist and be parseable |

Notes:
- Use **one row per pointer** (do not aggregate multiple pointers into one row).
- For TS evidence, prefer anchors like `function <name>` / `case '<subcommand>'` / a stable string literal that can be found via `rg`.

## Execution Process

- Input parsing
  - Parse `--reset` (boolean)
- Step 1: Check prerequisites
  - Require `.workflow/project-tech.json` exists and is parseable JSON
  - If `.workflow/project-guidelines.json` exists and is populated:
    - If `--reset`: proceed with reset
    - Else: confirm overwrite vs append/merge via `AskUserQuestion`
- Step 2: Load project context
  - Read `.workflow/project-tech.json` and extract stack + architecture signals to tailor questions
- Step 3: Multi-round interactive questionnaire (5 rounds)
  - Round 1: Coding conventions
  - Round 2: File structure & documentation
  - Round 3: Architecture & tech stack constraints
  - Round 4: Performance & security constraints
  - Round 5: Quality rules
- Step 4: Write `.workflow/project-guidelines.json`
  - Merge/append according to user choice (or reset)
  - Ensure `_metadata.last_updated` and `_metadata.updated_by` are set
- Step 5: Display summary
  - Print counts and next steps (e.g., `/workflow:plan`, `/workflow:session:solidify`)

## Error Handling

- Missing prerequisites
  - `.workflow/project-tech.json` missing: instruct to run `/workflow:init`
- Invalid JSON
  - If existing guidelines JSON cannot be parsed: ask whether to overwrite (or require `--reset`)
- Empty answers
  - Re-prompt when required rounds have no selections / blank text (per question type)
- Safe writes
  - Avoid destructive overwrite unless user confirmed or `--reset`

## Examples

- Initialize guidelines interactively:
  - `/workflow:init-guidelines`
- Reset and rebuild guidelines from scratch:
  - `/workflow:init-guidelines --reset`
