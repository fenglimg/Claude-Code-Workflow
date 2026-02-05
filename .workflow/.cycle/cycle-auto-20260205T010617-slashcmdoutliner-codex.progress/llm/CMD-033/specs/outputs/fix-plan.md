# Fix Plan: workflow:collaborative-plan-with-file

## P0 (Must)

- tooling (ts): Normalize command identity handling for frontmatter `name` values that already include `workflow:` so tooling does not generate `/workflow:workflow:...`.
  - Target: `ccw/src/tools/command-registry.ts`
  - Verify: add/adjust a unit test (or minimal script) that reads `.claude/commands/workflow/collaborative-plan-with-file.md` and asserts the returned `command` is `/workflow:collaborative-plan-with-file`.
- docs: Choose and enforce one command naming convention (either qualified `name` OR `group` + unqualified `name`) for this command and any closely-related workflow commands.
  - Target: `.claude/commands/workflow/collaborative-plan-with-file.md`
  - Verify: run the command registry listing and confirm the command appears once under the correct slash.

## P1 (Should)

- docs/prompts: Ensure `.codex/prompts/collaborative-plan-with-file.md` stays consistent with the command doc's artifact paths and phase names.
  - Verify: `rg "\\.workflow/\\.planning" .codex/prompts/collaborative-plan-with-file.md`
- docs: Document the conflict detection output contract (what goes into `conflicts.json`, and how conflict markers are rendered in `plan-note.md`).

## P2 (Optional)

- feature: Add resume behavior for an existing session folder (detect and continue if `.workflow/.planning/{session-id}/plan-note.md` exists).

