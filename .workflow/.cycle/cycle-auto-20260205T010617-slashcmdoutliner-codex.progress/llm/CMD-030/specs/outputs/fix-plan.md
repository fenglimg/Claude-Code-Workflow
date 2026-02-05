# Fix Plan: workflow:brainstorm:role-analysis

## Scope

- Primary: outline/spec alignment and evidence correctness
- Secondary (optional): tooling support for nested brainstorm commands

## Minimal Steps

1) Identity alignment (P0)
   - Canonical command string: `/workflow:brainstorm:role-analysis`
   - Keep `group=workflow:brainstorm` in frontmatter and usage examples

2) Evidence hardening (P0)
   - Run:
     - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-030/specs/outputs/generated-slash-outline.md`
     - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-030/specs/outputs/gap-report.md`

3) Tooling decision (P1)
   - If CCW must list/resolve brainstorm commands programmatically:
     - Extend `ccw/src/tools/command-registry.ts` to recurse under `.claude/commands/workflow/`
     - Add tests to cover nested paths (e.g. `brainstorm/role-analysis.md`)
   - Else:
     - Keep changes doc-only (no TS modifications)

