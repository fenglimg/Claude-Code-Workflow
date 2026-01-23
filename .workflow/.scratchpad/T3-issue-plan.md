# T3: issue:plan Implementation - Closed-Loop Issue Planning

## Overview

`/issue:plan` is a unified planning command using **issue-plan-agent** that combines exploration and planning into a single closed-loop workflow. It transforms GitHub issues into executable solutions with 5-phase task lifecycle.

**Core Principle**: Batch process issues with intelligent grouping, explore each issue, generate solutions, and auto-bind single solutions or return for user selection.

## Architecture

### 4-Phase Execution Model

```
Phase 1: Issue Loading & Intelligent Grouping
    ↓ [Semantic similarity analysis]
    ↓
Phase 2: Unified Explore + Plan (issue-plan-agent)
    ↓ [Parallel batch execution]
    ↓
Phase 3: Solution Registration & Binding
    ↓ [Auto-bind or user selection]
    ↓
Phase 4: Summary
```

**Key Characteristics**:
- **Batch processing**: 1-3 issues per agent invocation
- **Intelligent grouping**: Semantic similarity via Gemini
- **Closed-loop agents**: ACE search + solution generation in single agent
- **Failure-aware planning**: Analyzes previous failures to avoid repeating approaches
- **Auto-binding**: Single solution → auto-bind; Multiple → user selection

### Data Access Principle

**Correct** (CLI-based):
```javascript
ccw issue list --status pending --brief        // Minimal fields
ccw issue status <id> --json                   // Full details (agent only)
ccw issue bind <id> <sol-id>                   // Update status
```

**Incorrect** (Direct file access):
```javascript
Read('issues.jsonl')                           // ❌ Context overflow
Read('solutions/*.jsonl')                      // ❌ Context overflow
```

## Phase Details

### Phase 1: Issue Loading & Intelligent Grouping

**Input Parsing**:
```javascript
const batchSize = flags.batchSize || 3
let issues = []  // {id, title, tags} - brief info only

// Default to --all-pending if no input
const useAllPending = flags.allPending || !userInput || userInput.trim() === ''

if (useAllPending) {
  // Get pending issues via CLI (brief metadata)
  const result = Bash(`ccw issue list --status pending,registered --json`).trim()
  const parsed = result ? JSON.parse(result) : []
  issues = parsed.map(i => ({ id: i.id, title: i.title || '', tags: i.tags || [] }))
} else {
  // Parse comma-separated issue IDs
  const ids = userInput.includes(',')
    ? userInput.split(',').map(s => s.trim())
    : [userInput.trim()]

  for (const id of ids) {
    Bash(`ccw issue init ${id} --title "Issue ${id}" 2>/dev/null || true`)
    const info = Bash(`ccw issue status ${id} --json`).trim()
    const parsed = info ? JSON.parse(info) : {}
    issues.push({ id, title: parsed.title || '', tags: parsed.tags || [] })
  }
}
```

**Intelligent Grouping** (Semantic Similarity):
```javascript
// Analyze issues by title/tags, group semantically similar ones
// Strategy: Same module/component, related bugs, feature clusters
// Constraint: Max ${batchSize} issues per batch

// Use Gemini to analyze semantic similarity
const groupingPrompt = `
Analyze these issues and group semantically similar ones:
${issues.map(i => `- ${i.id}: ${i.title} [${i.tags.join(', ')}]`).join('\n')}

Group into batches of max ${batchSize} issues each.
Return JSON: { batches: [[id1, id2], [id3]] }
`

const groupingResult = Bash(`ccw cli -p "${groupingPrompt}" --tool gemini --mode analysis`)
const batches = JSON.parse(groupingResult).batches
```

**TodoWrite Initialization**:
```javascript
TodoWrite({
  todos: batches.map((_, i) => ({
    content: `Plan batch ${i+1}`,
    status: 'pending',
    activeForm: `Planning batch ${i+1}`
  }))
})
```

**File References**:
- `.claude/commands/issue/plan.md` (lines 85-135): Phase 1 implementation

### Phase 2: Unified Explore + Plan (issue-plan-agent)

**Parallel Batch Execution**:
```javascript
const MAX_PARALLEL = 10
const agentResults = []
const pendingSelections = []

// Build prompts for all batches
const agentTasks = batches.map((batch, batchIndex) => {
  const issueList = batch.map(i => `- ${i.id}: ${i.title}${i.tags.length ? ` [${i.tags.join(', ')}]` : ''}`).join('\n')
  const batchIds = batch.map(i => i.id)

  const issuePrompt = `
## Plan Issues

**Issues** (grouped by similarity):
${issueList}

**Project Root**: ${process.cwd()}

### Project Context (MANDATORY)
1. Read: .workflow/project-tech.json
2. Read: .workflow/project-guidelines.json

### Workflow
1. Fetch issue details: ccw issue status <id> --json
2. **Analyze failure history** (if issue.feedback exists):
   - Extract failure details from issue.feedback (type='failure', stage='execute')
   - Parse error_type, message, task_id, solution_id
   - Identify failure patterns and root causes
   - **Constraint**: Avoid repeating failed approaches
3. Load project context files
4. Explore codebase (ACE semantic search)
5. Plan solution with tasks (schema: solution-schema.json)
   - **If previous solution failed**: Reference failure analysis in solution.approach
   - Add explicit verification steps to prevent same failure mode
6. **If github_url exists**: Add final task to comment on GitHub issue
7. Write solution to: .workflow/issues/solutions/{issue-id}.jsonl
8. **CRITICAL - Binding Decision**:
   - Single solution → **MUST execute**: ccw issue bind <issue-id> <solution-id>
   - Multiple solutions → Return pending_selection only (no bind)

### Failure-Aware Planning Rules
- **Extract failure patterns**: Parse issue.feedback where type='failure' and stage='execute'
- **Identify root causes**: Analyze error_type (test_failure, compilation, timeout, etc.)
- **Design alternative approach**: Create solution that addresses root cause
- **Add prevention steps**: Include explicit verification to catch same error earlier
- **Document lessons**: Reference previous failures in solution.approach

### Rules
- Solution ID format: SOL-{issue-id}-{uid} (uid: 4 random alphanumeric chars)
- Single solution per issue → auto-bind via ccw issue bind
- Multiple solutions → register only, return pending_selection
- Tasks must have quantified acceptance.criteria

### Return Summary
{"bound":[{"issue_id":"...","solution_id":"...","task_count":N}],"pending_selection":[{"issue_id":"...","solutions":[{"id":"...","description":"...","task_count":N}]}]}
`

  return { batchIndex, batchIds, issuePrompt, batch }
})

// Launch agents in parallel (max 10 concurrent)
for (let i = 0; i < agentTasks.length; i += MAX_PARALLEL) {
  const chunk = agentTasks.slice(i, i + MAX_PARALLEL)
  const taskIds = []

  // Launch chunk in parallel
  for (const { batchIndex, batchIds, issuePrompt, batch } of chunk) {
    updateTodo(`Plan batch ${batchIndex + 1}`, 'in_progress')
    const taskId = Task(
      subagent_type="issue-plan-agent",
      run_in_background=true,
      description=`Explore & plan ${batch.length} issues: ${batchIds.join(', ')}`,
      prompt=issuePrompt
    )
    taskIds.push({ taskId, batchIndex })
  }

  // Collect results from this chunk
  for (const { taskId, batchIndex } of taskIds) {
    const result = TaskOutput(task_id=taskId, block=true)
    const jsonText = extractJsonFromMarkdown(result)
    let summary
    try {
      summary = JSON.parse(jsonText)
    } catch (e) {
      console.log(`⚠ Batch ${batchIndex + 1}: Failed to parse agent result`)
      updateTodo(`Plan batch ${batchIndex + 1}`, 'completed')
      continue
    }
    agentResults.push(summary)

    // Verify binding for bound issues
    for (const item of summary.bound || []) {
      const status = JSON.parse(Bash(`ccw issue status ${item.issue_id} --json`).trim())
      if (status.bound_solution_id === item.solution_id) {
        console.log(`✓ ${item.issue_id}: ${item.solution_id} (${item.task_count} tasks)`)
      } else {
        // Fallback: agent failed to bind, execute here
        Bash(`ccw issue bind ${item.issue_id} ${item.solution_id}`)
        console.log(`✓ ${item.issue_id}: ${item.solution_id} (${item.task_count} tasks) [recovered]`)
      }
    }

    // Collect pending selections
    for (const pending of summary.pending_selection || []) {
      pendingSelections.push(pending)
    }
    updateTodo(`Plan batch ${batchIndex + 1}`, 'completed')
  }
}
```

**File References**:
- `.claude/commands/issue/plan.md` (lines 137-252): Phase 2 implementation
- `.claude/agents/issue-plan-agent.md`: Agent specification

### Phase 3: Solution Selection & Binding

**Handle Multi-Solution Issues**:
```javascript
for (const pending of pendingSelections) {
  if (pending.solutions.length === 0) continue

  const options = pending.solutions.slice(0, 4).map(sol => ({
    label: `${sol.id} (${sol.task_count} tasks)`,
    description: sol.description || sol.approach || 'No description'
  }))

  const answer = AskUserQuestion({
    questions: [{
      question: `Issue ${pending.issue_id}: which solution to bind?`,
      header: pending.issue_id,
      options: options,
      multiSelect: false
    }]
  })

  const selected = answer[Object.keys(answer)[0]]
  if (!selected || selected === 'Other') continue

  const solId = selected.split(' ')[0]
  Bash(`ccw issue bind ${pending.issue_id} ${solId}`)
  console.log(`✓ ${pending.issue_id}: ${solId} bound`)
}
```

**File References**:
- `.claude/commands/issue/plan.md` (lines 255-282): Phase 3 implementation

### Phase 4: Summary

**Display Results**:
```javascript
const planned = JSON.parse(Bash(`ccw issue list --status planned --brief`) || '[]')
const plannedCount = planned.length

console.log(`
## Done: ${issues.length} issues → ${plannedCount} planned

Next: \`/issue:queue\` → \`/issue:execute\`
`)
```

**File References**:
- `.claude/commands/issue/plan.md` (lines 285-297): Phase 4 implementation

## Failure-Aware Planning

### Failure History Analysis

**Extract Failure Patterns**:
```javascript
// From issue.feedback array
const failures = issue.feedback.filter(f => f.type === 'failure' && f.stage === 'execute')

failures.forEach(failure => {
  const { error_type, message, task_id, solution_id } = failure.content

  // Identify patterns
  // - Repeated errors: same error_type across multiple attempts
  // - Root causes: underlying issue causing failures
  // - Blockers: unresolved dependencies or environment issues
})
```

### Prevention Strategy

**Add Verification Steps**:
```javascript
// In solution.approach:
// "Previous solution (SOL-xxx) failed with: [error_type]
//  Root cause: [analysis]
//  Prevention: [explicit verification steps]"

// In tasks:
// Add explicit verification task before main implementation
// Include error handling and edge case coverage
```

## Integration Points

**Called Commands**:
- `ccw issue list` (Phase 1, brief metadata)
- `ccw issue status` (Phase 2, full details)
- `ccw issue bind` (Phase 3, binding)
- `issue-plan-agent` (Phase 2, parallel)

**Input Sources**:
- Issue metadata (`.workflow/issues/issues.jsonl`)
- Project context (`.workflow/project-tech.json`, `.workflow/project-guidelines.json`)
- Solution schema (`.claude/workflows/cli-templates/schemas/solution-schema.json`)

**Output Consumers**:
- `/issue:queue` (form execution queue)
- `/issue:execute` (execute solutions)

## Error Handling

| Error | Resolution |
|-------|-----------|
| Issue not found | Auto-create in issues.jsonl |
| ACE search fails | Agent falls back to ripgrep |
| No solutions generated | Display error, suggest manual planning |
| User cancels selection | Skip issue, continue with others |
| File conflicts | Agent detects and suggests resolution order |
| Binding fails | Fallback: execute bind command in orchestrator |

## Code References

**Key Files**:
- `.claude/commands/issue/plan.md` (lines 1-332): Full command specification
- `.claude/agents/issue-plan-agent.md` (lines 1-400): Agent implementation

**Key Patterns**:
- CLI-based issue loading (lines 88-119)
- Intelligent grouping via Gemini (lines 122-126)
- Parallel batch execution (lines 199-252)
- Failure-aware planning (lines 179-184)
- Auto-bind vs user selection (lines 175-177)

## Execution Checklist

- [ ] Parse input (single, comma-separated, or --all-pending)
- [ ] Fetch issue metadata via CLI (brief only)
- [ ] Group issues by semantic similarity
- [ ] Initialize TodoWrite with batch tasks
- [ ] Launch issue-plan-agent per batch (parallel)
- [ ] Collect agent results and verify bindings
- [ ] Handle multi-solution issues (user selection)
- [ ] Display summary with next steps
- [ ] Verify all issues have solutions in solutions/{issue-id}.jsonl
- [ ] Verify single-solution issues are auto-bound

## Quality Criteria

✓ All input issues processed
✓ Single solution issues auto-bound
✓ Multi-solution issues returned for user selection
✓ Each solution has executable tasks with modification_points
✓ Task acceptance criteria are quantified
✓ Conflicts detected and reported
✓ Issue status updated to planned after binding
✓ Failure history analyzed and incorporated
✓ Prevention steps added to avoid repeating failures
