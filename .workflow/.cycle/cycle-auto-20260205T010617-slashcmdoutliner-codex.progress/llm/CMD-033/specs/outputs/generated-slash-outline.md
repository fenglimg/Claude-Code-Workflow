---
name: collaborative-plan-with-file
description: Collaborative planning with Plan Note - Understanding agent creates shared plan-note.md template, parallel agents fill pre-allocated sections, conflict detection without merge. Outputs executable plan-note.md.
argument-hint: "[-y|--yes] <task description> [--max-agents=5]"
allowed-tools: TodoWrite(*), Task(*), AskUserQuestion(*), Read(*), Bash(*), Write(*), Glob(*), Grep(*), mcp__ace-tool__search_context(*)
group: workflow
---

# workflow:collaborative-plan-with-file

## Overview

- Goal: Produce a shared plan-note.md template, fill it in parallel via sub-agents (no merges), detect conflicts, and output an executable plan-note.md + plan.md.
- Command: `/workflow:collaborative-plan-with-file`

## Usage

```bash
/workflow:collaborative-plan-with-file "<task description>" [--max-agents=5] [-y|--yes]
```

## Inputs

- Required inputs:
  - Task description (string)
- Optional inputs:
  - `-y|--yes`: auto mode (skip confirmations / auto-approve split)
  - `--max-agents=N`: cap parallel agents (default 5)

## Outputs / Artifacts

- Writes:
  - `.workflow/.planning/{session-id}/plan-note.md`
  - `.workflow/.planning/{session-id}/requirement-analysis.json`
  - `.workflow/.planning/{session-id}/agents/{focus-area}/planning-context.md`
  - `.workflow/.planning/{session-id}/agents/{focus-area}/plan.json`
  - `.workflow/.planning/{session-id}/conflicts.json`
  - `.workflow/.planning/{session-id}/plan.md`
- Reads:
  - Repo docs (README/design/architecture guides)
  - `.workflow/.planning/{session-id}/requirement-analysis.json`
  - `.workflow/.planning/{session-id}/plan-note.md`

## Implementation Pointers

- Command doc: `.claude/commands/workflow/collaborative-plan-with-file.md`
- Likely code locations:
  - `.codex/prompts/collaborative-plan-with-file.md` (prompt mirror / execution template)
  - `ccw/src/tools/command-registry.ts` (parses .claude command metadata)
  - `ccw/src/core/routes/commands-routes.ts` (scans/toggles commands for server UI/API)

### Evidence (Existing vs Planned)

You MUST label each pointer as `Existing` (verifiable in repo now) or `Planned` (will be created/modified).

Rules:
- `Existing` MUST include evidence from BOTH:
  - a command doc source: `.claude/commands/**.md` (section heading is sufficient)
  - a TypeScript source: `ccw/src/**` (function name / subcommand case / a ripgrep-able string)
- If you cannot verify, downgrade to `Planned` and add a concrete `Verify` step (e.g. `Test-Path <path>`, `rg "<pattern>" <path>`).

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/collaborative-plan-with-file.md` | Existing | docs: `.claude/commands/workflow/collaborative-plan-with-file.md` / `Implementation` ; ts: `ccw/src/tools/command-registry.ts` / `export class CommandRegistry` | `Test-Path .claude/commands/workflow/collaborative-plan-with-file.md` | canonical command behavior + artifact contract |
| `.codex/prompts/collaborative-plan-with-file.md` | Existing | docs: `.claude/commands/workflow/collaborative-plan-with-file.md` / `Output Structure` ; ts: `ccw/src/commands/workflow.ts` / `.codex/prompts` | `Test-Path .codex/prompts/collaborative-plan-with-file.md` | codex prompt mirror for the workflow |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/collaborative-plan-with-file.md` / `Configuration` ; ts: `ccw/src/tools/command-registry.ts` / `const normalized = commandName.startsWith('/workflow:')` | `Test-Path ccw/src/tools/command-registry.ts` | command metadata parsing / listing |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/workflow/collaborative-plan-with-file.md` / `Error Handling` ; ts: `ccw/src/core/routes/commands-routes.ts` / `function parseCommandFrontmatter(content: string): CommandMetadata {` | `Test-Path ccw/src/core/routes/commands-routes.ts` | server-side command scanning + frontmatter parsing |

Notes:
- Expand likely code locations into one row per pointer (no aggregated cells).
- For TS evidence, prefer anchors like `function <name>` / `case '<subcommand>'` / a stable string literal that can be found via `rg`.

## Execution Process

1. Session initialization
   - Parse `$ARGUMENTS` for task description + `--max-agents` + auto mode (`-y|--yes`).
   - Create session folder: `.workflow/.planning/{session-id}/` with `agents/` subfolder.
2. Phase 1: Understanding & template creation (Understanding agent)
   - Analyze requirements and identify 2..maxAgents sub-domains.
   - Allocate non-overlapping TASK ID ranges per sub-domain.
   - Write:
     - `plan-note.md` template with pre-allocated sections
     - `requirement-analysis.json` (sub_domains + task_id_ranges)
3. Phase 2: Parallel sub-agent execution
   - For each sub-domain, run a planning sub-agent that writes:
     - `agents/{focus-area}/planning-context.md` (evidence + synthesized understanding)
     - `agents/{focus-area}/plan.json` (detailed plan)
   - Each sub-agent updates only its pre-allocated section in `plan-note.md`.
4. Phase 3: Conflict detection
   - Scan the unified `plan-note.md` for conflicts (overlapping files, incompatible strategies, dependency contradictions).
   - Write `conflicts.json` and update conflict markers in `plan-note.md`.
5. Phase 4: Completion
   - Generate `plan.md` (human-readable summary) and finalize `plan-note.md` status.

## Error Handling

- Missing/empty task description: ask for clarification (unless auto mode, then fail fast with a clear message).
- Invalid `--max-agents` (non-integer/out of range): default to 5 and record the fallback in `plan-note.md`.
- Sub-agent failure: mark the sub-domain section as incomplete; optionally re-run that sub-agent or proceed with reduced scope.
- File write/read failures: stop and report the exact path + failing step; avoid partial overwrite of `plan-note.md`.

## Examples

```bash
# Basic
/workflow:collaborative-plan-with-file "Implement real-time notification system"

# With options
/workflow:collaborative-plan-with-file "Refactor authentication module" --max-agents=4
/workflow:collaborative-plan-with-file "Add payment gateway support" -y
```

