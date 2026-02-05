# Gap Report: cli:codex-review

## Reference

- Selected reference: /cli:codex-review (`.claude/commands/cli/codex-review.md`)

## P0 Gaps (Must Fix)

- None.

## P1 Gaps (Should Fix)

- Keep the doc's model list and examples in sync with any changes to ccw CLI flags (documentation drift risk).
- If ccw CLI behavior changes, ensure the doc still accurately states the mutual-exclusivity constraint and template-skipping behavior.

## P2 Gaps (Optional)

- Add a short troubleshooting snippet for common codex CLI failures (tool not installed, auth/config issues).

## Implementation Pointers (Evidence)

You MUST provide an evidence table for all key implementation pointers mentioned in the outlines.

Rules (P0):
- Every pointer MUST be labeled `Existing` or `Planned`.
- `Existing` MUST be verifiable (path exists). Include a concrete `Verify` command for each existing pointer.
- Do NOT describe `Planned` pointers as “validated/exists”.
- Evidence MUST reference BOTH sources somewhere in this section:
  - command docs: `.claude/commands/**.md` (section heading is enough)
  - TypeScript implementation: `ccw/src/**` (function name / subcommand case / ripgrep-able string)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/cli/codex-review.md` | Existing | docs: `.claude/commands/cli/codex-review.md` / `Codex Review Command (/cli:codex-review)` ; ts: `ccw/src/core/routes/commands-routes.ts` / `return join(projectPath, '.claude', 'commands');` | `Test-Path .claude/commands/cli/codex-review.md` | canonical command doc |
| `ccw/src/cli.ts` | Existing | docs: `.claude/commands/cli/codex-review.md` / `Integration Notes` ; ts: `ccw/src/cli.ts` / `.option('--uncommitted', 'Review uncommitted changes (codex review)')` | `Test-Path ccw/src/cli.ts; rg "Review uncommitted changes (codex review)" ccw/src/cli.ts` | CLI surface for review flags |
| `ccw/src/commands/cli.ts` | Existing | docs: `.claude/commands/cli/codex-review.md` / `Validation Constraints` ; ts: `ccw/src/commands/cli.ts` / `// codex review: --uncommitted, --base, --commit are all mutually exclusive with [PROMPT]` | `Test-Path ccw/src/commands/cli.ts; rg "skipTemplates" ccw/src/commands/cli.ts` | constraint enforcement + template skipping |
| `ccw/src/tools/template-discovery.ts` | Existing | docs: `.claude/commands/cli/codex-review.md` / `Prompt Template Format` ; ts: `ccw/src/tools/template-discovery.ts` / `export function loadProtocol(mode: string): string {` | `Test-Path ccw/src/tools/template-discovery.ts` | protocol/template loader used by ccw cli |
| `ccw/src/config/storage-paths.ts` | Existing | docs: `.claude/commands/cli/codex-review.md` / `Integration Notes` ; ts: `ccw/src/config/storage-paths.ts` / `cliHistory: (projectPath: string) => join(projectPath, '.workflow', '.cli-history'),` | `Test-Path ccw/src/config/storage-paths.ts` | legacy history path; helps explain where artifacts land |

## Implementation Hints (Tooling/Server)

- `ccw/src/commands/cli.ts` explicitly treats review mode with `--uncommitted|--base|--commit` as a prompt-less execution path (skip templates and avoid passing a prompt).
- `ccw/src/cli.ts` exposes codex review flags on the `ccw cli` command, enabling the slash command doc to delegate without inventing parameters.
- Command discovery/serving relies on the `.claude/commands` directory (see `ccw/src/core/routes/commands-routes.ts`).

## Proposed Fix Plan (Minimal)

- DOC: Ensure `.claude/commands/cli/codex-review.md` keeps the mutual-exclusivity constraint prominently documented.
- DOC: Periodically validate examples against `ccw cli --help` output (flags and defaults can drift).
- CODE (only if drift is found): adjust `ccw/src/commands/cli.ts` to preserve review-mode constraints; add a targeted regression test.
