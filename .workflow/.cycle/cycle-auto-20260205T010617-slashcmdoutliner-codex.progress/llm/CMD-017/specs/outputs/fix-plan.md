# Fix Plan: issue:queue

## P0 (Must)

1. (docs) Add a "Flag -> CLI" mapping section that explicitly ties:
   - `--queues <n>` to queue distribution + activation semantics
   - `--issue <id>` to filtering behavior
   - active queue decision to merge/switch/cancel actions
2. (docs) Make the persistence boundary explicit (agent vs CLI) for:
   - `.workflow/issues/queues/{queue-id}.json`
   - `.workflow/issues/queues/index.json`
3. (quality) Keep evidence tables correct (no false `Existing`), and re-run the deterministic gate on every iteration.

## P1 (Should)

4. (docs/cli) Cross-check any referenced `ccw issue queue <subcommand>` names against `ccw/src/commands/issue.ts` and mark missing ones as Planned.
5. (docs) Add one conflict-clarification example that shows the blocking question and the resulting queue update.

## P2 (Optional)

6. (tests) Add unit tests around queue index switching/activation edge cases (single vs multi-queue fields).

## Verify Steps

- Evidence gate:
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-017/specs/outputs/generated-slash-outline.md`
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-017/specs/outputs/gap-report.md`
- Pointer sanity:
  - `Test-Path .claude/commands/issue/queue.md`
  - `Test-Path ccw/src/commands/issue.ts`
  - `Test-Path ccw/src/core/routes/issue-routes.ts`
