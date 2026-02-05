# Fix Plan: workflow:session:list

## Minimal Changes

1) Docs scope: confirm argument surface
   - Decide whether `/workflow:session:list` is no-args only (oracle) or supports `--location` / `--recent`.
2) Docs + tooling alignment: pick implementation path
   - Option A (bash-first): keep the command doc as shell-only; document fallbacks when `jq` is unavailable.
   - Option B (tool-first): standardize on `session_manager(operation="list", location=..., include_metadata=true)` and map its result to the documented output format.
3) Validation scope: keep evidence gates green
   - Re-run:
     - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-050/specs/outputs/generated-slash-outline.md`
     - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-050/specs/outputs/gap-report.md`
