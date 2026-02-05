# Fix Plan: workflow:tools:tdd-coverage-analysis

## Scope: Command Doc (`.claude/commands/workflow/tools/tdd-coverage-analysis.md`)

1. Document `test-results.json` normalization when the framework cannot emit JSON (store wrapper with framework + command + stdout/stderr).
2. Document partial-success behavior and required minimum outputs (always write `tdd-cycle-report.md`, even if coverage or summaries are missing).

## Scope: Validation (Outliner Outputs)

1. Keep evidence tables up-to-date and re-run:
   - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-063/specs/outputs/generated-slash-outline.md`
   - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-063/specs/outputs/gap-report.md`

