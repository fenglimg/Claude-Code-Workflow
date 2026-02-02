# Workflow Visualization: plan

## Overview
| Attribute | Value |
|-----------|-------|
| **Type** | command |
| **Phases** | 4 (5 with optional quality gate) |
| **Agents** | 2 (task-generate-agent, plus embedded agents in context-gather/conflict-resolution) |
| **Entry Point** | `/workflow:plan "[task description]"` |
| **Auto Mode** | `--yes` or `-y` to skip confirmations |

## Execution Flow

```mermaid
flowchart TD
    %% ==================== STYLING ====================
    classDef userNode fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef ccwNode fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef agentNode fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    classDef toolNode fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef dataNode fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef decisionNode fill:#ffccbc,stroke:#bf360c,stroke-width:2px,shape:diamond
    classDef phaseNode fill:#c8e6c9,stroke:#1b5e20,stroke-width:3px

    %% ==================== USER LAYER ====================
    subgraph USER_LAYER["👤 User Layer"]
        USER_INPUT["📝 User Input<br/>Task Description<br/>or File Reference"]
        STRUCTURED["📋 Structured Format<br/>GOAL / SCOPE / CONTEXT"]
        USER_DECISION["🎯 User Decision<br/>Next Action"]
    end

    %% ==================== CCW LAYER - PHASES ====================
    subgraph CCW_LAYER["⚙️ CCW Layer - Execution Phases"]
        direction TB

        subgraph PHASE1["🔍 Phase 1: Session Discovery"]
            P1_CMD["/workflow:session:start<br/>--auto \"structured-desc\""]
            P1_OUTPUT["📤 Output: sessionId<br/>WFS-xxx"]
            P1_NOTES["📝 Create planning-notes.md<br/>User Intent section"]
        end

        subgraph PHASE2["🔎 Phase 2: Context Gathering"]
            P2_CMD["/workflow:tools:context-gather<br/>--session [sessionId]"]
            P2_TASKS["📎 ATTACH 3 Sub-tasks:<br/>• Analyze codebase<br/>• Identify integration<br/>• Generate package"]
            P2_COLLAPSE["🔄 COLLAPSE tasks<br/>to summary"]
            P2_OUTPUT["📤 Output: contextPath<br/>+ conflict_risk"]
        end

        subgraph PHASE3["⚠️ Phase 3: Conflict Resolution<br/>(Conditional)"]
            P3_CMD["/workflow:tools:conflict-resolution<br/>--session [sessionId]"]
            P3_TASKS["📎 ATTACH 3 Sub-tasks:<br/>• Detect conflicts<br/>• Present to user<br/>• Apply strategies"]
            P3_COLLAPSE["🔄 COLLAPSE tasks<br/>to summary"]
            P3_OUTPUT["📤 Output: Modified<br/>brainstorm artifacts"]
        end

        subgraph PHASE35["🔍 Phase 3.5: Pre-Task Validation<br/>(Optional Quality Gate)"]
            P35_CHECK["Memory State Check"]
            P35_COMPACT["/compact<br/>(if needed)"]
        end

        subgraph PHASE4["✅ Phase 4: Task Generation"]
            P4_CMD["/workflow:tools:task-generate-agent<br/>--session [sessionId]"]
            P4_AGENT["🤖 Agent Task Attached<br/>(Single task - no collapse)"]
            P4_INTERNAL["Agent Internal Flow:<br/>Discovery → Planning → Output"]
            P4_OUTPUT["📤 Output:<br/>IMPL_PLAN.md<br/>IMPL-*.json<br/>TODO_LIST.md"]
        end
    end

    %% ==================== AGENT LAYER ====================
    subgraph AGENT_LAYER["🤖 Agent Layer"]
        AGENT_CONTEXT["@context-search-agent<br/>Inside context-gather"]
        AGENT_CONFLICT["@conflict-resolution-agent<br/>Inside conflict-resolution"]
        AGENT_TASK["@action-planning-agent<br/>Inside task-generate-agent"]
    end

    %% ==================== TOOL LAYER ====================
    subgraph TOOL_LAYER["🛠️ Tool Layer"]
        TOOL_SLASH["SlashCommand<br/>(workflow invocations)"]
        TOOL_TODO["TodoWrite<br/>(task tracking)"]
        TOOL_READ["Read<br/>(file operations)"]
        TOOL_WRITE["Write/Edit<br/>(planning-notes.md)"]
    end

    %% ==================== DATA LAYER ====================
    subgraph DATA_LAYER["💾 Data Layer"]
        DATA_SESSION["workflow-session.json<br/>Session metadata"]
        DATA_CONTEXT["context-package.json<br/>Prioritized context + conflict_risk"]
        DATA_NOTES["planning-notes.md<br/>Consolidated constraints"]
        DATA_PLAN["IMPL_PLAN.md<br/>Implementation plan"]
        DATA_TASKS["IMPL-*.json<br/>Task definitions"]
        DATA_TODO["TODO_LIST.md<br/>Task list"]
    end

    %% ==================== FLOW CONNECTIONS ====================
    USER_INPUT --> STRUCTURED
    STRUCTURED --> P1_CMD

    %% Phase 1 flow
    P1_CMD --> P1_OUTPUT
    P1_OUTPUT --> P1_NOTES
    P1_NOTES --> P2_CMD

    %% Phase 2 flow
    P2_CMD --> P2_TASKS
    P2_TASKS --> P2_COLLAPSE
    P2_COLLAPSE --> P2_OUTPUT
    P2_OUTPUT --> CONFLICT_CHECK{conflict_risk<br/>≥ medium?}

    %% Conflict decision
    CONFLICT_CHECK -->|Yes| P3_CMD
    CONFLICT_CHECK -->|No| P35_CHECK

    %% Phase 3 flow
    P3_CMD --> P3_TASKS
    P3_TASKS --> P3_COLLAPSE
    P3_COLLAPSE --> P3_OUTPUT
    P3_OUTPUT --> P35_CHECK

    %% Phase 3.5 flow
    P35_CHECK -->|High memory| P35_COMPACT
    P35_CHECK -->|Normal| P4_CMD
    P35_COMPACT --> P4_CMD

    %% Phase 4 flow
    P4_CMD --> P4_AGENT
    P4_AGENT --> P4_INTERNAL
    P4_INTERNAL --> P4_OUTPUT
    P4_OUTPUT --> USER_DECISION

    %% Agent connections
    P2_CMD -.-> AGENT_CONTEXT
    P3_CMD -.-> AGENT_CONFLICT
    P4_CMD -.-> AGENT_TASK

    %% Tool connections
    P1_CMD -.-> TOOL_SLASH
    P2_CMD -.-> TOOL_SLASH
    P3_CMD -.-> TOOL_SLASH
    P4_CMD -.-> TOOL_SLASH
    TOOL_TODO -.-> P2_TASKS
    TOOL_TODO -.-> P3_TASKS
    TOOL_TODO -.-> P4_AGENT

    %% Data connections
    P1_OUTPUT -.-> DATA_SESSION
    P2_OUTPUT -.-> DATA_CONTEXT
    P1_NOTES -.-> DATA_NOTES
    P3_OUTPUT -.-> DATA_NOTES
    P4_OUTPUT -.-> DATA_PLAN
    P4_OUTPUT -.-> DATA_TASKS
    P4_OUTPUT -.-> DATA_TODO

    %% ==================== CLASS ASSIGNMENTS ====================
    class USER_INPUT,STRUCTURED,USER_DECISION userNode
    class P1_CMD,P2_CMD,P3_CMD,P4_CMD,P35_COMPACT ccwNode
    class P1_OUTPUT,P2_OUTPUT,P3_OUTPUT,P4_OUTPUT,P2_TASKS,P3_TASKS,P4_AGENT,P2_COLLAPSE,P3_COLLAPSE,P4_INTERNAL,P35_CHECK dataNode
    class AGENT_CONTEXT,AGENT_CONFLICT,AGENT_TASK agentNode
    class TOOL_SLASH,TOOL_TODO,TOOL_READ,TOOL_WRITE toolNode
    class CONFLICT_CHECK decisionNode
    class PHASE1,PHASE2,PHASE3,PHASE35,PHASE4 phaseNode

    %% ==================== CLICK EVENTS ====================
    click P1_CMD "/workflow:session:start"
    click P2_CMD "/workflow:tools:context-gather"
    click P3_CMD "/workflow:tools:conflict-resolution"
    click P4_CMD "/workflow:tools:task-generate-agent"
```

## Phase Details

| Phase | Description | Agent/Tool | Output |
|-------|-------------|------------|--------|
| **Phase 1** | Session Discovery | `/workflow:session:start` | sessionId (WFS-xxx) |
| **Phase 2** | Context Gathering | `/workflow:tools:context-gather` | context-package.json + conflict_risk |
| **Phase 3** | Conflict Resolution (Conditional) | `/workflow:tools:conflict-resolution` | Modified brainstorm artifacts |
| **Phase 3.5** | Pre-Task Validation (Optional) | `/compact` (if needed) | Memory optimization |
| **Phase 4** | Task Generation | `/workflow:tools:task-generate-agent` | IMPL_PLAN.md, task JSONs, TODO_LIST.md |

## Task Attachment Pattern

```mermaid
flowchart LR
    subgraph "Phase 2 & 3 Pattern"
        A[SlashCommand<br/>Executed] --> B[ATTACH<br/>3 Sub-tasks]
        B --> C[Execute<br/>Sequentially]
        C --> D[COLLAPSE to<br/>Summary]
    end

    subgraph "Phase 4 Pattern"
        E[SlashCommand<br/>Executed] --> F[ATTACH<br/>1 Agent Task]
        F --> G[Agent Autonomous<br/>Execution]
        G --> H[Mark<br/>Completed]
    end

    style A fill:#fff3e0,stroke:#e65100
    style B fill:#fff9c4,stroke:#f57f17
    style C fill:#e8f5e9,stroke:#2e7d32
    style D fill:#c8e6c9,stroke:#1b5e20
    style E fill:#fff3e0,stroke:#e65100
    style F fill:#fff9c4,stroke:#f57f17
    style G fill:#e8f5e9,stroke:#2e7d32
    style H fill:#c8e6c9,stroke:#1b5e20
```

## Data Flow

```mermaid
flowchart TD
    INPUT["📝 User Input<br/>Task Description"] --> STRUCTURED["📋 Structured Format<br/>GOAL / SCOPE / CONTEXT"]

    STRUCTURED --> P1["🔍 Phase 1<br/>Session Discovery"]
    P1 --> SESSION["💾 Session ID<br/>WFS-xxx"]
    P1 --> NOTES1["📝 planning-notes.md<br/>User Intent Section"]

    SESSION --> P2["🔎 Phase 2<br/>Context Gathering"]
    STRUCTURED --> P2
    P2 --> CONTEXT["💾 context-package.json<br/>+ conflict_risk"]
    P2 --> NOTES2["📝 Update planning-notes.md<br/>Context Findings"]

    CONTEXT --> CHECK{conflict_risk<br/>≥ medium?}
    CHECK -->|Yes| P3["⚠️ Phase 3<br/>Conflict Resolution"]
    CHECK -->|No| P35["🔍 Phase 3.5<br/>Pre-Task Validation"]

    P3 --> CONFLICT["💾 conflict-resolution.json<br/>Modified Artifacts"]
    P3 --> NOTES3["📝 Update planning-notes.md<br/>Conflict Decisions"]
    P3 --> P35

    P35 --> P4["✅ Phase 4<br/>Task Generation"]
    NOTES3 --> P4
    CONTEXT --> P4

    P4 --> PLAN["📄 IMPL_PLAN.md<br/>Implementation Plan"]
    P4 --> TASKS["📄 IMPL-*.json<br/>Task Definitions"]
    P4 --> TODOLIST["📄 TODO_LIST.md<br/>Task List"]

    P4 --> DECISION["🎯 User Decision<br/>Verify / Execute / Review"]

    style INPUT fill:#e1f5fe,stroke:#01579b
    style STRUCTURED fill:#fff9c4,stroke:#f57f17
    style P1 fill:#fff3e0,stroke:#e65100
    style P2 fill:#fff3e0,stroke:#e65100
    style P3 fill:#fff3e0,stroke:#e65100
    style P35 fill:#fff3e0,stroke:#e65100
    style P4 fill:#fff3e0,stroke:#e65100
    style SESSION fill:#c8e6c9,stroke:#1b5e20
    style CONTEXT fill:#c8e6c9,stroke:#1b5e20
    style CONFLICT fill:#c8e6c9,stroke:#1b5e20
    style NOTES1 fill:#f3e5f5,stroke:#7b1fa2
    style NOTES2 fill:#f3e5f5,stroke:#7b1fa2
    style NOTES3 fill:#f3e5f5,stroke:#7b1fa2
    style PLAN fill:#e8f5e9,stroke:#2e7d32
    style TASKS fill:#e8f5e9,stroke:#2e7d32
    style TODOLIST fill:#e8f5e9,stroke:#2e7d32
    style DECISION fill:#e1f5fe,stroke:#01579b
    style CHECK fill:#ffccbc,stroke:#bf360c
```

## TodoWrite State Transitions

| Stage | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|-------|---------|---------|---------|---------|
| **Initial** | pending | pending | pending | pending |
| **After Phase 1** | completed | in_progress | pending | pending |
| **Phase 2 Attached** | completed | in_progress | - | pending |
| | | → Analyze (in_progress) | | |
| | | → Identify (pending) | | |
| | | → Generate (pending) | | |
| **Phase 2 Collapsed** | completed | completed | pending | pending |
| **After Phase 3 (if executed)** | completed | completed | completed | pending |
| **Phase 4 Attached** | completed | completed | completed* | in_progress |
| **Final** | completed | completed | completed* | completed |

*Phase 3 only appears if conflict_risk ≥ medium

## Agent Hierarchy

```
/workflow:plan (Orchestrator)
├── /workflow:session:start
│   └── (internal session management)
├── /workflow:tools:context-gather
│   └── @context-search-agent
│       ├── Analyze codebase structure
│       ├── Identify integration points
│       └── Generate context package
├── /workflow:tools:conflict-resolution (conditional)
│   └── @conflict-resolution-agent
│       ├── Detect conflicts with CLI analysis
│       ├── Present conflicts to user
│       └── Apply resolution strategies
└── /workflow:tools:task-generate-agent
    └── @action-planning-agent
        ├── Discovery phase
        ├── Planning phase
        └── Output generation
            ├── IMPL_PLAN.md
            ├── IMPL-*.json files
        └── TODO_LIST.md
```

## Related Commands

### Prerequisite Commands
- `/workflow:brainstorm:artifacts` - Optional: Generate role-based analyses before planning
- `/workflow:brainstorm:synthesis` - Optional: Refine brainstorm analyses with clarifications

### Called by This Command
| Command | Phase | Purpose |
|---------|-------|---------|
| `/workflow:session:start` | 1 | Create or discover workflow session |
| `/workflow:tools:context-gather` | 2 | Gather project context and analyze codebase |
| `/workflow:tools:conflict-resolution` | 3 | Detect and resolve conflicts (auto-triggered) |
| `/compact` | 3.5 | Memory optimization (if context approaching limits) |
| `/workflow:tools:task-generate-agent` | 4 | Generate task JSON files with agent-driven approach |

### Follow-up Commands
- `/workflow:plan-verify` - Recommended: Verify plan quality before execution
- `/workflow:status` - Review task breakdown and current progress
- `/workflow:execute` - Begin implementation of generated tasks
