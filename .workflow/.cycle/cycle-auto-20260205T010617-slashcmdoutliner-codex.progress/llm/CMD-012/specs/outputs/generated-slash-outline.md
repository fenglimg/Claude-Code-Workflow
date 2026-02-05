---
name: discover
description: Discover potential issues from multiple perspectives (bug, UX, test, quality, security, performance, maintainability, best-practices) using CLI explore; optionally enrich with external research.
argument-hint: "[-y|--yes] <path-pattern> [--perspectives=bug,ux,...] [--external]"
allowed-tools: Skill(*), TodoWrite(*), Read(*), Bash(*), Task(*), AskUserQuestion(*), Glob(*), Grep(*)
group: issue
---

# issue:discover

## Overview

- Goal: Produce a scoped discovery session (findings + candidate issues) across multiple perspectives, optionally exportable into the issue workflow.
- Command: `/issue:discover`

## Usage

```bash
/issue:discover <path-pattern> [--perspectives=bug,ux,test,quality,security,performance,maintainability,best-practices] [--external] [-y|--yes]
```

## Inputs

- Required inputs:
  - `<path-pattern>`: file/module glob (may be a comma-separated list)
- Optional inputs:
  - `--perspectives=...`: comma-separated subset of available perspectives
  - `--external`: enable external research for security + best-practices
  - `-y|--yes`: auto-mode (skip confirmations; default to all perspectives)

## Outputs / Artifacts

- Writes:
  - `.workflow/issues/discoveries/index.json`
  - `.workflow/issues/discoveries/{discovery-id}/discovery-state.json`
  - `.workflow/issues/discoveries/{discovery-id}/perspectives/{perspective}.json`
  - `.workflow/issues/discoveries/{discovery-id}/external-research.json`
  - `.workflow/issues/discoveries/{discovery-id}/discovery-issues.jsonl`
  - `.workflow/issues/discoveries/{discovery-id}/summary.md`
  - `.workflow/issues/issues.jsonl` (only when exporting)
- Reads:
  - `<path-pattern>` (resolved file list)
  - `.workflow/project-tech.json` (external research context)
  - `.claude/workflows/cli-templates/schemas/discovery-state-schema.json`
  - `.claude/workflows/cli-templates/schemas/discovery-finding-schema.json`
  - `.claude/workflows/cli-templates/schemas/issues-jsonl-schema.json`

## Implementation Pointers

- Command doc: `.claude/commands/issue/discover.md`
- Likely code locations:
  - `ccw/src/core/routes/discovery-routes.ts` (dashboard: list/export discoveries)
  - `ccw/src/tools/template-discovery.ts` (template path resolution under .claude/workflows/cli-templates)
  - `ccw/src/tools/cli-executor-core.ts` (runs gemini/qwen/codex CLI)
  - `ccw/src/commands/cli.ts` (ccw cli exec wiring)
  - `.codex/prompts/issue-discover.md` (orchestrator prompt template)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/issue/discover.md` | Existing | docs: `.claude/commands/issue/discover.md` / `Quick Start` ; ts: `ccw/src/core/routes/discovery-routes.ts` / `function getDiscoveriesDir(projectPath: string): string {` | `Test-Path .claude/commands/issue/discover.md` ; `rg "function getDiscoveriesDir(projectPath: string): string \\{" ccw/src/core/routes/discovery-routes.ts` | Oracle command doc + concrete storage layout/API integration point |
| `ccw/src/core/routes/discovery-routes.ts` | Existing | docs: `.claude/commands/issue/discover.md` / `Dashboard Integration` ; ts: `ccw/src/core/routes/discovery-routes.ts` / `function getDiscoveriesDir(projectPath: string): string {` | `Test-Path ccw/src/core/routes/discovery-routes.ts` ; `rg "function getDiscoveriesDir" ccw/src/core/routes/discovery-routes.ts` | Implements dashboard endpoints over `.workflow/issues/discoveries/` |
| `ccw/src/tools/template-discovery.ts` | Existing | docs: `.claude/commands/issue/discover.md` / `Core Responsibilities` ; ts: `ccw/src/tools/template-discovery.ts` / `const TEMPLATES_BASE_DIR = join(homedir(), '.claude', 'workflows', 'cli-templates');` | `Test-Path ccw/src/tools/template-discovery.ts` ; `rg "TEMPLATES_BASE_DIR" ccw/src/tools/template-discovery.ts` | Resolves cli-template locations used by discovery prompt/schema references |
| `ccw/src/tools/cli-executor-core.ts` | Existing | docs: `.claude/commands/issue/discover.md` / `How It Works` ; ts: `ccw/src/tools/cli-executor-core.ts` / `const isWindows = process.platform === 'win32';` | `Test-Path ccw/src/tools/cli-executor-core.ts` ; `rg "const isWindows = process\\.platform === 'win32';" ccw/src/tools/cli-executor-core.ts` | Executes the underlying CLI explore chain (Windows-safe spawning) |
| `.codex/prompts/issue-discover.md` | Existing | docs: `.claude/commands/issue/discover.md` / `Execution Flow` ; ts: `ccw/src/commands/cli.ts` / `async function execAction(positionalPrompt: string | undefined, options: CliExecOptions): Promise<void> {` | `Test-Path .codex/prompts/issue-discover.md` ; `rg "async function execAction\\(" ccw/src/commands/cli.ts` | Prompt source for orchestration + CLI execution entrypoint |

## Execution Process

1. Parse args: `<path-pattern>`, optional `--perspectives`, optional `--external`, optional `-y|--yes`.
2. Resolve `<path-pattern>` into a concrete file list (abort with clear error if empty).
3. Determine perspectives:
   - If `--perspectives` provided: validate values against the allowed set.
   - Else (interactive): ask user to select perspectives.
   - If `-y|--yes`: select all perspectives and skip confirmations.
4. Create a new discovery session:
   - Generate `{discovery-id}` and create `.workflow/issues/discoveries/{discovery-id}/perspectives/`.
   - Initialize `discovery-state.json` and update `.workflow/issues/discoveries/index.json`.
5. For each selected perspective, run a `Task` (cli-explore agent) to analyze the resolved files and write findings to `perspectives/{perspective}.json`.
6. If `--external`, run external research tasks for security + best-practices and write `external-research.json`.
7. Synthesize candidate issues into `discovery-issues.jsonl`, and write a single `summary.md`.
8. Ask the user what to do next (unless auto-mode): export to `.workflow/issues/issues.jsonl`, open dashboard guidance, or finish.

## Error Handling

- No files match `<path-pattern>`: abort early with the pattern echoed and a suggestion to narrow/expand.
- Invalid `--perspectives` value(s): list allowed perspectives and show the invalid tokens.
- Task failure for a perspective: record failure in discovery state; continue remaining perspectives unless user aborts.
- `--external` research failure: continue discovery, mark external research as failed/skipped, do not block export.
- Output write failures: surface the specific path that failed and stop to avoid partial/corrupt sessions.

## Examples

```bash
# Interactive perspective selection
/issue:discover src/auth/**

# Select specific perspectives
/issue:discover src/payment/** --perspectives=bug,security,test

# Enable external research
/issue:discover src/api/** --external

# Multiple modules
/issue:discover src/auth/**,src/payment/**
```

