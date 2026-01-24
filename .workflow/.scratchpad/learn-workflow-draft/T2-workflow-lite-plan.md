# T2: /workflow:lite-plan Implementation Patterns (Lightweight 5-Phase Planning)

## Overview

`/workflow:lite-plan` is a lightweight, interactive planning workflow that adapts based on complexity and codebase uncertainty. It combines **(1) exploration**, **(2) clarifications**, and **(3) schema-driven planning** into a single orchestrated flow, then hands off execution to `/workflow:lite-execute --in-memory`.

Key properties:

- Planning only (no code changes). Execution is delegated to `lite-execute`.
- Dynamic exploration: auto-detect or force with `--explore`.
- Complexity-adaptive planning: Low -> direct planning; Medium/High -> `cli-lite-planning-agent`.
- Multi-round clarification: `AskUserQuestion` is rate-limited, so questions are batched and repeated until exhausted.

## High-Level Architecture

### 5-Phase Flow (Decision Branches)

```
Phase 1: Task Analysis & Exploration Decision
  - assess complexity: Low / Medium / High
  - decide needsExploration:
      --explore flag OR task requires codebase context -> true
  - if needsExploration:
      spawn parallel cli-explore-agent with angle presets

Phase 2: Clarification (optional, multi-round)
  - aggregate clarification_needs across exploration angles
  - ask up to 4 questions per round; repeat while still pending

Phase 3: Planning (schema-driven; NO code execution)
  - Low: direct planning against plan-json-schema
  - Medium/High: cli-lite-planning-agent generates plan.json

Phase 4: Confirmation & Selection
  - user selects Allow / Modify / Cancel
  - user selects execution mode (Agent / Codex / Auto)
  - optional review mode (Gemini / Agent / Skip)

Phase 5: Execute
  - build executionContext (plan + explorations + clarifications + selections)
  - SlashCommand(\"/workflow:lite-execute --in-memory\")
```

## Session Folder Contract

`/workflow:lite-plan` persists intermediate planning artifacts under a deterministic session folder:

```
.workflow/.lite-plan/{sessionId}/
  - exploration-{angle}.json
  - explorations-manifest.json
  - plan.json
```

This folder is the state boundary between exploration, clarification, planning, and the final handoff.

## Complexity Assessment and Strategy Selection

Complexity is assessed as `Low | Medium | High`. This impacts:

- How many exploration angles are spawned.
- Whether to use `cli-lite-planning-agent` (Medium/High) or direct planning (Low).
- How much structure the resulting plan should contain (more risks/verification details for higher complexity).

## Exploration (Parallel, Multi-Angle)

### needsExploration Decision

Exploration is enabled when:

- The user passes `--explore` / `-e`, or
- The task references specific files/modules, needs architecture understanding, or will modify existing code.

Additionally, there is a context protection rule: if file reading would exceed a threshold, exploration is forced.

### Angle Presets

`/workflow:lite-plan` uses preset exploration angles to cover different risk surfaces:

- `feature`: patterns, integration points, testing, dependencies
- `architecture`: dependencies, modularity, integration points
- `security`: auth patterns, data flow, validation
- `performance`: bottlenecks, caching, data access
- `bugfix`: error handling, edge cases, state management

Each angle produces `exploration-{angle}.json` and includes `integration_points` with file:line references (from the exploration agent).

## Clarification (Multi-Round AskUserQuestion)

Exploration outputs include `clarification_needs`. The orchestrator:

1. Aggregates and deduplicates questions across angles.
2. Asks up to 4 questions per call.
3. Repeats until all clarification needs are satisfied.

## Planning (Schema-Driven)

### Schema: plan-json-schema.json

The output plan is contract-defined by `plan-json-schema.json` and must include:

- top-level: `summary`, `approach`, `tasks`, `estimated_time`, `recommended_execution`, `complexity`, `_metadata`
- per-task: `id`, `title`, `scope`, `action`, `description`, `modification_points`, `implementation`, `acceptance`, etc.

### Medium/High: cli-lite-planning-agent

For Medium/High complexity, the orchestrator invokes `cli-lite-planning-agent` with a schema reference and a context package (manifest + clarifications). The agent reads the schema first and then generates a plan object conforming to it.

## Handoff to Execution

The final phase builds an in-memory `executionContext` and invokes:

- `/workflow:lite-execute --in-memory`

This decouples planning from execution and makes the execution phase reproducible with the same plan artifacts.

## CCW CLI Execution Substrate (Relevant for Planning Agents)

`cli-explore-agent` / `cli-lite-planning-agent` typically execute external CLIs (Gemini/Qwen/Codex). CCW provides:

- HTTP routes for CLI execution (e.g. `/api/cli/execute`)
- Core executor logic (`executeCliTool`) with spawn + streaming + conversation persistence

## Code References (Implementation Evidence)

- `.claude/commands/workflow/lite-plan.md:5` - allowed tools include `TodoWrite`, `Task`, `SlashCommand`, `AskUserQuestion`.
- `.claude/commands/workflow/lite-plan.md:18` - complexity-adaptive planning (Low vs Medium/High).
- `.claude/commands/workflow/lite-plan.md:43` - exploration decision and parallel cli-explore-agent spawning.
- `.claude/commands/workflow/lite-plan.md:50` - clarification phase uses `AskUserQuestion` with batching.
- `.claude/commands/workflow/lite-plan.md:83` - session folder `.workflow/.lite-plan/${sessionId}`.
- `.claude/commands/workflow/lite-plan.md:90` - `needsExploration` decision logic (explicit criteria list).
- `.claude/commands/workflow/lite-plan.md:104` - context protection rule forces exploration on large file reads.
- `.claude/commands/workflow/lite-plan.md:114` - `analyzeTaskComplexity` and Low/Medium/High.
- `.claude/commands/workflow/lite-plan.md:122` - angle preset map (architecture/security/performance/bugfix/feature).
- `.claude/commands/workflow/lite-plan.md:133` - keyword-based preset selection for exploration angles.
- `.claude/commands/workflow/lite-plan.md:159` - orchestrator spawns parallel exploration tasks with assigned angles.
- `.claude/commands/workflow/lite-plan.md:296` - multi-round clarification requirement (AskUserQuestion limit).
- `.claude/commands/workflow/lite-plan.md:408` - medium/high complexity invokes `cli-lite-planning-agent`.
- `.claude/agents/cli-explore-agent.md:11` - exploration agent role (read-only; dual-source).
- `.claude/agents/cli-explore-agent.md:19` - mandatory schema validation protocol when schema specified.
- `.claude/agents/cli-lite-planning-agent.md:41` - schema-first rule (read schema to determine structure).
- `.claude/agents/cli-lite-planning-agent.md:151` - complexity affects which fields are added (Low vs Medium vs High).
- `.claude/workflows/cli-templates/schemas/plan-json-schema.json:6` - root required plan fields.
- `.claude/workflows/cli-templates/schemas/plan-json-schema.json:58` - `modification_points` item requirements.
- `ccw/src/core/routes/cli-routes.ts:604` - `/api/cli/execute` endpoint for tool execution.
- `ccw/src/tools/cli-executor-core.ts:392` - `executeCliTool` orchestrates CLI execution (streaming/resume/persistence).

