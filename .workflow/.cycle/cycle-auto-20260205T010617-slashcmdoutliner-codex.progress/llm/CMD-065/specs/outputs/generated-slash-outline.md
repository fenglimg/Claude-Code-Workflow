---
name: test-context-gather
description: Collect test coverage context using test-context-search-agent and package into standardized test-context JSON
argument-hint: "--session WFS-test-session-id"
allowed-tools: Task(*), Read(*), Glob(*)
group: workflow:tools
---

# Test Context Gather

## Overview

- Goal: Gather reusable test coverage + framework context for a test session; return an existing valid package when present, otherwise invoke `test-context-search-agent` and write a standardized `test-context-package.json`.
- Command: `/workflow:tools:test-context-gather`

## Usage

```bash
/workflow:tools:test-context-gather --session WFS-test-session-id
```

## Inputs

- Required inputs:
  - `--session <test_session_id>` (e.g. `WFS-test-auth`)
- Optional inputs:
  - none

## Outputs / Artifacts

- Writes:
  - `.workflow/active/{test_session_id}/.process/test-context-package.json`
- Reads:
  - `.workflow/active/{test_session_id}/workflow-session.json` (session metadata)
  - `.workflow/active/{test_session_id}/.process/test-context-package.json` (detection-first early exit)

## Implementation Pointers

- Command doc: `.claude/commands/workflow/tools/test-context-gather.md`
- Likely code locations:
  - `.codex/agents/test-context-search-agent.md` (subagent behavior + output schema details)
  - `ccw/src/tools/session-manager.ts` (canonical `.workflow/active/{session}` + `.process/{filename}` routing)
  - `ccw/src/tools/index.ts` (tool registry: smart_search replaces codex_lens; impacts agent tool calls)

### Evidence (Existing vs Planned)

You MUST label each pointer as `Existing` (verifiable in repo now) or `Planned` (will be created/modified).

Rules:
- `Existing` MUST include evidence from BOTH:
  - a command doc source: `.claude/commands/**.md` (section heading is sufficient)
  - a TypeScript source: `ccw/src/**` (function name / subcommand case / a ripgrep-able string)
- If you cannot verify, downgrade to `Planned` and add a concrete `Verify` step (e.g. `Test-Path <path>`, `rg "<pattern>" <path>`).

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/workflow/tools/test-context-gather.md` | Existing | docs: `.claude/commands/workflow/tools/test-context-gather.md` / `Overview` ; ts: `ccw/src/tools/session-manager.ts` / `process: '{base}/.process/{filename}',` | `Test-Path .claude/commands/workflow/tools/test-context-gather.md` | Oracle command doc (headings, flow, artifacts). |
| `.codex/agents/test-context-search-agent.md` | Existing | docs: `.claude/commands/workflow/tools/test-context-gather.md` / `Mission` ; ts: `ccw/src/tools/index.ts` / `// codex_lens removed - functionality integrated into smart_search` | `Test-Path .codex/agents/test-context-search-agent.md; rg "mcp__ccw-tools__codex_lens" .codex/agents/test-context-search-agent.md` | Subagent definition invoked by the command; ensure tool calls match current CCW tool registry. |
| `ccw/src/tools/session-manager.ts` | Existing | docs: `.claude/commands/workflow/tools/test-context-gather.md` / `Session Information` ; ts: `ccw/src/tools/session-manager.ts` / `const ACTIVE_BASE = '.workflow/active';` | `Test-Path ccw/src/tools/session-manager.ts; rg "const ACTIVE_BASE = '.workflow/active';" ccw/src/tools/session-manager.ts` | Canonical session + `.process` path conventions for `.workflow/active/{test_session_id}/...`. |
| `.workflow/active/{test_session_id}/.process/test-context-package.json` | Planned | docs: `.claude/commands/workflow/tools/test-context-gather.md` / `Output Requirements` ; ts: `ccw/src/tools/session-manager.ts` / `process: '{base}/.process/{filename}',` | `Test-Path .workflow/active/WFS-test-auth/.process/test-context-package.json` | Primary output artifact produced (or reused) by the command. |

Notes:
- For TS evidence, anchors are literal substrings that must exist in the file now.

## Execution Process

1. Parse inputs: require `--session <test_session_id>`.
2. Detection-first:
   - If `.workflow/active/{test_session_id}/.process/test-context-package.json` exists and is valid, return it (no agent invocation).
3. Invoke subagent:
   - `Task(subagent_type="test-context-search-agent", ...)` to run the three mission phases:
     - Phase 1: Session validation + source context loading
     - Phase 2: Test coverage analysis
     - Phase 3: Framework detection + packaging
4. Output verification:
   - Confirm `test-context-package.json` exists and has required top-level fields (metadata/source_context/assets).

## Error Handling

- Missing `--session`: fail fast with usage hint.
- Session metadata missing/invalid: report that the test session cannot be validated.
- Source session not found / no summaries: instruct to complete the source session first (or fix source reference in test session metadata).
- Package generation failure: surface subagent failure and point to expected output path for manual inspection.

## Examples

- Collect test context for an existing test session:
  - `/workflow:tools:test-context-gather --session WFS-test-auth`

