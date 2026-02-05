# Fix Plan: workflow:tools:task-generate-tdd (CMD-062)

## Minimal Changes (P0)

1. Docs/frontmatter: Add `allowed-tools` to `.claude/commands/workflow/tools/task-generate-tdd.md` (match interactive config + agent invocation + session IO).
2. Docs/paths: Make template pointers verifiable in-repo (prefer `.claude/workflows/cli-templates/prompts/workflow-impl-plan-template.txt`; avoid user-home-only paths unless explicitly supported and documented).
3. Docs/validation: Add an explicit P0 validation checklist for generated tasks (<=18 tasks, each task includes red|green|refactor phases, quantified test cases + coverage targets).

## Recommended Changes (P1)

4. Docs/auto-mode: Document exact defaults for `-y|--yes` (skipped questions, assumed executor/tooling, assumed templates).
5. Docs/integration: Cross-link the chain entrypoints (tdd-plan -> tools:task-generate-tdd -> tdd-verify -> execute) and clarify what artifacts are expected at each phase boundary.

## Optional Improvements (P2)

6. Tooling: Add a quick “first-task sanity check” example snippet in the doc (human-verifiable structure) without introducing new scripts.

## Verification

- Evidence gate:
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-062/specs/outputs/generated-slash-outline.md`
  - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-062/specs/outputs/gap-report.md`

