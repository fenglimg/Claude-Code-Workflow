---
name: unified-execute-with-file
description: Universal execution engine for consuming any planning/brainstorm/analysis output with minimal progress tracking, multi-agent coordination, and incremental execution
argument-hint: "[-y|--yes] [<path>[,<path2>] | -p|--plan <path>[,<path2>]] [--auto-commit] [--commit-prefix \"prefix\"] [\"execution context or task name\"]"
allowed-tools: TodoWrite(*), Task(*), AskUserQuestion(*), Read(*), Grep(*), Glob(*), Bash(*), Edit(*), Write(*)
group: workflow
---

# Workflow Unified Execute-With-File Command (/workflow:unified-execute-with-file)

## Overview

- Goal: Execute one or more plan files (auto-detected or explicit) with structured, resumable progress tracking and optional git auto-commit.
- Command: `/workflow:unified-execute-with-file`

## Usage

```bash
/workflow:unified-execute-with-file [-y|--yes] [<path>[,<path2>] | -p|--plan <path>[,<path2>]] [--auto-commit] [--commit-prefix "prefix"] ["execution context or task name"]
```

## Inputs

- Required inputs:
  - A plan source: either auto-detected (default) or explicit `<path>` / `--plan <path>`; supports comma-separated multi-plan execution.
- Optional inputs:
  - `-y, --yes` (auto mode: skip prompts/confirmations)
  - `--auto-commit` and `--commit-prefix "<prefix>"`
  - trailing free-text context label (used for session naming/logging)

## Outputs / Artifacts

- Writes:
  - `.workflow/.execution/{sessionId}/execution.md` (plan summary + status table)
  - `.workflow/.execution/{sessionId}/execution-events.md` (unified append-only event log; single source of truth)
- Reads:
  - plan file(s) (from args or auto-detect under `.workflow/`)
  - `.workflow/.execution/**/execution-events.md` when resuming
  - repository files referenced by tasks during execution

## Implementation Pointers

- Command doc: `.claude/commands/workflow/unified-execute-with-file.md`
- Likely code locations:
  - `ccw/src/tools/command-registry.ts` (discover command docs + metadata)
  - `ccw/src/tools/session-manager.ts` (existing workflow session path conventions; `.workflow/*`)
  - `ccw/src/commands/session-path-resolver.ts` (plan/todo path resolution patterns)
  - `ccw/src/core/claude-freshness.ts` (git exec patterns; reuse safety/timeouts for auto-commit)

### Evidence (Existing vs Planned)

You MUST label each pointer as `Existing` (verifiable in repo now) or `Planned` (will be created/modified).

Rules:
- `Existing` MUST include evidence from BOTH:
  - a command doc source: `.claude/commands/**.md` (section heading is sufficient)
  - a TypeScript source: `ccw/src/**` (function name / subcommand case / a ripgrep-able string)
- If you cannot verify, downgrade to `Planned` and add a concrete `Verify` step (e.g. `Test-Path <path>`, `rg "<pattern>" <path>`).

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/unified-execute-with-file.md` | Existing | docs: `.claude/commands/workflow/unified-execute-with-file.md` / `Quick Start` ; ts: `ccw/src/tools/command-registry.ts` / `const relativePath = join('.claude', 'commands', 'workflow');` | `Test-Path .claude/commands/workflow/unified-execute-with-file.md` | primary command doc entrypoint |
| `.workflow/.execution/` | Planned | docs: `.claude/commands/workflow/unified-execute-with-file.md` / `Output Structure` ; ts: `ccw/src/tools/session-manager.ts` / `const WORKFLOW_BASE = '.workflow';` | `Test-Path .workflow/.execution` | new execution session root (created at runtime) |
| `.workflow/.execution/{sessionId}/execution-events.md` | Planned | docs: `.claude/commands/workflow/unified-execute-with-file.md` / `Output Artifacts` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path .workflow/.execution` | unified append-only event log |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/execute.md` / `Workflow File Structure Reference` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path ccw/src/tools/session-manager.ts` | reuse existing workflow session path conventions |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/lite-execute.md` / `Overview` ; ts: `ccw/src/tools/command-registry.ts` / `const relativePath = join('.claude', 'commands', 'workflow');` | `Test-Path ccw/src/tools/command-registry.ts` | command discovery/metadata loader for workflow commands |
| `ccw/src/commands/session-path-resolver.ts` | Existing | docs: `.claude/commands/workflow/execute.md` / `Performance Optimization Strategy` ; ts: `ccw/src/commands/session-path-resolver.ts` / `'IMPL_PLAN.md': 'plan',` | `Test-Path ccw/src/commands/session-path-resolver.ts` | established file-type resolution patterns for plan/todo |
| `ccw/src/core/claude-freshness.ts` | Existing | docs: `.claude/commands/workflow/unified-execute-with-file.md` / `With auto-commit (conventional commits)` ; ts: `ccw/src/core/claude-freshness.ts` / `const output = execSync('git rev-parse HEAD', {` | `Test-Path ccw/src/core/claude-freshness.ts` | git exec patterns + timeouts to borrow for auto-commit safety |

Notes:
- Expand `Likely code locations` into **one row per pointer** (do not keep it as a single aggregated cell).
- For TS evidence, prefer anchors like `function <name>` / `case '<subcommand>'` / a stable string literal that can be found via `rg`.

## Execution Process

1) **Resolve inputs**
   - Parse args: `--plan/-p` vs positional `<path>`; split comma-separated plans; detect `-y/--yes`, `--auto-commit`, `--commit-prefix`.
   - If no plan path: auto-detect from `.workflow/` (project-local conventions).
2) **Initialize session (per plan)**
   - Create `.workflow/.execution/{sessionId}/`.
   - Write/initialize `execution.md` + `execution-events.md`.
3) **Pre-execution validation (agent-assisted)**
   - Read plan file, extract task list and dependencies (if present).
   - Validate referenced files/paths exist; identify risky steps; propose execution method per task (Agent vs CLI) and ask for confirmation unless auto mode.
4) **Run execution loop**
   - Append a structured event for each task start/finish to `execution-events.md`.
   - Use `TodoWrite` to track overall progress and current task.
   - Use `Task(...)` for task execution; pass only paths + context (avoid duplicating the plan content in prompts).
5) **Review checkpoints (optional)**
   - Initialize review configuration section in `execution-events.md`.
   - At configured checkpoints, run a review pass and append findings + next actions.
6) **Auto-commit (optional)**
   - If enabled, after each successful task: stage only task-scoped files and create a conventional commit message (prefixable).
7) **Resume**
   - If `execution-events.md` exists for a session, parse latest state and continue from next pending task.

## Error Handling

- Missing/invalid plan path: prompt with detected candidates; fail with clear message when none exist.
- Plan parse failure: log raw error + recovery (treat as plain-text plan and request clarification).
- Git unavailable / dirty state conflicts (auto-commit): disable auto-commit and continue execution; append event explaining why.
- Partial execution interruption: keep `execution-events.md` append-only; resume from last completed task.
- Tool failures (Task/CLI): retry once with reduced context; otherwise mark task failed and continue/stop based on dependency policy.

## Examples

```bash
# Basic usage (auto-detect plan, ask for execution method)
/workflow:unified-execute-with-file

# Execute a specific plan (positional or -p)
/workflow:unified-execute-with-file .workflow/plans/auth-plan.md
/workflow:unified-execute-with-file -p .workflow/.planning/CPLAN-xxx

# Execute multiple plans sequentially (comma-separated)
/workflow:unified-execute-with-file -y plan-a.json,plan-b.json --auto-commit --commit-prefix "feat(exec)"
```

