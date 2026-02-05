# Fix Plan: workflow:lite-fix

## Scope

Tighten the `/workflow:lite-fix` command doc and outline so the workflow is unambiguous (severity -> diagnosis -> plan -> handoff), while keeping the lite-family patterns consistent.

## P0 (Must)

1. Evidence + pointer hygiene
   - Ensure every evidence-row pointer remains verifiable and dual-sourced.
   - Verify:
     - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-039/specs/outputs/generated-slash-outline.md`
     - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-039/specs/outputs/gap-report.md`

2. Severity mapping + hotfix behavior
   - Add/verify a single, explicit mapping:
     - severity level -> (diagnosis depth, clarification rounds, planning strategy, confirmation requirements)
     - `--hotfix` overrides (minimal diagnosis, smallest safe change set, stronger rollback guidance).

3. Handoff bundle contract to `/workflow:lite-execute`
   - Define the canonical artifacts passed to execution (manifest + fix plan + clarifications + any selected strategy flags), and which file is the “source of truth”.

## P1 (Should)

4. Missing project context fallback
   - If `.workflow/project-tech.json` and/or `.workflow/project-guidelines.json` are missing, document the fallback:
     - prompt user to run `/workflow:init` (preferred), OR proceed with reduced context and record the limitation.
   - Verify (repo existence is optional):
     - `Test-Path .workflow/project-tech.json`
     - `Test-Path .workflow/project-guidelines.json`

## P2 (Optional)

5. Add two concrete examples
   - file input example
   - issue-reference input example

6. Troubleshooting quick table
   - diagnosis worker failure, planning fallback, clarification timeout, escalation criteria