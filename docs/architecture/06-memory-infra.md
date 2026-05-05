# 记忆系统 + 服务基础设施

> **层级**: L3 — 核心模块 | **更新**: 2026-05-03

## 记忆系统

### RRF 融合搜索 (unified-memory-service.ts)

```
RRF (Reciprocal Rank Fusion) — 三路融合:

  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │ Vector       │  │ FTS5         │  │ Heat Score   │
  │ (embeddings) │  │ (full-text)  │  │ (access freq)│
  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
         │                 │                 │
         ▼                 ▼                 ▼
  ┌─────────────────────────────────────────────────┐
  │              RRF Fusion (k=60)                   │
  │  weights: vector=0.6, FTS5=0.3, heat=0.1       │
  │  unified_vector_index + FTS + memory_store      │
  └─────────────────────────────────────────────────┘
```

### 记忆类型

| 类型 | 存储 | 用途 |
|------|------|------|
| **user** | core_memory | 用户角色、偏好、知识背景 |
| **feedback** | core_memory | 用户反馈、行为指导 |
| **project** | core_memory | 项目决策、截止日期、目标 |
| **reference** | core_memory | 外部系统指针 (Linear, Grafana, Slack) |

### 记忆流水线

```
Extraction Pipeline (memory-extraction-pipeline.ts):
  会话 → Gemini/Qwen 提取 → 结构化 chunk → embedding → SQLite

Consolidation Pipeline (memory-consolidation-pipeline.ts):
  相似 chunk 聚类 → AI 合并 → 去重 → 更新索引

Job Scheduler (memory-job-scheduler.ts):
  定时触发 extract → consolidate → embed
  状态: pending → running → done/error
```

### 核心文件

| 文件 | 职责 |
|------|------|
| `core-memory-store.ts` | SQLite FTS5 + 实体追踪 + heat scoring |
| `unified-memory-service.ts` | RRF 融合搜索入口 |
| `unified-vector-index.ts` | 向量索引 + embedding 管理 |
| `memory-store.ts` | 基础存储层 |
| `memory-extraction-pipeline.ts` | 会话 → 记忆提取管道 |
| `memory-consolidation-pipeline.ts` | 记忆合并去重 |
| `memory-job-scheduler.ts` | 定时任务调度 |
| `memory-embedder-bridge.ts` | Python embedder 桥接 |
| `session-clustering-service.ts` | 会话聚类 |
| `cache-manager.ts` | 仪表板数据缓存 |
| `claude-freshness.ts` | CLAUDE.md 新鲜度计算器 |
| `cors.ts` | CORS 配置 |
| `data-aggregator.ts` | 数据聚合（lite-scanner + 缓存） |
| `history-importer.ts` | Claude Code 历史导入器到记忆存储 |
| `lite-scanner.ts` | 轻量级任务扫描器 |
| `lite-scanner-complete.ts` | 轻量级扫描完成模块 |
| `manifest.ts` | Agent 定义清单加载器 |
| `mode-workflow-map.ts` | 模式到工作流映射 |
| `pattern-detector.ts` | 模式检测器 |
| `session-scanner.ts` | 会话扫描器 |
| `unified-context-builder.ts` | 统一上下文构建器 |
| `memory-v2-config.ts` | 记忆 v2 配置常量 |
| `memory-consolidation-prompts.ts` | 记忆合并的提示模板 |
| `memory-extraction-prompts.ts` | 记忆提取的提示模板 |

---

## HTTP Server 基础设施

### 路由架构

```
server.ts (869L):
  http.createServer((req, res) => {
    // 1. CORS 预检
    // 2. Auth middleware (JWT + CSRF)
    // 3. 静态文件 (frontend dist/)
    // 4. WebSocket upgrade (/ws)
    // 5. API 路由分发 (45+ handlers)
  })

路由分发模式 (chain-of-responsibility):
  每个 handle*Routes() 返回 boolean
  true  → 已处理，停止分发
  false → 未匹配，继续下一个 handler
```

### 45 个路由模块

```
CLI & Tools:
  cli-routes, cli-settings-routes, cli-sessions-routes
  loop-routes, loop-v2-routes, test-loop-routes

Memory & Sessions:
  memory-routes, core-memory-routes, unified-memory-routes
  session-routes, nav-status-routes

Workflow:
  orchestrator-routes, team-routes, task-routes
  queue-routes, issue-routes, spec-routes

Discovery & Analysis:
  discovery-routes, analysis-routes, graph-routes
  commands-routes, rules-routes, skills-routes, skill-hub-routes
  agent-definitions-routes, help-routes

Infrastructure:
  status-routes, system-routes, config-routes
  dashboard-routes, notification-routes, audit-routes
  files-routes, mcp-routes, provider-routes
  hooks-routes, unsplash-routes, background-routes, deepwiki-routes
  litellm-routes, litellm-api-routes, codexlens-routes
  auth-routes, ccw-routes, claude-routes
```

### 服务基础设施

```
services/
  cli-launch-registry        — CLI 工具启动参数注册表
  cli-session-share          — CLI 会话共享令牌管理
  config-backup              — 本地配置备份服务
  config-sync                — 远程 GitHub 配置同步
  health-check-service       — Provider API 密钥健康检查
  pending-question-service   — ask_question 待处理问题持久化
  remote-notification-service — 多平台远程通知分发
  version-checker            — GitHub 版本更新检测
```

### 认证体系

```
auth/middleware.ts:
  JWT token 验证 (token-manager.ts)
  localhost 豁免检查
  wildcard host 检测

auth/csrf-middleware.ts:
  CSRF token 验证
  随机 token 生成 (crypto.randomBytes)

auth/csrf-manager.ts:
  CSRF token 生命周期管理
```

### WebSocket

```
websocket.ts:
  /ws 路径升级
  extractSessionIdFromPath() — 会话隔离
  broadcastToClients() — 状态广播
  CLI 执行状态实时推送
  A2UI WebSocket Handler (A2UIWebSocketHandler.ts)
```

---

## MCP Server

### 架构

```
mcp-server/index.ts:
  @modelcontextprotocol/sdk
  StdioServerTransport
  ListToolsRequestSchema → getAllToolSchemas()
  CallToolRequestSchema  → executeTool()

工具过滤:
  CCW_ENABLED_TOOLS env var (逗号分隔)
  默认: 6 core tools
  filterTools() — 白名单匹配

EPIPE 处理:
  检测 stdio 断开
  清理孤儿进程
```

### MCP 工具暴露

```
CCW MCP Server 暴露的工具:
  - mcp__ccw-tools__edit_file    — 精确文本编辑
  - mcp__ccw-tools__write_file   — 文件完整写入
  - mcp__ccw-tools__core_memory  — 核心记忆管理
  - mcp__ace-tool__search_context — ACE 语义搜索
  - mcp__exa__web_search_exa     — Exa 网页搜索
  - mcp__exa__get_code_context_exa — Exa 代码上下文
```

---

## Hook 生命周期

### 5 个 Hook 模块

```
hooks/index.ts → 统一导出:

  1. context-limit-detector  — 上下文窗口阈值检测
  2. user-abort-detector     — 用户中断信号检测
  3. keyword-detector        — 关键词匹配触发 Skill
  4. stop-handler            — 停止信号处理
  5. recovery-handler        — 异常恢复策略
```

### Hook 模板系统

```
hook-templates.ts:
  预定义的 hook 配置模板
  ccw-coordinator-tracker.ts:
    追踪 coordinator 执行状态
    事件: session-start, context, task-complete
```

---

## 会话系统

### 双会话架构

```
1. ccw session (commands/session.ts):
   - 工作流会话生命周期
   - .workflow/active/ 目录
   - init/write/read/list/archive 操作

2. Native session tracking (native-session-discovery.ts):
   - CLI 执行会话追踪
   - SQLite ConversationRecord
   - resume/merge/fork 支持
```

### 会话池 (3-Tier)

```
queue-scheduler-service.ts:

  Tier 1: resumeKey affinity  → 相同 key 复用
  Tier 2: idle reuse          → 空闲会话优先
  Tier 3: new session         → 按需创建

  maxConcurrent = 2
```

### 已知风险

- 双会话系统概念重叠，可能导致状态不一致
- 历史保存静默失败 (sync→async→silent 保存链)
- SQLite 多实例 lock contention
- 子项目历史递归查询可能导致性能问题
