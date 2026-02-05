# Fix Plan: workflow:init

## P0 (Must)

1. Docs: update `.claude/commands/workflow/init.md` frontmatter to include required fields
   - Add `allowed-tools` and `group` while keeping existing `name/description/argument-hint/examples`.
   - Verify:
     - `rg "^allowed-tools:" .claude/commands/workflow/init.md`
     - `rg "^group:" .claude/commands/workflow/init.md`

2. Safety: make regeneration behavior unambiguous in the command doc
   - Ensure `--regenerate` is the only path that overwrites `project-tech.json`, and that backup happens first.
   - Verify:
     - `rg "project-tech\\.json\\.backup" .claude/commands/workflow/init.md`
     - `rg "--regenerate" .claude/commands/workflow/init.md`

3. Evidence gate (outliner outputs): keep evidence tables passing
   - Run:
     - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-037/specs/outputs/generated-slash-outline.md`
     - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-037/specs/outputs/gap-report.md`

## P1 (Should)

4. Docs structure: add explicit `Inputs` + `Outputs / Artifacts` sections to `.claude/commands/workflow/init.md`
   - Keep the content minimal and consistent with the existing flow.
   - Verify:
     - `rg "^## Inputs" .claude/commands/workflow/init.md`
     - `rg "^## Outputs" .claude/commands/workflow/init.md`

5. UX: clarify next steps after init completes
   - If guidelines are empty, offer “configure now” vs “skip” and point to `/workflow:init-guidelines` when skipping.
   - Verify:
     - `rg "/workflow:init-guidelines" .claude/commands/workflow/init.md`

