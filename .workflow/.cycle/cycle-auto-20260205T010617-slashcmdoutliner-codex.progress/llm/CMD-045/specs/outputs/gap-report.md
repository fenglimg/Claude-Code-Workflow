# Gap Report: workflow:review-cycle-fix

## Reference

- Selected reference: /workflow:test-cycle-execute (`.claude/commands/workflow/test-cycle-execute.md`)

## P0 Gaps (Must Fix)

- None identified for the generated outline (frontmatter + required core sections present; evidence tables included).

## P1 Gaps (Should Fix)

- Align naming in docs vs agents: command docs reference `@cli-execute-agent`, while the repo agent file is `.claude/agents/cli-execution-agent.md` (confirm canonical name and update docs if needed).
- Tighten resume behavior description: specify precisely which marker file(s) are authoritative for `--resume` and what happens if multiple sessions exist.

## P2 Gaps (Optional)

- Add one end-to-end example that shows the resulting session folder tree after a successful run.
- Add a short “safe defaults” note (what happens if tests cannot be executed on the machine).

## Implementation Pointers (Evidence)

You MUST provide an evidence table for all key implementation pointers mentioned in the outlines.

Rules (P0):
- Every pointer MUST be labeled `Existing` or `Planned`.
- `Existing` MUST be verifiable (path exists). Include a concrete `Verify` command for each existing pointer.
- Do NOT describe `Planned` pointers as “validated/exists”.
- Evidence MUST reference BOTH sources:
  - command docs: `.claude/commands/**.md` (section heading is enough)
  - TypeScript implementation: `ccw/src/**` (function name / subcommand case / ripgrep-able string)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/review-cycle-fix.md` | Existing | docs: `.claude/commands/workflow/review-cycle-fix.md` / `Workflow Review-Cycle-Fix Command` ; ts: `ccw/src/tools/command-registry.ts` / `const relativePath = join('.claude', 'commands', 'workflow');` | `Test-Path .claude/commands/workflow/review-cycle-fix.md` | oracle command doc / artifact contract |
| `.claude/agents/cli-planning-agent.md` | Existing | docs: `.claude/commands/workflow/review-cycle-fix.md` / `Agent Roles` ; ts: `ccw/src/tools/cli-executor-core.ts` / `const child = spawn(commandToSpawn, argsToSpawn, {` | `Test-Path .claude/agents/cli-planning-agent.md` | batch planning agent |
| `.claude/agents/cli-execution-agent.md` | Existing | docs: `.claude/commands/workflow/review-cycle-fix.md` / `Orchestrator Boundary (CRITICAL)` ; ts: `ccw/src/tools/cli-executor-core.ts` / `const child = spawn(commandToSpawn, argsToSpawn, {` | `Test-Path .claude/agents/cli-execution-agent.md` | fix execution agent |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `CommandRegistry Integration` ; ts: `ccw/src/tools/command-registry.ts` / `const relativePath = join('.claude', 'commands', 'workflow');` | `Test-Path ccw/src/tools/command-registry.ts` | command metadata scanning for help/indexing |
| `ccw/src/tools/cli-executor-core.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `CLI Execution Model` ; ts: `ccw/src/tools/cli-executor-core.ts` / `const child = spawn(commandToSpawn, argsToSpawn, {` | `Test-Path ccw/src/tools/cli-executor-core.ts` | CLI execution substrate for tool-based agents |
| `ccw/src/core/services/flow-executor.ts` | Existing | docs: `.claude/commands/workflow/execute.md` / `Execution Process` ; ts: `ccw/src/core/services/flow-executor.ts` / `private async runSlashCommand(node: FlowNode): Promise<NodeResult> {` | `Test-Path ccw/src/core/services/flow-executor.ts` | execution engine (slash-command nodes) |
| `.claude/commands/workflow/test-cycle-execute.md` | Existing | docs: `.claude/commands/workflow/test-cycle-execute.md` / `Workflow Test-Cycle-Execute Command` ; ts: `ccw/src/core/services/flow-executor.ts` / `private async runSlashCommand(node: FlowNode): Promise<NodeResult> {` | `Test-Path .claude/commands/workflow/test-cycle-execute.md` | selected reference for loop + parallel planning patterns |
| `.workflow/active/*/.review/fixes/*/` | Planned | docs: `.claude/commands/workflow/review-cycle-fix.md` / `Output File Structure` ; ts: `ccw/src/core/services/flow-executor.ts` / `private async runSlashCommand(node: FlowNode): Promise<NodeResult> {` | `Test-Path .workflow/active/*/.review/fixes` | runtime outputs (created during execution) |

Notes:
- Use **one row per pointer**.
- Evidence format recommendation:
  - `docs: <file> / <section heading>`
  - `ts: <file> / <function|case|pattern>`

## Implementation Hints (Tooling/Server)

- Command discovery/indexing: `ccw/src/tools/command-registry.ts` scans `.claude/commands/workflow` and parses YAML frontmatter.
- CLI tool execution substrate: `ccw/src/tools/cli-executor-core.ts` spawns the selected CLI tool and captures stdout/stderr for logs.
- Flow execution: `ccw/src/core/services/flow-executor.ts` contains slash-command execution helpers (useful when this command is invoked as part of a larger workflow).

## Proposed Fix Plan (Minimal)

1. Docs: ensure `/workflow:review-cycle-fix` doc clearly specifies the three entry modes (export-file, review-dir, --resume) and the authoritative state files for resuming.
2. Agents: confirm `@cli-execute-agent` naming; update the command doc or agent naming to be consistent.
3. Evidence: keep implementation pointers labeled Existing|Planned and maintain dual-source evidence anchors.
