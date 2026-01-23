# T7: CCW Server Integration - Streaming, Hooks, WebSocket, and State Sync

## Overview

CCW (Claude Code Workflow) server provides the backend infrastructure for Claude Code Workflow. It handles streaming responses, webhook callbacks, WebSocket communication, and distributed state synchronization.

**Core Principle**: Event-driven architecture with real-time streaming, asynchronous callbacks, and eventual consistency.

## Architecture

### Server Components

```
┌─ HTTP Server
│  ├─ REST API endpoints
│  ├─ Streaming responses
│  └─ Webhook callbacks
│
├─ WebSocket Server
│  ├─ Real-time bidirectional communication
│  ├─ Session state sync
│  └─ Progress updates
│
├─ State Store
│  ├─ Session metadata
│  ├─ Task state
│  └─ Artifact cache
│
└─ Event Bus
   ├─ Task completion events
   ├─ State change events
   └─ Error events
```

## Streaming Responses

### CLI Streaming

**Purpose**: Stream CLI tool responses (Gemini, Qwen, Codex) in real-time

**Protocol**:
```
Client Request:
  POST /api/cli/stream
  {
    "tool": "gemini",
    "mode": "analysis",
    "prompt": "...",
    "context": "@**/*"
  }

Server Response (streaming):
  HTTP/1.1 200 OK
  Content-Type: text/event-stream
  Transfer-Encoding: chunked

  data: {"type": "start", "tool": "gemini"}
  data: {"type": "chunk", "content": "Analysis of..."}
  data: {"type": "chunk", "content": " the codebase..."}
  data: {"type": "complete", "result": "..."}
```

**Implementation**:
```javascript
// Server-side streaming
app.post('/api/cli/stream', async (req, res) => {
  const { tool, mode, prompt, context } = req.body

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    // Execute CLI tool
    const stream = await executeCLITool(tool, { mode, prompt, context })

    // Stream chunks
    stream.on('data', (chunk) => {
      res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`)
    })

    stream.on('end', () => {
      res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`)
      res.end()
    })

    stream.on('error', (error) => {
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`)
      res.end()
    })
  } catch (error) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`)
    res.end()
  }
})
```

**Client-Side Consumption**:
```javascript
// Client reads streaming response
const response = await fetch('/api/cli/stream', {
  method: 'POST',
  body: JSON.stringify({ tool: 'gemini', mode: 'analysis', prompt: '...' })
})

const reader = response.body.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  const text = decoder.decode(value)
  const lines = text.split('\n')

  lines.forEach(line => {
    if (line.startsWith('data: ')) {
      const event = JSON.parse(line.slice(6))
      handleStreamEvent(event)
    }
  })
}
```

## Webhook Callbacks

### Task Completion Hooks

**Purpose**: Notify orchestrator when agent tasks complete

**Hook Registration**:
```javascript
// Register hook when launching agent
const taskId = Task(
  subagent_type="cli-explore-agent",
  run_in_background=true,
  prompt="...",
  webhook_url="https://ccw-server/api/hooks/task-complete"
)
```

**Hook Payload**:
```json
{
  "event": "task.complete",
  "task_id": "task-123",
  "status": "success",
  "result": {
    "type": "exploration",
    "angle": "security",
    "output_path": ".workflow/.lite-plan/task-123/exploration-security.json"
  },
  "timestamp": "2025-01-23T10:30:00Z"
}
```

**Server-Side Hook Handler**:
```javascript
app.post('/api/hooks/task-complete', async (req, res) => {
  const { task_id, status, result } = req.body

  try {
    // Update task state
    await updateTaskState(task_id, { status, result })

    // Emit event to WebSocket clients
    broadcastEvent({
      type: 'task.complete',
      task_id,
      status,
      result
    })

    // Trigger next phase if applicable
    const nextPhase = determineNextPhase(task_id)
    if (nextPhase) {
      await executeNextPhase(nextPhase)
    }

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})
```

**Hook Types**:
- `task.complete`: Agent task completed
- `task.error`: Agent task failed
- `phase.complete`: Workflow phase completed
- `state.change`: Session state changed

## WebSocket Communication

### Real-Time State Sync

**Purpose**: Synchronize session state and progress in real-time

**Connection Lifecycle**:
```
Client connects:
  ws://ccw-server/api/ws?session_id=WFS-123

Server sends:
  {"type": "connected", "session_id": "WFS-123"}

Client subscribes to updates:
  {"type": "subscribe", "channels": ["session:WFS-123", "tasks:*"]}

Server sends updates:
  {"type": "update", "channel": "session:WFS-123", "data": {...}}
```

**Implementation**:
```javascript
// Server-side WebSocket handler
const wss = new WebSocketServer({ port: 8080 })

wss.on('connection', (ws, req) => {
  const sessionId = new URL(req.url, 'http://localhost').searchParams.get('session_id')

  // Send connection confirmation
  ws.send(JSON.stringify({ type: 'connected', session_id: sessionId }))

  // Handle client messages
  ws.on('message', (message) => {
    const event = JSON.parse(message)

    if (event.type === 'subscribe') {
      // Subscribe to channels
      event.channels.forEach(channel => {
        subscribeToChannel(ws, channel)
      })
    }
  })

  // Send state updates
  const stateListener = (update) => {
    ws.send(JSON.stringify({
      type: 'update',
      channel: `session:${sessionId}`,
      data: update
    }))
  }

  registerStateListener(sessionId, stateListener)

  ws.on('close', () => {
    unregisterStateListener(sessionId, stateListener)
  })
})
```

**Client-Side WebSocket**:
```javascript
// Client connects and subscribes
const ws = new WebSocket(`ws://ccw-server/api/ws?session_id=WFS-123`)

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    channels: ['session:WFS-123', 'tasks:*']
  }))
}

ws.onmessage = (event) => {
  const message = JSON.parse(event.data)

  if (message.type === 'update') {
    updateUIWithState(message.data)
  }
}
```

### Progress Updates

**Progress Event Format**:
```json
{
  "type": "progress",
  "session_id": "WFS-123",
  "phase": "Phase 2: Context Gathering",
  "current_step": 2,
  "total_steps": 3,
  "percentage": 67,
  "message": "Analyzing codebase structure...",
  "timestamp": "2025-01-23T10:30:00Z"
}
```

**Broadcasting Progress**:
```javascript
// Broadcast progress to all connected clients
function broadcastProgress(sessionId, progress) {
  const clients = getClientsForSession(sessionId)

  clients.forEach(client => {
    client.send(JSON.stringify({
      type: 'progress',
      session_id: sessionId,
      ...progress
    }))
  })
}
```

## State Synchronization

### Session State Store

**State Structure**:
```javascript
{
  session_id: "WFS-123",
  status: "in_progress",  // pending, in_progress, completed, failed
  current_phase: "Phase 2",
  phases: {
    "Phase 1": { status: "completed", output: {...} },
    "Phase 2": { status: "in_progress", output: null },
    "Phase 3": { status: "pending", output: null }
  },
  tasks: {
    "task-1": { status: "completed", result: {...} },
    "task-2": { status: "in_progress", result: null }
  },
  memory: {
    sessionId: "WFS-123",
    contextPath: ".workflow/active/WFS-123/.process/context-package.json",
    conflictRisk: "medium"
  },
  created_at: "2025-01-23T10:00:00Z",
  updated_at: "2025-01-23T10:30:00Z"
}
```

**State Update Protocol**:
```javascript
// Update state atomically
async function updateSessionState(sessionId, updates) {
  const session = await getSession(sessionId)

  // Merge updates
  const newState = { ...session, ...updates, updated_at: new Date().toISOString() }

  // Validate state transition
  validateStateTransition(session, newState)

  // Persist state
  await persistState(sessionId, newState)

  // Broadcast to clients
  broadcastStateChange(sessionId, newState)

  return newState
}
```

### Eventual Consistency

**Conflict Resolution**:
```javascript
// Last-write-wins strategy
function mergeStateUpdates(current, update1, update2) {
  // Compare timestamps
  if (update1.timestamp > update2.timestamp) {
    return update1
  } else {
    return update2
  }
}

// Vector clock for causal ordering
function compareVectorClocks(vc1, vc2) {
  // Returns: -1 (vc1 < vc2), 0 (concurrent), 1 (vc1 > vc2)
  let hasGreater = false
  let hasLess = false

  for (const key in vc1) {
    if (vc1[key] > (vc2[key] || 0)) hasGreater = true
    if (vc1[key] < (vc2[key] || 0)) hasLess = true
  }

  if (hasGreater && !hasLess) return 1
  if (hasLess && !hasGreater) return -1
  return 0
}
```

## API Endpoints

### Core Endpoints

**Session Management**:
```
GET /api/sessions/{sessionId}
  → Retrieve session metadata and state

POST /api/sessions
  → Create new session

PUT /api/sessions/{sessionId}
  → Update session state

DELETE /api/sessions/{sessionId}
  → Archive session
```

**Task Management**:
```
GET /api/tasks/{taskId}
  → Retrieve task status and result

POST /api/tasks
  → Create new task

PUT /api/tasks/{taskId}
  → Update task state

GET /api/tasks?session_id={sessionId}
  → List tasks for session
```

**Artifact Management**:
```
GET /api/artifacts/{sessionId}/{artifactPath}
  → Retrieve artifact (IMPL_PLAN.md, task JSON, etc.)

POST /api/artifacts/{sessionId}
  → Upload artifact

DELETE /api/artifacts/{sessionId}/{artifactPath}
  → Delete artifact
```

## Error Handling

### Server-Side Error Handling

```javascript
// Global error handler
app.use((error, req, res, next) => {
  const errorId = generateErrorId()

  console.error(`[${errorId}] ${error.message}`, error)

  // Determine error type
  let statusCode = 500
  let errorType = 'INTERNAL_ERROR'

  if (error.type === 'ValidationError') {
    statusCode = 400
    errorType = 'VALIDATION_ERROR'
  } else if (error.type === 'NotFoundError') {
    statusCode = 404
    errorType = 'NOT_FOUND'
  } else if (error.type === 'TimeoutError') {
    statusCode = 504
    errorType = 'TIMEOUT'
  }

  res.status(statusCode).json({
    error: {
      id: errorId,
      type: errorType,
      message: error.message,
      timestamp: new Date().toISOString()
    }
  })
})
```

### Retry Logic

```javascript
// Exponential backoff retry
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error

      const delay = Math.pow(2, i) * 1000  // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}
```

## Integration Points

**CLI Tool Execution**:
- Stream responses from Gemini, Qwen, Codex
- Handle timeouts and errors
- Broadcast progress updates

**Agent Task Management**:
- Register webhook callbacks
- Track task completion
- Trigger next phase

**Session State**:
- Persist session metadata
- Synchronize state across clients
- Handle concurrent updates

**Artifact Storage**:
- Store IMPL_PLAN.md, task JSONs
- Retrieve artifacts for display
- Archive completed sessions

## Code References

**Key Files**:
- `ccw/server/api.js`: REST API endpoints
- `ccw/server/websocket.js`: WebSocket server
- `ccw/server/state-store.js`: Session state management
- `ccw/server/hooks.js`: Webhook callback handlers

**Key Patterns**:
- Streaming responses (HTTP/1.1 chunked transfer)
- WebSocket bidirectional communication
- Event-driven state updates
- Eventual consistency with vector clocks

## Execution Checklist

- [ ] HTTP server running on configured port
- [ ] WebSocket server accepting connections
- [ ] Streaming responses working for CLI tools
- [ ] Webhook callbacks registered and triggered
- [ ] Session state persisted and synchronized
- [ ] Error handling with meaningful messages
- [ ] Retry logic with exponential backoff
- [ ] Progress updates broadcast to clients

## Quality Criteria

✓ Streaming responses low-latency
✓ WebSocket connections stable
✓ State synchronization eventual consistent
✓ Error handling comprehensive
✓ Webhook callbacks reliable
✓ Progress updates real-time
