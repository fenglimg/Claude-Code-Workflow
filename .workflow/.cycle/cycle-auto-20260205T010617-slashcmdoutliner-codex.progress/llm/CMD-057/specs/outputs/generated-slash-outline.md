---
name: test-fix-gen
description: Create test-fix workflow session with progressive test layers (L0-L3), AI code validation, and test task generation
argument-hint: "(source-session-id | \"feature description\" | /path/to/file.md)"
allowed-tools: Skill(*), TodoWrite(*), Read(*), Bash(*)
group: workflow
---

# Workflow Test-Fix Generation Command (/workflow:test-fix-gen)

## Overview

- Goal: Create a test-focused workflow session, gather context, generate L0-L3 test analysis, and produce test task artifacts for execution.
- Command: `/workflow:test-fix-gen`
- Style: pure orchestrator (auto-continue across phases; no unrelated work outside the phased workflow)

## Usage

```bash
# Session mode (validate an already-implemented feature session)
/workflow:test-fix-gen WFS-some-existing-session

# Prompt mode (text description)
/workflow:test-fix-gen "Test the user authentication endpoints"

# Prompt mode (file reference)
/workflow:test-fix-gen ./docs/feature-or-api-spec.md
```

## Inputs

- Required inputs:
  - One argument: `WFS-*` source session id OR a quoted description OR a readable file path
- Optional inputs:
  - None (behavior is mode-driven from the single argument)

## Outputs / Artifacts

- Writes:
  - `.workflow/active/<testSessionId>/` (test session folder)
  - `.workflow/active/<testSessionId>/.process/context-package.json`
  - `.workflow/active/<testSessionId>/.process/TEST_ANALYSIS_RESULTS.md`
  - `.workflow/active/<testSessionId>/IMPL_PLAN.md`
  - `.workflow/active/<testSessionId>/TODO_LIST.md`
  - `.workflow/active/<testSessionId>/.task/IMPL-*.json`
- Reads:
  - `.workflow/active/<sourceSessionId>/` (session mode prerequisites)
  - `<input-file>.md` (file prompt mode)

## Implementation Pointers

- Command doc: `.claude/commands/workflow/test-fix-gen.md`
- Likely code locations (patterns to reuse):
  - Orchestrator + auto-continue + task attachment patterns
  - Test artifact generation + validation patterns
  - Session lifecycle conventions (create/read/validate session folders)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/test-fix-gen.md` | Existing | docs: `.claude/commands/workflow/test-fix-gen.md` / `Coordinator Role` ; ts: `ccw/src/commands/session.ts` / `const result = await executeTool('session_manager', params);` | `Test-Path .claude/commands/workflow/test-fix-gen.md` | Primary command doc (or oracle for behavior + headings) |
| `.claude/commands/workflow/test-cycle-execute.md` | Existing | docs: `.claude/commands/workflow/test-cycle-execute.md` / `Orchestrator Boundary (CRITICAL)` ; ts: `ccw/src/commands/loop.ts` / `const loopManager = new LoopManager(sessionDir);` | `Test-Path .claude/commands/workflow/test-cycle-execute.md` | Follow-up execution command; aligns next-step guidance and orchestrator boundary |
| `.claude/commands/workflow/brainstorm/auto-parallel.md` | Existing | docs: `.claude/commands/workflow/brainstorm/auto-parallel.md` / `Core Rules` ; ts: `ccw/src/tools/loop-manager.ts` / `setImmediate(() => this.runNextStep(loopId).catch(err => {` | `Test-Path .claude/commands/workflow/brainstorm/auto-parallel.md` | Reference for auto-continue orchestration + task attachment/collapse discipline |
| `.claude/commands/workflow/tools/test-context-gather.md` | Existing | docs: `.claude/commands/workflow/tools/test-context-gather.md` / `Output Requirements` ; ts: `ccw/src/commands/session.ts` / `const result = await executeTool('session_manager', params);` | `Test-Path .claude/commands/workflow/tools/test-context-gather.md` | Phase 2 (session mode): build test-context package and coverage signals |
| `.claude/commands/workflow/tools/context-gather.md` | Existing | docs: `.claude/commands/workflow/tools/context-gather.md` / `Execution Process` ; ts: `ccw/src/commands/session.ts` / `const result = await executeTool('session_manager', params);` | `Test-Path .claude/commands/workflow/tools/context-gather.md` | Phase 2 (prompt mode): general context discovery and packaging |
| `.claude/commands/workflow/tools/test-concept-enhanced.md` | Existing | docs: `.claude/commands/workflow/tools/test-concept-enhanced.md` / `Execution Process` ; ts: `ccw/src/commands/workflow.ts` / `const WORKFLOW_SOURCES = [` | `Test-Path .claude/commands/workflow/tools/test-concept-enhanced.md` | Phase 3: generate L0-L3 test analysis requirements (agent-assisted) |
| `.claude/commands/workflow/tools/test-task-generate.md` | Existing | docs: `.claude/commands/workflow/tools/test-task-generate.md` / `Validation` ; ts: `ccw/src/commands/loop.ts` / `const loopManager = new LoopManager(sessionDir);` | `Test-Path .claude/commands/workflow/tools/test-task-generate.md` | Phase 4: generate IMPL plan + TODO list + task JSONs for tests |

## Execution Process

- Input parsing:
  - Detect input mode: `session` if argument starts with `WFS-`, else `prompt` (text or file path)
  - Initialize TodoWrite immediately (phase checklist + auto-continue rule)
- Phase 1 (Create test session):
  - Call `/workflow:session:start --type test --new "<structured description>"` via `Skill(...)`
  - Parse `SESSION_ID: ...` as `testSessionId`
- Phase 2 (Gather context):
  - Session mode: call `/workflow:tools:test-context-gather --session <testSessionId>`
  - Prompt mode: call `/workflow:tools:context-gather --session <testSessionId> "<description>"`
  - Parse context package path as `contextPath`
- Phase 3 (Test analysis):
  - Call `/workflow:tools:test-concept-enhanced --session <testSessionId> --context <contextPath>`
  - Validate `.process/TEST_ANALYSIS_RESULTS.md` exists and contains L0-L3 expectations
- Phase 4 (Generate test tasks):
  - Call `/workflow:tools:test-task-generate --session <testSessionId>`
  - Validate `IMPL_PLAN.md`, `TODO_LIST.md`, and `.task/IMPL-*.json` were created (4+ tasks)
- Phase 5 (Return summary):
  - Return a concise summary (session id, key outputs, and next step: `/workflow:test-cycle-execute`)

## Error Handling

- Phase 1:
  - If session mode and source session is missing/incomplete: stop with a clear error message and suggested prerequisite command.
- Phase 2:
  - If context package path cannot be parsed or file missing: stop with error + show expected path pattern.
- Phase 3:
  - If analysis output missing: stop with error + suggest re-running Phase 2 or validating context package.
- Phase 4:
  - If task generation incomplete: retry once, then stop with error (do not claim artifacts were created).

## Examples

```bash
/workflow:test-fix-gen WFS-user-auth-v2
/workflow:test-fix-gen "Test the payment flow for failures and edge cases"
/workflow:test-fix-gen ./docs/api-contract.md
```

