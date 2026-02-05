---
name: queue
description: Form execution queue from bound solutions using issue-queue-agent (solution-level)
argument-hint: "[-y|--yes] [--queues <n>] [--issue <id>]"
allowed-tools: TodoWrite(*), Task(*), Bash(*), Read(*), Write(*)
group: issue
---

# issue:queue

## Overview

- Goal: Create one or more solution-level execution queues from planned issues with bound solutions (conflicts clarified when needed).
- Command: `/issue:queue`

## Usage

```bash
/issue:queue [-y|--yes] [--queues <n>] [--issue <id>]
```

## Inputs

- Required inputs:
  - Planned issues with bound solutions available (typically produced by `/issue:plan`)
  - `ccw` CLI available on PATH for issue/solution/queue operations
- Optional inputs:
  - `--queues <n>`: number of parallel queues to form (default: 1)
  - `--issue <id>`: restrict queue formation to a single issue
  - `-y|--yes`: auto-confirm (prefer recommended conflict resolutions)

## Outputs / Artifacts

- Writes:
  - `.workflow/issues/queues/index.json`
  - `.workflow/issues/queues/{queue-id}.json`
  - `.workflow/issues/issues.jsonl` (status updates via CLI)
- Reads:
  - `.workflow/issues/issues.jsonl`
  - `.workflow/issues/solutions/*.jsonl`
  - `.workflow/issues/queues/index.json`

## Implementation Pointers

- Command doc: `.claude/commands/issue/queue.md`
- Likely code locations:
  - `ccw/src/commands/issue.ts`
  - `ccw/src/core/routes/issue-routes.ts`
  - `.codex/agents/issue-queue-agent.md`

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/issue/queue.md` | Existing | docs: `.claude/commands/issue/queue.md` / `Overview` ; ts: `ccw/src/commands/issue.ts` / `async function queueAction(` | `Test-Path .claude/commands/issue/queue.md` | primary command doc |
| `.codex/agents/issue-queue-agent.md` | Existing | docs: `.claude/commands/issue/queue.md` / `Phase 2-4: Agent-Driven Queue Formation` ; ts: `ccw/src/commands/issue.ts` / `async function solutionsAction(` | `Test-Path .codex/agents/issue-queue-agent.md` | agent that orders solutions + detects conflicts |
| `ccw/src/commands/issue.ts` | Existing | docs: `.claude/commands/issue/queue.md` / `CLI subcommands (ccw issue queue ...)` ; ts: `ccw/src/commands/issue.ts` / `async function queueAction(` | `Test-Path ccw/src/commands/issue.ts` | CLI surface for solutions + queue management |
| `ccw/src/core/routes/issue-routes.ts` | Existing | docs: `.claude/commands/issue/queue.md` / `Storage Structure (Queue History)` ; ts: `ccw/src/core/routes/issue-routes.ts` / `index.active_queue_id = queueId;` | `Test-Path ccw/src/core/routes/issue-routes.ts` | server routes that manipulate active queue metadata |
| `.workflow/issues/queues/index.json` | Planned | docs: `.claude/commands/issue/queue.md` / `Storage Structure (Queue History)` ; ts: `ccw/src/commands/issue.ts` / `.workflow/issues/queues/index.json` | `rg "\.workflow/issues/queues/index\.json" ccw/src/commands/issue.ts` | queue index file updated when queues are created/activated |
| `.workflow/issues/queues/{queue-id}.json` | Planned | docs: `.claude/commands/issue/queue.md` / `Storage Structure (Queue History)` ; ts: `ccw/src/commands/issue.ts` / `.workflow/issues/queues/` | `rg "\.workflow/issues/queues/" ccw/src/commands/issue.ts` | per-queue persisted queue payload |
| `.workflow/issues/solutions/*.jsonl` | Planned | docs: `.claude/commands/issue/queue.md` / `Phase 1: Solution Loading & Distribution` ; ts: `ccw/src/commands/issue.ts` / `.workflow/issues/solutions/*.jsonl` | `rg "\.workflow/issues/solutions/" ccw/src/commands/issue.ts` | input solution store (bound solutions) |
| `.workflow/issues/issues.jsonl` | Planned | docs: `.claude/commands/issue/queue.md` / `Storage Structure (Queue History)` ; ts: `ccw/src/commands/issue.ts` / `.workflow/issues/issues.jsonl` | `rg "\.workflow/issues/issues\.jsonl" ccw/src/commands/issue.ts` | issue status updates to queued/executing/etc. |

## Execution Process

1. Parse flags (`--yes`, `--queues`, `--issue`) and decide target issues and queue count.
2. Phase 1: Load bound solutions in one batch (prefer `ccw issue solutions --status planned --brief`).
3. If no bound solutions found, stop with a short message and suggest `/issue:plan`.
4. If multiple queues requested, distribute solutions across queues (aim to minimize conflicts).
5. Phase 2-4: Run `issue-queue-agent` to:
   - detect conflicts (file/API/data/dependency/architecture)
   - build a dependency DAG
   - order solutions and assign parallel/sequential execution groups
6. Phase 5: If unresolved high-severity conflicts remain:
   - if auto mode (`--yes`): apply the agent's recommended resolutions
   - otherwise: ask user to choose ordering where required, then re-run or adjust queue formation
7. Persist queue history:
   - write `.workflow/issues/queues/{queue-id}.json`
   - update `.workflow/issues/queues/index.json` (active queue metadata)
8. Phase 6: Update issue statuses based on the queue (prefer batch sync from queue when available).
9. Phase 7: If an active queue already exists, ask user to merge/switch/cancel and apply the chosen queue action.
10. Print a short summary (queue id(s), solution count, groups) and suggest next step: `/issue:execute`.

## Error Handling

- No bound solutions: print actionable hint (`/issue:plan`) and exit cleanly.
- Invalid `--issue <id>`: show not-found and list how to discover valid IDs.
- Agent returns clarifications: block on user decision unless `--yes`.
- CLI failures / non-zero exit: surface the command + stderr excerpt; do not partially write queue history.
- Invalid `--queues <n>`: reject non-positive or non-integer values.

## Examples

- `/issue:queue`
- `/issue:queue --queues 3`
- `/issue:queue --issue GH-123`
- `/issue:queue -y`
