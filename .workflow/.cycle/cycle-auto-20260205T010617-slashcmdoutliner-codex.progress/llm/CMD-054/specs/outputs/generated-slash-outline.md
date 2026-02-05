---
name: tdd-plan
description: TDD workflow planning with Red-Green-Refactor task chain generation, test-first development structure, and cycle tracking
argument-hint: "\"feature description\"|file.md"
allowed-tools: Skill(*), TodoWrite(*), Read(*), Bash(*)
group: workflow
---

# TDD Workflow Plan Command (/workflow:tdd-plan)

## Overview

- Goal: Generate a complete TDD plan (tasks + IMPL_PLAN) where every IMPL task contains an explicit Red -> Green -> Refactor cycle.
- Command: `/workflow:tdd-plan`
- Orchestrator: runs 6 phases autonomously; uses TodoWrite task-attachment/collapse model.

## Usage

```bash
/workflow:tdd-plan "feature description"
/workflow:tdd-plan file.md
```

## Inputs

- Required inputs:
  - A feature description string OR a file path to a requirements/feature doc.
- Optional inputs:
  - None (auto-mode behavior is default).

## Outputs / Artifacts

- Writes:
  - `.workflow/active/{sessionId}/IMPL_PLAN.md`
  - `.workflow/active/{sessionId}/TODO_LIST.md`
  - `.workflow/active/{sessionId}/.task/IMPL-*.json`
  - `.workflow/active/{sessionId}/.process/tdd-warnings.log`
- Reads:
  - `.workflow/active/{sessionId}/workflow-session.json`
  - `.workflow/active/{sessionId}/.process/context-package.json`
  - `.workflow/active/{sessionId}/.process/test-context-package.json`

## Implementation Pointers

- Command doc: `.claude/commands/workflow/tdd-plan.md`
- Closest reference: `.claude/commands/workflow/plan.md`
- Orchestrated subcommands (docs):
  - `.claude/commands/workflow/session/start.md`
  - `.claude/commands/workflow/tools/context-gather.md`
  - `.claude/commands/workflow/tools/test-context-gather.md`
  - `.claude/commands/workflow/tools/conflict-resolution.md`
  - `.claude/commands/workflow/tools/task-generate-tdd.md`
  - `.claude/commands/workflow/plan-verify.md`
- Tooling / server touchpoints (TS):
  - `ccw/src/tools/session-manager.ts`
  - `ccw/src/tools/command-registry.ts`
  - `ccw/src/core/routes/commands-routes.ts`

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/tdd-plan.md` | Existing | docs: `.claude/commands/workflow/tdd-plan.md` / `TDD Workflow Plan Command (/workflow:tdd-plan)` ; ts: `ccw/src/tools/command-registry.ts` / `commandName.startsWith('/workflow:')` | `Test-Path .claude/commands/workflow/tdd-plan.md` | canonical command behavior (oracle) |
| `.claude/commands/workflow/plan.md` | Existing | docs: `.claude/commands/workflow/plan.md` / `Workflow Plan Command (/workflow:plan)` ; ts: `ccw/src/tools/command-registry.ts` / `commandName.startsWith('/workflow:')` | `Test-Path .claude/commands/workflow/plan.md` | closest phased orchestrator reference |
| `.claude/commands/workflow/session/start.md` | Existing | docs: `.claude/commands/workflow/session/start.md` / `Start Workflow Session (/workflow:session:start)` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path .claude/commands/workflow/session/start.md` | Phase 1 session creation/discovery |
| `.claude/commands/workflow/tools/context-gather.md` | Existing | docs: `.claude/commands/workflow/tools/context-gather.md` / `Context Gather Command (/workflow:tools:context-gather)` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path .claude/commands/workflow/tools/context-gather.md` | Phase 2 context-package generation |
| `.claude/commands/workflow/tools/test-context-gather.md` | Existing | docs: `.claude/commands/workflow/tools/test-context-gather.md` / `Test Context Gather Command (/workflow:tools:test-context-gather)` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path .claude/commands/workflow/tools/test-context-gather.md` | Phase 3 test-context-package generation |
| `.claude/commands/workflow/tools/conflict-resolution.md` | Existing | docs: `.claude/commands/workflow/tools/conflict-resolution.md` / `Conflict Resolution Command` ; ts: `ccw/src/core/routes/commands-routes.ts` / `function parseCommandFrontmatter(content: string): CommandMetadata {` | `Test-Path .claude/commands/workflow/tools/conflict-resolution.md` | Phase 4 conditional conflict gate pattern |
| `.claude/commands/workflow/tools/task-generate-tdd.md` | Existing | docs: `.claude/commands/workflow/tools/task-generate-tdd.md` / `Autonomous TDD Task Generation Command` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path .claude/commands/workflow/tools/task-generate-tdd.md` | Phase 5 task generation (TDD variant) |
| `.claude/commands/workflow/plan-verify.md` | Existing | docs: `.claude/commands/workflow/plan-verify.md` / `Execution Steps` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path .claude/commands/workflow/plan-verify.md` | Phase 6 recommended quality verification |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/plan.md` / `5-Phase Execution` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path ccw/src/tools/session-manager.ts` | central .workflow/active artifact routing |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/plan.md` / `Core Rules` ; ts: `ccw/src/tools/command-registry.ts` / `commandName.startsWith('/workflow:')` | `Test-Path ccw/src/tools/command-registry.ts` | command metadata parsing (frontmatter/allowed-tools) |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/workflow/plan.md` / `Execution Process` ; ts: `ccw/src/core/routes/commands-routes.ts` / `function parseCommandFrontmatter(content: string): CommandMetadata {` | `Test-Path ccw/src/core/routes/commands-routes.ts` | server routes read/parse command docs |

## Execution Process

0. **Initialize TodoWrite**: create a 6-phase checklist; mark Phase 1 `in_progress` immediately.
1. **Phase 1: Session Discovery**
   - Run `/workflow:session:start --type tdd --auto "TDD: ..."`.
   - Parse and persist `sessionId` for downstream phases.
2. **Phase 2: Context Gathering**
   - Run `/workflow:tools:context-gather --session {sessionId} "TDD: ..."`.
   - Parse `contextPath` (context-package.json) and validate it exists/JSON.
3. **Phase 3: Test Coverage Analysis**
   - Run `/workflow:tools:test-context-gather --session {sessionId} "TDD: ..."`.
   - Parse `testContextPath` and validate it exists/JSON.
4. **Phase 4: Conflict Resolution (Conditional)**
   - If conflict risk is `medium+`, run `/workflow:tools:conflict-resolution --session {sessionId}`.
   - If context grows too large, run `/compact` (built-in) before continuing.
5. **Phase 5: TDD Task Generation**
   - Run `/workflow:tools:task-generate-tdd --session {sessionId}`.
   - Ensure outputs exist: `IMPL_PLAN.md`, `TODO_LIST.md`, `.task/IMPL-*.json`.
6. **Phase 6: TDD Structure Validation & Action Plan Verification**
   - Validate first IMPL task shape (3-step `implementation_approach` with `tdd_phase` = red/green/refactor).
   - Count artifacts, surface warnings (non-blocking), and recommend `/workflow:plan-verify --session {sessionId}`.
7. **Auto-continue**: after each phase completes, collapse attached subtasks back into the phase summary and immediately start the next pending phase.

## Error Handling

- Parsing failure: retry once; if still failing, keep the current phase `in_progress` and report the missing token/path.
- Artifact validation failure: report which file is missing/invalid JSON; re-run the phase command once.
- Subcommand failure: do not advance phase; show stderr/summary and the exact retry command.
- TDD validation failure: report which checkpoint failed (missing red/green/refactor step, missing max-iterations config); do not block execution, but emit warnings into `tdd-warnings.log`.

## Examples

- Plan from text:
  - `/workflow:tdd-plan "Add JWT login with refresh tokens"`
- Plan from file:
  - `/workflow:tdd-plan docs/feature-auth.md`