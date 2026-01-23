# T6: JSON Schema Specifications - Validation and Structure

## Overview

JSON schemas define the structure and validation rules for all major artifacts in Claude Code Workflow. They ensure consistency, enable validation, and provide clear contracts between components.

**Core Principle**: Schema-first design with strict validation and progressive disclosure of complexity.

## Schema Files

### 1. plan-json-schema.json

**Purpose**: Defines structure for lightweight planning output (lite-plan)

**Location**: `~/.claude/workflows/cli-templates/schemas/plan-json-schema.json`

**Structure**:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["summary", "approach", "tasks", "estimated_time", "complexity"],
  "properties": {
    "summary": {
      "type": "string",
      "description": "One-line summary of the plan"
    },
    "approach": {
      "type": "string",
      "description": "High-level approach and strategy"
    },
    "tasks": {
      "type": "array",
      "minItems": 2,
      "maxItems": 7,
      "items": {
        "type": "object",
        "required": ["id", "title", "scope", "complexity"],
        "properties": {
          "id": { "type": "string", "pattern": "^TASK-[0-9]+$" },
          "title": { "type": "string" },
          "scope": { "type": "string" },
          "complexity": { "enum": ["Low", "Medium", "High"] },
          "depends_on": { "type": "array", "items": { "type": "string" } },
          "execution_group": { "type": "integer" },
          "estimated_time": { "type": "string" }
        }
      }
    },
    "estimated_time": { "type": "string" },
    "complexity": { "enum": ["Low", "Medium", "High"] },
    "recommended_execution": { "enum": ["Agent", "Codex", "Auto"] },
    "_metadata": {
      "type": "object",
      "properties": {
        "timestamp": { "type": "string", "format": "date-time" },
        "source": { "type": "string" },
        "planning_mode": { "type": "string" },
        "exploration_angles": { "type": "array", "items": { "type": "string" } }
      }
    }
  }
}
```

**Validation Rules**:
- `tasks`: 2-7 items (group by feature, not file)
- `complexity`: Must match task complexity levels
- `depends_on`: Only true dependencies (Task B cannot start without Task A output)
- `execution_group`: Tasks with same group execute in parallel

**Usage**:
```javascript
// Load schema
const schema = JSON.parse(Bash(`cat ~/.claude/workflows/cli-templates/schemas/plan-json-schema.json`))

// Validate plan
const plan = { summary: "...", tasks: [...], ... }
validateAgainstSchema(plan, schema)
```

### 2. explore-json-schema.json

**Purpose**: Defines structure for code exploration output (cli-explore-agent)

**Location**: `~/.claude/workflows/cli-templates/schemas/explore-json-schema.json`

**Structure**:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": [
    "project_structure",
    "relevant_files",
    "patterns",
    "dependencies",
    "integration_points",
    "constraints",
    "clarification_needs",
    "_metadata"
  ],
  "properties": {
    "project_structure": {
      "type": "string",
      "description": "Modules/architecture relevant to exploration angle"
    },
    "relevant_files": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["path", "relevance", "rationale"],
        "properties": {
          "path": { "type": "string" },
          "relevance": { "type": "number", "minimum": 0, "maximum": 1 },
          "rationale": { "type": "string" }
        }
      },
      "description": "Files with relevance scores (0.7+ high, 0.5-0.7 medium, <0.5 low)"
    },
    "patterns": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "description": { "type": "string" },
          "example": { "type": "string" }
        }
      },
      "description": "Angle-related patterns with code examples"
    },
    "dependencies": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Dependencies relevant to exploration angle"
    },
    "integration_points": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "location": { "type": "string" },
          "description": { "type": "string" }
        }
      },
      "description": "Where to integrate from angle viewpoint (include file:line)"
    },
    "constraints": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Angle-specific limitations/conventions"
    },
    "clarification_needs": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["question", "options", "recommended"],
        "properties": {
          "question": { "type": "string" },
          "context": { "type": "string" },
          "options": { "type": "array", "items": { "type": "string" } },
          "recommended": { "type": "integer" }
        }
      },
      "description": "Angle-related ambiguities (options + recommended index)"
    },
    "_metadata": {
      "type": "object",
      "required": ["exploration_angle"],
      "properties": {
        "exploration_angle": { "type": "string" },
        "exploration_index": { "type": "integer" },
        "timestamp": { "type": "string", "format": "date-time" }
      }
    }
  }
}
```

**Validation Rules**:
- `relevant_files`: Must include relevance scores (0.0-1.0)
- `patterns`: Must include code examples, not generic advice
- `integration_points`: Must include file:line locations
- `constraints`: Must be project-specific to angle
- `clarification_needs`: Must include options array + recommended index

**Usage**:
```javascript
// Agent reads schema first
const schema = Read('~/.claude/workflows/cli-templates/schemas/explore-json-schema.json')

// Generate exploration output
const exploration = {
  project_structure: "...",
  relevant_files: [{ path: "src/auth.ts", relevance: 0.85, rationale: "..." }],
  patterns: [...],
  dependencies: [...],
  integration_points: [...],
  constraints: [...],
  clarification_needs: [...],
  _metadata: { exploration_angle: "security", ... }
}

// Validate
validateAgainstSchema(exploration, schema)
```

### 3. solution-schema.json

**Purpose**: Defines structure for issue solutions (issue-plan-agent)

**Location**: `.claude/workflows/cli-templates/schemas/solution-schema.json`

**Structure**:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "issue_id", "approach", "tasks", "analysis", "score"],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^SOL-[A-Z0-9]+-[a-z0-9]{4}$",
      "description": "Solution ID format: SOL-{issue-id}-{uid}"
    },
    "issue_id": { "type": "string" },
    "approach": {
      "type": "string",
      "description": "Solution strategy and rationale"
    },
    "tasks": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["id", "title", "phase", "acceptance_criteria"],
        "properties": {
          "id": { "type": "string" },
          "title": { "type": "string" },
          "phase": { "enum": ["analyze", "implement", "test", "optimize", "commit"] },
          "description": { "type": "string" },
          "acceptance_criteria": {
            "type": "array",
            "items": { "type": "string" },
            "description": "Quantified, testable conditions"
          },
          "depends_on": { "type": "array", "items": { "type": "string" } },
          "modification_points": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "file": { "type": "string" },
                "line": { "type": "integer" },
                "action": { "enum": ["create", "modify", "delete"] }
              }
            }
          }
        }
      }
    },
    "analysis": {
      "type": "object",
      "properties": {
        "root_cause": { "type": "string" },
        "impact_assessment": { "type": "string" },
        "risk_level": { "enum": ["Low", "Medium", "High"] }
      }
    },
    "score": {
      "type": "number",
      "minimum": 0,
      "maximum": 100,
      "description": "Solution quality score (0-100)"
    }
  }
}
```

**Validation Rules**:
- `id`: Format SOL-{issue-id}-{4-char-uid}
- `tasks`: 5-phase lifecycle (analyze → implement → test → optimize → commit)
- `acceptance_criteria`: Must be quantified and testable
- `modification_points`: Must include file:line locations
- `score`: 0-100 scale

**Usage**:
```javascript
// Generate solution
const solution = {
  id: "SOL-GH-123-a7x9",
  issue_id: "GH-123",
  approach: "Implement JWT refresh token rotation...",
  tasks: [
    {
      id: "TASK-1",
      title: "Analyze current auth flow",
      phase: "analyze",
      acceptance_criteria: ["Current flow documented", "Gaps identified"]
    },
    ...
  ],
  analysis: { root_cause: "...", impact_assessment: "...", risk_level: "Medium" },
  score: 85
}

// Validate
validateAgainstSchema(solution, schema)

// Write to solutions file
Bash(`echo '${JSON.stringify(solution)}' >> .workflow/issues/solutions/GH-123.jsonl`)
```

### 4. context-package-schema.json

**Purpose**: Defines structure for context packages (context-search-agent)

**Location**: `.claude/workflows/cli-templates/schemas/context-package-schema.json`

**Structure**:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["session_id", "task_description", "modules", "conflict_risk"],
  "properties": {
    "session_id": { "type": "string" },
    "task_description": { "type": "string" },
    "modules": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "prefix", "files", "dependencies"],
        "properties": {
          "name": { "type": "string" },
          "prefix": { "type": "string" },
          "files": { "type": "array", "items": { "type": "string" } },
          "dependencies": { "type": "array", "items": { "type": "string" } },
          "analysis_path": { "type": "string" }
        }
      }
    },
    "conflict_risk": {
      "enum": ["none", "low", "medium", "high"],
      "description": "Conflict risk level (determines Phase 3 execution)"
    },
    "conflicts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "file": { "type": "string" },
          "modules": { "type": "array", "items": { "type": "string" } },
          "description": { "type": "string" }
        }
      }
    }
  }
}
```

**Validation Rules**:
- `conflict_risk`: Determines Phase 3 execution (medium/high → execute)
- `modules`: Each module must have name, prefix, files, dependencies
- `conflicts`: List files modified by multiple modules

## Validation Patterns

### Pattern 1: Schema-First Validation

```javascript
// Step 1: Read schema
const schema = Read(schema_path)

// Step 2: Parse schema to extract requirements
const requiredFields = Object.keys(schema.properties)
  .filter(field => schema.required.includes(field))

// Step 3: Validate output
const output = generateOutput()
for (const field of requiredFields) {
  if (!(field in output)) {
    throw new Error(`Missing required field: ${field}`)
  }
}

// Step 4: Validate field types and constraints
for (const [field, value] of Object.entries(output)) {
  const fieldSchema = schema.properties[field]
  if (fieldSchema.type && typeof value !== fieldSchema.type) {
    throw new Error(`Invalid type for ${field}`)
  }
  if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
    throw new Error(`Invalid value for ${field}: ${value}`)
  }
}
```

### Pattern 2: Progressive Validation

```javascript
// Validate in stages
function validatePlan(plan) {
  // Stage 1: Required fields
  validateRequiredFields(plan, ['summary', 'tasks', 'complexity'])

  // Stage 2: Field types
  validateFieldTypes(plan, {
    summary: 'string',
    tasks: 'array',
    complexity: 'string'
  })

  // Stage 3: Field constraints
  validateConstraints(plan, {
    tasks: { minItems: 2, maxItems: 7 },
    complexity: { enum: ['Low', 'Medium', 'High'] }
  })

  // Stage 4: Cross-field validation
  validateCrossFields(plan, {
    'tasks.length': (len) => len >= 2 && len <= 7,
    'complexity': (val) => val === 'Low' || val === 'Medium' || val === 'High'
  })
}
```

## Schema Usage in Workflows

### In cli-explore-agent

```javascript
// Agent reads schema first
const schema = Read('~/.claude/workflows/cli-templates/schemas/explore-json-schema.json')

// Generate exploration following schema
const exploration = {
  project_structure: "...",
  relevant_files: [...],
  patterns: [...],
  dependencies: [...],
  integration_points: [...],
  constraints: [...],
  clarification_needs: [...],
  _metadata: { exploration_angle: "security" }
}

// Validate before writing
validateAgainstSchema(exploration, schema)
Write(output_path, JSON.stringify(exploration, null, 2))
```

### In cli-lite-planning-agent

```javascript
// Agent reads schema
const schema = Read('~/.claude/workflows/cli-templates/schemas/plan-json-schema.json')

// Generate plan following schema
const plan = {
  summary: "...",
  approach: "...",
  tasks: [...],
  estimated_time: "...",
  complexity: "...",
  _metadata: { ... }
}

// Validate
validateAgainstSchema(plan, schema)
Write(plan_path, JSON.stringify(plan, null, 2))
```

### In issue-plan-agent

```javascript
// Agent reads schema
const schema = Read('.claude/workflows/cli-templates/schemas/solution-schema.json')

// Generate solution following schema
const solution = {
  id: "SOL-GH-123-a7x9",
  issue_id: "GH-123",
  approach: "...",
  tasks: [...],
  analysis: { ... },
  score: 85
}

// Validate
validateAgainstSchema(solution, schema)

// Write to solutions file
Bash(`echo '${JSON.stringify(solution)}' >> .workflow/issues/solutions/GH-123.jsonl`)
```

## Error Handling

### Validation Errors

```javascript
try {
  validateAgainstSchema(output, schema)
} catch (error) {
  if (error.type === 'MissingRequiredField') {
    console.error(`Missing required field: ${error.field}`)
    // Regenerate with missing field
  } else if (error.type === 'InvalidType') {
    console.error(`Invalid type for ${error.field}: expected ${error.expected}, got ${error.actual}`)
    // Regenerate with correct type
  } else if (error.type === 'ConstraintViolation') {
    console.error(`Constraint violation for ${error.field}: ${error.constraint}`)
    // Regenerate with constraint satisfied
  }
}
```

## Code References

**Key Files**:
- `~/.claude/workflows/cli-templates/schemas/plan-json-schema.json`: Plan schema
- `~/.claude/workflows/cli-templates/schemas/explore-json-schema.json`: Exploration schema
- `.claude/workflows/cli-templates/schemas/solution-schema.json`: Solution schema
- `.claude/workflows/cli-templates/schemas/context-package-schema.json`: Context package schema

**Key Patterns**:
- Schema-first validation (read schema before generating output)
- Progressive validation (required fields → types → constraints → cross-fields)
- Strict field validation (no extra fields allowed)
- Quantified constraints (minItems, maxItems, enum values)

## Execution Checklist

- [ ] Schema file exists and is valid JSON
- [ ] All required fields present in output
- [ ] Field types match schema specification
- [ ] Field constraints satisfied (min/max, enum, pattern)
- [ ] Cross-field validation passed
- [ ] No extra fields in output
- [ ] Output validates against schema before writing
- [ ] Error messages clear and actionable

## Quality Criteria

✓ Schema complete and well-documented
✓ All required fields specified
✓ Field types and constraints clear
✓ Validation rules enforced
✓ Error messages helpful
✓ Schema used consistently across agents
