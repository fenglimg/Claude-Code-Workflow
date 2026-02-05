---
name: tdd-verify
description: Verify TDD workflow compliance against Red-Green-Refactor cycles. Generates quality report with coverage analysis and quality gate recommendation. Orchestrates sub-commands for comprehensive validation.
argument-hint: "[optional: --session WFS-session-id]"
allowed-tools: Skill(*), TodoWrite(*), Read(*), Write(*), Bash(*), Glob(*)
group: workflow
---

# TDD Verification Command (/workflow:tdd-verify)

## Overview

- Goal: Validate TDD session task-chain integrity and Red-Green-Refactor compliance, then generate a compliance report with a merge/quality-gate recommendation.
- Command: `/workflow:tdd-verify`

## Usage

```bash
/workflow:tdd-verify [--session WFS-session-id]
```

## Inputs

- Required inputs:
  - None (auto-detect active session when exactly one is active)
- Optional inputs:
  - `--session WFS-session-id` (explicit session selection)

## Outputs / Artifacts

- Writes:
  - `.workflow/active/WFS-{session-id}/TDD_COMPLIANCE_REPORT.md`
  - `.workflow/active/WFS-{session-id}/.process/test-results.json`
  - `.workflow/active/WFS-{session-id}/.process/coverage-report.json`
  - `.workflow/active/WFS-{session-id}/.process/tdd-cycle-report.md`
- Reads:
  - `.workflow/active/WFS-{session-id}/.task/*.json`
  - `.workflow/active/WFS-{session-id}/.summaries/` (optional; improves analysis fidelity)

## Implementation Pointers

- Command doc: `.claude/commands/workflow/tdd-verify.md`
- Likely code locations:
  - `.claude/commands/workflow/tools/tdd-coverage-analysis.md` (Phase 3 dependency)
  - `ccw/src/tools/session-manager.ts` (session directory conventions under `.workflow/active`)
  - `ccw/src/tools/command-registry.ts` (command discovery/indexing)
  - `ccw/src/templates/dashboard-js/views/help.js` (help diagram includes the TDD verify step)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/tdd-verify.md` | Existing | docs: `.claude/commands/workflow/tdd-verify.md` / `TDD Verification Command (/workflow:tdd-verify)` ; ts: `ccw/src/templates/dashboard-js/views/help.js` / `label: '/workflow:tdd-verify'` | `Test-Path .claude/commands/workflow/tdd-verify.md` | primary slash command doc (oracle) |
| `.claude/commands/workflow/tools/tdd-coverage-analysis.md` | Existing | docs: `.claude/commands/workflow/tools/tdd-coverage-analysis.md` / `TDD Coverage Analysis Command` ; ts: `ccw/src/tools/command-registry.ts` / `public getCommand(commandName: string): CommandMetadata | null {` | `Test-Path .claude/commands/workflow/tools/tdd-coverage-analysis.md` | Phase 3 sub-command that produces coverage artifacts |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/tdd-verify.md` / `Output Files` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path ccw/src/tools/session-manager.ts` | defines and enforces `.workflow/active` session conventions |
| `.workflow/active/WFS-{session-id}/TDD_COMPLIANCE_REPORT.md` | Planned | docs: `.claude/commands/workflow/tdd-verify.md` / `Output Files` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `rg "TDD_COMPLIANCE_REPORT.md" .claude/commands/workflow/tdd-verify.md` | primary report artifact written into the session folder |
| `ccw/src/tools/command-registry.ts` | Existing | docs: `.claude/commands/ccw-coordinator.md` / `CommandRegistry Integration` ; ts: `ccw/src/tools/command-registry.ts` / `export class CommandRegistry {` | `Test-Path ccw/src/tools/command-registry.ts` | provides a stable API for enumerating/reading command docs |
| `ccw/src/templates/dashboard-js/views/help.js` | Existing | docs: `.claude/commands/workflow/tdd-plan.md` / `Related Commands` ; ts: `ccw/src/templates/dashboard-js/views/help.js` / `label: '/workflow:tdd-verify'` | `Test-Path ccw/src/templates/dashboard-js/views/help.js` | documents the intended TDD flow path (plan -> verify) in UI help |

## Execution Process

1) Session discovery & validation
   - Resolve session: `--session` wins; otherwise auto-detect a single active `.workflow/active/WFS-*` session.
   - Validate required artifacts exist: `.task/*.json` (required), `.summaries/` (optional but recommended).

2) Task chain structure validation
   - Load and parse task JSONs.
   - Validate expected TDD chain structure and `depends_on` relationships.
   - Extract meta fields needed for later checks.

3) Coverage & cycle analysis
   - Invoke `/workflow:tools:tdd-coverage-analysis`.
   - Parse intermediate outputs (test/coverage/cycle artifacts) from the session `.process/` folder.

4) Compliance report generation
   - Aggregate findings from phases 1-3.
   - Determine quality gate recommendation.
   - Write `TDD_COMPLIANCE_REPORT.md` and print a concise summary.

## Error Handling

- Session discovery errors:
  - no active session found -> instruct `--session <id>`
  - multiple active sessions -> require explicit `--session <id>`
- Validation errors:
  - missing/invalid `.task/*.json` -> instruct running `/workflow:tdd-plan` (and/or re-generate tasks)
  - missing `.summaries/` -> warn that analysis may be limited
- Analysis errors:
  - sub-command failure -> surface actionable next steps (inspect sub-command outputs/logs)

## Examples

```bash
# Auto-detect active session
/workflow:tdd-verify

# Specify session
/workflow:tdd-verify --session WFS-auth
```

