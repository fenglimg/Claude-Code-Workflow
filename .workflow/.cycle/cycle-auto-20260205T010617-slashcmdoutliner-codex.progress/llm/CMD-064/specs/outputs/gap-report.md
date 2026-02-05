# Gap Report: workflow:tools:test-concept-enhanced

## Reference

- Selected reference: /workflow:tools:test-concept-enhanced (`.claude/commands/workflow/tools/test-concept-enhanced.md`)

## P0 Gaps (Must Fix)

- Missing `allowed-tools` in reference command frontmatter (breaks CCW quality gate #1/#2; also prevents tooling/UI from reliably surfacing tool surface).
- Reference doc lacks explicit sections required by the slash-command-outline template: `Usage`, `Inputs`, `Outputs / Artifacts`, and `Implementation Pointers` (including evidence table).
- Multi-colon invocation (`/workflow:tools:...`) should be explicitly documented in `Usage` and examples to avoid ambiguity with `/workflow:<name>` consumers.

## P1 Gaps (Should Fix)

- Add a concise output validation checklist (what constitutes a complete `TEST_ANALYSIS_RESULTS.md`, required sections, and failure modes).
- Make fallback behavior concrete: when Gemini fails, define the minimal schema for a synthesized `TEST_ANALYSIS_RESULTS.md` derived from the context package.

## P2 Gaps (Optional)

- Cross-link adjacent workflow/tools commands (upstream context gather, downstream task generation) and keep naming consistent across docs.

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
| `.claude/commands/workflow/tools/test-concept-enhanced.md` | Existing | docs: `.claude/commands/workflow/tools/test-concept-enhanced.md / Overview` ; ts: `ccw/src/core/routes/commands-routes.ts / parseCommandFrontmatter` | `Test-Path .claude/commands/workflow/tools/test-concept-enhanced.md` | Oracle command behavior + headings used for docs evidence |
| `.claude/commands/workflow/tools/test-context-gather.md` | Existing | docs: `.claude/commands/workflow/tools/test-context-gather.md / Integration` ; ts: `ccw/src/core/routes/commands-routes.ts / scanCommandsRecursive` | `Test-Path .claude/commands/workflow/tools/test-context-gather.md` | Upstream dependency that produces test-context-package.json |
| `.claude/commands/workflow/tools/test-task-generate.md` | Existing | docs: `.claude/commands/workflow/tools/test-task-generate.md / Execution Process` ; ts: `ccw/src/core/routes/commands-routes.ts / scanCommandsRecursive` | `Test-Path .claude/commands/workflow/tools/test-task-generate.md` | Downstream command consuming TEST_ANALYSIS_RESULTS.md |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/workflow/tools/test-context-gather.md / Overview` ; ts: `ccw/src/core/routes/commands-routes.ts / getCommandsDir` | `Test-Path ccw/src/core/routes/commands-routes.ts; rg \"getCommandsDir\" ccw/src/core/routes/commands-routes.ts` | Commands scanning + frontmatter parsing for metadata/allowed-tools |
| `ccw/src/tools/cli-executor-core.ts` | Existing | docs: `.claude/commands/workflow/tools/test-concept-enhanced.md / Execution Lifecycle` ; ts: `ccw/src/tools/cli-executor-core.ts / async function executeCliTool(` | `Test-Path ccw/src/tools/cli-executor-core.ts; rg \"async function executeCliTool(\" ccw/src/tools/cli-executor-core.ts` | CLI execution core used by Gemini-based analysis runs |

## Implementation Hints (Tooling/Server)

- `ccw/src/core/routes/commands-routes.ts` parses `allowed-tools` from YAML frontmatter (`parseCommandFrontmatter`) and includes it in `CommandInfo.allowedTools`; adding `allowed-tools` to the command doc enables tooling to surface/validate the intended tool surface.
- The reference command doc already describes a 3-phase lifecycle; map that into template sections (`Usage`, `Inputs`, `Outputs / Artifacts`, `Error Handling`) without copying full prose (keep non-leaky).

## Proposed Fix Plan (Minimal)

- Docs (P0): Update `.claude/commands/workflow/tools/test-concept-enhanced.md` frontmatter to include `allowed-tools` consistent with actual operations (Task + Read/Write + optional Glob).
- Docs (P0): Add minimal `Usage`, `Inputs`, `Outputs / Artifacts`, and `Implementation Pointers` sections (with evidence table) following the template.
- Docs (P1): Add explicit output validation checklist + concrete fallback schema for synthesized `TEST_ANALYSIS_RESULTS.md`.

