# Fix Plan: workflow:execute

## Scope

Minimal changes to align `/workflow:execute` docs + supporting tooling with CCW quality gates while avoiding regressions.

## Fixes (Ordered)

1. Docs (P0): Add `allowed-tools` to `.claude/commands/workflow/execute.md` frontmatter
   - Proposed: `TodoWrite(*), Task(*), AskUserQuestion(*), Read(*), Skill(*), Bash(*)`
   - Verify:
     - `rg -n \"allowed-tools:\" .claude/commands/workflow/execute.md`
     - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-035/specs/outputs/generated-slash-outline.md`

2. Docs (P1): Clarify auto mode defaults and commit safety
   - Ensure `-y|--yes` defaults are explicitly enumerated
   - Ensure `--with-commit` documents: commit only files from summary "Files Modified"

3. Tooling (P1, only if needed): Reuse session-manager routing for file operations
   - If new file paths are introduced in execute flow, route them through existing `PATH_ROUTES` conventions in `ccw/src/tools/session-manager.ts`
   - Verify:
     - `rg -n \"const ACTIVE_BASE = '\\.workflow/active';\" ccw/src/tools/session-manager.ts`

