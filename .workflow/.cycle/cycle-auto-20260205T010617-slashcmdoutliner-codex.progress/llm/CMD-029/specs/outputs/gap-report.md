# Gap Report: workflow:brainstorm:auto-parallel

## Reference

- Selected reference: /workflow:brainstorm:role-analysis (`.claude/commands/workflow/brainstorm/role-analysis.md`)

## P0 Gaps (Must Fix)

- None identified in the generated outlines relative to the P0 quality gates (frontmatter/tools/core sections/evidence tables).

## P1 Gaps (Should Fix)

- Clarify (in the implementation) the deterministic rules for:
  - session selection when multiple WFS sessions exist
  - `--count` parsing (defaulting/clamping/error)
- Explicitly document coordinator responsibility boundaries (orchestrator vs invoked subcommands) to avoid tool-surface drift.

## P2 Gaps (Optional)

- Add a short, standardized completion report format (session id/path, roles analyzed, artifact paths) for consistent UX across workflow commands.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/brainstorm/auto-parallel.md` | Existing | docs: `.claude/commands/workflow/brainstorm/auto-parallel.md` / Coordinator Role ; ts: `ccw/src/templates/dashboard-js/views/help.js` / /workflow:brainstorm:auto-parallel | `Test-Path .claude/commands/workflow/brainstorm/auto-parallel.md; rg "^## Coordinator Role" .claude/commands/workflow/brainstorm/auto-parallel.md` | Orchestrator protocol and phase sequencing |
| `.claude/commands/workflow/brainstorm/artifacts.md` | Existing | docs: `.claude/commands/workflow/brainstorm/artifacts.md` / Output & Governance ; ts: `ccw/src/commands/session-path-resolver.ts` / '.brainstorming/': 'brainstorm', | `Test-Path .claude/commands/workflow/brainstorm/artifacts.md; rg "^## Output & Governance" .claude/commands/workflow/brainstorm/artifacts.md` | Phase 1 artifact generation details |
| `.claude/commands/workflow/brainstorm/role-analysis.md` | Existing | docs: `.claude/commands/workflow/brainstorm/role-analysis.md` / TodoWrite Integration ; ts: `ccw/src/commands/session-path-resolver.ts` / '.brainstorming/': 'brainstorm', | `Test-Path .claude/commands/workflow/brainstorm/role-analysis.md; rg "TodoWrite Integration" .claude/commands/workflow/brainstorm/role-analysis.md` | Parallel role analysis execution + progress tracking |
| `.claude/commands/workflow/brainstorm/synthesis.md` | Existing | docs: `.claude/commands/workflow/brainstorm/synthesis.md` / Phase 5: Parallel Document Update Agents ; ts: `ccw/src/commands/session-path-resolver.ts` / '.brainstorming/': 'brainstorm', | `Test-Path .claude/commands/workflow/brainstorm/synthesis.md; rg "Phase 5: Parallel Document Update Agents" .claude/commands/workflow/brainstorm/synthesis.md` | Aggregation + parallel update patterns |
| `ccw/src/tools/command-registry.test.ts` | Existing | docs: `.claude/commands/workflow/brainstorm/auto-parallel.md` / Usage ; ts: `ccw/src/tools/command-registry.test.ts` / .claude/commands/workflow | `Test-Path ccw/src/tools/command-registry.test.ts; rg "\\.claude/commands/workflow" ccw/src/tools/command-registry.test.ts` | CCW tooling locates command docs for listing/management |

## Implementation Hints (Tooling/Server)

- Command discovery/listing: `ccw/src/tools/command-registry.ts` (and `ccw/src/tools/command-registry.test.ts` for anchors and expected behavior).
- Session path conventions for brainstorm artifacts: `ccw/src/commands/session-path-resolver.ts` (brainstorm content type and `.brainstorming/` mapping).

## Proposed Fix Plan (Minimal)

1) Lock down arg parsing + session selection rules (documented behavior, plus tests where applicable).
2) Ensure orchestrator only uses allowed tools directly; delegate interactive Q&A to subcommands that declare AskUserQuestion.
3) Keep output artifact paths stable and referenced consistently in completion report.

