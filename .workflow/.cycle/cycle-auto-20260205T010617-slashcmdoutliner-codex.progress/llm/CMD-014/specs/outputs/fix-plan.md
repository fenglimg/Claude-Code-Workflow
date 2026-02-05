# Fix Plan: issue:from-brainstorm

## Minimal Fix List

1) [docs] Ensure outline core sections exist and match CCW expectations (Overview/Usage/Inputs/Outputs/Execution/Error Handling/Examples).
2) [evidence] For every key pointer mentioned, keep one evidence table row with:
   - docs: `.claude/commands/**.md` / exact heading text
   - ts: `ccw/src/**` / literal anchor string present in file
3) [labels] Use `Existing` only for repo-verifiable paths; keep runtime artifacts under `.workflow/issues/**` as `Planned` by default.
4) [validate] Run:
   - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-014/specs/outputs/gap-report.md`
   - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-014/specs/outputs/generated-slash-outline.md`

