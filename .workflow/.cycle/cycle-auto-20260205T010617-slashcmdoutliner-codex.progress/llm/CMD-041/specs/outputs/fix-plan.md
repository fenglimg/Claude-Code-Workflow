# Fix Plan: workflow:multi-cli-plan

## Goal

Bring `/workflow:multi-cli-plan` documentation and CCW tooling into a consistent, verifiable state (docs + TS), with minimal changes.

## Steps

1. Frontmatter normalization (docs)
   - Update `.claude/commands/workflow/multi-cli-plan.md` to use `name: multi-cli-plan`.
   - Add `group: workflow` (to match other workflow commands like `plan.md`).
   - Verify the command renders as `/workflow:multi-cli-plan` (no doubled prefix).

2. Registry compatibility (TS)
   - Confirm how `ccw/src/tools/command-registry.ts` composes `command: /workflow:<name>`.
   - If command docs can include a `workflow:` prefix, add a safe normalization step (strip embedded group prefix) and add a unit test.

3. Session typing consistency (TS)
   - Add `'multi-cli-plan'` to `SessionType` in `ccw/src/types/session.ts`.
   - Grep for `SessionType` usage and update any switch/filters to include `multi-cli-plan`.

4. Validation
   - Run `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js` on the command doc and any updated outlines.
   - Run the existing `ccw/src/tools/command-registry.test.ts` suite and ensure no regressions.

