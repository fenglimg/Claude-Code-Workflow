# 关键执行流程

> **层级**: L2 — 调用链追踪 | **更新**: 2026-05-03

## 流程 1: CLI 执行 (最核心)

```
ccw cli -p "analyze auth" --tool gemini --mode analysis

cli.ts
  → invokeNamedExport(() => import('./commands/cli.js'), 'cliCommand', options)
    → commands/cli.ts: cliCommand()
      → cliExecutorTool(options)
        → tools/cli-executor.ts (facade re-export)
          → tools/cli-executor-core.ts: executeCliTool()

executeCliTool() 内部:
  1. Zod 验证 params
  2. resolveModelAlias('PRIMARY_MODEL') → 从 cli-tools.json 获取实际模型
  3. findEndpoint(tool='gemini')
     → cli-settings-manager.ts 查找 gemini 配置
     → 获取路径、参数模板
  4. 路由: builtin → spawn()
     → buildCommand() — 组装完整 CLI 命令
     → child_process.spawn(cmd, args, { shell: true })
     → PTY stream → stdout/stderr
  5. OutputParser.parse(stdout, stderr)
     → JsonLinesParser 或 PlainTextParser
     → mapJsonToIR() — 多工具格式归一化
     → CliOutputUnit[] (typed IR)
  6. flattenOutputUnits()
     → 流式合并 + 多轮去重
     → parsed / final / raw 三视图
  7. saveConversation() → SQLite
     → ConversationRecord { turns: ConversationTurn[] }
  8. trackNewSession() → native-session-discovery.ts

涉及文件 (6):
  cli.ts → commands/cli.ts → tools/cli-executor.ts
  → tools/cli-executor-core.ts → tools/cli-executor-utils.ts
  → tools/cli-executor-state.ts
```

## 流程 2: Flow DAG 执行

```
Dashboard API: POST /api/orchestrator/execute

server.ts
  → handleOrchestratorRoutes()
    → orchestrator-routes.ts
      → FlowExecutor.execute()

FlowExecutor 内部:
  1. loadFlow(flowId) → 读取 Flow JSON 定义
  2. buildDAG()
     → 创建 DAGNode[] { nodeId, incoming[], outgoing[] }
     → 计算入度
  3. topologicalSort() — Kahn 算法
     → queue = nodes with indegree=0
     → while queue: dequeue → result.push → reduce downstream indegree
     → 检测环 (result.length !== totalNodes)
  4. getReadyNodes() → 可并行执行的节点
  5. for each node:
     executeNode(node)
       → NodeRunner.run(node)
         → runPromptTemplate(node.data)
           → interpolate(template, variables)  — {{var}} 替换
           → assembleInstruction()             — CLI 指令组装
           → executeCliTool()                  — CLI 执行
           → cliSessionMux                     — 会话复用
         → persistState()                      — status.json
         → broadcastStateUpdate()              — WebSocket 推送
       → onError: continue | pause | fail

涉及文件 (6):
  server.ts → orchestrator-routes.ts → flow-executor.ts
  → cli-executor-core.ts → cli-session-mux.ts → websocket.ts
```

## 流程 3: Chain 渐进式加载

```
ccw chain-loader '{"cmd":"start","skill":"workflow-plan","chain":"main"}'

cli.ts
  → invokeNamedExport(() => import('./commands/chain-loader.js'), ...)
    → commands/chain-loader.ts
      → tools/chain-loader.ts: handler()

handler() 内部 (cmd='start'):
  1. loadChainJson(skill, chain) → 读取 {skill}/chains/{chain}.json
  2. resolvePreloads()
     → 遍历 chain.preload[] entries
     → resolvePreloadSource()
       → @path/file.md  → 文件读取
       → @~/path        → 用户目录
       → memory:KEY     → 记忆查找
  3. 初始化 ChainSession
     → session_id, variables, preloaded_content
     → 写入 .workflow/.chain-sessions/
  4. 定位 entry node → 返回第一个 StepNode 内容

cmd='next':
  1. loadSession(session_id)
  2. 读取 current_node 内容
  3. 如果是 active → 返回当前内容 (幂等)
  4. 如果是 completed → 推进

cmd='done':
  1. 标记 current_node 完成
  2. advanceToNext()
     → StepNode → 自动推进到 next
     → DecisionNode → 根据 choice 参数推进
     → DelegateNode → 压栈 → 启动子链
  3. 保存 session 状态

涉及文件 (3):
  cli.ts → commands/chain-loader.ts → tools/chain-loader.ts
```

## 流程 4: MCP 工具调用

```
Claude Desktop / Cursor
  → stdio connect to ccw-mcp

mcp-server/index.ts:
  1. Server instantiation
  2. ListToolsRequestSchema handler
     → getAllToolSchemas() (from tools/index.ts)
     → filterTools(CCW_ENABLED_TOOLS)
  3. CallToolRequestSchema handler
     → executeTool(name, params)

executeTool() 内部:
  1. tools.get(name) — Map 查找
  2. validateParams() — schema 验证
  3. notifyDashboard() — 通知 (fire-and-forget)
  4. tool.execute(params) — 执行
  5. 返回 ToolResult { success, result }

涉及文件 (4):
  mcp-server/index.ts → tools/index.ts
  → types/tool.ts → utils/path-validator.ts
```

## 流程 5: Skill 自动发现

```
User Prompt (via Claude Code hook)
  → UserPromptSubmit hook
    → ccw hook session-context
      → commands/hook.ts
        → skill-context-loader.ts

skill-context-loader.ts 内部:
  1. getAvailableSkills()
     → 扫描 4 个目录
     → 解析 SKILL.md frontmatter
     → 去重 (按 folderName)
  2. matchKeywords(prompt, skill)
     → 正则匹配 prompt 文本 vs skill.keywords[]
  3. formatSkillInvocation()
     → Skill({ skill: "name", args: "context" })
  4. 注入到 Claude Code 上下文

涉及文件 (2):
  hooks/index.ts → skill-context-loader.ts
```

## 流程 6: 记忆提取 (后台)

```
定时触发 (memory-job-scheduler)
  → memory-extraction-pipeline.ts

Extraction 内部:
  1. 扫描未处理会话
  2. Gemini/Qwen CLI 提取结构化信息
  3. 分 chunk
  4. memory-embedder-bridge → Python embedder → vector
  5. unified-vector-index 存储

Consolidation:
  1. 查找相似 chunk (cosine > threshold)
  2. AI 合并重复内容
  3. 更新索引 + 去重

涉及文件 (5):
  memory-job-scheduler.ts → memory-extraction-pipeline.ts
  → memory-embedder-bridge.ts → unified-vector-index.ts
  → memory-consolidation-pipeline.ts
```

---

## 调用链汇总

| # | 入口 | 路径 | 文件数 |
|---|------|------|--------|
| 1 | `ccw cli -p ...` | cli → command → executor → spawn → IR → SQLite | 6 |
| 2 | Flow API | server → orchestrator → DAG → CLI → WS broadcast | 6 |
| 3 | Chain cmd | cli → chain-loader → state machine → session | 3 |
| 4 | MCP stdio | mcp-server → tool registry → execute | 4 |
| 5 | Hook trigger | hook → skill-context-loader → keyword match | 2 |
| 6 | Memory pipeline | scheduler → extract → embed → consolidate | 5 |
