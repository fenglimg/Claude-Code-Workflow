# CCW Server Architecture

## Overview

CCW includes a built-in HTTP/WebSocket server for the dashboard and API endpoints.

## Server Components

### Main Server
**File**: `ccw/src/core/server.ts`

The main server provides:
- HTTP API endpoints
- WebSocket connections
- Static file serving for dashboard

### WebSocket Server
**File**: `ccw/src/core/websocket.ts`

Real-time communication for:
- Session updates
- CLI execution progress
- Team collaboration messages

## Server Configuration

### Default Ports
- HTTP: 3000 (configurable)
- WebSocket: Same as HTTP

### Authentication
JWT-based authentication for API access.

```typescript
// Token generation
const token = jwt.sign({ userId }, SECRET_KEY, { expiresIn: '24h' });
```

## API Endpoints

### Session Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sessions` | GET | List all sessions |
| `/api/sessions/:id` | GET | Get session details |
| `/api/sessions/:id` | DELETE | Delete session |
| `/api/sessions/scan` | POST | Scan for new sessions |

### CLI Execution

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/cli/execute` | POST | Execute CLI command |
| `/api/cli/history` | GET | Get execution history |
| `/api/cli/resume/:id` | POST | Resume execution |

### Memory Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/memory` | GET | Get memory store |
| `/api/memory/capture` | POST | Capture context |
| `/api/memory/search` | POST | Search memory |

### CodexLens

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/codexlens/index` | POST | Create index |
| `/api/codexlens/search` | POST | Search code |
| `/api/codexlens/status` | GET | Get index status |

### Team Collaboration

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/team/sessions` | GET | List team sessions |
| `/api/team/create` | POST | Create team session |
| `/api/team/join/:id` | POST | Join team session |
| `/api/team/messages` | GET | Get team messages |

## Dashboard Features

### Session Overview
- Active sessions list
- Progress tracking
- Resource usage

### CodexLens Manager
- Index management
- Search interface
- Result visualization

### Graph Explorer
- Code relationship visualization
- Interactive graph navigation

### CLI Manager
- Execution history
- Session resume
- Result viewing

## Data Aggregation

**File**: `ccw/src/core/data-aggregator.ts`

Aggregates data from multiple sources:
- Session files
- Memory store
- CLI history
- Team messages

## Cache Management

**File**: `ccw/src/core/cache-manager.ts`

In-memory caching for:
- Session data
- Search results
- API responses

## History Import

**File**: `ccw/src/core/history-importer.ts`

Imports conversation history from:
- Claude conversations
- CLI executions
- Team sessions

## Session Clustering

**File**: `ccw/src/core/session-clustering-service.ts`

Groups related sessions for:
- Topic analysis
- Context continuity
- Knowledge extraction

## Server Startup

```bash
ccw view    # Starts server and opens dashboard
```

Server initialization sequence:
1. Load configuration
2. Initialize memory store
3. Scan for sessions
4. Start HTTP server
5. Start WebSocket server
6. Open browser (if not headless)

## Security

### CORS Configuration
**File**: `ccw/src/core/cors.ts`

Configured for local development:
- Origin validation
- Credential support
- Method restrictions

### Authentication Flow

```
Client Request
      │
      ▼
┌─────────────┐
│   JWT       │
│   Verify    │
└─────┬───────┘
      │
      ├─── Valid ──→ Process Request
      │
      └─── Invalid ──→ 401 Unauthorized
```

## Performance Considerations

1. **Caching**: Use cache for frequent queries
2. **Pagination**: Implement for large datasets
3. **WebSocket**: Use for real-time updates
4. **Connection Pooling**: For database connections

## Troubleshooting

### Port Already in Use
```bash
# Find and kill process using port
lsof -i :3000
kill -9 <PID>
```

### Dashboard Not Loading
- Check server logs
- Verify build completed
- Check browser console

### WebSocket Disconnects
- Check network stability
- Verify heartbeat settings
- Check server logs
