# MCP (Model Context Protocol) Integration

## Overview

CCW supports MCP (Model Context Protocol) for extending functionality with external tools and servers.

## Configuration

MCP servers are configured in `.mcp.json`:

```json
{
  "mcpServers": {
    "server-name": {
      "type": "http",
      "url": "https://api.example.com/mcp"
    }
  }
}
```

## MCP Server Types

### HTTP Servers
Connect to remote MCP servers via HTTP.

```json
{
  "type": "http",
  "url": "https://api.example.com/mcp_server/v1?mcpKey=xxx"
}
```

### Stdio Servers
Connect to local MCP servers via stdio.

```json
{
  "type": "stdio",
  "command": "node",
  "args": ["path/to/server.js"]
}
```

## Built-in MCP Tools

### CCW MCP Server
**Path**: `ccw/src/mcp-server/`

CCW provides its own MCP server for external tools to interact with CCW functionality.

**Available Tools**:
- File operations (read, write, edit)
- Context search
- Session management
- Team messaging

### MCP Tools Available

| Tool | Description |
|------|-------------|
| `mcp__ccw-tools__read_file` | Read file contents |
| `mcp__ccw-tools__write_file` | Write file contents |
| `mcp__ccw-tools__edit_file` | Edit file with modes |
| `mcp__ccw-tools__team_msg` | Team messaging |
| `mcp__ace-tool__search_context` | ACE semantic search |
| `mcp__web_reader__webReader` | Web content reader |
| `mcp__4_5v_mcp__analyze_image` | Image analysis |

## ACE Tool (Augment Context Engine)

ACE provides powerful semantic code search capabilities.

### Configuration

1. Install ACE MCP server
2. Configure in `.mcp.json`:

```json
{
  "mcpServers": {
    "ace-tool": {
      "type": "stdio",
      "command": "path/to/ace-server"
    }
  }
}
```

### Usage

```typescript
mcp__ace-tool__search_context({
  project_root_path: "/path/to/project",
  query: "authentication logic"
})
```

### Search Types

- **Semantic**: Natural language queries
- **Exact**: Precise pattern matching
- **Hybrid**: Combined approach

## Web Reader

Fetch and convert web content to markdown.

```typescript
mcp__web_reader__webReader({
  url: "https://example.com/docs",
  return_format: "markdown"
})
```

## Image Analysis

Analyze images with AI vision models.

```typescript
mcp__4_5v_mcp__analyze_image({
  imageSource: "https://example.com/image.png",
  prompt: "Describe the UI components"
})
```

## Feishu Project Integration

Connect to Feishu project management.

```typescript
mcp__feishu-project-mcp__get_workitem_brief({
  work_item_id: "123",
  fields: ["name", "status", "assignee"]
})
```

### Available Operations

- `get_workitem_brief` - Get work item details
- `get_workitem_info` - Get work item type info
- `create_workitem` - Create new work item
- `update_field` - Update work item fields
- `search_by_mql` - Search using MOQL
- `get_view_detail` - Get view details
- `get_node_detail` - Get node details
- `finish_node` - Complete a node

## Best Practices

1. **Security**: Never commit API keys to version control
2. **Performance**: Use caching for frequent queries
3. **Error Handling**: Always handle MCP tool failures gracefully
4. **Rate Limiting**: Respect API rate limits

## Troubleshooting

### MCP Server Not Found
- Check `.mcp.json` configuration
- Verify server is running
- Check network connectivity

### Authentication Errors
- Verify API keys are valid
- Check key permissions
- Ensure keys are not expired

### Timeout Errors
- Increase timeout settings
- Check server health
- Optimize query complexity
