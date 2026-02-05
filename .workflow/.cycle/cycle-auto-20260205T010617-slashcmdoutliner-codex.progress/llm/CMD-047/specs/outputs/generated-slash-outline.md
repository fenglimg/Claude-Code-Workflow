---
name: review-session-cycle
description: Session-based comprehensive multi-dimensional code review. Analyzes git changes from workflow session across 7 dimensions with hybrid parallel-iterative execution, aggregates findings, and performs focused deep-dives on critical issues until quality gates met.
argument-hint: "[session-id] [--dimensions=security,architecture,...] [--max-iterations=N]"
allowed-tools: Skill(*), TodoWrite(*), Read(*), Bash(*), Task(*)
group: workflow
---

# Workflow Review-Session-Cycle Command

## Overview

- Goal: Review git changes within a workflow session across 7 dimensions, aggregate severity/cross-cutting concerns, and optionally deep-dive critical findings up to a max iteration limit.
- Command: `/workflow:review-session-cycle`

## Usage

```bash
/workflow:review-session-cycle [session-id] [--dimensions=security,architecture,...] [--max-iterations=N]
```

## Inputs

- Required inputs:
  - Workflow session context (active session in `.workflow/active/` or an explicit `session-id`)
- Optional inputs:
  - `session-id` (defaults to active session when unambiguous)
  - `--dimensions=<csv>` (subset of the 7 supported dimensions)
  - `--max-iterations=<N>` (default 3; `0` skips deep-dive phase)

## Outputs / Artifacts

- Writes:
  - `.workflow/active/WFS-{session-id}/.review/review-state.json`
  - `.workflow/active/WFS-{session-id}/.review/review-progress.json`
  - `.workflow/active/WFS-{session-id}/.review/dimensions/{dimension}.json`
  - `.workflow/active/WFS-{session-id}/.review/iterations/iteration-{N}-finding-{uuid}.json`
  - `.workflow/active/WFS-{session-id}/.review/reports/*`
- Reads:
  - `.workflow/active/WFS-{session-id}/workflow-session.json`
  - `.workflow/active/WFS-{session-id}/TODO_LIST.md`
  - git history since session creation (via Bash `git log --since=...`)

## Implementation Pointers

- Command doc: `.claude/commands/workflow/review-session-cycle.md`
- Likely code locations:
  - `ccw/src/core/routes/commands-routes.ts` (command doc discovery + metadata for dashboard)
  - `ccw/src/commands/session-path-resolver.ts` (path inference for `.review/*` artifacts)
  - `ccw/src/commands/session.ts` (session tool adapter used by dashboard/CLI workflows)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/review-session-cycle.md` | Existing | docs: `.claude/commands/workflow/review-session-cycle.md` / Quick Start ; ts: `ccw/src/core/routes/commands-routes.ts` / function getCommandsDir( | `Test-Path .claude/commands/workflow/review-session-cycle.md ; rg "function getCommandsDir\\(" ccw/src/core/routes/commands-routes.ts` | Slash command doc source |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/workflow/review-session-cycle.md` / Workflow Review-Session-Cycle Command ; ts: `ccw/src/core/routes/commands-routes.ts` / function parseCommandFrontmatter | `Test-Path ccw/src/core/routes/commands-routes.ts ; rg "function parseCommandFrontmatter" ccw/src/core/routes/commands-routes.ts` | Reads frontmatter and lists commands/groups |
| `ccw/src/commands/session-path-resolver.ts` | Existing | docs: `.claude/commands/workflow/review-session-cycle.md` / Session File Structure ; ts: `ccw/src/commands/session-path-resolver.ts` / .review/dimensions/ | `Test-Path ccw/src/commands/session-path-resolver.ts ; rg \"\\.review/dimensions/\" ccw/src/commands/session-path-resolver.ts` | Provides `.review/*` path inference support |
| `ccw/src/commands/session.ts` | Existing | docs: `.claude/commands/workflow/review-session-cycle.md` / Review Progress JSON ; ts: `ccw/src/commands/session.ts` / executeTool('session_manager' | `Test-Path ccw/src/commands/session.ts ; rg \"executeTool\\('session_manager'\" ccw/src/commands/session.ts` | CCW session lifecycle + read/write operations via tool adapter |
| `.workflow/active/WFS-{session-id}/.review/` | Planned | docs: `.claude/commands/workflow/review-session-cycle.md` / Session File Structure ; ts: `ccw/src/commands/session-path-resolver.ts` / .review/iterations/ | `Test-Path .workflow/active/WFS-{session-id}/.review/ (after running the command)` | Output root for all review artifacts |
| `.workflow/active/WFS-{session-id}/.review/review-state.json` | Planned | docs: `.claude/commands/workflow/review-session-cycle.md` / Review State JSON ; ts: `ccw/src/commands/session-path-resolver.ts` / PATH_PREFIX_TO_CONTENT_TYPE | `Test-Path .workflow/active/WFS-{session-id}/.review/review-state.json (after running the command)` | Single source of truth for orchestrator state + metadata |
| `.workflow/active/WFS-{session-id}/.review/review-progress.json` | Planned | docs: `.claude/commands/workflow/review-session-cycle.md` / Review Progress JSON ; ts: `ccw/src/commands/session-path-resolver.ts` / PATH_PREFIX_TO_CONTENT_TYPE | `Test-Path .workflow/active/WFS-{session-id}/.review/review-progress.json (after running the command)` | Dashboard/polling progress feed |
| `.workflow/active/WFS-{session-id}/.review/dimensions/{dimension}.json` | Planned | docs: `.claude/commands/workflow/review-session-cycle.md` / Session File Structure ; ts: `ccw/src/commands/session-path-resolver.ts` / function extractReviewDimension | `Test-Path .workflow/active/WFS-{session-id}/.review/dimensions/ (after running the command)` | Per-dimension findings contract for aggregation + downstream fix workflow |
| `.workflow/active/WFS-{session-id}/.review/iterations/iteration-{N}-finding-{uuid}.json` | Planned | docs: `.claude/commands/workflow/review-session-cycle.md` / Session File Structure ; ts: `ccw/src/commands/session-path-resolver.ts` / function extractReviewIteration | `Test-Path .workflow/active/WFS-{session-id}/.review/iterations/ (after running the command)` | Deep-dive analysis results (root cause + remediation plan) |

## Execution Process

1. Discovery & initialization
   - Resolve session directory (active session or explicit `session-id`)
   - Determine session start time for git scope
   - Create `.review/` output structure and initialize `review-state.json` + `review-progress.json`
2. Parallel reviews (per dimension)
   - For each selected dimension: run a dimension review agent via Deep Scan mode
   - Produce `{dimension}.json` findings and a paired report artifact
3. Aggregation
   - Merge dimension findings into a unified severity distribution
   - Identify cross-cutting concerns (same files across multiple dimensions)
   - Decide whether deep-dive is required based on thresholds
4. Iterative deep-dive (optional)
   - Select up to a small cap of critical findings per iteration (e.g. max 5)
   - Produce deep-dive result artifacts and re-assess severity
   - Loop until completion criteria met or `--max-iterations` reached
5. Completion
   - Finalize progress/state files and write a human-readable completion summary in `reports/`

## Error Handling

- Session not found / ambiguous active sessions: fail fast with clear action (specify `session-id`).
- No changed files within session scope: fail fast (nothing to review).
- Single dimension failure: record error for that dimension, continue other dimensions.
- All dimensions fail: fail fast (no usable signal).
- Deep-dive agent failure: skip the failed finding, continue remaining selected findings.

## Examples

```bash
# Comprehensive session review (all 7 dimensions)
/workflow:review-session-cycle

# Custom dimensions
/workflow:review-session-cycle WFS-payment-integration --dimensions=security,architecture,quality

# Increase iteration budget (or set 0 to skip deep-dive)
/workflow:review-session-cycle WFS-payment-integration --max-iterations=5
```

