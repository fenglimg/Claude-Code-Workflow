# Fix Plan: ccw-debug

## Scope: Docs

1. Add a compact mode selection decision tree section (auto-detect priority order; explicit `--mode`; escalation out of `cli`).
2. Add bidirectional merge policy (merge structure in `status.json`, confidence tagging, and failure isolation).

## Scope: Tooling/Server

3. Confirm discovery source for building chains:
   - Option A: extend `CommandRegistry` to scan non-workflow root commands (e.g. `/ccw-debug`), or
   - Option B: rely on `/api/commands` (from `ccw/src/core/routes/commands-routes.ts`) for complete discovery.

## Scope: Validation

4. Run evidence gate on both markdown outputs:
   - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-002/specs/outputs/generated-slash-outline.md`
   - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-002/specs/outputs/gap-report.md`

