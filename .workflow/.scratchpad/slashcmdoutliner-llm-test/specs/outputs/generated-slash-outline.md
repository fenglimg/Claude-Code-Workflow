---
name: new
description: Create structured issue from GitHub URL or text description
argument-hint: "[-y|--yes] <github-url | text-description> [--priority 1-5]"
allowed-tools: TodoWrite(*), Bash(*), Read(*), AskUserQuestion(*), mcp__ace-tool__search_context(*)
group: issue
---

# Issue New Command (/issue:new)

## Overview

- Goal: Turn GitHub URL or text description into a tracked issue with structured fields (title, description, priority, labels, acceptance criteria)
- Command: `/issue:new`

## Usage

```bash
/issue:new <github-url | text-description> [--priority 1-5] [-y|--yes]
```

## Inputs

- Required inputs:
  - `<github-url | text-description>`: GitHub issue URL (e.g., `https://github.com/org/repo/issues/123`) or text description of the issue
- Optional inputs:
  - `--priority <1-5>`: Priority level (1=critical, 5=low, default=3)
  - `-y|--yes`: Auto mode - skip clarification questions, create issue with inferred details

## Outputs / Artifacts

- Writes:
  - `.workflow/issues.jsonl`: Issue record appended to JSONL file
  - Optional: GitHub issue (if user opts to publish non-GitHub sources)
- Reads:
  - `.workflow/issues.jsonl`: Existing issues for ID generation and duplicate detection
  - Repo files as needed for context (via ACE search for medium-clarity inputs)

## Implementation Pointers

- Command doc: `.claude/commands/issue/new.md`
- Likely code locations:
  - `ccw/src/commands/issue.ts`: CLI subcommand `ccw issue create`
  - `ccw/src/commands/issue.ts`: Helper functions `createIssue()`, `readIssues()`, `writeIssues()`
  - Skill handler: `.claude/skills/*/issue-new.ts` or inline in command executor

### Evidence (Existing vs Planned)

| Pointer | Status | Evidence (docs + TS) | Verify | Why |
|---|---|---|---|---|
| `.claude/commands/issue/new.md` | Existing | docs: `.claude/commands/issue/new.md` / `# Issue New Command` ; ts: N/A (command doc) | `Test-Path .claude/commands/issue/new.md` | Command documentation exists |
| `ccw issue create` CLI | Existing | docs: `.claude/commands/issue/new.md` / `### Phase 6: Create Issue` ; ts: `ccw/src/commands/issue.ts` / `function createIssue` | `rg "function createIssue" ccw/src/commands/issue.ts` | CLI endpoint for issue creation |
| `ccw issue update` CLI | Existing | docs: `.claude/commands/issue/new.md` / `### Phase 6: Create Issue` (GitHub binding) ; ts: `ccw/src/commands/issue.ts` / `case 'update'` | `rg "case 'update'" ccw/src/commands/issue.ts` | CLI endpoint for updating issue with GitHub binding |
| `.workflow/issues.jsonl` | Existing | docs: `.claude/commands/issue/new.md` / `## Issue Structure` ; ts: `ccw/src/commands/issue.ts` / `readIssues()` | `rg "readIssues" ccw/src/commands/issue.ts` | JSONL storage for issues |
| Skill handler | Planned | docs: TBD ; ts: TBD | TBD | Skill execution logic to be implemented or verified |

## Execution Process

### Phase 1: Input Analysis & Clarity Detection
- Parse user input and extract flags (`--priority`, `-y|--yes`)
- Detect input type: GitHub URL, GitHub short ref (#123), structured text, or vague text
- Calculate clarity score (0-3):
  - 3: GitHub URL/ref (fully clear)
  - 2: Structured text with keywords (expected/actual/affects)
  - 1: Long text (>50 chars)
  - 0: Vague/short text

### Phase 2: Data Extraction
- **GitHub source (score=3)**:
  - Fetch via `gh issue view <ref> --json number,title,body,labels,url`
  - Parse JSON response
  - Extract structured fields from markdown body
  - Generate issue ID: `GH-<number>`
- **Text source (score 0-2)**:
  - Parse text description for structured fields (expected/actual/affects)
  - Extract title (first sentence, max 60 chars)
  - Generate issue ID: `ISS-YYYYMMDD-NNN` (auto-increment)

### Phase 3: Lightweight Context Hint (Conditional)
- **Only for medium clarity (score 1-2) AND missing affected_components**
- Extract keywords from context (filter stop words, take top 3)
- Use `mcp__ace-tool__search_context` to find related files (max 3)
- Non-blocking: ACE failure does not stop workflow

### Phase 4: Conditional Clarification (Only if Unclear)
- **Only if score < 2 AND context is too short (<20 chars)**
- Use `AskUserQuestion` with single open-ended prompt:
  - Question: "Please describe the issue in more detail:"
  - Options: Single option "Provide details" (user enters custom text via "Other")
- Save clarification to `feedback[]` array with type='clarification'

### Phase 5: GitHub Publishing Decision (Non-GitHub Sources)
- **Skip if source='github'** (already from GitHub)
- For text/discovery sources, use `AskUserQuestion`:
  - Question: "Would you like to publish this issue to GitHub?"
  - Options: "Yes, publish to GitHub" / "No, keep local only"
- Set `publishToGitHub` flag based on user choice

### Phase 6: Create Issue
- **Display summary**: ID, title, source, affected files (if any)
- **Confirmation** (only if score < 2 and not auto mode):
  - Use `AskUserQuestion` to confirm before creation
- **Create local issue** via CLI:
  ```bash
  echo '{"title":"...","context":"...","priority":3}' | ccw issue create
  ```
- **If publishToGitHub=true**:
  - Create GitHub issue: `gh issue create --title "..." --body "..."`
  - Parse GitHub URL and number from output
  - Update local issue with GitHub binding: `ccw issue update <id> --github-url "..." --github-number <num>`
- **Display completion**:
  - Show created issue ID
  - Show GitHub URL (if published)
  - Show next step: `/issue:plan <id>`

## Error Handling

| Error | Resolution |
|-------|-----------|
| GitHub API failure | Retry with exponential backoff; if persistent, fall back to manual input |
| Invalid GitHub URL | Show error message with expected format; prompt user to correct |
| ACE search timeout | Non-blocking; continue without affected_components hint |
| Duplicate issue ID | Auto-increment to next available ID (handled by `ccw issue create`) |
| JSONL write failure | Show error; check file permissions and disk space |
| gh CLI not installed | Show error with installation instructions; disable GitHub publishing |
| User cancels confirmation | Abort without creating issue; show cancellation message |

## Examples

### Example 1: GitHub URL (Clear Input, No Questions)
```bash
/issue:new https://github.com/org/repo/issues/42

# Output:
# ✓ Fetched GitHub issue #42
# ✓ Created local issue: GH-42
# → Next step: /issue:plan GH-42
```

### Example 2: Structured Text (Clear Input, No Questions)
```bash
/issue:new "Login fails with special chars. Expected: success. Actual: 500 error" --priority 2

# Output:
# ✓ Parsed structured description
# ✓ Created issue: ISS-20260205-001
# → Next step: /issue:plan ISS-20260205-001
```

### Example 3: Vague Input (1 Clarification Question)
```bash
/issue:new "auth broken"

# System asks: "Please describe the issue in more detail:"
# User provides: "Login endpoint returns 401 for valid credentials after password reset"

# Output:
# ✓ Clarification saved to feedback
# ✓ Created issue: ISS-20260205-002
# → Next step: /issue:plan ISS-20260205-002
```

### Example 4: Text with GitHub Publishing
```bash
/issue:new "Payment processing timeout after 30s. Expected: complete in <10s. Actual: timeout"

# System asks: "Would you like to publish this issue to GitHub?"
# User selects: "Yes, publish to GitHub"

# Output:
# ✓ Created local issue: ISS-20260205-003
# ✓ Published to GitHub: https://github.com/org/repo/issues/124
# ✓ GitHub binding saved
# → Next step: /issue:plan ISS-20260205-003
```

### Example 5: Auto Mode (Skip Questions)
```bash
/issue:new "cache invalidation bug" --yes --priority 1

# Output:
# ✓ Auto mode: skipped clarification
# ✓ Created issue: ISS-20260205-004 (priority: 1)
# → Next step: /issue:plan ISS-20260205-004
```
