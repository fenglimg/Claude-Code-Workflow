# Fix Plan: workflow:complete

## Scope: Docs (P0)

- Create `.claude/commands/workflow/complete.md`.
- Keep it thin: explicitly delegate to `/workflow:session:complete` and forward args `[-y|--yes] [--detailed]`.
- Include core sections: Overview, Usage, Inputs, Outputs/Artifacts, Execution Process (high level), Error Handling, Examples.

## Scope: Index/Discovery (P1)

- Add alias entry for `/workflow:complete` in `.claude/skills/ccw-help/command.json`.
- If required by the help system, regenerate derived indexes under `.claude/skills/ccw-help/index/`.
- Optional: switch dashboard help flow node label from `/workflow:session:complete` to `/workflow:complete` in `ccw/src/templates/dashboard-js/views/help.js`.

## Scope: Validation (P0)

- Run deterministic evidence verification:
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-049/specs/outputs/generated-slash-outline.md`
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-049/specs/outputs/gap-report.md`

## Verify Steps (No-Guess)

- Confirm whether `.claude/commands/workflow/complete.md` should be new (alias) or a rename of the session command.
- Confirm whether UI/help should prefer the alias (search for literal `'/workflow:session:complete'` references under `ccw/src/`).

