# Gap Report: workflow:lite-execute

## Reference

- Selected reference: /workflow:lite-execute (`.claude/commands/workflow/lite-execute.md`)

## P0 Gaps (Must Fix)

- Clarify tool boundary for file reads/writes described in the command (e.g., `.workflow/project-tech.json` update): ensure the implementation uses only `TodoWrite`, `Task`, and `Bash`, or update `allowed-tools` accordingly.

## P1 Gaps (Should Fix)

- Expand outline detail for the three input modes (prompt vs file vs in-memory) and include clear decision points (plan.json detection vs plain text).
- Make fixed-ID and resume behavior explicit (how IDs are generated, when to chain `--resume`).
- Document how code review selection works under `--yes` vs interactive selection (even if selection is implemented implicitly).

## P2 Gaps (Optional)

- Add a small “Data Structures” section mirroring `executionContext`/`executionResult` shapes to reduce ambiguity when integrating with lite-plan and CLI execution.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/lite-execute.md` | Existing | docs: `.claude/commands/workflow/lite-execute.md` / `Overview` ; ts: `ccw/src/tools/command-registry.ts` / `commandName.startsWith('/workflow:')` | `Test-Path .claude/commands/workflow/lite-execute.md` | Oracle command doc |
| `.claude/commands/workflow/lite-plan.md` | Existing | docs: `.claude/commands/workflow/lite-plan.md` / `Overview` ; ts: `ccw/src/tools/command-registry.ts` / `const filePath = join(this.commandDir, `${normalized}.md`);` | `Test-Path .claude/commands/workflow/lite-plan.md` | Produces `executionContext` for `--in-memory` |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/lite-execute.md` / `Usage` ; ts: `ccw/src/tools/command-registry.ts` / `commandName.startsWith('/workflow:')` | `Test-Path ccw/src/tools/command-registry.ts` | Loads workflow commands and parses frontmatter |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/workflow/lite-execute.md` / `Usage` ; ts: `ccw/src/core/routes/commands-routes.ts` / `scanCommandsRecursive(projectDir, projectDir, 'project', projectPath);` | `Test-Path ccw/src/core/routes/commands-routes.ts` | Enumerates project/user commands |
| `ccw/src/tools/cli-executor-core.ts` | Existing | docs: `.claude/commands/workflow/lite-execute.md` / `Execution Process` ; ts: `ccw/src/tools/cli-executor-core.ts` / `import { executeLiteLLMEndpoint } from './litellm-executor.js';` | `Test-Path ccw/src/tools/cli-executor-core.ts` | CLI execution + resume plumbing |

## Implementation Hints (Tooling/Server)

- Ensure command discovery metadata (name/description/allowed-tools/argument-hint) stays consistent with `ccw/src/tools/command-registry.ts` parsing.
- If the command relies on enabling/disabling command docs, validate the `.md.disabled` behavior stays compatible with `ccw/src/core/routes/commands-routes.ts` scanning.

## Proposed Fix Plan (Minimal)

1. Confirm whether `.workflow/project-tech.json` updates are executed via `Bash` (or internal runtime) and keep `allowed-tools` accurate.
2. Add/clarify a single unified “execution prompt builder” contract used for Agent and CLI execution.
3. Make resume/fixed-ID strategy explicit and test it on one sample batch.