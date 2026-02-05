# Fix Plan: workflow:review-cycle-fix

## Scope-Labeled Fixes

1. [docs] Clarify entry mode resolution order
   - Define precedence: `--resume` > `<export-file>` > `<review-dir>`.
   - Specify how review-dir auto-discovers the latest export and what filename patterns are accepted.

2. [docs] Make resume semantics concrete
   - Identify the authoritative marker file(s) for resume (e.g. `active-fix-session.json`) and what fields are required.
   - Define what happens when the marker exists but the referenced session folder is missing.

3. [docs/agents] Align agent naming for execution
   - Confirm whether the intended agent is `@cli-execute-agent` or `@cli-execution-agent`.
   - Update `.claude/commands/workflow/review-cycle-fix.md` and/or agent docs accordingly (no behavior changes).

4. [validation] Keep evidence gate green
   - After edits, run:
     - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-045/specs/outputs/gap-report.md`
     - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-045/specs/outputs/generated-slash-outline.md`

