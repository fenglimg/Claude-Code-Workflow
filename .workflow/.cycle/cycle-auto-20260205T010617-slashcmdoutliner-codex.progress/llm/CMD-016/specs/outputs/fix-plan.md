# Fix Plan: issue:plan

## P0 (Must)

1. Evidence tables
   - Run:
     - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-016/specs/outputs/generated-slash-outline.md`
     - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-016/specs/outputs/gap-report.md`
   - If any row fails: downgrade Status to Planned and/or fix anchors to match literal headings/strings.

2. Pre-req handling for project context
   - Ensure the command doc (or orchestrator flow) explicitly handles missing files:
     - `.workflow/project-tech.json`
     - `.workflow/project-guidelines.json`
   - Recommended behavior: fail fast with instructions to run `/workflow:init` then `/workflow:init-guidelines`.

## P1 (Should)

3. Auto mode consistency
   - Confirm `-y|--yes` bypasses solution-selection prompts and binds recommended solutions.

4. Binding safety
   - Confirm binding happens only via `ccw issue bind <issue-id> <solution-id>` and only when rules allow it (single-solution or user-confirmed).

## Verify

- `Test-Path .claude/commands/issue/plan.md`
- `Test-Path .codex/agents/issue-plan-agent.md`
- `Test-Path ccw/src/commands/issue.ts`
- `rg "case 'bind':" ccw/src/commands/issue.ts`
- `rg "project-tech\.json" ccw/src/core/data-aggregator.ts`
