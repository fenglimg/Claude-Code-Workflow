# Workflow Implementation Patterns Reference (workflow:plan, workflow:lite-plan, issue:plan)

## Purpose

This document consolidates implementation patterns across:

- `/workflow:plan` (multi-phase orchestrator with agent-driven task generation)
- `/workflow:lite-plan` (lightweight interactive planning with optional exploration)
- `/issue:plan` (closed-loop issue planning with batch agent execution + binding)

Focus areas:

- Slash command declaration and orchestration patterns
- Agent integration (Task spawning, parallelism, result parsing)
- Schema-first contracts and validation
- CCW server / CLI execution substrate
- Discovery methods (ACE first; structured fallbacks)

## 1) Slash Command Declaration and Entry Points

### Declarative Definition (Frontmatter + Path)

- Commands live under `.claude/commands/**.md`.
- The file path implies the slash command name (e.g. `workflow/plan.md` -> `/workflow:plan`).
- YAML frontmatter defines the routing metadata and tool permissions (`allowed-tools`).

Practical implications:

- Orchestrator commands are self-contained executable specs.
- Tool permissions are explicit and auditable (e.g. whether `Task` and `AskUserQuestion` are allowed).

## 2) Orchestrator Patterns (Phases, State, Auto-Continue)

### /workflow:plan: Deterministic Auto-Continue Pipeline

Core behaviors:

- Immediate `TodoWrite` initialization, then phase execution.
- Calls sub-commands via `SlashCommand(...)`.
- Uses TodoWrite attachment/collapse to show sub-task detail during execution.
- Conditional phase insertion (e.g. conflict resolution only if `conflict_risk` is high enough).

### /workflow:lite-plan: Adaptive Pipeline With Decision Branches

Core behaviors:

- Compute `complexity` (Low/Medium/High) and `needsExploration`.
- Optional parallel exploration across multiple angles.
- Clarification is optional and multi-round.
- Planning is schema-driven; Medium/High delegates to `cli-lite-planning-agent`.
- Execution is delegated to `/workflow:lite-execute --in-memory`.

### /issue:plan: Closed-Loop Batch Planning + Binding

Core behaviors:

- Load issues (brief metadata) and group into batches (default 3).
- Spawn `issue-plan-agent` per batch (parallel with chunking).
- Parse agent summaries, register solutions, bind issues:
  - 1 solution -> auto-bind
  - 2+ solutions -> require user selection, then bind

## 3) Agent Integration Patterns

### Task Spawning

Common structure:

- `Task(subagent_type=..., run_in_background=..., description=..., prompt=...)`
- Collect results via `TaskOutput(...)` (blocking) and parse JSON (often from fenced code blocks).

### Parallelism and Chunking

When N batches/angles exist, use chunking to limit concurrency:

```
for i in range(0, tasks.length, MAX_PARALLEL):
  launch chunk (Task x K)
  wait and collect each TaskOutput
```

### Role Specialization

- `action-planning-agent`: generates IMPL_PLAN.md + TODO_LIST.md + task JSON artifacts (planning only).
- `cli-explore-agent`: read-only exploration with schema validation when applicable.
- `cli-lite-planning-agent`: schema-driven plan generation for lite workflows.
- `issue-plan-agent`: closed-loop exploration + solution generation + bind execution for single-solution issues.

## 4) Schema-First Contracts and Validation

### Key Schemas

| Schema | Primary Producer | Primary Consumer | Typical Artifact |
| --- | --- | --- | --- |
| `plan-json-schema.json` | `/workflow:lite-plan` (direct or via `cli-lite-planning-agent`) | `/workflow:lite-execute` and humans | `plan.json` |
| `fix-plan-json-schema.json` | `cli-lite-planning-agent` (fix mode) | fix execution workflow | `fix-plan.json` |
| `solution-schema.json` | `issue-plan-agent` | `/issue:plan` orchestrator + CCW issue store | `solutions/{issue-id}.jsonl` |
| `conflict-resolution-schema.json` | conflict-resolution agent/command | orchestrators | conflict summary artifact |

### Validation Pattern

- Read schema first.
- Copy required field names and enum values exactly.
- Validate structure (root object vs array; required fields at each level).
- Prefer quantified acceptance criteria to prevent ambiguous “done”.

## 5) CCW Server Interaction Patterns (Tool Execution + Persistence)

Even though slash commands execute inside the Claude environment, the workflow relies on CCW for:

- Executing external CLI tools (Gemini/Qwen/Codex/npm install, etc.)
- Streaming or caching outputs
- Resuming or merging conversations across runs
- Serving execution history and status via HTTP routes

Key substrate components:

- `handleCliRoutes(...)` defines routes such as `/api/cli/execute`.
- `executeCliTool(...)` orchestrates spawn + streaming + resume/merge + persistence.
- Issue CRUD and binding routes persist `bound_solution_id` and solution/task edits.

## 6) Discovery Methods (Tool Selection Criteria)

### Default Discovery Priority

1. ACE semantic search (`mcp__ace-tool__search_context`) for broad code understanding
2. Structured search (`smart_search`) when available
3. Fallbacks: `Grep` / `rg` / `Glob` / targeted `Read`

### When to Trigger Exploration

Decision tree (lite-plan):

```
task has --explore?
  -> yes: explore
  -> no:
      mentions specific files OR needs architecture understanding OR modifies existing code?
        -> yes: explore
        -> no: skip exploration
```

## 7) Decision Trees (Common Control Logic)

### A) workflow:lite-plan Planning Strategy

```
complexity == Low
  -> direct planning against plan-json-schema
complexity in {Medium, High}
  -> invoke cli-lite-planning-agent with schema reference
```

### B) issue:plan Binding

```
solutions.length == 0 -> error / skip
solutions.length == 1 -> bind immediately
solutions.length >= 2 -> pending_selection -> AskUserQuestion -> bind selected
```

## 8) Error Handling Patterns

- Tool fallbacks in agents (Gemini -> Qwen -> Codex -> structural-only).
- JSON parsing hardening: extract JSON from fenced blocks; catch parse errors; skip batch or retry.
- Persistence failures: log and continue (best-effort saving of execution history).
- Binding verification: re-check issue status after bind and recover by re-binding if needed.

## Code References (Implementation Evidence)

- `package.json:55` - `.claude/commands/` packaged for distribution.
- `.claude/commands/workflow/plan.md:14` - `/workflow:plan` auto-continue execution model.
- `.claude/commands/workflow/plan.md:25` - TodoWrite task attachment model.
- `.claude/commands/workflow/plan.md:66` - conditional conflict resolution on `conflict_risk`.
- `.claude/commands/workflow/plan.md:72` - `/workflow:tools:task-generate-agent` invoked for task generation.
- `.claude/commands/workflow/plan.md:542` - explicit mapping of called sub-commands to phases.
- `.claude/commands/workflow/tools/task-generate-agent.md:52` - parallel module-based `action-planning-agent` spawning.
- `.claude/agents/action-planning-agent.md:698` - IMPL_PLAN.md written under `.workflow/active/{session_id}/`.
- `.claude/agents/action-planning-agent.md:860` - IMPL_PLAN template loading requirement.
- `.claude/commands/workflow/lite-plan.md:90` - `needsExploration` decision criteria.
- `.claude/commands/workflow/lite-plan.md:114` - complexity assessment (Low/Medium/High).
- `.claude/commands/workflow/lite-plan.md:122` - exploration angle presets map.
- `.claude/commands/workflow/lite-plan.md:296` - multi-round clarification requirement (AskUserQuestion limit).
- `.claude/commands/workflow/lite-plan.md:408` - `cli-lite-planning-agent` invocation for Medium/High.
- `.claude/agents/cli-lite-planning-agent.md:41` - schema-first requirement for planning agents.
- `.claude/agents/cli-explore-agent.md:36` - schema validation phase is mandatory when schema specified.
- `.claude/commands/issue/plan.md:52` - `--batch-size` default (3).
- `.claude/commands/issue/plan.md:209` - `Task(subagent_type=\"issue-plan-agent\", ...)` spawning.
- `.claude/commands/issue/plan.md:235` - bind verification and fallback re-bind behavior.
- `.claude/agents/issue-plan-agent.md:129` - ACE semantic search is primary exploration tool.
- `.claude/agents/issue-plan-agent.md:206` - agent executes `ccw issue bind` for single-solution issues.
- `.claude/workflows/cli-templates/schemas/plan-json-schema.json:6` - plan required root fields.
- `.claude/workflows/cli-templates/schemas/plan-json-schema.json:58` - `modification_points` required structure.
- `.claude/workflows/cli-templates/schemas/solution-schema.json:6` - solution required root fields.
- `.claude/workflows/cli-templates/schemas/solution-schema.json:65` - per-task `test` structure.
- `.claude/workflows/cli-templates/schemas/fix-plan-json-schema.json:6` - fix plan required root fields (includes `severity`, `risk_level`).
- `.claude/workflows/cli-templates/schemas/conflict-resolution-schema.json:7` - conflict resolution root required fields (`conflicts`, `summary`).
- `ccw/src/core/routes/cli-routes.ts:604` - `/api/cli/execute` route for tool execution.
- `ccw/src/core/routes/cli-routes.ts:657` - `executeCliTool(...)` call site.
- `ccw/src/tools/cli-executor-core.ts:217` - `spawn(...)` used to run tools.
- `ccw/src/tools/cli-executor-core.ts:392` - `executeCliTool(...)` core implementation.
- `ccw/src/core/routes/issue-routes.ts:280` - `bindSolutionToIssue(...)` helper.
- `ccw/src/core/routes/issue-routes.ts:1300` - binding/unbinding via PATCH `bound_solution_id`.

