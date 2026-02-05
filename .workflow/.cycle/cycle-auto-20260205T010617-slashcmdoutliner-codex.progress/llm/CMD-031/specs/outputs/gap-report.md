# Gap Report: workflow:synthesis

## Reference

- Selected reference: /workflow:brainstorm:synthesis (`.claude/commands/workflow/brainstorm/synthesis.md`)

## P0 Gaps (Must Fix)

- Command name mapping ambiguity: requirement doc says `/workflow:synthesis`, but the oracle doc is located under `.claude/commands/workflow/brainstorm/` and this repo contains many nested invocations like `/workflow:session:start` and `/workflow:brainstorm:auto-parallel`. Verify how the runner resolves nested paths so the documented invocation is correct.
- Tooling mismatch risk: `ccw/src/tools/command-registry.ts` reads only `.claude/commands/workflow/<name>.md` (flat). If any automation relies on this tool, nested commands (like `workflow/brainstorm/synthesis.md`) will not be discoverable via `getCommand()`. Decide whether to (a) keep nested docs but avoid this tool, or (b) enhance the tool to support nested names.

## P1 Gaps (Should Fix)

- Ensure the command doc explicitly documents Auto Mode and the AskUserQuestion constraints (max 4 questions per call) in a single place that implementers can follow.
- Ensure the Finalization phase explicitly lists which files are updated (context package and session metadata), to prevent broken artifact references.

## P2 Gaps (Optional)

- Add a short "Quick Reference" phase summary table (if not already present) and 1-2 end-to-end examples (interactive vs auto).

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/brainstorm/synthesis.md` | Existing | docs: `.claude/commands/workflow/brainstorm/synthesis.md` / `Execution Phases` ; ts: `ccw/src/core/routes/commands-routes.ts` / `scanCommandsRecursive(` | `Test-Path .claude/commands/workflow/brainstorm/synthesis.md; rg \"^## Execution Phases\" .claude/commands/workflow/brainstorm/synthesis.md` | Oracle command doc that defines the intended phases and artifacts |
| `.claude/commands/workflow/session/start.md` | Existing | docs: `.claude/commands/workflow/session/start.md` / `Overview` ; ts: `ccw/src/core/routes/commands-routes.ts` / `getCommandGroup(commandName: string, relativePath: string, location: CommandLocation, projectPath: string): string {` | `Test-Path .claude/commands/workflow/session/start.md; rg \"^## Overview\" .claude/commands/workflow/session/start.md` | Reference for `--session` patterns and `.workflow/active/WFS-*` conventions |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/workflow/brainstorm/synthesis.md` / `Task Tracking` ; ts: `ccw/src/core/routes/commands-routes.ts` / `function scanCommandsRecursive(` | `Test-Path ccw/src/core/routes/commands-routes.ts; rg \"function scanCommandsRecursive\\(\" ccw/src/core/routes/commands-routes.ts` | Server/tooling path that recursively scans `.claude/commands/**` (nested docs) |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/brainstorm/synthesis.md` / `Auto Mode` ; ts: `ccw/src/tools/command-registry.ts` / `const filePath = join(this.commandDir,` | `Test-Path ccw/src/tools/command-registry.ts; rg \"const filePath = join\\(this\\.commandDir,\" ccw/src/tools/command-registry.ts` | Important limitation: tool looks for a flat file under `.claude/commands/workflow/` |

## Implementation Hints (Tooling/Server)

- Prefer recursive `.claude/commands/**` scanning behavior (as in `ccw/src/core/routes/commands-routes.ts`) when you need nested command discovery.
- If a CLI/tool depends on `CommandRegistry.getCommand()`, decide whether to extend it to resolve nested command paths (e.g. mapping `brainstorm:synthesis` -> `workflow/brainstorm/synthesis.md`) or to avoid using it for nested commands.

## Proposed Fix Plan (Minimal)

See `fix-plan.md`.
