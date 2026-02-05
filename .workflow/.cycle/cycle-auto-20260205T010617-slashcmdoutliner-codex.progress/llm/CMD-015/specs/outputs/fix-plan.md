# Fix Plan: issue:new (CMD-015)

## P1 (Should Fix)

1) Docs: normalize ID format and storage path references
   - Target: `.claude/commands/issue/new.md`
   - Change:
     - Prefer `ISS-YYYYMMDD-NNN` (auto-increment) wording for local issues
     - Prefer `.workflow/issues/issues.jsonl` for the active issues store
   - Verify:
     - `rg \"ISS-\" .claude/commands/issue/new.md`
     - `rg \"\\.workflow/issues\" .claude/commands/issue/new.md`

2) Prompt: keep prompt aligned with docs + CLI
   - Target: `.codex/prompts/issue-new.md`
   - Change:
     - Ensure examples and storage references match docs + CLI (ID format + `.workflow/issues/issues.jsonl`)
   - Verify:
     - `rg \"ISS-\" .codex/prompts/issue-new.md`
     - `rg \"\\.workflow/issues/issues\\.jsonl\" ccw/src/commands/issue.ts`

## P2 (Optional)

3) Docs: add one explicit note that pipe/heredoc is preferred for JSON input (avoids escaping)
   - Target: `.claude/commands/issue/new.md` (near Phase 6)
   - Verify:
     - `rg \"Pipe input\" .claude/commands/issue/new.md`

