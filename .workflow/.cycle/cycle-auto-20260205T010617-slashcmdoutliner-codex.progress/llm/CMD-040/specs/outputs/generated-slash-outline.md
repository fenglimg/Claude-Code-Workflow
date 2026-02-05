---
name: lite-plan
description: Lightweight interactive planning workflow with in-memory planning, code exploration, and execution execute to lite-execute after user confirmation
argument-hint: "[-y|--yes] [-e|--explore] \"task description\"|file.md"
allowed-tools: TodoWrite(*), Task(*), Skill(*), AskUserQuestion(*)
group: workflow
---

# Workflow Lite-Plan Command (/workflow:lite-plan)

## Overview

- Goal: Produce a lightweight, interactive implementation plan with optional multi-angle exploration, then hand off an execution context to `/workflow:lite-execute` after user confirmation.
- Command: `/workflow:lite-plan`

## Usage

```bash
/workflow:lite-plan [-y|--yes] [-e|--explore] "<task description>"|file.md
```

## Flags

- `-y`, `--yes`: Auto mode; skip confirmations and clarification questions; auto-select execution/review defaults.
- `-e`, `--explore`: Force exploration phase (overrides auto-detection).

## Arguments

- `<task-description>` (required): Free-text task description OR a path to a `.md` file containing the task.

## Inputs

- Required inputs:
  - Task description string OR task markdown file path
- Optional inputs:
  - `--yes` / `-y`
  - `--explore` / `-e`

## Outputs / Artifacts

- Writes:
  - `.workflow/.lite-plan/{session-id}/exploration-{angle}.json`
  - `.workflow/.lite-plan/{session-id}/explorations-manifest.json`
  - `.workflow/.lite-plan/{session-id}/planning-context.md`
  - `.workflow/.lite-plan/{session-id}/plan.json`
  - `.workflow/.lite-plan/{session-id}/execution-context.json` (handoff payload to lite-execute)
- Reads:
  - `.claude/commands/workflow/lite-plan.md` (command definition)
  - `~/.claude/workflows/cli-templates/schemas/plan-json-schema.json` (plan.json schema for low-complexity path)
  - `<file.md>` (only if user passes a file path argument)

## Auto Mode Defaults

When `--yes` / `-y` is used:
- Clarification: skip
- Plan confirmation: auto "Allow"
- Execution method: auto "Auto"
- Code review: auto "Skip"

## Implementation Pointers

- Command doc: `.claude/commands/workflow/lite-plan.md`
- Likely code locations:
  - `ccw/src/tools/command-registry.ts`
  - `ccw/src/tools/session-manager.ts`
  - `ccw/src/commands/session-path-resolver.ts`
  - `ccw/src/core/lite-scanner.ts`
  - `ccw/src/core/services/flow-executor.ts`
  - `.claude/commands/workflow/lite-execute.md` (execution handoff target)

### Evidence (Existing vs Planned)

You MUST label each pointer as `Existing` (verifiable in repo now) or `Planned` (will be created/modified).

Rules:
- `Existing` MUST include evidence from BOTH:
  - a command doc source: `.claude/commands/**.md` (section heading is sufficient)
  - a TypeScript source: `ccw/src/**` (function name / subcommand case / a ripgrep-able string)
- If you cannot verify, downgrade to `Planned` and add a concrete `Verify` step (e.g. `Test-Path <path>`, `rg "<pattern>" <path>`).

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/lite-plan.md` | Existing | docs: `.claude/commands/workflow/lite-plan.md` / `Workflow Lite-Plan Command (/workflow:lite-plan)` ; ts: `ccw/src/tools/command-registry.ts` / `public getCommand(commandName: string): CommandMetadata | null {` | `Test-Path .claude/commands/workflow/lite-plan.md` | Oracle command doc and required frontmatter. |
| `.claude/commands/workflow/lite-execute.md` | Existing | docs: `.claude/commands/workflow/lite-execute.md` / `Workflow Lite-Execute Command (/workflow:lite-execute)` ; ts: `ccw/src/tools/command-registry.ts` / `const normalized = commandName.startsWith('/workflow:')` | `Test-Path .claude/commands/workflow/lite-execute.md` | Execution handoff target; must be discoverable and consistent. |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/lite-plan.md` / `Usage` ; ts: `ccw/src/tools/command-registry.ts` / `const normalized = commandName.startsWith('/workflow:')` | `Test-Path ccw/src/tools/command-registry.ts` | Loads slash command docs and allowed-tools metadata. |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/lite-plan.md` / `Output Artifacts` ; ts: `ccw/src/tools/session-manager.ts` / `const LITE_PLAN_BASE = '.workflow/.lite-plan';` | `Test-Path ccw/src/tools/session-manager.ts` | Stores lite-plan sessions/artifacts under `.workflow/.lite-plan`. |
| `ccw/src/commands/session-path-resolver.ts` | Existing | docs: `.claude/commands/workflow/lite-plan.md` / `Output Artifacts` ; ts: `ccw/src/commands/session-path-resolver.ts` / `'plan.json': 'lite-plan'` | `Test-Path ccw/src/commands/session-path-resolver.ts` | Routes `plan.json` and related artifacts to the correct content type. |
| `ccw/src/core/lite-scanner.ts` | Existing | docs: `.claude/commands/workflow/lite-plan.md` / `Session Folder Structure` ; ts: `ccw/src/core/lite-scanner.ts` / `if (type === 'lite-plan') {` | `Test-Path ccw/src/core/lite-scanner.ts` | Scans lite-plan directories and reads plan outputs for dashboards/tools. |
| `ccw/src/core/services/flow-executor.ts` | Existing | docs: `.claude/commands/workflow/lite-plan.md` / `Execution Process` ; ts: `ccw/src/core/services/flow-executor.ts` / `private async runSlashCommand(node: FlowNode): Promise<NodeResult> {` | `Test-Path ccw/src/core/services/flow-executor.ts` | Executes slash-command nodes (relevant if lite-plan runs within a flow graph). |

Notes:
- For TS evidence, anchors are literal substrings in the referenced file (verifiable via `rg`).

## Execution Process

1. Parse input arguments (text vs `.md` file path) and flags (`--yes`, `--explore`).
2. Assess complexity (Low/Medium/High) and decide whether exploration is required (auto-detect or forced via `--explore`).
3. Phase 1 (optional): Run 1-4 parallel exploration angles; write `exploration-{angle}.json` + `explorations-manifest.json`.
4. Phase 2 (optional, interactive): Aggregate/deduplicate clarification needs; ask user up to 4 questions per round (multi-round allowed).
5. Phase 3 (planning only): Produce `plan.json` (low → direct per schema; medium/high → lite planning agent), plus `planning-context.md`.
6. Phase 4 (confirmation): Ask user to Allow/Modify/Cancel; choose execution method (Agent/Codex/Auto); choose review (Gemini/Agent/Skip). Auto mode preselects defaults.
7. Phase 5 (handoff): Build `execution-context.json` and invoke `/workflow:lite-execute` with the assembled context.

## Error Handling

- Missing/invalid args: require a task description or `.md` path; show usage and abort.
- File read failure: if `<file.md>` not found/unreadable, abort with a clear path-specific message.
- Large input protection: if file content is large, force exploration workflow rather than dumping content into planning.
- Artifact IO failures: if session directory or artifact writes fail, abort and report which file could not be written.
- User cancels at confirmation: stop without executing and leave generated artifacts intact for later.

## Examples

- Interactive:
  - `/workflow:lite-plan "Implement JWT auth for the API"`
- Auto mode (no confirmations):
  - `/workflow:lite-plan --yes "Implement JWT auth for the API"`
- Auto mode + forced exploration:
  - `/workflow:lite-plan -y -e "Optimize database query performance"`

