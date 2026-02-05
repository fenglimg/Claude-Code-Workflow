# Fix Plan: workflow:artifacts

## P0 (Must)

1. Replace any placeholder evidence with repo-verifiable docs headings + literal TS anchors.
2. Run and pass:
   - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-028/specs/outputs/gap-report.md`
   - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-028/specs/outputs/generated-slash-outline.md`

## P1 (Should)

3. Tighten Execution Process to exactly match phases 0..5 (+4.5) and enforce the max-4 AskUserQuestion batching rule.

## P2 (Optional)

4. Document a stable topic-to-session-id sanitization rule to prevent invalid WFS folder names.

