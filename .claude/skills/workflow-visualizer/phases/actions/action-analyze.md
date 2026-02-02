# Action: Analyze Flow Graph

Build node-edge graph representing workflow execution flow.

## Input

```json
{
  "parsed_data": {
    "type": "command|skill",
    "phases": [...],
    "agents": [...],
    "tools": [...]
  }
}
```

## Task

1. **Create Nodes**
   - User entry points
   - CCW orchestration steps
   - Phase boundaries
   - Agent invocations
   - Tool executions
   - Decision points
   - Terminal states

2. **Create Edges**
   - Sequential flow between actions
   - Phase transitions
   - Conditional branches
   - Loop backs
   - Parallel flows

3. **Group into Subgraphs**
   - User Interaction Layer
   - CCW Orchestration Layer
   - Phase-specific subgraphs (if detail=full)
   - Agent Execution Layer
   - Tool Integration Layer

## Node Types

| Type | Shape | Color | Description |
|------|-------|-------|-------------|
| `user` | Stadium | #e1f5fe | User actions, entry points |
| `ccw` | Rectangle | #fff3e0 | CCW orchestration steps |
| `phase` | Subroutine | #e3f2fd | Phase boundaries |
| `agent` | Rectangle | #e8f5e9 | Agent invocations |
| `tool` | Cylinder | #f3e5f5 | Tool executions |
| `decision` | Diamond | #fff8e1 | Decision points |
| `terminal` | Stadium | #ffebee | End states |

## Output Format

```json
{
  "status": "analyzing|completed|error",
  "flow_graph": {
    "nodes": [
      {
        "id": "node-id",
        "type": "user|ccw|phase|agent|tool|decision|terminal",
        "label": "display text",
        "subgraph": "layer-name",
        "details": "additional info (optional)"
      }
    ],
    "edges": [
      {
        "from": "node-a",
        "to": "node-b",
        "label": "condition or description",
        "style": "solid|dashed|thick"
      }
    ],
    "subgraphs": [
      {
        "name": "layer-name",
        "label": "Display Name",
        "nodes": ["node-id-1", "node-id-2"]
      }
    ]
  }
}
```

## Subgraph Layers

### Simple Detail Level
```
User → CCW → Agent → Output
```

### Standard Detail Level
```
User → CCW → Phase 1 → Phase 2 → Agent → Output
```

### Full Detail Level
```
User → CCW → Phase 1 → [Action 1 → Action 2] → Agent → [Tool 1 → Tool 2] → Output
```

## Analysis Rules

### Node Generation

1. **Entry Node**: Always start with `START(["Trigger: {name}"])`

2. **Phase Nodes**: Create for each phase
   - ID: `phase-{n}`
   - Label: Phase name
   - Subgraph: `ccw-layer` or standalone

3. **Action Nodes**: Create for each action (standard/full detail)
   - SlashCommand → `ccw` type
   - Task() → `agent` type
   - Tool call → `tool` type
   - AskUserQuestion → `decision` type

4. **Agent Nodes**: Group agent calls
   - Label: "@agent-name"
   - Subgraph: `agent-layer`

5. **Terminal Nodes**: End states
   - Success: `END_SUCCESS(["✓ Complete"])`
   - Error: `END_ERROR(["✗ Error"])`

### Edge Generation

1. **Sequential**: Solid line `-->`
2. **Conditional**: Labeled ` -->|"condition"| `
3. **Loop**: Dashed line `-.->`
4. **Parallel**: Multiple edges from same node

## Example Graph Structure

```javascript
{
  "nodes": [
    { "id": "START", "type": "user", "label": "Trigger: plan", "subgraph": "user" },
    { "id": "PARSE", "type": "ccw", "label": "Parse Input", "subgraph": "ccw" },
    { "id": "PHASE1", "type": "phase", "label": "Session Discovery", "subgraph": "ccw" },
    { "id": "AGENT1", "type": "agent", "label": "@context-search-agent", "subgraph": "agent" },
    { "id": "END", "type": "terminal", "label": "✓ Complete", "subgraph": "terminal" }
  ],
  "edges": [
    { "from": "START", "to": "PARSE", "style": "solid" },
    { "from": "PARSE", "to": "PHASE1", "style": "solid" },
    { "from": "PHASE1", "to": "AGENT1", "style": "solid" },
    { "from": "AGENT1", "to": "END", "style": "solid" }
  ],
  "subgraphs": [
    { "name": "user", "label": "👤 User", "nodes": ["START"] },
    { "name": "ccw", "label": "⚙️ CCW", "nodes": ["PARSE", "PHASE1"] },
    { "name": "agent", "label": "🤖 Agents", "nodes": ["AGENT1"] },
    { "name": "terminal", "label": "🏁 End", "nodes": ["END"] }
  ]
}
```
