---
name: load
description: Delegate to universal-executor agent to analyze project via Gemini/Qwen CLI and return JSON core content package for task context
argument-hint: "[--tool gemini|qwen] \"task context description\""
allowed-tools: Task(*), Bash(*)
group: memory
---

# Memory Load Command (/memory:load)

## Overview

- Goal: Analyze the current project and load a structured Core Content Package into memory for subsequent tasks.
- Command: `/memory:load`

## Usage

```bash
/memory:load [--tool gemini|qwen] "task context description"
```

## Inputs

- Required inputs:
  - `"task context description"`: what context to extract and why
- Optional inputs:
  - `--tool gemini|qwen`: which CLI tool the delegated agent should use (default: gemini)

## Outputs / Artifacts

- Writes:
  - None required (returns a JSON Core Content Package in-chat and loads into memory)
- Reads:
  - Project working tree as needed for analysis (source, configs, docs)

## Implementation Pointers

- Command doc: `.claude/commands/memory/load.md`
- Existing likely code locations (tooling used by the delegated agent):
  - `ccw/src/tools/cli-executor-utils.ts`
  - `ccw/src/tools/claude-cli-tools.ts`
  - `ccw/src/tools/core-memory.ts`

### Evidence (Existing vs Planned)

You MUST label each pointer as `Existing` (verifiable in repo now) or `Planned` (will be created/modified).

Rules:
- `Existing` MUST include evidence from BOTH:
  - a command doc source: `.claude/commands/**.md` (section heading is sufficient)
  - a TypeScript source: `ccw/src/**` (function name / subcommand case / a ripgrep-able string)
- If you cannot verify, downgrade to `Planned` and add a concrete `Verify` step (e.g. `Test-Path <path>`, `rg "<pattern>" <path>`).

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/memory/load.md` | Existing | docs: `.claude/commands/memory/load.md` / `Memory Load Command (/memory:load)` ; ts: `ccw/src/tools/cli-executor-utils.ts` / `case 'gemini':` | `Test-Path .claude/commands/memory/load.md` | Source-of-truth command behavior and examples |
| `ccw/src/tools/cli-executor-utils.ts` | Existing | docs: `.claude/commands/memory/load.md` / `Step 3: Deep Analysis via CLI` ; ts: `ccw/src/tools/cli-executor-utils.ts` / `case 'gemini':` | `Test-Path ccw/src/tools/cli-executor-utils.ts` | CLI invocation + structured output mode (stream-json) for gemini/qwen |
| `ccw/src/tools/claude-cli-tools.ts` | Existing | docs: `.claude/commands/memory/load.md` / `2. Parameters` ; ts: `ccw/src/tools/claude-cli-tools.ts` / `defaultTool: 'gemini',` | `Test-Path ccw/src/tools/claude-cli-tools.ts` | Central definition of supported builtin tools and default tool selection |
| `ccw/src/tools/core-memory.ts` | Existing | docs: `.claude/commands/memory/load.md` / `4. Core Content Package Structure` ; ts: `ccw/src/tools/core-memory.ts` / `name: 'core_memory',` | `Test-Path ccw/src/tools/core-memory.ts` | Storage/summary/search substrate for persisting the resulting context package |

## Execution Process

- Parse arguments:
  - Extract required task context description
  - Resolve `--tool` (default: gemini; allow qwen)
- Delegate to a universal-executor agent via `Task(*)`:
  - Provide the task context description and any constraints (read-only; no destructive ops)
- Agent-driven analysis flow (high level):
  - Foundation analysis: identify project type, structure, key entry points
  - Keyword extraction + file discovery: map task description to likely modules and docs
  - Deep analysis via CLI: run gemini/qwen CLI in structured output mode to reduce token usage
  - Generate Core Content Package (JSON): components, data structures, interfaces, patterns, key files
  - Return content package; main thread loads it into memory for follow-on commands

## Error Handling

- Missing/empty task description: request a concrete description and scope.
- Unsupported tool value: fall back to gemini; report accepted values (`gemini|qwen`).
- CLI execution failure (tool not installed, non-zero exit, malformed stream-json): retry with alternate tool or reduced scope; return partial package with error notes.
- Safety: if analysis suggests any write/destructive action, stop and require explicit user confirmation.
- Sensitive data: omit secrets (env vars, tokens, private keys); redact if detected.

## Examples

- `/memory:load "Implement user authentication in the existing frontend"`
- `/memory:load --tool qwen "Refactor the payment module API"`
- `/memory:load "Fix login validation error"`

