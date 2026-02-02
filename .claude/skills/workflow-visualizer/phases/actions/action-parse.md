# Action: Parse Workflow Source

Parse workflow command or skill files to extract execution structure.

## Input

```json
{
  "input_path": "string - Path to workflow file or directory",
  "detail_level": "simple|standard|full"
}
```

## Task

1. **Detect Input Type**
   - Check if path is `.md` file (command) or directory (skill)
   - For directories, look for `SKILL.md` and `command.json`

2. **Parse Command File (.md)**
   - Extract YAML frontmatter (name, description, allowed-tools)
   - Parse execution phases from markdown
   - Identify SlashCommand calls
   - Find Task() invocations with agent types
   - Extract TodoWrite patterns

3. **Parse Skill Directory**
   - Read `SKILL.md` for metadata
   - Parse phase files from `phases/` directory
   - Extract action definitions from `phases/actions/`
   - Identify orchestrator pattern

4. **Extract Key Elements**
   - Phases and their sequence
   - Agents used (@code-developer, @action-planning-agent, etc.)
   - Tools invoked (SlashCommand, Bash, Read, etc.)
   - Decision points (AskUserQuestion, if/else)
   - Entry and exit points

## Output Format

```json
{
  "status": "parsing|completed|error",
  "parsed_data": {
    "type": "command|skill",
    "name": "workflow-name",
    "description": "human-readable description",
    "source_path": "original file path",
    "triggers": ["trigger keywords"],
    "phases": [
      {
        "id": "phase-1",
        "name": "Phase Name",
        "description": "what this phase does",
        "actions": [
          {
            "id": "action-id",
            "type": "slash-command|agent-call|tool-invocation|decision",
            "description": "action description",
            "agent": "@agent-name|null",
            "tools": ["Tool1", "Tool2"],
            "inputs": ["input1", "input2"],
            "outputs": ["output1"],
            "next": ["next-action-id"]
          }
        ]
      }
    ],
    "agents": ["@agent1", "@agent2"],
    "tools": ["SlashCommand", "TodoWrite", "Read"],
    "entry_points": ["command trigger"],
    "exit_points": ["completion state"]
  }
}
```

## Parsing Rules

### For Command Files

1. **Frontmatter** (YAML between `---`)
   - `name`: Command name
   - `description`: What it does
   - `allowed-tools`: Available tools

2. **Execution Flow**
   - Look for `## Execution Process` or similar sections
   - Parse phase descriptions
   - Extract code blocks showing execution order

3. **Agent Calls**
   - Find `Task({` invocations
   - Extract `subagent_type`
   - Parse prompt structure

4. **CCW Patterns**
   - TodoWrite updates
   - SlashCommand chains
   - State management

### For Skills

1. **SKILL.md Structure**
   - Trigger patterns
   - Architecture overview
   - Phase definitions

2. **Phase Files**
   - State schemas
   - Decision logic
   - Action catalogs

3. **Action Files**
   - Individual action specifications
   - Input/output contracts
   - Tool usage

## Example Parsing

**Input: `.claude/commands/workflow/plan.md`**

**Extracted:**
```json
{
  "type": "command",
  "name": "plan",
  "phases": [
    {
      "id": "phase-1",
      "name": "Session Discovery",
      "actions": [
        {
          "id": "p1-a1",
          "type": "slash-command",
          "description": "Start workflow session",
          "command": "/workflow:session:start",
          "next": ["p2-a1"]
        }
      ]
    },
    {
      "id": "phase-2",
      "name": "Context Gathering",
      "actions": [
        {
          "id": "p2-a1",
          "type": "agent-call",
          "description": "Gather context with context-search-agent",
          "agent": "@context-search-agent",
          "tools": ["Glob", "Grep", "Read"],
          "next": ["p3-a1"]
        }
      ]
    }
  ]
}
```

## Error Handling

- **File not found**: Return error with suggested paths
- **Invalid format**: Return partial parse with warnings
- **Ambiguous structure**: Make best-effort parse, flag uncertainties
