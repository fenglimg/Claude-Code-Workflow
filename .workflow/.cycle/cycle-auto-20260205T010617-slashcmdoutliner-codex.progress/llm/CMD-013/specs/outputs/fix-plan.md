# Fix Plan: issue:execute (CMD-013)

## P0 (Must)

1. Evidence gate
   - Run:
     - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-013/specs/outputs/generated-slash-outline.md`
     - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-013/specs/outputs/gap-report.md`
   - If any TS/doc anchors change, update the Evidence cells (do not relabel as Existing unless verifiable).

2. Queue ID guardrails
   - Verify `/issue:execute` requires `--queue` and never auto-selects a queue without explicit confirmation (unless `--yes`).

## P1 (Should)

3. Executor dispatch contract
   - Confirm the orchestrator consistently uses:
     - `ccw issue queue dag --queue <queue-id>` (batch source of truth)
     - `ccw issue detail <item-id>` (read-only solution/task input)
     - `ccw issue done <item-id>` (state mutation)

4. Worktree lifecycle
   - Ensure one worktree per queue execution (create/resume) and clear guidance for completion.

## Verify Steps (Concrete)

- `rg "case 'detail':" ccw/src/commands/issue.ts`
- `rg "if (subAction === 'dag') {" ccw/src/commands/issue.ts`
- `Test-Path .codex/prompts/issue-execute.md`
- `Test-Path .claude/commands/issue/execute.md`

