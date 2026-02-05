# Fix Plan: workflow:tools:conflict-resolution

## Scope

- Target doc: `.claude/commands/workflow/tools/conflict-resolution.md`
- Goal: close P0 gaps (frontmatter + evidence-based pointers) with minimal edits.

## Fixes (Minimal)

1) Docs (P0): add missing frontmatter key
- Add: `allowed-tools: Task(*), AskUserQuestion(*), Read(*), Write(*)`
- Verify: `rg "^allowed-tools:" .claude/commands/workflow/tools/conflict-resolution.md`

2) Docs (P1): make artifacts explicit
- Ensure the doc explicitly states:
  - Writes: `.workflow/active/<session>/.process/conflict-resolution.json`
  - Updates (if applicable): `.workflow/active/<session>/.process/context-package.json`
- Verify: `rg "conflict-resolution\\.json" .claude/commands/workflow/tools/conflict-resolution.md`

3) Evidence gate (P0): prevent false Existing claims
- Run:
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-059/specs/outputs/generated-slash-outline.md`
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-059/specs/outputs/gap-report.md`

4) Optional (P2): add a tiny JSON shape example
- Add a short schema-like snippet for `conflict-resolution.json` so downstream tooling can parse it.

## Guardrails

- If any pointer cannot be verified in-repo, mark it as `Planned` and add a concrete verify command.
- Do not expand scope beyond the command doc + minimal evidence pointers.

