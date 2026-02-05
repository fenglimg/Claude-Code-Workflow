---
name: plan
description: 5-phase planning workflow with action-planning-agent task generation, outputs IMPL_PLAN.md and task JSONs
argument-hint: "[-y|--yes] \"text description\"|file.md"
allowed-tools: Skill(*), TodoWrite(*), Read(*), Bash(*)
group: workflow
---

# Workflow Plan

## Overview

- Goal: Run a 5-phase planning workflow that generates an implementation plan (IMPL_PLAN.md) and executable task JSONs under the active workflow session.
- Command: `/workflow:plan`

## Usage

```bash
/workflow:plan [-y|--yes] "text description"|file.md
```

## Inputs

- Required inputs:
  - Task description text (quoted) OR a markdown file path (e.g. `spec.md`)
- Optional inputs:
  - `-y` / `--yes`: Auto Mode (auto-continue all phases; skip confirmations)

## Outputs / Artifacts

- Writes:
  - `.workflow/active/<sessionId>/planning-notes.md`
  - `.workflow/active/<sessionId>/IMPL_PLAN.md`
  - `.workflow/active/<sessionId>/.task/IMPL-*.json`
- Reads:
  - `.workflow/active/<sessionId>/workflow-session.json`
  - `.workflow/active/<sessionId>/.process/context-package.json`
  - `.workflow/active/<sessionId>/.brainstorming/**`
  - `.claude/workflows/cli-templates/prompts/workflow-impl-plan-template.txt`

## Implementation Pointers

- Command doc: `.claude/commands/workflow/plan.md`
- Likely code locations:
  - `ccw/src/tools/command-registry.ts` (loads command docs; normalizes `/workflow:` names)
  - `ccw/src/tools/session-manager.ts` (active session base `.workflow/active`)
  - `ccw/src/core/routes/session-routes.ts` (API reads IMPL_PLAN.md and conflict/context data)
  - `ccw/src/commands/session.ts` (CLI examples + IMPL_PLAN.md interactions)
  - `ccw/src/commands/session-path-resolver.ts` (maps `.task/*.json` to task content type)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/plan.md` | Existing | docs: `.claude/commands/workflow/plan.md` / `Workflow Plan Command (/workflow:plan)` ; ts: `ccw/src/tools/command-registry.ts` / `commandName.startsWith('/workflow:')` | `Test-Path .claude/commands/workflow/plan.md; rg "Workflow Plan Command (/workflow:plan)" .claude/commands/workflow/plan.md; rg "commandName.startsWith('/workflow:')" ccw/src/tools/command-registry.ts` | Oracle command doc; registry is the repo-side lookup mechanism for `/workflow:*` markdown commands |
| `.claude/commands/workflow/session/start.md` | Existing | docs: `.claude/commands/workflow/session/start.md` / `Overview` ; ts: `ccw/src/tools/command-registry.ts` / `const filePath = join(this.commandDir,` | `Test-Path .claude/commands/workflow/session/start.md; rg "const filePath = join(this.commandDir," ccw/src/tools/command-registry.ts` | Phase 1 entry point (session discovery/creation); command docs resolved via registry |
| `.claude/commands/workflow/tools/context-gather.md` | Existing | docs: `.claude/commands/workflow/tools/context-gather.md` / `Execution Process` ; ts: `ccw/src/tools/command-registry.ts` / `commandName.startsWith('/workflow:')` | `Test-Path .claude/commands/workflow/tools/context-gather.md; rg "commandName.startsWith('/workflow:')" ccw/src/tools/command-registry.ts` | Phase 2 context packaging and conflict-risk signal |
| `.claude/commands/workflow/tools/conflict-resolution.md` | Existing | docs: `.claude/commands/workflow/tools/conflict-resolution.md` / `Execution Process` ; ts: `ccw/src/core/routes/session-routes.ts` / `dataType === 'conflict'` | `Test-Path .claude/commands/workflow/tools/conflict-resolution.md; rg "dataType === 'conflict'" ccw/src/core/routes/session-routes.ts` | Optional Phase 3 (auto-triggered for medium+ conflict risk); server route supports conflict data |
| `.claude/commands/workflow/tools/task-generate-agent.md` | Existing | docs: `.claude/commands/workflow/tools/task-generate-agent.md` / `Document Generation Lifecycle` ; ts: `ccw/src/core/routes/session-routes.ts` / `join(normalizedPath, 'IMPL_PLAN.md')` | `Test-Path .claude/commands/workflow/tools/task-generate-agent.md; rg "join(normalizedPath, 'IMPL_PLAN.md')" ccw/src/core/routes/session-routes.ts` | Phase 4 generator for IMPL_PLAN.md + task JSONs |
| `.claude/workflows/cli-templates/prompts/workflow-impl-plan-template.txt` | Existing | docs: `.claude/commands/workflow/tools/task-generate-agent.md` / `Document Generation Lifecycle` ; ts: `ccw/src/commands/session.ts` / `ccw session WFS-001 write IMPL_PLAN.md` | `Test-Path .claude/workflows/cli-templates/prompts/workflow-impl-plan-template.txt; rg "ccw session WFS-001 write IMPL_PLAN.md" ccw/src/commands/session.ts` | Template that documents IMPL_PLAN.md structure; CLI/server surface expects IMPL_PLAN.md |
| `.workflow/active/<sessionId>/planning-notes.md` | Planned | docs: `.claude/commands/workflow/plan.md` / `User Intent (Phase 1)` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `rg "const ACTIVE_BASE = '.workflow/active';" ccw/src/tools/session-manager.ts` | Phase 1 writes planning notes (N+1 context) into the active session folder |
| `.workflow/active/<sessionId>/IMPL_PLAN.md` | Planned | docs: `.claude/commands/workflow/plan.md` / `Task Generation (Phase 4)` ; ts: `ccw/src/core/routes/session-routes.ts` / `join(normalizedPath, 'IMPL_PLAN.md')` | `rg "join(normalizedPath, 'IMPL_PLAN.md')" ccw/src/core/routes/session-routes.ts` | Primary planning output consumed by server UI and later execution workflows |
| `.workflow/active/<sessionId>/.task/IMPL-*.json` | Planned | docs: `.claude/commands/workflow/plan.md` / `Phase 3.5: Pre-Task Generation Validation (Optional Quality Gate)` ; ts: `ccw/src/commands/session-path-resolver.ts` / `'.task/': 'task'` | `rg "'.task/': 'task'" ccw/src/commands/session-path-resolver.ts` | Generated tasks under `.task/` (IMPL/TEST/etc) used by `/workflow:execute` and session tooling |

## Execution Process

1. Input processing
   - Parse either quoted text or markdown file into a structured description (GOAL/SCOPE/CONTEXT).
2. Phase 1: Session discovery
   - Run `/workflow:session:start --auto "<structured-description>"`.
   - Capture `sessionId` and initialize session state (planning-notes.md in active session).
3. Phase 2: Context gathering
   - Run `/workflow:tools:context-gather --session <sessionId> "<structured-description>"`.
   - Persist context package path and conflict risk into planning notes.
4. Phase 3: Conflict resolution (conditional)
   - If `conflict_risk >= medium`, run `/workflow:tools:conflict-resolution --session <sessionId> ...` and persist decisions.
5. Phase 3.5: Pre-task generation validation (optional)
   - Validate prerequisites before task generation (e.g. `.task/IMPL-*.json` checks; verify required artifacts).
6. Phase 4: Task generation
   - Run `Skill(skill="workflow:tools:task-generate-agent", args="--session <sessionId>")`.
   - Ensure IMPL_PLAN.md and task JSONs are created.
7. Post-plan next actions
   - Offer `/workflow:plan-verify` then `/workflow:execute` as follow-ups (or auto-continue in Auto Mode).

## Error Handling

- Missing/invalid input: prompt for a single canonical structured description before starting phases.
- Missing session artifacts: fall back to re-running `/workflow:session:start` and re-deriving paths.
- Context gather failure: stop and report error with the sessionId and the last successful phase.
- Task generation failure: ensure planning-notes.md + context-package.json exist; rerun Phase 4 with the same session.

## Examples

```bash
/workflow:plan "GOAL: Add OAuth login; SCOPE: web only; CONTEXT: existing auth module"
/workflow:plan -y "GOAL: Refactor billing; SCOPE: API + DB; CONTEXT: high traffic"
/workflow:plan requirements.md
```
