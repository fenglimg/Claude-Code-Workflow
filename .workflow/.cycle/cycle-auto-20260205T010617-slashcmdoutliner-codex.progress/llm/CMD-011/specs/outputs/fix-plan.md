# Fix Plan: issue:discover-by-prompt

## P0 (Must)

1. [server][routes] Make discovery sessions created by this command visible to existing discovery tooling
   - Option A (preferred, minimal server change): write compatible layout
     - Use `{DISCOVERY_ID}` prefix `DSC-...` (match `ccw/src/core/routes/discovery-routes.ts`)
     - Emit `perspectives/{dimension}.json` as the latest snapshot view (derived from iteration outputs)
     - Keep `iterations/{N}/...` for internal iteration tracking (optional)
   - Option B: extend server tooling
     - Update `ccw/src/core/routes/discovery-routes.ts` to accept `DBP-...` and to read `iterations/` in addition to `perspectives/`

2. [docs] Keep the command doc consistent with the implemented/compatible on-disk contract
   - Update `.claude/commands/issue/discover-by-prompt.md` “Output File Structure” to reflect the chosen compatibility approach.

## P1 (Should)

1. [schemas] Resolve exploration plan schema reference
   - Add `.claude/workflows/cli-templates/schemas/exploration-plan-schema.json` (if strict validation is required), OR
   - Downgrade to best-effort validation and remove the hard dependency from docs.

2. [tools] Confirm Exa MCP tool name used by CCW runtime
   - Ensure the command’s allowed-tools and orchestration call the canonical Exa tool entrypoint exposed in this environment.

## Validation (Post-Fix)

1. Create a sample discovery session and verify it is surfaced:
   - `Test-Path .workflow/issues/discoveries/{DISCOVERY_ID}`
   - Confirm the API listing includes it (via the CCW server that serves `/api/discoveries`).
2. Run evidence gates for documentation artifacts:
   - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-011/specs/outputs/generated-slash-outline.md`
   - `node .codex/skills/slash-command-outliner/scripts/verify-evidence.js --file=.workflow/.cycle/cycle-auto-20260205T010617-slashcmdoutliner-codex.progress/llm/CMD-011/specs/outputs/gap-report.md`

