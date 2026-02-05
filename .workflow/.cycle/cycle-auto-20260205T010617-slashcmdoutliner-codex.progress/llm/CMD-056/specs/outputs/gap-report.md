# Gap Report: workflow:test-cycle-execute

## Reference

- Selected reference: /workflow:test-cycle-execute (`.claude/commands/workflow/test-cycle-execute.md`)

## P0 Gaps (Must Fix)

- Git safety in commit strategy: the reference describes broad staging (`git add .`). Align with repo git safety rules by staging only files produced by the iteration (or require explicit opt-in before any commit/revert behavior).
- Evidence-based pointers: ensure any "Existing" pointer in the command doc (and any derivative outline) is verifiable and has dual-source evidence (docs + TS).

## P1 Gaps (Should Fix)

- Artifact-to-tool mapping clarity: make explicit which files are managed via session-manager routing (task/process/todo) so the workflow stays consistent with CCW tooling.
- Resume semantics: document exactly which files are required vs optional on resume (e.g., missing iteration-state.json should initialize safely).

## P2 Gaps (Optional)

- Cross-links: add links to upstream/downstream workflow commands (e.g., `/workflow:test-fix-gen`, `/workflow:tools:test-task-generate`, `/workflow:execute`) to reduce user confusion.
- Progressive testing explanation: clarify when affected-tests are used vs full suite.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/test-cycle-execute.md` | Existing | docs: `.claude/commands/workflow/test-cycle-execute.md` / `Workflow Test-Cycle-Execute Command` ; ts: `ccw/src/tools/command-registry.ts` / `const relativePath = join('.claude', 'commands', 'workflow')` | `Test-Path .claude/commands/workflow/test-cycle-execute.md` | Command doc target (oracle) |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/test-cycle-execute.md` / `Reference` ; ts: `ccw/src/tools/command-registry.ts` / `export class CommandRegistry {` | `Test-Path ccw/src/tools/command-registry.ts; rg \"export class CommandRegistry\" ccw/src/tools/command-registry.ts` | Verifies how command docs are discovered/parsed |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/test-cycle-execute.md` / `Session File Structure` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active'` | `Test-Path ccw/src/tools/session-manager.ts; rg \"const ACTIVE_BASE = '\\.workflow/active'\" ccw/src/tools/session-manager.ts` | Verifies session layout + artifact routing |
| `ccw/src/tools/cli-executor-core.ts` | Existing | docs: `.claude/commands/workflow/test-cycle-execute.md` / `CLI Tool Configuration` ; ts: `ccw/src/tools/cli-executor-core.ts` / `Supports Gemini, Qwen, and Codex with streaming output` | `Test-Path ccw/src/tools/cli-executor-core.ts; rg \"Supports Gemini, Qwen, and Codex with streaming output\" ccw/src/tools/cli-executor-core.ts` | Verifies the CLI surface for analysis/generation steps |
| `.workflow/active/<session>/.process/iteration-state.json` | Planned | docs: `.claude/commands/workflow/test-cycle-execute.md` / `Iteration State JSON` ; ts: `ccw/src/tools/session-manager.ts` / `process: '{base}/.process/{filename}'` | `rg \"process: '\\{base\\}/\\.process/\\{filename\\}'\" ccw/src/tools/session-manager.ts` | Runtime state file must be created/updated by the workflow loop |

## Implementation Hints (Tooling/Server)

- Prefer session-manager conventions for all session artifacts:
  - tasks: `{base}/.task/{task_id}.json`
  - process files: `{base}/.process/{filename}`
  - todo: `{base}/TODO_LIST.md`
- CLI execution and fallback can be grounded on the existing CLI executor tooling (Gemini/Qwen/Codex).

## Proposed Fix Plan (Minimal)

See `fix-plan.md`.

