---
name: workflow-creator
description: Auto-generate Claude-Code-Workflow slash commands, Agent definitions, JSON Schema, and closed-loop workflows from user-described processes. Use for workflow scaffolding, command creation, or building new CCW workflows. Triggers on "create workflow", "new workflow", "workflow creator", "generate command".
allowed-tools: Task, AskUserQuestion, Read, Bash, Glob, Grep, Write
---

# Workflow Creator

Meta-skill for creating complete Claude-Code-Workflow artifacts from user-described processes. Generates slash commands, Agent definitions, JSON Schema, and closed-loop workflows.

## Architecture Overview

```
+=========================================================================+
|                         Workflow Creator                                 |
|                                                                          |
|  Input: User Process Description (natural language / structured)        |
|                              |                                           |
|  +---------------------------v-------------------------------------------+
|  |  Phase 0-6: Sequential Pipeline                                      |
|  |                                                                       |
|  |  +------+   +------+   +------+   +------+   +------+   +------+     |
|  |  |  P0  |-->|  P1  |-->|  P2  |-->|  P3  |-->|  P4  |-->|  P5  |     |
|  |  | Spec |   | Flow |   |Phase |   |Simil |   | Gen  |   |Schema|     |
|  |  | Study|   | Input|   |Break |   | Anal |   |Artif |   | Gen  |     |
|  |  +------+   +------+   +------+   +------+   +------+   +------+     |
|  |                                                   |                   |
|  |                                       +-----------v-----------+       |
|  |                                       |        P6             |       |
|  |                                       |   Validation &        |       |
|  |                                       |   Integration         |       |
|  |                                       +-----------------------+       |
|  +-----------------------------------------------------------------------+
|                              |                                           |
|  Output: Complete Workflow Package                                       |
|    - .claude/commands/{name}.md        (Slash Command)                  |
|    - .claude/agents/{name}-agent.md    (Agent Definition)               |
|    - schemas/{name}.schema.json        (JSON Schema)                    |
|    - workflow.json                     (Workflow Definition)            |
|                                                                          |
+=========================================================================+
```

## Key Design Principles

1. **Sequential Execution**: Fixed-order phases with strong dependencies between stages
2. **Process-First Design**: Start from user's process description, not technical artifacts
3. **Similar Flow Analysis**: Learn from existing workflows to maintain consistency
4. **Complete Package Generation**: Produce all artifacts needed for a working workflow
5. **Closed-Loop Validation**: Verify generated artifacts work together correctly

## Execution Modes

### Mode: Sequential (Fixed Order)

This skill uses sequential execution because:
- Workflow creation is a linear process (understand -> decompose -> generate -> validate)
- Strong dependencies exist between phases (Phase 3 needs Phase 2 output)
- Output structure is fixed (command + agent + schema + workflow.json)

```
Phase 0 -> Phase 1 -> Phase 2 -> Phase 3 -> Phase 4 -> Phase 5 -> Phase 6
  |          |          |          |          |          |          |
Spec      Flow       Phase      Similar    Generate   Schema    Validate
Study     Input      Break      Analysis   Artifacts  Generate  & Integrate
```

## 7-Phase Execution Flow

### Phase 0: Specification Study (Mandatory)

Read and internalize design specifications before any generation.

**Objective**: Understand CCW artifact structure and conventions

**Actions**:
1. Read `../_shared/SKILL-DESIGN-SPEC.md` for skill structure
2. Read existing command patterns from `.claude/commands/`
3. Read existing agent patterns from `.claude/agents/`
4. Understand JSON Schema conventions

**Output**: Internalized requirements (in-memory)

---

### Phase 1: Flow Input Collection

Gather user's process description through interactive prompts.

**Objective**: Capture complete workflow requirements

**Actions**:
1. Ask for workflow name and purpose
2. Collect process description (natural language or structured)
3. Identify input/output requirements
4. Determine execution mode preferences
5. Collect trigger phrases

**Output**: `workflow-config.json` with structured requirements

---

### Phase 2: Phase Decomposition

Break down user's process into discrete phases.

**Objective**: Transform process description into executable phases

**Actions**:
1. Parse process description into logical steps
2. Identify dependencies between steps
3. Determine phase boundaries
4. Define input/output for each phase
5. Assign phase numbers and names

**Output**: `phase-breakdown.json` with phase definitions

---

### Phase 3: Similar Flow Analysis

Analyze existing workflows to learn patterns and conventions.

**Objective**: Ensure consistency with existing CCW workflows

**Actions**:
1. Search for similar workflows by purpose/domain
2. Extract structural patterns (command format, agent structure)
3. Identify reusable components
4. Learn naming conventions
5. Detect integration patterns

**Output**: `similarity-report.json` with patterns and recommendations

---

### Phase 4: Artifact Generation

Generate all workflow artifacts based on analysis.

**Objective**: Create complete, working workflow package

**Actions**:
1. Generate slash command (`.claude/commands/{name}.md`)
2. Generate agent definition (`.claude/agents/{name}-agent.md`)
3. Generate workflow.json (orchestration definition)
4. Generate any required templates

**Output**: Generated artifact files

---

### Phase 5: Schema Generation

Create JSON Schema for workflow configuration and state.

**Objective**: Define type-safe configuration and state management

**Actions**:
1. Extract configuration parameters from workflow
2. Define state schema for workflow execution
3. Create validation rules
4. Generate schema documentation

**Output**: `schemas/{name}.schema.json`

---

### Phase 6: Validation & Integration

Verify all artifacts work together correctly.

**Objective**: Ensure closed-loop workflow functionality

**Actions**:
1. Validate command syntax and structure
2. Verify agent definition completeness
3. Check schema validity
4. Test workflow.json orchestration
5. Generate integration test cases
6. Create usage documentation

**Output**: `validation-report.json`, `README.md`

---

## Execution Protocol

```javascript
// Phase 0: Read specifications (in-memory)
Read('.claude/skills/_shared/SKILL-DESIGN-SPEC.md');
Read('.claude/commands/ccw.md');  // Reference command
Read('.claude/agents/code-developer.md');  // Reference agent

// Phase 1: Gather requirements
const answers = AskUserQuestion({
  questions: [
    { question: "Workflow name?", header: "Name" },
    { question: "What process does this workflow automate?", header: "Process" },
    { question: "What triggers this workflow?", header: "Triggers" }
  ]
});

const config = generateConfig(answers);
const workDir = `.workflow/.scratchpad/workflow-creator-${timestamp}`;
Write(`${workDir}/workflow-config.json`, JSON.stringify(config));

// Phase 2: Decompose into phases
const phases = decomposeProcess(config.process);
Write(`${workDir}/phase-breakdown.json`, JSON.stringify(phases));

// Phase 3: Analyze similar workflows
const similar = analyzeSimilarWorkflows(config);
Write(`${workDir}/similarity-report.json`, JSON.stringify(similar));

// Phase 4: Generate artifacts
const commandPath = `.claude/commands/${config.name}.md`;
const agentPath = `.claude/agents/${config.name}-agent.md`;
Write(commandPath, generateCommand(config, phases, similar));
Write(agentPath, generateAgent(config, phases, similar));
Write(`${workDir}/workflow.json`, generateWorkflowDef(config, phases));

// Phase 5: Generate schema
const schemaPath = `schemas/${config.name}.schema.json`;
Write(schemaPath, generateSchema(config, phases));

// Phase 6: Validate and document
const validation = validateWorkflow(commandPath, agentPath, schemaPath);
Write(`${workDir}/validation-report.json`, JSON.stringify(validation));
Write(`${workDir}/README.md`, generateReadme(config, validation));
```

## Directory Setup

```bash
# Create working directory
WORK_DIR=".workflow/.scratchpad/workflow-creator-$(date +%s)"
mkdir -p "$WORK_DIR"

# Output locations
COMMAND_DIR=".claude/commands"
AGENT_DIR=".claude/agents"
SCHEMA_DIR="schemas"
```

## Output Structure

```
Generated Workflow Package:
|
+-- .claude/commands/
|   +-- {workflow-name}.md           # Slash command entry point
|
+-- .claude/agents/
|   +-- {workflow-name}-agent.md     # Agent definition
|
+-- schemas/
|   +-- {workflow-name}.schema.json  # Configuration schema
|
+-- .workflow/.scratchpad/workflow-creator-{timestamp}/
    +-- workflow-config.json         # Input configuration
    +-- phase-breakdown.json         # Phase decomposition
    +-- similarity-report.json       # Similar workflow analysis
    +-- workflow.json                # Workflow orchestration
    +-- validation-report.json       # Validation results
    +-- README.md                    # Usage documentation
```

## Reference Documents by Phase

### Phase 0: Specification Study (Mandatory Prerequisites)

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [../_shared/SKILL-DESIGN-SPEC.md](../_shared/SKILL-DESIGN-SPEC.md) | Universal Skill design specification | Understand structure and naming conventions - **REQUIRED** |
| [specs/artifact-patterns.md](specs/artifact-patterns.md) | CCW artifact patterns | Learn command/agent/schema conventions - **REQUIRED** |

### Phase 1: Flow Input Collection

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [phases/01-flow-input.md](phases/01-flow-input.md) | Phase 1 execution guide | Understand how to collect workflow requirements |
| [specs/workflow-requirements.md](specs/workflow-requirements.md) | Workflow requirements specification | Understand what information a workflow needs |

### Phase 2: Phase Decomposition

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [phases/02-phase-decomposition.md](phases/02-phase-decomposition.md) | Phase 2 execution guide | Understand how to break down processes |
| [templates/phase-template.md](templates/phase-template.md) | Phase definition template | Structure for phase definitions |

### Phase 3: Similar Flow Analysis

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [phases/03-similar-analysis.md](phases/03-similar-analysis.md) | Phase 3 execution guide | Understand how to analyze existing workflows |
| [specs/similarity-criteria.md](specs/similarity-criteria.md) | Similarity matching criteria | Define what makes workflows similar |

### Phase 4: Artifact Generation

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [phases/04-artifact-generation.md](phases/04-artifact-generation.md) | Phase 4 execution guide | Understand artifact generation process |
| [templates/command-template.md](templates/command-template.md) | Slash command template | Generate command files |
| [templates/agent-template.md](templates/agent-template.md) | Agent definition template | Generate agent files |

### Phase 5: Schema Generation

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [phases/05-schema-generation.md](phases/05-schema-generation.md) | Phase 5 execution guide | Understand schema generation |
| [templates/schema-template.json](templates/schema-template.json) | JSON Schema template | Generate schema files |

### Phase 6: Validation & Integration

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [phases/06-validation.md](phases/06-validation.md) | Phase 6 execution guide | Understand validation process |
| [specs/quality-standards.md](specs/quality-standards.md) | Quality standards | Validation criteria |

### Debugging & Troubleshooting

| Issue | Solution Document |
|-------|------------------|
| Generated command not triggering | [specs/artifact-patterns.md](specs/artifact-patterns.md) - verify trigger format |
| Agent not executing correctly | [templates/agent-template.md](templates/agent-template.md) - check structure |
| Schema validation failing | [templates/schema-template.json](templates/schema-template.json) - verify JSON Schema syntax |

### Reference & Background

| Document | Purpose | Notes |
|----------|---------|-------|
| [specs/ccw-integration.md](specs/ccw-integration.md) | CCW integration specification | How workflows integrate with CCW |
| [specs/closed-loop-design.md](specs/closed-loop-design.md) | Closed-loop workflow design | Ensure workflows are self-contained |

---

## Usage Examples

**Basic Workflow Creation**:
```
User: "Create a workflow for code review"
Workflow-Creator:
  -> Phase 1: Collects name, process, triggers
  -> Phase 2: Breaks into: setup -> analyze -> report -> iterate
  -> Phase 3: Finds similar: review-code skill
  -> Phase 4: Generates command + agent
  -> Phase 5: Creates config schema
  -> Phase 6: Validates and documents
  -> Output: Complete workflow package
```

**From Structured Input**:
```
User: "Create workflow from this process:
  1. User provides code path
  2. Analyze code structure
  3. Generate documentation
  4. User reviews and iterates"

Workflow-Creator:
  -> Parses structured input
  -> Maps to 4 phases
  -> Generates artifacts
  -> Output: doc-generator workflow
```

## Comparison: workflow-creator vs skill-generator

| Aspect | workflow-creator | skill-generator |
|--------|-----------------|-----------------|
| **Output** | Commands + Agents + Schema | Skills (phases/, specs/, templates/) |
| **Focus** | CCW workflow artifacts | Skill packages |
| **Integration** | CCW command system | Skill invocation system |
| **Phases** | 7 (includes similar analysis) | 6 (standard skill generation) |
| **Use Case** | Create new CCW workflows | Create new skills |
