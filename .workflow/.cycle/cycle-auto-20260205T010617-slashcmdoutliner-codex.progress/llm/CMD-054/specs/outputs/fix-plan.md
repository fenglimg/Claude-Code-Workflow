# Fix Plan: workflow:tdd-plan

Scope: align `/workflow:tdd-plan` command doc to outliner P0 gates while preserving existing phase content.

1. Docs (P0)
   - Add `group: workflow` to `.claude/commands/workflow/tdd-plan.md` frontmatter.
   - Add missing CCW-gated sections as headings near the top: `Overview`, `Usage`, `Inputs`, `Outputs / Artifacts`, `Execution Process`, `Error Handling`.
   - Keep existing sections (`Coordinator Role`, `Core Rules`, `TDD Compliance Requirements`, `6-Phase Execution`, etc.) under `Execution Process` or referenced from it.

2. Evidence (P0)
   - Add/update an evidence table in `.claude/commands/workflow/tdd-plan.md` covering:
     - `.claude/commands/workflow/session/start.md`
     - `.claude/commands/workflow/tools/context-gather.md`
     - `.claude/commands/workflow/tools/test-context-gather.md`
     - `.claude/commands/workflow/tools/conflict-resolution.md`
     - `.claude/commands/workflow/tools/task-generate-tdd.md`
     - `.claude/commands/workflow/plan-verify.md`
     - `ccw/src/tools/session-manager.ts`
     - `ccw/src/tools/command-registry.ts`
     - `ccw/src/core/routes/commands-routes.ts`

3. Validation (P0)
   - Run:
     - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-054/specs/outputs/generated-slash-outline.md`
     - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-054/specs/outputs/gap-report.md`

4. Follow-up (P1)
   - Standardize Phase 6 summary output contract (artifact counts + first-task TDD structure check) so `/workflow:plan-verify` is always actionable.