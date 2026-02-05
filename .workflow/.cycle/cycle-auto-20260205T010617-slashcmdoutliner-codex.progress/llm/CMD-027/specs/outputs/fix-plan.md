# Fix Plan: workflow:brainstorm-with-file

## Scope: Documentation/Outline

1) [P0][outline] Add explicit “MANDATORY FIRST STEPS” and context overflow protection bullets to `generated-slash-outline.md` execution + error-handling sections (mirror oracle intent, not full text).
2) [P1][outline] Add short subsections for Output Structure + Configuration (dimensions, role selection, collaboration patterns).
3) [P1][outline] Add a “Usage Recommendations (Requires User Confirmation)” note (when to use brainstorm vs analyze vs plan).

## Scope: Evidence/Validation

4) [P0][gate] Run evidence verification:
   - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-027/specs/outputs/generated-slash-outline.md`
   - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-027/specs/outputs/gap-report.md`

## Verify (Concrete)

- `Test-Path .claude/commands/workflow/brainstorm-with-file.md`
- `Test-Path ccw/src/core/routes/commands-routes.ts`
- `rg "function scanCommandsRecursive(" ccw/src/core/routes/commands-routes.ts`
- `rg "type: 'CLI_EXECUTION_STARTED'," ccw/src/core/routes/cli-routes.ts`
- `rg "async function executeCliTool(" ccw/src/tools/cli-executor-core.ts`
