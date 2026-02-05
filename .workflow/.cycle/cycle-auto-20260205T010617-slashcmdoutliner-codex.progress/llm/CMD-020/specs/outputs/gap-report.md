# Gap Report: memory:docs-related-cli

## Reference

- Selected reference: /memory:docs-full-cli (`.claude/commands/memory/docs-full-cli.md`)

## P0 Gaps (Must Fix)

- Command doc frontmatter is missing CCW-required fields (`allowed-tools`, `group`).
- Command doc references a non-existent change detection script name (`detect_changed_modules.sh`); align docs to an existing implementation (`ccw/src/tools/detect-changed-modules.ts`) or add a wrapper script and document it.

## P1 Gaps (Should Fix)

- Make the concrete CLI entrypoint(s) explicit (exact `ccw cli ...` invocations, including how `--tool` maps to fallback order).
- Define verification criteria precisely (what files must exist/change under `.workflow/docs/<project_name>/**`, and how failures are reported).

## P2 Gaps (Optional)

- Add a small "Troubleshooting" subsection for common failures (no changes detected, tool auth/config missing, timeouts).

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
| `.claude/commands/memory/docs-related-cli.md` | Existing | docs: `.claude/commands/memory/docs-related-cli.md` / `Related Documentation Generation - CLI Mode (/memory:docs-related-cli)` ; ts: `ccw/src/tools/command-registry.ts` / `parseYamlHeader(content: string)` | `Test-Path .claude/commands/memory/docs-related-cli.md` | needs CCW-aligned frontmatter fields |
| `ccw/src/tools/detect-changed-modules.ts` | Existing | docs: `.claude/commands/memory/docs-related-cli.md` / `Phase 1: Change Detection & Analysis` ; ts: `ccw/src/tools/detect-changed-modules.ts` / `git diff --name-only HEAD 2>/dev/null` | `Test-Path ccw/src/tools/detect-changed-modules.ts` | existing change-detection implementation to reference |
| `ccw/src/cli.ts` | Existing | docs: `.claude/commands/memory/docs-related-cli.md` / `Tool Fallback Hierarchy` ; ts: `ccw/src/cli.ts` / `Unified CLI tool executor (gemini/qwen/codex/claude)` | `Test-Path ccw/src/cli.ts` | existing CLI executor surface for tool selection |

## Implementation Hints (Tooling/Server)

- Prefer the existing changed-module detection implementation (`ccw/src/tools/detect-changed-modules.ts`) over introducing a new bespoke script name.
- Use the existing CCW CLI executor surface for driving gemini/qwen/codex runs and for standardizing tool fallback selection (`ccw/src/cli.ts`).

## Proposed Fix Plan (Minimal)

1. Docs (scope: `.claude/commands/memory/docs-related-cli.md`)
   - Add `group: memory` and an `allowed-tools:` list that matches the workflow (needs Bash + Read/Write + AskUserQuestion; Task if batching uses sub-agents).
   - Replace the `detect_changed_modules.sh` mention with the actual implementation or add/document a wrapper script.

2. Behavior clarity (scope: docs only)
   - Make CLI invocations explicit (which command runs for each module, and how the fallback order is applied).
   - Tighten verification definition for `.workflow/docs/<project_name>/**`.

