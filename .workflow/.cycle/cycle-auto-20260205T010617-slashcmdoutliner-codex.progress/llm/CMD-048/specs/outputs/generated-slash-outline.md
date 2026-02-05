---
name: review
description: Post-implementation review with specialized types (security/architecture/action-items/quality) using analysis agents and Gemini
argument-hint: "[--type=security|architecture|action-items|quality] [--archived] [optional: session-id]"
allowed-tools: Skill(*), TodoWrite(*), Read(*), Bash(*), Task(*)
group: workflow
---

# Workflow Review (/workflow:review)

## Overview

- Goal: Generate a specialized review report for a completed workflow session (default: quality).
- Command: `/workflow:review`
- Philosophy: Passing tests is the default approval signal; use this only for specialized review needs.

## Usage

```bash
/workflow:review [--type=security|architecture|action-items|quality] [--archived] [session-id]
```

## Inputs

- Required inputs:
  - None (auto-detect session when possible)
- Optional inputs:
  - `session-id` (preferred when multiple sessions exist)
  - `--archived` (search `.workflow/archives/` with highest priority)
  - `--type=<review-type>` (default: `quality`)

## Outputs / Artifacts

- Writes:
  - `<sessionPath>/REVIEW-<type>.md`
- Reads:
  - `.workflow/active/`
  - `.workflow/archives/`
  - `<sessionPath>/.summaries/IMPL-*.md` (used to confirm completion + seed review context)

## Review Types

| Type | Focus | Primary Output |
|---|---|---|
| `quality` | Code quality, best practices, maintainability | actionable findings + suggested fixes |
| `security` | vuln patterns, data handling, auth/authz | findings with severity + mitigations |
| `architecture` | patterns, technical debt, design decisions | design compliance + refactor options |
| `action-items` | requirements met + acceptance criteria verification | checklist + missing items |

Notes:
- If a documentation-specific review is requested, redirect to a dedicated docs workflow command (see planned pointer).

## Implementation Pointers

- Command doc: `.claude/commands/workflow/review.md`
- Likely code locations:
  - `ccw/src/tools/command-registry.ts` (parses command frontmatter + allowed-tools)
  - `ccw/src/commands/cli.ts` (CLI executor used by the review templates)
  - `ccw/src/core/websocket.ts` (session-id extraction helper that can inform session resolution patterns)

### Evidence (Existing vs Planned)

You MUST label each pointer as `Existing` (verifiable in repo now) or `Planned` (will be created/modified).

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/review.md` | Existing | docs: `.claude/commands/workflow/review.md` / `Command Overview: /workflow:review` ; ts: `ccw/src/tools/command-registry.ts` / `commandName.startsWith('/workflow:')` | `Test-Path .claude/commands/workflow/review.md` | Primary command doc (oracle) |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/review.md` / `Execution Process` ; ts: `ccw/src/tools/command-registry.ts` / `commandName.startsWith('/workflow:')` | `Test-Path ccw/src/tools/command-registry.ts` | Loads command metadata (argument-hint, allowed-tools, group) |
| `ccw/src/commands/cli.ts` | Existing | docs: `.claude/commands/workflow/review.md` / `Execution Template` ; ts: `ccw/src/commands/cli.ts` / `ccw cli -p "<prompt>" --tool <tool>` | `Test-Path ccw/src/commands/cli.ts` | Implements `ccw cli` usage referenced by the review templates |
| `ccw/src/core/websocket.ts` | Existing | docs: `.claude/commands/workflow/review.md` / `Execution Process` ; ts: `ccw/src/core/websocket.ts` / `export function extractSessionIdFromPath(filePath: string): string | null {` | `Test-Path ccw/src/core/websocket.ts` | Reusable helper for session-id inference from paths/logs |
| `.claude/commands/workflow/tools/docs.md` | Planned | docs: `.claude/commands/workflow/review.md` / `Execution Process` ; ts: `ccw/src/tools/command-registry.ts` / `commandName.startsWith('/workflow:')` | `Test-Path .claude/commands/workflow/tools/docs.md` | Dedicated documentation workflow command referenced as redirect target |

## Execution Process

1. Parse inputs
   - `--type` (default: `quality`)
   - `--archived` (prefer archives when set)
   - optional `session-id`
2. Resolve session
   - Priority: `--archived` flag -> active -> archives
   - If `session-id` not provided: auto-detect from `.workflow/active/` (and/or infer from current path)
3. Validate preconditions
   - session folder exists
   - completed implementation exists: `<sessionPath>/.summaries/IMPL-*.md`
4. Type check + redirect
   - For docs-only review: redirect to `/workflow:tools:docs` (planned)
5. Analysis handover (model-led)
   - `BASH_EXECUTION_STOPS -> MODEL_ANALYSIS_BEGINS`
   - Load context (summaries, test results, changed files) and run specialized review by type
6. Write report
   - Output file: `<sessionPath>/REVIEW-<type>.md`

## Error Handling

- Session not found (active/archives): fail fast with a clear message and suggested next command (e.g. list/resume).
- No completed implementation in session: exit and instruct to complete implementation first.
- Invalid `--type`: print allowed values and default behavior.
- External tool failure (e.g. CLI tool unavailable): degrade to local-only review (rg + summaries) and note limitations in report.

## Examples

```bash
# General quality review after implementation
/workflow:review

# Security audit before deployment
/workflow:review --type=security

# Architecture review for a specific session
/workflow:review --type=architecture WFS-some-session-id

# Review an archived session (auto-detects if not in active)
/workflow:review --archived WFS-some-session-id
```
