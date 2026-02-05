# Agent Outline: cli:codex-review

## Purpose

Implement and/or evolve `/cli:codex-review` to provide an interactive review runner that delegates execution to `ccw cli --tool codex --mode review`.

## Execution Model

- Default: incremental, testable changes.
- Primary loop: validate inputs -> (optional) AskUserQuestion-guided selection -> build command -> execute -> present results.
- Evidence-first: use existing command docs + ccw CLI implementation to avoid inventing behavior.

## State & Artifacts

- Source command doc:
  - `.claude/commands/cli/codex-review.md`
- Runtime artifacts (created by `ccw cli`, not by the command doc itself):
  - CLI execution history / caches (location depends on storage configuration; legacy under `.workflow/.cli-history`).

## Tooling

- Allowed tools: Bash(*), AskUserQuestion(*), Read(*)
- Non-negotiables:
  - no unrelated changes
  - enforce/communicate: target flags are mutually exclusive with `[PROMPT]`

## Implementation Checklist

1. Validate command doc frontmatter and headings (P0 sections present; allowed-tools correct).
2. Confirm ccw CLI arg surface supports the described flags (`--uncommitted|--base|--commit|--title`).
3. Confirm ccw CLI behavior matches the doc constraint (prompt skipped when using review target flags).
4. If behavior diverges:
   - DOC scope: update `.claude/commands/cli/codex-review.md` to match actual ccw CLI behavior.
   - CODE scope: adjust `ccw/src/commands/cli.ts` to restore intended behavior; add/update tests.

## Evidence Table (Docs + TS)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/cli/codex-review.md` | Existing | docs: `.claude/commands/cli/codex-review.md` / `Codex Review Command (/cli:codex-review)` ; ts: `ccw/src/core/routes/commands-routes.ts` / `return join(projectPath, '.claude', 'commands');` | `Test-Path .claude/commands/cli/codex-review.md` | slash command doc + command discovery path |
| `ccw/src/cli.ts` | Existing | docs: `.claude/commands/cli/codex-review.md` / `Integration Notes` ; ts: `ccw/src/cli.ts` / `.option('--uncommitted', 'Review uncommitted changes (codex review)')` | `Test-Path ccw/src/cli.ts` | CLI flag surface |
| `ccw/src/commands/cli.ts` | Existing | docs: `.claude/commands/cli/codex-review.md` / `Validation Constraints` ; ts: `ccw/src/commands/cli.ts` / `// codex review: --uncommitted, --base, --commit are all mutually exclusive with [PROMPT]` | `Test-Path ccw/src/commands/cli.ts` | enforcement of the prompt/flag constraint |
| `ccw/src/tools/template-discovery.ts` | Existing | docs: `.claude/commands/cli/codex-review.md` / `Prompt Template Format` ; ts: `ccw/src/tools/template-discovery.ts` / `export function loadProtocol(mode: string): string {` | `Test-Path ccw/src/tools/template-discovery.ts` | template/protocol loading when prompt-mode is used |
| `ccw/src/config/storage-paths.ts` | Existing | docs: `.claude/commands/cli/codex-review.md` / `Integration Notes` ; ts: `ccw/src/config/storage-paths.ts` / `cliHistory: (projectPath: string) => join(projectPath, '.workflow', '.cli-history'),` | `Test-Path ccw/src/config/storage-paths.ts` | legacy history path reference for execution artifacts |

## Validation Strategy

- P0 gates:
  - frontmatter + allowed-tools + core sections + artifact references
  - evidence tables pass `verify-evidence.js`
- Runtime validation (manual):
  - try representative invocations (prompt-mode vs target-flag-mode) and confirm mutual-exclusivity behavior.
