# Agent Outline: issue:new

## Purpose

Implement and/or evolve the slash command according to CCW conventions with minimal regressions.

## Execution Model

- Default: incremental, testable changes
- Use ACE-tool to find existing patterns before adding new abstractions
- Interaction: Iterative (conditional clarification based on input clarity)
- Max rounds: 5 (clarity detection → extraction → context hint → clarification → GitHub decision → creation)

## State & Artifacts

- Session folder (if used): `.workflow/issues/` (persistent storage)
- Required outputs:
  - Slash MD (command doc): `.claude/commands/issue/new.md`
  - Issue records: `.workflow/issues.jsonl` (JSONL append-only)
  - Optional: GitHub issue (if user opts to publish)
- Validation notes / regression snapshots: TBD

## Tooling

- Allowed tools: TodoWrite(*), Bash(*), Read(*), AskUserQuestion(*), mcp__ace-tool__search_context(*)
- Non-negotiables:
  - no unrelated changes
  - verify non-regression against completed corpus
  - use `ccw issue create` CLI (not direct file writes)
  - use `gh issue view` for GitHub fetching (not API calls)
  - use `gh issue create` for GitHub publishing (not API calls)

## Implementation Strategy

### Phase 1: Input Analysis & Clarity Detection
- **Pattern**: Deterministic scoring (0-3) based on input structure
- **Existing reference**: `.claude/commands/issue/new.md` lines 75-94
- **Key logic**:
  - GitHub URL/ref → score=3 (fully clear)
  - Structured text (expected/actual/affects keywords) → score=2
  - Long text (>50 chars) → score=1
  - Short/vague text → score=0
- **No external calls**: Pure regex/string analysis

### Phase 2: Data Extraction
- **GitHub source**:
  - Use `Bash('gh issue view <ref> --json number,title,body,labels,url')`
  - Parse JSON response
  - Extract structured fields via `parseMarkdownBody()` helper
  - ID format: `GH-<number>`
- **Text source**:
  - Use `parseTextDescription()` helper (regex extraction)
  - Extract title (first sentence, max 60 chars)
  - Extract structured fields (expected/actual/affects)
  - ID format: `ISS-YYYYMMDD-NNN` (auto-increment via CLI)

### Phase 3: Lightweight Context Hint (Conditional)
- **Trigger**: score=1-2 AND missing affected_components
- **Pattern**: Non-blocking ACE search
- **Implementation**:
  ```javascript
  if (clarityScore >= 1 && clarityScore <= 2 && !issueData.affected_components?.length) {
    const keywords = extractKeywords(issueData.context);
    if (keywords.length >= 2) {
      try {
        const aceResult = mcp__ace-tool__search_context({
          project_root_path: process.cwd(),
          query: keywords.slice(0, 3).join(' ')
        });
        issueData.affected_components = aceResult.files?.slice(0, 3) || [];
      } catch {
        // ACE failure is non-blocking
      }
    }
  }
  ```
- **Existing reference**: `.claude/commands/issue/new.md` lines 122-144

### Phase 4: Conditional Clarification
- **Trigger**: score < 2 AND context.length < 20 AND not auto mode
- **Pattern**: Single open-ended AskUserQuestion
- **Implementation**:
  ```javascript
  if (clarityScore < 2 && (!issueData.context || issueData.context.length < 20)) {
    const answer = AskUserQuestion({
      questions: [{
        question: 'Please describe the issue in more detail:',
        header: 'Clarify',
        multiSelect: false,
        options: [
          { label: 'Provide details', description: 'Describe what, where, and expected behavior' }
        ]
      }]
    });
    
    if (answer.customText) {
      issueData.context = answer.customText;
      issueData.title = answer.customText.split(/[.\n]/)[0].substring(0, 60);
      issueData.feedback = [{
        type: 'clarification',
        stage: 'new',
        content: answer.customText,
        created_at: new Date().toISOString()
      }];
    }
  }
  ```
- **Existing reference**: `.claude/commands/issue/new.md` lines 146-174

### Phase 5: GitHub Publishing Decision
- **Trigger**: source !== 'github' (text or discovery sources)
- **Pattern**: Binary choice AskUserQuestion
- **Implementation**:
  ```javascript
  let publishToGitHub = false;
  
  if (issueData.source !== 'github') {
    const publishAnswer = AskUserQuestion({
      questions: [{
        question: 'Would you like to publish this issue to GitHub?',
        header: 'Publish',
        multiSelect: false,
        options: [
          { label: 'Yes, publish to GitHub', description: 'Create issue on GitHub and link it' },
          { label: 'No, keep local only', description: 'Store as local issue without GitHub sync' }
        ]
      }]
    });
    
    publishToGitHub = publishAnswer.answers?.['Publish']?.includes('Yes');
  }
  ```
- **Existing reference**: `.claude/commands/issue/new.md` lines 176-197

### Phase 6: Issue Creation
- **Local issue creation**:
  - Use `Bash('echo \'<json>\' | ccw issue create')` (pipe input, avoids escaping)
  - CLI handles ID auto-increment, JSONL append, trailing newline
  - Returns JSON with created issue
- **GitHub publishing** (if opted in):
  - Use `Bash('gh issue create --title "..." --body "..."')`
  - Parse GitHub URL and number from output
  - Update local issue: `Bash('ccw issue update <id> --github-url "..." --github-number <num>')`
- **Confirmation** (if score < 2 and not auto mode):
  - Use `AskUserQuestion` to confirm before creation
- **Existing reference**: `.claude/commands/issue/new.md` lines 199-313

## Validation Strategy

- P0 gates: frontmatter + allowed-tools + core sections + artifact references
- Regression: compare against snapshots for already-completed commands
- Evidence-based implementation pointers (Existing vs Planned with verification)

### P0 Validation Checklist
- [ ] Frontmatter complete: name, description, allowed-tools, argument-hint
- [ ] Allowed-tools correct: no missing/extra tools
- [ ] Core sections present: Overview, Usage, Inputs, Outputs/Artifacts, Implementation Pointers, Execution Process, Error Handling, Examples
- [ ] No broken artifact references: all paths documented as created or pre-existing
- [ ] Implementation pointers evidence-based: Existing pointers verified, Planned pointers marked as TBD

### Non-Regression Tests
- [ ] GitHub URL input → creates GH-<number> issue without questions
- [ ] Structured text input → creates ISS-YYYYMMDD-NNN issue without questions
- [ ] Vague input → asks 1 clarification question → creates issue
- [ ] Auto mode (-y) → skips all questions → creates issue
- [ ] GitHub publishing → creates local + GitHub issue → links them
- [ ] ACE search failure → non-blocking, continues without affected_components
- [ ] Duplicate ID → auto-increments to next available

## Key Patterns from Reference

### Pattern 1: Clarity-Based Branching
- **Source**: `.claude/commands/issue/new.md` lines 317-342
- **Pattern**: Branch execution based on clarity score
  - Score 3 (GitHub): Direct extraction, no questions
  - Score 1-2 (Text): Parse + optional ACE hint, no questions
  - Score 0 (Vague): Ask clarification question
- **Reuse**: Apply same scoring logic and branching

### Pattern 2: Non-Blocking External Calls
- **Source**: `.claude/commands/issue/new.md` lines 125-143
- **Pattern**: Wrap ACE search in try-catch, continue on failure
- **Reuse**: Apply to all optional enhancement steps

### Pattern 3: CLI-First Architecture
- **Source**: `.claude/commands/issue/new.md` lines 207-252
- **Pattern**: Use CLI endpoints (ccw issue create/update) instead of direct file manipulation
- **Benefits**: Auto-increment, JSONL formatting, trailing newline, validation
- **Reuse**: Always prefer CLI over direct file writes

### Pattern 4: Pipe Input for JSON
- **Source**: `.claude/commands/issue/new.md` lines 209-243
- **Pattern**: Use `echo '<json>' | ccw issue create` to avoid shell escaping issues
- **Alternative**: Heredoc for multi-line JSON
- **Reuse**: Apply to all JSON CLI inputs

### Pattern 5: Feedback History
- **Source**: `.claude/commands/issue/new.md` lines 45-51, 166-172
- **Pattern**: Store clarifications/failures in `feedback[]` array with type, stage, content, timestamp
- **Reuse**: Apply to all user interactions that refine issue understanding

## Dependencies

- **CLI tools**:
  - `ccw issue create`: Create issue with auto-increment ID
  - `ccw issue update`: Update issue fields (GitHub binding)
  - `gh issue view`: Fetch GitHub issue data
  - `gh issue create`: Publish issue to GitHub
- **MCP tools**:
  - `mcp__ace-tool__search_context`: Optional context hint for medium-clarity inputs
- **Helper functions** (to implement or verify):
  - `extractKeywords(text)`: Extract keywords for ACE search
  - `parseTextDescription(text)`: Parse structured fields from text
  - `parseMarkdownBody(body)`: Parse structured fields from GitHub markdown

## Risk Mitigation

- **ACE search failure**: Non-blocking, continue without affected_components
- **GitHub API rate limit**: Use gh CLI (respects rate limits), show error if exceeded
- **JSONL corruption**: Use CLI (handles trailing newline), validate before write
- **Duplicate IDs**: CLI handles auto-increment, no manual ID generation
- **User cancellation**: Abort cleanly, no partial writes
