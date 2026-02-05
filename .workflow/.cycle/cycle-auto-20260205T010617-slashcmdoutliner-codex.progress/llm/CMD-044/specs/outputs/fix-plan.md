# Fix Plan: workflow:replan

## Goal

Close any gaps between the generated outlines and the oracle command doc while passing P0 quality gates (including evidence verification).

## Steps (Minimal)

1. Evidence gate (P0)
   - Run:
     - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-044/specs/outputs/generated-slash-outline.md`
     - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-044/specs/outputs/gap-report.md`
   - If an anchor is missing, update the evidence cell to a literal string that exists in the referenced file.

2. Artifact path alignment (P1)
   - Ensure all backup/manifest paths stay under:
     - `.workflow/active/{session_id}/.process/backup/replan-{timestamp}/`
   - Keep the restore command in the manifest scoped to the session directory.

3. Mode + interaction clarity (P1)
   - Make sure the outline clearly distinguishes:
     - Session mode (session-wide changes)
     - Task mode (single task updates)
   - Ensure interactive clarification is bounded (few questions) and respects option limits.

4. Validation + errors (P1)
   - Keep explicit failure modes: missing session, missing task, invalid JSON, task limit exceeded, circular dependency.

