# Chapter 19.6: Loop V2 路由

> **定位**: Loop 系统的简化 HTTP API 端点
> **核心文件**: `ccw/src/core/routes/loop-v2-routes.ts`
> **设计目标**: 为 Dashboard 提供独立于任务文件的 Loop CRUD 操作接口

## 19.6.1 架构概述

Loop V2 是 CCW 循环执行系统的第二代 API，提供简化的 RESTful 接口，支持：

1. **Loop 生命周期管理**: 创建、查询、更新、删除 Loop
2. **状态机控制**: 启动、暂停、恢复、停止
3. **任务管理**: 添加、查询、更新、删除、重排序任务
4. **高级功能**: 从 Issue 导入任务、AI 生成任务

```
┌───────────────────────────────────────────────────────────────┐
│                      Dashboard Frontend                        │
└──────────────────────────┬────────────────────────────────────┘
                           │ HTTP REST API
                           ▼
┌───────────────────────────────────────────────────────────────┐
│                    Loop V2 Routes                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐│
│  │ Loop CRUD       │  │ Status Control  │  │ Task Mgmt      ││
│  │ /api/loops/v2   │  │ /start,/pause   │  │ /tasks         ││
│  └─────────────────┘  └─────────────────┘  └────────────────┘│
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
┌───────────────────────────────────────────────────────────────┐
│  .workflow/.loop/                                              │
│  ├── loop-v2-{timestamp}-{random}.json    # Loop 元数据       │
│  └── loop-v2-{id}.tasks.jsonl             # 任务列表          │
└───────────────────────────────────────────────────────────────┘
```

## 19.6.2 API 端点列表

### 19.6.2.1 Loop CRUD 端点

| 方法 | 端点 | 说明 |
|------|------|------|
| `GET` | `/api/loops/v2` | 列出所有 Loop (支持分页和过滤) |
| `POST` | `/api/loops/v2` | 创建新 Loop |
| `GET` | `/api/loops/v2/:loopId` | 获取 Loop 详情 |
| `PUT` | `/api/loops/v2/:loopId` | 更新 Loop 元数据 |
| `DELETE` | `/api/loops/v2/:loopId` | 删除 Loop |

### 19.6.2.2 状态控制端点

| 方法 | 端点 | 说明 |
|------|------|------|
| `POST` | `/api/loops/v2/:loopId/start` | 启动 Loop 执行 |
| `POST` | `/api/loops/v2/:loopId/pause` | 暂停运行中的 Loop |
| `POST` | `/api/loops/v2/:loopId/resume` | 恢复暂停的 Loop |
| `POST` | `/api/loops/v2/:loopId/stop` | 停止 Loop |
| `PATCH` | `/api/loops/v2/:loopId/status` | 快速状态更新 |

### 19.6.2.3 任务管理端点

| 方法 | 端点 | 说明 |
|------|------|------|
| `POST` | `/api/loops/v2/:loopId/tasks` | 添加任务到 Loop |
| `GET` | `/api/loops/v2/:loopId/tasks` | 列出 Loop 的所有任务 |
| `GET` | `/api/loops/v2/tasks/:taskId` | 获取单个任务详情 |
| `PUT` | `/api/loops/v2/tasks/:taskId` | 更新任务 |
| `DELETE` | `/api/loops/v2/tasks/:taskId` | 删除任务 |
| `PUT` | `/api/loops/v2/:loopId/tasks/reorder` | 重排序任务 |

### 19.6.2.4 高级功能端点

| 方法 | 端点 | 说明 |
|------|------|------|
| `POST` | `/api/loops/v2/:loopId/import` | 从 Issue 导入任务 |
| `POST` | `/api/loops/v2/:loopId/generate` | AI 生成任务 |

## 19.6.3 Loop 状态机

### 19.6.3.1 状态定义

```typescript
enum LoopStatus {
  CREATED = 'created',     // 已创建，等待启动
  RUNNING = 'running',     // 执行中
  PAUSED = 'paused',       // 已暂停
  COMPLETED = 'completed', // 已完成
  FAILED = 'failed',       // 已失败
}
```

### 19.6.3.2 状态转换图

```
                    ┌─────────────┐
                    │   CREATED   │
                    └──────┬──────┘
                           │ start()
                           ▼
                    ┌─────────────┐
         ┌─────────►│   RUNNING   │◄─────────┐
         │          └──────┬──────┘          │
         │                 │                 │
    resume()          pause()           start()
         │                 │           (from paused)
         │                 ▼                 │
         │          ┌─────────────┐          │
         └──────────│   PAUSED    │──────────┘
                    └──────┬──────┘
                           │
                    stop() │ stop()
                           │
                           ▼
                    ┌─────────────┐
                    │   FAILED    │
                    └─────────────┘
                    
                           │ (正常完成)
                           ▼
                    ┌─────────────┐
                    │  COMPLETED  │
                    └─────────────┘
```

### 19.6.3.3 状态转换规则

| 当前状态 | 允许的操作 | 目标状态 |
|----------|------------|----------|
| `created` | start | `running` |
| `created` | stop | `failed` |
| `running` | pause | `paused` |
| `running` | stop | `failed` |
| `running` | (完成) | `completed` |
| `running` | (失败) | `failed` |
| `paused` | resume | `running` |
| `paused` | stop | `failed` |

## 19.6.4 数据模型

### 19.6.4.1 Loop 存储格式

```typescript
interface V2LoopStorage {
  loop_id: string;
  title: string;
  description: string;
  max_iterations: number;
  status: LoopStatus;
  current_iteration: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  failure_reason?: string;

  // 扩展元数据
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
}
```

### 19.6.4.2 创建请求

```typescript
interface V2LoopCreateRequest {
  title: string;                    // 必填
  description?: string;             // 可选
  max_iterations?: number;          // 默认 10
}
```

### 19.6.4.3 更新请求

```typescript
interface V2LoopUpdateRequest {
  title?: string;
  description?: string;
  max_iterations?: number;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
}
```

### 19.6.4.4 任务创建请求

```typescript
interface TaskCreateRequest {
  description: string;              // 必填
  tool: string;                     // 必填: bash | gemini | codex | qwen | claude
  mode: string;                     // 必填: analysis | write | review
  prompt_template: string;          // 必填
  command?: string;                 // 可选
  on_error?: 'continue' | 'pause' | 'fail_fast';  // 错误处理策略
}
```

## 19.6.5 Loop ID 生成

Loop ID 使用时间戳 + 随机数格式，确保唯一性和可读性：

```typescript
const generateLoopId = (): string => {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  const random = randomBytes(4).toString('hex');
  return `loop-v2-${timestamp}-${random}`;
};
// 示例: loop-v2-20260218T084500-a1b2c3d4
```

## 19.6.6 与 V1 Loop 的对比

| 特性 | V1 (loop-routes.ts) | V2 (loop-v2-routes.ts) |
|------|---------------------|------------------------|
| 存储方式 | 依赖任务文件 | 独立 JSON 文件 |
| API 风格 | 混合 | 纯 RESTful |
| 任务来源 | 仅任务文件 | 多源 (手动/导入/生成) |
| Dashboard 支持 | 有限 | 完整支持 |
| 状态广播 | 无 | WebSocket 广播 |

## 19.6.7 WebSocket 状态广播

Loop 状态变化时自动广播到所有连接的客户端：

```typescript
const broadcastStateUpdate = (loopId: string, status: LoopStatus): void => {
  broadcastToClients({
    type: 'LOOP_STATE_UPDATE',
    loop_id: loopId,
    status: status,
    updated_at: new Date().toISOString()
  });
};
```

**广播事件类型**:

| 事件类型 | 说明 |
|----------|------|
| `LOOP_STATE_UPDATE` | Loop 状态变化 |
| `LOOP_DELETED` | Loop 被删除 |
| `TASK_ADDED` | 任务添加 |
| `TASK_UPDATED` | 任务更新 |
| `TASK_DELETED` | 任务删除 |
| `TASK_REORDERED` | 任务重排序 |
| `LOOP_TASK_IMPORT_PROGRESS` | 任务导入进度 |
| `LOOP_TASK_GENERATION_PROGRESS` | 任务生成进度 |

## 19.6.8 高级功能

### 19.6.8.1 从 Issue 导入任务

```http
POST /api/loops/v2/:loopId/import
Content-Type: application/json

{
  "issue_id": "ISS-20260217-015"
}
```

流程:
1. 从 `.workflow/issues/issues.jsonl` 加载 Issue 数据
2. 从绑定的 Solution 中提取任务列表
3. 将任务转换为 Loop Task 格式并添加

### 19.6.8.2 AI 生成任务

```http
POST /api/loops/v2/:loopId/generate
Content-Type: application/json

{
  "tool": "gemini",
  "count": 5
}
```

流程:
1. 构建 Prompt，包含 Loop 标题和描述
2. 调用 `executeCliTool()` 执行 AI 分析
3. 解析返回的 JSON 任务数组
4. 验证并添加任务到 Loop

## 19.6.9 安全性

### 19.6.9.1 ID 验证

所有 ID 参数都经过 `isValidId()` 验证，防止路径遍历攻击：

```typescript
function isValidId(id: string): boolean {
  if (!id) return false;
  if (id.includes('/') || id.includes('\\') || id === '..' || id === '.') return false;
  if (id.includes('\0')) return false;
  return true;
}
```

### 19.6.9.2 工具验证

任务创建时验证工具是否在 `cli-tools.json` 中启用：

```typescript
const cliToolsConfig = loadClaudeCliTools(os.homedir());
const enabledTools = Object.entries(cliToolsConfig.tools || {})
  .filter(([_, config]) => config.enabled === true)
  .map(([name]) => name);
const validTools = ['bash', ...enabledTools];
```

## 19.6.10 存储位置

```
{project}/.workflow/.loop/
├── loop-v2-20260218T084500-a1b2c3d4.json      # Loop 元数据
├── loop-v2-20260218T084500-a1b2c3d4.tasks.jsonl  # 任务列表
├── loop-v2-20260218T103000-e5f6g7h8.json
└── loop-v2-20260218T103000-e5f6g7h8.tasks.jsonl
```

## 19.6.11 CLI 工具缓存

为避免重复文件 I/O，Loop V2 在服务器启动时缓存 CLI 工具配置：

```typescript
let cachedEnabledTools: string[] | null = null;

export function initializeCliToolsCache(): void {
  const cliToolsConfig = loadClaudeCliTools(os.homedir());
  const enabledTools = Object.entries(cliToolsConfig.tools || {})
    .filter(([_, config]) => config.enabled === true)
    .map(([name]) => name);
  cachedEnabledTools = ['bash', ...enabledTools];
}
```

---

*下一章: [Chapter 19.7: Memory Consolidation Pipeline](./ch19-7-memory-consolidation.md)*
