# Fix Plan: workflow:review

## P0 Fixes

1. Update `.claude/commands/workflow/review.md` frontmatter
   - Add `allowed-tools: Skill(*), TodoWrite(*), Read(*), Bash(*), Task(*)`
   - Add `group: workflow`
   - Verify: `Test-Path .claude/commands/workflow/review.md`
2. Resolve the docs redirect reference
   - Option A (preferred if the redirect is real): create `.claude/commands/workflow/tools/docs.md` with frontmatter + minimal usage and ensure it matches `/workflow:tools:docs`
   - Option B: remove/replace `/workflow:tools:docs` references in `.claude/commands/workflow/review.md` with an existing command (if one is intended)
   - Verify: `Test-Path .claude/commands/workflow/tools/docs.md` and `rg \"/workflow:tools:docs\" .claude/commands/workflow/review.md`

## P1 Fixes

3. Clarify OS-specific execution
   - Add a short PowerShell snippet (or note) next to the bash execution template to prevent copy/paste failures on Windows.

## Validation

- Evidence gate:
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-048/specs/outputs/generated-slash-outline.md`
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-048/specs/outputs/gap-report.md`

