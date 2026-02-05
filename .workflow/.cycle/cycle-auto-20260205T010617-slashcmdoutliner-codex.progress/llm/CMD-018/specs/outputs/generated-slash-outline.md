---
name: compact
description: Compact current session memory into structured text for session recovery, extracting objective/plan/files/decisions/constraints/state, and save via MCP core_memory tool
argument-hint: "[optional: session description]"
allowed-tools: mcp__ccw-tools__core_memory(*), Read(*)
group: memory
---

# Memory Compact Command (/memory:compact)

## Overview

- Goal: Produce a recovery-ready, structured snapshot of the current session (objective/plan/files/decisions/constraints/state) and persist it as a Core Memory entry.
- Command: `/memory:compact`

## Usage

```bash
/memory:compact [optional: session description]
```

## Inputs

- Required inputs:
  - Current session context (objective, plan, recent actions, known issues, decisions)
- Optional inputs:
  - A short session description to improve future retrieval
  - Additional context files (via `Read(*)`) to improve accuracy (plans, key configs, architecture notes)

## Outputs / Artifacts

- Writes:
  - Core Memory entry (via `mcp__ccw-tools__core_memory` with `operation: "import"`), returning `CMEM-...` recovery ID
- Reads:
  - `.workflow/IMPL_PLAN.md` (if present; preferred source for plan)
  - Any user-specified context files (via `Read(*)`)

## Implementation Pointers

- Command doc: `.claude/commands/memory/compact.md`
- Likely code locations:
  - `ccw/src/tools/core-memory.ts`
  - `ccw/src/mcp-server/index.ts`
  - `ccw/src/core/core-memory-store.ts`
  - `ccw/src/commands/session-path-resolver.ts`

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/memory/compact.md` | Existing | docs: `.claude/commands/memory/compact.md` / `1. Overview` ; ts: `ccw/src/tools/core-memory.ts` / `name: 'core_memory',` | `Test-Path .claude/commands/memory/compact.md` | primary command doc (format + flow + checklist) |
| `ccw/src/tools/core-memory.ts` | Existing | docs: `.claude/commands/memory/compact.md` / `Step 3: Import to Core Memory via MCP` ; ts: `ccw/src/tools/core-memory.ts` / `Parameter "text" is required for import operation` | `Test-Path ccw/src/tools/core-memory.ts` | MCP tool surface: `core_memory` operations and import behavior |
| `ccw/src/mcp-server/index.ts` | Existing | docs: `.claude/commands/memory/compact.md` / `Step 3: Import to Core Memory via MCP` ; ts: `ccw/src/mcp-server/index.ts` / `const DEFAULT_TOOLS: string[] = ['write_file', 'edit_file', 'read_file', 'core_memory'];` | `Test-Path ccw/src/mcp-server/index.ts` | proves `core_memory` is exposed as a default MCP tool in ccw |
| `ccw/src/core/core-memory-store.ts` | Existing | docs: `.claude/commands/memory/compact.md` / `3. Structured Output Format` ; ts: `ccw/src/core/core-memory-store.ts` / `export function importMemories(` | `Test-Path ccw/src/core/core-memory-store.ts` | underlying store primitives referenced by the tool/CLI layer |
| `ccw/src/commands/session-path-resolver.ts` | Existing | docs: `.claude/commands/memory/compact.md` / `7. Path Resolution Rules` ; ts: `ccw/src/commands/session-path-resolver.ts` / `'IMPL_PLAN.md': 'plan',` | `Test-Path ccw/src/commands/session-path-resolver.ts` | evidence for path/plan file naming conventions used elsewhere in ccw |
| `.workflow/IMPL_PLAN.md` | Planned | docs: `.claude/commands/memory/compact.md` / `8. Plan Detection (Priority Order)` ; ts: `ccw/src/commands/session-path-resolver.ts` / `'IMPL_PLAN.md': 'plan',` | `Test-Path .workflow/IMPL_PLAN.md` | preferred plan source when present; command should read it if available |

Notes:
- One pointer per row; avoid marking pointers as `Existing` unless verifiable.

## Structured Output Format

Produce a single structured text block suitable for session recovery. Minimum fields:

- Session ID (if available)
- Project Root (absolute path)
- Objective (north-star goal)
- Execution Plan (preserve full plan; include plan source: workflow | todo | user-stated | inferred)
- Phase 1: Setup
- Phase 2: Implementation
- Working Files (Modified): 3-8 files + roles (absolute paths when possible)
- Reference Files (Read-Only): key context files (absolute paths when possible)
- Last Action (what was last attempted; success/failure)
- Decisions (with rationale)
- Constraints, Dependencies
- Known Issues (separate deferred vs forgotten)
- Changes Made, Pending, Notes

## Execution Process

1. Step 1: Analyze current session state:
   - Identify objective, current phase, and the most recent action.
   - Collect plan using priority order:
     1) Workflow session plan file (`IMPL_PLAN.md`) if present
     2) Current session todos (if available in-session)
     3) User-stated plan in conversation
     4) Inferred plan (last resort; keep clearly marked as inferred)
2. Step 2: Generate the structured text:
   - Preserve the plan verbatim when available; do not over-summarize.
   - Normalize file paths to absolute when possible; keep categories distinct (working vs reference).
3. Step 3: Import into Core Memory:
   - Call `mcp__ccw-tools__core_memory({ operation: "import", text: structuredText })`.
4. Step 4: Report the recovery ID:
   - Print the returned `CMEM-...` id and the recommended restore action (export by id).

## Error Handling

- Missing/empty plan sources: proceed with best available plan source and label the source explicitly.
- Read failures (optional files): continue; note the missing file under `Known Issues` or `Notes`.
- Tool failure (core_memory import): surface the error message; do not claim persistence; keep the structured text in the response for manual retry.
- Ambiguous file paths/project root: document assumptions in `Notes` and avoid claiming absolutes.

## Examples

- `/memory:compact`
- `/memory:compact "completed core-memory module"`
