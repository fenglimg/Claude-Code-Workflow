---
name: tools:code-validation-gate
description: Validate AI-generated code for common errors (imports, variables, types) before test execution
argument-hint: "--session WFS-test-session-id [--fix] [--strict]"
allowed-tools: Read(*), Write(*), Edit(*), Bash(*), Glob(*), Grep(*)
group: workflow
---

# Code Validation Gate

## Overview

- Goal: Fail fast on fundamental code issues (compile/import/variable/type/AI-pattern errors) before running tests.
- Command: `/workflow:tools:code-validation-gate`

## Usage

```bash
/workflow:tools:code-validation-gate --session WFS-test-auth [--fix] [--strict]
```

## Inputs

- Required inputs:
  - `--session <WFS-test-session-id>` (workflow session id under `.workflow/active/`)
- Optional inputs:
  - `--fix` (apply safe, mechanical fixes only; then re-run validation)
  - `--strict` (treat TypeScript strict checks / AI-specific checks more aggressively)

## Outputs / Artifacts

- Writes:
  - `.workflow/active/{session_id}/.process/code-validation-report.md`
  - `.workflow/active/{session_id}/.process/code-validation-report.json`
- Reads:
  - `.workflow/active/{session_id}/workflow-session.json`
  - `.workflow/active/{session_id}/.process/context-package.json` (or `.process/test-context-package.json`)
  - `.workflow/active/{session_id}/.task/IMPL-001-output/` (if present)
  - `tsconfig.json`, `package.json`, `.eslintrc*`

## Implementation Pointers

- Command doc: `.claude/commands/workflow/tools/code-validation-gate.md`
- Likely code locations:
  - `ccw/src/core/routes/commands-routes.ts` (command discovery + allowed-tools frontmatter parsing)
  - `ccw/src/core/session-scanner.ts` (session directory conventions: `.workflow/active/`)
  - `ccw/src/tools/session-manager.ts` (ensures `.process/` exists in sessions)
  - `ccw/src/commands/session-path-resolver.ts` (maps `.process/` path category)

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/tools/code-validation-gate.md` | Existing | docs: `.claude/commands/workflow/tools/code-validation-gate.md` / `Code Validation Gate Command` ; ts: `ccw/src/core/routes/commands-routes.ts` / `function scanCommandsRecursive(` | `Test-Path .claude/commands/workflow/tools/code-validation-gate.md` | Source-of-truth command behavior and artifact paths |
| `ccw/src/core/routes/commands-routes.ts` | Existing | docs: `.claude/commands/workflow/tools/code-validation-gate.md` / `Command Options` ; ts: `ccw/src/core/routes/commands-routes.ts` / `function scanCommandsRecursive(` | `Test-Path ccw/src/core/routes/commands-routes.ts` | How CCW enumerates commands (including nested paths) and parses `allowed-tools` |
| `ccw/src/core/session-scanner.ts` | Existing | docs: `.claude/commands/workflow/tools/code-validation-gate.md` / `Execution Lifecycle` ; ts: `ccw/src/core/session-scanner.ts` / `const activeDir = join(workflowDir, 'active');` | `Test-Path ccw/src/core/session-scanner.ts` | Confirms `.workflow/active/{session}` layout used by this command |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/tools/code-validation-gate.md` / `Output Artifacts` ; ts: `ccw/src/tools/session-manager.ts` / `ensureDir(join(sessionPath, '.process'));` | `Test-Path ccw/src/tools/session-manager.ts` | Session scaffolding for `.process/` artifacts |
| `ccw/src/commands/session-path-resolver.ts` | Existing | docs: `.claude/commands/workflow/tools/code-validation-gate.md` / `Integration` ; ts: `ccw/src/commands/session-path-resolver.ts` / `'.process/': 'process',` | `Test-Path ccw/src/commands/session-path-resolver.ts` | Standardized categorization / resolution of `.process/` paths |
| `.workflow/active/{session_id}/.process/code-validation-report.md` | Planned | docs: `.claude/commands/workflow/tools/code-validation-gate.md` / `Validation Report` ; ts: `ccw/src/tools/session-manager.ts` / `ensureDir(join(sessionPath, '.process'));` | `Test-Path .workflow/active/{session_id}/.process/code-validation-report.md` | Human-readable gate output; created when the command is executed |
| `.workflow/active/{session_id}/.process/code-validation-report.json` | Planned | docs: `.claude/commands/workflow/tools/code-validation-gate.md` / `JSON Report (Machine-Readable)` ; ts: `ccw/src/tools/session-manager.ts` / `ensureDir(join(sessionPath, '.process'));` | `Test-Path .workflow/active/{session_id}/.process/code-validation-report.json` | Machine-readable gate output; created when the command is executed |

## Execution Process

1) Phase 1: Context Loading
   - Load session metadata and context package(s).
   - Determine the target file set: focused source files + generated tests + any relevant modified files.
2) Phase 2: Validation Execution (dependency order)
   - L0.1 Compilation: run `npx tsc --noEmit ...` and stop on any compiler/module-resolution error.
   - L0.2 Imports: validate unresolved/duplicate imports and circular dependencies.
   - L0.3 Variables: detect redeclarations, shadowing, undefined/unused variables.
   - L0.4 Types: type-check target files (and stricter checks when `--strict`).
   - L0.5 AI patterns: placeholder code, hallucinated imports, mocks in production paths.
3) Phase 3: Result Analysis
   - Aggregate findings into Critical/Errors/Warnings; compute PASS/SOFT_FAIL/HARD_FAIL.
4) Phase 4: Auto-Fix (optional, `--fix`)
   - Apply safe mechanical fixes (e.g., remove unused imports, lint autofix).
   - Re-run validation once; report what changed and what remains.
5) Phase 5: Gate Decision
   - PASS: proceed to the next workflow step.
   - SOFT_FAIL: fixes applied but remaining issues exist; require follow-up.
   - HARD_FAIL: block and output actionable report.

## Error Handling

- If `--session` is missing or the session folder cannot be found under `.workflow/active/`, stop with a clear error.
- If L0.1 compilation fails, stop immediately and mark status as HARD_FAIL (do not run later checks).
- For missing tooling (e.g., eslint/tsc not available), report as critical with remediation steps (install deps / correct config).
- When `--fix` is enabled, limit changes to safe, reversible fixes; report each applied fix explicitly.
- Never proceed to test execution when compilation errors remain.

## Examples

```bash
# Standard gate
/workflow:tools:code-validation-gate --session WFS-test-auth

# Attempt safe autofixes, then re-run validation once
/workflow:tools:code-validation-gate --session WFS-test-auth --fix

# Stricter TypeScript/type checks
/workflow:tools:code-validation-gate --session WFS-test-auth --strict
```

