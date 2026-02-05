---
name: issue:discover-by-prompt
description: Discover issues from user prompt with Gemini-planned iterative multi-agent exploration. Uses ACE semantic search for context gathering and supports cross-module comparison (e.g., frontend vs backend API contracts).
argument-hint: "[-y|--yes] <prompt> [--scope=src/**] [--depth=standard|deep] [--max-iterations=5]"
allowed-tools: Skill(*), TodoWrite(*), Read(*), Bash(*), Task(*), AskUserQuestion(*), Glob(*), Grep(*), mcp__ace-tool__search_context(*), mcp__exa__search(*)
group: issue
---

# Issue Discovery by Prompt

## Overview

- Goal: Discover and summarize actionable issue candidates from a user-provided prompt, with optional cross-module comparison.
- Command: `/issue:discover-by-prompt`

## Usage

```bash
/issue:discover-by-prompt [-y|--yes] "<prompt>" [--scope=src/**] [--depth=standard|deep] [--max-iterations=5]
```

## Inputs

- Required inputs:
  - `prompt`: user description of what to check / compare / validate
- Optional inputs:
  - `-y|--yes`: auto-continue iterations (skip confirmations)
  - `--scope=<glob>`: restrict exploration to one or more path globs (comma-separated allowed)
  - `--depth=standard|deep`: affects iteration strategy and thoroughness
  - `--max-iterations=<N>`: upper bound for iterative exploration loop

## Outputs / Artifacts

- Writes:
  - `.workflow/issues/discoveries/{DISCOVERY_ID}/discovery-state.json`
  - `.workflow/issues/discoveries/{DISCOVERY_ID}/iterations/{N}/{dimension}.json`
  - `.workflow/issues/discoveries/{DISCOVERY_ID}/comparison-analysis.json` (only if comparison intent)
  - `.workflow/issues/discoveries/{DISCOVERY_ID}/discovery-issues.jsonl`
- Reads:
  - `.claude/workflows/cli-templates/schemas/discovery-state-schema.json`
  - `.claude/workflows/cli-templates/schemas/discovery-finding-schema.json`

## Implementation Pointers

- Command doc: `.claude/commands/issue/discover-by-prompt.md`
- Likely code locations:
  - `.claude/commands/issue/discover-by-prompt.md` (orchestration: phases + artifacts)
  - `.claude/commands/issue/discover.md` (baseline discovery storage + conventions)
  - `.claude/commands/workflow/tools/context-gather.md` (agent-based context gathering patterns)
  - `.claude/agents/cli-execution-agent.md` (Gemini CLI invocation patterns)
  - `.claude/workflows/cli-templates/schemas/discovery-state-schema.json` (state schema reference)
  - `.claude/workflows/cli-templates/schemas/discovery-finding-schema.json` (finding schema reference)
  - `ccw/src/core/routes/discovery-routes.ts` (dashboard/server expectations for discoveries folder)
  - `ccw/src/core/routes/nav-status-routes.ts` (discovery count for navigation/status)
  - `ccw/src/tools/cli-executor-utils.ts` (CLI tool invocation wiring; ensures gemini/claude execution)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/issue/discover-by-prompt.md` | Existing | docs: `.claude/commands/issue/discover-by-prompt.md` / `Quick Start` ; ts: `ccw/src/core/routes/discovery-routes.ts` / `.workflow/issues/discoveries/` | `Test-Path .claude/commands/issue/discover-by-prompt.md` | Primary command spec/oracle and artifact definitions |
| `.claude/commands/issue/discover.md` | Existing | docs: `.claude/commands/issue/discover-by-prompt.md` / `Related Commands` ; ts: `ccw/src/core/routes/discovery-routes.ts` / `discovery-issues.jsonl` | `Test-Path .claude/commands/issue/discover.md` | Closest reference for discovery conventions and downstream flows |
| `.claude/commands/workflow/tools/context-gather.md` | Existing | docs: `.claude/commands/issue/discover-by-prompt.md` / `Phase 1.5: ACE Context Gathering` ; ts: `ccw/src/core/routes/discovery-routes.ts` / `API Endpoints:` | `Test-Path .claude/commands/workflow/tools/context-gather.md` | Reusable context-gathering patterns for iterative exploration |
| `.claude/agents/cli-execution-agent.md` | Existing | docs: `.claude/commands/issue/discover-by-prompt.md` / `Phase 2: Gemini Strategy Planning` ; ts: `ccw/src/tools/cli-executor-utils.ts` / `case 'claude':` | `Test-Path .claude/agents/cli-execution-agent.md` | Canonical CLI execution patterns (Gemini/Qwen/Codex) |
| `.claude/workflows/cli-templates/schemas/discovery-state-schema.json` | Existing | docs: `.claude/commands/issue/discover-by-prompt.md` / `Schema References` ; ts: `ccw/src/core/routes/discovery-routes.ts` / `discovery-state.json` | `Test-Path .claude/workflows/cli-templates/schemas/discovery-state-schema.json` | Defines persisted session state format |
| `.claude/workflows/cli-templates/schemas/discovery-finding-schema.json` | Existing | docs: `.claude/commands/issue/discover-by-prompt.md` / `Schema References` ; ts: `ccw/src/core/routes/discovery-routes.ts` / `GET    /api/discoveries/:id/findings` | `Test-Path .claude/workflows/cli-templates/schemas/discovery-finding-schema.json` | Defines per-dimension findings output |
| `ccw/src/core/routes/discovery-routes.ts` | Existing | docs: `.claude/commands/issue/discover-by-prompt.md` / `Output File Structure` ; ts: `ccw/src/core/routes/discovery-routes.ts` / `function getDiscoveriesDir(projectPath: string): string {` | `Test-Path ccw/src/core/routes/discovery-routes.ts` | Server/dashboards depend on discovery folder and file naming |
| `.claude/workflows/cli-templates/schemas/exploration-plan-schema.json` | Planned | docs: `.claude/commands/issue/discover-by-prompt.md` / `Schema References` ; ts: `ccw/src/core/routes/discovery-routes.ts` / `discovery-state.json` | `Test-Path .claude/workflows/cli-templates/schemas/exploration-plan-schema.json` | If implementing strict validation for Gemini plan output, provide a real schema file |

## Execution Process

1. Parse args (`prompt`, `--scope`, `--depth`, `--max-iterations`, auto mode).
2. Initialize a discovery session:
   - Generate `{DISCOVERY_ID}` and create `.workflow/issues/discoveries/{DISCOVERY_ID}/`.
   - Seed `discovery-state.json` with configuration and iteration counters.
3. Phase 1.5: Gather codebase context with ACE semantic search:
   - Use `mcp__ace-tool__search_context` against `--scope` (or default scope) to identify relevant modules/files.
4. Phase 2: Gemini strategy planning:
   - Build a planning prompt that embeds key ACE context.
   - Run `ccw cli` with `--tool gemini --mode analysis` to produce a structured exploration plan (JSON).
5. Phase 3: Iterative agent exploration:
   - For each iteration (bounded by `--max-iterations`):
     - Derive ACE queries from the plan and/or accumulated findings.
     - Launch dimension agents (e.g. `Task` subagent `cli-explore-agent`) with scoped prompts.
     - Persist per-dimension findings to `iterations/{N}/{dimension}.json`.
     - Update `discovery-state.json` with iteration summary and progress.
6. Phase 4: Cross-analysis & synthesis:
   - If comparison intent detected, produce `comparison-analysis.json`.
7. Phase 5: Issue generation:
   - Emit issue candidates to `discovery-issues.jsonl` and provide a short terminal summary.

## Error Handling

- Invalid args / missing `prompt`: show usage and stop.
- `--max-iterations` not a positive integer: default to 5 and warn.
- ACE context empty under `--scope`: widen scope or continue with best-effort.
- Gemini output not valid JSON: retry once with stricter prompt; if still invalid, stop and keep partial artifacts.
- Per-iteration agent failure: record error in `discovery-state.json` and either continue (auto mode) or ask to proceed.

## Examples

```bash
/issue:discover-by-prompt "Check if frontend API calls match backend implementations"
```

```bash
/issue:discover-by-prompt "Verify auth flow consistency between mobile and web clients" --scope=src/auth/**,src/mobile/**
```

```bash
/issue:discover-by-prompt "Find all places where error handling is inconsistent" --depth=deep --max-iterations=8
```

```bash
/issue:discover-by-prompt "Compare REST API definitions with frontend fetch calls"
```

