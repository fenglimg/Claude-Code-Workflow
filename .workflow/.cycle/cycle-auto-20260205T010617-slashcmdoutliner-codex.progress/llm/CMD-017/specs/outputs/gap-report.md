# Gap Report: issue:queue

## Reference

- Selected reference: /issue:queue (`.claude/commands/issue/queue.md`)

## P0 Gaps (Must Fix)

- None identified in the generated outline structure (frontmatter + core sections + evidence table present).

## P1 Gaps (Should Fix)

- Clarify the concrete mapping from slash flags to CLI actions:
  - `--queues <n>` (multi-queue formation + activation semantics)
  - `--issue <id>` (single-issue filtering)
  - active-queue decision (merge/switch/cancel)
- Make the persistence boundary explicit:
  - which component writes queue files (agent vs CLI)
  - how queue index is updated (single vs multi-queue fields)

## P2 Gaps (Optional)

- Add one worked example showing conflict clarification (question + options + chosen ordering) and the resulting queue update.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/issue/queue.md` | Existing | docs: `.claude/commands/issue/queue.md` / `Implementation` ; ts: `ccw/src/commands/issue.ts` / `async function queueAction(` | `Test-Path .claude/commands/issue/queue.md` | command behavior + phases + artifacts |
| `.codex/agents/issue-queue-agent.md` | Existing | docs: `.claude/commands/issue/queue.md` / `Phase 2-4: Agent-Driven Queue Formation` ; ts: `ccw/src/commands/issue.ts` / `async function solutionsAction(` | `Test-Path .codex/agents/issue-queue-agent.md` | ordering/conflict analysis agent spec |
| `ccw/src/commands/issue.ts` | Existing | docs: `.claude/commands/issue/queue.md` / `CLI subcommands (ccw issue queue ...)` ; ts: `ccw/src/commands/issue.ts` / `async function solutionsAction(` | `Test-Path ccw/src/commands/issue.ts` | batch solutions + queue CLI subactions |
| `ccw/src/core/routes/issue-routes.ts` | Existing | docs: `.claude/commands/issue/queue.md` / `Phase 7: Active Queue Check & Decision` ; ts: `ccw/src/core/routes/issue-routes.ts` / `index.active_queue_id = queueId;` | `Test-Path ccw/src/core/routes/issue-routes.ts` | active queue switching/activation support |
| `.workflow/issues/queues/index.json` | Planned | docs: `.claude/commands/issue/queue.md` / `Storage Structure (Queue History)` ; ts: `ccw/src/commands/issue.ts` / `.workflow/issues/queues/index.json` | `rg "\.workflow/issues/queues/index\.json" ccw/src/commands/issue.ts` | runtime queue index written/updated during queue ops |
| `.workflow/issues/queues/{queue-id}.json` | Planned | docs: `.claude/commands/issue/queue.md` / `Storage Structure (Queue History)` ; ts: `ccw/src/commands/issue.ts` / `.workflow/issues/queues/` | `rg "\.workflow/issues/queues/" ccw/src/commands/issue.ts` | runtime queue payload files |

## Implementation Hints (Tooling/Server)

- Prefer batch solution loading via `ccw issue solutions` (TS: `solutionsAction`).
- Prefer queue ops via `ccw issue queue <subaction>` (TS: `queueAction`), including multi-queue activation (`activate`) and active-queue switching (`switch`).
- Queue index supports both `active_queue_id` (back-compat) and `active_queue_ids` (multi-queue) (TS: `ccw/src/core/routes/issue-routes.ts`).

## Proposed Fix Plan (Minimal)

1. (docs) Add an explicit "Flag -> CLI" mapping table for `--queues`, `--issue`, and the active-queue decision branch.
2. (agent/docs) Document who writes `.workflow/issues/queues/{queue-id}.json` and `.workflow/issues/queues/index.json` (agent vs CLI) and the required fields.
3. (cli/docs) Ensure all CLI subcommands referenced in the doc exist (or mark as planned) and add verify commands for each existing claim.
