# Phase Decomposition Rules Specification

> Defines the rules, patterns, and constraints for decomposing workflow processes into executable phases.

---

## When to Use

| Phase | Usage | Section |
|-------|-------|---------|
| Phase 3: Phase Decomposition | Apply decomposition rules | [Decomposition Rules](#decomposition-rules) |
| Phase 3: Phase Decomposition | Select phase patterns | [Phase Patterns](#phase-patterns) |
| Phase 3: Phase Decomposition | Validate phase structure | [Validation Rules](#validation-rules) |
| Phase 4: Artifact Generation | Reference phase conventions | [Naming Conventions](#naming-conventions) |

---

## Core Principles

### 1. Single Responsibility

Each phase should have ONE clear objective. If a phase does multiple unrelated things, split it.

**Good**:
```
Phase 1: Analysis     -> Understand the problem
Phase 2: Planning     -> Create execution plan
```

**Bad**:
```
Phase 1: Analysis & Planning -> Understand and plan (too broad)
```

### 2. Clear Boundaries

Phase boundaries should be at natural transition points where:
- Output format changes (JSON -> Markdown)
- Actor changes (System -> User -> System)
- Context changes (Read-only -> Write)

### 3. Measurable Outputs

Every phase must produce a verifiable artifact or state change.

**Good**: `Phase outputs: analysis-result.json`
**Bad**: `Phase outputs: understanding` (not verifiable)

### 4. Minimal Dependencies

Phases should be as independent as possible. Only create dependencies when:
- Phase B requires Phase A's output as input
- Phase B cannot start until Phase A completes

---

## Decomposition Rules

### Rule 1: Phase Count Guidelines

| Workflow Complexity | Recommended Phases | Rationale |
|---------------------|-------------------|-----------|
| Simple (1-3 steps) | 2-3 phases | Avoid over-engineering |
| Standard (4-7 steps) | 4-5 phases | Follow lite-plan pattern |
| Complex (8+ steps) | 5-7 phases | Group related steps |

**Maximum**: 7 phases (cognitive limit for workflow comprehension)

### Rule 2: Step-to-Phase Mapping

```javascript
const STEPS_PER_PHASE = {
  min: 2,    // Minimum steps per phase (avoid trivial phases)
  ideal: 3,  // Ideal steps per phase
  max: 5     // Maximum steps per phase (avoid overloaded phases)
};

function validateStepCount(phase) {
  const count = phase.steps.length;
  if (count < STEPS_PER_PHASE.min) return 'merge_with_adjacent';
  if (count > STEPS_PER_PHASE.max) return 'split_phase';
  return 'valid';
}
```

### Rule 3: Phase Duration Limits

| Duration | Action |
|----------|--------|
| < 1 min | Consider merging with adjacent phase |
| 1-15 min | Ideal phase duration |
| > 15 min | Consider splitting into sub-phases |

### Rule 4: User Interaction Isolation

User interaction steps should be isolated in dedicated phases:

```
Phase 2: Clarification    -> AskUserQuestion (isolated)
Phase 4: Confirmation     -> AskUserQuestion (isolated)
```

**Rationale**: Mixing user interaction with automated processing creates unpredictable execution times.

### Rule 5: Tool Affinity Grouping

Group steps that use similar tools into the same phase:

```javascript
const TOOL_GROUPS = {
  read_heavy: ['Read', 'Glob', 'Grep'],
  write_heavy: ['Write', 'Edit'],
  execution: ['Bash', 'Task'],
  interaction: ['AskUserQuestion']
};

function groupByToolAffinity(steps) {
  // Steps using similar tools should be in same phase
  return steps.reduce((groups, step) => {
    const toolGroup = identifyToolGroup(step.tools);
    groups[toolGroup] = groups[toolGroup] || [];
    groups[toolGroup].push(step);
    return groups;
  }, {});
}
```

---

## Phase Patterns

### Pattern 1: Analysis-First (Default)

For workflows that need to understand before acting.

```
P1: Analysis      -> Gather context, understand requirements
P2: Planning      -> Create execution plan
P3: Execution     -> Execute the plan
P4: Validation    -> Verify results
```

**Use when**: Task requires codebase understanding, requirements are complex.

### Pattern 2: Diagnosis-Fix (Bug Fixing)

For workflows that fix issues.

```
P1: Diagnosis     -> Identify root cause
P2: Analysis      -> Analyze impact and dependencies
P3: Fix Planning  -> Plan the fix
P4: Execution     -> Apply the fix
P5: Validation    -> Verify fix works
```

**Use when**: Workflow type is "fix", input describes a problem.

### Pattern 3: Collection-Report (Analysis)

For workflows that analyze and report.

```
P1: Collection    -> Gather data
P2: Analysis      -> Process data
P3: Synthesis     -> Combine findings
P4: Report        -> Generate output
```

**Use when**: Workflow type is "analysis", output is a report.

### Pattern 4: Input-Generate (Generation)

For workflows that create artifacts.

```
P1: Input         -> Collect requirements
P2: Template      -> Select/prepare templates
P3: Generation    -> Generate artifacts
P4: Validation    -> Verify output quality
P5: Output        -> Deliver results
```

**Use when**: Workflow type is "generation", output is code/files.

### Pattern 5: Interactive-Loop (User-Driven)

For workflows with heavy user interaction.

```
P1: Input         -> Initial user input
P2: Processing    -> Process input
P3: Review        -> Present results to user
P4: Iteration     -> User feedback loop
P5: Finalization  -> Final output
```

**Use when**: Multiple user checkpoints required.

---

## Phase Type Definitions

### Standard Phase Types

| Type | Purpose | Typical Tools | User Input |
|------|---------|---------------|------------|
| Analysis | Understand context | Read, Bash, Grep | No |
| Clarification | Gather missing info | AskUserQuestion | Yes |
| Planning | Create execution plan | Read, Write | No |
| Confirmation | User approval | AskUserQuestion | Yes |
| Execution | Execute plan | Task, Bash, Write | No |
| Validation | Verify results | Bash, Read | No |
| Diagnosis | Identify issues | Read, Bash, Grep | No |
| Collection | Gather data | Read, Glob, Bash | No |
| Synthesis | Combine findings | Read | No |
| Report | Generate output | Write | No |
| Input | Collect user input | AskUserQuestion, Read | Yes |
| Generation | Create artifacts | Write, Task | No |
| Output | Deliver results | Write | No |

### Phase Type Selection Rules

```javascript
function selectPhaseType(step, context) {
  const stepText = step.description.toLowerCase();

  // User interaction detection
  if (/ask|prompt|confirm|approve|select|choose/.test(stepText)) {
    return stepText.includes('confirm') ? 'Confirmation' : 'Clarification';
  }

  // Analysis detection
  if (/analyze|understand|examine|review|inspect|scan/.test(stepText)) {
    return 'Analysis';
  }

  // Planning detection
  if (/plan|design|architect|structure|organize/.test(stepText)) {
    return 'Planning';
  }

  // Execution detection
  if (/execute|run|perform|implement|apply|do/.test(stepText)) {
    return 'Execution';
  }

  // Validation detection
  if (/validate|verify|check|test|ensure|confirm/.test(stepText)) {
    return 'Validation';
  }

  // Collection detection
  if (/collect|gather|fetch|retrieve|load|read/.test(stepText)) {
    return 'Collection';
  }

  // Generation detection
  if (/generate|create|produce|build|make|write/.test(stepText)) {
    return 'Generation';
  }

  // Report detection
  if (/report|summarize|document|output|present/.test(stepText)) {
    return 'Report';
  }

  // Default based on workflow type
  return context.workflowType === 'fix' ? 'Diagnosis' : 'Analysis';
}
```

---

## Dependency Rules

### Rule 1: Sequential by Default

Phases are sequential unless explicitly marked parallel.

```javascript
const defaultDependency = (phaseIndex) => {
  return phaseIndex > 0 ? [`P${phaseIndex}`] : [];
};
```

### Rule 2: Data Flow Dependencies

A phase depends on another if it requires that phase's output.

```javascript
function detectDataDependency(phaseA, phaseB) {
  const aOutputs = phaseA.output.artifacts;
  const bInputs = phaseB.input.required;

  return aOutputs.some(out =>
    bInputs.some(inp => inp.includes(out.replace('.json', '')))
  );
}
```

### Rule 3: No Circular Dependencies

```javascript
function validateNoCycles(phases) {
  const visited = new Set();
  const recursionStack = new Set();

  function hasCycle(phaseId) {
    if (recursionStack.has(phaseId)) return true;
    if (visited.has(phaseId)) return false;

    visited.add(phaseId);
    recursionStack.add(phaseId);

    const phase = phases.find(p => p.id === phaseId);
    for (const dep of phase.dependencies.phases) {
      if (hasCycle(dep)) return true;
    }

    recursionStack.delete(phaseId);
    return false;
  }

  return phases.every(p => !hasCycle(p.id));
}
```

### Rule 4: Minimize Cross-Phase Dependencies

Prefer linear dependencies over complex graphs.

**Good**:
```
P1 -> P2 -> P3 -> P4
```

**Avoid**:
```
P1 -> P2 -> P4
  \-> P3 -/
```

---

## Input/Output Rules

### Rule 1: Explicit Artifact Naming

Every phase output must have a named artifact.

```javascript
const ARTIFACT_NAMING = {
  pattern: '{phase-name}-result.{format}',
  formats: {
    json: '.json',
    markdown: '.md',
    code: '.ts|.js|.py'
  }
};

// Examples:
// analysis-result.json
// planning-result.json
// review-report.md
```

### Rule 2: Input Source Declaration

Every required input must declare its source.

```javascript
const inputSources = {
  user: 'User provides directly',
  previousPhase: 'From previous phase output',
  config: 'From workflow configuration',
  external: 'From external system/file'
};
```

### Rule 3: Output Format Consistency

Within a workflow, prefer consistent output formats.

| Workflow Type | Preferred Format |
|---------------|------------------|
| Planning | JSON (structured) |
| Fix | JSON (structured) |
| Analysis | Markdown (readable) |
| Generation | Code (executable) |

---

## Validation Rules

### Rule 1: Phase Completeness

Every phase must have:
- [ ] Unique ID (P1, P2, ...)
- [ ] Descriptive name
- [ ] Clear objective
- [ ] Defined inputs
- [ ] Defined outputs
- [ ] Required tools
- [ ] Execution steps
- [ ] Success criteria

### Rule 2: Dependency Validity

```javascript
function validateDependencies(phases) {
  const errors = [];
  const phaseIds = new Set(phases.map(p => p.id));

  phases.forEach(phase => {
    phase.dependencies.phases.forEach(depId => {
      if (!phaseIds.has(depId)) {
        errors.push(`Phase ${phase.id} depends on non-existent phase: ${depId}`);
      }
      if (depId === phase.id) {
        errors.push(`Phase ${phase.id} has circular self-dependency`);
      }
    });
  });

  return errors;
}
```

### Rule 3: Tool Availability

```javascript
const VALID_TOOLS = [
  'Read', 'Write', 'Edit',
  'Bash', 'Glob', 'Grep',
  'Task', 'AskUserQuestion', 'SlashCommand'
];

function validateTools(phase) {
  const invalidTools = phase.tools.required.filter(
    tool => !VALID_TOOLS.includes(tool)
  );
  return invalidTools.length === 0;
}
```

### Rule 4: Step Actionability

Every step must be actionable (start with a verb).

```javascript
const ACTION_VERBS = [
  'Parse', 'Read', 'Write', 'Analyze', 'Generate', 'Create',
  'Validate', 'Check', 'Execute', 'Run', 'Collect', 'Gather',
  'Identify', 'Extract', 'Transform', 'Load', 'Save', 'Update',
  'Delete', 'Merge', 'Split', 'Filter', 'Sort', 'Map', 'Reduce'
];

function validateStepActionability(step) {
  const firstWord = step.description.split(' ')[0];
  return ACTION_VERBS.some(verb =>
    firstWord.toLowerCase() === verb.toLowerCase()
  );
}
```

---

## Naming Conventions

### Phase IDs

```
Format: P{number}
Examples: P1, P2, P3, P4, P5
```

### Phase Names

```
Format: PascalCase, single word or hyphenated
Examples: Analysis, Fix-Planning, Code-Review
```

### Artifact Names

```
Format: {phase-name}-{type}.{extension}
Examples:
  - analysis-result.json
  - planning-context.md
  - fix-plan.json
  - review-report.md
```

### Step Descriptions

```
Format: {Verb} {object} {qualifier}
Examples:
  - Parse user input
  - Analyze code structure
  - Generate implementation plan
  - Validate output quality
```

---

## Error Handling

### Decomposition Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Too few phases | Over-merged steps | Split phases at natural boundaries |
| Too many phases | Over-split steps | Merge related phases |
| Orphan steps | Steps not mapped | Assign to appropriate phase |
| Circular dependency | Invalid phase order | Restructure dependencies |
| Missing output | Phase has no artifact | Define output artifact |
| Invalid tool | Unknown tool referenced | Use valid tool from list |

### Recovery Strategies

```javascript
function recoverFromDecompositionError(error, phases) {
  switch (error.type) {
    case 'too_few_phases':
      return splitLargestPhase(phases);

    case 'too_many_phases':
      return mergeSmallestPhases(phases);

    case 'orphan_steps':
      return assignOrphanSteps(phases, error.steps);

    case 'circular_dependency':
      return breakCycle(phases, error.cycle);

    default:
      return phases;
  }
}
```

---

## Quality Metrics

### Phase Quality Score

```javascript
function calculatePhaseQuality(phase) {
  const scores = {
    hasObjective: phase.objective ? 25 : 0,
    hasInputOutput: (phase.input && phase.output) ? 25 : 0,
    hasTools: phase.tools?.required?.length > 0 ? 25 : 0,
    hasValidation: phase.validation?.successCriteria?.length > 0 ? 25 : 0
  };

  return Object.values(scores).reduce((a, b) => a + b, 0);
}
```

### Decomposition Quality Score

```javascript
function calculateDecompositionQuality(decomposition) {
  const phaseScores = decomposition.phases.map(calculatePhaseQuality);
  const avgPhaseScore = phaseScores.reduce((a, b) => a + b, 0) / phaseScores.length;

  const structureScore = {
    phaseCountValid: decomposition.totalPhases >= 2 && decomposition.totalPhases <= 7 ? 25 : 0,
    noCycles: validateNoCycles(decomposition.phases) ? 25 : 0,
    allStepsMapped: decomposition.metadata.orphanSteps === 0 ? 25 : 0,
    consistentNaming: validateNamingConsistency(decomposition.phases) ? 25 : 0
  };

  const structureTotal = Object.values(structureScore).reduce((a, b) => a + b, 0);

  return {
    phaseQuality: avgPhaseScore,
    structureQuality: structureTotal,
    overall: (avgPhaseScore + structureTotal) / 2
  };
}
```

---

## Examples

### Example 1: Simple Workflow (3 Phases)

**Input**: "Create a workflow that reads files, processes them, and outputs a report"

**Decomposition**:
```json
{
  "phases": [
    { "id": "P1", "name": "Collection", "steps": ["Read input files", "Parse file contents"] },
    { "id": "P2", "name": "Processing", "steps": ["Analyze content", "Extract insights"] },
    { "id": "P3", "name": "Report", "steps": ["Generate report", "Write output file"] }
  ]
}
```

### Example 2: Standard Workflow (5 Phases)

**Input**: "Create a code review workflow with user confirmation"

**Decomposition**:
```json
{
  "phases": [
    { "id": "P1", "name": "Collection", "steps": ["Identify files", "Load code"] },
    { "id": "P2", "name": "Analysis", "steps": ["Apply rules", "Detect issues"] },
    { "id": "P3", "name": "Synthesis", "steps": ["Prioritize issues", "Generate recommendations"] },
    { "id": "P4", "name": "Confirmation", "steps": ["Present findings", "Get user approval"] },
    { "id": "P5", "name": "Report", "steps": ["Generate report", "Output results"] }
  ]
}
```

### Example 3: Complex Workflow (7 Phases)

**Input**: "Create a bug fix workflow with diagnosis, planning, and validation"

**Decomposition**:
```json
{
  "phases": [
    { "id": "P1", "name": "Diagnosis", "steps": ["Analyze error", "Trace execution"] },
    { "id": "P2", "name": "Analysis", "steps": ["Identify root cause", "Map dependencies"] },
    { "id": "P3", "name": "Clarification", "steps": ["Ask clarifying questions"] },
    { "id": "P4", "name": "Planning", "steps": ["Design fix", "Plan implementation"] },
    { "id": "P5", "name": "Confirmation", "steps": ["Present plan", "Get approval"] },
    { "id": "P6", "name": "Execution", "steps": ["Apply fix", "Update code"] },
    { "id": "P7", "name": "Validation", "steps": ["Run tests", "Verify fix"] }
  ]
}
```

---

*Specification Version: 1.0*
*Based on: lite-plan 5-phase structure, lite-fix diagnosis pattern*
