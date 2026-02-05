# Gap Report: workflow:style-extract

## Reference

- Selected reference: /workflow:ui-design:style-extract (`.claude/commands/workflow/ui-design/style-extract.md`)

## P0 Gaps (Must Fix)

- Allowed-tools mismatch vs behavior in the oracle doc:
  - The oracle doc includes `bash(...)` examples and references `Task(ui-design-agent)` while its frontmatter (and this spec) only allow `TodoWrite, Read, Write, Glob, AskUserQuestion`.
  - Decide one: (a) keep tool surface minimal and rewrite the command to rely on `Glob/Read/Write/AskUserQuestion` only, or (b) expand allowed-tools to include what is actually required.
- Command identity vs repo grouping:
  - The server infers groups from path (`workflow/ui-design/...`), but the spec uses `/workflow:style-extract`. If the intended user-facing command is `/workflow:ui-design:style-extract`, update the outline identity (or relocate/configure group assignment).

## P1 Gaps (Should Fix)

- Specify the minimal JSON schema for `analysis-options.json` (fields needed for interactive selection + downstream generation).
- Define an overwrite policy (what to do when outputs already exist) that does not require Bash; use `Glob` for existence checks.
- Clarify base-path auto-detection order when multiple `design-run-*` directories exist (tie-break rule).

## P2 Gaps (Optional)

- Add a short “What gets cached” note (inputs cache vs outputs cache) and when the command should re-run.
- Add a compact “Output summary” format that lists variant directories and key files.

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
| `.claude/commands/workflow/ui-design/style-extract.md` | Existing | docs: `.claude/commands/workflow/ui-design/style-extract.md` / `Overview` ; ts: `ccw/src/core/routes/commands-routes.ts` / `function parseCommandFrontmatter(content: string): CommandMetadata {` | `Test-Path .claude/commands/workflow/ui-design/style-extract.md` ; `rg \"allowed-tools\" .claude/commands/workflow/ui-design/style-extract.md` | Oracle doc + frontmatter parsing rules for command surface |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/workflow/ui-design/style-extract.md` / `Execution Process` ; ts: `ccw/src/core/routes/commands-routes.ts` / `function scanCommandsRecursive(` | `Test-Path ccw/src/core/routes/commands-routes.ts` ; `rg \"scanCommandsRecursive\" ccw/src/core/routes/commands-routes.ts` | Command discovery, grouping, and enable/disable behavior |
| `ccw/src/utils/path-validator.ts` | Existing | docs: `.claude/commands/workflow/ui-design/style-extract.md` / `Phase 0: Setup & Input Validation` ; ts: `ccw/src/utils/path-validator.ts` / `export function getAllowedDirectories(): string[] {` | `Test-Path ccw/src/utils/path-validator.ts` ; `rg \"export function getAllowedDirectories\" ccw/src/utils/path-validator.ts` | Path safety patterns for repo-scoped operations |
| `.workflow/**/.intermediates/style-analysis/analysis-options.json` | Planned | docs: `.claude/commands/workflow/ui-design/style-extract.md` / `Output Structure` ; ts: `ccw/src/utils/file-utils.ts` / `export function readJsonFile(filePath: string): unknown | null {` | `rg \"analysis-options.json\" .claude/commands/workflow/ui-design/style-extract.md` ; `Test-Path <base_path>/.intermediates/style-analysis/analysis-options.json` | Single source of truth for options + user selection |
| `.workflow/**/style-extraction/style-*/design-tokens.json` | Planned | docs: `.claude/commands/workflow/ui-design/style-extract.md` / `design-tokens.json Format` ; ts: `ccw/src/utils/file-utils.ts` / `export function writeTextFile(filePath: string, content: string): void {` | `rg \"design-tokens.json Format\" .claude/commands/workflow/ui-design/style-extract.md` ; `Test-Path <base_path>/style-extraction/style-1/design-tokens.json` | Final artifact contract to validate in Phase 3 |

Notes:
- Use **one row per pointer**.
- Evidence format recommendation:
  - `docs: <file> / <section heading>`
  - `ts: <file> / <function|case|pattern>`

## Implementation Hints (Tooling/Server)

- Command grouping is inferred from `.claude/commands/**` relative paths (e.g., `workflow/ui-design/...`) via `getCommandGroup(...)` in `ccw/src/core/routes/commands-routes.ts`.
- Avoid requiring `Bash` for existence checks; prefer `Glob` + conditional logic in the command workflow.

## Proposed Fix Plan (Minimal)

1. Align identity:
   - Decide whether the canonical invocation is `/workflow:style-extract` or `/workflow:ui-design:style-extract`, and adjust doc location/config accordingly.
2. Align allowed-tools:
   - If keeping the minimal tool surface, remove/replace `bash(...)` and `Task(ui-design-agent)` references from the doc and outline the generation steps using only allowed tools.
3. Define `analysis-options.json` contract:
   - Add a minimal schema and make interactive selection updates explicit and deterministic.
4. Add deterministic validation:
   - Use `Glob` to verify expected files exist; fail with clear messages when missing/empty.

