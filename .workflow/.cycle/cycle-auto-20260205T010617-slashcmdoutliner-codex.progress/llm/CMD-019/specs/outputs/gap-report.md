# Gap Report: memory:docs-full-cli

## Reference

- Selected reference: /memory:docs-related-cli (`.claude/commands/memory/docs-related-cli.md`)

## P0 Gaps (Must Fix)

- Command doc frontmatter is missing `allowed-tools` (and therefore fails the frontmatter completeness gate) in `.claude/commands/memory/docs-full-cli.md`.
- The command relies on CLI tool execution + fallback behavior; allowed-tools must explicitly include the tools implied by the doc (at least `Bash(*)`, `Task(*)`, plus a user confirmation gate via `AskUserQuestion(*)`).

## P1 Gaps (Should Fix)

- Align wording and thresholds with reference (e.g., direct mode cutoff and concurrency caps) so users can predict behavior across `/memory:*` CLI workflows.
- Make the approval gate explicit in the command doc (use `AskUserQuestion` example snippet instead of plain "Confirm? (y/n)").

## P2 Gaps (Optional)

- Standardize allowed-tools frontmatter across related memory CLI docs (`docs-related-cli`, `update-full`, `update-related`) to reduce drift.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/memory/docs-full-cli.md` | Existing | docs: `.claude/commands/memory/docs-full-cli.md` / `Overview` ; ts: `ccw/src/tools/command-registry.ts` / `parseYamlHeader(content: string)` | `Test-Path .claude/commands/memory/docs-full-cli.md` | Doc is the behavioral contract; TS anchor supports YAML-frontmatter parsing patterns used by command registries. |
| `ccw/src/tools/get-modules-by-depth.ts` | Existing | docs: `.claude/commands/memory/docs-full-cli.md` / `Phase 1: Discovery & Analysis` ; ts: `ccw/src/tools/get-modules-by-depth.ts` / `name: 'get_modules_by_depth',` | `Test-Path ccw/src/tools/get-modules-by-depth.ts` | Module enumeration used to compute layers and batching. |
| `ccw/src/tools/classify-folders.ts` | Existing | docs: `.claude/commands/memory/docs-full-cli.md` / `Phase 1: Discovery & Analysis` ; ts: `ccw/src/tools/classify-folders.ts` / `name: 'classify_folders',` | `Test-Path ccw/src/tools/classify-folders.ts` | Folder classification used to skip non-doc-worthy modules. |
| `ccw/src/tools/generate-module-docs.ts` | Existing | docs: `.claude/commands/memory/docs-full-cli.md` / `Phase 4: Project-Level Documentation` ; ts: `ccw/src/tools/generate-module-docs.ts` / `strategy: z.enum(['full', 'single', 'project-readme', 'project-architecture', 'http-api']),` | `Test-Path ccw/src/tools/generate-module-docs.ts; rg \"strategy: z.enum\\(\\['full', 'single', 'project-readme', 'project-architecture', 'http-api'\\]\\),\" ccw/src/tools/generate-module-docs.ts` | Confirms the generator supports the strategy surface described by the command doc. |
| `ccw/src/tools/cli-executor-core.ts` | Existing | docs: `.claude/commands/memory/docs-full-cli.md` / `Tool Fallback Hierarchy` ; ts: `ccw/src/tools/cli-executor-core.ts` / `async function executeCliTool(` | `Test-Path ccw/src/tools/cli-executor-core.ts` | Base execution primitive for invoking CLI tools and handling failures. |
| `ccw/src/tools/claude-cli-tools.ts` | Existing | docs: `.claude/commands/memory/docs-full-cli.md` / `Tool Fallback Hierarchy` ; ts: `ccw/src/tools/claude-cli-tools.ts` / `const builtinTools = ['gemini', 'qwen', 'codex', 'claude', 'opencode'];` | `Test-Path ccw/src/tools/claude-cli-tools.ts` | Tool configuration + availability surface for gemini/qwen/codex selection. |

## Implementation Hints (Tooling/Server)

- Reuse ccw tool chain already referenced by the command doc:
  - discovery: `get_modules_by_depth` + `classify_folders`
  - generation: `generate_module_docs` with strategy values already supported by schema
- Keep fallback deterministic (tool order based on `--tool`) and report failures without aborting the whole run.

## Proposed Fix Plan (Minimal)

See `fix-plan.md`.

