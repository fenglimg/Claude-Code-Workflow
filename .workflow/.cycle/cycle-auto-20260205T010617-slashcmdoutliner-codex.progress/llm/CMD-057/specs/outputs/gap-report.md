# Gap Report: workflow:test-fix-gen

## Reference

- Selected reference: /workflow:test-cycle-execute (`.claude/commands/workflow/test-cycle-execute.md`)

## P0 Gaps (Must Fix)

- None identified for the generated outlines (frontmatter/tooling/core sections present; evidence tables included). Any evidence-gate failures should be treated as P0 and fixed immediately.

## P1 Gaps (Should Fix)

- Missing structure-hint sections that appear in the oracle doc and improve implementability:
  - `Core Rules` (explicitly list orchestrator invariants: start immediately, parse every output, do not stop, task attachment/collapse)
  - `Coordinator Checklist` (phase-by-phase verification checklist for autonomous runs)
  - `Related Commands` (prereqs + called commands + follow-ups)
  - Optional doc-only sections: `Data Flow` and `Execution Flow Diagram` (even as concise diagrams/ASCII blocks)
- Inputs section could be clearer on mode detection and file-path vs text ambiguity; recommend documenting precedence rules (WFS-* > existing path > treat as text).

## P2 Gaps (Optional)

- Add a short note about CLI tool preference / semantic detection (if supported) and how it affects agent choice (Codex vs others), without inventing new architecture.
- Add a compact example showing session mode validation failure (source session missing/incomplete) and the exact expected error format.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/test-fix-gen.md` | Existing | docs: `.claude/commands/workflow/test-fix-gen.md` / `Execution Process` ; ts: `ccw/src/commands/session.ts` / `const result = await executeTool('session_manager', params);` | `Test-Path .claude/commands/workflow/test-fix-gen.md` | Oracle command doc and the canonical headings to align with |
| `.claude/commands/workflow/test-cycle-execute.md` | Existing | docs: `.claude/commands/workflow/test-cycle-execute.md` / `How It Works` ; ts: `ccw/src/commands/loop.ts` / `const loopManager = new LoopManager(sessionDir);` | `Test-Path .claude/commands/workflow/test-cycle-execute.md` | Follow-up command; aligns next-step guidance and orchestrator boundary language |
| `.claude/commands/workflow/brainstorm/auto-parallel.md` | Existing | docs: `.claude/commands/workflow/brainstorm/auto-parallel.md` / `TodoWrite Pattern` ; ts: `ccw/src/tools/loop-manager.ts` / `setImmediate(() => this.runNextStep(loopId).catch(err => {` | `Test-Path .claude/commands/workflow/brainstorm/auto-parallel.md` | Reference for auto-continue + task attachment/collapse patterns |
| `.claude/commands/workflow/tools/test-task-generate.md` | Existing | docs: `.claude/commands/workflow/tools/test-task-generate.md` / `Directory Structure` ; ts: `ccw/src/commands/loop.ts` / `const loopManager = new LoopManager(sessionDir);` | `Test-Path .claude/commands/workflow/tools/test-task-generate.md` | Downstream artifact contract (IMPL plan, TODO list, task JSONs) |
| `.workflow/active/<testSessionId>/TODO_LIST.md` | Planned | docs: `.claude/commands/workflow/tools/test-task-generate.md` / `Directory Structure` ; ts: `ccw/src/commands/loop.ts` / `const loopManager = new LoopManager(sessionDir);` | `Test-Path .workflow/active` | Key orchestrator validation: task list exists before returning summary |
| `ccw/src/commands/session.ts` | Existing | docs: `.claude/commands/workflow/session/start.md` / `Output Format Specification` ; ts: `ccw/src/commands/session.ts` / `const result = await executeTool('session_manager', params);` | `Test-Path ccw/src/commands/session.ts` | CLI session lifecycle conventions; useful when documenting session metadata expectations |

## Implementation Hints (Tooling/Server)

- Prefer established auto-continue / orchestrator conventions from the reference commands; keep the orchestrator as glue code that calls other slash commands via `Skill(...)`, parses outputs, and updates TodoWrite phase status.
- Validation should be file-system based (existence + expected filenames) and should not claim success if any phase artifact is missing.

## Proposed Fix Plan (Minimal)

See `fix-plan.md`.

