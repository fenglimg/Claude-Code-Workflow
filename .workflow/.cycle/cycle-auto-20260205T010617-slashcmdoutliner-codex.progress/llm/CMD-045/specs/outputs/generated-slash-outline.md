---
name: review-cycle-fix
description: Automated fixing of code review findings with AI-powered planning and coordinated execution. Uses intelligent grouping, multi-stage timeline coordination, and test-driven verification.
argument-hint: "<export-file|review-dir> [--resume] [--max-iterations=N] [--batch-size=N]"
allowed-tools: Skill(*), TodoWrite(*), Read(*), Bash(*), Task(*), Edit(*), Write(*)
group: workflow
---

# Workflow Review-Cycle-Fix Command

## Overview

- Goal: Fix exported review findings by batching related issues, planning in parallel, executing fixes with conservative test verification, and tracking resumable progress.
- Command: `/workflow:review-cycle-fix`

## Usage

```bash
/workflow:review-cycle-fix <export-file|review-dir> [--resume] [--max-iterations=N] [--batch-size=N]
```

## Inputs

- Required inputs:
  - Either:
    - `<export-file>`: a findings export JSON (from the review cycle dashboard), or
    - `<review-dir>`: a `.review/` directory that contains exported findings (auto-discovers latest export)
- Optional inputs:
  - `--resume`: resume the latest active fix session (uses the session marker state file)
  - `--max-iterations=N`: max retries per finding (default: 3)
  - `--batch-size=N`: findings per planning batch (default: 5)

## Outputs / Artifacts

- Writes:
  - `.workflow/active/*/.review/active-fix-session.json` (session marker / resume)
  - `.workflow/active/*/.review/fixes/*/partial-plan-*.json` (per-batch planning output)
  - `.workflow/active/*/.review/fixes/*/fix-plan.json` (aggregated timeline + groups)
  - `.workflow/active/*/.review/fixes/*/fix-progress-*.json` (per-group progress updates)
  - `.workflow/active/*/.review/fixes/*/logs/*` (CLI stdout/stderr + test outputs)
- Reads:
  - `.workflow/active/*/.review/fix-export-*.json` (findings input)
  - `.workflow/active/*/.review/` (auto-discovery + session folder)
  - `.workflow/active/*/.review/fixes/*/fix-plan.json` (resume / execute)

## Implementation Pointers

- Command doc: `.claude/commands/workflow/review-cycle-fix.md`
- Likely code locations:
  - `.claude/agents/cli-planning-agent.md`
  - `.claude/agents/cli-execution-agent.md`
  - `ccw/src/tools/command-registry.ts`
  - `ccw/src/tools/cli-executor-core.ts`
  - `ccw/src/core/services/flow-executor.ts`
  - Reference: `.claude/commands/workflow/test-cycle-execute.md`

### Evidence (Existing vs Planned)

You MUST label each pointer as `Existing` (verifiable in repo now) or `Planned` (will be created/modified).

Rules:
- `Existing` MUST include evidence from BOTH:
  - a command doc source: `.claude/commands/**.md` (section heading is sufficient)
  - a TypeScript source: `ccw/src/**` (function name / subcommand case / a ripgrep-able string)
- If you cannot verify, downgrade to `Planned` and add a concrete `Verify` step (e.g. `Test-Path <path>`, `rg "<pattern>" <path>`).

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/review-cycle-fix.md` | Existing | docs: `.claude/commands/workflow/review-cycle-fix.md` / `Workflow Review-Cycle-Fix Command` ; ts: `ccw/src/tools/command-registry.ts` / `const relativePath = join('.claude', 'commands', 'workflow');` | `Test-Path .claude/commands/workflow/review-cycle-fix.md` | canonical command behavior + artifact contract |
| `.claude/agents/cli-planning-agent.md` | Existing | docs: `.claude/commands/workflow/review-cycle-fix.md` / `Agent Roles` ; ts: `ccw/src/tools/cli-executor-core.ts` / `const child = spawn(commandToSpawn, argsToSpawn, {` | `Test-Path .claude/agents/cli-planning-agent.md` | planning sub-agent for Phase 2 (batch plans) |
| `.claude/agents/cli-execution-agent.md` | Existing | docs: `.claude/commands/workflow/review-cycle-fix.md` / `Orchestrator Boundary (CRITICAL)` ; ts: `ccw/src/tools/cli-executor-core.ts` / `const child = spawn(commandToSpawn, argsToSpawn, {` | `Test-Path .claude/agents/cli-execution-agent.md` | execution sub-agent for Phase 3 (apply fixes + tests) |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `CommandRegistry Integration` ; ts: `ccw/src/tools/command-registry.ts` / `const relativePath = join('.claude', 'commands', 'workflow');` | `Test-Path ccw/src/tools/command-registry.ts` | metadata scanning for workflow command docs (frontmatter) |
| `ccw/src/tools/cli-executor-core.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `CLI Execution Model` ; ts: `ccw/src/tools/cli-executor-core.ts` / `const child = spawn(commandToSpawn, argsToSpawn, {` | `Test-Path ccw/src/tools/cli-executor-core.ts` | CLI tool execution substrate (stdout/stderr capture) |
| `ccw/src/core/services/flow-executor.ts` | Existing | docs: `.claude/commands/workflow/execute.md` / `Execution Process` ; ts: `ccw/src/core/services/flow-executor.ts` / `private async runSlashCommand(node: FlowNode): Promise<NodeResult> {` | `Test-Path ccw/src/core/services/flow-executor.ts` | command/flow execution engine (slash node execution) |
| `.claude/commands/workflow/test-cycle-execute.md` | Existing | docs: `.claude/commands/workflow/test-cycle-execute.md` / `Workflow Test-Cycle-Execute Command` ; ts: `ccw/src/core/services/flow-executor.ts` / `private async runSlashCommand(node: FlowNode): Promise<NodeResult> {` | `Test-Path .claude/commands/workflow/test-cycle-execute.md` | closest reference for multi-phase loop + agent orchestration |
| `.workflow/active/*/.review/fixes/*/` | Planned | docs: `.claude/commands/workflow/review-cycle-fix.md` / `Output File Structure` ; ts: `ccw/src/core/services/flow-executor.ts` / `private async runSlashCommand(node: FlowNode): Promise<NodeResult> {` | `Test-Path .workflow/active/*/.review/fixes` | runtime session output root for all fix artifacts |

Notes:
- Expand “Likely code locations” into **one row per pointer** (do not keep it as a single aggregated cell).
- For TS evidence, prefer anchors like `function <name>` / `case '<subcommand>'` / a stable string literal that can be found via `rg`.

## Execution Process

1. Discovery & initialization
   - Validate input mode (export-file vs review-dir vs --resume).
   - Resolve export JSON (auto-discover latest when given a directory).
   - Create (or load) `fix-session-id` and initialize session marker + folder layout.
2. Phase 1.5: Intelligent grouping & batching
   - Group findings by file proximity + dimension/root-cause affinity.
   - Emit batch descriptors sized by `--batch-size` (default 5).
3. Phase 2: Parallel planning coordination
   - Launch up to `MAX_PARALLEL=10` planning agents concurrently; each writes `partial-plan-*.json`.
   - Aggregate partial plans into `fix-plan.json` (resolve cross-batch dependencies; serialize conflicting file edits).
4. Phase 3: Execution orchestration (stage-based)
   - For each timeline stage, run groups in parallel or serial based on the aggregated plan.
   - Each execution agent applies fixes, runs targeted tests, and reports progress.
   - On test failure: rollback + retry up to `--max-iterations`; otherwise mark failed and continue.
5. Completion
   - Finalize progress state; summarize pass/fail per finding and where to continue manually if needed.

## Error Handling

- Input errors:
  - Missing/invalid export file or review directory -> fail fast with a clear message (do not create a session).
  - `--resume` without an active session marker -> explain how to pass an export-file or review-dir.
- Planning errors (Phase 2):
  - A planning agent fails -> mark the batch failed, continue planning other batches, then decide whether to abort or execute partial plan safely.
- Execution errors (Phase 3):
  - Test runner missing / command not found -> warn and continue (do not falsely claim verification).
  - Git rollback/commit failures -> stop affected group, persist logs, keep session resumable.

## Examples

```bash
# Fix from exported findings file (session-based path)
/workflow:review-cycle-fix .workflow/active/WFS-123/.review/fix-export-1706184622000.json

# Fix from review directory (auto-discovers latest export)
/workflow:review-cycle-fix .workflow/active/WFS-123/.review/

# Resume interrupted fix session
/workflow:review-cycle-fix --resume
```
