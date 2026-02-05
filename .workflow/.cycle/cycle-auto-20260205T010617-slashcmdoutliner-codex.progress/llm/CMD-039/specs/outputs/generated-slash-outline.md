---
name: lite-fix
description: Lightweight bug diagnosis and fix workflow with intelligent severity assessment and optional hotfix mode for production incidents
argument-hint: "[-y|--yes] [--hotfix] \"bug description or issue reference\""
allowed-tools: TodoWrite(*), Task(*), Skill(*), AskUserQuestion(*)
group: workflow
---

# Workflow Lite-Fix Command (/workflow:lite-fix)

## Overview

- Goal: Diagnose a bug quickly (with severity assessment), produce a minimal fix plan, then optionally hand off execution to `/workflow:lite-execute`.
- Command: `/workflow:lite-fix`

## Usage

```bash
/workflow:lite-fix [-y|--yes] [--hotfix] "bug description or issue reference"
```

## Inputs

- Required inputs:
  - Bug description string or issue reference (optionally a file reference, per command doc).
- Optional inputs:
  - `-y, --yes`: auto mode (skip confirmations)
  - `--hotfix`: production hotfix mode (optimize for speed/minimal scope)

## Outputs / Artifacts

- Writes:
  - `.workflow/lite-fix/<session>/diagnosis-*.json`
  - `.workflow/lite-fix/<session>/diagnoses-manifest.json`
  - `.workflow/lite-fix/<session>/planning-context.md`
  - `.workflow/lite-fix/<session>/fix-plan.json`
- Reads:
  - `.workflow/project-tech.json`
  - `.workflow/project-guidelines.json`

## Implementation Pointers

- Command doc: `.claude/commands/workflow/lite-fix.md`
- Likely code locations:
  - `.claude/commands/workflow/lite-plan.md` (closest structural reference)
  - `.claude/commands/workflow/lite-execute.md` (execution handoff contract)
  - `ccw/src/core/routes/commands-routes.ts` (command corpus scan / grouping)
  - `ccw/src/commands/workflow.ts` (workflow command handler)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/lite-fix.md` | Existing | docs: `.claude/commands/workflow/lite-fix.md` / Workflow Lite-Fix Command (/workflow:lite-fix) ; ts: `ccw/src/core/routes/commands-routes.ts` / result.projectCommands = scanCommandsRecursive(projectDir, projectDir, 'project', projectPath) | `Test-Path .claude/commands/workflow/lite-fix.md` | canonical command definition (oracle) |
| `/workflow:lite-fix` | Existing | docs: `.claude/commands/workflow/lite-fix.md` / Usage ; ts: `ccw/src/commands/workflow.ts` / export async function workflowCommand( | `Test-Path .claude/commands/workflow/lite-fix.md` | command entrypoint + invocation contract |
| `/workflow:lite-plan` | Existing | docs: `.claude/commands/workflow/lite-plan.md` / Workflow Lite-Plan Command (/workflow:lite-plan) ; ts: `ccw/src/core/routes/commands-routes.ts` / result.projectCommands = scanCommandsRecursive(projectDir, projectDir, 'project', projectPath) | `Test-Path .claude/commands/workflow/lite-plan.md` | closest reference for phase structure + confirmations |
| `/workflow:lite-execute` | Existing | docs: `.claude/commands/workflow/lite-execute.md` / Workflow Lite-Execute Command (/workflow:lite-execute) ; ts: `ccw/src/core/routes/commands-routes.ts` / result.projectCommands = scanCommandsRecursive(projectDir, projectDir, 'project', projectPath) | `Test-Path .claude/commands/workflow/lite-execute.md` | execution handoff target |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/workflow/lite-fix.md` / Implementation ; ts: `ccw/src/core/routes/commands-routes.ts` / export async function handleCommandsRoutes(ctx: RouteContext): Promise<boolean> | `Test-Path ccw/src/core/routes/commands-routes.ts` | repo-backed command discovery / grouping |
| `ccw/src/commands/workflow.ts` | Existing | docs: `.claude/commands/workflow/lite-fix.md` / Implementation ; ts: `ccw/src/commands/workflow.ts` / export async function workflowCommand( | `Test-Path ccw/src/commands/workflow.ts` | workflow CLI command entrypoint |

## Execution Process

1. Parse flags + bug description; normalize auto mode (`-y/--yes`) and hotfix mode (`--hotfix`).
2. Assess severity (impact, blast radius, urgency) and choose diagnosis strategy (standard vs hotfix-shortened).
3. Phase 1: Multi-angle diagnosis (delegate to specialized Task workers); write per-angle `diagnosis-*.json` and `diagnoses-manifest.json`.
4. Phase 2 (optional): Multi-round clarification with the user (AskUserQuestion) to fill gaps.
5. Phase 3: Fix planning; produce `fix-plan.json` and supporting `planning-context.md`.
6. Phase 4: Confirmation & execution selection (auto mode skips prompts); package the final context for execution.
7. Phase 5: Delegate execution to `/workflow:lite-execute` with the chosen execution method.

## Error Handling

| Error | Resolution |
|---|---|
| Diagnosis worker fails | Continue with bug description only; record the failure in planning context |
| Planning step fails | Fallback to a smaller fix plan with explicit unknowns + verify steps |
| Clarification times out | Proceed using available diagnosis outputs |
| Scope too large for lite-fix | Suggest escalation to `/workflow:plan` (bugfix mode) |

## Examples

```bash
/workflow:lite-fix "Login shows success even when password is wrong"
/workflow:lite-fix --yes "Production DB connection failures after deploy"
/workflow:lite-fix -y --hotfix "API 500s on checkout endpoint"
```
