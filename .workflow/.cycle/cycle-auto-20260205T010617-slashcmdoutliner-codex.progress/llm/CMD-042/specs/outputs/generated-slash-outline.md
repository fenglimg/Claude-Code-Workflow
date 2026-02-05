---
name: plan-verify
description: Perform READ-ONLY verification analysis between IMPL_PLAN.md, task JSONs, and brainstorming artifacts. Generates structured report with quality gate recommendation. Does NOT modify any files.
argument-hint: "[optional: --session session-id]"
allowed-tools: Read(*), Write(*), Glob(*), Bash(*)
group: workflow
---

# plan-verify

## Overview

- Goal: Produce a structured verification report comparing planning artifacts (IMPL_PLAN.md + task JSONs) against authoritative synthesis artifacts, with a clear proceed/block recommendation.
- Command: `/workflow:plan-verify`

## Usage

```bash
/workflow:plan-verify [--session <WFS-session-id>]
```

## Inputs

- Required inputs:
  - Active workflow session containing: `.brainstorming/*/analysis.md`, `IMPL_PLAN.md`, and `.task/*.json`
- Optional inputs:
  - `--session <WFS-session-id>` (required when multiple active sessions exist)

## Outputs / Artifacts

- Writes:
  - `.workflow/active/WFS-{session}/.process/PLAN_VERIFICATION.md`
- Reads:
  - `.workflow/active/WFS-{session}/IMPL_PLAN.md`
  - `.workflow/active/WFS-{session}/.task/*.json`
  - `.workflow/active/WFS-{session}/.brainstorming/*/analysis.md`
  - `.workflow/active/WFS-{session}/workflow-session.json` (optional)
  - `.workflow/active/WFS-{session}/planning-notes.md` (optional)

## Implementation Pointers

- Command doc: `.claude/commands/workflow/plan-verify.md`
- Likely code locations:
  - `ccw/src/tools/command-registry.ts` (loads `.claude/commands/**.md` command definitions)
  - `ccw/src/tools/session-manager.ts` (canonical session artifact routing: IMPL_PLAN, .task, .process)
  - `ccw/src/commands/loop.ts` (active session discovery under `.workflow/active/WFS-*`)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/plan-verify.md` | Existing | docs: .claude/commands/workflow/plan-verify.md / Goal ; ts: ccw/src/tools/command-registry.ts / const normalized = commandName.startsWith('/workflow:') | `Test-Path .claude/commands/workflow/plan-verify.md` | Oracle command doc for workflow + artifact contract |
| `ccw/src/tools/command-registry.ts` | Existing | docs: .claude/commands/workflow/plan-verify.md / User Input ; ts: ccw/src/tools/command-registry.ts / // Read command file | `Test-Path ccw/src/tools/command-registry.ts` | How commands are resolved from `.claude/commands/**.md` at runtime |
| `ccw/src/tools/session-manager.ts` | Existing | docs: .claude/commands/workflow/plan-verify.md / Execution Steps ; ts: ccw/src/tools/session-manager.ts / process: '{base}/.process/{filename}', | `Test-Path ccw/src/tools/session-manager.ts` | Session path conventions for `.process/`, `.task/`, and `IMPL_PLAN.md` |
| `ccw/src/commands/loop.ts` | Existing | docs: .claude/commands/workflow/plan-verify.md / Execution Steps ; ts: ccw/src/commands/loop.ts / const workflowDir = join(cwd, '.workflow', 'active'); | `Test-Path ccw/src/commands/loop.ts` | Reference implementation for locating active sessions under `.workflow/active/` |
| `.workflow/active/WFS-{session}/.process/PLAN_VERIFICATION.md` | Planned | docs: .claude/commands/workflow/plan-verify.md / Goal ; ts: ccw/src/tools/session-manager.ts / process: '{base}/.process/{filename}', | `Test-Path .workflow/active/WFS-<session>/.process/PLAN_VERIFICATION.md` | Single allowed output artifact (report) |
| `.workflow/active/WFS-{session}/IMPL_PLAN.md` | Planned | docs: .claude/commands/workflow/plan-verify.md / Execution Steps ; ts: ccw/src/tools/session-manager.ts / plan: '{base}/IMPL_PLAN.md', | `Test-Path .workflow/active/WFS-<session>/IMPL_PLAN.md` | Required input produced by `/workflow:plan` |
| `.workflow/active/WFS-{session}/.task/*.json` | Planned | docs: .claude/commands/workflow/plan-verify.md / Execution Steps ; ts: ccw/src/tools/session-manager.ts / task: '{base}/.task/{task_id}.json', | `Test-Path .workflow/active/WFS-<session>/.task` | Required inputs produced by `/workflow:plan` |

## Execution Process

1. Initialize analysis context
   - Resolve `session_id` from `--session` or auto-detect under `.workflow/active/WFS-*` (fail if none; require `--session` if ambiguous).
   - Compute `session_dir`, `brainstorm_dir`, `task_dir`, `process_dir`.
   - Ensure `process_dir` exists (only write target).
2. Validate required artifacts (abort if missing)
   - Required: `.brainstorming/*/analysis.md`, `IMPL_PLAN.md`, `.task/*.json`
   - Optional (warn + continue): `workflow-session.json`, `planning-notes.md`
3. Load artifacts (progressive disclosure)
   - Parse role analysis docs as authoritative requirements/design decisions.
   - Extract plan overview + task inventory from IMPL_PLAN + task JSONs.
4. Detection passes (multi-dimensional)
   - Check: requirements coverage, inconsistencies, dependencies, synthesis alignment, constraint compliance, duplication, feasibility.
   - Assign severity (CRITICAL/HIGH/MEDIUM/LOW) and locate each finding (file + section/task id).
5. Generate report
   - Write `.process/PLAN_VERIFICATION.md` with: executive summary + recommendation, findings summary table, analysis by dimension, findings by severity, and remediation next steps.
6. Next step selection
   - Print recommended next actions based on the quality gate (re-plan/re-verify vs proceed to execute).

## Error Handling

- No active session found: emit error and instruct `--session <WFS-session-id>`
- Missing role analysis docs: error (requires prior synthesis)
- Missing IMPL_PLAN.md or no task JSONs: error (requires `/workflow:plan`)
- Optional context missing (workflow-session.json / planning-notes.md): warning + continue, record as skipped in report

## Examples

```bash
/workflow:plan-verify
```

```bash
/workflow:plan-verify --session WFS-20260205-010000
```

