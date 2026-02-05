---
name: brainstorm-with-file
description: Interactive brainstorming with multi-CLI collaboration, idea expansion, and documented thought evolution
argument-hint: "[-y|--yes] [-c|--continue] [-m|--mode creative|structured] \"idea or topic\""
allowed-tools: TodoWrite(*), Task(*), AskUserQuestion(*), Read(*), Grep(*), Glob(*), Bash(*), Edit(*), Write(*)
group: workflow
---

# Workflow: Brainstorm With File

## Overview

- Goal: Expand an initial idea/topic into multi-perspective options with a documented thought evolution and final synthesis.
- Command: `/workflow:brainstorm-with-file`

## Usage

```bash
/workflow:brainstorm-with-file [-y|--yes] [-c|--continue] [-m|--mode creative|structured] "idea or topic"
```

## Inputs

- Required inputs:
  - Topic/idea seed (string)
- Optional inputs:
  - `-y|--yes`: auto-confirm decisions (recommended roles, balanced exploration)
  - `-c|--continue`: resume an existing session (load prior session artifacts)
  - `-m|--mode creative|structured`: exploration style

## Outputs / Artifacts

- Writes:
  - `.workflow/.brainstorm/<session-id>/brainstorm.md`
  - `.workflow/.brainstorm/<session-id>/exploration-codebase.json`
  - `.workflow/.brainstorm/<session-id>/perspectives.json`
  - `.workflow/.brainstorm/<session-id>/ideas/<idea-slug>.md`
  - `.workflow/.brainstorm/<session-id>/synthesis.json`
- Reads:
  - `.workflow/.brainstorm/<session-id>/brainstorm.md` (when `--continue`)
  - Repo files (as needed during exploration)

## Implementation Pointers

- Command doc: `.claude/commands/workflow/brainstorm-with-file.md`
- Likely code locations:
  - `ccw/src/core/routes/commands-routes.ts` (command discovery/scanning)
  - `ccw/src/core/routes/cli-routes.ts` (CLI execution route + streaming)
  - `ccw/src/tools/cli-executor-core.ts` (CLI execution core: `executeCliTool`)

### Evidence (Existing vs Planned)

You MUST label each pointer as `Existing` (verifiable in repo now) or `Planned` (will be created/modified).

Rules:
- `Existing` MUST include evidence from BOTH:
  - a command doc source: `.claude/commands/**.md` (section heading is sufficient)
  - a TypeScript source: `ccw/src/**` (function name / subcommand case / a ripgrep-able string)
- If you cannot verify, downgrade to `Planned` and add a concrete `Verify` step (e.g. `Test-Path <path>`, `rg "<pattern>" <path>`).

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/brainstorm-with-file.md` | Existing | docs: `.claude/commands/workflow/brainstorm-with-file.md` / `Output Artifacts` ; ts: `ccw/src/core/routes/commands-routes.ts` / `function scanCommandsRecursive(` | `Test-Path .claude/commands/workflow/brainstorm-with-file.md` | oracle command doc and primary behavior reference |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/workflow/plan.md` / `Workflow Plan Command (/workflow:plan)` ; ts: `ccw/src/core/routes/commands-routes.ts` / `function scanCommandsRecursive(` | `Test-Path ccw/src/core/routes/commands-routes.ts` | CCW server enumerates project/user command docs |
| `ccw/src/core/routes/cli-routes.ts` | Existing | docs: `.claude/commands/workflow/multi-cli-plan.md` / `Agent Roles` ; ts: `ccw/src/core/routes/cli-routes.ts` / `type: 'CLI_EXECUTION_STARTED',` | `Test-Path ccw/src/core/routes/cli-routes.ts` | supports multi-CLI execution + streaming output used by collaboration workflows |
| `ccw/src/tools/cli-executor-core.ts` | Existing | docs: `.claude/commands/workflow/brainstorm-with-file.md` / `Implementation` ; ts: `ccw/src/tools/cli-executor-core.ts` / `async function executeCliTool(` | `Test-Path ccw/src/tools/cli-executor-core.ts` | central CLI execution primitive used by server routes |
| `.workflow/.brainstorm/<session-id>/brainstorm.md` | Planned | docs: `.claude/commands/workflow/brainstorm-with-file.md` / `Templates` ; ts: `ccw/src/core/routes/commands-routes.ts` / `scanCommandsRecursive(projectDir, projectDir, 'project', projectPath);` | `Test-Path .workflow/.brainstorm` | primary session narrative (thought evolution timeline) |

Notes:
- Expand code pointers into one row per pointer (done above).
- For TS evidence, anchors are literal substrings present in the referenced file.

## Execution Process

1) Session initialization
- If `--continue`: locate existing `.workflow/.brainstorm/<session-id>/` and load `brainstorm.md`.
- Else: create a new session folder and initialize `brainstorm.md` with metadata (topic, mode, dimensions, roles).

2) Phase 1: Seed Understanding
- Parse the seed topic; ask scoping questions (goals, constraints, context).
- Identify brainstorming dimensions (technical / UX / business / risk / timeline).
- Select roles/perspectives (auto mode picks recommended set; manual mode offers options).

3) Phase 2: Divergent Exploration
- Run `cli-explore-agent` first to produce codebase/context findings (if relevant).
- Run multi-perspective exploration (e.g., creative/pragmatic/systematic) and persist `perspectives.json`.
- Append a round entry to `brainstorm.md` recording inputs, outputs, and key deltas.

4) Phase 3: Interactive Refinement (multi-round)
- Present synthesized findings; ask user to choose next action: deep-dive, generate more, challenge, merge.
- For selected ideas, write `ideas/<idea-slug>.md` and update `brainstorm.md` with an evolution timeline.
- Enforce context/size limits; if exceeded, split into idea docs and synthesize from summaries.

5) Phase 4: Convergence & Crystallization
- Produce `synthesis.json` (top ideas, tradeoffs, recommendations, next steps).
- Finalize `brainstorm.md` with conclusions and session statistics.

## Error Handling

- cli-explore-agent failure: continue with empty exploration context and note it in `brainstorm.md`.
- CLI/tool timeout: retry once with shorter prompt; otherwise skip the role and proceed.
- No viable ideas: reframe problem via scoping questions; return to Phase 2.
- Context overflow: reduce roles/scope, switch to `--mode structured`, split outputs into `ideas/`.
- Max rounds reached: force convergence output and list open questions.

## Examples

```bash
/workflow:brainstorm-with-file "Redesign user notification system"
/workflow:brainstorm-with-file --continue "Notification system"
/workflow:brainstorm-with-file -y -m creative "AI assisted feature ideation"
/workflow:brainstorm-with-file -m structured "Optimize cache strategy"
```
