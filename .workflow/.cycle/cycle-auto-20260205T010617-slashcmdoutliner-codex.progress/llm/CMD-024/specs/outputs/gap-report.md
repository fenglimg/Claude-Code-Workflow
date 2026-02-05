# Gap Report: memory:update-full

## Reference

- Selected reference: /memory:update-full (`.claude/commands/memory/update-full.md`)

## P0 Gaps (Must Fix)

- The generated outline assumes ignore filtering (tests/build/config/docs). Verify the reference command doc contains the exact filter rules and mirror them when implementing (do not invent new filters).
- The outline references batching/queue primitives in `ccw/src/tools/memory-update-queue.js`. Verify how (or whether) `/memory:update-full` integrates with `memory_queue` today; if not integrated, treat it as Planned and do not claim runtime usage.

## P1 Gaps (Should Fix)

- Make the fallback chain explicit in the final command doc implementation: order must be derived from `--tool` (gemini/qwen/codex permutations) and documented next to the execution plan.
- Document the direct-parallel threshold as an explicit constant ("<20 modules") and ensure it matches the reference doc.

## P2 Gaps (Optional)

- Add a small troubleshooting table (common failures: tool not installed, permission issues, overly broad path) with recommended rerun flags.

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
| `.claude/commands/memory/update-full.md` | Existing | docs: `.claude/commands/memory/update-full.md` / `Full Documentation Update (/memory:update-full)` ; ts: `ccw/src/cli.ts` / `Unified CLI tool executor (gemini/qwen/codex/claude)` | `Test-Path .claude/commands/memory/update-full.md` | Command oracle and user-facing rules |
| `ccw/src/cli.ts` | Existing | docs: `.claude/commands/memory/update-full.md` / `Tool Fallback Hierarchy` ; ts: `ccw/src/cli.ts` / `Unified CLI tool executor (gemini/qwen/codex/claude)` | `rg "Unified CLI tool executor (gemini/qwen/codex/claude)" ccw/src/cli.ts` | Unified CLI entry for tool execution |
| `ccw/src/tools/cli-executor-utils.ts` | Existing | docs: `.claude/commands/memory/update-full.md` / `Execution Phases` ; ts: `ccw/src/tools/cli-executor-utils.ts` / `case 'qwen':` | `Test-Path ccw/src/tools/cli-executor-utils.ts` | Tool wiring details that can affect fallback reliability |
| `ccw/src/tools/memory-update-queue.js` | Existing | docs: `.claude/commands/memory/update-full.md` / `Execution Phases` ; ts: `ccw/src/tools/memory-update-queue.js` / `name: 'memory_queue'` | `rg "name: 'memory_queue'" ccw/src/tools/memory-update-queue.js` | Optional batching primitive (verify integration before claiming usage) |
| `ccw/src/core/claude-freshness.ts` | Existing | docs: `.claude/commands/memory/update-full.md` / `Phase 4: Safety Verification` ; ts: `ccw/src/core/claude-freshness.ts` / `export function markFileAsUpdated(` | `Test-Path ccw/src/core/claude-freshness.ts` | Metadata/freshness tracking after updates |

## Implementation Hints (Tooling/Server)

- Prefer running tool execution via the unified `ccw` CLI plumbing so flags remain consistent across gemini/qwen/codex.
- When adding batching, keep concurrency bounded and observable (per-depth progress + per-module status) to preserve debuggability.

## Proposed Fix Plan (Minimal)

- Align the final command doc to the outline sections (especially explicit plan presentation + safety verification).
- If `memory_queue` is not currently used by `/memory:update-full`, either wire it in or remove it from the implementation pointers and document the actual batching mechanism.
- Add a deterministic safety check step (diff-based) that is run at the end of execution and documented under Phase 4.

