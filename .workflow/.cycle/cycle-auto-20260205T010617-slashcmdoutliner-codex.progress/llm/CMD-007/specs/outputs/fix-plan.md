# Fix Plan: cli:codex-review

## Minimal Fix List

- DOC: Keep `.claude/commands/cli/codex-review.md` aligned with `ccw cli` actual options (`--uncommitted|--base|--commit|--title|--model`) and their constraints.
- DOC: Fail fast on invalid combinations (target flag + `[prompt]`) before executing `ccw cli`.
- CODE (only if needed): If ccw CLI behavior drifts, update `ccw/src/commands/cli.ts` so review mode continues to skip templates and does not pass prompts when target flags are used.
- TEST (only if code changes): Add a focused regression test that covers mutual exclusivity and template-skipping in review mode.

## Evidence (Docs + TS)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/cli/codex-review.md` | Existing | docs: `.claude/commands/cli/codex-review.md` / `Validation Constraints` ; ts: `ccw/src/commands/cli.ts` / `// codex review: --uncommitted, --base, --commit are all mutually exclusive with [PROMPT]` | `Test-Path .claude/commands/cli/codex-review.md; Test-Path ccw/src/commands/cli.ts` | doc <-> implementation contract |
| `ccw/src/cli.ts` | Existing | docs: `.claude/commands/cli/codex-review.md` / `Integration Notes` ; ts: `ccw/src/cli.ts` / `.option('--uncommitted', 'Review uncommitted changes (codex review)')` | `Test-Path ccw/src/cli.ts` | CLI flag surface for review mode |

## Verify Steps

- `node ccw/src/cli.ts --help` is not applicable; instead compare `ccw cli --help` output against the doc examples.
- Re-run evidence gate:
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-007/specs/outputs/generated-slash-outline.md`
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-007/specs/outputs/gap-report.md`
