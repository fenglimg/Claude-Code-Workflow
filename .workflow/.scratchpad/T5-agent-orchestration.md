# T5: Agent Orchestration Patterns - 5 Agent Types and Execution Modes

## Overview

Agent orchestration manages the lifecycle of specialized agents that execute complex tasks autonomously. The system supports 5 primary agent types, each with specific responsibilities and execution patterns.

**Core Principle**: Delegate specialized work to appropriate agents, wait for completion, validate outputs, and integrate results.

## Architecture

### 5 Agent Types

```
┌─ cli-explore-agent
│  └─ Read-only code exploration with dual-source analysis (Bash + Gemini CLI)
│
├─ cli-lite-planning-agent
│  └─ Schema-driven planning for lite workflows
│
├─ action-planning-agent
│  └─ Comprehensive task generation and IMPL_PLAN.md creation
│
├─ issue-plan-agent
│  └─ Closed-loop issue exploration and solution generation
│
└─ context-search-agent
   └─ Multi-angle codebase context discovery
```

## Agent 1: cli-explore-agent

**Purpose**: Read-only code exploration with structural and semantic analysis

**Execution Modes**:
- `quick-scan`: Bash only (10-30s)
- `deep-scan`: Bash + Gemini dual-source (2-5min)
- `dependency-map`: Graph construction (3-8min)

**4-Phase Workflow**:
```
Phase 1: Task Understanding
    ↓ Parse prompt for: analysis scope, output requirements, schema path
Phase 2: Analysis Execution
    ↓ Bash structural scan + Gemini semantic analysis (based on mode)
Phase 3: Schema Validation (MANDATORY if schema specified)
    ↓ Read schema → Extract EXACT field names → Validate structure
Phase 4: Output Generation
    ↓ Agent report + File output (strictly schema-compliant)
```

**Bash Structural Scan**:
```bash
# Project structure
ccw tool exec get_modules_by_depth '{}'

# Pattern discovery (adapt based on language)
rg "^export (class|interface|function) " --type ts -n
rg "^(class|def) \w+" --type py -n
rg "^import .* from " -n | head -30
```

**Gemini Semantic Analysis**:
```bash
ccw cli -p "
PURPOSE: {from prompt}
TASK: {from prompt}
MODE: analysis
CONTEXT: @**/*
EXPECTED: {from prompt}
RULES: {from prompt, if template specified} | analysis=READ-ONLY
" --tool gemini --mode analysis --cd {dir}
```

**Dual-Source Synthesis**:
1. Bash results: Precise file:line locations
2. Gemini results: Semantic understanding, design intent
3. Merge with source attribution (bash-discovered | gemini-discovered)

**Schema Validation Protocol**:
```javascript
// Step 1: Read Schema FIRST
const schema = Read(schema_file_path)

// Step 2: Extract Schema Requirements
const schemaFields = parseJsonSchema(schema)

// Step 3: Validate Output Structure
const output = generateOutput()
validateAgainstSchema(output, schemaFields)

// Step 4: Write Output
Write(output_path, JSON.stringify(output, null, 2))
```

**File References**:
- `.claude/agents/cli-explore-agent.md` (lines 1-200): Full specification

## Agent 2: cli-lite-planning-agent

**Purpose**: Schema-driven planning for lite workflows (lite-plan, lite-fix)

**Input Context**:
```javascript
{
  task_description: string,
  schema_path: string,
  session: { id, folder, artifacts },
  explorationsContext: { [angle]: ExplorationResult } | null,
  diagnosesContext: { [angle]: DiagnosisResult } | null,
  contextAngles: string[],
  clarificationContext: { [question]: answer } | null,
  complexity: "Low" | "Medium" | "High",
  cli_config: { tool, template, timeout, fallback }
}
```

**4-Phase Execution**:
```
Phase 1: Input Validation
    ↓ Validate schema path, complexity, context
Phase 2: CLI Execution
    ↓ Construct CLI command with planning template
    ↓ Execute Gemini (fallback: Qwen → degraded mode)
Phase 3: Parsing & Enhancement
    ↓ Parse CLI output sections
    ↓ Validate and enhance task objects
Phase 4: planObject Generation
    ↓ Build planObject conforming to schema
    ↓ Assign CLI execution IDs and strategies
    ↓ Generate flow_control from depends_on
```

**CLI Command Template**:
```bash
ccw cli -p "
PURPOSE: Generate implementation plan for: ${task_description}
TASK: • Analyze task requirements • Decompose into executable tasks • Assign dependencies • Estimate time
MODE: analysis
CONTEXT: @**/* | Memory: ${contextAngles.join(', ')} explorations
EXPECTED: Structured plan with: summary, approach, tasks (2-7), estimated_time, complexity, design_decisions
CONSTRAINTS: Follow schema: ${schema_path} | Group by feature, not file | Quantify acceptance criteria
" --tool gemini --mode analysis --rule planning-breakdown-task-steps
```

**Output**: `planObject` conforming to schema

**File References**:
- `.claude/agents/cli-lite-planning-agent.md` (lines 1-650): Full specification

## Agent 3: action-planning-agent

**Purpose**: Comprehensive task generation and IMPL_PLAN.md creation for full workflows

**Input Context**:
```javascript
{
  session_id: string,
  task_description: string,
  context_package: ContextPackage,
  brainstorm_artifacts: BrainstormArtifacts | null,
  conflict_resolution: ConflictResolution | null,
  execution_method: "Agent" | "Codex" | "Auto",
  cli_tool: "gemini" | "qwen" | "codex"
}
```

**Progressive Loading Strategy** (due to file size):
```javascript
// Load analysis.md files incrementally
const analyses = []

// Load one analysis at a time to avoid context explosion
for (const module of modules) {
  const analysisPath = `.workflow/active/${sessionId}/.process/${module}/analysis.md`
  if (fileExists(analysisPath)) {
    const analysis = Read(analysisPath)
    analyses.push({ module, analysis })
    // Process this analysis before loading next
  }
}
```

**5-Phase Task Generation**:
```
Phase 1: Context Assembly
    ↓ Load session metadata, context package, brainstorm artifacts
Phase 2: Module Analysis
    ↓ Analyze each module's analysis.md (progressive loading)
Phase 3: Task Decomposition
    ↓ Break down requirements into executable tasks
    ↓ Identify dependencies and execution order
Phase 4: Plan Generation
    ↓ Create IMPL_PLAN.md with multi-module format
    ↓ Generate task JSON files (IMPL-*.json)
Phase 5: Output Validation
    ↓ Verify all files created
    ↓ Validate task dependencies
    ↓ Generate TODO_LIST.md
```

**Output Files**:
- `.workflow/active/[sessionId]/IMPL_PLAN.md`: Master implementation plan
- `.workflow/active/[sessionId]/.task/IMPL-*.json`: Individual task definitions
- `.workflow/active/[sessionId]/TODO_LIST.md`: Hierarchical task list

**File References**:
- `.claude/agents/action-planning-agent.md`: Full specification

## Agent 4: issue-plan-agent

**Purpose**: Closed-loop issue exploration and solution generation

**Input Context**:
```javascript
{
  issue_ids: string[],
  project_root: string,
  batch_size?: number,
  failure_history?: FailureAnalysis[]
}
```

**Closed-Loop Workflow**:
```
Phase 1: Issue Loading
    ↓ Fetch issue details via ccw issue status <id> --json
Phase 2: Failure Analysis (if applicable)
    ↓ Extract failure patterns from issue.feedback
    ↓ Identify root causes and blockers
Phase 3: ACE Exploration
    ↓ Semantic search for each issue
    ↓ Codebase exploration (files, patterns, dependencies)
Phase 4: Solution Generation
    ↓ Generate solution with 5-phase task lifecycle
    ↓ Add prevention steps if previous solution failed
Phase 5: Binding Decision
    ↓ Single solution → auto-bind via ccw issue bind
    ↓ Multiple solutions → return for user selection
```

**Failure-Aware Planning**:
```javascript
// Extract failure patterns
const failures = issue.feedback.filter(f => f.type === 'failure' && f.stage === 'execute')

failures.forEach(failure => {
  const { error_type, message, task_id, solution_id } = failure.content

  // Reference in solution.approach
  solution.approach += `\nPrevious solution (${solution_id}) failed with: ${error_type}\n`
  solution.approach += `Root cause: ${analyzeRootCause(failure)}\n`
  solution.approach += `Prevention: ${generatePreventionSteps(failure)}\n`
})

// Add explicit verification task
solution.tasks.push({
  id: `VERIFY-${solution.id}`,
  title: "Verify fix prevents previous failure",
  description: `Test that ${error_type} is resolved`,
  acceptance_criteria: ["Error no longer occurs", "All tests pass"]
})
```

**Output**: Solution JSON with tasks

**File References**:
- `.claude/agents/issue-plan-agent.md` (lines 1-400): Full specification

## Agent 5: context-search-agent

**Purpose**: Multi-angle codebase context discovery

**3-Track Discovery Strategy**:
```
Track 1: Structural Analysis
    ↓ Module discovery, file patterns, symbol inventory
    ↓ Bash tools: find, rg, tree
    ↓ Output: File list, module structure

Track 2: Semantic Analysis
    ↓ Design intent, architectural patterns
    ↓ Gemini CLI analysis
    ↓ Output: Pattern descriptions, design rationale

Track 3: Dependency Mapping
    ↓ Import/export graphs, circular detection
    ↓ Coupling analysis
    ↓ Output: Dependency graph, coupling metrics
```

**Relevance Scoring**:
```javascript
// Score files by relevance to task
const relevanceScore = (file, task) => {
  let score = 0

  // Keyword matching
  if (fileContains(file, task.keywords)) score += 0.3

  // Path matching
  if (pathMatches(file, task.modules)) score += 0.2

  // Import analysis
  if (importsRelatedModules(file, task.modules)) score += 0.3

  // Coupling analysis
  if (isCoupledToRelatedFiles(file, task.modules)) score += 0.2

  return score  // 0.0 - 1.0
}

// Filter by relevance threshold
const relevantFiles = allFiles
  .map(f => ({ file: f, score: relevanceScore(f, task) }))
  .filter(f => f.score >= 0.5)
  .sort((a, b) => b.score - a.score)
```

**Output**: context-package.json with structured context

**File References**:
- `.claude/agents/context-search-agent.md`: Full specification

## Execution Modes

### Mode 1: Synchronous Execution (run_in_background=false)

**Usage**: When results are required before proceeding

```javascript
const result = Task(
  subagent_type="cli-explore-agent",
  run_in_background=false,  // MANDATORY: Wait for results
  description="Explore authentication patterns",
  prompt="..."
)

// Result available immediately
console.log(result)
```

**Characteristics**:
- Blocks until agent completes
- Results available immediately
- Used in sequential workflows
- Typical timeout: 5-10 minutes

**File References**:
- `.claude/commands/workflow/lite-plan.md` (lines 169-170): Synchronous execution

### Mode 2: Asynchronous Execution (run_in_background=true)

**Usage**: When multiple agents can run in parallel

```javascript
const taskIds = []

for (const batch of batches) {
  const taskId = Task(
    subagent_type="issue-plan-agent",
    run_in_background=true,  // Non-blocking
    description=`Plan batch: ${batch.ids.join(', ')}`,
    prompt="..."
  )
  taskIds.push(taskId)
}

// Collect results later
for (const taskId of taskIds) {
  const result = TaskOutput(task_id=taskId, block=true)
  // Process result
}
```

**Characteristics**:
- Non-blocking execution
- Multiple agents run in parallel
- Results collected via TaskOutput
- Used in batch processing
- Typical timeout: 10-30 minutes

**File References**:
- `.claude/commands/issue/plan.md` (lines 206-252): Asynchronous execution

## Error Handling

### Agent Failure Recovery

```javascript
try {
  const result = Task(
    subagent_type="cli-explore-agent",
    run_in_background=false,
    prompt="..."
  )
} catch (error) {
  if (error.type === 'Timeout') {
    console.log("Agent timeout, retrying with reduced scope...")
    // Retry with smaller context
  } else if (error.type === 'ContextOverflow') {
    console.log("Context overflow, using progressive loading...")
    // Use progressive loading strategy
  } else {
    throw error
  }
}
```

### Output Validation

```javascript
// Validate agent output
function validateAgentOutput(output, expectedSchema) {
  // Check required fields
  const requiredFields = Object.keys(expectedSchema.properties)
  for (const field of requiredFields) {
    if (!(field in output)) {
      throw new Error(`Missing required field: ${field}`)
    }
  }

  // Validate field types
  for (const [field, value] of Object.entries(output)) {
    const expectedType = expectedSchema.properties[field].type
    if (typeof value !== expectedType) {
      throw new Error(`Invalid type for ${field}: expected ${expectedType}, got ${typeof value}`)
    }
  }

  return true
}
```

## Integration Points

**Agent Invocation**:
- `/workflow:plan` → action-planning-agent (Phase 4)
- `/workflow:lite-plan` → cli-explore-agent (Phase 1), cli-lite-planning-agent (Phase 3)
- `/issue:plan` → issue-plan-agent (Phase 2)
- `/workflow:tools:context-gather` → context-search-agent (Phase 2)

**Input Sources**:
- Session metadata
- Context packages
- Brainstorm artifacts
- Issue details
- Project context files

**Output Consumers**:
- IMPL_PLAN.md
- Task JSON files
- Solution JSON files
- Context packages

## Code References

**Key Files**:
- `.claude/agents/cli-explore-agent.md` (lines 1-200): Exploration agent
- `.claude/agents/cli-lite-planning-agent.md` (lines 1-650): Planning agent
- `.claude/agents/action-planning-agent.md`: Task generation agent
- `.claude/agents/issue-plan-agent.md` (lines 1-400): Issue planning agent
- `.claude/agents/context-search-agent.md`: Context discovery agent

**Key Patterns**:
- Task invocation (lines 169-170, 206-252)
- Output parsing (lines 221-232)
- Error handling (lines 656-667)
- Progressive loading (lines 229-230)

## Execution Checklist

- [ ] Select appropriate agent type for task
- [ ] Prepare input context (session, artifacts, etc.)
- [ ] Choose execution mode (sync vs async)
- [ ] Invoke agent via Task tool
- [ ] Wait for completion (sync) or collect results (async)
- [ ] Validate agent output against schema
- [ ] Handle errors with retry logic
- [ ] Integrate results into workflow
- [ ] Update session state

## Quality Criteria

✓ Agent type matches task requirements
✓ Input context complete and valid
✓ Execution mode appropriate for workflow
✓ Output validates against schema
✓ Error handling with meaningful messages
✓ Results integrated correctly
✓ Session state updated
