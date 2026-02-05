# Gap Report: workflow:review-module-cycle

## Reference

- Selected reference: /workflow:review-module-cycle (`.claude/commands/workflow/review-module-cycle.md`)

## P0 Gaps (Must Fix)

- Session semantics are ambiguous: requirements describe “independent of workflow sessions”, while the reference doc describes session-integrated outputs under `.workflow/active/WFS-{session-id}/.review/`. The outline must state the intended behavior (create session vs require existing vs accept `--session`) and keep artifact paths consistent.
- Missing orchestration boundary details: the outline should explicitly separate orchestrator responsibilities (coordination, aggregation, iteration control, progress/state writes) from delegated per-dimension agents to avoid scope creep.
- Missing deterministic definitions for: default 7 dimensions, dimension selection rules, and iteration stop conditions (max-iterations + thresholds for deep-dive).
- Output contracts are underspecified: the outline should name the required JSON/MD schemas at a high level (what fields/sections must exist) so downstream tools (dashboard/fix workflow) can rely on them.

## P1 Gaps (Should Fix)

- Path pattern resolution and validation: document concrete behavior (glob expansion, relative-path normalization, de-duplication, max file cap, readable checks) and error messages.
- Progress reporting detail: define when/how `review-progress.json` updates (per-dimension start/end, failures, percent).
- Related commands: link to companion commands (session review + fix workflow) and describe the handoff artifact (export or directory).

## P2 Gaps (Optional)

- Provide a small “dimension guidance reference” section that maps each dimension to a prompt template or guidance file (if the repo has standardized prompts).
- Add best-practice examples for narrowing patterns and controlling iteration cost.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/review-module-cycle.md` | Existing | docs: `.claude/commands/workflow/review-module-cycle.md` / Workflow Review-Module-Cycle Command ; ts: `ccw/src/tools/command-registry.ts` / commandName.startsWith('/workflow:') | `Test-Path .claude/commands/workflow/review-module-cycle.md` | Oracle reference doc; defines sections and artifacts |
| `.claude/commands/workflow/review-session-cycle.md` | Existing | docs: `.claude/commands/workflow/review-session-cycle.md` / Workflow Review-Session-Cycle Command ; ts: `ccw/src/tools/command-registry.ts` / commandName.startsWith('/workflow:') | `Test-Path .claude/commands/workflow/review-session-cycle.md` | Closest sibling command (same review-cycle architecture) |
| `.claude/commands/workflow/review-cycle-fix.md` | Existing | docs: `.claude/commands/workflow/review-cycle-fix.md` / Workflow Review-Cycle-Fix Command ; ts: `ccw/src/tools/command-registry.ts` / commandName.startsWith('/workflow:') | `Test-Path .claude/commands/workflow/review-cycle-fix.md` | Downstream fix workflow that consumes `.review` outputs |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/workflow/review-module-cycle.md` / Quick Start ; ts: `ccw/src/tools/command-registry.ts` / commandName.startsWith('/workflow:') | `Test-Path ccw/src/tools/command-registry.ts` | How workflow command markdown is discovered/normalized |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/review-module-cycle.md` / Output File Structure ; ts: `ccw/src/tools/session-manager.ts` / const ACTIVE_BASE = '.workflow/active'; | `Test-Path ccw/src/tools/session-manager.ts` | Session base path + `.review/*` path templates |
| `ccw/src/core/data-aggregator.ts` | Existing | docs: `.claude/commands/workflow/review-module-cycle.md` / 3. Aggregation Logic ; ts: `ccw/src/core/data-aggregator.ts` / review-state.json | `Test-Path ccw/src/core/data-aggregator.ts` | Reads aggregated review artifacts used by UI/automation |
| `.workflow/active/WFS-{session-id}/.review/review-state.json` | Planned | docs: `.claude/commands/workflow/review-module-cycle.md` / Review State JSON ; ts: `ccw/src/core/data-aggregator.ts` / review-state.json | `Test-Path .workflow/active/WFS-*/.review/review-state.json` | Runtime artifact; must be produced by the command |

## Implementation Hints (Tooling/Server)

- Command discovery: prefer relying on the workflow command registry behavior that normalizes `/workflow:*` command names (avoid bespoke parsing).
- Session + paths: use the established active base `.workflow/active` and the `.review/*` path conventions for dimensions/iterations/fixes to keep dashboard and follow-up commands compatible.
- Aggregation: reuse the existing code paths that load `review-state.json` and `review-progress.json` when deciding what minimal schema guarantees are required.

## Proposed Fix Plan (Minimal)

- Clarify session semantics and flags in the slash outline (P0).
- Add explicit orchestrator boundary + iteration stop conditions (P0).
- Specify minimal output schemas and update timings for state/progress JSON (P0/P1).
- Add related-command handoff notes (P1).

