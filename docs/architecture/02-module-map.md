# 模块关系图

> **层级**: L2 — 模块关系 | **更新**: 2026-05-03

## 模块依赖拓扑

```
                    ┌──────────────────────┐
                    │   Slash Commands (38) │
                    │   /ccw /ccw-help ...  │
                    └──────────┬───────────┘
                               │ invoke
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                     ccw-core (232 TS)                         │
│                                                              │
│  ┌─────────┐   ┌──────────┐   ┌────────────┐   ┌─────────┐ │
│  │ CLI     │──▶│ Command  │──▶│ Tool       │──▶│ Executor│ │
│  │ Entry   │   │ Layer    │   │ Registry   │   │ Core    │ │
│  │ cli.ts  │   │ ×22      │   │ index.ts   │   │ 3-tier  │ │
│  └─────────┘   └──────────┘   └────────────┘   └────┬────┘ │
│                                                     │       │
│  ┌──────────────────────────────────────────────────┤       │
│  │  Orchestration                                   │       │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────┴────┐ │
│  │  │ Chain    │  │ Flow     │  │ Loop     │  │ Queue   │ │
│  │  │ Loader   │  │ Executor │  │ Manager  │  │Scheduler│ │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│  │                                                         │
│  │  Services & Persistence                                 │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │  │ Memory   │  │ Session  │  │ HTTP     │  │MCP     │ │
│  │  │ RRF Fus. │  │ 3-tier   │  │ 45 routes│  │Server  │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
│  └─────────────────────────────────────────────────────────┘
└──────────────┬────────────────────────────┬──────────────────┘
               │                            │
               ▼                            ▼
    ┌──────────────────┐        ┌──────────────────────────────────┐
    │ LLM Backends     │        │ External Python Services         │
    │ ┌──────────────┐ │        │ (pip install, 0 git-tracked src) │
    │ │ builtin      │ │        │ ┌──────────────────────────────┐ │
    │ │ gemini/qwen  │ │        │ │ ccw-litellm (Py)            │ │
    │ │ codex/claude │ │        │ │ LiteLLM Proxy               │ │
    │ │ opencode     │ │        │ └──────────────────────────────┘ │
    │ └──────────────┘ │        │ ┌──────────────────────────────┐ │
    │ ┌──────────────┐ │        │ │ codex-lens (Py)             │ │
    │ │ api-endpoint  │ │        │ │ Hybrid Search               │ │
    │ │ (LiteLLM)    │ │        │ └──────────────────────────────┘ │
    │ └──────────────┘ │        └──────────────────────────────────┘
               │
               ▼
    ┌──────────────────────────────────────────────┐
    │         React Frontend (562 files)            │
    │  Dashboard · xterm · React Flow · 40+ pages  │
    │  A2UI WebSocket · JWT Auth                   │
    └──────────────────────────────────────────────┘
```

## 模块职责矩阵

| 模块 | 类别 | 文件 | 核心入口 | 上游依赖 | 下游消费者 |
|------|------|------|---------|---------|-----------|
| ccw-core | core | 238 | cli.ts, server.ts | npm (commander, zod, better-sqlite3, node-pty) | frontend, MCP clients |
| frontend | core | 562 | React SPA | ccw-core HTTP/WS API | 用户浏览器 |
| workflow-skills | core | 105 | SKILL.md ×105 | ccw-core (skill-context-loader) | Claude/Codex agents |
| workflow-agents | core | 50 | .md/.toml role defs | workflow-skills (Skill() invoke) | ccw-core (agent spawn) |
| workflow-commands | core | 28 | ccw.md orchestrator | workflow-skills + workflow-agents | 用户 CLI |
| ccw-litellm | external | 0 | Python pkg (pip install) | none | ccw-core (api-endpoint routing) |
| codex-lens | external | 0 | Python pkg (pip install) | none | ccw-core (MCP/HTTP) |
| config-ecosystem | meta | 30 | cli-tools.json, 23 schemas | none | ccw-core (config loaders) |

## 依赖规则

- **无循环依赖** — 所有模块依赖单向流动
- **ccw-core 是中心枢纽** — 不依赖 workflow-skills/agents/commands 的代码，只通过文件系统发现
- **ccw-litellm 和 codex-lens 是独立 Python 进程** — 通过 subprocess HTTP 桥接，可选组件，git 追踪 0 个源文件（仅本地 .pyc 文件），需通过 pip 单独安装
- **frontend 只依赖 ccw-core 的 HTTP/WS API** — 纯消费者

## 6 个集成点详情

### 1. MCP Server (inbound)
```
Claude Desktop / Cursor → stdio → mcp-server/index.ts
  → filterTools(CCW_ENABLED_TOOLS) → executeTool()
Protocol: MCP (Model Context Protocol)
Default tools: 6 core (可配置扩展)
```

### 2. HTTP API (inbound)
```
Browser / External Client → HTTP → server.ts
  → 45+ route handlers → various services
Protocol: HTTP REST + WebSocket
Auth: JWT (token-manager.ts) + CSRF (csrf-manager.ts)
Port: 3456 (default, CCW_PORT env)
WebSocket: /ws only, session-scoped
```

### 3. Claude Hooks (inbound)
```
Claude Code lifecycle events → hook system
  → context-limit-detector / user-abort-detector
  → keyword-detector / stop-handler / recovery-handler
5 hook modules, event-driven
```

### 4. LLM CLIs (outbound)
```
ccw-core → PTY spawn → gemini/qwen/codex/claude/opencode
Protocol: PTY (pseudo-terminal)
Mode: streaming with non-streaming cache fallback
Windows: shell:true, escapeWindowsArg(), CLAUDECODE deletion
```

### 5. ACE Search (inbound)
```
Augment Context Engine → MCP client → ccw-core
Used for semantic code search
Config: .claude/cli-settings.json (codeIndexMcp=ace)
```

### 6. Python Bridge (outbound)
```
ccw-core → subprocess → ccw-litellm (HTTP proxy)
                      → codex-lens (HTTP search API)
Protocol: subprocess + HTTP localhost
Bridge: memory-embedder-bridge.ts
```

## 配置加载层次

```
~/.claude/cli-tools.json          ← 工具定义（builtin/cli-wrapper/api-endpoint）
~/.claude/cli-settings.json       ← CLI 端点配置（defaultTool, codeIndexMcp）
.claude/skills/**/SKILL.md        ← 项目 Skills (52 Claude + 46 Codex)
.claude/workflow-skills/**/       ← 项目工作流 Skills
~/.claude/skills/**/SKILL.md      ← 用户 Skills
~/.claude/workflow-skills/**/     ← 用户工作流 Skills
.claude/agents/*.md               ← 项目 Agent 定义 (24 Claude)
.codex/agents/*.toml              ← Codex Agent 定义 (26)
.claude/commands/*.md             ← Slash Command 定义 (38)
.ccw/workflows/cli-templates/     ← CLI 模板 (schemas + prompts)
```

**配置策略**: GLOBAL ONLY — 无项目级 `.ccw/` 覆盖。所有配置在 `~/.claude/`。
