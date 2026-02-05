# Gap Report: issue:discover-by-prompt

## Reference

- Selected reference: /issue:discover (`.claude/commands/issue/discover.md`)

## P0 Gaps (Must Fix)

1. Discovery session compatibility with CCW discovery routes
   - The server routes and dashboard tooling expect discoveries under `.workflow/issues/discoveries/` with a `perspectives/` folder and `DSC-`-prefixed discovery IDs; the oracle doc for this command describes `iterations/` and a `DBP-` prefix.
   - Impact: sessions created by `/issue:discover-by-prompt` may not appear in `/api/discoveries` or in any discovery UI that depends on `ccw/src/core/routes/discovery-routes.ts`.

2. Output artifact contract mismatch (iterations vs perspectives)
   - The generated outline follows the oracle doc (writes `iterations/{N}/{dimension}.json`), but the existing discovery tooling reads per-perspective files (e.g. `perspectives/bug.json`).
   - Either emit compatible `perspectives/{dimension}.json` (derived from the latest iteration) or extend the discovery routes to support the iterations layout.

## P1 Gaps (Should Fix)

1. Missing concrete schema file for Gemini exploration plan
   - The oracle doc references an `exploration-plan-schema.json`, but no such file is present under `.claude/workflows/cli-templates/schemas/`.
   - Decide: add the schema file (preferred if strict validation is desired) or update the doc/outline to treat plan validation as best-effort.

2. Tool naming consistency for Exa search
   - The oracle uses `mcp__exa__search(*)`; the repo tooling may also expose other Exa MCP entrypoints. Confirm the canonical tool name in this environment before relying on it in orchestration logic.

## P2 Gaps (Optional)

1. Persisting “plan-only” outputs
   - If a plan-only mode is desired, consider persisting the exploration plan to the discovery session folder for reproducibility (with redaction/safety constraints).

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/issue/discover-by-prompt.md` | Existing | docs: `.claude/commands/issue/discover-by-prompt.md` / `Output File Structure` ; ts: `ccw/src/core/routes/discovery-routes.ts` / `perspectives/` | `Test-Path .claude/commands/issue/discover-by-prompt.md` | Oracle doc describes `DBP-*` + `iterations/` layout |
| `ccw/src/core/routes/discovery-routes.ts` | Existing | docs: `.claude/commands/issue/discover-by-prompt.md` / `Related Commands` ; ts: `ccw/src/core/routes/discovery-routes.ts` / `entry.name.startsWith('DSC-')` | `Test-Path ccw/src/core/routes/discovery-routes.ts` | Existing discovery tooling currently filters to `DSC-` directories |
| `.claude/workflows/cli-templates/schemas/discovery-state-schema.json` | Existing | docs: `.claude/commands/issue/discover-by-prompt.md` / `Schema References` ; ts: `ccw/src/core/routes/discovery-routes.ts` / `discovery-state.json` | `Test-Path .claude/workflows/cli-templates/schemas/discovery-state-schema.json` | Schema used to keep discovery state compatible with server expectations |
| `.claude/workflows/cli-templates/schemas/exploration-plan-schema.json` | Planned | docs: `.claude/commands/issue/discover-by-prompt.md` / `Schema References` ; ts: `ccw/src/core/routes/discovery-routes.ts` / `.workflow/issues/discoveries/` | `Test-Path .claude/workflows/cli-templates/schemas/exploration-plan-schema.json` | Add if strict validation of Gemini planning output is required |

## Implementation Hints (Tooling/Server)

- `ccw/src/core/routes/discovery-routes.ts` is the current source-of-truth for what discovery sessions look like on disk (IDs, folders, and files it reads).
- If you keep the iterative layout, prefer a compatibility layer:
  - write `perspectives/{dimension}.json` as a “latest snapshot” (or flattened view), derived from the iteration outputs
  - keep `iterations/` for internal iteration tracking

## Proposed Fix Plan (Minimal)

1. Align discovery IDs and filesystem layout with server expectations:
   - Prefer `{DISCOVERY_ID}` prefix `DSC-` (or extend server routes to accept `DBP-`).
   - Emit `perspectives/{dimension}.json` compatible with existing discovery routes (or add iteration support in the server).
2. Decide on plan schema:
   - Add `.claude/workflows/cli-templates/schemas/exploration-plan-schema.json`, or remove strict-schema claims from docs/outline.
3. Validate end-to-end:
   - Create one discovery session and confirm `/api/discoveries` and `/api/discoveries/:id/findings` include it.
