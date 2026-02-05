# Gap Report: issue:plan

## Reference

- Selected reference: /issue:plan (`.claude/commands/issue/plan.md`)

## P0 Gaps (Must Fix)

- Evidence gating: all key pointers must be labeled Existing/Planned with dual-source evidence and must pass `verify-evidence.js`.
- Pre-req clarity: `.workflow/project-tech.json` and `.workflow/project-guidelines.json` are required inputs but may be missing in a fresh repo; treat as Planned and instruct to run `/workflow:init` (and `/workflow:init-guidelines`) before planning.

## P1 Gaps (Should Fix)

- Make the auto-mode decision points explicit in the outline (when to bypass AskUserQuestion).
- Make binding rules explicit (single-solution bind vs multi-solution pending selection).

## P2 Gaps (Optional)

- Add a short "Bash compatibility" note (PowerShell vs bash invocations) if the command is frequently run outside CCW.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/issue/plan.md` | Existing | docs: `.claude/commands/issue/plan.md / Execution Process` ; ts: `ccw/src/templates/dashboard-js/views/commands-manager.js / Manages Claude Code commands (.claude/commands/)` | `Test-Path .claude/commands/issue/plan.md` | Orchestrator command doc |
| `.codex/agents/issue-plan-agent.md` | Existing | docs: `.claude/commands/issue/plan.md / Phase 2: Unified Explore + Plan (issue-plan-agent) - PARALLEL` ; ts: `ccw/src/commands/install.ts / const agentsPath = join(codexPath, 'agents');` | `Test-Path .codex/agents/issue-plan-agent.md` | Subagent invoked via Task() |
| `ccw/src/commands/issue.ts` | Existing | docs: `.claude/commands/issue/plan.md / Plan Issues` ; ts: `ccw/src/commands/issue.ts / case 'status':` | `Test-Path ccw/src/commands/issue.ts` | CLI supports status/list/bind/update/queue/solutions |
| `.workflow/project-tech.json` | Planned | docs: `.claude/commands/issue/plan.md / Project Context (MANDATORY)` ; ts: `ccw/src/core/data-aggregator.ts / join(workflowDir, 'project-tech.json')` | `Test-Path .workflow/project-tech.json` | Required context file (created by `/workflow:init`) |
| `.workflow/project-guidelines.json` | Planned | docs: `.claude/commands/issue/plan.md / Project Context (MANDATORY)` ; ts: `ccw/src/core/data-aggregator.ts / join(workflowDir, 'project-guidelines.json')` | `Test-Path .workflow/project-guidelines.json` | Required constraints file (created by `/workflow:init`, filled by `/workflow:init-guidelines`) |

## Implementation Hints (Tooling/Server)

- Prefer CLI for issue CRUD and queries; `ccw/src/commands/issue.ts` is the primary implementation.
- Project context files are part of the `.workflow/` ecosystem and are referenced in `ccw/src/core/data-aggregator.ts`.

## Proposed Fix Plan (Minimal)

- Docs scope: add/keep a preflight check (or explicit instructions) for missing `.workflow/project-tech.json` / `.workflow/project-guidelines.json`.
- Orchestration scope: ensure batching + parallel Task() launching stays bounded and produces deterministic per-batch TodoWrite entries.
- Selection scope: ensure multi-solution returns a stable selection prompt and binds only after confirmation (unless `-y|--yes`).
