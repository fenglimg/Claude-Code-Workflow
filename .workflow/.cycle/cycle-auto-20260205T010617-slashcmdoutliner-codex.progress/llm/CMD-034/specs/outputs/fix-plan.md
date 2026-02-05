# Fix Plan: workflow:debug-with-file

## Scope: Docs (.claude/commands)

1. Clarify session identity and resume
   - Define how `bugSlug` is derived and how collisions are handled.
   - Define resume precedence (debug.log content vs understanding.md presence).
2. Specify `debug.log` NDJSON schema + redaction rules
   - Minimal required fields and safe-value guidance.
3. Add a cleanup checklist
   - Remove instrumentation, re-run tests/repro, and ensure logs do not contain secrets.
4. Address `/workflow:debug` comparison accuracy
   - Either remove "existing command" implication or introduce the missing command doc intentionally (separate work item).

## Scope: Tooling (ccw/src) (Optional / Only If Needed)

1. If future automation is desired: add a small helper for session folder path derivation under existing `.workflow/*` conventions (keep it minimal; reuse existing patterns).

## Validation

- Evidence gate:
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-034/specs/outputs/generated-slash-outline.md`
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-034/specs/outputs/gap-report.md`

