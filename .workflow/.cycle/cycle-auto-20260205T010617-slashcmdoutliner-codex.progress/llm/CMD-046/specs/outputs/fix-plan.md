# Fix Plan: workflow:review-module-cycle

1) Docs (P0): Clarify session semantics
   - Decide and document one of:
     - Auto-create a review session via `/workflow:session:start`, or
     - Require an existing active session, or
     - Support `--session <WFS-...>` override (with fallback to active).
   - Verify against reference headings in `.claude/commands/workflow/review-module-cycle.md`:
     - `rg -n \"Session\" .claude/commands/workflow/review-module-cycle.md`

2) Docs (P0): Add explicit orchestrator boundary + iteration control
   - Orchestrator responsibilities: resolve/validate files, launch dimension reviews, aggregate, decide deep-dive, persist progress/state, TodoWrite.
   - Iteration stop conditions: `--max-iterations` semantics + thresholds for triggering deep-dive.
   - Verify reference sections exist:
     - `rg -n \"Orchestrator Boundary\" .claude/commands/workflow/review-module-cycle.md`

3) Docs/Schema (P0/P1): Specify minimal output contracts
   - `review-state.json`: required top-level fields (metadata, iteration, severity summary, cross-cutting concerns, next action).
   - `review-progress.json`: per-dimension status fields + timestamps/errors.
   - Per-dimension JSON and report naming conventions.
   - Verify compatibility anchors in tooling code:
     - `rg -n \"review-state\\.json\" ccw/src/core/data-aggregator.ts`
     - `rg -n \"review-progress\\.json\" ccw/src/core/data-aggregator.ts`

4) Docs (P1): Path resolution behavior
   - Glob expansion rules, relative path normalization, deduping, and readable checks.
   - Document error messages (no files matched, unreadable paths).

5) Docs (P1): Add related-command handoff
   - Link to session review and fix workflow, and define the handoff artifact (directory or exported findings file).
   - Verify related docs exist:
     - `Test-Path .claude/commands/workflow/review-session-cycle.md`
     - `Test-Path .claude/commands/workflow/review-cycle-fix.md`

6) Non-regression (P0): Keep evidence tables valid
   - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-046/specs/outputs/generated-slash-outline.md`
   - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-046/specs/outputs/gap-report.md`

