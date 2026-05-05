# CCW 架构全景

> **层级**: L1 — 系统全景 | **更新**: 2026-05-03 | **基于**: ANL-2026-05-03-ccw-architecture-analysis

## 系统定位

CCW (Claude Code Workflow) v7.3.13 是一个 **JSON 驱动的多 Agent 开发框架**，通过统一的 CLI 编排层，将 Gemini/Qwen/Codex/Claude/OpenCode 五种 AI 工具整合为可组合的工作流管道。

**核心隐喻**: **编排器** (Orchestrator) — CCW 不替代任何 AI 工具，而是提供统一的调度、记忆、会话管理和工作流编排。

## 6 层架构

```
┌──────────────────────────────────────────────────────────────┐
│ L0: CLI Entry          cli.ts · Commander.js · 18+ 子命令     │
│                         lazy import · invokeNamedExport()     │
├──────────────────────────────────────────────────────────────┤
│ L1: Command Layer      commands/*.ts ×22                     │
│                         cli|tool|session|memory|hook|spec     │
│                         issue|loop|team|workflow|launcher...  │
├──────────────────────────────────────────────────────────────┤
│ L2: Tool Registry      tools/index.ts · MCP-like             │
│                         registerTool() · toLegacyTool()       │
│                         24+ tools · Dashboard notifications   │
├──────────────────────────────────────────────────────────────┤
│ L3: Executor Core      cli-executor-core.ts                  │
│                         3-tier routing: builtin|wrapper|api   │
│                         IR Pipeline: CliOutputUnit typed      │
├──────────────────────────────────────────────────────────────┤
│ L4: Orchestration      Chain → DAG state machine             │
│                         Flow  → Kahn topological sort         │
│                         Loop  → Iterative CLI sequence        │
│                         Queue → State machine scheduler       │
├──────────────────────────────────────────────────────────────┤
│ L5: Persistence        SQLite · RRF Fusion Search             │
│    & Services          HTTP(45 routes) · WebSocket · MCP     │
│                         Session clustering · Hook lifecycle   │
└──────────────────────────────────────────────────────────────┘
```

## 核心数据流

```
User Prompt / Slash Command
        │
        ▼
┌──────────────┐    ┌──────────────┐    ┌───────────────┐
│ Skill Loader │───▶│ Chain Loader │───▶│ Flow/Loop     │
│ 4源关键词匹配 │    │ 渐进式节点步进│    │ DAG/迭代编排  │
└──────────────┘    └──────────────┘    └───────┬───────┘
                                                │
                   ┌────────────────────────────┼──────────────┐
                   ▼                            ▼              ▼
           ┌─────────────┐            ┌──────────────┐  ┌──────────┐
           │ builtin     │            │ cli-wrapper   │  │ api-endpt│
           │ spawn CLI   │            │ claude --set  │  │ LiteLLM  │
           └──────┬──────┘            └──────┬───────┘  └─────┬────┘
                  │                          │                │
                  └──────────────────────────┼────────────────┘
                                             ▼
                                  ┌─────────────────────┐
                                  │ IR Output Pipeline  │
                                  │ 10 CliOutputUnit     │
                                  │ types → multi-view   │
                                  └──────────┬──────────┘
                                             ▼
                                  ┌─────────────────────┐
                                  │ SQLite Persistence  │
                                  │ ConversationRecord  │
                                  │ + WebSocket push    │
                                  └─────────────────────┘
```

## 规模化快照

| 维度 | 数量 |
|------|------|
| TypeScript 源文件 (ccw-core) | 232 |
| React 前端文件 | 562+ |
| CLI 子命令 | 18+ |
| 注册工具 (MCP-like) | 24+ |
| HTTP 路由模块 | 45+ |
| Skills (Claude + Codex) | 98 |
| Agents (Claude .md + Codex .toml) | 50 |
| Slash Commands | 38 |
| JSON Schema 规范 | 23 |
| 集成点 | 6 |
| npm 依赖 | 17 (commander, zod, better-sqlite3, etc.) |

## 8 大模块

| 模块 | 类别 | 文件数 | 职责 |
|------|------|--------|------|
| **ccw-core** | core | 238 | TS 引擎: CLI/HTTP/MCP/memory/sessions/hooks |
| **frontend** | core | 562 | React SPA: xterm + React Flow + 40+ pages |
| **workflow-skills** | core | 105 | 端到端 Skill 定义 (SKILL.md + phases/) |
| **workflow-agents** | core | 50 | Agent 角色定义 (Claude .md + Codex .toml) |
| **workflow-commands** | core | 28 | Slash Command 定义 |
| **config-ecosystem** | meta | 30 | Settings + 23 schemas + specs |
| **ccw-litellm** | external | 0* | Python LiteLLM 代理 (外部安装，非仓库源码) |
| **codex-lens** | external | 0* | Python 混合代码搜索引擎 (外部安装，非仓库源码) |

> * `ccw-litellm/` 和 `codex-lens/` 目录无 git 追踪的源文件（仅本地 .pyc 编译文件，被 .gitignore 忽略）。作为外部安装依赖，在目标环境中通过 `pip install` 部署。

## 6 个集成点

| 集成点 | 协议 | 方向 |
|--------|------|------|
| MCP Server | MCP stdio | inbound |
| HTTP API (45 routes) | HTTP + WebSocket | inbound |
| Claude Hooks | Hook system | inbound |
| LLM CLIs (5 tools) | PTY spawn | outbound |
| ACE Search | MCP client | inbound |
| Python Bridge | subprocess HTTP | outbound |

## 12 个架构模式

1. **Lazy-Import Command** — `invokeNamedExport()` 零成本按需加载
2. **Route Registration** — 45+ `handleXxxRoutes()` 集中分发
3. **Tool Schema+Handler** — 统一工具接口，3 消费者 (CLI/MCP/Dashboard)
4. **Agent Dual Definition** — .md (Claude) + .toml (Codex) 双格式
5. **Self-Contained Skills** — 自包含的端到端能力单元
6. **RRF Fusion Search** — Vector+FTS5+Heat 三路融合，k=60
7. **Queue State Machine** — 确定性状态转换
8. **Beat Event Model** — Coordinator 回调驱动 Worker
9. **3-Tier Session Pool** — resumeKey affinity + maxConcurrent=2
10. **Sandbox Validation** — CCW_ENABLE_SANDBOX 路径防护
11. **Hook Lifecycle** — 5 模块: context-limit/abort/keyword/stop/recovery
12. **Dual-Platform Install** — Claude+Codex 双生态安装

## 9 条架构约束

1. native addon 需要 rebuild (better-sqlite3, node-pty)
2. Schema 字段 optional 优先，向后兼容
3. Skill 必须遵循 Completion Status Protocol
4. HookTemplate 类型安全
5. CCW_ENABLE_SANDBOX 路径遍历防护
6. maxConcurrent=2 并发限制
7. Queue 严格状态转换 (VALID_TRANSITIONS)
8. 跨平台 agent 同步一致性
9. 产物位置一致性 (.workflow/ 约定)

<!-- stale-test -->
