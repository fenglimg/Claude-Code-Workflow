# Fix Plan: workflow:imitate-auto

## P0 (Must)

1) Align Phase 4 integration command naming
- If the orchestrator intends to sync session artifacts, reference the existing command doc: `.claude/commands/workflow/ui-design/design-sync.md`.
- If `/workflow:ui-design:update` is required as a distinct command, add a new command doc and ensure it is discoverable under `.claude/commands/workflow/ui-design/`.
- Verify:
  - `Test-Path .claude/commands/workflow/ui-design/design-sync.md`
  - `Select-String -Path .claude/commands/workflow/ui-design/imitate-auto.md -SimpleMatch -Pattern "/workflow:ui-design:update"`

2) Keep evidence-based pointers valid
- Ensure evidence tables in the generated outline + gap report include docs + TS anchors per row.
- Verify:
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-072/specs/outputs/generated-slash-outline.md`
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-072/specs/outputs/gap-report.md`

## P1 (Should)

3) Tighten output verification after Phase 3
- Add explicit checks for `prototypes/compare.html` and expected prototype counts before reporting completion.

4) Preserve legacy parameter behavior with clear warnings
- Keep legacy `--images/--prompt` behavior consistent with the oracle doc; ensure warnings are emitted and normalized into the unified `--input` path.

## P2 (Optional)

5) Expand recovery playbook
- Add short, phase-scoped recovery steps (fallbacks + rerun instructions) to reduce ambiguity during failures.
