---
name: new
description: Create structured issue from GitHub URL or text description
argument-hint: "[-y|--yes] <github-url | text-description> [--priority 1-5]"
allowed-tools: TodoWrite(*), Bash(*), Read(*), AskUserQuestion(*), mcp__ace-tool__search_context(*)
group: issue
---

# Issue New Command (/issue:new)

## Overview

- Goal: Create a local structured issue record from either a GitHub issue URL (or short ref) or a free-text description; optionally publish to GitHub and bind the local issue to the GitHub issue.
- Command: `/issue:new`

## Usage

```bash
/issue:new [-y|--yes] <github-url | text-description> [--priority 1-5]
```

## Inputs

- Required inputs:
  - One of:
    - GitHub issue URL (or short ref like `#123` when the repo context is clear), OR
    - Text description of the problem
- Optional inputs:
  - `-y` / `--yes`: auto mode; skip clarification questions and proceed with inferred fields
  - `--priority 1-5`: override inferred priority (1 = critical, 5 = low)

## Outputs / Artifacts

- Writes:
  - `.workflow/issues/issues.jsonl` (active issues; local issue record created via `ccw issue create`)
  - Optional update to the same store to persist GitHub binding (`ccw issue update`)
- Reads:
  - `.workflow/issues/issues.jsonl` (to compute next `ISS-YYYYMMDD-NNN` for local issues)

## Implementation Pointers

- Command doc: `.claude/commands/issue/new.md`
- Likely code locations:
  - `.codex/prompts/issue-new.md` (execution prompt / flow details)
  - `ccw/src/commands/issue.ts` (CLI endpoints for local issue create/update; JSONL storage)
  - `.workflow/issues/issues.jsonl` (runtime store written by CLI)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/issue/new.md` | Existing | docs: `.claude/commands/issue/new.md` / `Quick Reference` ; ts: `ccw/src/commands/issue.ts` / `Usage: ccw issue create --data '{"title":"...", "context":"..."}'` | `Test-Path .claude/commands/issue/new.md` | Source command doc for user-facing behavior |
| `.codex/prompts/issue-new.md` | Existing | docs: `.claude/commands/issue/new.md` / `Implementation` ; ts: `ccw/src/commands/issue.ts` / `echo '{"title":"..."}' | ccw issue create` | `Test-Path .codex/prompts/issue-new.md` | Prompt implementation details used by the agent |
| `ccw/src/commands/issue.ts` | Existing | docs: `.claude/commands/issue/new.md` / `Phase 6: Create Issue` ; ts: `ccw/src/commands/issue.ts` / `async function createAction(options: IssueOptions): Promise<void> {` | `Test-Path ccw/src/commands/issue.ts` | Defines `ccw issue create/update` and issue JSONL storage |
| `ccw issue create` | Existing | docs: `.claude/commands/issue/new.md` / `Phase 6: Create Issue` ; ts: `ccw/src/commands/issue.ts` / `Usage: ccw issue create --data '{"title":"...", "context":"..."}'` | `rg \"Usage: ccw issue create\" ccw/src/commands/issue.ts` | CLI endpoint used to create the local issue record (supports stdin pipe) |
| `ccw issue update` | Existing | docs: `.claude/commands/issue/new.md` / `Phase 5: GitHub Publishing Decision (Non-GitHub Sources)` ; ts: `ccw/src/commands/issue.ts` / `Usage: ccw issue update <issue-id> --status <status>` | `rg \"Usage: ccw issue update\" ccw/src/commands/issue.ts` | CLI endpoint used to persist GitHub binding after publishing |
| `.workflow/issues/issues.jsonl` | Planned | docs: `.claude/commands/issue/new.md` / `Phase 6: Create Issue` ; ts: `ccw/src/commands/issue.ts` / `.workflow/issues/issues.jsonl         Active issues` | `Test-Path .workflow/issues/issues.jsonl` | Runtime store for active issues (created/updated by CLI) |

## Execution Process

1. Phase 1: Input analysis + clarity detection
   - Detect GitHub URL / short ref vs free text
   - Decide whether input is clear enough to create without questions
2. Phase 2: Data extraction (GitHub or text)
   - GitHub: fetch issue fields via `gh issue view ... --json ...`
   - Text: parse minimal structure (title/context; optional expected/actual, steps, affected components)
3. Phase 3: Lightweight context hint (conditional)
   - If helpful, use `mcp__ace-tool__search_context` for light hints (avoid heavy repo scans)
4. Phase 4: Conditional clarification (only if unclear)
   - Ask the minimum number of questions needed to reach a usable issue record
   - Skip entirely in auto mode (`-y/--yes`)
5. Phase 5: GitHub publishing decision (non-GitHub sources)
   - If the source is not GitHub, ask whether to publish to GitHub
   - If yes: `gh issue create ...` then bind local issue to GitHub via `ccw issue update`
6. Phase 6: Create issue
   - Build the issue JSON payload
   - Create via `ccw issue create` (prefer stdin pipe or heredoc for complex JSON)
   - Print created issue JSON and a next-step hint (e.g. `/issue:plan <id>`)

## Error Handling

- Invalid or empty input: ask user for a clearer description (unless auto mode, then fail with an actionable message).
- GitHub fetch/publish failure: report `gh` error output and continue with local-only creation when possible.
- CLI failure (`ccw issue create/update`): surface stderr, do not claim issue was created/updated.
- JSON parsing/escaping issues: recommend pipe input or heredoc and re-run.

## Examples

```bash
# Clear inputs - direct creation
/issue:new https://github.com/owner/repo/issues/123
/issue:new \"Login fails with special chars. Expected: success. Actual: 500 error\"

# Vague input - will ask clarifying questions
/issue:new \"something wrong with auth\"

# Auto mode - skip questions
/issue:new -y \"Login sometimes fails\" --priority 2
```

