# 核心引擎：CLI → Command → Registry → Executor

> **层级**: L3 — 核心模块 | **更新**: 2026-05-03

## 链路总览

```
User Input (CLI args)
        │
        ▼
┌──────────────────────────────────────────────────────┐
│ L0: CLI Entry (cli.ts)                                 │
│                                                      │
│ Commander.js program                                  │
│   .command('cli')                                     │
│   .command('tool')                                    │
│   .command('session')    ← 18+ subcommands            │
│   ...                                                 │
│   .action(async (opts) =>                             │
│     invokeNamedExport(                                │
│       () => import('./commands/xxx.js'),              │
│       'xxxCommand',                                    │
│       opts                                            │
│     )                                                 │
│   )                                                   │
│                                                      │
│ invokeNamedExport() — 12行通用懒加载器                  │
│   1. await loader() → 动态 import()                    │
│   2. mod[exportName] → 按名取导出函数                    │
│   3. handler(...args) → 调用                            │
└──────────────┬───────────────────────────────────────┘
               │ Lazy import
               ▼
┌──────────────────────────────────────────────────────┐
│ L1: Command Layer (commands/*.ts, ×22)                │
│                                                      │
│ 每个文件 export 一个命名函数:                            │
│   cli.ts       → cliCommand()                            │
│   tool.ts      → toolCommand()                        │
│   session.ts   → sessionCommand()                     │
│   memory.ts    → memoryCommand()                      │
│   ...                                                 │
│                                                      │
│ 典型的 command 内部流程:                                 │
│   1. 解析 options (来自 Commander)                      │
│   2. 路由到对应的 tool 或 service                        │
│   3. 格式化输出                                         │
└──────────────┬───────────────────────────────────────┘
               │ import + call
               ▼
┌──────────────────────────────────────────────────────┐
│ L2: Tool Registry (tools/index.ts)                     │
│                                                      │
│ ┌─────────────────────────────────────────┐          │
│ │ registerTool(toLegacyTool(mod))          │          │
│ │                                          │          │
│ │ toLegacyTool():                          │          │
│ │   { schema, handler } → LegacyTool       │          │
│ │   { name, description, parameters,       │          │
│ │     execute: async (params) =>           │          │
│ │       result = await handler(params);     │          │
│ │       if (!result.success) throw;         │          │
│ │       return result.result;               │          │
│ │   }                                       │          │
│ └─────────────────────────────────────────┘          │
│                                                      │
│ 注册清单 (24+ tools):                                  │
│   核心: edit_file, write_file, read_file,             │
│         read_many_files, read_outline                 │
│   分析: get_modules_by_depth, classify_folders,       │
│         detect_changed_modules, discover_design_files │
│   生成: generate_module_docs, generate_ddd_docs,      │
│         convert_tokens_to_css, update_module_claude   │
│   编排: cli_executor, chain_loader, skill_context     │
│   会话: session_manager, context_cache, memory_queue  │
│   UI:   ui_generate_preview,                          │
│         ui_instantiate_prototypes                     │
│   其他: core_memory, ask_question, team_msg,          │
│         json_builder, spec_init, ...                  │
│                                                      │
│ Dashboard notifications (fire-and-forget):            │
│   notifyDashboard({toolName, status, params})         │
│   → HTTP POST localhost:3456/api/hook                 │
│   → socket.unref() 防止阻塞进程退出                     │
└──────────────┬───────────────────────────────────────┘
               │ executeTool(name, params)
               ▼
┌──────────────────────────────────────────────────────┐
│ L3: Executor Core (cli-executor-core.ts)               │
│                                                      │
│ executeCliTool(params):                               │
│                                                      │
│   1. Zod 验证 params                                   │
│   2. resolveModelAlias()                              │
│      PRIMARY_MODEL / SECONDARY_MODEL → 实际模型名     │
│                                                      │
│   3. 三路分发 (基于 tool type):                         │
│                                                      │
│   ┌──────────┐   ┌──────────────┐   ┌──────────┐    │
│   │ builtin  │   │ cli-wrapper  │   │ api-endpt │    │
│   │          │   │              │   │          │    │
│   │ spawn()  │   │ claude       │   │ LiteLLM  │    │
│   │ PTY      │   │ --settings   │   │ HTTP     │    │
│   │          │   │              │   │ proxy    │    │
│   │ gemini   │   │ codex        │   │ g25 etc  │    │
│   │ qwen     │   │ opencode     │   │          │    │
│   │ claude   │   │              │   │          │    │
│   └────┬─────┘   └──────┬───────┘   └────┬─────┘    │
│        │                │                │           │
│        ▼                ▼                ▼           │
│   子进程 spawn      子进程 spawn      HTTP Request    │
│   shell:true        --settings       LiteLLM proxy   │
│   PTY stream        PTY stream       JSON response   │
│                                                      │
│   4. Conversation 管理:                                │
│      - 新建: createConversationRecord()                │
│      - 恢复: loadConversation() + resume strategy     │
│      - 合并: mergeConversations() (3 modes)           │
│      - 保存: saveConversation() → SQLite              │
│                                                      │
│   5. IR Pipeline:                                     │
│      stdout/stderr → OutputParser → CliOutputUnit[]   │
│      → flattenOutputUnits() → 最终文本                │
│                                                      │
│   6. Session tracking:                                │
│      trackNewSession() → native-session-discovery     │
└──────────────────────────────────────────────────────┘
```

## 三路路由详解

### builtin (直接 spawn)
```
工具: gemini, qwen, codex, claude (早期版本), opencode
方式: child_process.spawn(cmd, args, { shell: true })
流: PTY → streaming parser → CliOutputUnit[]
Resume: 原生 (再次 spawn 带 --resume)
```

### cli-wrapper (--settings 封装)
```
工具: claude (新版本), codex (无 TTY)
方式: claude -p "prompt" --settings <path>
机制: 通过 cli-settings-manager.ts 管理 settings 文件
      每个会话生成独立的 settings profile
Resume: 原生 (--resume) 或 prompt-concat fallback
特殊: CLAUDECODE 环境变量删除 (issue #573 workaround)
```

### api-endpoint (LiteLLM 代理)
```
工具: g25 等 API 端点
方式: HTTP POST → LiteLLM proxy → remote LLM
配置: litellm-api-config-manager.ts
模型: litellm-provider-models.ts / litellm-static-models.ts
Resume: 不支持原生 resume，使用 prompt-concat
```

## IR Output Pipeline

```
原始 CLI 输出 (stdout/stderr)
        │
        ▼
┌──────────────────────────────────────┐
│ IOutputParser (Strategy Pattern)     │
│                                      │
│ PlainTextParser  — 普通文本          │
│ JsonLinesParser  — JSONL 流          │
│   mapJsonToIR()  — 多工具格式映射    │
│     Gemini JSON → CliOutputUnit      │
│     Qwen JSON   → CliOutputUnit      │
│     Codex JSON  → CliOutputUnit      │
│     Claude JSON → CliOutputUnit      │
│   delta 归一化   — 统一增量格式      │
└──────────────┬───────────────────────┘
               ▼
┌──────────────────────────────────────┐
│ CliOutputUnit[] (10 种类型)          │
│                                      │
│ stdout, stderr, thought, code,       │
│ tool_call, agent_message,            │
│ agent_status, json_data,             │
│ execution_metadata, error            │
└──────────────┬───────────────────────┘
               ▼
┌──────────────────────────────────────┐
│ flattenOutputUnits()                 │
│  - 流式合并                           │
│  - 多轮去重                           │
│  - Codex 特殊剥离                     │
│  → parsed / final / raw 三视图       │
└──────────────────────────────────────┘
```

## Windows 兼容层

```
cli-executor-core.ts:
  shell: true              ← Windows 必须，否则 spawn 失败
  escapeWindowsArg()       ← 参数转义 (shell-escape.ts)
  CLAUDECODE 环境变量删除   ← SDK 兼容 workaround (issue #573)
  信号处理差异             ← SIGTERM → SIGKILL with 2s delay
```

## 关键文件索引

> **注**: 下表省略各文件精确行号，因代码持续演进，行号会迅速过时。如需当前行数，可使用 `wc -l <path>` 查看。

| 区域 | 文件 | 职责 |
|------|------|------|
| CLI 入口与命令 | `cli.ts` | Commander CLI 入口 + 18 子命令注册 |
| | `commands/cli.ts` | CLI 子命令处理 (最大单文件) |
| | `commands/install.ts` | 安装命令 (双平台 + skill-hub) |
| | `commands/tool.ts` | 工具命令处理 |
| | `commands/session.ts` | 会话命令处理 |
| 工具注册与执行 | `tools/index.ts` | Tool Registry + Adapter (24+ tools) |
| | `tools/cli-executor-core.ts` | 统一执行引擎 (三路路由) |
| | `tools/cli-output-converter.ts` | IR Pipeline (OutputParser + flatten) |
| | `tools/cli-executor-state.ts` | SQLite 会话持久化 |
| | `tools/claude-cli-tools.ts` | 工具配置定义 (Schema Registry) |
| | `tools/command-registry.ts` | 命令自动发现 |
| | `tools/cli-settings-manager.ts` | CLI settings profile 管理 |
| | `tools/cli-prompt-builder.ts` | Prompt 组装 |
| API Endpoint | `tools/litellm-executor.ts` | LiteLLM HTTP 代理执行 |
| | `tools/litellm-client.ts` | LiteLLM API 客户端 |
| 会话与恢复 | `tools/session-manager.ts` | 会话生命周期管理 |
| | `tools/resume-strategy.ts` | 会话恢复策略 |
| | `tools/native-session-discovery.ts` | 原生会话发现 |
| UI 工具 | `tools/ui-generate-preview.js` | UI 预览生成 |
| | `tools/ui-instantiate-prototypes.js` | UI 原型实例化 |
| 引擎工具 | `tools/update-module-claude.js` | 更新模块 CLAUDE.md |
| | `tools/memory-update-queue.js` | 记忆队列管理 |
| MCP | `mcp-server/index.ts` | MCP stdio 服务 |
