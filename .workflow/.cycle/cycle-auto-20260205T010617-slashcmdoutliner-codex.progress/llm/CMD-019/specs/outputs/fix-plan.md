# Fix Plan: memory:docs-full-cli (CMD-019)

## P0 (Must)

1. [docs] Add `allowed-tools` to `.claude/commands/memory/docs-full-cli.md` frontmatter
   - Proposed: `allowed-tools: AskUserQuestion(*), Bash(*), Task(*)`
   - Verify:
     - `rg -n \"^allowed-tools:\" .claude/commands/memory/docs-full-cli.md`

2. [docs] Make the approval gate explicit (no execution without confirmation)
   - Add an `AskUserQuestion` snippet and state the abort behavior clearly.
   - Verify:
     - `rg -n \"AskUserQuestion\" .claude/commands/memory/docs-full-cli.md`

## P1 (Should)

3. [docs] Tighten the execution-mode contract
   - Ensure thresholds and concurrency caps are stated once (and match the reference family where possible).
   - Verify:
     - `rg -n \"<20 modules\" .claude/commands/memory/docs-full-cli.md`
     - `rg -n \"max 4\" .claude/commands/memory/docs-full-cli.md`

4. [validation] Add a single end-to-end smoke workflow (doc-only)
   - Describe a minimal manual validation run for a small repo subset (e.g., `--path src`).
   - Verify:
     - `rg -n \"Verification\" .claude/commands/memory/docs-full-cli.md`

## P2 (Optional)

5. [docs] Standardize allowed-tools across related memory CLI commands
   - `.claude/commands/memory/docs-related-cli.md`
   - `.claude/commands/memory/update-full.md`
   - `.claude/commands/memory/update-related.md`

