---
name: convert-to-plan
description: Convert planning artifacts (lite-plan, workflow session, markdown) to issue solutions
argument-hint: "[-y|--yes] [--issue <id>] [--supplement] <SOURCE>"
allowed-tools: TodoWrite(*), Bash(*), Read(*), Write(*), Glob(*), AskUserQuestion(*)
group: issue
---

# Issue Convert-to-Plan Command (/issue:convert-to-plan)

## Overview

- Goal: Convert an existing planning artifact into a normalized issue Solution and bind it to an issue.
- Command: `/issue:convert-to-plan`

## Usage

```bash
/issue:convert-to-plan [-y|--yes] [--issue <id>] [--supplement] <SOURCE>
```

## Inputs

- Required inputs:
  - `<SOURCE>`: planning artifact path or a workflow session ID (`WFS-*`)
- Optional inputs:
  - `--issue <id>`: bind to an existing issue (otherwise auto-create)
  - `--supplement`: add tasks to an existing solution (requires `--issue`)
  - `-y, --yes`: skip confirmations (auto mode)

## Outputs / Artifacts

- Writes:
  - `.workflow/issues/solutions/<issue-id>.jsonl` (solution list for an issue; creates directory if needed)
- Reads:
  - `.workflow/.lite-plan/**/plan.json`
  - `.workflow/active/WFS-*/workflow-session.json`
  - `.workflow/active/WFS-*/IMPL_PLAN.md` (optional)
  - `.workflow/active/WFS-*/.task/IMPL-*.json`
  - `<SOURCE>.md` / `<SOURCE>.json`
  - `.claude/workflows/cli-templates/schemas/solution-schema.json` (target schema)

## Implementation Pointers

- Command doc: `.claude/commands/issue/convert-to-plan.md`
- Likely code locations:
  - `ccw/src/commands/issue.ts` (issue CLI: status/init/solution(s)/bind/update)
  - `ccw/src/core/routes/issue-routes.ts` (bind side effects)
  - `ccw/src/core/routes/commands-routes.ts` (command doc discovery/listing)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/issue/convert-to-plan.md` | Existing | docs: `.claude/commands/issue/convert-to-plan.md` / Overview ; ts: `ccw/src/core/routes/commands-routes.ts` / function scanCommandsRecursive( | `Test-Path .claude/commands/issue/convert-to-plan.md; rg \"function scanCommandsRecursive\" ccw/src/core/routes/commands-routes.ts` | command doc source (and how commands are discovered) |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/issue/convert-to-plan.md` / Overview ; ts: `ccw/src/core/routes/commands-routes.ts` / function scanCommandsRecursive( | `Test-Path ccw/src/core/routes/commands-routes.ts; rg \"function scanCommandsRecursive\" ccw/src/core/routes/commands-routes.ts` | server route that enumerates command docs |
| `ccw/src/commands/issue.ts` | Existing | docs: `.claude/commands/issue/convert-to-plan.md` / Core Data Access Principle ; ts: `ccw/src/commands/issue.ts` / async function bindAction( | `Test-Path ccw/src/commands/issue.ts; rg \"async function bindAction\" ccw/src/commands/issue.ts` | issue/solution CLI operations used by this command |
| `ccw/src/core/routes/issue-routes.ts` | Existing | docs: `.claude/commands/issue/convert-to-plan.md` / Core Data Access Principle ; ts: `ccw/src/core/routes/issue-routes.ts` / function bindSolutionToIssue( | `Test-Path ccw/src/core/routes/issue-routes.ts; rg \"function bindSolutionToIssue\" ccw/src/core/routes/issue-routes.ts` | binding behavior + status side effects |
| `.claude/workflows/cli-templates/schemas/solution-schema.json` | Existing | docs: `.claude/commands/issue/convert-to-plan.md` / Solution Schema Reference ; ts: `ccw/src/commands/issue.ts` / bound_solution_id | `Test-Path .claude/workflows/cli-templates/schemas/solution-schema.json; rg \"bound_solution_id\" ccw/src/commands/issue.ts` | target solution shape and required fields |
| `.workflow/issues/solutions` | Planned | docs: `.claude/commands/issue/convert-to-plan.md` / Phase 6: Confirm & Persist ; ts: `ccw/src/commands/issue.ts` / .workflow/issues/solutions | `Test-Path .workflow/issues/solutions; rg \"\\.workflow/issues/solutions\" ccw/src/commands/issue.ts` | runtime output directory (not committed) |
| `.workflow/issues/solutions/<issue-id>.jsonl` | Planned | docs: `.claude/commands/issue/convert-to-plan.md` / Phase 5: Generate Solution ; ts: `ccw/src/commands/issue.ts` / export function writeSolutions( | `rg \"export function writeSolutions\" ccw/src/commands/issue.ts` | persisted solutions per issue |

## Execution Process

### Phase 1: Parse Arguments & Detect Source Type

- Parse flags: `--issue`, `--supplement`, `-y/--yes`.
- Extract `<SOURCE>` (first non-flag token).
- Detect source type (priority order):
  - workflow session ID: `WFS-*` -> `.workflow/active/<id>/`
  - directory containing `.workflow/.lite-plan/*/plan.json`
  - markdown file: `*.md`
  - json file: `*.json`
- Validate flag constraints:
  - `--supplement` requires `--issue`

### Phase 2: Extract Data Using Format-Specific Extractor

- Extractor: Lite-Plan
  - Read `<SOURCE>/plan.json` (or resolved plan.json) and map to Solution fields.
- Extractor: Workflow Session
  - Read `workflow-session.json` and task JSONs from `.task/IMPL-*.json`.
  - Optionally read `IMPL_PLAN.md` for approach/strategy text.
- Extractor: Markdown (AI-Assisted via Gemini)
  - Read markdown file content and invoke a deterministic CLI wrapper (e.g. `ccw cli ... --tool gemini`) to return JSON matching solution schema.
  - Parse returned JSON (strip code fences if present).
- Extractor: JSON File
  - Parse JSON and normalize to the Solution schema (pass-through if already solution-shaped).

### Phase 3: Normalize Task IDs

- Normalize to `T1..Tn`.
- Map common patterns (e.g. `IMPL-001` -> `T1`) and preserve ordering.

### Phase 4: Resolve Issue (Create or Find)

- If `--issue <id>`:
  - Validate via CLI (e.g. `ccw issue status <id> --json`).
- Else:
  - Create/init a new issue via CLI (title/description derived from extracted data).

### Phase 5: Generate Solution

- Build the solution object:
  - `id`: `SOL-<issue-id>-<uid>` (or defer to CLI if it auto-generates)
  - `description`, `approach`, `tasks[]`, timestamps, binding metadata
- If `--supplement`:
  - Load existing solution(s) via CLI, merge/append tasks, and keep IDs normalized.

### Phase 6: Confirm & Persist

- If auto mode (`-y/--yes`): skip confirmation.
- Else:
  - Show a brief conversion summary (issue target + task count + first few task titles) and confirm.
- Persist:
  - Create solution via CLI (preferred):
    - `ccw issue solution <issue-id> --data '<solution-json>' --json` (capture returned `id`)
  - Bind solution via `ccw issue bind <issue-id> <solution-id>`
  - Set status to planned via `ccw issue update <issue-id> --status planned`

### Phase 7: Summary

- Print:
  - issue id
  - solution id
  - task count
  - suggested next commands (e.g. `/issue:queue`, `ccw issue solution <id> --brief`)

## Error Handling

- Invalid args:
  - missing `<SOURCE>`
  - `--supplement` without `--issue`
- Source not found / unsupported type
- Parse errors:
  - invalid JSON in plan/session/task files
  - markdown-to-json extractor returns non-JSON
- CLI failures:
  - issue not found (`--issue`)
  - bind/update failures (must report clearly; avoid partial writes where possible)
- Guardrails:
  - do not edit issue/solution store files directly for operations that have a CLI equivalent

## Examples

```bash
# Convert lite-plan to new issue (auto-creates issue)
/issue:convert-to-plan ".workflow/.lite-plan/implement-auth-2026-01-25"

# Convert workflow session to existing issue
/issue:convert-to-plan WFS-auth-impl --issue GH-123

# Supplement existing solution with additional tasks
/issue:convert-to-plan "./docs/additional-tasks.md" --issue ISS-001 --supplement

# Auto mode - skip confirmations
/issue:convert-to-plan ".workflow/.lite-plan/my-plan" -y
```
