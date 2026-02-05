---
name: plan
description: Batch plan issue resolution using issue-plan-agent (explore + plan closed-loop)
argument-hint: "[-y|--yes] --all-pending <issue-id>[,<issue-id>,...] [--batch-size 3]"
allowed-tools: TodoWrite(*), Task(*), Skill(*), AskUserQuestion(*), Bash(*), Read(*), Write(*)
group: issue
---

# Issue Plan Command (/issue:plan)

## Overview

- Goal: Batch plan one or more issues by running a closed-loop explore+plan agent and producing solution JSONL.
- Command: `/issue:plan`
- Behavior:
  - If a single solution is produced for an issue: bind automatically.
  - If multiple solutions are produced: return for user selection (unless auto mode).

## Usage

```bash
/issue:plan [<issue-id>[,<issue-id>,...]] [FLAGS]
```

## Inputs

- Required inputs:
  - None (default is `--all-pending`)
- Optional inputs:
  - `<issue-id>[,<issue-id>,...]`
  - Flags:
    - `--all-pending`
    - `--batch-size <n>` (default: 3)
    - `-y|--yes` (auto mode)

## Outputs / Artifacts

- Writes:
  - `.workflow/issues/solutions/{issue-id}.jsonl` (solutions produced by issue-plan-agent)
  - `.workflow/issues/issues.jsonl` (indirectly via `ccw issue` CLI: create/update/bind)
- Reads:
  - `.workflow/project-tech.json` (pre-req; created by `/workflow:init`)
  - `.workflow/project-guidelines.json` (pre-req; created by `/workflow:init` then populated by `/workflow:init-guidelines`)
  - `.claude/workflows/cli-templates/schemas/solution-schema.json`

## Implementation Pointers

- Command doc: `.claude/commands/issue/plan.md`
- Likely code locations:
  - `.codex/agents/issue-plan-agent.md` (executor)
  - `ccw/src/commands/issue.ts` (CLI used for status/list/bind/update/solutions)
  - `ccw/src/core/data-aggregator.ts` (project-tech/guidelines file usage)

### Evidence (Existing vs Planned)

You MUST label each pointer as `Existing` (verifiable in repo now) or `Planned` (will be created/modified).

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/issue/plan.md` | Existing | docs: `.claude/commands/issue/plan.md / Overview` ; ts: `ccw/src/templates/dashboard-js/views/commands-manager.js / Manages Claude Code commands (.claude/commands/)` | `Test-Path .claude/commands/issue/plan.md` | Slash command orchestrator doc |
| `.codex/agents/issue-plan-agent.md` | Existing | docs: `.claude/commands/issue/plan.md / Phase 2: Unified Explore + Plan (issue-plan-agent) - PARALLEL` ; ts: `ccw/src/commands/install.ts / const agentsPath = join(codexPath, 'agents');` | `Test-Path .codex/agents/issue-plan-agent.md` | Subagent that explores + plans and writes solutions |
| `ccw/src/commands/issue.ts` | Existing | docs: `.claude/commands/issue/plan.md / Core Guidelines` ; ts: `ccw/src/commands/issue.ts / case 'bind':` | `Test-Path ccw/src/commands/issue.ts` | Implements `ccw issue` CLI used by orchestrator/agent |
| `.workflow/project-tech.json` | Planned | docs: `.claude/commands/issue/plan.md / Project Context (MANDATORY)` ; ts: `ccw/src/core/data-aggregator.ts / join(workflowDir, 'project-tech.json')` | `Test-Path .workflow/project-tech.json` | Required project context input (created by `/workflow:init`) |
| `.workflow/project-guidelines.json` | Planned | docs: `.claude/commands/issue/plan.md / Project Context (MANDATORY)` ; ts: `ccw/src/core/data-aggregator.ts / join(workflowDir, 'project-guidelines.json')` | `Test-Path .workflow/project-guidelines.json` | Required constraints/conventions input (created by `/workflow:init`, populated by `/workflow:init-guidelines`) |

## Execution Process

- Phase 1: Issue loading & grouping (brief)
  - Parse input: comma-separated IDs or `--all-pending`.
  - Fetch brief metadata via CLI (avoid loading large JSONL directly).
  - Group semantically similar issues into batches (max `--batch-size`).
- Phase 2: Unified explore + plan (parallel)
  - Spawn `issue-plan-agent` per batch using `Task(...)`.
  - Agent workflow per issue:
    - Fetch full issue details via `ccw issue status <id> --json`.
    - Analyze prior failures (if any) and adjust approach.
    - Explore codebase (ACE-first), then produce solution tasks using solution schema.
    - Append solution JSON to `.workflow/issues/solutions/{issue-id}.jsonl`.
    - Binding decision:
      - Single solution: bind via `ccw issue bind <issue-id> <solution-id>`.
      - Multiple solutions: return `pending_selection` (no bind).
- Phase 3: Solution selection (if pending)
  - If not auto mode: prompt user to pick solution(s) and bind via CLI.
  - If auto mode: bind recommended without confirmation.
- Phase 4: Summary
  - Print counts and next-step hints (typically `/issue:queue` then `/issue:execute`).

## Error Handling

- Missing project context files: instruct user to run `/workflow:init` (and `/workflow:init-guidelines`) first.
- Issue not found: create/register via CLI (never edit JSONL directly).
- Agent returns no solution: surface error and suggest manual planning for that issue.
- User cancels selection: skip that issue and continue.
- Conflicts across issues: keep results but flag for sequencing (queue step).

## Examples

```bash
/issue:plan
/issue:plan GH-123
/issue:plan GH-123,GH-124,GH-125
/issue:plan --all-pending --batch-size 3
/issue:plan --all-pending -y
```
