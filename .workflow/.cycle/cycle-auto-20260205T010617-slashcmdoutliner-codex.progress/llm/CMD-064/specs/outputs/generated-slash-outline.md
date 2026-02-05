---
name: test-concept-enhanced
description: Coordinate test analysis workflow using cli-execution-agent to generate test strategy via Gemini
argument-hint: "--session WFS-test-session-id --context path/to/test-context-package.json"
allowed-tools: Task(*), Read(*), Write(*), Glob(*)
group: workflow
---

# Test Concept Enhanced Command

## Overview

- Goal: Generate actionable test generation strategy and requirements (TEST_ANALYSIS_RESULTS.md) from a prepared test-context-package.json.
- Command: `/workflow:tools:test-concept-enhanced`

## Usage

```bash
/workflow:tools:test-concept-enhanced --session WFS-test-session-id --context path/to/test-context-package.json
```

## Inputs

- Required inputs:
  - `--session <WFS-test-session-id>` (test workflow session id)
  - `--context <path/to/test-context-package.json>`
- Optional inputs:
  - None

## Outputs / Artifacts

- Writes:
  - `.workflow/active/{test_session_id}/.process/gemini-test-analysis.md`
  - `.workflow/active/{test_session_id}/.process/TEST_ANALYSIS_RESULTS.md`
- Reads:
  - `.workflow/active/{test_session_id}/workflow-session.json`
  - `{context_path}` (test-context-package.json)

## Implementation Pointers

- Command doc: `.claude/commands/workflow/tools/test-concept-enhanced.md`
- Likely code locations:
  - `ccw/src/core/routes/commands-routes.ts` (command scanning + frontmatter parsing, incl. allowed-tools)
  - `ccw/src/tools/cli-executor-core.ts` (CLI execution plumbing used by cli-execution-agent for Gemini runs)

### Evidence (Existing vs Planned)

You MUST label each pointer as `Existing` (verifiable in repo now) or `Planned` (will be created/modified).

Rules:
- `Existing` MUST include evidence from BOTH:
  - a command doc source: `.claude/commands/**.md` (section heading is sufficient)
  - a TypeScript source: `ccw/src/**` (function name / subcommand case / a ripgrep-able string)
- If you cannot verify, downgrade to `Planned` and add a concrete `Verify` step (e.g. `Test-Path <path>`, `rg "<pattern>" <path>`).

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/tools/test-concept-enhanced.md` | Existing | docs: `.claude/commands/workflow/tools/test-concept-enhanced.md / Overview` ; ts: `ccw/src/core/routes/commands-routes.ts / parseCommandFrontmatter` | `Test-Path .claude/commands/workflow/tools/test-concept-enhanced.md` | Primary command specification (oracle) |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/workflow/tools/test-context-gather.md / Integration` ; ts: `ccw/src/core/routes/commands-routes.ts / scanCommandsRecursive` | `Test-Path ccw/src/core/routes/commands-routes.ts; rg "scanCommandsRecursive" ccw/src/core/routes/commands-routes.ts` | Commands corpus scanning + frontmatter extraction (allowed-tools, argument-hint) |
| `ccw/src/tools/cli-executor-core.ts` | Existing | docs: `.claude/commands/workflow/tools/test-concept-enhanced.md / Execution Lifecycle` ; ts: `ccw/src/tools/cli-executor-core.ts / async function executeCliTool(` | `Test-Path ccw/src/tools/cli-executor-core.ts; rg "async function executeCliTool(" ccw/src/tools/cli-executor-core.ts` | Underlying CLI execution path used by Gemini analysis runs |

Notes:
- For TS evidence, prefer anchors like `function <name>` / `case '<subcommand>'` / a stable string literal that can be found via `rg`.

## Execution Process

- Input parsing:
  - Parse flags: `--session`, `--context` (both required)
- Phase 1: Context preparation (command responsibility)
  - Load `.workflow/active/{test_session_id}/workflow-session.json`
  - Verify session type is `test-gen` and resolve `source_session_id`
  - Validate `test-context-package.json` required sections: metadata, source_context, test_coverage, test_framework
  - Determine analysis strategy (Simple 1-3 files | Medium 4-6 | Complex >6)
- Phase 2: Test analysis execution (agent responsibility)
  - Invoke `cli-execution-agent` to run Gemini analysis
  - Produce `gemini-test-analysis.md` and synthesize `TEST_ANALYSIS_RESULTS.md`
- Phase 3: Output validation (command responsibility)
  - Verify both output files exist and include required sections
  - Confirm requirements are actionable (scenarios, mocks, dependencies)

## Error Handling

- Validation errors:
  - Missing `--session` / `--context`
  - Missing or invalid context package (recommend `/workflow:tools:test-context-gather`)
  - Invalid or non-test-gen workflow session
- Execution errors:
  - Gemini timeout or incomplete output
  - Missing output files
- Fallback:
  - Generate a minimal `TEST_ANALYSIS_RESULTS.md` from the context package if Gemini fails

## Examples

```bash
/workflow:tools:test-concept-enhanced --session WFS-test-auth --context .workflow/active/WFS-test-auth/.process/test-context-package.json
```

