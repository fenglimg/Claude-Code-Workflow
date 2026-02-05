# Gap Report: workflow:lite-fix

## Reference

- Selected reference: /workflow:lite-plan (`.claude/commands/workflow/lite-plan.md`)

## P0 Gaps (Must Fix)

- None identified for the outline skeleton (frontmatter, required sections, and evidence tables).

## P1 Gaps (Should Fix)

- Make the severity-level mapping explicit (severity -> diagnosis depth -> planning strategy -> confirmation requirements).
- Make the `/workflow:lite-execute` handoff contract explicit (what exact context bundle is passed, and which artifacts are authoritative).
- Document a fallback when `.workflow/project-tech.json` / `.workflow/project-guidelines.json` are missing (e.g., prompt user to run `/workflow:init` or proceed with reduced context).

## P2 Gaps (Optional)

- Add one worked example for file input and one for issue-reference input.
- Add a short troubleshooting section for common failures (e.g., diagnosis worker errors, clarification timeouts).

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/lite-fix.md` | Existing | docs: `.claude/commands/workflow/lite-fix.md` / Workflow Lite-Fix Command (/workflow:lite-fix) ; ts: `ccw/src/core/routes/commands-routes.ts` / result.projectCommands = scanCommandsRecursive(projectDir, projectDir, 'project', projectPath) | `Test-Path .claude/commands/workflow/lite-fix.md` | canonical command definition |
| `/workflow:lite-fix` | Existing | docs: `.claude/commands/workflow/lite-fix.md` / Usage ; ts: `ccw/src/commands/workflow.ts` / export async function workflowCommand( | `Test-Path .claude/commands/workflow/lite-fix.md` | invocation contract + group routing |
| `/workflow:lite-plan` | Existing | docs: `.claude/commands/workflow/lite-plan.md` / Workflow Lite-Plan Command (/workflow:lite-plan) ; ts: `ccw/src/core/routes/commands-routes.ts` / result.projectCommands = scanCommandsRecursive(projectDir, projectDir, 'project', projectPath) | `Test-Path .claude/commands/workflow/lite-plan.md` | closest structural reference |
| `/workflow:lite-execute` | Existing | docs: `.claude/commands/workflow/lite-execute.md` / Workflow Lite-Execute Command (/workflow:lite-execute) ; ts: `ccw/src/core/routes/commands-routes.ts` / result.projectCommands = scanCommandsRecursive(projectDir, projectDir, 'project', projectPath) | `Test-Path .claude/commands/workflow/lite-execute.md` | execution handoff target |
| `.workflow/project-tech.json` | Planned | docs: `.claude/commands/workflow/lite-fix.md` / Project Context (MANDATORY - Read Both Files) ; ts: `ccw/src/core/data-aggregator.ts` / const techFile = join(workflowDir, 'project-tech.json') | `Test-Path .workflow/project-tech.json` | optional project context input (may be created by other workflow commands) |
| `.workflow/project-guidelines.json` | Planned | docs: `.claude/commands/workflow/lite-fix.md` / Project Context (MANDATORY - Read Both Files) ; ts: `ccw/src/core/data-aggregator.ts` / const guidelinesFile = join(workflowDir, 'project-guidelines.json') | `Test-Path .workflow/project-guidelines.json` | optional project constraints input (may be created by other workflow commands) |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/workflow/lite-fix.md` / Implementation ; ts: `ccw/src/core/routes/commands-routes.ts` / export async function handleCommandsRoutes(ctx: RouteContext): Promise<boolean> | `Test-Path ccw/src/core/routes/commands-routes.ts` | repo-backed command discovery / grouping |
| `ccw/src/commands/workflow.ts` | Existing | docs: `.claude/commands/workflow/lite-fix.md` / Implementation ; ts: `ccw/src/commands/workflow.ts` / export async function workflowCommand( | `Test-Path ccw/src/commands/workflow.ts` | workflow CLI command entrypoint |

## Implementation Hints (Tooling/Server)

- `ccw/src/core/routes/commands-routes.ts` is the repo-backed scanner for command docs under `.claude/commands/**`, so keep the command doc path stable and group-consistent.
- `ccw/src/core/data-aggregator.ts` has first-class support for `.workflow/project-tech.json` and `.workflow/project-guidelines.json`; if lite-fix relies on them, document creation/fallback behavior.

## Proposed Fix Plan (Minimal)

- Add/verify an explicit severity mapping section and hotfix-shortening rules.
- Add/verify a single “handoff bundle” definition for `/workflow:lite-execute` (artifacts + clarifications + chosen strategy).
- Add/verify a missing-context fallback path when `.workflow/project-*.json` files do not exist.