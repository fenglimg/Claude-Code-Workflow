# JSON Schema Specification

> Defines the structure, conventions, and requirements for Claude Code Workflow JSON schemas.

---

## When to Use

| Phase | Usage | Section |
|-------|-------|---------|
| Phase 2: Component Generation | Generate schema file structure | [File Structure](#file-structure) |
| Phase 2: Component Generation | Define schema properties | [Schema Structure](#schema-structure) |
| Phase 3: Integration | Configure schema references | [Schema References](#schema-references) |
| Phase 4: Validation | Validate schema completeness | [Validation Checklist](#validation-checklist) |

---

## File Structure

### Directory Layout

```
.claude/workflows/cli-templates/schemas/
├── {domain}-json-schema.json      # Domain-specific schema
├── {domain}-{type}-schema.json    # Type-specific schema
└── {feature}.schema.json          # Feature schema (alternative naming)
```

### Naming Conventions

| Pattern | Use Case | Example |
|---------|----------|---------|
| `{domain}-json-schema.json` | Primary domain schemas | `plan-json-schema.json`, `explore-json-schema.json` |
| `{domain}-{type}-schema.json` | Type-specific schemas | `fix-plan-json-schema.json`, `review-dimension-results-schema.json` |
| `{feature}.schema.json` | Feature schemas | `learn-profile.schema.json`, `learn-state.schema.json` |

### Common Schema Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| Plan schemas | Implementation/fix plans | `plan-json-schema.json`, `fix-plan-json-schema.json` |
| Exploration schemas | Code analysis results | `explore-json-schema.json`, `diagnosis-json-schema.json` |
| State schemas | Workflow state tracking | `learn-state.schema.json`, `discovery-state-schema.json` |
| Result schemas | Operation results | `review-dimension-results-schema.json` |

---

## Schema Structure

### Standard Schema Template

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "{Schema Title}",
  "description": "{Schema purpose and usage context}",
  "type": "object",
  "required": [
    "{required-field-1}",
    "{required-field-2}",
    "_metadata"
  ],
  "properties": {
    "{field-name}": {
      "type": "{type}",
      "description": "{Field description}"
    },
    "_metadata": {
      "type": "object",
      "required": ["timestamp", "source"],
      "properties": {
        "timestamp": {
          "type": "string",
          "format": "date-time",
          "description": "ISO 8601 timestamp"
        },
        "source": {
          "type": "string",
          "description": "Source agent or process"
        }
      }
    }
  }
}
```

### Required Root Fields

| Field | Purpose | Always Required |
|-------|---------|-----------------|
| `$schema` | JSON Schema version reference | Yes |
| `title` | Human-readable schema name | Yes |
| `description` | Schema purpose and context | Yes |
| `type` | Root type (usually "object") | Yes |
| `required` | List of required properties | Yes |
| `properties` | Property definitions | Yes |

---

## Property Types

### Primitive Types

| Type | JSON Schema | Example |
|------|-------------|---------|
| String | `"type": "string"` | `"summary": {"type": "string"}` |
| Integer | `"type": "integer"` | `"count": {"type": "integer"}` |
| Number | `"type": "number"` | `"score": {"type": "number"}` |
| Boolean | `"type": "boolean"` | `"enabled": {"type": "boolean"}` |

### Complex Types

#### Array Type

```json
{
  "tasks": {
    "type": "array",
    "minItems": 1,
    "maxItems": 10,
    "items": {
      "type": "object",
      "required": ["id", "title"],
      "properties": {
        "id": {"type": "string"},
        "title": {"type": "string"}
      }
    },
    "description": "List of tasks"
  }
}
```

#### Object Type

```json
{
  "reference": {
    "type": "object",
    "properties": {
      "pattern": {"type": "string"},
      "files": {
        "type": "array",
        "items": {"type": "string"}
      }
    },
    "description": "Reference materials"
  }
}
```

#### Enum Type

```json
{
  "action": {
    "type": "string",
    "enum": ["Create", "Update", "Implement", "Refactor", "Delete"],
    "description": "Action type"
  }
}
```

#### OneOf Type (Union)

```json
{
  "relevant_files": {
    "type": "array",
    "items": {
      "oneOf": [
        {"type": "string"},
        {
          "type": "object",
          "required": ["path", "relevance"],
          "properties": {
            "path": {"type": "string"},
            "relevance": {"type": "number", "minimum": 0, "maximum": 1}
          }
        }
      ]
    }
  }
}
```

---

## Validation Constraints

### String Constraints

```json
{
  "id": {
    "type": "string",
    "pattern": "^T[0-9]+$",
    "description": "Task identifier (T1, T2, T3...)"
  },
  "summary": {
    "type": "string",
    "minLength": 10,
    "maxLength": 500,
    "description": "Brief summary"
  }
}
```

### Number Constraints

```json
{
  "relevance": {
    "type": "number",
    "minimum": 0,
    "maximum": 1,
    "description": "Relevance score 0.0-1.0"
  },
  "index": {
    "type": "integer",
    "minimum": 1,
    "maximum": 10,
    "description": "Position index"
  }
}
```

### Array Constraints

```json
{
  "tasks": {
    "type": "array",
    "minItems": 1,
    "maxItems": 10,
    "uniqueItems": true,
    "description": "Task list"
  }
}
```

---

## Common Schema Patterns

### Task Schema Pattern

```json
{
  "type": "object",
  "required": ["id", "title", "scope", "action", "description", "implementation", "acceptance"],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^T[0-9]+$",
      "description": "Task identifier (T1, T2, T3...)"
    },
    "title": {
      "type": "string",
      "description": "Task title (action verb + target)"
    },
    "scope": {
      "type": "string",
      "description": "Task scope: module path or feature name"
    },
    "action": {
      "type": "string",
      "enum": ["Create", "Update", "Implement", "Refactor", "Add", "Delete", "Configure", "Test", "Fix"],
      "description": "Primary action type"
    },
    "description": {
      "type": "string",
      "description": "What to implement (1-2 sentences)"
    },
    "modification_points": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["file", "target", "change"],
        "properties": {
          "file": {"type": "string"},
          "target": {"type": "string"},
          "change": {"type": "string"}
        }
      }
    },
    "implementation": {
      "type": "array",
      "items": {"type": "string"},
      "minItems": 2,
      "maxItems": 7,
      "description": "Step-by-step implementation guide"
    },
    "acceptance": {
      "type": "array",
      "items": {"type": "string"},
      "minItems": 1,
      "maxItems": 4,
      "description": "Verification criteria"
    },
    "depends_on": {
      "type": "array",
      "items": {
        "type": "string",
        "pattern": "^T[0-9]+$"
      },
      "description": "Task dependencies"
    }
  }
}
```

### Metadata Schema Pattern

```json
{
  "_metadata": {
    "type": "object",
    "required": ["timestamp", "source"],
    "properties": {
      "timestamp": {
        "type": "string",
        "format": "date-time",
        "description": "ISO 8601 timestamp"
      },
      "source": {
        "type": "string",
        "description": "Source agent or process"
      },
      "planning_mode": {
        "type": "string",
        "enum": ["direct", "agent-based"],
        "description": "Planning execution mode"
      },
      "duration_seconds": {
        "type": "integer",
        "description": "Operation duration in seconds"
      }
    }
  }
}
```

### Clarification Needs Pattern

```json
{
  "clarification_needs": {
    "type": "array",
    "items": {
      "type": "object",
      "required": ["question", "context", "options"],
      "properties": {
        "question": {
          "type": "string",
          "description": "The clarification question"
        },
        "context": {
          "type": "string",
          "description": "Background context"
        },
        "options": {
          "type": "array",
          "items": {"type": "string"},
          "minItems": 2,
          "maxItems": 4,
          "description": "Available options"
        },
        "recommended": {
          "type": "integer",
          "minimum": 0,
          "description": "Zero-based index of recommended option"
        }
      }
    }
  }
}
```

### Flow Control Pattern

```json
{
  "flow_control": {
    "type": "object",
    "properties": {
      "execution_order": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "phase": {"type": "string"},
            "tasks": {
              "type": "array",
              "items": {"type": "string"}
            },
            "type": {
              "type": "string",
              "enum": ["parallel", "sequential"]
            }
          }
        }
      },
      "exit_conditions": {
        "type": "object",
        "properties": {
          "success": {"type": "string"},
          "failure": {"type": "string"}
        }
      }
    }
  }
}
```

---

## Schema References

### In Commands

```javascript
// Read schema before generating output
const schema = Bash(`cat ~/.claude/workflows/cli-templates/schemas/plan-json-schema.json`)
```

### In Agent Prompts

```markdown
## Output Schema Reference
Execute: cat ~/.claude/workflows/cli-templates/schemas/plan-json-schema.json (get schema reference before generating plan)
```

### Schema Path Patterns

| Context | Path Pattern |
|---------|--------------|
| Bash command | `~/.claude/workflows/cli-templates/schemas/{schema}.json` |
| Agent prompt | `~/.claude/workflows/cli-templates/schemas/{schema}.json` |
| Documentation | `.claude/workflows/cli-templates/schemas/{schema}.json` |

---

## Complexity-Based Fields

### Low Complexity (Base Fields)

```json
{
  "required": ["id", "title", "scope", "action", "description", "implementation", "acceptance"]
}
```

### Medium Complexity (+ Rationale, Verification)

```json
{
  "rationale": {
    "type": "object",
    "properties": {
      "chosen_approach": {"type": "string"},
      "alternatives_considered": {"type": "array", "items": {"type": "string"}},
      "decision_factors": {"type": "array", "items": {"type": "string"}},
      "tradeoffs": {"type": "string"}
    }
  },
  "verification": {
    "type": "object",
    "properties": {
      "unit_tests": {"type": "array", "items": {"type": "string"}},
      "integration_tests": {"type": "array", "items": {"type": "string"}},
      "manual_checks": {"type": "array", "items": {"type": "string"}},
      "success_metrics": {"type": "array", "items": {"type": "string"}}
    }
  }
}
```

### High Complexity (+ Risks, Code Skeleton, Data Flow)

```json
{
  "risks": {
    "type": "array",
    "items": {
      "type": "object",
      "required": ["description", "probability", "impact", "mitigation"],
      "properties": {
        "description": {"type": "string"},
        "probability": {"type": "string", "enum": ["Low", "Medium", "High"]},
        "impact": {"type": "string", "enum": ["Low", "Medium", "High"]},
        "mitigation": {"type": "string"},
        "fallback": {"type": "string"}
      }
    }
  },
  "code_skeleton": {
    "type": "object",
    "properties": {
      "interfaces": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "name": {"type": "string"},
            "definition": {"type": "string"},
            "purpose": {"type": "string"}
          }
        }
      },
      "key_functions": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "signature": {"type": "string"},
            "purpose": {"type": "string"},
            "returns": {"type": "string"}
          }
        }
      }
    }
  },
  "data_flow": {
    "type": "object",
    "properties": {
      "diagram": {"type": "string"},
      "stages": {
        "type": "array",
        "items": {
          "type": "object",
          "required": ["stage", "input", "output", "component"],
          "properties": {
            "stage": {"type": "string"},
            "input": {"type": "string"},
            "output": {"type": "string"},
            "component": {"type": "string"}
          }
        }
      }
    }
  }
}
```

---

## Validation Checklist

### Schema File Validation

- [ ] **$schema present**: `"$schema": "http://json-schema.org/draft-07/schema#"`
- [ ] **Title defined**: Human-readable schema name
- [ ] **Description present**: Clear purpose statement
- [ ] **Type specified**: Root type defined (usually "object")
- [ ] **Required array**: List of required properties

### Property Validation

- [ ] **All properties typed**: Each property has a type
- [ ] **Descriptions present**: Each property has a description
- [ ] **Constraints appropriate**: min/max, patterns, enums where needed
- [ ] **Nested objects complete**: Nested objects have required/properties

### Integration Validation

- [ ] **Filename follows convention**: `{domain}-json-schema.json` or `{feature}.schema.json`
- [ ] **Path is correct**: Located in `.claude/workflows/cli-templates/schemas/`
- [ ] **Referenced correctly**: Commands/agents use correct path

---

## Example: Complete Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Example Output Schema",
  "description": "Schema for example workflow output",
  "type": "object",
  "required": [
    "summary",
    "items",
    "_metadata"
  ],
  "properties": {
    "summary": {
      "type": "string",
      "minLength": 10,
      "maxLength": 500,
      "description": "Brief summary of the output"
    },
    "items": {
      "type": "array",
      "minItems": 1,
      "maxItems": 10,
      "items": {
        "type": "object",
        "required": ["id", "name", "status"],
        "properties": {
          "id": {
            "type": "string",
            "pattern": "^ITEM-[0-9]+$",
            "description": "Item identifier"
          },
          "name": {
            "type": "string",
            "description": "Item name"
          },
          "status": {
            "type": "string",
            "enum": ["pending", "active", "completed"],
            "description": "Item status"
          }
        }
      },
      "description": "List of items"
    },
    "_metadata": {
      "type": "object",
      "required": ["timestamp", "source"],
      "properties": {
        "timestamp": {
          "type": "string",
          "format": "date-time",
          "description": "ISO 8601 timestamp"
        },
        "source": {
          "type": "string",
          "description": "Source of this output"
        }
      }
    }
  }
}
```

---

*Specification Version: 1.0*
*Based on: plan-json-schema.json, explore-json-schema.json*
