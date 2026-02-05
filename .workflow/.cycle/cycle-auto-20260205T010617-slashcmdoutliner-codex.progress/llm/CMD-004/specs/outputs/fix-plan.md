# Fix Plan: other:ccw-test

## P0 (Must)

1. Keep evidence tables valid:
   - Run `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-004/specs/outputs/generated-slash-outline.md`
   - Run `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-004/specs/outputs/gap-report.md`
2. Do not mark runtime artifacts under `.workflow/` as Existing unless they are present in-repo (they are typically created at execution time).

## P1 (Should)

1. Confirm optional flags:
   - Verify in the command doc and any coordinator implementation whether `--target`, `--max-iterations`, and `--pass-threshold` are supported before documenting them as stable inputs.

## P2 (Optional)

1. Standardize group labeling for UI (if desired):
   - If you want `/ccw-test` to appear under a specific group in the commands manager, add an explicit `group:` in frontmatter (only if it matches how the command is invoked and organized elsewhere).

