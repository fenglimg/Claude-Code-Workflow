---
name: docs-full-cli
description: Generate full project documentation using CLI execution (Layer 3->1) with batched agents (4 modules/agent) and gemini->qwen->codex fallback, <20 modules uses direct parallel
argument-hint: "[path] [--tool <gemini|qwen|codex>]"
allowed-tools: AskUserQuestion(*), Bash(*), Task(*)
group: memory
---

# Full Documentation Generation - CLI Mode (/memory:docs-full-cli)

## Overview

- Goal: Generate complete project/module documentation into `.workflow/docs/` using a layer-based (deep-to-shallow) strategy with batching and tool fallback.
- Command: `/memory:docs-full-cli`

## Usage

```bash
/memory:docs-full-cli [path] [--tool <gemini|qwen|codex>]
```

## Inputs

- Required inputs:
  - (none)
- Optional inputs:
  - `path` (positional): target directory; default current directory
  - `--tool <gemini|qwen|codex>`: primary CLI tool; default gemini

## Outputs / Artifacts

- Writes:
  - `.workflow/docs/{project_name}/**/*.md`
- Reads:
  - repository files under `<path>`
  - `~/.claude/workflows/cli-templates/prompts/documentation/*` (pre-existing)

## Implementation Pointers

- Command doc: `.claude/commands/memory/docs-full-cli.md`
- Likely code locations:
  - `ccw/src/tools/get-modules-by-depth.ts`
  - `ccw/src/tools/classify-folders.ts`
  - `ccw/src/tools/generate-module-docs.ts`
  - `ccw/src/tools/cli-executor-core.ts`
  - `ccw/src/tools/claude-cli-tools.ts`
  - `ccw/src/tools/command-registry.ts`

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/memory/docs-full-cli.md` | Existing | docs: `.claude/commands/memory/docs-full-cli.md` / `Full Documentation Generation - CLI Mode (/memory:docs-full-cli)` ; ts: `ccw/src/tools/command-registry.ts` / `parseYamlHeader(content: string)` | `Test-Path .claude/commands/memory/docs-full-cli.md` | Source of truth for behavior + required frontmatter; TS anchor shows how YAML headers are parsed in-registry patterns. |
| `ccw/src/tools/get-modules-by-depth.ts` | Existing | docs: `.claude/commands/memory/docs-full-cli.md` / `Phase 1: Discovery & Analysis` ; ts: `ccw/src/tools/get-modules-by-depth.ts` / `name: 'get_modules_by_depth',` | `Test-Path ccw/src/tools/get-modules-by-depth.ts; rg \"name: 'get_modules_by_depth',\" ccw/src/tools/get-modules-by-depth.ts` | Module discovery primitive used to enumerate directories for layer/strategy assignment. |
| `ccw/src/tools/classify-folders.ts` | Existing | docs: `.claude/commands/memory/docs-full-cli.md` / `Phase 1: Discovery & Analysis` ; ts: `ccw/src/tools/classify-folders.ts` / `name: 'classify_folders',` | `Test-Path ccw/src/tools/classify-folders.ts; rg \"name: 'classify_folders',\" ccw/src/tools/classify-folders.ts` | Folder classification that informs which modules to document (code vs navigation). |
| `ccw/src/tools/generate-module-docs.ts` | Existing | docs: `.claude/commands/memory/docs-full-cli.md` / `Phase 3A: Direct Execution (<20 modules)` ; ts: `ccw/src/tools/generate-module-docs.ts` / `name: 'generate_module_docs',` | `Test-Path ccw/src/tools/generate-module-docs.ts; rg \"name: 'generate_module_docs',\" ccw/src/tools/generate-module-docs.ts` | Primary generator invoked per-module (full/single) and for project-level docs (project-readme/project-architecture/http-api). |
| `ccw/src/tools/cli-executor-core.ts` | Existing | docs: `.claude/commands/memory/docs-full-cli.md` / `Tool Fallback Hierarchy` ; ts: `ccw/src/tools/cli-executor-core.ts` / `async function executeCliTool(` | `Test-Path ccw/src/tools/cli-executor-core.ts; rg \"async function executeCliTool\\(\" ccw/src/tools/cli-executor-core.ts` | Central CLI execution + error surface used by gemini/qwen/codex invocation and retries. |
| `ccw/src/tools/claude-cli-tools.ts` | Existing | docs: `.claude/commands/memory/docs-full-cli.md` / `Tool Fallback Hierarchy` ; ts: `ccw/src/tools/claude-cli-tools.ts` / `const builtinTools = ['gemini', 'qwen', 'codex', 'claude', 'opencode'];` | `Test-Path ccw/src/tools/claude-cli-tools.ts; rg \"const builtinTools = \\['gemini', 'qwen', 'codex', 'claude', 'opencode'\\];\" ccw/src/tools/claude-cli-tools.ts` | Tool config + availability baseline for gemini/qwen/codex selection and fallback planning. |

## Execution Process

1. Parse args
   - `path` positional (optional); default to `.`.
   - `--tool` (optional); default `gemini`.
2. Discovery & analysis (CLI, no writes yet)
   - Enumerate modules: `ccw tool exec get_modules_by_depth`.
   - Classify modules (code vs navigation): `ccw tool exec classify_folders`.
   - Compute layer/strategy:
     - Layer 3 (depth >= 3): strategy `full`
     - Layer 2-1 (depth <= 2): strategy `single`
3. Plan presentation (must gate execution)
   - Display: project name, module count, tool order (primary + fallback), batching mode.
   - Ask confirmation (y/n) via `AskUserQuestion(*)`.
4. Execute (two modes)
   - If module count < 20: direct parallel execution within each layer (cap concurrency at 4).
   - If module count >= 20: batch modules into groups of 4 and delegate each batch to a worker via `Task(*)`.
   - For each module, run `ccw tool exec generate_module_docs` with computed strategy and tool fallback order.
5. Project-level docs
   - At project root, generate: `README.md`, `ARCHITECTURE.md`, `EXAMPLES.md`, and optional HTTP API docs (when routes detected).
6. Verification
   - Validate output under `.workflow/docs/{project_name}/`.
   - Summarize totals (success/fail), tool usage counts, and failed module list.

## Error Handling

- Invalid path / no repo root: abort with a clear message (do not create `.workflow/docs`).
- Missing `ccw` tool or tool execution failure:
  - retry with fallback tool order (gemini/qwen/codex) on non-zero exit code
  - isolate failures (continue remaining modules) and report final failed list
- User declines plan confirmation: abort with no changes.
- Verification failure (missing expected docs files): report discrepancies and stop (do not claim success).

## Examples

```bash
# Full project documentation generation
/memory:docs-full-cli

# Target a specific directory
/memory:docs-full-cli src/features/auth

# Choose a primary tool (fallback still applies)
/memory:docs-full-cli --tool qwen
```

