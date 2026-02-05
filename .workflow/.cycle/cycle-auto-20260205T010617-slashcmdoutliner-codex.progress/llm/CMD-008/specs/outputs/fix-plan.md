# Fix Plan: other:codex-coordinator (CMD-008)

## P0 (Required)

1. Command doc frontmatter
   - Add `allowed-tools` to `.claude/commands/codex-coordinator.md` and keep `argument-hint` consistent with usage.
   - Verify: `Test-Path .claude/commands/codex-coordinator.md`.

2. Unify execution surface
   - Standardize on `ccw cli -p "..." --tool codex` for running Codex prompts; align all examples.
   - Verify: `Test-Path ccw/src/commands/cli.ts` and confirm anchors: `ccw cli -p`, `--tool codex`.

3. State + resume contract
   - Specify and implement (or at least document) `.workflow/.codex-coordinator/<session-id>/state.json` + `runs.jsonl`.
   - Define statuses: pending/running/completed/failed and resume-from-first-pending behavior.
   - Verify (doc): heading exists for state: `rg "^## State File Structure" .claude/commands/codex-coordinator.md`.

4. Minimum execution unit enforcement
   - Make skip/retry/abort rules explicit; do not allow partial unit execution without explicit user override.
   - Verify (doc): heading exists: `rg "Minimum Execution Units" .claude/commands/codex-coordinator.md`.

5. Evidence gates
   - Ensure evidence tables in the slash outline + gap report pass deterministic verification.
   - Verify:
     - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-008/specs/outputs/generated-slash-outline.md`
     - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-008/specs/outputs/gap-report.md`

## P1 (Recommended)

6. Prompt discovery helper (optional)
   - Add `ccw/src/tools/codex-prompt-registry.ts` to enumerate `.codex/prompts/*.md` deterministically (mirrors `CommandRegistry`).
   - Verify: `Test-Path ccw/src/tools/command-registry.ts` (reference implementation).

7. UX polish
   - In `--verbose`, print chain rationale and expected artifacts per step.