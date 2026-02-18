# Chapter 19.5: A2UI 协议

> **定位**: Dashboard 与 CLI Backend 之间的双向通信协议
> **核心文件**: `ccw/src/core/a2ui/A2UITypes.ts`, `ccw/src/core/a2ui/A2UIWebSocketHandler.ts`
> **设计目标**: 为 Dashboard 前端提供动态 UI 渲染能力，实现 MCP 工具与用户的交互式问答

## 19.5.1 协议概述

A2UI (Agent-to-User Interface) 是 CCW 系统中用于 Dashboard 前端与 CLI Backend 之间通信的专用协议。它基于 WebSocket 实现，支持以下核心能力：

1. **动态 Surface 渲染**: Backend 向 Frontend 推送 UI 组件定义
2. **用户交互收集**: Frontend 向 Backend 返回用户操作结果
3. **问答流程管理**: 支持 confirm、select、input、multi-select 等交互类型

```
┌─────────────────┐      WebSocket       ┌─────────────────┐
│   Dashboard     │ ◄─────────────────► │   CLI Backend   │
│   (Frontend)    │    a2ui-surface      │   (MCP Server)  │
│                 │    a2ui-action       │                 │
│                 │    a2ui-answer       │                 │
└─────────────────┘                      └─────────────────┘
```

## 19.5.2 消息类型

### 19.5.2.1 A2UI Surface Message (Backend → Frontend)

当 Backend 需要向用户展示交互界面时，发送 `a2ui-surface` 消息：

```typescript
interface A2UISurfaceMessage {
  type: 'a2ui-surface';
  payload: {
    surfaceId: string;          // Surface 唯一标识
    components: unknown[];       // UI 组件定义数组
    initialState: Record<string, unknown>;  // 初始状态
    displayMode?: 'popup' | 'panel';  // 显示模式
  };
  timestamp: string;
}
```

**核心字段说明**:
- `surfaceId`: 用于追踪 Surface 生命周期的唯一标识符
- `components`: A2UI 组件定义，由 Frontend 解析渲染
- `initialState`: 包含问题类型 (`questionType`)、问题 ID (`questionId`) 等元数据
- `displayMode`: 控制显示方式，`popup` 为弹窗，`panel` 为侧边栏

### 19.5.2.2 A2UI Action Message (Frontend → Backend)

用户交互通过 `a2ui-action` 消息返回 Backend：

```typescript
interface A2UIActionMessage {
  type: 'a2ui-action';
  actionId: string;            // 操作类型标识
  surfaceId: string;           // 对应的 Surface ID
  parameters?: Record<string, unknown>;  // 操作参数
  timestamp: string;
}
```

**支持的 Action 类型**:

| Action ID | 说明 | 参数 |
|-----------|------|------|
| `confirm` | 确认操作 | - |
| `cancel` | 取消操作 | - |
| `answer` | 提交答案 | `value`: string \| boolean \| string[] |
| `select` | 单选选择 | `value`: string |
| `toggle` | 多选切换 | `value`: string, `checked`: boolean |
| `submit` | 提交选择 | - |
| `input-change` | 输入变化 | `value`: string |
| `submit-all` | 多问题提交 | `compositeId`: string, `questionIds`: string[] |

### 19.5.2.3 A2UI Answer Message (Frontend → Backend)

最终答案通过 `a2ui-answer` 消息提交：

```typescript
interface A2UIQuestionAnswerMessage {
  type: 'a2ui-answer';
  questionId: string;          // 问题 ID
  surfaceId: string;           // Surface ID
  value: unknown;              // 用户答案
  cancelled: boolean;          // 是否取消
  timestamp: string;
}
```

## 19.5.3 Question 类型系统

A2UI 支持四种问题类型，定义在 `A2UITypes.ts` 中：

```typescript
export const QuestionTypeSchema = z.enum([
  'confirm',       // 确认型：是/否
  'select',        // 单选型：从选项中选择一个
  'input',         // 输入型：自由文本输入
  'multi-select',  // 多选型：从选项中选择多个
]);
```

### 19.5.3.1 Question 定义

```typescript
export const QuestionSchema = z.object({
  // 问题标识
  id: z.string(),
  type: QuestionTypeSchema,

  // 问题内容
  title: z.string(),
  message: z.string().optional(),
  description: z.string().optional(),

  // 选项 (select/multi-select)
  options: z.array(QuestionOptionSchema).optional(),

  // 默认值
  defaultValue: z.union([z.string(), z.array(z.string()), z.boolean()]).optional(),

  // 验证
  required: z.boolean().default(false),
  min: z.number().optional(),
  max: z.number().optional(),

  // UI 提示
  placeholder: z.string().optional(),
});
```

### 19.5.3.2 Question Option

```typescript
export const QuestionOptionSchema = z.object({
  value: z.string(),           // 选项值
  label: z.string(),           // 显示标签
  description: z.string().optional(),  // 选项描述
});
```

### 19.5.3.3 Question Answer

```typescript
export const QuestionAnswerSchema = z.object({
  questionId: z.string(),
  value: z.union([z.string(), z.array(z.string()), z.boolean()]),
  cancelled: z.boolean().optional(),
});
```

## 19.5.4 WebSocket Handler 架构

### 19.5.4.1 A2UIWebSocketHandler 类

```typescript
export class A2UIWebSocketHandler {
  // 活动 Surface 追踪
  private activeSurfaces = new Map<string, {
    surfaceId: string;
    questionId: string;
    timestamp: number;
  }>();

  // 选择状态追踪
  private multiSelectSelections = new Map<string, Set<string>>();
  private singleSelectSelections = new Map<string, string>();
  private inputValues = new Map<string, string>();

  // 已解决答案缓存 (用于 HTTP 轮询)
  private resolvedAnswers = new Map<string, { answer: QuestionAnswer; timestamp: number }>();
  private resolvedMultiAnswers = new Map<string, { compositeId: string; answers: QuestionAnswer[]; timestamp: number }>();
}
```

### 19.5.4.2 核心 API

| 方法 | 说明 |
|------|------|
| `sendSurface()` | 向所有连接的客户端发送 Surface |
| `handleAction()` | 处理来自前端的 Action 消息 |
| `handleAnswer()` | 处理来自前端的 Answer 消息 |
| `handleQuestionAction()` | 将 Action 转换为 Question Answer |
| `cancelSurface()` | 取消活动的 Surface |
| `getResolvedAnswer()` | 获取已解决的答案 (用于 HTTP 轮询) |

### 19.5.4.3 跨进程通信

当 CLI 在 MCP stdio 进程中运行时，没有本地 WebSocket 客户端。此时使用 HTTP POST 转发 Surface 到 Dashboard 服务器：

```typescript
private forwardSurfaceViaDashboard(surfaceUpdate): void {
  const req = http.request({
    hostname: '127.0.0.1',
    port: DASHBOARD_PORT,  // 默认 3456
    path: '/api/hook',
    method: 'POST',
    // ...
  });
  req.write(JSON.stringify({
    type: 'a2ui-surface',
    surfaceId: surfaceUpdate.surfaceId,
    components: surfaceUpdate.components,
    initialState: surfaceUpdate.initialState,
    displayMode: surfaceUpdate.displayMode,
  }));
  req.end();
}
```

## 19.5.5 与 MCP 协议的关系

A2UI 是 MCP 协议的上层应用协议，专门用于 Dashboard 场景：

```
┌─────────────────────────────────────────────────┐
│                   Application Layer              │
│  ┌─────────────┐  ┌─────────────┐               │
│  │ MCP Tools   │  │  A2UI UI    │               │
│  │ (ask_question)│  │  Rendering │               │
│  └──────┬──────┘  └──────┬──────┘               │
│         │                │                       │
├─────────┼────────────────┼───────────────────────┤
│         │   Transport Layer                      │
│  ┌──────▼────────────────▼──────┐               │
│  │      WebSocket / HTTP         │               │
│  └──────────────────────────────┘               │
└─────────────────────────────────────────────────┘
```

**关键区别**:

| 特性 | MCP 协议 | A2UI 协议 |
|------|----------|-----------|
| 传输层 | stdio / HTTP | WebSocket / HTTP |
| 方向 | 请求-响应 | 双向推送 |
| 用途 | 工具调用 | UI 渲染 |
| 数据格式 | JSON-RPC 2.0 | 自定义 JSON |

## 19.5.6 通信时序图

### 单问题流程

```
CLI Backend              Dashboard Server              Frontend
    │                          │                          │
    │  sendSurface()           │                          │
    ├─────────────────────────►│  WebSocket Broadcast     │
    │                          ├─────────────────────────►│
    │                          │                          │
    │                          │                          │  用户交互
    │                          │                          │
    │                          │  a2ui-action/answer      │
    │                          │◄─────────────────────────┤
    │  answerCallback()        │                          │
    │◄─────────────────────────┤                          │
    │                          │                          │
```

### 多问题流程 (submit-all)

```
CLI Backend              Dashboard Server              Frontend
    │                          │                          │
    │  sendSurface()           │                          │
    │  (multi-page)            │                          │
    ├─────────────────────────►│                          │
    │                          ├─────────────────────────►│
    │                          │                          │
    │                          │  toggle/select           │
    │                          │◄─────────────────────────┤
    │  (状态更新)               │                          │
    │                          │                          │
    │                          │  submit-all              │
    │                          │◄─────────────────────────┤
    │  multiAnswerCallback()   │                          │
    │◄─────────────────────────┤                          │
```

## 19.5.7 前端集成

### Frontend 组件库位置

```
ccw/frontend/src/packages/a2ui-runtime/
├── core/
│   ├── A2UITypes.ts         # 前端类型定义
│   ├── A2UIParser.ts        # Surface 解析器
│   └── A2UIComponentRegistry.ts  # 组件注册表
├── renderer/
│   ├── A2UIRenderer.tsx     # Surface 渲染器
│   └── components/          # UI 组件
│       ├── A2UIButton.tsx
│       ├── A2UICheckbox.tsx
│       ├── A2UIDropdown.tsx
│       ├── A2UITextField.tsx
│       └── ...
└── index.ts
```

### 使用示例

```typescript
// Frontend 接收并渲染 Surface
websocket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'a2ui-surface') {
    const surface = data.payload;
    // 使用 A2UIRenderer 渲染
    renderA2UISurface(surface);
  }
};

// Frontend 发送用户操作
websocket.send(JSON.stringify({
  type: 'a2ui-action',
  actionId: 'submit',
  surfaceId: 'surface-123',
  parameters: {
    questionId: 'q-001',
    value: 'selected-option'
  }
}));
```

## 19.5.8 设计决策

1. **Surface ID 设计**: 使用 UUID + 时间戳确保跨进程唯一性
2. **状态追踪分离**: multi/single select 和 input 使用独立 Map 存储
3. **HTTP 回退机制**: 当无 WebSocket 连接时，通过 `/api/hook` HTTP POST 转发
4. **答案缓存**: 已解决答案存储在 `resolvedAnswers` 中，支持 HTTP 轮询获取
5. **超时清理**: `removeStaleSurfaces()` 定期清理过期 Surface (默认 1 小时)

---

*下一章: [Chapter 19.6: Loop V2 路由](./ch19-6-loop-v2-routes.md)*
