# Gap Report: workflow:tools:task-generate-agent

## Reference

- Selected reference: /workflow:tools:task-generate-agent (`.claude/commands/workflow/tools/task-generate-agent.md`)

## P0 Gaps (Must Fix)

- None identified for the generated outline (frontmatter present; core sections present; evidence tables provided and verifiable).

## P1 Gaps (Should Fix)

- Generated outline is intentionally concise; it does not fully enumerate the reference doc's detailed prompt sections (TASK OBJECTIVE, PLANNING NOTES blocks, CLI execution ID requirements, quality standards, success criteria, planning notes record formats).
- Clarify the exact behavior for missing prerequisite inputs (e.g., whether to hard-fail vs graceful-degrade when `context-package.json` is absent).
- Ensure command docs explicitly state that `prioritized_context` ordering is already computed and must not be re-sorted (reference emphasizes this).

## P2 Gaps (Optional)

- Add additional examples for multi-module sessions (N+1 mode), including CROSS:: dependency placeholder examples.
- Add a short "Related Commands" section (upstream: context-gather; downstream: execute) to make phase transitions explicit.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/tools/task-generate-agent.md` | Existing | docs: `.claude/commands/workflow/tools/task-generate-agent.md` / `Execution Process` ; ts: `ccw/src/tools/command-registry.ts` / `const relativePath = join('.claude', 'commands', 'workflow');` | `Test-Path .claude/commands/workflow/tools/task-generate-agent.md` | Oracle command doc; primary behavior definition |
| `ccw/src/tools/ask-question.ts` | Existing | docs: `.claude/commands/workflow/tools/task-generate-agent.md` / `Document Generation Lifecycle` ; ts: `ccw/src/tools/ask-question.ts` / `name: 'ask_question',` | `Test-Path ccw/src/tools/ask-question.ts` | Interactive configuration surface (Phase 0) |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/tools/task-generate-agent.md` / `Execution Process` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path ccw/src/tools/session-manager.ts` | Session storage + routing for workflow artifacts |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/tools/task-generate-agent.md` / `Overview` ; ts: `ccw/src/tools/command-registry.ts` / `export class CommandRegistry {` | `Test-Path ccw/src/tools/command-registry.ts` | Command metadata parsing/lookup |
| `.workflow/active/WFS-{session-id}/IMPL_PLAN.md` | Planned | docs: `.claude/commands/workflow/tools/task-generate-agent.md` / `Execution Process` ; ts: `ccw/src/tools/session-manager.ts` / `plan: '{base}/IMPL_PLAN.md',` |  | Planning document output |
| `.workflow/active/WFS-{session-id}/TODO_LIST.md` | Planned | docs: `.claude/commands/workflow/tools/task-generate-agent.md` / `Execution Process` ; ts: `ccw/src/tools/session-manager.ts` / `todo: '{base}/TODO_LIST.md',` |  | TODO list output |
| `.workflow/active/WFS-{session-id}/.task/IMPL-*.json` | Planned | docs: `.claude/commands/workflow/tools/task-generate-agent.md` / `Execution Process` ; ts: `ccw/src/tools/session-manager.ts` / `task: '{base}/.task/{task_id}.json',` |  | Task JSON outputs |

## Implementation Hints (Tooling/Server)

- Prefer the session abstraction for artifact routing (see `ccw/src/tools/session-manager.ts`) so plan/todo/task paths stay consistent with CCW conventions.
- Use the interactive question surface (see `ccw/src/tools/ask-question.ts`) for Phase 0; keep auto-mode deterministic when `-y|--yes`.
- If any UI/registry path depends on command frontmatter metadata, ensure `allowed-tools` is present and accurate (see `ccw/src/tools/command-registry.ts` parsing for `allowed-tools`).

## Proposed Fix Plan (Minimal)

- P1: Expand the generated outline's Execution Process with the minimal set of reference prompt sections required for consistent agent outputs (especially CLI execution ID requirements + planning notes record formats).
- P1: Add an explicit prerequisite check note: require `context-package.json` from `/workflow:tools:context-gather` before planning.
- P2: Add multi-module example and CROSS:: resolution note to reduce user confusion.

