# Fix Plan: workflow:test-fix-gen

## P0 (Must)

1. Evidence gate: run `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js` for `generated-slash-outline.md` and `gap-report.md`; fix any table/anchor failures immediately.
2. Pointer correctness: ensure no pointer is labeled `Existing` unless `Test-Path <pointer>` succeeds (downgrade to `Planned` + add concrete verify steps if uncertain).

## P1 (Should)

1. Add explicit `Core Rules` section (short, non-negotiable orchestrator invariants: start immediately, parse outputs, do not stop, task attachment/collapse, auto-continue by TodoWrite).
2. Add `Coordinator Checklist` section to match phase validations (inputs parsed, session created, context package produced, analysis file produced, tasks generated, next-step returned).
3. Add `Related Commands` section:
   - prerequisites for session mode
   - called commands per phase
   - follow-up commands (especially `/workflow:test-cycle-execute`)
4. Clarify input precedence and mode detection in `Inputs` (WFS-* vs existing filepath vs free text).

## P2 (Optional)

1. Add short note for \"CLI tool preference (semantic detection)\" behavior if supported, without adding new architecture.
2. Add one negative example showing a failure case and the expected error output format.

