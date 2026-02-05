# Gap Report: workflow:tdd-verify

## Reference

- Selected reference: /workflow:tdd-verify (`.claude/commands/workflow/tdd-verify.md`)

## P0 Gaps (Must Fix)

- None identified: the outline includes required core sections and evidence tables with dual-source anchors (docs + TS).

## P1 Gaps (Should Fix)

- Reduce reliance on shell-only tooling where feasible by explicitly pointing to existing CCW tooling:
  - Prefer `.workflow` path conventions via `ccw/src/tools/session-manager.ts` (discovery/listing) when evolving automation around sessions.
- Ensure the Phase 2 "task chain validation" logic description stays aligned with the task JSON schema and naming conventions used by the workflow system.

## P2 Gaps (Optional)

- Add a short, explicit "read-only" contract snippet in the command doc (tasks and implementation code are not modified) to make safety constraints harder to miss.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/tdd-verify.md` | Existing | docs: `.claude/commands/workflow/tdd-verify.md` / `TDD Verification Command (/workflow:tdd-verify)` ; ts: `ccw/src/templates/dashboard-js/views/help.js` / `label: '/workflow:tdd-verify'` | `Test-Path .claude/commands/workflow/tdd-verify.md` | oracle command doc |
| `.claude/commands/workflow/tools/tdd-coverage-analysis.md` | Existing | docs: `.claude/commands/workflow/tools/tdd-coverage-analysis.md` / `TDD Coverage Analysis Command` ; ts: `ccw/src/tools/command-registry.ts` / `public getCommand(commandName: string): CommandMetadata | null {` | `Test-Path .claude/commands/workflow/tools/tdd-coverage-analysis.md` | Phase 3 dependency producing coverage artifacts |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/tdd-verify.md` / `Output Files` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path ccw/src/tools/session-manager.ts` | session storage conventions (`.workflow/active`) |
| `.workflow/active/WFS-{session-id}/TDD_COMPLIANCE_REPORT.md` | Planned | docs: `.claude/commands/workflow/tdd-verify.md` / `Output Files` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `rg \"TDD_COMPLIANCE_REPORT.md\" .claude/commands/workflow/tdd-verify.md` | per-session report artifact |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `CommandRegistry Integration` ; ts: `ccw/src/tools/command-registry.ts` / `export class CommandRegistry {` | `Test-Path ccw/src/tools/command-registry.ts` | command enumeration / metadata source |
| `ccw/src/templates/dashboard-js/views/help.js` | Existing | docs: `.claude/commands/workflow/tdd-plan.md` / `Related Commands` ; ts: `ccw/src/templates/dashboard-js/views/help.js` / `label: '/workflow:tdd-verify'` | `Test-Path ccw/src/templates/dashboard-js/views/help.js` | help UI diagram ties the TDD flow together |

## Implementation Hints (Tooling/Server)

- Command discovery/indexing: `ccw/src/tools/command-registry.ts` (paired with `.claude/commands/**.md` headings)
- Session path conventions: `ccw/src/tools/session-manager.ts` (defines `.workflow/active` base)

## Proposed Fix Plan (Minimal)

1) P0 (spec/outline): keep evidence rows one-pointer-per-row; avoid placeholders; keep docs headings/TS anchors literal.
2) P1 (docs alignment): cross-check Phase 2 validation wording against the task JSON conventions used by the workflow session.
3) P1 (tooling alignment): when evolving automation, prefer CCW session tooling (`session-manager`) over ad-hoc shell path discovery.

