# Gap Report: workflow:unified-execute-with-file

## Reference

- Selected reference: /workflow:lite-execute (`.claude/commands/workflow/lite-execute.md`)

## P0 Gaps (Must Fix)

- Ensure evidence tables remain verifiable as pointers evolve (no false `Existing`; keep docs + TS anchors literal and current).
- Clarify/lock down auto-mode semantics (`-y/--yes`) for prompts vs destructive actions (especially `--auto-commit`).
- Make multi-plan sequencing behavior explicit: one session per plan, deterministic ordering, and how failures affect subsequent plans.

## P1 Gaps (Should Fix)

- Define a minimal, machine-parseable event schema for `execution-events.md` (event types + required fields) and keep it append-only.
- Add a short “resume rules” section (how the next task is chosen from `execution-events.md`).
- Add 1–2 examples for “resume an existing session” and “review checkpoint output”.

## P2 Gaps (Optional)

- Add a compact troubleshooting table (common parse/git/task failures and recovery actions).
- Add a “best practices” note on scoping commits to task boundaries when `--auto-commit` is enabled.

## Implementation Pointers (Evidence)

You MUST provide an evidence table for all key implementation pointers mentioned in the outlines.

Rules (P0):
- Every pointer MUST be labeled `Existing` or `Planned`.
- `Existing` MUST be verifiable (path exists). Include a concrete `Verify` command for each existing pointer.
- Do NOT describe `Planned` pointers as “validated/exists”.
- Evidence MUST reference BOTH sources somewhere in this section:
  - command docs: `.claude/commands/**.md` (section heading is enough)
  - TypeScript implementation: `ccw/src/**` (function name / subcommand case / ripgrep-able string)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/unified-execute-with-file.md` | Existing | docs: `.claude/commands/workflow/unified-execute-with-file.md` / `Quick Start` ; ts: `ccw/src/tools/command-registry.ts` / `const relativePath = join('.claude', 'commands', 'workflow');` | `Test-Path .claude/commands/workflow/unified-execute-with-file.md` | command doc is the runtime implementation surface |
| `.workflow/.execution/` | Planned | docs: `.claude/commands/workflow/unified-execute-with-file.md` / `Output Structure` ; ts: `ccw/src/tools/session-manager.ts` / `const WORKFLOW_BASE = '.workflow';` | `Test-Path .workflow/.execution` | created at runtime; contains per-plan sessions |
| `.workflow/.execution/{sessionId}/execution-events.md` | Planned | docs: `.claude/commands/workflow/unified-execute-with-file.md` / `Output Artifacts` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path .workflow/.execution` | append-only log; resume uses it as state |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/execute.md` / `Workflow File Structure Reference` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path ccw/src/tools/session-manager.ts` | reference for existing workflow session conventions |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/lite-execute.md` / `Overview` ; ts: `ccw/src/tools/command-registry.ts` / `const relativePath = join('.claude', 'commands', 'workflow');` | `Test-Path ccw/src/tools/command-registry.ts` | discovery/metadata foundation for workflow commands |
| `ccw/src/commands/session-path-resolver.ts` | Existing | docs: `.claude/commands/workflow/execute.md` / `Performance Optimization Strategy` ; ts: `ccw/src/commands/session-path-resolver.ts` / `'IMPL_PLAN.md': 'plan',` | `Test-Path ccw/src/commands/session-path-resolver.ts` | reusable path resolution logic for plan/todo artifacts |
| `ccw/src/core/claude-freshness.ts` | Existing | docs: `.claude/commands/workflow/unified-execute-with-file.md` / `With auto-commit (conventional commits)` ; ts: `ccw/src/core/claude-freshness.ts` / `const output = execSync('git rev-parse HEAD', {` | `Test-Path ccw/src/core/claude-freshness.ts` | proven git exec usage patterns (timeouts + error handling) |

Notes:
- Use **one row per pointer**.
- Evidence format recommendation:
  - `docs: <file> / <section heading>`
  - `ts: <file> / <function|case|pattern>`

## Implementation Hints (Tooling/Server)

- Prefer “doc-as-implementation” for the slash command behavior; keep TS changes optional and narrowly scoped (e.g., only if the dashboard/help needs to surface new artifacts).
- Reuse existing `.workflow/*` conventions from `session-manager` rather than inventing a new parallel session model unless required.

## Proposed Fix Plan (Minimal)

1) P0 (docs): tighten auto-mode + auto-commit safety language and ensure multi-plan sequencing semantics are deterministic.
2) P1 (docs): define a minimal `execution-events.md` event schema + resume rules; add a small resume example.
3) P1 (tests, optional): add a lightweight verifier script (or existing check) to ensure event schema blocks stay parseable after edits.

