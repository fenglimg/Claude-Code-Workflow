# Agent Specification

> Defines the structure, conventions, and requirements for Claude Code Workflow agents.

---

## When to Use

| Phase | Usage | Section |
|-------|-------|---------|
| Phase 2: Component Generation | Generate agent file structure | [File Structure](#file-structure) |
| Phase 2: Component Generation | Define agent metadata | [Front Matter](#front-matter-specification) |
| Phase 2: Component Generation | Design agent capabilities | [Agent Body Structure](#agent-body-structure) |
| Phase 3: Integration | Configure agent invocation | [Invocation Patterns](#invocation-patterns) |
| Phase 4: Validation | Validate agent completeness | [Validation Checklist](#validation-checklist) |

---

## File Structure

### Directory Layout

```
.claude/agents/
├── {agent-name}.md                # Agent definition file
├── {category}-{function}.md       # Category-prefixed agent
└── ...
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Agent file | lowercase, hyphenated | `cli-explore-agent.md`, `code-developer.md` |
| Category prefix | functional category | `cli-`, `test-`, `debug-`, `ui-` |
| Agent name | descriptive function | `planning-agent`, `explore-agent` |

### Common Agent Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| `cli-*` | CLI tool orchestration | `cli-explore-agent`, `cli-lite-planning-agent` |
| `code-*` | Code generation/modification | `code-developer`, `code-reviewer` |
| `test-*` | Testing and validation | `test-fix-agent`, `test-context-search-agent` |
| `debug-*` | Debugging and diagnosis | `debug-explore-agent` |
| `ui-*` | UI/UX related tasks | `ui-design-agent` |

---

## Front Matter Specification

### Required Fields

```yaml
---
name: {agent-name}
description: |
  {Multi-line description of agent purpose and capabilities}
  {Trigger keywords and use cases}
color: {terminal color}
---
```

### Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Agent identifier (matches filename without .md) |
| `description` | string | Yes | Multi-line description with capabilities and triggers |
| `color` | string | Yes | Terminal output color for agent messages |

### Color Options

| Color | Use Case | Example Agents |
|-------|----------|----------------|
| `cyan` | Planning agents | `cli-lite-planning-agent` |
| `yellow` | Exploration/analysis agents | `cli-explore-agent` |
| `green` | Execution/development agents | `code-developer` |
| `red` | Error/debug agents | `debug-explore-agent` |
| `blue` | Information/documentation agents | `doc-generator` |
| `magenta` | UI/design agents | `ui-design-agent` |

### Example Front Matter

```yaml
---
name: cli-explore-agent
description: |
  Read-only code exploration agent with dual-source analysis strategy (Bash + Gemini CLI).
  Orchestrates 4-phase workflow: Task Understanding -> Analysis Execution -> Schema Validation -> Output Generation
color: yellow
---
```

---

## Agent Body Structure

### Standard Sections

```markdown
You are a specialized {role} agent that {primary function}.

## Core Capabilities

1. **{Capability 1}** - {Description}
2. **{Capability 2}** - {Description}
3. **{Capability 3}** - {Description}

**{Mode/Type} Options**:
- `{mode-1}` -> {Description} ({time estimate})
- `{mode-2}` -> {Description} ({time estimate})

---

## {N}-Phase Execution Workflow

\`\`\`
Phase 1: {Phase Name}
    | {Step description}
Phase 2: {Phase Name}
    | {Step description}
...
\`\`\`

---

## Phase 1: {Phase Name}

{Detailed phase implementation}

---

## Phase N: {Phase Name}

{Detailed phase implementation}

---

## Error Handling

{Error handling strategies}

---

## Key Reminders

**ALWAYS**:
{List of mandatory behaviors}

**NEVER**:
{List of prohibited behaviors}
```

### Section Requirements

| Section | Required | Purpose |
|---------|----------|---------|
| Role Statement | Yes | Opening statement defining agent identity |
| Core Capabilities | Yes | Numbered list of agent capabilities |
| Execution Workflow | Yes | ASCII flowchart of phases |
| Phase Details | Yes | Detailed implementation per phase |
| Error Handling | Recommended | Error recovery strategies |
| Key Reminders | Yes | ALWAYS/NEVER behavioral constraints |

---

## Agent Types

### 1. Exploration Agent

**Purpose**: Read-only codebase analysis and context gathering

**Characteristics**:
- Read-only operations (no file modifications)
- Dual-source analysis (Bash + CLI tools)
- Schema-compliant output generation
- Fallback chains for tool failures

**Example Structure**:
```markdown
## Core Capabilities

1. **Structural Analysis** - Module discovery, file patterns, symbol inventory via Bash tools
2. **Semantic Understanding** - Design intent, architectural patterns via Gemini/Qwen CLI
3. **Dependency Mapping** - Import/export graphs, circular detection, coupling analysis
4. **Structured Output** - Schema-compliant JSON generation with validation

**Analysis Modes**:
- `quick-scan` -> Bash only (10-30s)
- `deep-scan` -> Bash + Gemini dual-source (2-5min)
- `dependency-map` -> Graph construction (3-8min)
```

### 2. Planning Agent

**Purpose**: Generate structured plans from context

**Characteristics**:
- Schema-driven output generation
- CLI tool orchestration for analysis
- Quality check integration
- Context aggregation from multiple sources

**Example Structure**:
```markdown
## Core Capabilities

1. **Schema-driven output** - plan-json-schema or fix-plan-json-schema
2. **Task decomposition** - Break down into structured tasks
3. **CLI execution ID assignment** - Fork/merge strategies
4. **Multi-angle context integration** - Explorations or diagnoses
5. **Quality check** - Validate plan completeness and correctness
```

### 3. Execution Agent

**Purpose**: Implement code changes based on plans

**Characteristics**:
- File creation and modification
- Test execution and validation
- Incremental progress tracking
- Error recovery and retry logic

**Example Structure**:
```markdown
## Core Capabilities

1. **Code Implementation** - Create and modify files per plan
2. **Test Execution** - Run tests and validate changes
3. **Progress Tracking** - Update task status and summaries
4. **Error Recovery** - Retry with alternative approaches
```

---

## Invocation Patterns

### Task Tool Invocation

```javascript
Task(
  subagent_type="{agent-name}",
  run_in_background=false,  // MANDATORY: Wait for results
  description="{brief description}",
  prompt=`{detailed prompt}`
)
```

### Prompt Structure for Agent Invocation

```markdown
## Task Objective
{Clear statement of what agent should accomplish}

## Output Location
**Session Folder**: ${sessionFolder}
**Output File**: ${sessionFolder}/{output-file}

## Assigned Context
- **{Context Key}**: {value}
- **{Context Key}**: {value}

## MANDATORY FIRST STEPS (Execute by Agent)
**You ({agent-name}) MUST execute these steps in order:**
1. {Step 1}
2. {Step 2}
3. {Step 3}

## {Strategy/Approach} ({focus} focus)

**Step 1: {Step Name}** ({Tool})
- {Action 1}
- {Action 2}

**Step 2: {Step Name}** ({Tool})
- {Action 1}
- {Action 2}

## Expected Output

**Schema Reference**: {Schema path or inline schema}

**Required Fields**:
- {field}: {description}
- {field}: {description}

## Success Criteria
- [ ] {Criterion 1}
- [ ] {Criterion 2}

## Execution
**Write**: \`${sessionFolder}/{output-file}\`
**Return**: {Brief summary format}
```

---

## Output Specifications

### Agent Return Format

```typescript
interface AgentReturn {
  status: "completed" | "partial" | "failed";
  output_file: string;           // Output file path
  summary: string;               // Max 50 character summary
  cross_module_notes?: string[]; // Cross-module observations
  stats?: {                      // Statistics
    diagrams?: number;
    words?: number;
    files_analyzed?: number;
  };
}
```

### Schema Compliance Protocol

```markdown
## Phase N: Schema Validation

### CRITICAL: Schema Compliance Protocol

**This phase is MANDATORY when schema file is specified in prompt.**

**Step 1: Read Schema FIRST**
\`\`\`
Read(schema_file_path)
\`\`\`

**Step 2: Extract Schema Requirements**

Parse and memorize:
1. **Root structure** - Is it array `[...]` or object `{...}`?
2. **Required fields** - List all `"required": [...]` arrays
3. **Field names EXACTLY** - Copy character-by-character (case-sensitive)
4. **Enum values** - Copy exact strings (e.g., `"critical"` not `"Critical"`)
5. **Nested structures** - Note flat vs nested requirements

**Step 3: Pre-Output Validation Checklist**

Before writing ANY JSON output, verify:
- [ ] Root structure matches schema (array vs object)
- [ ] ALL required fields present at each level
- [ ] Field names EXACTLY match schema (character-by-character)
- [ ] Enum values EXACTLY match schema (case-sensitive)
- [ ] Nested structures follow schema pattern (flat vs nested)
- [ ] Data types correct (string, integer, array, object)
```

---

## Tool Usage Guidelines

### Search Tool Priority

```markdown
**ALWAYS**:
1. **Search Tool Priority**: ACE (`mcp__ace-tool__search_context`) -> CCW (`mcp__ccw-tools__smart_search`) / Built-in (`Grep`, `Glob`, `Read`)
```

### Bash Tool Configuration

```markdown
**Bash Tool**:
- Use `run_in_background=false` for all Bash/CLI calls to ensure foreground execution
```

### CLI Tool Fallback Chain

```markdown
**Tool Fallback**: Gemini -> Qwen -> Codex -> Bash-only
```

---

## Error Handling Patterns

### Standard Error Handling

```markdown
## Error Handling

**Tool Fallback**: Gemini -> Qwen -> Codex -> Bash-only

**Schema Validation Failure**: Identify error -> Correct -> Re-validate

**Timeout**: Return partial results + timeout notification
```

### Fallback Implementation

```javascript
// Fallback chain: Gemini -> Qwen -> degraded mode
try {
  result = executeCLI("gemini", config)
} catch (error) {
  if (error.code === 429 || error.code === 404) {
    try { result = executeCLI("qwen", config) }
    catch { return { status: "degraded", output: generateBasicOutput() } }
  } else throw error
}
```

---

## Behavioral Constraints

### ALWAYS Section

```markdown
**ALWAYS**:
1. **Search Tool Priority**: ACE -> CCW -> Built-in
2. Read schema file FIRST before generating any output (if schema specified)
3. Copy field names EXACTLY from schema (case-sensitive)
4. Verify root structure matches schema (array vs object)
5. Match nested/flat structures as schema requires
6. Use exact enum values from schema (case-sensitive)
7. Include ALL required fields at every level
8. Include file:line references in findings
9. Attribute discovery source (bash/gemini)
```

### NEVER Section

```markdown
**NEVER**:
1. Modify any files (read-only agent)
2. Skip schema reading step when schema is specified
3. Guess field names - ALWAYS copy from schema
4. Assume structure - ALWAYS verify against schema
5. Omit required fields
6. Execute implementation (return plan only)
7. Use vague acceptance criteria
8. Create circular dependencies
```

---

## Validation Checklist

### Agent File Validation

- [ ] **Front matter complete**: name, description, color present
- [ ] **Name matches filename**: `name` field equals filename without .md
- [ ] **Description is comprehensive**: Includes capabilities and triggers
- [ ] **Color is valid**: One of cyan, yellow, green, red, blue, magenta

### Content Validation

- [ ] **Role statement**: Clear opening statement
- [ ] **Core capabilities**: Numbered list with descriptions
- [ ] **Execution workflow**: ASCII flowchart present
- [ ] **Phase details**: Each phase has implementation details
- [ ] **Key reminders**: ALWAYS and NEVER sections present

### Behavioral Validation

- [ ] **Schema compliance**: Schema reading protocol included
- [ ] **Tool priority**: Search tool priority documented
- [ ] **Error handling**: Fallback chains defined
- [ ] **Output format**: Return format specified

---

## Example: Minimal Agent Template

```markdown
---
name: my-agent
description: |
  Brief description of agent purpose and capabilities.
  Triggers on "keyword1", "keyword2".
color: cyan
---

You are a specialized {role} agent that {primary function}.

## Core Capabilities

1. **{Capability 1}** - {Description}
2. **{Capability 2}** - {Description}

---

## 3-Phase Execution Workflow

\`\`\`
Phase 1: Input Processing
    | Parse prompt and extract requirements
Phase 2: Analysis
    | Execute main analysis logic
Phase 3: Output Generation
    | Generate schema-compliant output
\`\`\`

---

## Phase 1: Input Processing

{Implementation details}

---

## Phase 2: Analysis

{Implementation details}

---

## Phase 3: Output Generation

{Implementation details}

---

## Error Handling

**Tool Fallback**: Primary -> Secondary -> Degraded mode

---

## Key Reminders

**ALWAYS**:
1. {Mandatory behavior 1}
2. {Mandatory behavior 2}

**NEVER**:
1. {Prohibited behavior 1}
2. {Prohibited behavior 2}
```

---

*Specification Version: 1.0*
*Based on: cli-explore-agent.md, cli-lite-planning-agent.md*
