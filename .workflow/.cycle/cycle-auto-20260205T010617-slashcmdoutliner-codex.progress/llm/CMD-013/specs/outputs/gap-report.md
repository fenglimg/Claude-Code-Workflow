# Gap Report: issue:execute

## Reference

- Selected reference: /issue:execute (`.claude/commands/issue/execute.md`)

## P0 Gaps (Must Fix)

- None (frontmatter + required sections + evidence gates addressed in the generated outline).

## P1 Gaps (Should Fix)

- Ensure the generated outline mirrors the oracle doc’s key phases (queue ID prompt rules, DAG refresh loop, worktree lifecycle) with explicit bullets and guardrails.
- Make executor dispatch contract explicit (inputs/outputs per solution, failure semantics, and when to stop vs continue).

## P2 Gaps (Optional)

- Add a short “Parallel Execution Model” diagram (text-only) for operator clarity.
- Add a concise “Related Commands” cross-link section to `/issue:queue` and `/issue:plan`.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/issue/execute.md` | Existing | docs: .claude/commands/issue/execute.md / Overview ; ts: ccw/src/commands/issue.ts / case 'detail': | `Test-Path .claude/commands/issue/execute.md` | oracle slash command doc |
| `.claude/commands/issue/queue.md` | Existing | docs: .claude/commands/issue/queue.md / Storage Structure (Queue History) ; ts: ccw/src/commands/issue.ts / case 'queue': | `Test-Path .claude/commands/issue/queue.md` | queue storage and formation context |
| `ccw/src/commands/issue.ts` | Existing | docs: .claude/commands/issue/execute.md / CLI Endpoint Contract ; ts: ccw/src/commands/issue.ts / if (subAction === 'dag') { | `Test-Path ccw/src/commands/issue.ts; rg "case 'done':" ccw/src/commands/issue.ts` | implements `ccw issue queue dag/detail/done` |
| `ccw/src/core/routes/issue-routes.ts` | Existing | docs: .claude/commands/issue/execute.md / CLI Endpoint Contract ; ts: ccw/src/core/routes/issue-routes.ts / GET /api/issues/:id - Get issue detail | `Test-Path ccw/src/core/routes/issue-routes.ts; rg "GET /api/issues/:id - Get issue detail" ccw/src/core/routes/issue-routes.ts` | backing route for issue detail retrieval |
| `.codex/prompts/issue-execute.md` | Existing | docs: .claude/commands/issue/execute.md / Execution Flow ; ts: ccw/src/commands/issue.ts / case 'done': | `Test-Path .codex/prompts/issue-execute.md` | prompt-level orchestrator pattern |
| `.workflow/issues/queues/index.json` | Planned | docs: .claude/commands/issue/queue.md / Storage Structure (Queue History) ; ts: ccw/src/commands/issue.ts / const ISSUES_DIR = '.workflow/issues'; | `Test-Path .workflow/issues/queues/index.json` | runtime queue index |
| `.workflow/issues/queues/<queue-id>.json` | Planned | docs: .claude/commands/issue/queue.md / Storage Structure (Queue History) ; ts: ccw/src/commands/issue.ts / function getQueuesDir(): string { | `Test-Path .workflow/issues/queues` | runtime queue state store |
| `.ccw/worktrees/queue-exec-<queue-id>` | Planned | docs: .claude/commands/issue/execute.md / Phase 4: Worktree Completion (after ALL batches) ; ts: ccw/src/commands/issue.ts / case 'queue': | `git worktree list` | optional isolation for queue execution |

## Implementation Hints (Tooling/Server)

- The orchestrator should treat `ccw issue queue dag` as the single source of truth for batching (refresh after each batch).
- Use `ccw issue detail` as read-only input; only `ccw issue done` mutates queue state.
- Prefer a single queue-scoped worktree; do not create one per solution.

## Proposed Fix Plan (Minimal)

1. Keep `/issue:execute` doc as the contract; ensure the implementation follows the CLI endpoint contract verbatim.
2. Ensure evidence pointers stay accurate as the code evolves (update anchors if refactors rename strings).
3. Add/verify worktree lifecycle steps in `.codex/prompts/issue-execute.md` match the command doc.

