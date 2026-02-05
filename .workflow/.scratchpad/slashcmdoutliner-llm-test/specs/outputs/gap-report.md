# Gap Report: issue:new

## Reference

- Selected reference: issue:new (`.claude/commands/issue/new.md`)

## P0 Gaps (Must Fix)

**None identified.** The generated outlines match the reference implementation structure and satisfy all P0 quality gates:
- ✓ Frontmatter complete (name, description, allowed-tools, argument-hint, group)
- ✓ Allowed-tools correct (matches reference exactly)
- ✓ Core sections present (Overview, Usage, Inputs, Outputs/Artifacts, Implementation Pointers, Execution Process, Error Handling, Examples)
- ✓ No broken artifact references (all paths documented as created or pre-existing)
- ✓ Implementation pointers evidence-based (see table below)

## P1 Gaps (Should Fix)

**None identified.** All major sections and artifacts are present and aligned with reference.

## P2 Gaps (Optional)

1. **Helper function implementations**: The reference includes detailed helper functions (`extractKeywords`, `parseTextDescription`, `parseMarkdownBody`) that could be extracted into a separate utilities module for reuse across issue commands.
2. **Feedback history visualization**: Could add a section on how to view/query feedback history for debugging unclear inputs.
3. **Metrics/telemetry**: Could add tracking for clarity score distribution to optimize the scoring algorithm over time.

## Implementation Pointers (Evidence)

| Pointer | Status | Evidence | Verify | Notes |
|---|---|---|---|---|
| `.claude/commands/issue/new.md` | Existing | docs: `.claude/commands/issue/new.md` / `# Issue New Command` ; ts: N/A (command doc) | `Test-Path .claude/commands/issue/new.md` | Command documentation exists and is complete |
| `ccw issue create` | Existing | docs: `.claude/commands/issue/new.md` / `### Phase 6: Create Issue` ; ts: `ccw/src/commands/issue.ts` / `case 'create'` | `rg "case 'create'" ccw/src/commands/issue.ts` | CLI subcommand for issue creation |
| `function createIssue` | Existing | docs: `.claude/commands/issue/new.md` / `### Phase 6: Create Issue` ; ts: `ccw/src/commands/issue.ts` / `function createIssue` | `rg "function createIssue" ccw/src/commands/issue.ts` | Core issue creation logic with auto-increment |
| `ccw issue update` | Existing | docs: `.claude/commands/issue/new.md` / `### Phase 6: Create Issue` (GitHub binding) ; ts: `ccw/src/commands/issue.ts` / `case 'update'` | `rg "case 'update'" ccw/src/commands/issue.ts` | CLI subcommand for updating issue fields |
| `.workflow/issues.jsonl` | Existing | docs: `.claude/commands/issue/new.md` / `## Issue Structure` ; ts: `ccw/src/commands/issue.ts` / `readIssues()` | `rg "readIssues" ccw/src/commands/issue.ts` | JSONL storage for issues, managed by CLI |
| `gh issue view` | Existing | docs: `.claude/commands/issue/new.md` / `### Phase 2: Data Extraction` ; ts: N/A (external CLI) | `gh --version` | GitHub CLI for fetching issue data |
| `gh issue create` | Existing | docs: `.claude/commands/issue/new.md` / `### Phase 6: Create Issue` ; ts: N/A (external CLI) | `gh --version` | GitHub CLI for publishing issues |
| `mcp__ace-tool__search_context` | Existing | docs: `.claude/commands/issue/new.md` / `### Phase 3: Lightweight Context Hint` ; ts: N/A (MCP tool) | `rg "mcp__ace-tool__search_context" .claude/commands/issue/new.md` | MCP tool for context discovery |
| Skill handler | Planned | docs: TBD ; ts: TBD | TBD | Skill execution logic to be implemented or verified in skill system |
| `extractKeywords()` helper | Existing | docs: `.claude/commands/issue/new.md` / `## Helper Functions` ; ts: TBD (may be inline) | `rg "extractKeywords" .claude/commands/issue/new.md` | Helper function for keyword extraction |
| `parseTextDescription()` helper | Existing | docs: `.claude/commands/issue/new.md` / `## Helper Functions` ; ts: TBD (may be inline) | `rg "parseTextDescription" .claude/commands/issue/new.md` | Helper function for text parsing |
| `parseMarkdownBody()` helper | Existing | docs: `.claude/commands/issue/new.md` / `## Helper Functions` ; ts: TBD (may be inline) | `rg "parseMarkdownBody" .claude/commands/issue/new.md` | Helper function for markdown parsing |

## Implementation Hints (Tooling/Server)

### CLI Endpoints (ccw/src/commands/issue.ts)
- **`ccw issue create`**: Handles JSON input via stdin pipe or `--data` flag, auto-increments ID, appends to JSONL with trailing newline
- **`ccw issue update`**: Updates issue fields including GitHub binding (github_url, github_number)
- **Pattern**: Prefer pipe input (`echo '<json>' | ccw issue create`) over `--data` flag to avoid shell escaping issues

### GitHub CLI Integration
- **`gh issue view`**: Fetches issue data with `--json` flag for structured output
- **`gh issue create`**: Creates GitHub issue, returns URL in output (parse with regex)
- **Error handling**: Check for `gh` CLI availability, show installation instructions if missing

### MCP Tools
- **`mcp__ace-tool__search_context`**: Semantic code search for affected components
- **Usage pattern**: Non-blocking try-catch, continue on failure
- **Optimization**: Only invoke for medium-clarity inputs (score 1-2) with missing components

### AskUserQuestion Patterns
- **Clarification**: Single open-ended question with custom text input via "Other" option
- **GitHub publishing**: Binary choice (Yes/No) for non-GitHub sources
- **Confirmation**: Only for low-clarity inputs (score < 2) unless auto mode

## Proposed Fix Plan (Minimal)

**No fixes required.** The generated outlines are complete and aligned with the reference implementation. All P0 quality gates pass.

### Optional Enhancements (P2)
1. **Extract helper functions**: Move `extractKeywords`, `parseTextDescription`, `parseMarkdownBody` to shared utilities module (`.claude/utils/issue-parsing.ts`)
2. **Add feedback query command**: Implement `/issue:feedback <id>` to view clarification history
3. **Add telemetry**: Track clarity score distribution for algorithm optimization

### Verification Steps
1. Run evidence verification script:
   ```bash
   node .claude/skills/slash-command-outliner/scripts/verify-evidence.js --file=specs/outputs/gap-report.md
   node .claude/skills/slash-command-outliner/scripts/verify-evidence.js --file=specs/outputs/generated-slash-outline.md
   ```
2. Verify all `Existing` pointers with provided verify commands
3. Confirm skill handler integration (Planned item)
