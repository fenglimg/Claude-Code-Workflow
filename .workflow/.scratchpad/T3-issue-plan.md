# T3: /issue:plan Implementation Patterns (Closed-Loop Issue Planning)

## Overview

`/issue:plan` is a unified planning command that batch-processes issue IDs, delegates each batch to `issue-plan-agent` (explore + plan in one closed loop), registers the resulting solutions, and binds issues to solutions (auto-bind when there is only one viable solution; otherwise require user selection).

The command is designed for queue-based execution: issues become planned by binding a chosen solution, then `/issue:queue` and `/issue:execute` can run them.

## High-Level Architecture

### 4-Phase Flow (Data + Control)

```
Phase 1: Issue Loading & Intelligent Grouping
  - load brief metadata for issues (fast)
  - group semantically similar issues into batches (default max 3)

Phase 2: Unified Explore + Plan (issue-plan-agent) [PARALLEL BY BATCH]
  - build batch prompt including issue IDs/titles/tags
  - spawn issue-plan-agent tasks (run_in_background=true)
  - wait for task outputs and parse JSON summaries

Phase 3: Solution Registration & Binding
  - register solutions (jsonl)
  - if exactly 1 solution per issue: execute bind immediately
  - if 2+ solutions: return pending_selection for user choice, then bind

Phase 4: Summary
  - print planned count and next commands
```

## Phase 1: Issue Loading and Batch Grouping

### Loading Strategy (Brief vs Full)

The orchestrator should prefer brief listing for performance and only fetch full details when needed:

- `ccw issue list --status pending --brief` for minimal fields
- `ccw issue status <id> --json` for deep details (typically in the agent)

### Batch Size and Grouping

- Default `--batch-size` is 3.
- Grouping is described as semantic similarity (e.g. by title/tags), intended to reduce redundant exploration and unify shared changes.

## Phase 2: issue-plan-agent (Closed Loop)

### Agent Role

`issue-plan-agent` performs both discovery and planning:

- Uses ACE semantic search for code discovery (primary).
- Falls back to other search methods when ACE is unavailable.
- Generates schema-compliant solutions with quantified acceptance criteria.

### Parallel Execution

The orchestrator spawns one agent per batch and then waits for outputs. A chunking limit is used to cap concurrency.

## Phase 3: Solution Registration and Binding

### Solution Registration

Solutions are stored as JSON lines and must conform to `solution-schema.json`.

### Binding Rules

- If an issue yields exactly **1** solution: bind automatically (`ccw issue bind <issue> <solution>`).
- If an issue yields **2+** solutions: return `pending_selection` to the user, then bind the chosen solution.

This keeps the workflow closed-loop and makes the planned state explicit via `bound_solution_id`.

## Schema Contract: solution-schema.json

The solution object is contract-defined by `.claude/workflows/cli-templates/schemas/solution-schema.json`.

Highlights:

- Root required fields: `id`, `tasks`, `is_bound`, `created_at`.
- Each task requires: `id`, `title`, `scope`, `action`, `implementation`, `acceptance`.
- Each task includes `modification_points` plus `test` and optional `depends_on`.
- A solution can include a recommended commit message template (`commit.type`, `commit.scope`, `commit.message_template`).

## Conflict Detection and Resolution Strategies (Pattern)

There is an explicit intent to aggregate batch results for conflict handling. A practical conflict pattern is:

- Compare `modification_points[].file` across all planned tasks/solutions.
- If multiple solutions touch the same file or overlapping targets, either:
  - enforce an execution order (by `depends_on`), or
  - merge tasks into a single coordinated solution, or
  - split into separate solutions and require user selection.

In the current workflow, conflict handling is primarily delegated to the planning agent and validated at bind/queue time.

## CCW Server Integration Points

### Issue CRUD + Binding

CCW exposes issue endpoints for listing, updating, and binding. Binding is implemented by setting `bound_solution_id` on the issue record.

### CLI Tool Execution (for Agents)

Agents use CCW's CLI execution substrate to run external tools (Gemini/Qwen/Codex) and persist conversations. This is shared with workflow planning commands.

## Code References (Implementation Evidence)

- `.claude/commands/issue/plan.md:3` - command description (closed-loop via issue-plan-agent).
- `.claude/commands/issue/plan.md:4` - argument-hint includes `--batch-size`.
- `.claude/commands/issue/plan.md:52` - batch size flag and default (3).
- `.claude/commands/issue/plan.md:58` - phase 1 grouping and semantic similarity note.
- `.claude/commands/issue/plan.md:64` - phase 2 uses issue-plan-agent (per batch).
- `.claude/commands/issue/plan.md:73` - phase 3 registers + binds solutions.
- `.claude/commands/issue/plan.md:77` - binding updates `bound_solution_id` in issues storage.
- `.claude/commands/issue/plan.md:90` - `batchSize = flags.batchSize || 3`.
- `.claude/commands/issue/plan.md:145` - batches -> agent tasks prompt construction.
- `.claude/commands/issue/plan.md:177` - single vs multiple solutions branching.
- `.claude/commands/issue/plan.md:209` - `Task(subagent_type=\"issue-plan-agent\", run_in_background=true, ...)`.
- `.claude/commands/issue/plan.md:235` - binding verification loop for agent-reported binds.
- `.claude/commands/issue/plan.md:255` - pending selection interactive binding.
- `.claude/agents/issue-plan-agent.md:11` - closed-loop role: fetch issue details, ACE explore, generate solutions.
- `.claude/agents/issue-plan-agent.md:129` - ACE semantic search is primary exploration mechanism.
- `.claude/agents/issue-plan-agent.md:142` - explicit fallback chain (ACE -> smart_search -> Grep -> rg -> Glob).
- `.claude/agents/issue-plan-agent.md:206` - agent executes `ccw issue bind ...` when only 1 solution.
- `.claude/agents/issue-plan-agent.md:333` - explicit single-solution bind vs multi-solution pending selection.
- `.claude/workflows/cli-templates/schemas/solution-schema.json:6` - root required fields (`id`, `tasks`, `is_bound`, `created_at`).
- `.claude/workflows/cli-templates/schemas/solution-schema.json:27` - per-task required fields.
- `.claude/workflows/cli-templates/schemas/solution-schema.json:65` - per-task `test` structure.
- `.claude/workflows/cli-templates/schemas/solution-schema.json:100` - `depends_on` task dependencies.
- `ccw/src/core/routes/issue-routes.ts:15` - issue route surface (CRUD + solutions + tasks).
- `ccw/src/core/routes/issue-routes.ts:280` - `bindSolutionToIssue(...)` helper.
- `ccw/src/core/routes/issue-routes.ts:1300` - PATCH update handles `bound_solution_id` binding/unbinding.
- `ccw/src/tools/cli-executor-core.ts:392` - `executeCliTool` used for external CLI execution (agents).

