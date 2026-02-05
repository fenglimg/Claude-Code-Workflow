# Fix Plan: memory:docs-related-cli

## P0 (Must)

1. Docs frontmatter (scope: `.claude/commands/memory/docs-related-cli.md`)
   - Add: `group: memory`
   - Add: `allowed-tools: Bash(*), AskUserQuestion(*), Read(*), Write(*), Task(*)`
   - Verify: `rg -n "^---" .claude/commands/memory/docs-related-cli.md` and ensure the YAML block contains `allowed-tools` + `group`

2. Change detection reference correctness (scope: `.claude/commands/memory/docs-related-cli.md`)
   - Replace `detect_changed_modules.sh` mention with an existing implementation reference (preferred: `ccw/src/tools/detect-changed-modules.ts`) OR create a wrapper script and document its path.
   - Verify (repo): `Test-Path ccw/src/tools/detect-changed-modules.ts`

## P1 (Should)

3. Explicit CLI execution contract (scope: `.claude/commands/memory/docs-related-cli.md`)
   - Add concrete command lines for the coordinator to run (including how `--tool` maps to fallback order).
   - Verify: `rg -n "Unified CLI tool executor" ccw/src/cli.ts`

4. Verification definition (scope: `.claude/commands/memory/docs-related-cli.md`)
   - Define minimum expected files under `.workflow/docs/<project_name>/**` and how to report failures.
   - Verify: `Test-Path .workflow` (create during execution if absent)

