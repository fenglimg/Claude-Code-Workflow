# Gap Report: workflow:tools:test-task-generate

## Reference

- Selected reference: /workflow:tools:task-generate-agent (`.claude/commands/workflow/tools/task-generate-agent.md`)

## P0 Gaps (Must Fix)

- `allowed-tools` is missing in the oracle command doc frontmatter; CCW quality gates require it. Add an explicit tool list that matches actual behavior (Task/Read/Write/Glob).
- The oracle command doc references an external absolute agent path; prefer the repo-verifiable pointer `.claude/agents/test-action-planning-agent.md`.
- Verify the runtime command discovery path:
  - UI/API scanning is recursive (`ccw/src/core/routes/commands-routes.ts`), but `CommandRegistry` appears workflow-flat (no subdir support). Ensure the execution path for `/workflow:tools:*` does not rely on a non-recursive registry.

## P1 Gaps (Should Fix)

- Preconditions are implicit; make them explicit at the top (required input files and which upstream commands produce them).
- Fallback behavior for missing/invalid `test-context-package.json` should be called out consistently (what degrades, what remains required).
- Output validation should include a minimal checklist (files exist; JSON parses; task count >= 4).

## P2 Gaps (Optional)

- Add performance notes (avoid loading huge context; read only what is needed).
- Add a short “why planning-only” blurb in Integration & Usage to reduce misuse.

## Implementation Pointers (Evidence)

You MUST provide an evidence table for all key implementation pointers mentioned in the outlines.

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/tools/test-task-generate.md` | Existing | docs: `.claude/commands/workflow/tools/test-task-generate.md` / `Execution Process` ; ts: `ccw/src/core/routes/commands-routes.ts` / `function scanCommandsRecursive(` | `Test-Path .claude/commands/workflow/tools/test-task-generate.md` | User-facing contract for phases, inputs, and artifacts |
| `.claude/agents/test-action-planning-agent.md` | Existing | docs: `.claude/commands/workflow/tools/test-task-generate.md` / `Agent Invocation` ; ts: `ccw/src/tools/command-registry.ts` / `const toolsStr = header['allowed-tools']` | `Test-Path .claude/agents/test-action-planning-agent.md` | Planning agent specialization for test-layered tasks |
| `.claude/agents/test-fix-agent.md` | Existing | docs: `.claude/commands/workflow/tools/test-task-generate.md` / `Test Execution & Fix (IMPL-002+)` ; ts: `ccw/src/types/loop.ts` / `prompt_template?: string;` | `Test-Path .claude/agents/test-fix-agent.md` | Downstream agent referenced by generated task JSONs (execution phase) |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/workflow/tools/test-task-generate.md` / `Output` ; ts: `ccw/src/core/routes/commands-routes.ts` / `key === 'allowed-tools'` | `Test-Path ccw/src/core/routes/commands-routes.ts` | Recursive command scanning + frontmatter parsing (group inference for nested commands) |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/test-fix-gen.md` / `Execution Process` ; ts: `ccw/src/tools/command-registry.ts` / `private findCommandDir(): string` | `Test-Path ccw/src/tools/command-registry.ts` | Registry behavior to verify for nested `tools/` commands |

## Implementation Hints (Tooling/Server)

- Prefer treating `/workflow:tools:*` commands as docs-driven coordinators that:
  - validate preconditions under `.workflow/active/<session>/`
  - delegate heavy work to specialized agents via `Task(...)`
  - write deterministic artifacts (paths and formats) for downstream commands
- If any runtime layer depends on `CommandRegistry`, confirm it can resolve nested command docs or switch the lookup to the recursive scanner used by commands routes.

## Proposed Fix Plan (Minimal)

1. [docs] Add `allowed-tools: Task(*), Read(*), Write(*), Glob(*)` (and optionally `group: workflow`) to `.claude/commands/workflow/tools/test-task-generate.md` frontmatter.
2. [docs] Replace external absolute agent reference with `.claude/agents/test-action-planning-agent.md`.
3. [docs] Add a short Preconditions block listing required input files and which upstream commands produce them.
4. [tooling] Verify how `/workflow:tools:*` command execution resolves docs; ensure nested docs are supported.
5. [validation] Add a minimal “outputs exist + JSON parses + task count >= 4” checklist.
