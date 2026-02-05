---
name: review-module-cycle
description: Independent multi-dimensional code review for specified modules/files. Analyzes specific code paths across 7 dimensions with hybrid parallel-iterative execution, independent of workflow sessions.
argument-hint: "<path-pattern> [--dimensions=security,architecture,...] [--max-iterations=N]"
allowed-tools: Skill(*), TodoWrite(*), Read(*), Bash(*), Task(*)
group: workflow
---

# Workflow Review-Module-Cycle Command

## Overview

- Goal: Review specific modules/files across multiple quality dimensions and produce structured findings/progress artifacts for follow-up fixes.
- Command: `/workflow:review-module-cycle`

## Usage

```bash
/workflow:review-module-cycle <path-pattern> [--dimensions=security,architecture,...] [--max-iterations=N]
```

## Inputs

- Required inputs:
  - `<path-pattern>`: Glob(s) or explicit file list (resolved relative to project root) identifying what to review.
- Optional inputs:
  - `--dimensions=<csv>`: Dimension subset (default is the standard 7 dimensions).
  - `--max-iterations=<N>`: Upper bound for deep-dive iterations (default 3).

## Outputs / Artifacts

- Writes:
  - `.workflow/active/WFS-{session-id}/.review/review-state.json`
  - `.workflow/active/WFS-{session-id}/.review/review-progress.json`
  - `.workflow/active/WFS-{session-id}/.review/dimensions/{dimension}.json`
  - `.workflow/active/WFS-{session-id}/.review/reports/{dimension}.md`
  - `.workflow/active/WFS-{session-id}/.review/iterations/{iteration}.json`
- Reads:
  - Target files resolved from `<path-pattern>`
  - Session context under `.workflow/active/WFS-*/` (if used/created)

## Implementation Pointers

- Command doc: `.claude/commands/workflow/review-module-cycle.md`
- Likely code locations:
  - `ccw/src/tools/command-registry.ts` (loads/normalizes `/workflow:*` command docs)
  - `ccw/src/tools/session-manager.ts` (session base paths + review path templates)
  - `ccw/src/core/data-aggregator.ts` (loads `review-state.json` / `review-progress.json`)
  - `ccw/src/commands/session-path-resolver.ts` (resolves `.review/*` file categories)
  - Runtime outputs under `.workflow/active/WFS-{session-id}/.review/`

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/review-module-cycle.md` | Existing | docs: `.claude/commands/workflow/review-module-cycle.md` / Workflow Review-Module-Cycle Command ; ts: `ccw/src/tools/command-registry.ts` / commandName.startsWith('/workflow:') | `Test-Path .claude/commands/workflow/review-module-cycle.md` | Canonical slash command doc (oracle) |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/review-module-cycle.md` / Quick Start ; ts: `ccw/src/tools/command-registry.ts` / commandName.startsWith('/workflow:') | `Test-Path ccw/src/tools/command-registry.ts` | Registry logic that discovers workflow command markdown |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/review-module-cycle.md` / Expand glob pattern to file list (relative paths from project root) ; ts: `ccw/src/tools/session-manager.ts` / const ACTIVE_BASE = '.workflow/active'; | `Test-Path ccw/src/tools/session-manager.ts` | Session folder conventions and review path templates |
| `ccw/src/core/data-aggregator.ts` | Existing | docs: `.claude/commands/workflow/review-module-cycle.md` / 3. Aggregation Logic ; ts: `ccw/src/core/data-aggregator.ts` / review-progress.json | `Test-Path ccw/src/core/data-aggregator.ts` | Loads/aggregates review state/progress artifacts |
| `ccw/src/commands/session-path-resolver.ts` | Existing | docs: `.claude/commands/workflow/review-module-cycle.md` / Output File Structure ; ts: `ccw/src/commands/session-path-resolver.ts` / .review/dimensions/ | `Test-Path ccw/src/commands/session-path-resolver.ts` | Resolves `.review/*` files into semantic categories |
| `.workflow/active/WFS-{session-id}/.review/review-progress.json` | Planned | docs: `.claude/commands/workflow/review-module-cycle.md` / Review Progress JSON ; ts: `ccw/src/core/data-aggregator.ts` / review-progress.json | `Test-Path .workflow/active/WFS-*/.review/review-progress.json` | Real-time progress for dashboard/automation |
| `.workflow/active/WFS-{session-id}/.review/review-state.json` | Planned | docs: `.claude/commands/workflow/review-module-cycle.md` / Review State JSON ; ts: `ccw/src/core/data-aggregator.ts` / review-state.json | `Test-Path .workflow/active/WFS-*/.review/review-state.json` | Orchestrator state machine + summary |
| `.workflow/active/WFS-{session-id}/.review/dimensions/` | Planned | docs: `.claude/commands/workflow/review-module-cycle.md` / Output File Structure ; ts: `ccw/src/tools/session-manager.ts` / .review/dimensions/ | `Test-Path .workflow/active/WFS-*/.review/dimensions` | Per-dimension results (inputs to aggregation and fixes) |

## Execution Process

1. Parse arguments: `<path-pattern>`, `--dimensions`, `--max-iterations`.
2. Resolve `<path-pattern>` into a concrete, de-duplicated file list (relative paths from repo root).
3. Validate inputs: file list non-empty; all paths exist and are readable.
4. Ensure review session context (create or reuse as per workflow conventions).
5. Initialize review output folder structure under `.workflow/active/WFS-{session-id}/.review/`.
6. Launch per-dimension review agents in parallel (one per dimension):
   - Provide target file list + dimension guidance
   - Produce `{dimension}.json` + `{dimension}.md` report
   - Update `review-progress.json`
7. Aggregate findings into `review-state.json`:
   - Compute severity counts
   - Identify cross-cutting concerns
   - Select deep-dive candidates (if enabled)
8. Iterate deep-dive until converged or max iterations reached.
9. Write final summary + TodoWrite entries (actionable next steps and fix workflow handoff).

## Error Handling

- Invalid `<path-pattern>` or resolves to zero files: fail fast with actionable message and example patterns.
- Missing/unreadable files: list first N failures; suggest narrowing pattern or fixing permissions.
- Dimension agent failure (timeout / CLI error / invalid JSON): mark dimension as failed in `review-progress.json` and continue aggregation with partial results (unless configured to hard-fail).
- Aggregation failure: keep raw dimension artifacts; emit a clear remediation message and suggested retry.

## Examples

```bash
# Review specific module (all 7 dimensions)
/workflow:review-module-cycle src/auth/**

# Review multiple modules
/workflow:review-module-cycle src/auth/**,src/payment/**

# Review with custom dimensions
/workflow:review-module-cycle src/payment/** --dimensions=security,architecture,quality

# Review specific files
/workflow:review-module-cycle src/payment/processor.ts,src/payment/validator.ts
```

