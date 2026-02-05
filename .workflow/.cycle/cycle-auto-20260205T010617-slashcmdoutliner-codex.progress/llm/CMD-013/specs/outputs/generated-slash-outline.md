---
name: execute
description: Execute queue with DAG-based parallel orchestration (one commit per solution)
argument-hint: "[-y|--yes] --queue <queue-id> [--worktree [<existing-path>]]"
allowed-tools: TodoWrite(*), Bash(*), Read(*), AskUserQuestion(*)
group: issue
---

# issue:execute

## Overview

- Goal: Execute an issue queue by querying its solution-level DAG, dispatching ready solutions to executors in parallel batches, and committing once per solution.
- Command: `/issue:execute`

## Usage

```bash
/issue:execute --queue <queue-id> [--worktree [<existing-path>]] [-y|--yes]
```

## Inputs

- Required inputs:
  - `--queue <queue-id>` (MANDATORY; if omitted, prompt user to select from `ccw issue queue list --brief --json`)
- Optional inputs:
  - `--worktree` (create one queue-scoped worktree)
  - `--worktree <existing-path>` (resume in an existing queue worktree)
  - `-y|--yes` (auto-confirm recommended choices)

## Outputs / Artifacts

- Writes:
  - `git commit` (exactly once per solution)
  - `.ccw/worktrees/queue-exec-<queue-id>/` (optional, when `--worktree`)
  - `.workflow/issues/queues/<queue-id>.json` (queue progress, via `ccw issue done <item-id>`)
- Reads:
  - `ccw issue queue list --brief --json`
  - `ccw issue queue dag --queue <queue-id>`
  - `ccw issue detail <item-id>`

## Implementation Pointers

- Command doc: `.claude/commands/issue/execute.md`
- Likely code locations:
  - `ccw/src/commands/issue.ts` (CLI endpoints: `issue queue dag`, `issue detail`, `issue done`)
  - `.codex/prompts/issue-execute.md` (orchestrator / executor prompt scaffold)
  - `ccw/src/core/routes/issue-routes.ts` (issue detail route used by CLI)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/issue/execute.md` | Existing | docs: .claude/commands/issue/execute.md / Overview ; ts: ccw/src/commands/issue.ts / case 'detail': | `Test-Path .claude/commands/issue/execute.md` | canonical slash command doc (oracle) |
| `ccw/src/commands/issue.ts` | Existing | docs: .claude/commands/issue/execute.md / CLI Endpoint Contract ; ts: ccw/src/commands/issue.ts / if (subAction === 'dag') { | `Test-Path ccw/src/commands/issue.ts; rg "if (subAction === 'dag') {" ccw/src/commands/issue.ts` | implements queue DAG + detail/done used by orchestration |
| `.codex/prompts/issue-execute.md` | Existing | docs: .claude/commands/issue/execute.md / Execution Flow ; ts: ccw/src/commands/issue.ts / case 'done': | `Test-Path .codex/prompts/issue-execute.md` | prompt-level orchestration reference for queue execution |
| `ccw issue queue list --brief --json` | Existing | docs: .claude/commands/issue/execute.md / `ccw issue queue list --brief --json` ; ts: ccw/src/commands/issue.ts / subAction === 'list' | `rg "subAction === 'list'" ccw/src/commands/issue.ts` | queue selection + validation input |
| `ccw issue queue dag --queue <queue-id>` | Existing | docs: .claude/commands/issue/execute.md / `ccw issue queue dag --queue <queue-id>` ; ts: ccw/src/commands/issue.ts / if (subAction === 'dag') { | `rg "if (subAction === 'dag') {" ccw/src/commands/issue.ts` | defines DAG-driven parallel batches (solution-level) |
| `ccw issue detail <item-id>` | Existing | docs: .claude/commands/issue/execute.md / `ccw issue detail <item_id>` ; ts: ccw/src/commands/issue.ts / case 'detail': | `rg "case 'detail':" ccw/src/commands/issue.ts` | executor fetches read-only solution/task details |
| `ccw issue done <item-id>` | Existing | docs: .claude/commands/issue/execute.md / `ccw issue done <item_id>` ; ts: ccw/src/commands/issue.ts / case 'done': | `rg "case 'done':" ccw/src/commands/issue.ts` | marks solution/task completion and advances queue progress |
| `.workflow/issues/queues/index.json` | Planned | docs: .claude/commands/issue/queue.md / Storage Structure (Queue History) ; ts: ccw/src/commands/issue.ts / const ISSUES_DIR = '.workflow/issues'; | `Test-Path .workflow/issues/queues/index.json` | runtime queue index (created by issue queue operations) |
| `.workflow/issues/queues/<queue-id>.json` | Planned | docs: .claude/commands/issue/queue.md / Storage Structure (Queue History) ; ts: ccw/src/commands/issue.ts / return join(getIssuesDir(), 'queues'); | `Test-Path .workflow/issues/queues` | runtime queue state file backing `ccw issue queue dag` |
| `.ccw/worktrees/queue-exec-<queue-id>` | Planned | docs: .claude/commands/issue/execute.md / Phase 4: Worktree Completion (after ALL batches) ; ts: ccw/src/commands/issue.ts / case 'queue': | `git worktree list` | optional isolation for whole-queue execution |

## Execution Process

1. Phase 0: Validate queue ID
   - Require `--queue <queue-id>`.
   - If missing, list active queues (`ccw issue queue list --brief --json`) and prompt user selection (never auto-select unless `--yes`).
2. Phase 1: Get DAG & user selection
   - Fetch DAG (`ccw issue queue dag --queue <queue-id>`), show summary.
   - Prompt for executor type + dry-run vs execute + worktree mode (auto-confirm when `--yes`).
3. Phase 0.5 (optional): Queue worktree
   - If `--worktree`, create or reuse a single worktree for the entire queue execution.
4. Phase 2: Dispatch ready batch (parallel)
   - For each ready solution ID in the batch, dispatch execution in parallel.
   - Use TodoWrite to track per-solution progress.
5. Execute Solution: `${SOLUTION_ID}` (per solution)
   - Get details (`ccw issue detail <item-id>`).
   - Execute all tasks sequentially; test/validate.
   - Commit once per solution.
   - Mark done (`ccw issue done <item-id>`).
6. Phase 3: Check next batch
   - Refresh DAG and continue until no ready solutions remain.
7. Phase 4: Completion
   - After all batches complete, handle worktree completion/cleanup instructions.

## Error Handling

- Missing or invalid queue ID: prompt selection or fail with clear usage.
- Empty DAG / nothing ready: report status and suggest forming a queue.
- Executor failure for a solution: mark failure reason, keep queue state consistent, and continue/stop based on user choice.
- Worktree failure (create/resume): abort before executing any solution.
- Git commit failure: do not mark done; require user intervention.

## Examples

```bash
/issue:execute --queue QUE-123
/issue:execute --queue QUE-123 --worktree
/issue:execute --queue QUE-123 --worktree C:/repo/.ccw/worktrees/queue-exec-QUE-123 --yes
```
