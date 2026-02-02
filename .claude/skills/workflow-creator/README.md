# Workflow Creator

Auto-generate Claude-Code-Workflow slash commands, Agent definitions, JSON Schema, and closed-loop workflows from user-described processes.

## Quick Start

```bash
# Invoke the skill
/skill:workflow-creator "Create a workflow for automated testing"

# Or with structured input
/skill:workflow-creator "Create workflow:
  Name: test-runner
  Process: 1. Discover tests 2. Run tests 3. Report results
  Triggers: run tests, test runner"
```

## What It Generates

| Artifact | Location | Purpose |
|----------|----------|---------|
| Slash Command | `.claude/commands/{name}.md` | Entry point for workflow |
| Agent Definition | `.claude/agents/{name}-agent.md` | Execution logic |
| JSON Schema | `schemas/{name}.schema.json` | Configuration validation |
| Workflow Definition | `workflow.json` | Orchestration rules |

## 7-Phase Process

1. **Specification Study** - Learn CCW conventions
2. **Flow Input** - Collect workflow requirements
3. **Phase Decomposition** - Break process into phases
4. **Similar Analysis** - Learn from existing workflows
5. **Artifact Generation** - Create command + agent
6. **Schema Generation** - Define configuration schema
7. **Validation** - Verify and document

## When to Use

- Creating new CCW slash commands
- Building automated workflows
- Generating agent definitions
- Scaffolding workflow packages

## Example Output

```
Generated Workflow Package:
  .claude/commands/test-runner.md
  .claude/agents/test-runner-agent.md
  schemas/test-runner.schema.json
  
Working Files:
  .workflow/.scratchpad/workflow-creator-{timestamp}/
    workflow-config.json
    phase-breakdown.json
    similarity-report.json
    validation-report.json
    README.md
```

## Related Skills

- **skill-generator** - For creating skill packages (phases/, specs/, templates/)
- **lite-skill-generator** - For quick, minimal skill scaffolding
- **flow-coordinator** - For executing workflow templates

## Triggers

- "create workflow"
- "new workflow"
- "workflow creator"
- "generate command"
