---
name: init
description: Initialize project-level state with intelligent project analysis using cli-explore-agent
argument-hint: "[--regenerate]"
allowed-tools: Bash(*), Task(cli-explore-agent), AskUserQuestion(*), Skill(workflow:init-guidelines), Read(*), Write(*)
group: workflow
---

# Workflow Init Command (/workflow:init)

## Overview

- Goal: Initialize `.workflow/project-tech.json` (analysis) and `.workflow/project-guidelines.json` (rules scaffold) so other workflows and the CCW dashboard have project context.
- Command: `/workflow:init`

## Usage

```bash
/workflow:init [--regenerate]
```

## Inputs

- Required inputs:
  - none
- Optional inputs:
  - `--regenerate`: force re-analysis; backup existing `.workflow/project-tech.json` first

## Outputs / Artifacts

- Writes:
  - `.workflow/project-tech.json`
  - `.workflow/project-tech.json.backup` (only when `--regenerate` and tech file exists)
  - `.workflow/project-guidelines.json` (scaffold if missing; may be populated via follow-up wizard)
- Reads:
  - `.workflow/project-tech.json` (existence check)
  - `.workflow/project-guidelines.json` (existence + populated check)

## Implementation Pointers

- Command doc: `.claude/commands/workflow/init.md`
- Likely code locations:
  - `.claude/commands/workflow/init-guidelines.md`
  - `ccw/src/tools/get-modules-by-depth.ts`
  - `ccw/src/core/data-aggregator.ts`
  - `ccw/src/templates/dashboard-js/views/project-overview.js`

### Evidence (Existing vs Planned)

You MUST label each pointer as `Existing` (verifiable in repo now) or `Planned` (will be created/modified).

Rules:
- `Existing` MUST include evidence from BOTH:
  - a command doc source: `.claude/commands/**.md` (section heading is sufficient)
  - a TypeScript source: `ccw/src/**` (function name / subcommand case / a ripgrep-able string)
- If you cannot verify, downgrade to `Planned` and add a concrete `Verify` step (e.g. `Test-Path <path>`, `rg "<pattern>" <path>`).

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/init.md` | Existing | docs: `.claude/commands/workflow/init.md` / `Workflow Init Command (/workflow:init)` ; ts: `ccw/src/templates/dashboard-js/views/project-overview.js` / `/workflow:init` | `Test-Path .claude/commands/workflow/init.md` | Oracle command doc and primary entrypoint for the workflow init behavior. |
| `.claude/commands/workflow/init-guidelines.md` | Existing | docs: `.claude/commands/workflow/init-guidelines.md` / `Workflow Init Guidelines Command (/workflow:init-guidelines)` ; ts: `ccw/src/templates/dashboard-js/views/project-overview.js` / `function renderGuidelinesSection` | `Test-Path .claude/commands/workflow/init-guidelines.md` | Optional follow-up wizard to populate `.workflow/project-guidelines.json`. |
| `ccw/src/tools/get-modules-by-depth.ts` | Existing | docs: `.claude/commands/workflow/init.md` / `Step 3: Invoke cli-explore-agent` ; ts: `ccw/src/tools/get-modules-by-depth.ts` / `name: 'get_modules_by_depth'` | `Test-Path ccw/src/tools/get-modules-by-depth.ts` | Tool invoked by the delegated analysis to capture project structure. |
| `ccw/src/core/data-aggregator.ts` | Existing | docs: `.claude/commands/workflow/init.md` / `Overview` ; ts: `ccw/src/core/data-aggregator.ts` / `project-guidelines.json` | `Test-Path ccw/src/core/data-aggregator.ts` | Loads the generated `.workflow/*` artifacts into aggregated workflow/dashboard data. |
| `ccw/src/templates/dashboard-js/views/project-overview.js` | Existing | docs: `.claude/commands/workflow/init.md` / `Project Overview` ; ts: `ccw/src/templates/dashboard-js/views/project-overview.js` / `renderProjectOverview` | `Test-Path ccw/src/templates/dashboard-js/views/project-overview.js` | UI view that prompts `/workflow:init` when project analysis is missing, and renders the resulting overview/guidelines. |

Notes:
- Use one row per pointer.
- For TS evidence, anchors must be literal substrings present in the referenced file.

## Execution Process

1. Parse input
   - Set `regenerate = true` iff `--regenerate` is present.
2. Check existing state
   - If both `.workflow/project-tech.json` and `.workflow/project-guidelines.json` exist and `regenerate=false`: print “Already initialized” and return.
   - If `.workflow/project-tech.json` exists and `regenerate=true`: copy to `.workflow/project-tech.json.backup` before continuing.
3. Get project metadata (best-effort)
   - Determine project name (git root basename if available; fallback to current directory basename).
   - Ensure `.workflow/` exists.
4. Invoke `cli-explore-agent` to generate `.workflow/project-tech.json`
   - In the delegated prompt, require:
     - schema read (project-tech schema)
     - structure scan using `ccw tool exec get_modules_by_depth '{}'`
     - synthesis + schema-conformant JSON output written to `.workflow/project-tech.json`
5. Create guidelines scaffold (if not exists)
   - If `.workflow/project-guidelines.json` missing: create minimal empty scaffold JSON (no rules yet).
6. Display summary
   - Summarize what was generated (files + timestamps + high-level stack/architecture fields if present).
7. Ask about guidelines configuration (only if guidelines are not populated)
   - Ask user to either:
     - run the interactive wizard now (delegate via `Skill(workflow:init-guidelines)`), or
     - skip and show next steps.
8. Return immediately after completion
   - If invoked by another workflow command, do not block; return control to caller.

## Error Handling

- If git metadata lookup fails: continue with cwd-based project name/root.
- If delegated analysis fails or produces invalid JSON: keep existing backup (if created), surface a clear error, and do not overwrite good prior data.
- If `.workflow/` cannot be created or files cannot be written: abort with a clear, non-sensitive message and suggested manual checks (permissions/path).
- If guidelines scaffold write fails: continue after warning, but keep project-tech output if successful.

## Examples

```bash
/workflow:init
/workflow:init --regenerate
```

