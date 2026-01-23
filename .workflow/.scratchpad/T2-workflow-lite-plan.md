# T2: workflow:lite-plan Implementation - Lightweight 5-Phase Planning

## Overview

`/workflow:lite-plan` is a lightweight interactive planning command that combines code exploration, clarification, and planning into a single workflow. It focuses on planning phases only (no code execution) and delegates execution to `/workflow:lite-execute`.

**Core Principle**: Intelligent complexity-based workflow adaptation with dynamic exploration, clarification, and planning phases.

## Architecture

### 5-Phase Execution Model

```
Phase 1: Task Analysis & Exploration
    ↓ [Complexity Assessment]
    ↓
Phase 2: Clarification (optional, multi-round)
    ↓
Phase 3: Planning (NO CODE EXECUTION)
    ↓ [Complexity-based strategy]
    ↓
Phase 4: Confirmation & Selection
    ↓
Phase 5: Execute to lite-execute
```

**Key Characteristics**:
- **Intelligent exploration**: Auto-detect or force with `--explore` flag
- **Multi-round clarification**: Batch questions (max 4 per round)
- **Complexity-adaptive planning**: Low→Direct Claude; Medium/High→cli-lite-planning-agent
- **In-memory context**: All artifacts passed to lite-execute via executionContext
- **No code execution**: Planning only; execution via lite-execute

### Complexity Assessment

```javascript
complexity = analyzeTaskComplexity(task_description)
// Returns: 'Low' | 'Medium' | 'High'

// Determines:
// - Exploration angle count (1-4)
// - Planning strategy (Direct Claude vs Agent)
// - Executor assignment (Agent vs Codex)
```

## Phase Details

### Phase 1: Task Analysis & Exploration

**Execution Decision Logic**:
```javascript
needsExploration = (
  flags.includes('--explore') ||
  task.mentions_specific_files ||
  task.requires_codebase_context ||
  task.needs_architecture_understanding ||
  task.modifies_existing_code
)
```

**Session Setup**:
```javascript
const taskSlug = task_description.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 40)
const dateStr = getUtc8ISOString().substring(0, 10)  // 2025-11-29
const sessionId = `${taskSlug}-${dateStr}`
const sessionFolder = `.workflow/.lite-plan/${sessionId}`
```

**Complexity-Based Angle Selection**:
```javascript
const ANGLE_PRESETS = {
  architecture: ['architecture', 'dependencies', 'modularity', 'integration-points'],
  security: ['security', 'auth-patterns', 'dataflow', 'validation'],
  performance: ['performance', 'bottlenecks', 'caching', 'data-access'],
  bugfix: ['error-handling', 'dataflow', 'state-management', 'edge-cases'],
  feature: ['patterns', 'integration-points', 'testing', 'dependencies']
}

// Angle count: High=4, Medium=3, Low=1
const selectedAngles = selectAngles(task_description, complexity === 'High' ? 4 : 3)
```

**Parallel Exploration Launch**:
```javascript
// ⚠️ CRITICAL: run_in_background=false (must wait for results)
const explorationTasks = selectedAngles.map((angle, index) =>
  Task(
    subagent_type="cli-explore-agent",
    run_in_background=false,  // MANDATORY
    description=`Explore: ${angle}`,
    prompt=`[exploration prompt with angle-specific context]`
  )
)
```

**Output**:
- `${sessionFolder}/exploration-{angle1}.json`
- `${sessionFolder}/exploration-{angle2}.json`
- `${sessionFolder}/explorations-manifest.json`

**File References**:
- `.claude/commands/workflow/lite-plan.md` (lines 72-282): Phase 1 implementation
- `.claude/agents/cli-explore-agent.md`: Exploration agent specification

### Phase 2: Clarification (Optional, Multi-Round)

**Trigger**: Only if exploration files contain `clarification_needs`

**Aggregation Logic**:
```javascript
// Load all exploration files
const explorations = manifest.explorations.map(exp => ({
  angle: exp.angle,
  data: JSON.parse(Read(exp.path))
}))

// Aggregate clarification needs from all angles
const allClarifications = []
explorations.forEach(exp => {
  if (exp.data.clarification_needs?.length > 0) {
    exp.data.clarification_needs.forEach(need => {
      allClarifications.push({ ...need, source_angle: exp.angle })
    })
  }
})

// Intelligent deduplication by intent
const dedupedClarifications = intelligentMerge(allClarifications)
```

**Multi-Round Execution**:
```javascript
const BATCH_SIZE = 4
const totalRounds = Math.ceil(dedupedClarifications.length / BATCH_SIZE)

for (let i = 0; i < dedupedClarifications.length; i += BATCH_SIZE) {
  const batch = dedupedClarifications.slice(i, i + BATCH_SIZE)
  const currentRound = Math.floor(i / BATCH_SIZE) + 1

  AskUserQuestion({
    questions: batch.map(need => ({
      question: `[${need.source_angle}] ${need.question}`,
      options: need.options.map((opt, idx) => ({
        label: need.recommended === idx ? `${opt} ★` : opt
      }))
    }))
  })
}
```

**Output**: `clarificationContext` (in-memory)

**File References**:
- `.claude/commands/workflow/lite-plan.md` (lines 292-354): Phase 2 implementation

### Phase 3: Planning (NO CODE EXECUTION)

**Strategy Selection** (based on Phase 1 complexity):

**Low Complexity** - Direct Claude Planning:
```javascript
// Step 1: Read schema
const schema = Bash(`cat ~/.claude/workflows/cli-templates/schemas/plan-json-schema.json`)

// Step 2: Read ALL exploration files
const manifest = JSON.parse(Read(`${sessionFolder}/explorations-manifest.json`))
manifest.explorations.forEach(exp => {
  const explorationData = Read(exp.path)
  console.log(`### Exploration: ${exp.angle}\n${explorationData}`)
})

// Step 3: Generate plan following schema
const plan = {
  summary: "...",
  approach: "...",
  tasks: [...],  // Each task: { id, title, scope, depends_on, complexity }
  estimated_time: "...",
  recommended_execution: "Agent",
  complexity: "Low",
  _metadata: { timestamp: getUtc8ISOString(), source: "direct-planning" }
}

// Step 4: Write plan
Write(`${sessionFolder}/plan.json`, JSON.stringify(plan, null, 2))
```

**Medium/High Complexity** - cli-lite-planning-agent:
```javascript
Task(
  subagent_type="cli-lite-planning-agent",
  run_in_background=false,
  description="Generate detailed implementation plan",
  prompt=`
Generate implementation plan and write plan.json.

## Output Schema Reference
Execute: cat ~/.claude/workflows/cli-templates/schemas/plan-json-schema.json

## Project Context (MANDATORY)
1. Read: .workflow/project-tech.json
2. Read: .workflow/project-guidelines.json

## Multi-Angle Exploration Context
${manifest.explorations.map(exp => `### Exploration: ${exp.angle}
Path: ${exp.path}
Read this file for detailed ${exp.angle} analysis.`).join('\n\n')}

## User Clarifications
${JSON.stringify(clarificationContext) || "None"}

## Requirements
Generate plan.json following schema. Key constraints:
- tasks: 2-7 structured tasks (group by feature, NOT by file)
- _metadata.exploration_angles: ${JSON.stringify(manifest.explorations.map(e => e.angle))}
`
)
```

**Output**: `${sessionFolder}/plan.json`

**File References**:
- `.claude/commands/workflow/lite-plan.md` (lines 358-473): Phase 3 implementation
- `.claude/agents/cli-lite-planning-agent.md`: Planning agent specification

### Phase 4: Confirmation & Selection

**Step 4.1: Display Plan**:
```javascript
const plan = JSON.parse(Read(`${sessionFolder}/plan.json`))

console.log(`
## Implementation Plan

**Summary**: ${plan.summary}
**Approach**: ${plan.approach}

**Tasks** (${plan.tasks.length}):
${plan.tasks.map((t, i) => `${i+1}. ${t.title} (${t.file})`).join('\n')}

**Complexity**: ${plan.complexity}
**Estimated Time**: ${plan.estimated_time}
`)
```

**Step 4.2: Collect Confirmation**:
```javascript
AskUserQuestion({
  questions: [
    {
      question: `Confirm plan? (${plan.tasks.length} tasks, ${plan.complexity})`,
      options: [
        { label: "Allow", description: "Proceed as-is" },
        { label: "Modify", description: "Adjust before execution" },
        { label: "Cancel", description: "Abort workflow" }
      ]
    },
    {
      question: "Execution method:",
      options: [
        { label: "Agent", description: "@code-developer agent" },
        { label: "Codex", description: "codex CLI tool" },
        { label: "Auto", description: `Auto: ${plan.complexity === 'Low' ? 'Agent' : 'Codex'}` }
      ]
    },
    {
      question: "Code review after execution?",
      options: [
        { label: "Gemini Review", description: "Gemini CLI review" },
        { label: "Codex Review", description: "Git-aware review" },
        { label: "Agent Review", description: "@code-reviewer agent" },
        { label: "Skip", description: "No review" }
      ]
    }
  ]
})
```

**File References**:
- `.claude/commands/workflow/lite-plan.md` (lines 477-536): Phase 4 implementation

### Phase 5: Execute to lite-execute

**Build executionContext**:
```javascript
const manifest = JSON.parse(Read(`${sessionFolder}/explorations-manifest.json`))
const explorations = {}

manifest.explorations.forEach(exp => {
  if (file_exists(exp.path)) {
    explorations[exp.angle] = JSON.parse(Read(exp.path))
  }
})

const plan = JSON.parse(Read(`${sessionFolder}/plan.json`))

executionContext = {
  planObject: plan,
  explorationsContext: explorations,
  explorationAngles: manifest.explorations.map(e => e.angle),
  explorationManifest: manifest,
  clarificationContext: clarificationContext || null,
  executionMethod: userSelection.execution_method,
  codeReviewTool: userSelection.code_review_tool,
  originalUserInput: task_description,
  executorAssignments: executorAssignments,  // { taskId: { executor, reason } }
  session: {
    id: sessionId,
    folder: sessionFolder,
    artifacts: {
      explorations: manifest.explorations.map(exp => ({
        angle: exp.angle,
        path: exp.path
      })),
      explorations_manifest: `${sessionFolder}/explorations-manifest.json`,
      plan: `${sessionFolder}/plan.json`
    }
  }
}
```

**Execute**:
```javascript
SlashCommand(command="/workflow:lite-execute --in-memory")
```

**File References**:
- `.claude/commands/workflow/lite-plan.md` (lines 540-591): Phase 5 implementation

## Session Folder Structure

```
.workflow/.lite-plan/{task-slug}-{YYYY-MM-DD}/
├── exploration-{angle1}.json      # Exploration angle 1
├── exploration-{angle2}.json      # Exploration angle 2
├── exploration-{angle3}.json      # Exploration angle 3 (if applicable)
├── exploration-{angle4}.json      # Exploration angle 4 (if applicable)
├── explorations-manifest.json     # Exploration index
└── plan.json                      # Implementation plan
```

## Error Handling

| Error | Resolution |
|-------|-----------|
| Exploration agent failure | Skip exploration, continue with task description only |
| Planning agent failure | Fallback to direct planning by Claude |
| Clarification timeout | Use exploration findings as-is |
| Confirmation timeout | Save context, display resume instructions |
| Modify loop > 3 times | Suggest breaking task or using /workflow:plan |

## Integration Points

**Called Commands**:
- `cli-explore-agent` (Phase 1, parallel)
- `cli-lite-planning-agent` (Phase 3, if Medium/High complexity)
- `/workflow:lite-execute --in-memory` (Phase 5)

**Input Sources**:
- User task description
- Project context files (`.workflow/project-tech.json`, `.workflow/project-guidelines.json`)
- Exploration schema (`.claude/workflows/cli-templates/schemas/explore-json-schema.json`)
- Planning schema (`.claude/workflows/cli-templates/schemas/plan-json-schema.json`)

**Output Consumers**:
- `/workflow:lite-execute` (receives executionContext)

## Code References

**Key Files**:
- `.claude/commands/workflow/lite-plan.md` (lines 1-624): Full command specification
- `.claude/agents/cli-explore-agent.md`: Exploration agent
- `.claude/agents/cli-lite-planning-agent.md`: Planning agent

**Key Patterns**:
- Complexity assessment (lines 106-146)
- Parallel exploration launch (lines 159-243)
- Multi-round clarification (lines 296-351)
- Complexity-based planning strategy (lines 358-473)
- executionContext building (lines 544-584)

## Execution Checklist

- [ ] Parse input (description or .md file)
- [ ] Assess task complexity (Low/Medium/High)
- [ ] Determine exploration need (auto-detect or --explore flag)
- [ ] Launch parallel explorations (if needed)
- [ ] Aggregate and deduplicate clarification needs
- [ ] Execute multi-round clarification (if needed)
- [ ] Select planning strategy based on complexity
- [ ] Generate plan.json
- [ ] Display plan and collect confirmation
- [ ] Build executionContext with all artifacts
- [ ] Execute /workflow:lite-execute --in-memory

## Quality Criteria

✓ Complexity assessment accurate
✓ Exploration angles relevant to task type
✓ Clarification questions deduplicated and batched
✓ Planning strategy matches complexity level
✓ plan.json follows schema exactly
✓ executionContext contains all required artifacts
✓ No code execution in planning phases
✓ All exploration files preserved for lite-execute
