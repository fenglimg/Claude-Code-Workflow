# Gap Report: issue:new

## Reference

- Selected reference: /issue:new (`.claude/commands/issue/new.md`)

## P0 Gaps (Must Fix)

- None identified between the generated outline and the selected reference at the section/flow level.

## P1 Gaps (Should Fix)

- Normalize issue ID format language across docs/prompts/CLI references:
  - CLI implementation uses `ISS-YYYYMMDD-NNN` (auto-increment).
  - Ensure `/issue:new` docs and prompt examples consistently describe that format.
- Normalize storage path naming across docs/prompts:
  - CLI surfaces `.workflow/issues/issues.jsonl` as the active issues store.
  - Ensure docs/prompts refer to the same path (avoid older `.workflow/issues.jsonl` phrasing).

## P2 Gaps (Optional)

- Add one explicit note in the command doc about preferring pipe/heredoc input for JSON to avoid shell escaping issues (already supported by `ccw issue create`).

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/issue/new.md` | Existing | docs: `.claude/commands/issue/new.md` / `Quick Reference` ; ts: `ccw/src/commands/issue.ts` / `Usage: ccw issue create --data '{"title":"...", "context":"..."}'` | `Test-Path .claude/commands/issue/new.md` | User-facing behavior + examples |
| `.codex/prompts/issue-new.md` | Existing | docs: `.claude/commands/issue/new.md` / `Implementation` ; ts: `ccw/src/commands/issue.ts` / `echo '{"title":"..."}' | ccw issue create` | `Test-Path .codex/prompts/issue-new.md` | Prompt runner flow (flags, phases, output formatting) |
| `ccw/src/commands/issue.ts` | Existing | docs: `.claude/commands/issue/new.md` / `Phase 6: Create Issue` ; ts: `ccw/src/commands/issue.ts` / `async function createAction(options: IssueOptions): Promise<void> {` | `Test-Path ccw/src/commands/issue.ts` | Source of truth for storage + CLI semantics |
| `ccw issue create` | Existing | docs: `.claude/commands/issue/new.md` / `Phase 6: Create Issue` ; ts: `ccw/src/commands/issue.ts` / `Usage: ccw issue create --data '{"title":"...", "context":"..."}'` | `rg \"Usage: ccw issue create\" ccw/src/commands/issue.ts` | Local issue creation endpoint (stdin supported) |
| `ccw issue update` | Existing | docs: `.claude/commands/issue/new.md` / `Phase 5: GitHub Publishing Decision (Non-GitHub Sources)` ; ts: `ccw/src/commands/issue.ts` / `Usage: ccw issue update <issue-id> --status <status>` | `rg \"Usage: ccw issue update\" ccw/src/commands/issue.ts` | Local issue update endpoint for GitHub binding |
| `.workflow/issues/issues.jsonl` | Planned | docs: `.claude/commands/issue/new.md` / `Phase 6: Create Issue` ; ts: `ccw/src/commands/issue.ts` / `.workflow/issues/issues.jsonl         Active issues` | `Test-Path .workflow/issues/issues.jsonl` | Runtime store; exists after first create |

## Implementation Hints (Tooling/Server)

- `ccw issue create` supports stdin; recommend pipe or heredoc for complex JSON to avoid quoting issues.
- When publishing a text-based issue to GitHub, persist the returned URL/number by calling `ccw issue update` on the local issue ID.

## Proposed Fix Plan (Minimal)

- Docs (P1): Align `/issue:new` ID format wording and storage path to match `ccw/src/commands/issue.ts`.
- Prompts (P1): Keep `.codex/prompts/issue-new.md` aligned with docs/CLI for ID format + storage path.

