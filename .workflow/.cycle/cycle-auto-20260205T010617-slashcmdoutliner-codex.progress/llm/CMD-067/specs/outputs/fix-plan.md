# Fix Plan: workflow:animation-extract

## Goal

Close the P1 discovery/consistency gaps without changing unrelated behavior.

## Plan (Minimal, Testable)

1. Verify baseline assumptions (no code changes)
   - Confirm oracle doc exists and headings match: `Test-Path .claude/commands/workflow/ui-design/animation-extract.md`
   - Confirm current tooling scan behavior:
     - `rg -n \"\\.claude\\\\/commands\" ccw/src/commands/install.ts`
     - `rg -n \"join\\('\\.claude', 'commands', 'workflow'\\)\" ccw/src/tools/command-registry.ts`
2. Decide desired discovery scope
   - If “workflow command listing/lookup” must include nested docs (e.g. `workflow/ui-design/*.md`), update discovery to recurse.
   - If not, document the limitation explicitly (so ui-design commands remain “doc-only/oracle-only” to tooling).
3. If recursion is needed: implement smallest safe change
   - Update `ccw/src/tools/command-registry.ts` to optionally scan `.claude/commands` recursively (excluding `node_modules/` and `_disabled/`), mirroring the corpus walker behavior.
   - Add a focused unit test in `ccw/src/tools/command-registry.test.ts` covering nested directories (ui-design-like layout).
4. Re-run gates
   - Evidence tables: `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-067/specs/outputs/generated-slash-outline.md --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-067/specs/outputs/gap-report.md`
   - Tool tests (if code changed): run the existing test runner for `command-registry` tests (project standard).

