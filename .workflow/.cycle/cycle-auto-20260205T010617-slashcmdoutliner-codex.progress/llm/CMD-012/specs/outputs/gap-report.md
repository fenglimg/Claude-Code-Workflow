# Gap Report: issue:discover

## Reference

- Selected reference: /issue:discover (`.claude/commands/issue/discover.md`)

## P0 Gaps (Must Fix)

- None detected for the generated outline: frontmatter + required sections + explicit artifacts + evidence tables are present.

## P1 Gaps (Should Fix)

- Naming consistency: the oracle command doc uses `name: issue:discover` while most `issue/*` command docs use short names (e.g. `name: plan`). Decide on a consistent convention (and update derivation tooling that infers group/name from path if needed).

## P2 Gaps (Optional)

- Tighten perspective validation UX: echo invalid values and show the allowed list in one line.
- Consider documenting how discovery IDs are generated (format + uniqueness expectations).

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/issue/discover.md` | Existing | docs: `.claude/commands/issue/discover.md` / `Quick Start` ; ts: `ccw/src/core/routes/discovery-routes.ts` / `function getDiscoveriesDir(projectPath: string): string {` | `Test-Path .claude/commands/issue/discover.md` ; `rg "function getDiscoveriesDir" ccw/src/core/routes/discovery-routes.ts` | Oracle doc + concrete implementation of discovery storage for dashboard |
| `ccw/src/core/routes/discovery-routes.ts` | Existing | docs: `.claude/commands/issue/discover.md` / `Dashboard Integration` ; ts: `ccw/src/core/routes/discovery-routes.ts` / `function getDiscoveriesDir(projectPath: string): string {` | `Test-Path ccw/src/core/routes/discovery-routes.ts` ; `rg "function getDiscoveriesDir" ccw/src/core/routes/discovery-routes.ts` | API endpoints for listing/exporting discovery sessions |
| `ccw/src/tools/template-discovery.ts` | Existing | docs: `.claude/commands/issue/discover.md` / `Schema References` ; ts: `ccw/src/tools/template-discovery.ts` / `const TEMPLATES_BASE_DIR = join(homedir(), '.claude', 'workflows', 'cli-templates');` | `Test-Path ccw/src/tools/template-discovery.ts` ; `rg "TEMPLATES_BASE_DIR" ccw/src/tools/template-discovery.ts` | Template/schema path resolution underpinning prompt + schema usage |
| `ccw/src/tools/cli-executor-core.ts` | Existing | docs: `.claude/commands/issue/discover.md` / `Execution Flow` ; ts: `ccw/src/tools/cli-executor-core.ts` / `const isWindows = process.platform === 'win32';` | `Test-Path ccw/src/tools/cli-executor-core.ts` ; `rg "const isWindows = process\\.platform === 'win32';" ccw/src/tools/cli-executor-core.ts` | Cross-platform CLI execution core (gemini/qwen/codex chain) |
| `.codex/prompts/issue-discover.md` | Existing | docs: `.claude/commands/issue/discover.md` / `How It Works` ; ts: `ccw/src/commands/cli.ts` / `async function execAction(positionalPrompt: string | undefined, options: CliExecOptions): Promise<void> {` | `Test-Path .codex/prompts/issue-discover.md` ; `rg "async function execAction\\(" ccw/src/commands/cli.ts` | Orchestration prompt reference + CLI execution entrypoint |

## Implementation Hints (Tooling/Server)

- Dashboard reads discovery sessions from `.workflow/issues/discoveries/` and serves list/detail/export endpoints via `ccw/src/core/routes/discovery-routes.ts`.
- CLI execution plumbing for gemini/qwen/codex is centralized in `ccw/src/tools/cli-executor-core.ts` and wired through `ccw/src/commands/cli.ts`.

## Proposed Fix Plan (Minimal)

- Confirm and document the naming convention (`name` + optional `group`) for issue commands, and align `/issue:discover` doc accordingly.
- Ensure the outline's artifact list matches the dashboard storage schema (index + per-session files) and stays in sync with `discovery-routes`.

