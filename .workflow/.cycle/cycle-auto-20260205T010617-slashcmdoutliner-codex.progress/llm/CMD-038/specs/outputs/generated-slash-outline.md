---
name: lite-execute
description: Execute tasks based on in-memory plan, prompt description, or file content
argument-hint: "[-y|--yes] [--in-memory] [\"task description\"|file-path]"
allowed-tools: TodoWrite(*), Task(*), Bash(*)
group: workflow
---

# Workflow Lite-Execute Command (/workflow:lite-execute)

## Overview

- Goal: Execute a set of tasks from an in-memory plan, a prompt, or a file; orchestrate Agent/CLI execution with progress tracking and optional review.
- Command: `/workflow:lite-execute`

## Usage

```bash
/workflow:lite-execute [-y|--yes] [--in-memory] ["task description"|file-path]
```

## Inputs

- Required inputs:
  - `<INPUT>`: task description string OR file path (.md/.txt/.json, including a plan.json)
- Optional inputs:
  - `-y, --yes`: auto-confirm defaults (execution=Auto, review=Skip)
  - `--in-memory`: use `executionContext` set by `/workflow:lite-plan` (skip interactive selection)

## Outputs / Artifacts

- Writes:
  - `.workflow/project-tech.json` (optional; append a `development_index` entry if the file exists)
  - In-memory: `executionContext` (read-only consumption; results collected for reporting/resume)
- Reads:
  - `.workflow/project-guidelines.json` (if present; injected into CLI/agent context)
  - `.workflow/project-tech.json` (if present; used for development index update)
  - `executionContext.session.artifacts.plan` (plan.json) when `--in-memory`
  - `executionContext.session.artifacts.explorations_manifest` + exploration JSONs (optional)
  - `<INPUT file-path>` when Mode 3

## Implementation Pointers

- Command doc: `.claude/commands/workflow/lite-execute.md`
- Likely code locations:
  - `ccw/src/tools/command-registry.ts` (loads workflow command markdown + frontmatter)
  - `ccw/src/core/routes/commands-routes.ts` (command discovery/listing)
  - `ccw/src/tools/cli-executor-core.ts` (CLI execution + resume plumbing)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/lite-execute.md` | Existing | docs: `.claude/commands/workflow/lite-execute.md` / `Overview` ; ts: `ccw/src/tools/command-registry.ts` / `commandName.startsWith('/workflow:')` | `Test-Path .claude/commands/workflow/lite-execute.md` | Oracle command doc for /workflow:lite-execute |
| `.claude/commands/workflow/lite-plan.md` | Existing | docs: `.claude/commands/workflow/lite-execute.md` / `Mode 1: In-Memory Plan` ; ts: `ccw/src/tools/command-registry.ts` / `const filePath = join(this.commandDir, `${normalized}.md`);` | `Test-Path .claude/commands/workflow/lite-plan.md` | Upstream planner that sets `executionContext` for --in-memory mode |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/lite-execute.md` / `Usage` ; ts: `ccw/src/tools/command-registry.ts` / `commandName.startsWith('/workflow:')` | `Test-Path ccw/src/tools/command-registry.ts` | Workflow command loader + frontmatter parsing for allowed-tools/argument-hint |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/workflow/lite-execute.md` / `Usage` ; ts: `ccw/src/core/routes/commands-routes.ts` / `scanCommandsRecursive(projectDir, projectDir, 'project', projectPath);` | `Test-Path ccw/src/core/routes/commands-routes.ts` | Command discovery (project vs user) used by the server/UI to enumerate commands |
| `ccw/src/tools/cli-executor-core.ts` | Existing | docs: `.claude/commands/workflow/lite-execute.md` / `Step 3: Launch Execution` ; ts: `ccw/src/tools/cli-executor-core.ts` / `import { executeLiteLLMEndpoint } from './litellm-executor.js';` | `Test-Path ccw/src/tools/cli-executor-core.ts` | Core implementation for running `ccw cli` executions and supporting resume behaviors |

## Execution Process

1. Parse flags and input, then select input mode:
   - Mode 1 (`--in-memory`): consume `executionContext` (set by `/workflow:lite-plan`).
   - Mode 2 (prompt): treat `<INPUT>` as a task description; build a minimal plan and selection defaults (or honor `--yes`).
   - Mode 3 (file): read file content; if JSON and matches `plan.json` shape, treat as plan; else treat as prompt text.
2. Initialize execution tracking:
   - Build execution-call batches from tasks.
   - Emit a batch-level todo list via `TodoWrite` (parallel vs sequential indicator).
3. Group tasks and create execution calls:
   - Use explicit `depends_on` from plan.json only.
   - Derive parallel groups + ordered sequential batches.
4. Launch execution:
   - For each batch, resolve executor (task-level assignment overrides global method; Auto selects by complexity).
   - Agent execution: `Task(...)` with a per-task prompt assembled from the unified template.
   - CLI execution: `Bash(...)` calling `ccw cli -p "..." --tool <codex|gemini> --mode <write|analysis> --id <fixed-id> [--resume <prev-id>]`.
5. Progress tracking:
   - Before/after each sequential batch, update todo status via `TodoWrite`.
   - Collect per-batch results for final reporting and resume continuity.
6. Optional code review:
   - If enabled, run selected review method (Agent or `ccw cli --mode review`) with plan.json and relevant context.
7. Update development index:
   - If `.workflow/project-tech.json` exists, append a `development_index` entry derived from plan metadata and execution results.

## Error Handling

- Missing `executionContext` in `--in-memory` mode: return an explicit error and exit.
- File not found / empty file: return a clear error including the path.
- JSON parse failures: treat as plain text input.
- Plan JSON missing required fields: warn and fall back to plain text input.
- Execution failures/timeouts: surface failure summary; allow resume via fixed IDs (`--resume <id>` chains).

## Examples

```bash
# Mode 1: called after /workflow:lite-plan sets executionContext
/workflow:lite-execute --in-memory -y "execute"

# Mode 2: prompt description
/workflow:lite-execute -y "Add unit tests for command-registry and run them"

# Mode 3: file content
/workflow:lite-execute ".workflow/.lite-plan/SESSION_ID/plan.json"
```