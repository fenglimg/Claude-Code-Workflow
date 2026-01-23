# T4: Slash Command System - Registration and Lifecycle

## Overview

Slash Commands are the primary user-facing interface for Claude Code Workflow. They provide structured entry points to complex workflows with standardized registration, discovery, routing, and execution patterns.

**Core Principle**: Declarative command definition with automatic discovery, validation, and execution routing.

## Architecture

### Command Registration

**File Structure**:
```
.claude/commands/
├── workflow/
│   ├── plan.md                    # /workflow:plan
│   ├── lite-plan.md               # /workflow:lite-plan
│   ├── session/
│   │   └── start.md               # /workflow:session:start
│   ├── tools/
│   │   ├── context-gather.md      # /workflow:tools:context-gather
│   │   ├── conflict-resolution.md # /workflow:tools:conflict-resolution
│   │   └── task-generate-agent.md # /workflow:tools:task-generate-agent
│   └── ...
├── issue/
│   ├── plan.md                    # /issue:plan
│   ├── queue.md                   # /issue:queue
│   └── ...
└── ...
```

**Frontmatter Format**:
```yaml
---
name: plan
description: 5-phase planning workflow with action-planning-agent task generation
argument-hint: "\"text description\"|file.md"
allowed-tools: SlashCommand(*), TodoWrite(*), Read(*), Bash(*)
examples:
  - /workflow:plan "Build authentication system"
  - /workflow:plan requirements.md
---
```

**Frontmatter Fields**:
- `name`: Command name (used in routing)
- `description`: One-line summary
- `argument-hint`: Expected argument format
- `allowed-tools`: Tools available to command (with `*` = all args)
- `examples`: Usage examples

### Command Discovery

**Discovery Process**:
```javascript
// 1. Scan .claude/commands/ recursively
const commandFiles = glob('.claude/commands/**/*.md')

// 2. Parse frontmatter from each file
const commands = commandFiles.map(file => {
  const content = Read(file)
  const frontmatter = parseFrontmatter(content)
  const path = file.replace('.claude/commands/', '').replace('.md', '')

  return {
    name: frontmatter.name,
    path: path,                    // e.g., "workflow/plan"
    fullName: `/${path.replace(/\//g, ':')}`,  // e.g., "/workflow:plan"
    description: frontmatter.description,
    allowedTools: frontmatter['allowed-tools'],
    examples: frontmatter.examples || []
  }
})

// 3. Build routing table
const routingTable = {}
commands.forEach(cmd => {
  routingTable[cmd.fullName] = cmd
})
```

### Command Routing

**Routing Logic**:
```javascript
function routeCommand(userInput) {
  // Parse: "/workflow:plan \"task description\""
  const match = userInput.match(/^\/([a-z]+):([a-z:]+)\s*(.*)?$/i)
  if (!match) return null

  const [, category, subcommand, args] = match
  const fullName = `/${category}:${subcommand}`

  // Lookup in routing table
  const command = routingTable[fullName]
  if (!command) throw new Error(`Command not found: ${fullName}`)

  // Validate allowed tools
  validateToolAccess(command.allowedTools)

  // Load and execute command
  return executeCommand(command, args)
}
```

## Command Lifecycle

### 1. Registration Phase

**When**: Project initialization or command creation

**Steps**:
1. Create `.claude/commands/{category}/{name}.md`
2. Add frontmatter with metadata
3. Add implementation (JavaScript/pseudocode)
4. Run discovery scan to register

**File References**:
- `.claude/commands/workflow/plan.md` (lines 1-10): Frontmatter example
- `.claude/commands/issue/plan.md` (lines 1-6): Frontmatter example

### 2. Discovery Phase

**When**: CLI startup or command lookup

**Steps**:
1. Scan `.claude/commands/` recursively
2. Parse frontmatter from all `.md` files
3. Build routing table (fullName → command metadata)
4. Cache routing table for fast lookup

**Output**: Routing table with all registered commands

### 3. Invocation Phase

**When**: User types `/category:command args`

**Steps**:
1. Parse user input (extract category, command, args)
2. Lookup in routing table
3. Validate tool access (check `allowed-tools`)
4. Load command implementation
5. Execute with provided arguments

**Validation**:
```javascript
// Check if command is registered
if (!routingTable[fullName]) {
  throw new Error(`Command not found: ${fullName}`)
}

// Check if tools are allowed
const allowedTools = command.allowedTools
if (allowedTools && !allowedTools.includes('*')) {
  const requestedTools = extractToolsFromImplementation(command)
  requestedTools.forEach(tool => {
    if (!allowedTools.includes(tool)) {
      throw new Error(`Tool not allowed: ${tool}`)
    }
  })
}
```

### 4. Execution Phase

**When**: Command is validated and ready

**Steps**:
1. Initialize execution context (session, memory, state)
2. Execute command implementation
3. Parse outputs and store in memory
4. Return results to user

**Execution Context**:
```javascript
{
  commandName: "/workflow:plan",
  args: "Build authentication system",
  sessionId: null,  // Set by command if needed
  memory: {},       // Shared memory across phases
  state: {},        // Command-specific state
  startTime: Date.now(),
  allowedTools: ["SlashCommand(*)", "TodoWrite(*)", "Read(*)", "Bash(*)"]
}
```

### 5. Completion Phase

**When**: Command finishes execution

**Steps**:
1. Verify all outputs
2. Update session state (if applicable)
3. Return summary to user
4. Suggest next steps

## Nested Command Execution

### SlashCommand Tool

**Purpose**: Execute another slash command from within a command

**Syntax**:
```javascript
SlashCommand(command="/workflow:session:start --auto \"structured-description\"")
```

**Execution Flow**:
```
Current Command (e.g., /workflow:plan)
  ↓
SlashCommand("/workflow:session:start --auto ...")
  ↓ [Routing]
  ↓
Target Command (/workflow:session:start)
  ↓ [Execution]
  ↓
Return output to current command
  ↓
Current command continues
```

**Output Parsing**:
```javascript
// Execute nested command
const output = SlashCommand(command="/workflow:session:start --auto \"...\"")

// Parse output (extract sessionId)
const sessionId = output.match(/SESSION_ID: (WFS-\w+)/)?.[1]
if (!sessionId) throw new Error("Failed to extract sessionId")

// Use in next phase
SlashCommand(command="/workflow:tools:context-gather --session " + sessionId + " \"...\"")
```

**File References**:
- `.claude/commands/workflow/plan.md` (lines 85-87, 123-124): SlashCommand usage
- `.claude/commands/workflow/lite-plan.md` (lines 590): SlashCommand usage

## Tool Access Control

### allowed-tools Specification

**Format**:
```yaml
allowed-tools: SlashCommand(*), TodoWrite(*), Read(*), Bash(*)
```

**Meanings**:
- `Tool(*)`: Tool allowed with any arguments
- `Tool(arg1, arg2)`: Tool allowed only with specific arguments
- `Tool()`: Tool not allowed

**Examples**:
```yaml
# Full access to these tools
allowed-tools: SlashCommand(*), TodoWrite(*), Read(*), Bash(*)

# Restricted access
allowed-tools: Read(*.md), Bash(find, grep)

# No file write tools
allowed-tools: Read(*), Bash(*), Task(*)
```

**Validation**:
```javascript
function validateToolAccess(allowedTools, requestedTool, args) {
  const spec = allowedTools.find(t => t.startsWith(requestedTool))
  if (!spec) throw new Error(`Tool not allowed: ${requestedTool}`)

  if (spec.endsWith('(*)')) return true  // All args allowed

  // Parse allowed args: Tool(arg1, arg2)
  const allowedArgs = spec.match(/\((.*)\)/)[1].split(',').map(s => s.trim())

  // Check if requested args match allowed args
  args.forEach(arg => {
    if (!allowedArgs.includes(arg) && !allowedArgs.includes('*')) {
      throw new Error(`Argument not allowed: ${arg}`)
    }
  })
}
```

## Command Patterns

### Pattern 1: Pure Orchestrator

**Example**: `/workflow:plan`

**Characteristics**:
- Executes other commands via SlashCommand
- Parses outputs and passes to next phase
- No direct code execution
- Manages workflow state via TodoWrite

**File References**:
- `.claude/commands/workflow/plan.md` (lines 10-77): Pure orchestrator pattern

### Pattern 2: Agent Delegator

**Example**: `/workflow:tools:task-generate-agent`

**Characteristics**:
- Invokes agent via Task tool
- Waits for agent completion
- Validates agent outputs
- Returns results to user

**File References**:
- `.claude/commands/workflow/tools/task-generate-agent.md` (lines 216-240): Agent delegation

### Pattern 3: Interactive Command

**Example**: `/workflow:lite-plan`

**Characteristics**:
- Multi-phase execution with user interaction
- Uses AskUserQuestion for input collection
- Builds in-memory context
- Delegates execution to another command

**File References**:
- `.claude/commands/workflow/lite-plan.md` (lines 498-536): Interactive pattern

## Error Handling

### Command-Level Errors

| Error | Resolution |
|-------|-----------|
| Command not found | Display available commands, suggest similar |
| Invalid arguments | Show usage hint from frontmatter |
| Tool not allowed | Report which tool is restricted |
| Execution failure | Retry once, then report error |
| Output parsing fails | Log raw output, suggest manual inspection |

### Nested Command Errors

```javascript
try {
  const output = SlashCommand(command="/workflow:session:start --auto \"...\"")
  const sessionId = parseSessionId(output)
} catch (error) {
  if (error.type === 'CommandNotFound') {
    console.error(`Phase 1 failed: Command not found`)
    return
  }
  if (error.type === 'ExecutionFailure') {
    console.error(`Phase 1 failed: ${error.message}`)
    // Retry once
    const output = SlashCommand(command="/workflow:session:start --auto \"...\"")
  }
}
```

## Integration Points

**Command Discovery**:
- Scans `.claude/commands/` on startup
- Builds routing table for fast lookup
- Validates frontmatter format

**Command Execution**:
- Routes user input to correct command
- Validates tool access
- Executes implementation
- Returns results

**Nested Execution**:
- SlashCommand tool invokes other commands
- Output parsing drives next phase
- Error handling with retry logic

## Code References

**Key Files**:
- `.claude/commands/workflow/plan.md` (lines 1-552): Full command specification
- `.claude/commands/workflow/lite-plan.md` (lines 1-624): Full command specification
- `.claude/commands/issue/plan.md` (lines 1-332): Full command specification

**Key Patterns**:
- Frontmatter parsing (lines 1-10 in each file)
- SlashCommand execution (lines 85-87, 123-124)
- Output parsing (lines 103-104, 130-132)
- Error handling (lines 484-489)

## Execution Checklist

- [ ] Command registered in `.claude/commands/` with frontmatter
- [ ] Frontmatter includes: name, description, argument-hint, allowed-tools
- [ ] Command discoverable via routing table
- [ ] Tool access validated before execution
- [ ] Nested commands executed via SlashCommand
- [ ] Outputs parsed and validated
- [ ] Error handling with retry logic
- [ ] Results returned to user with next steps

## Quality Criteria

✓ Command frontmatter complete and valid
✓ Routing table built correctly
✓ Tool access control enforced
✓ Nested commands execute in correct order
✓ Outputs parsed accurately
✓ Error handling with meaningful messages
✓ User-facing documentation clear
