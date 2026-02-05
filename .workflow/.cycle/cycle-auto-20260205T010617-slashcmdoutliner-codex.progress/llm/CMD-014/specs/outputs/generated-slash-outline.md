---
name: from-brainstorm
description: Convert brainstorm session ideas into issue with executable solution for parallel-dev-cycle
argument-hint: "SESSION=\"<session-id>\" [--idea=<index>] [--auto] [-y|--yes]"
allowed-tools: TodoWrite(*), Bash(*), Read(*), Write(*), Glob(*), AskUserQuestion(*)
group: issue
---

# Issue From-Brainstorm

## Overview

- Goal: Convert an existing brainstorm session into an issue + bound solution ready for parallel execution.
- Command: `/issue:from-brainstorm`

## Usage

```bash
/issue:from-brainstorm SESSION="BS-some-topic-YYYY-MM-DD"
/issue:from-brainstorm SESSION="BS-some-topic-YYYY-MM-DD" --idea=0
/issue:from-brainstorm SESSION="BS-some-topic-YYYY-MM-DD" --auto -y
```

## Inputs

- Required inputs:
  - `SESSION` (session id or path under `.workflow/.brainstorm/`)
- Optional inputs:
  - `--idea=<index>` (0-based)
  - `--auto` (auto-select highest-scored idea)
  - `-y|--yes` (skip confirmations)

## Outputs / Artifacts

- Writes:
  - `.workflow/issues/`
  - `.workflow/issues/issues.jsonl` (via `ccw issue` CLI)
  - `.workflow/issues/solutions/<issue-id>.jsonl`
- Reads:
  - `.workflow/.brainstorm/<session>/synthesis.json`
  - `.workflow/.brainstorm/<session>/perspectives.json` (optional)
  - `.workflow/.brainstorm/<session>/.brainstorming/**` (optional)

## Implementation Pointers

- Command doc: `.claude/commands/issue/from-brainstorm.md`
- Likely code locations:
  - `.claude/commands/issue/from-brainstorm.md`
  - `ccw/src/core/routes/commands-routes.ts`
  - `ccw/src/commands/issue.ts`

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/issue/from-brainstorm.md` | Existing | docs: `.claude/commands/issue/from-brainstorm.md` / `Overview` ; ts: `ccw/src/core/routes/commands-routes.ts` / `scanCommandsRecursive(projectDir, projectDir, 'project', projectPath);` | `Test-Path .claude/commands/issue/from-brainstorm.md` | authoritative command doc for the behavior |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/issue/from-brainstorm.md` / `Related Commands` ; ts: `ccw/src/core/routes/commands-routes.ts` / `export async function handleCommandsRoutes(ctx: RouteContext): Promise<boolean> {` | `Test-Path ccw/src/core/routes/commands-routes.ts` | command discovery + enable/disable routes |
| `ccw/src/commands/issue.ts` | Existing | docs: `.claude/commands/issue/from-brainstorm.md` / `CLI Integration` ; ts: `ccw/src/commands/issue.ts` / `export async function issueCommand(` | `Test-Path ccw/src/commands/issue.ts` | CLI endpoints used by the command (create/bind/update) |
| `.workflow/.brainstorm` | Existing | docs: `.claude/commands/issue/from-brainstorm.md` / `Session Files Reference` ; ts: `ccw/src/commands/issue.ts` / `getIssuesDir()` | `Test-Path .workflow/.brainstorm` | base location for brainstorm sessions |
| `.workflow/.brainstorm/BS-{slug}-{date}/synthesis.json` | Planned | docs: `.claude/commands/issue/from-brainstorm.md` / `Input Files` ; ts: `ccw/src/commands/issue.ts` / `case 'create':` | `Test-Path .workflow/.brainstorm/<session>/synthesis.json` | required input containing top ideas and scores |
| `.workflow/issues` | Planned | docs: `.claude/commands/issue/from-brainstorm.md` / `Output Files` ; ts: `ccw/src/commands/issue.ts` / `.workflow/issues/issues.jsonl` | `Test-Path .workflow/issues` | issue storage root created/managed as part of issue lifecycle |
| `.workflow/issues/issues.jsonl` | Planned | docs: `.claude/commands/issue/from-brainstorm.md` / `Output Files` ; ts: `ccw/src/commands/issue.ts` / `.workflow/issues/issues.jsonl` | `Test-Path .workflow/issues/issues.jsonl` | active issues store (written via CLI) |
| `.workflow/issues/solutions/ISS-YYYYMMDD-001.jsonl` | Planned | docs: `.claude/commands/issue/from-brainstorm.md` / `Output Files` ; ts: `ccw/src/commands/issue.ts` / `.workflow/issues/solutions/*.jsonl` | `Test-Path .workflow/issues/solutions/<issue-id>.jsonl` | per-issue solution storage (JSONL) |

## Execution Process

1) Resolve session:
   - Accept `SESSION` as id (`BS-...`) or a path under `.workflow/.brainstorm/`.
   - Locate `synthesis.json` (required) and optionally `perspectives.json` and `.brainstorming/**`.
2) Load ideas from `synthesis.json` and render a ranked table (title, score, feasibility).
3) Select idea:
   - Interactive: Ask user to choose an index and confirm.
   - `--idea=<index>`: preselect and confirm unless `-y|--yes`.
   - `--auto`: choose highest-scored; if `-y|--yes` skip confirmations.
4) Enrich context:
   - Always include the selected idea + `synthesis.json` summary.
   - If present, merge in `perspectives.json` and `.brainstorming/**` clarifications.
5) Create issue via CLI:
   - Use heredoc/pipe JSON into `ccw issue create`.
6) Generate solution:
   - Create tasks aligned to parallel-dev-cycle (research/design/implementation/fallback).
   - Append solution to `.workflow/issues/solutions/<issue-id>.jsonl`.
7) Bind + update:
   - `ccw issue bind <issue-id> <solution-id>`
   - `ccw issue update <issue-id> --status planned`
8) Print result summary and recommend next: `/issue:queue`.

## Error Handling

- Session not found / missing `synthesis.json`: show expected session root, suggest listing sessions under `.workflow/.brainstorm/`.
- No ideas: explain `top_ideas` is empty; suggest re-running upstream brainstorm flow.
- Invalid `--idea` index: show valid range and re-prompt (unless `--auto`).
- CLI failures (`ccw issue create|bind|update`): surface stderr (sanitized) and stop; do not partially claim success.
- Write failures for solution JSONL: stop and instruct to verify `.workflow/issues/` permissions and paths.

## Examples

```bash
# Interactive
/issue:from-brainstorm SESSION="BS-rate-limiting-2025-01-28"

# Auto mode (no confirmations)
/issue:from-brainstorm SESSION="BS-caching-2025-01-28" --auto -y
```

