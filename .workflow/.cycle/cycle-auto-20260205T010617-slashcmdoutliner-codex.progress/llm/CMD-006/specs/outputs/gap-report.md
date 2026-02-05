# Gap Report: cli:cli-init

## Reference

- Selected reference: /cli:cli-init (`.claude/commands/cli/cli-init.md`)

## P0 Gaps (Must Fix)

- None

## P1 Gaps (Should Fix)

- Settings.json example inconsistency: the reference doc shows `contextfilename` as both an array (early example) and a string (later example). Standardize to one format and keep both tool examples consistent.
- Preview mode output expectations are described, but the reference doc does not define an explicit, stable preview output format (paths + summary). Consider documenting a short, deterministic preview summary.

## P2 Gaps (Optional)

- Consider extracting technology detection + ignore rule templates into a reusable ccw tool to reduce per-command shell heuristics.

## Implementation Pointers (Evidence)

You MUST provide an evidence table for all key implementation pointers mentioned in the outlines.

Rules (P0):
- Every pointer MUST be labeled `Existing` or `Planned`.
- `Existing` MUST be verifiable (path exists). Include a concrete `Verify` command for each existing pointer.
- Do NOT describe `Planned` pointers as "validated/exists".
- Evidence MUST reference BOTH sources somewhere in this section:
  - command docs: `.claude/commands/**.md` (section heading is enough)
  - TypeScript implementation: `ccw/src/**` (function name / subcommand case / ripgrep-able string)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/cli/cli-init.md` | Existing | docs: `.claude/commands/cli/cli-init.md` / `CLI Initialization Command (/cli:cli-init)` ; ts: `ccw/src/core/routes/commands-routes.ts` / `function scanCommandsRecursive(` | `Test-Path .claude/commands/cli/cli-init.md` | canonical slash command doc source |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/cli/cli-init.md` / `Core Functionality` ; ts: `ccw/src/core/routes/commands-routes.ts` / `function scanCommandsRecursive(` | `Test-Path ccw/src/core/routes/commands-routes.ts` | command discovery/serving for `.claude/commands/**.md` |
| `ccw/src/tools/get-modules-by-depth.ts` | Existing | docs: `.claude/commands/cli/cli-init.md` / `Step 2: Workspace Analysis (MANDATORY FIRST)` ; ts: `ccw/src/tools/get-modules-by-depth.ts` / `name: 'get_modules_by_depth',` | `Test-Path ccw/src/tools/get-modules-by-depth.ts` | required tooling for structural scan |
| `ccw/src/commands/workflow.ts` | Existing | docs: `.claude/commands/cli/cli-init.md` / `Generated Files` ; ts: `ccw/src/commands/workflow.ts` / `{ name: '.qwen', description: 'Qwen configuration' }` | `Test-Path ccw/src/commands/workflow.ts` | `.gemini`/`.qwen` treated as workflow sources in installer CLI |
| `ccw/src/commands/install.ts` | Existing | docs: `.claude/commands/cli/cli-init.md` / `Configuration Directories` ; ts: `ccw/src/commands/install.ts` / `const SOURCE_DIRS = ['.claude', '.codex', '.gemini', '.qwen'];` | `Test-Path ccw/src/commands/install.ts` | package install includes `.gemini`/`.qwen` directories |

Notes:
- Use **one row per pointer**.
- Evidence format recommendation:
  - `docs: <file> / <section heading>`
  - `ts: <file> / <function|case|pattern>`

## Implementation Hints (Tooling/Server)

- `ccw/src/tools/get-modules-by-depth.ts`
- `ccw/src/tools/classify-folders.ts` (downstream tool accepts get_modules_by_depth output; useful for optional tech labeling)
- `ccw/src/core/routes/commands-routes.ts` (commands are read from `.claude/commands/**.md`)

## Proposed Fix Plan (Minimal)

- Docs scope: standardize the `settings.json` schema examples and ensure both Gemini/Qwen sections match.
- Docs scope: document a deterministic preview output summary (paths to be created, detected tech list, and whether backups would occur).
- Tooling scope (optional): evaluate adding a dedicated ignore-rule generator tool to reduce repeated shell heuristics.

