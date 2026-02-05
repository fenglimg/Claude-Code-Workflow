# Gap Report: workflow:tools:code-validation-gate

## Reference

- Selected reference: /workflow:tools:tdd-coverage-analysis (`.claude/commands/workflow/tools/tdd-coverage-analysis.md`)

## P0 Gaps (Must Fix)

- Command doc frontmatter consistency: `.claude/commands/workflow/tools/code-validation-gate.md` currently lacks an explicit `allowed-tools` field; CCW command tooling expects `allowed-tools` to be parseable for UI/metadata.
- Missing CCW core section (`Usage`) in the current oracle doc; generated outline adds `Usage` to satisfy quality gates.
- Evidence-based implementation pointers: the outline/gap-report must include verifiable pointers with dual-source evidence (docs + `ccw/src/**` anchors) and concrete Verify commands.

## P1 Gaps (Should Fix)

- Tighten Inputs/Outputs: explicitly document required session inputs and the two report artifact paths as a single, stable contract (md + json).
- Make gate decision behavior mechanically checkable: document pass/soft-fail/hard-fail thresholds and retry limit in a compact table (to match deterministic tooling expectations).

## P2 Gaps (Optional)

- Add a short "Minimal dependency checklist" (tsc/eslint/madge) and what to do when each is missing.
- Provide a small JSON schema snippet for `code-validation-report.json` to encourage stable machine consumption.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/workflow/tools/code-validation-gate.md` | Existing | docs: `.claude/commands/workflow/tools/code-validation-gate.md` / `Code Validation Gate Command` ; ts: `ccw/src/core/routes/commands-routes.ts` / `function scanCommandsRecursive(` | `Test-Path .claude/commands/workflow/tools/code-validation-gate.md` | Primary behavioral spec and artifact contract |
| `.claude/commands/workflow/tools/tdd-coverage-analysis.md` | Existing | docs: `.claude/commands/workflow/tools/tdd-coverage-analysis.md` / `TDD Coverage Analysis Command` ; ts: `ccw/src/core/routes/commands-routes.ts` / `parseCommandFrontmatter(` | `Test-Path .claude/commands/workflow/tools/tdd-coverage-analysis.md` | Closest reference for CLI validation + report writing |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/workflow/tools/code-validation-gate.md` / `Integration` ; ts: `ccw/src/core/routes/commands-routes.ts` / `parseCommandFrontmatter(content: string): CommandMetadata` | `Test-Path ccw/src/core/routes/commands-routes.ts` | Evidence that CCW scans nested `.claude/commands/**` and parses `allowed-tools` |
| `ccw/src/core/session-scanner.ts` | Existing | docs: `.claude/commands/workflow/tools/code-validation-gate.md` / `Execution Lifecycle` ; ts: `ccw/src/core/session-scanner.ts` / `const activeDir = join(workflowDir, 'active');` | `Test-Path ccw/src/core/session-scanner.ts` | Confirms `.workflow/active/{session}` structure used by the command |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/tools/code-validation-gate.md` / `Output Artifacts` ; ts: `ccw/src/tools/session-manager.ts` / `ensureDir(join(sessionPath, '.process'));` | `Test-Path ccw/src/tools/session-manager.ts` | Confirms `.process/` directory exists for report artifacts |
| `.workflow/active/{session_id}/.process/code-validation-report.md` | Planned | docs: `.claude/commands/workflow/tools/code-validation-gate.md` / `Validation Report` ; ts: `ccw/src/tools/session-manager.ts` / `ensureDir(join(sessionPath, '.process'));` | `Test-Path .workflow/active/{session_id}/.process/code-validation-report.md` | Runtime artifact written by command execution |
| `.workflow/active/{session_id}/.process/code-validation-report.json` | Planned | docs: `.claude/commands/workflow/tools/code-validation-gate.md` / `JSON Report (Machine-Readable)` ; ts: `ccw/src/tools/session-manager.ts` / `ensureDir(join(sessionPath, '.process'));` | `Test-Path .workflow/active/{session_id}/.process/code-validation-report.json` | Runtime artifact written by command execution |

## Implementation Hints (Tooling/Server)

- CCW command listing and metadata parsing are implemented in `ccw/src/core/routes/commands-routes.ts` and expect YAML frontmatter keys like `allowed-tools`.
- Session layout (`.workflow/active/`, `.process/`) is consistent with `ccw/src/core/session-scanner.ts` and `ccw/src/tools/session-manager.ts`; keep artifact paths aligned with those conventions.

## Proposed Fix Plan (Minimal)

- Add `allowed-tools` and an explicit `Usage` section to `.claude/commands/workflow/tools/code-validation-gate.md` (P0).
- Ensure the documented report artifacts are the only required outputs and are always written on completion (PASS/SOFT_FAIL/HARD_FAIL).
- Keep `--fix` scoped to safe ESLint/format/import cleanups; document retry behavior (max 2) and stop conditions.

