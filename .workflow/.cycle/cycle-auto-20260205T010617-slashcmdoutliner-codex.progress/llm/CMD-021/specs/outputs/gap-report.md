# Gap Report: memory:load

## Reference

- Selected reference: /memory:update-full (`.claude/commands/memory/update-full.md`)

## P0 Gaps (Must Fix)

- None identified for the generated outline (frontmatter + core sections + artifact references + evidence-table determinism).

## P1 Gaps (Should Fix)

- Add an explicit "Tool fallback" note in the outline (gemini default, qwen supported) aligned with the broader memory command family expectations.
- Clarify the "Core Content Package" schema shape (top-level keys + redaction rules) so downstream commands can rely on it.

## P2 Gaps (Optional)

- Add a short "Scope control" section (how to narrow to a subdirectory/module list) to reduce runtime/cost on large repos.
- Add a "Performance" note (limit file counts, cap per-file preview length, prefer structured CLI output).

## Implementation Pointers (Evidence)

You MUST provide an evidence table for all key implementation pointers mentioned in the outlines.

Rules (P0):
- Every pointer MUST be labeled `Existing` or `Planned`.
- `Existing` MUST be verifiable (path exists). Include a concrete `Verify` command for each existing pointer.
- Do NOT describe `Planned` pointers as "validated/exists".
- Evidence MUST reference BOTH sources somewhere in this section:
  - command docs: `.claude/commands/**.md` (section heading is enough)
  - TypeScript implementation: `ccw/src/**` (function name / subcommand case / ripgrep-able string)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/memory/load.md` | Existing | docs: `.claude/commands/memory/load.md` / `3. Agent-Driven Execution Flow` ; ts: `ccw/src/tools/cli-executor-utils.ts` / `args.push('-o', 'stream-json');` | `Test-Path .claude/commands/memory/load.md` | Slash command contract (delegation + CLI deep analysis step) |
| `ccw/src/tools/cli-executor-utils.ts` | Existing | docs: `.claude/commands/memory/load.md` / `Step 3: Deep Analysis via CLI` ; ts: `ccw/src/tools/cli-executor-utils.ts` / `args.push('-o', 'stream-json');` | `rg \"stream-json\" ccw/src/tools/cli-executor-utils.ts` | Structured CLI output handling for gemini/qwen |
| `ccw/src/tools/claude-cli-tools.ts` | Existing | docs: `.claude/commands/memory/load.md` / `2. Parameters` ; ts: `ccw/src/tools/claude-cli-tools.ts` / `defaultTool: 'gemini',` | `rg \"defaultTool: 'gemini'\" ccw/src/tools/claude-cli-tools.ts` | Default tool + builtin tool inventory for gemini/qwen |
| `ccw/src/tools/core-memory.ts` | Existing | docs: `.claude/commands/memory/load.md` / `4. Core Content Package Structure` ; ts: `ccw/src/tools/core-memory.ts` / `name: 'core_memory',` | `rg \"name: 'core_memory'\" ccw/src/tools/core-memory.ts` | Memory substrate for persisting/recalling the loaded package |

## Implementation Hints (Tooling/Server)

- Prefer structured CLI output modes already supported in `ccw/src/tools/cli-executor-utils.ts` to reduce prompt size and improve parse stability.
- Keep the /memory:load behavior read-only; if future enhancements require writing artifacts, explicitly document them under Outputs / Artifacts with paths.

## Proposed Fix Plan (Minimal)

1) Document: add a small "Tool fallback" + "Output schema" subsection to the generated outline (no new tools).
2) Evidence hygiene: keep pointers limited to verifiable repo paths; add/adjust anchors only when the literal text exists.

