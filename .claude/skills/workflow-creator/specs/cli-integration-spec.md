# CLI Integration Specification

> Defines the configuration, invocation patterns, and integration requirements for CLI tools in Claude Code Workflow.

---

## When to Use

| Phase | Usage | Section |
|-------|-------|---------|
| Phase 2: Component Generation | Configure CLI tool usage | [CLI Tools Configuration](#cli-tools-configuration) |
| Phase 2: Component Generation | Define CLI command patterns | [Command Patterns](#command-patterns) |
| Phase 3: Integration | Implement CLI invocation | [Invocation Patterns](#invocation-patterns) |
| Phase 4: Validation | Validate CLI integration | [Validation Checklist](#validation-checklist) |

---

## CLI Tools Configuration

### Configuration File Location

```
~/.claude/cli-tools.json
```

### Configuration Structure

```json
{
  "version": "3.3.0",
  "tools": {
    "{tool-id}": {
      "enabled": true,
      "primaryModel": "{model-id}",
      "secondaryModel": "{fallback-model-id}",
      "tags": [],
      "type": "{tool-type}"
    }
  }
}
```

### Tool Types

| Type | Description | Capabilities |
|------|-------------|--------------|
| `builtin` | Native CLI tool | Full (analysis + write tools) |
| `cli-wrapper` | Wrapped CLI tool | Full (analysis + write tools) |
| `api-endpoint` | API-based tool | Analysis only (no file write) |

### Standard Tools

| Tool ID | Type | Primary Use |
|---------|------|-------------|
| `gemini` | builtin | Primary analysis and planning |
| `qwen` | builtin | Fallback analysis |
| `codex` | builtin | Code review and implementation |
| `claude` | builtin | Alternative analysis |
| `opencode` | builtin | Free tier analysis |

---

## Command Patterns

### Base Command Structure

```bash
ccw cli -p "{PROMPT}" --tool {tool-id} --mode {mode} [OPTIONS]
```

### Required Parameters

| Parameter | Description | Values |
|-----------|-------------|--------|
| `-p "{PROMPT}"` | Prompt content | Quoted string |
| `--tool {tool-id}` | CLI tool to use | gemini, qwen, codex, etc. |
| `--mode {mode}` | Execution mode | analysis, write, review |

### Optional Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `--model {model-id}` | Model override | Tool's primaryModel |
| `--cd {path}` | Working directory | Current directory |
| `--includeDirs {dirs}` | Additional directories | None |
| `--resume [id]` | Resume session | None |
| `--rule {template}` | Template name | universal-rigorous-style |

### Mode Definitions

| Mode | Permission | Use Case |
|------|------------|----------|
| `analysis` | Read-only | Code review, architecture analysis, exploration |
| `write` | Create/Modify/Delete | Feature implementation, bug fixes, code creation |
| `review` | Read-only (codex only) | Git-aware code review |

---

## Prompt Template

### Universal Prompt Structure

```bash
ccw cli -p "PURPOSE: {what} + {why} + {success criteria} + {constraints/scope}
TASK: * {step 1: specific action} * {step 2: specific action} * {step 3: specific action}
MODE: {analysis|write}
CONTEXT: @{file patterns} | Memory: {session/tech/module context}
EXPECTED: {deliverable format} + {quality criteria} + {structure requirements}
CONSTRAINTS: {domain constraints}" --tool {tool-id} --mode {mode}
```

### Prompt Fields

| Field | Purpose | Example |
|-------|---------|---------|
| PURPOSE | Goal + motivation + success | "Identify security vulnerabilities to pass audit; success = all OWASP Top 10 addressed" |
| TASK | Actionable steps | "* Scan for SQL injection * Check XSS * Verify CSRF" |
| MODE | Permission level | "analysis" or "write" |
| CONTEXT | File scope + history | "@src/auth/**/*.ts | Memory: Previous auth refactoring" |
| EXPECTED | Output specification | "Markdown report with severity levels, file:line references" |
| CONSTRAINTS | Domain constraints | "Focus on authentication | Ignore test files" |

### Context Patterns

| Pattern | Meaning | Example |
|---------|---------|---------|
| `@**/*` | All files | Default scope |
| `@src/**/*.ts` | TypeScript in src | Specific directory |
| `@../shared/**/*` | Sibling directory | Requires --includeDirs |
| `@CLAUDE.md` | Specific file | Single file reference |

---

## Invocation Patterns

### Direct CLI Invocation

```javascript
// In command implementation
const result = Bash(`ccw cli -p "
PURPOSE: ${purpose}
TASK: ${tasks.map(t => `* ${t}`).join(' ')}
MODE: analysis
CONTEXT: @**/*
EXPECTED: ${expected}
CONSTRAINTS: ${constraints}
" --tool gemini --mode analysis --cd ${projectRoot}`)
```

### Agent CLI Invocation

```javascript
// In agent prompt
ccw cli -p "
PURPOSE: {from prompt}
TASK: {from prompt}
MODE: analysis
CONTEXT: @**/*
EXPECTED: {from prompt}
RULES: {from prompt, if template specified} | analysis=READ-ONLY
" --tool gemini --mode analysis --cd {dir}
```

### Bash Tool Configuration

```javascript
// CRITICAL: Use run_in_background=false for CLI calls
Bash({
  command: `ccw cli -p "..." --tool gemini --mode analysis`,
  run_in_background: false,  // MANDATORY: Wait for results
  timeout: 3600000           // 60 minutes for long operations
})
```

---

## Fallback Chain

### Standard Fallback Order

```
Gemini -> Qwen -> Codex -> Bash-only
```

### Fallback Implementation

```javascript
// Fallback chain implementation
async function executeCLI(prompt, config) {
  const tools = ['gemini', 'qwen', 'codex']
  
  for (const tool of tools) {
    try {
      return await Bash(`ccw cli -p "${prompt}" --tool ${tool} --mode ${config.mode}`)
    } catch (error) {
      if (error.code === 429 || error.code === 404) {
        console.log(`${tool} failed, trying next tool...`)
        continue
      }
      throw error
    }
  }
  
  // Degraded mode: Bash-only
  return { status: "degraded", output: generateBasicOutput() }
}
```

### Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 429 | Rate limited | Try next tool |
| 404 | Tool not found | Try next tool |
| 500 | Server error | Retry or fail |
| Timeout | Operation timeout | Return partial results |

---

## Session Management

### Session Resume

```bash
# Resume last session
ccw cli -p "Continue analyzing" --tool gemini --mode analysis --resume

# Resume specific session
ccw cli -p "Fix issues found" --tool gemini --mode write --resume {session-id}

# Merge multiple sessions
ccw cli -p "Merge findings" --tool gemini --mode analysis --resume {id1},{id2}
```

### CLI Execution ID Assignment

```javascript
// Assign CLI execution IDs for task tracking
function assignCliExecutionIds(tasks, sessionId) {
  const taskMap = new Map(tasks.map(t => [t.id, t]))
  const childCount = new Map()

  // Count children for each task
  tasks.forEach(task => {
    (task.depends_on || []).forEach(depId => {
      childCount.set(depId, (childCount.get(depId) || 0) + 1)
    })
  })

  tasks.forEach(task => {
    task.cli_execution_id = `${sessionId}-${task.id}`
    const deps = task.depends_on || []

    if (deps.length === 0) {
      task.cli_execution = { strategy: "new" }
    } else if (deps.length === 1) {
      const parent = taskMap.get(deps[0])
      const parentChildCount = childCount.get(deps[0]) || 0
      task.cli_execution = parentChildCount === 1
        ? { strategy: "resume", resume_from: parent.cli_execution_id }
        : { strategy: "fork", resume_from: parent.cli_execution_id }
    } else {
      task.cli_execution = {
        strategy: "merge_fork",
        merge_from: deps.map(depId => taskMap.get(depId).cli_execution_id)
      }
    }
  })
  return tasks
}
```

### Strategy Rules

| depends_on | Parent Children | Strategy | CLI Command |
|------------|-----------------|----------|-------------|
| [] | - | `new` | `--id {cli_execution_id}` |
| [T1] | 1 | `resume` | `--resume {resume_from}` |
| [T1] | >1 | `fork` | `--resume {resume_from} --id {cli_execution_id}` |
| [T1,T2] | - | `merge_fork` | `--resume {ids.join(',')} --id {cli_execution_id}` |

---

## Rule Templates

### Available Templates

| Category | Template Name | Use Case |
|----------|---------------|----------|
| Universal | `universal-rigorous-style` | Precise tasks |
| Universal | `universal-creative-style` | Exploratory tasks |
| Analysis | `analysis-trace-code-execution` | Execution tracing |
| Analysis | `analysis-diagnose-bug-root-cause` | Bug diagnosis |
| Analysis | `analysis-analyze-code-patterns` | Code patterns |
| Analysis | `analysis-review-architecture` | Architecture review |
| Analysis | `analysis-review-code-quality` | Code review |
| Analysis | `analysis-assess-security-risks` | Security assessment |
| Planning | `planning-plan-architecture-design` | Architecture design |
| Planning | `planning-breakdown-task-steps` | Task breakdown |
| Planning | `planning-design-component-spec` | Component design |
| Development | `development-implement-feature` | Feature implementation |
| Development | `development-refactor-codebase` | Code refactoring |
| Development | `development-generate-tests` | Test generation |

### Template Usage

```bash
# Use template with --rule option
ccw cli -p "..." --tool gemini --mode analysis --rule analysis-review-architecture
```

---

## Directory Configuration

### Working Directory (--cd)

```bash
# Set working directory
ccw cli -p "..." --tool gemini --mode analysis --cd src/auth
```

**Behavior**:
- `@**/*` = Files within working directory tree only
- Cannot reference parent/sibling via @ alone
- Must use `--includeDirs` for external directories

### Include Directories (--includeDirs)

```bash
# Single directory
ccw cli -p "CONTEXT: @**/* @../shared/**/*" --tool gemini --mode analysis --cd src/auth --includeDirs ../shared

# Multiple directories
ccw cli -p "..." --tool gemini --mode analysis --cd src/auth --includeDirs ../shared,../types,../utils
```

**Rule**: If CONTEXT contains `@../dir/**/*`, MUST include `--includeDirs ../dir`

---

## Auto-Invoke Triggers

### Trigger Conditions

| Trigger | Suggested Rule | When to Use |
|---------|----------------|-------------|
| Self-repair fails | `analysis-diagnose-bug-root-cause` | After 1+ failed fix attempts |
| Ambiguous requirements | `planning-breakdown-task-steps` | Task description lacks clarity |
| Architecture decisions | `planning-plan-architecture-design` | Complex feature needs design |
| Pattern uncertainty | `analysis-analyze-code-patterns` | Unsure of existing conventions |
| Critical code paths | `analysis-assess-security-risks` | Security/performance sensitive |

### Auto-Invoke Example

```javascript
// After 1+ failed fix attempts, auto-invoke root cause analysis
if (fixAttempts >= 1 && !fixSucceeded) {
  Bash(`ccw cli -p "PURPOSE: Identify root cause of ${bugDescription}; success = actionable fix strategy
TASK: * Trace execution flow * Identify failure point * Analyze state at failure * Determine fix approach
MODE: analysis
CONTEXT: @src/module/**/* | Memory: Previous fix attempts failed at ${location}
EXPECTED: Root cause analysis with: failure mechanism, stack trace interpretation, fix recommendation with code
CONSTRAINTS: Focus on ${specificArea}
" --tool gemini --mode analysis --rule analysis-diagnose-bug-root-cause`)
}
```

---

## Quality Check Integration

### Plan Quality Check

```bash
# Validate plan quality after generation
ccw cli -p "Validate plan quality: completeness, granularity, dependencies, acceptance criteria, implementation steps, constraint compliance" \
  --tool gemini --mode analysis \
  --context "@{plan_json_path} @.workflow/project-guidelines.json"
```

### Quality Dimensions

| Dimension | Check Criteria | Critical |
|-----------|---------------|----------|
| Completeness | All requirements reflected in tasks | Yes |
| Task Granularity | Each task 15-60 min scope | No |
| Dependencies | No circular deps, correct ordering | Yes |
| Acceptance Criteria | Quantified and testable | No |
| Implementation Steps | 2+ actionable steps per task | No |
| Constraint Compliance | Follows project-guidelines.json | Yes |

---

## Validation Checklist

### CLI Configuration Validation

- [ ] **cli-tools.json exists**: Configuration file present
- [ ] **Tools enabled**: Required tools have `enabled: true`
- [ ] **Models configured**: primaryModel and secondaryModel set
- [ ] **Type correct**: Tool type matches capabilities needed

### Command Validation

- [ ] **Prompt complete**: All required fields (PURPOSE, TASK, MODE, CONTEXT, EXPECTED)
- [ ] **Mode specified**: --mode analysis or --mode write
- [ ] **Tool specified**: --tool {tool-id}
- [ ] **Context patterns valid**: @ patterns match actual files

### Integration Validation

- [ ] **Fallback chain**: Fallback tools configured
- [ ] **Error handling**: Error codes handled appropriately
- [ ] **Timeout configured**: Appropriate timeout for operation
- [ ] **Background mode correct**: run_in_background=false for CLI calls

---

## Example: Complete CLI Integration

```javascript
// Complete CLI integration example
async function executeAnalysis(taskDescription, sessionFolder) {
  const prompt = `PURPOSE: Analyze codebase for ${taskDescription}; success = comprehensive analysis report
TASK: * Identify relevant modules * Analyze patterns * Document findings
MODE: analysis
CONTEXT: @**/* | Memory: Session ${sessionFolder}
EXPECTED: JSON report with: modules, patterns, recommendations
CONSTRAINTS: Focus on main source code | Ignore tests`

  try {
    // Primary tool
    const result = await Bash({
      command: `ccw cli -p "${prompt}" --tool gemini --mode analysis --cd ${projectRoot}`,
      run_in_background: false,
      timeout: 3600000
    })
    return { status: "success", output: result }
  } catch (error) {
    // Fallback to qwen
    try {
      const result = await Bash({
        command: `ccw cli -p "${prompt}" --tool qwen --mode analysis --cd ${projectRoot}`,
        run_in_background: false,
        timeout: 3600000
      })
      return { status: "success", output: result, fallback: "qwen" }
    } catch (fallbackError) {
      return { status: "failed", error: fallbackError.message }
    }
  }
}
```

---

*Specification Version: 1.0*
*Based on: cli-tools-usage.md, cli-tools.json*
