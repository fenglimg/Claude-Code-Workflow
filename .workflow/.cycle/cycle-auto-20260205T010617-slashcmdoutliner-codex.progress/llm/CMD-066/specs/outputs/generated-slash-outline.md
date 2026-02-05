---
name: test-task-generate
description: Generate test planning documents (IMPL_PLAN.md, test task JSONs, TODO_LIST.md) by invoking test-action-planning-agent
argument-hint: "--session WFS-test-session-id"
allowed-tools: Task(*), Read(*), Write(*), Glob(*)
group: workflow
---

# Generate Test Planning Documents Command

## Overview

- Goal: Generate test planning artifacts for an existing WFS test session (no code changes; no test execution).
- Command: `/workflow:tools:test-task-generate`

## Usage

```bash
/workflow:tools:test-task-generate --session WFS-test-session-id
```

## Inputs

- Required inputs:
  - `--session WFS-test-session-id`
- Optional inputs:
  - (none)

## Outputs / Artifacts

- Writes:
  - `.workflow/active/<session>/test-planning-notes.md`
  - `.workflow/active/<session>/.task/IMPL-*.json`
  - `.workflow/active/<session>/IMPL_PLAN.md`
  - `.workflow/active/<session>/TODO_LIST.md`
- Reads:
  - `.workflow/active/<session>/workflow-session.json`
  - `.workflow/active/<session>/.process/TEST_ANALYSIS_RESULTS.md`
  - `.workflow/active/<session>/.process/test-context-package.json`

## Implementation Pointers

- Command doc: `.claude/commands/workflow/tools/test-task-generate.md`
- Likely code locations:
  - `.claude/agents/test-action-planning-agent.md`
  - `.claude/agents/cli-execution-agent.md`
  - `ccw/src/core/routes/commands-routes.ts`
  - `ccw/src/tools/command-registry.ts`

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/tools/test-task-generate.md` | Existing | docs: `.claude/commands/workflow/tools/test-task-generate.md` / `Overview` ; ts: `ccw/src/core/routes/commands-routes.ts` / `function scanCommandsRecursive(` | `Test-Path .claude/commands/workflow/tools/test-task-generate.md` | Oracle command doc that defines the user-facing behavior and sections |
| `.claude/agents/test-action-planning-agent.md` | Existing | docs: `.claude/commands/workflow/tools/test-task-generate.md` / `Agent Specialization` ; ts: `ccw/src/tools/command-registry.ts` / `const toolsStr = header['allowed-tools']` | `Test-Path .claude/agents/test-action-planning-agent.md` | Agent prompt/contract that produces IMPL_PLAN.md + IMPL-*.json + TODO_LIST.md |
| `.claude/agents/cli-execution-agent.md` | Existing | docs: `.claude/commands/workflow/tools/test-task-generate.md` / `Gemini Enhancement (Phase 1.5)` ; ts: `ccw/src/types/loop.ts` / `prompt_template?: string;` | `Test-Path .claude/agents/cli-execution-agent.md` | Optional Gemini enhancement phase is delegated to the CLI execution agent |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/workflow/tools/test-task-generate.md` / `Integration & Usage` ; ts: `ccw/src/core/routes/commands-routes.ts` / `key === 'allowed-tools'` | `Test-Path ccw/src/core/routes/commands-routes.ts` | Recursively scans `.claude/commands/**` and parses frontmatter fields like allowed-tools |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/tools/test-task-generate.md` / `Usage Examples` ; ts: `ccw/src/tools/command-registry.ts` / `export class CommandRegistry {` | `Test-Path ccw/src/tools/command-registry.ts` | Frontmatter parsing and command metadata lookup used by CCW tooling |

Notes:
- Each pointer row is evidence-backed (docs heading + literal TS anchor string).

## Execution Process

1. Parse `--session` and resolve session paths under `.workflow/active/<session>/`.
2. Validate prerequisites:
   - `workflow-session.json` exists and is valid JSON.
   - `TEST_ANALYSIS_RESULTS.md` exists (produced by `/workflow:tools:test-concept-enhanced`).
3. Phase 1 (Context Preparation): read analysis + context package; create/update `test-planning-notes.md` with extracted key fields and initial sections.
4. Phase 1.5 (Gemini Test Enhancement): invoke `cli-execution-agent` to enrich suggestions; append results to `test-planning-notes.md`. If Gemini step fails, continue with best-effort notes.
5. Phase 2 (Task Generation): invoke `test-action-planning-agent` using `TEST_ANALYSIS_RESULTS.md` + `test-planning-notes.md` to generate:
   - `.task/IMPL-*.json` tasks (IMPL-001, IMPL-001.3, IMPL-001.5, IMPL-002 minimum)
   - `IMPL_PLAN.md`
   - `TODO_LIST.md`
6. Return a concise summary of created/updated artifacts and next suggested command (e.g., `/workflow:test-cycle-execute`).

## Error Handling

- Missing `--session`: return a usage error and an example invocation.
- Missing `TEST_ANALYSIS_RESULTS.md`: explain the prerequisite and point to `/workflow:tools:test-concept-enhanced`.
- Invalid/missing `test-context-package.json`: continue with reduced context (derive what you can from TEST_ANALYSIS_RESULTS.md) and record the downgrade in `test-planning-notes.md`.
- Agent invocation failure:
  - Gemini enhancement failure: continue to Phase 2 without enrichment.
  - Planning agent failure: do not emit partial task JSONs; report what was generated and how to retry.

## Examples

```bash
# Standard
/workflow:tools:test-task-generate --session WFS-test-auth

# Typical chain
/workflow:tools:test-context-gather --session WFS-test-auth
/workflow:tools:test-concept-enhanced --session WFS-test-auth --context .workflow/active/WFS-test-auth/.process/test-context-package.json
/workflow:tools:test-task-generate --session WFS-test-auth
```
