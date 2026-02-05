# Fix Plan: workflow:lite-execute

## Goal

Bring `/workflow:lite-execute` documentation and implementation alignment to P0 quality gates (tools, artifacts, and verifiable pointers) with minimal churn.

## Tasks

1. Tool boundary audit (P0)
   - Decide and document how file reads/writes occur (especially `.workflow/project-tech.json`):
     - Option A: performed via `Bash` (e.g., node script / ccw cli) so `allowed-tools` stays `TodoWrite, Task, Bash`.
     - Option B: performed via direct `Read/Write` tooling, in which case update `allowed-tools` in the command doc.
   - Verify:
     - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-038/specs/outputs/gap-report.md`

2. Execution mode clarity (P1)
   - Add a concise decision matrix for Mode 1/2/3 including plan.json detection and fallbacks.
   - Verify:
     - Run the command in each mode with a small input and confirm behavior matches docs.

3. Fixed ID + resume contract (P1)
   - Document (and if needed, implement) deterministic ID generation for batches and review, plus `--resume` chaining rules.
   - Verify:
     - Execute one CLI batch with `--id <fixed>` then resume with `--resume <fixed>` and confirm context continuity.

## Done When

- Evidence tables in generated outputs pass `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js`.
- No P0 gaps remain for tools/sections/artifact references in the outline.