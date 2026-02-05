# Fix Plan: memory:update-full

## P0 (Must Fix)

1. Verify batching/queue integration
   - Scope: `ccw/src/tools/memory-update-queue.js` + any caller
   - Action: Confirm whether `/memory:update-full` currently uses `memory_queue`; if not, mark it as Planned in docs and add explicit Verify steps.

2. Mirror reference filtering rules
   - Scope: `.claude/commands/memory/update-full.md`
   - Action: Confirm which directories/files are excluded (tests/build/config/docs) and ensure the execution plan uses the same filter.

3. Enforce safety verification
   - Scope: command execution workflow
   - Action: Ensure the final step detects non-`CLAUDE.md` changes and aborts (or requires explicit confirmation) with a clear diff summary.

## P1 (Should Fix)

4. Make fallback chain deterministic
   - Scope: command doc + execution helper
   - Action: Document and implement tool-order permutations derived from `--tool` and log retries per module.

5. Make thresholds explicit
   - Scope: command doc + execution helper
   - Action: Document and implement the direct-parallel threshold (`<20 modules`) as a constant; ensure it matches the oracle.

## Verify

- `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-024/specs/outputs/generated-slash-outline.md`
- `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-024/specs/outputs/gap-report.md`

