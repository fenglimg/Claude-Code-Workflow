---
name: multi-cli-plan
description: Multi-CLI collaborative planning workflow with ACE context gathering and iterative cross-verification. Uses cli-discuss-agent for Gemini+Codex+Claude analysis to converge on optimal execution plan.
argument-hint: "[-y|--yes] <task description> [--max-rounds=3] [--tools=gemini,codex] [--mode=parallel|serial]"
allowed-tools: TodoWrite(*), Task(*), AskUserQuestion(*), Read(*), Bash(*), Write(*), mcp__ace-tool__search_context(*)
group: workflow
---

# workflow:multi-cli-plan

## Overview

- Goal: Cross-verify multiple CLI/model perspectives, converge on a plan, then hand off an approved plan to `/workflow:lite-execute --in-memory`.
- Command: `/workflow:multi-cli-plan`

## Usage

```bash
/workflow:multi-cli-plan "<task description>" [--max-rounds=3] [--tools=gemini,codex,claude] [--mode=parallel|serial] [-y|--yes]
```

## Inputs

- Required inputs:
  - Task description (string)
- Optional inputs:
  - `--max-rounds=<n>` (default: 3)
  - `--tools=gemini,codex[,claude]`
  - `--mode=parallel|serial`
  - `-y|--yes` (auto-approve and proceed with recommended path)

## Outputs / Artifacts

- Writes:
  - `.workflow/.multi-cli-plan/<session-id>/session-state.json`
  - `.workflow/.multi-cli-plan/<session-id>/rounds/<n>/synthesis.json`
  - `.workflow/.multi-cli-plan/<session-id>/context-package.json`
  - `.workflow/.multi-cli-plan/<session-id>/plan.json`
- Reads:
  - `.workflow/.multi-cli-plan/<session-id>/session-state.json` (resume)
  - `.workflow/.multi-cli-plan/<session-id>/rounds/<n>/synthesis.json` (history)
  - Repo files surfaced via `mcp__ace-tool__search_context`

## Implementation Pointers

- Command doc: `.claude/commands/workflow/multi-cli-plan.md`
- Likely code locations:
  - `ccw/src/tools/command-registry.ts`
  - `ccw/src/core/lite-scanner.ts`
  - `ccw/src/core/routes/session-routes.ts`
  - `ccw/src/types/session.ts`

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/multi-cli-plan.md` | Existing | docs: `.claude/commands/workflow/multi-cli-plan.md` / `Quick Start` ; ts: `ccw/src/tools/command-registry.ts` / `join('.claude', 'commands', 'workflow')` | `Test-Path .claude/commands/workflow/multi-cli-plan.md` | Canonical command doc and discoverability via command registry |
| `.claude/commands/workflow/lite-execute.md` | Existing | docs: `.claude/commands/workflow/multi-cli-plan.md` / `Related Commands` ; ts: `ccw/src/tools/command-registry.ts` / `public getCommand(commandName: string): CommandMetadata | null {` | `Test-Path .claude/commands/workflow/lite-execute.md` | Handoff target after plan approval |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/plan.md` / `Execution Process` ; ts: `ccw/src/tools/command-registry.ts` / `class CommandRegistry {` | `Test-Path ccw/src/tools/command-registry.ts` | Command-doc indexing/parsing that impacts slash-command discoverability |
| `ccw/src/core/lite-scanner.ts` | Existing | docs: `.claude/commands/workflow/multi-cli-plan.md` / `Output File Structure` ; ts: `ccw/src/core/lite-scanner.ts` / `const multiCliDir = join(workflowDir, '.multi-cli-plan');` | `Test-Path ccw/src/core/lite-scanner.ts` | Scans `.workflow/.multi-cli-plan/*` sessions for UI/listing |
| `ccw/src/core/routes/session-routes.ts` | Existing | docs: `.claude/commands/workflow/multi-cli-plan.md` / `Output File Structure` ; ts: `ccw/src/core/routes/session-routes.ts` / `type: 'multi-cli-plan',` | `Test-Path ccw/src/core/routes/session-routes.ts` | Loads rounds and exposes `synthesis.json` to clients |
| `ccw/src/types/session.ts` | Planned | docs: `.claude/commands/workflow/multi-cli-plan.md` / `Output File Structure` ; ts: `ccw/src/types/session.ts` / `export type SessionType = 'workflow'` | `rg -n "SessionType" ccw/src/types/session.ts` | Add `multi-cli-plan` to the SessionType union for consistency with scanner/routes |
| `.workflow/.multi-cli-plan/<session-id>/rounds/<n>/synthesis.json` | Planned | docs: `.claude/commands/workflow/multi-cli-plan.md` / `synthesis.json Schema` ; ts: `ccw/src/core/routes/session-routes.ts` / `// Load multi-cli discussion rounds (rounds/*/synthesis.json)` | `rg -n "rounds/\\*\\/synthesis\\.json" ccw/src/core/routes/session-routes.ts` | Primary per-round output from `cli-discuss-agent` used for convergence and option presentation |

## Execution Process

1. Parse args (`task`, `--tools`, `--mode`, `--max-rounds`, `--yes`) and initialize a new session folder under `.workflow/.multi-cli-plan/<session-id>/`.
2. Phase 1 (Context): run `mcp__ace-tool__search_context` queries, extract relevant files/patterns, and write `context-package.json`.
3. Phase 2 (Iterative multi-CLI): for round `1..max-rounds`, delegate a Task to `cli-discuss-agent` with context + prior rounds; write `rounds/<n>/synthesis.json`.
4. Phase 3 (Present Options): summarize candidate solutions and trade-offs from the latest `synthesis.json`.
5. Phase 4 (User Decision): `AskUserQuestion` to select solution + execution method + review preference; if user requests more analysis, return to Phase 2.
6. Phase 5 (Plan + Handoff): delegate a Task to `cli-lite-planning-agent` to produce `plan.json`, then run `/workflow:lite-execute --in-memory` with the selected executionContext (or stop after plan generation if user declines).

## Error Handling

- ACE search fails: degrade to `Bash`-based discovery (`rg`, directory listing), record partial context in `context-package.json`.
- Agent/CLI failures: retry once; if still failing, continue with partial CLIs and flag uncertainty.
- No convergence by `--max-rounds`: present best-available options + risks and require explicit user decision.
- `synthesis.json` parse errors: request agent re-run that round and preserve prior rounds.
- User cancels: persist session artifacts and exit cleanly.

## Examples

```bash
/workflow:multi-cli-plan "Implement user authentication"
/workflow:multi-cli-plan "Add dark mode support" --max-rounds=3
/workflow:multi-cli-plan "Refactor payment module" --tools=gemini,codex,claude
/workflow:multi-cli-plan "Fix memory leak" --mode=serial
```

