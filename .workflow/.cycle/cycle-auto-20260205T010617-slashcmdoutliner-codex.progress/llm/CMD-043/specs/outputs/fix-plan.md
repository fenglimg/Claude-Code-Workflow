# Fix Plan: workflow:plan (CMD-043)

## P0 (Must)

- Keep all evidence-table rows dual-sourced (docs + TS) and re-run the deterministic gate after any edits.

## P1 (Should)

- If the goal shifts from "development outline" to "doc parity", expand `generated-slash-outline.md` to include the full oracle section set (while keeping evidence tables valid).

## Verify

```bash
node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-043/specs/outputs/generated-slash-outline.md
node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-043/specs/outputs/gap-report.md
```

