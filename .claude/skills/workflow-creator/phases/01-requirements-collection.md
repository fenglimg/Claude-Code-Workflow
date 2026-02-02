# Phase 1: Requirements Collection

> Interactive requirements gathering through structured questions to capture complete workflow specifications.

---

## When to Use

| Context | Usage |
|---------|-------|
| Phase 1 Entry | Execute after Phase 0 (Specification Study) completes |
| Input | User's initial workflow description (natural language or structured) |
| Output | `workflow-config.json` with complete workflow requirements |

---

## Objective

Collect comprehensive workflow requirements through interactive prompts, producing a structured configuration that drives all subsequent phases.

---

## Question Set Design

### Question 1: Workflow Identity

```javascript
const identityQuestions = await AskUserQuestion({
  questions: [
    {
      question: "What is the workflow name? (kebab-case, e.g., 'code-review', 'doc-generator')",
      header: "Name",
      options: [
        { label: "Custom", description: "Enter a custom workflow name" }
      ]
    },
    {
      question: "What is the primary purpose of this workflow?",
      header: "Purpose",
      options: [
        { label: "Planning", description: "Task decomposition, architecture design, roadmap creation" },
        { label: "Fix", description: "Bug fixing, error resolution, issue remediation" },
        { label: "Analysis", description: "Code review, pattern detection, quality assessment" },
        { label: "Generation", description: "Code generation, documentation, artifact creation" }
      ]
    }
  ]
});
```

**Rationale**: Workflow type determines execution patterns, agent selection, and output structure.

---

### Question 2: Process Description

```javascript
const processQuestions = await AskUserQuestion({
  questions: [
    {
      question: "Describe the workflow process in detail. What steps should it perform?",
      header: "Process",
      options: [
        { label: "Natural Language", description: "Describe in plain text (will be parsed into phases)" },
        { label: "Structured Steps", description: "Provide numbered steps (1. First... 2. Then...)" }
      ]
    }
  ]
});

// Follow-up for detailed process capture
const processDetail = await AskUserQuestion({
  questions: [
    {
      question: "Please provide the process description:",
      header: "Steps",
      options: [
        { label: "Continue", description: "I will provide the process description in my next message" }
      ]
    }
  ]
});
```

**Rationale**: Process description is the core input for Phase 2 (Phase Decomposition).

---

### Question 3: Execution Configuration

```javascript
const executionQuestions = await AskUserQuestion({
  questions: [
    {
      question: "How many main phases should this workflow have?",
      header: "Phases",
      options: [
        { label: "2-3 phases", description: "Simple workflow (quick execution)" },
        { label: "4-5 phases", description: "Standard workflow (balanced complexity)" },
        { label: "6+ phases", description: "Complex workflow (comprehensive coverage)" }
      ]
    },
    {
      question: "What execution mode should this workflow use?",
      header: "Mode",
      options: [
        { label: "Sequential", description: "Fixed-order phases with strong dependencies" },
        { label: "Autonomous", description: "Stateless phases that can run independently" },
        { label: "Hybrid", description: "Mix of sequential and autonomous phases" }
      ]
    }
  ]
});
```

**Rationale**: Execution mode determines phase orchestration and dependency management.

---

### Question 4: Tool Dependencies

```javascript
const toolQuestions = await AskUserQuestion({
  questions: [
    {
      question: "Which tools will this workflow require? (select all that apply)",
      header: "Tools",
      multiSelect: true,
      options: [
        { label: "Read/Write", description: "File operations (Read, Write, Edit)" },
        { label: "Bash", description: "Shell command execution" },
        { label: "Task", description: "Agent delegation (subagent invocation)" },
        { label: "AskUserQuestion", description: "Interactive user prompts" }
      ]
    }
  ]
});
```

**Rationale**: Tool selection affects allowed-tools in command front matter and agent capabilities.

---

### Question 5: Output Specification

```javascript
const outputQuestions = await AskUserQuestion({
  questions: [
    {
      question: "What artifacts should this workflow produce?",
      header: "Output",
      options: [
        { label: "Single file", description: "One main output file (report, plan, etc.)" },
        { label: "Multiple files", description: "Several related files in a directory" },
        { label: "Code changes", description: "Modifications to existing codebase" },
        { label: "Mixed", description: "Combination of files and code changes" }
      ]
    },
    {
      question: "What output format is preferred?",
      header: "Format",
      options: [
        { label: "Markdown", description: "Human-readable documentation (.md)" },
        { label: "JSON", description: "Structured data (.json)" },
        { label: "Code", description: "Source code files (.ts, .js, .py, etc.)" },
        { label: "Mixed", description: "Multiple formats based on artifact type" }
      ]
    }
  ]
});
```

**Rationale**: Output specification drives template selection and validation criteria.

---

### Question 6: Trigger Configuration

```javascript
const triggerQuestions = await AskUserQuestion({
  questions: [
    {
      question: "What phrases should trigger this workflow? (provide 2-4 trigger phrases)",
      header: "Triggers",
      options: [
        { label: "Auto-generate", description: "Generate triggers from workflow name and purpose" },
        { label: "Custom", description: "I will provide custom trigger phrases" }
      ]
    }
  ]
});
```

**Rationale**: Trigger phrases enable natural language invocation of the workflow.

---

## Execution Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Phase 1: Requirements Collection                      │
│                                                                          │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                 │
│  │  Q1: Identity │──>│  Q2: Process │──>│  Q3: Execution│                │
│  │  Name + Type  │   │  Description │   │  Phases + Mode│                │
│  └──────────────┘   └──────────────┘   └──────────────┘                 │
│         │                  │                  │                          │
│         v                  v                  v                          │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                 │
│  │  Q4: Tools   │──>│  Q5: Output  │──>│  Q6: Triggers │                │
│  │  Dependencies│   │  Artifacts   │   │  Invocation   │                │
│  └──────────────┘   └──────────────┘   └──────────────┘                 │
│                              │                                           │
│                              v                                           │
│                    ┌──────────────────┐                                  │
│                    │ workflow-config  │                                  │
│                    │     .json        │                                  │
│                    └──────────────────┘                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Output Schema: workflow-config.json

```json
{
  "$schema": "workflow-config.schema.json",
  "name": "string (kebab-case)",
  "displayName": "string (human-readable)",
  "description": "string (50-150 chars)",
  "type": "planning | fix | analysis | generation",
  "process": {
    "description": "string (natural language process description)",
    "inputFormat": "natural | structured",
    "steps": ["string (if structured input provided)"]
  },
  "execution": {
    "phaseCount": "number (2-10)",
    "mode": "sequential | autonomous | hybrid",
    "estimatedDuration": "string (e.g., '5-10 min')"
  },
  "tools": {
    "required": ["string (tool names)"],
    "optional": ["string (tool names)"]
  },
  "output": {
    "type": "single | multiple | code | mixed",
    "format": "markdown | json | code | mixed",
    "artifacts": [
      {
        "name": "string",
        "description": "string",
        "path": "string (relative path pattern)"
      }
    ]
  },
  "triggers": ["string (trigger phrases)"],
  "metadata": {
    "createdAt": "ISO 8601 timestamp",
    "version": "1.0.0"
  }
}
```

---

## Workflow Type Characteristics

### Planning Type

```javascript
const planningDefaults = {
  execution: {
    mode: "sequential",
    phaseCount: 4,
    phases: ["Analysis", "Decomposition", "Planning", "Output"]
  },
  tools: {
    required: ["Read", "Write", "Task"],
    optional: ["AskUserQuestion", "Bash"]
  },
  output: {
    type: "multiple",
    format: "markdown",
    artifacts: ["plan.md", "tasks.json", "timeline.md"]
  }
};
```

### Fix Type

```javascript
const fixDefaults = {
  execution: {
    mode: "sequential",
    phaseCount: 5,
    phases: ["Diagnosis", "Analysis", "Fix", "Validation", "Report"]
  },
  tools: {
    required: ["Read", "Write", "Bash", "Task"],
    optional: ["AskUserQuestion"]
  },
  output: {
    type: "code",
    format: "mixed",
    artifacts: ["fix-report.md", "modified files"]
  }
};
```

### Analysis Type

```javascript
const analysisDefaults = {
  execution: {
    mode: "autonomous",
    phaseCount: 3,
    phases: ["Collection", "Analysis", "Report"]
  },
  tools: {
    required: ["Read", "Bash"],
    optional: ["Task", "Write"]
  },
  output: {
    type: "single",
    format: "markdown",
    artifacts: ["analysis-report.md"]
  }
};
```

### Generation Type

```javascript
const generationDefaults = {
  execution: {
    mode: "sequential",
    phaseCount: 4,
    phases: ["Input", "Template", "Generate", "Validate"]
  },
  tools: {
    required: ["Read", "Write"],
    optional: ["Task", "Bash", "AskUserQuestion"]
  },
  output: {
    type: "multiple",
    format: "code",
    artifacts: ["generated files", "manifest.json"]
  }
};
```

---

## Implementation Protocol

```javascript
async function collectRequirements(workDir) {
  // Step 1: Collect identity (Q1)
  const identity = await collectIdentity();
  console.log(`Workflow: ${identity.name} (${identity.type})`);

  // Step 2: Collect process description (Q2)
  const process = await collectProcess();
  console.log(`Process: ${process.inputFormat} format, ${process.steps?.length || 'N/A'} steps`);

  // Step 3: Collect execution config (Q3)
  const execution = await collectExecution(identity.type);
  console.log(`Execution: ${execution.mode}, ${execution.phaseCount} phases`);

  // Step 4: Collect tool dependencies (Q4)
  const tools = await collectTools(identity.type);
  console.log(`Tools: ${tools.required.join(', ')}`);

  // Step 5: Collect output specification (Q5)
  const output = await collectOutput(identity.type);
  console.log(`Output: ${output.type} (${output.format})`);

  // Step 6: Collect triggers (Q6)
  const triggers = await collectTriggers(identity.name, identity.type);
  console.log(`Triggers: ${triggers.join(', ')}`);

  // Step 7: Assemble and write config
  const config = {
    name: identity.name,
    displayName: humanize(identity.name),
    description: generateDescription(identity.name, identity.type),
    type: identity.type.toLowerCase(),
    process: process,
    execution: execution,
    tools: tools,
    output: output,
    triggers: triggers,
    metadata: {
      createdAt: new Date().toISOString(),
      version: "1.0.0"
    }
  };

  Write(`${workDir}/workflow-config.json`, JSON.stringify(config, null, 2));
  return config;
}

// Helper: Generate description from name and type
function generateDescription(name, type) {
  const templates = {
    Planning: `Plan and decompose ${humanize(name)} tasks with structured output`,
    Fix: `Diagnose and fix ${humanize(name)} issues with validation`,
    Analysis: `Analyze ${humanize(name)} patterns and generate reports`,
    Generation: `Generate ${humanize(name)} artifacts from templates`
  };
  return templates[type] || `${humanize(name)} workflow for ${type.toLowerCase()} tasks`;
}

// Helper: Generate trigger phrases
function generateTriggers(name, type) {
  const base = [name, name.replace(/-/g, ' ')];
  const typeVerbs = {
    Planning: ['plan', 'decompose', 'break down'],
    Fix: ['fix', 'repair', 'resolve'],
    Analysis: ['analyze', 'review', 'inspect'],
    Generation: ['generate', 'create', 'build']
  };
  return [...base, ...typeVerbs[type].map(v => `${v} ${humanize(name)}`)];
}

// Helper: Convert kebab-case to human-readable
function humanize(str) {
  return str.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
```

---

## Validation Checklist

### Required Fields

- [ ] `name`: Valid kebab-case identifier
- [ ] `type`: One of planning, fix, analysis, generation
- [ ] `process.description`: Non-empty process description
- [ ] `execution.mode`: Valid execution mode
- [ ] `execution.phaseCount`: Number between 2-10
- [ ] `tools.required`: At least one required tool
- [ ] `output.type`: Valid output type
- [ ] `triggers`: At least 2 trigger phrases

### Type-Specific Validation

- [ ] Planning: Has decomposition-related phases
- [ ] Fix: Has diagnosis and validation phases
- [ ] Analysis: Has collection and report phases
- [ ] Generation: Has template and generate phases

---

## Error Handling

| Error | Resolution |
|-------|------------|
| Invalid workflow name | Prompt for valid kebab-case name |
| Missing process description | Re-prompt with examples |
| Incompatible tool selection | Suggest required tools for workflow type |
| Invalid phase count | Adjust to type-appropriate default |

---

## Output Example

```json
{
  "name": "code-review",
  "displayName": "Code Review",
  "description": "Analyze code review patterns and generate reports",
  "type": "analysis",
  "process": {
    "description": "Review code changes, identify issues, suggest improvements, generate report",
    "inputFormat": "natural",
    "steps": null
  },
  "execution": {
    "phaseCount": 4,
    "mode": "sequential",
    "estimatedDuration": "5-10 min"
  },
  "tools": {
    "required": ["Read", "Bash", "Write"],
    "optional": ["Task", "AskUserQuestion"]
  },
  "output": {
    "type": "single",
    "format": "markdown",
    "artifacts": [
      {
        "name": "review-report.md",
        "description": "Code review findings and recommendations",
        "path": ".workflow/.scratchpad/{session}/review-report.md"
      }
    ]
  },
  "triggers": ["code-review", "code review", "review code", "analyze code"],
  "metadata": {
    "createdAt": "2026-02-02T14:00:00.000Z",
    "version": "1.0.0"
  }
}
```

---

## Next Phase

After Phase 1 completes, proceed to **Phase 2: Phase Decomposition** with:
- Input: `workflow-config.json`
- Action: Parse process description into discrete phases
- Output: `phase-breakdown.json`

---

*Phase Version: 1.0*
*Based on: lite-skill-generator Phase 2 pattern*
