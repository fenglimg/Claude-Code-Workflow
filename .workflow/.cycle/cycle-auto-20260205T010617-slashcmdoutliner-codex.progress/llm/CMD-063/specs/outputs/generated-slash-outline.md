---
name: tdd-coverage-analysis
description: Analyze test coverage and TDD cycle execution with Red-Green-Refactor compliance verification
argument-hint: "--session WFS-session-id"
allowed-tools: Read(*), Write(*), Bash(*)
group: workflow
---

# TDD Coverage Analysis Command

## Overview

- Goal: Generate session-scoped test coverage metrics and verify Red-Green-Refactor compliance across TDD task chains.
- Command: `/workflow:tools:tdd-coverage-analysis`

## Usage

```bash
/workflow:tools:tdd-coverage-analysis --session WFS-session-id
```

## Inputs

- Required inputs:
  - `--session <WFS-session-id>`: workflow session to analyze (under `.workflow/active/<session_id>/`)
- Optional inputs:
  - None (framework detection is automatic; fallback behavior is described below)

## Outputs / Artifacts

- Writes:
  - `.workflow/active/{session_id}/.process/test-results.json`
  - `.workflow/active/{session_id}/.process/coverage-report.json`
  - `.workflow/active/{session_id}/.process/tdd-cycle-report.md`
- Reads:
  - `.workflow/active/{session_id}/.task/TEST-*.json` (to discover test focus paths / test intent)
  - `.workflow/active/{session_id}/.summaries/*-summary.md` (to validate Red/Green/Refactor chain behavior)
  - project test config files (e.g. `package.json`, `pytest.ini`, `Cargo.toml`, `go.mod`)

## Implementation Pointers

- Command doc (oracle): `.claude/commands/workflow/tools/tdd-coverage-analysis.md`
- Likely code locations (repo capabilities used by this command):
  - `ccw/src/tools/session-manager.ts` (session-scoped file routing: `.process/`, `.task/`, `.summaries/`)
  - `ccw/src/core/routes/commands-routes.ts` (command discovery/management for `.claude/commands/**`)

### Evidence (Existing vs Planned)

You MUST label each pointer as `Existing` (verifiable in repo now) or `Planned` (will be created/modified).

Rules:
- `Existing` MUST include evidence from BOTH:
  - a command doc source: `.claude/commands/**.md` (section heading is sufficient)
  - a TypeScript source: `ccw/src/**` (function name / subcommand case / a ripgrep-able string)
- If you cannot verify, downgrade to `Planned` and add a concrete `Verify` step (e.g. `Test-Path <path>`, `rg "<pattern>" <path>`).

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/tools/tdd-coverage-analysis.md` | Existing | docs: `.claude/commands/workflow/tools/tdd-coverage-analysis.md` / `Overview` ; ts: `ccw/src/tools/session-manager.ts` / `.workflow/active` | `Test-Path .claude/commands/workflow/tools/tdd-coverage-analysis.md` | Authoritative command behavior and artifact contract |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/tools/tdd-coverage-analysis.md` / `Output Files` ; ts: `ccw/src/tools/session-manager.ts` / `PATH_ROUTES` | `Test-Path ccw/src/tools/session-manager.ts` | Defines session file routing for `.process/`, `.task/`, `.summaries/` used by analysis |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/workflow/tools/tdd-coverage-analysis.md` / `Integration & Usage` ; ts: `ccw/src/core/routes/commands-routes.ts` / `handleCommandsRoutes` | `Test-Path ccw/src/core/routes/commands-routes.ts` | CCW command corpus management (enables/disables and lists command docs) |

## Execution Process

1. Parse `--session` and validate the session folder exists: `.workflow/active/{session_id}/`.
2. Ensure `.workflow/active/{session_id}/.process/` exists (create if missing).
3. Extract test focus paths (best-effort):
   - Read `.workflow/active/{session_id}/.task/TEST-*.json`.
   - If `jq` is available, extract `.context.focus_paths[]` into a working set of paths; otherwise, proceed without narrowing scope.
4. Detect test framework (best-effort heuristics):
   - Node.js: `package.json` contains `jest|mocha|vitest` or a `test` script.
   - Python: `pytest.ini` or `setup.py` present.
   - Rust: `Cargo.toml` present.
   - Go: `go.mod` present.
5. Run the test command with coverage and capture machine-readable output:
   - Write raw output into `.workflow/active/{session_id}/.process/test-results.json` (format depends on framework; if JSON is not available, store a JSON wrapper with stdout/stderr + detected framework).
6. Parse coverage metrics into `.workflow/active/{session_id}/.process/coverage-report.json`:
   - Prefer extracting line/branch/function coverage; when unavailable, record `unknown` with a reason.
7. Verify TDD cycle execution from summaries:
   - Enumerate chains `TEST-* -> IMPL-* -> REFACTOR-*` using `.workflow/active/{session_id}/.summaries/*-summary.md`.
   - For each chain, classify:
     - Red: evidence tests were created and initially failed.
     - Green: evidence implementation made tests pass.
     - Refactor: evidence refactor occurred while staying green (optional but scored).
8. Generate `.workflow/active/{session_id}/.process/tdd-cycle-report.md`:
   - Coverage metrics summary
   - Per-chain verification (PASS/WARN/FAIL) + short rationale
   - Compliance score (0-100) and gaps/recommendations

## Error Handling

- Missing/invalid `--session`:
  - Explain required format and point to `.workflow/active/<session_id>/`.
- Session missing expected directories:
  - If `.task/` missing: warn that TEST tasks cannot be discovered; continue with coverage-only analysis.
  - If `.summaries/` missing: warn that TDD cycle verification cannot run; continue with coverage-only analysis.
- Test framework not detected:
  - Fail with a clear message listing what was checked and how to override via project setup.
- Test command fails:
  - Record failure details (stderr/stdout) into `test-results.json` wrapper and mark coverage as unavailable; still emit `tdd-cycle-report.md` with actionable next steps.
- Coverage data missing/unparseable:
  - Emit `coverage-report.json` with `unknown` values + reason; do not crash the command.

## Examples

```bash
/workflow:tools:tdd-coverage-analysis --session WFS-auth
```

