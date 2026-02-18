# Chapter 42: 宪法法庭 — Schema 验证层与执行层次

> **生命周期阶段**: 数据输入 → 中间处理 → 输出验证
> **涉及资产**: JSON Schema + TypeScript Types + Validation Hierarchy
> **阅读时间**: 40-55 分钟
> **版本追踪**: `.ccw/workflows/cli-templates/schemas/*.json`

---

## 0. 资产证言 (Asset Testimony)

> *"我是 `Schema 验证层`。人们叫我'宪法法庭'——因为我裁决一切数据的合法性。"*
>
> *"我的判决是绝对的。任何不符合 Schema 的数据，都将被驳回。这不是建议，是法律。"*
>
> *"我有三层验证：入口验证（输入是否合法）、中间验证（处理过程是否合规）、输出验证（结果是否符合契约）。每一层都是一道关卡，任何一道关卡失败，流程都会中止。"*
>
> *"...但最近，我发现了一种'类型漂移'的幽灵。TypeScript 的类型定义和 JSON Schema 慢慢变得不一致。开发者更新了类型，却忘了更新 Schema。宪法和现实之间的裂缝，正在扩大..."*

```markdown
调查进度: ██████████ 59%
幽灵位置: Validation 层 — Schema 验证
本章线索: TypeScript 类型与 JSON Schema 漂移
           └── 类型更新未同步到 Schema
           └── 跨语言边界的类型丢失
           └── 运行时验证与编译时检查的断层
```

---

## 苏格拉底式思考

> **Q1**: 为什么需要 Schema 验证，有了 TypeScript 类型还不够吗？

在看代码之前，先思考：
1. TypeScript 类型在什么时候生效？
2. 运行时数据来自哪里？
3. 跨语言边界时类型如何传递？

---

> **架构陷阱 42.1**: 既然 TypeScript 有类型检查，为什么还需要 JSON Schema 验证？这不是重复吗？
>
> **陷阱方案**: 只依赖 TypeScript 类型，移除运行时 Schema 验证。
>
> **思考点**:
> - TypeScript 类型不是已经够用了吗？
> - 运行时验证有什么额外价值？
> - 维护两套"类型系统"不是增加了负担？
>
> <details>
> <summary>**揭示陷阱**</summary>
>
> **致命缺陷 1：编译时 vs 运行时**
>
> ```
> TypeScript 类型:
> - 只在编译时生效
> - 编译后类型信息被擦除
> - 运行时无法访问类型信息
> 
> 运行时数据来源:
> - API 请求（JSON）
> - 数据库查询（JSON/对象）
> - 文件读取（JSON/YAML）
> - 用户输入（字符串）
> 
> 这些数据在运行时到达，TypeScript 无法预测
> 
> 示例:
> 
> // TypeScript 编译时
> interface User {
>   id: string;
>   name: string;
>   age: number;
> }
> 
> function processUser(user: User) {
>   // TypeScript 保证 user.age 是 number
>   const nextAge = user.age + 1;
> }
> 
> // 运行时（API 请求）
> const requestBody = await req.json();
> // requestBody 是 any，类型已被擦除
> // requestBody.age 可能是 "25"（字符串）！
> 
> processUser(requestBody);  // TypeScript 不会报错
> // 但运行时会出错： "25" + 1 = "251"
> ```
>
> **致命缺陷 2：跨语言边界**
>
> ```
> 场景: TypeScript 前端 ↔ Python 后端
> 
> TypeScript 定义:
> interface Response {
>   data: User[];
>   total: number;
> }
> 
> Python 实现:
> def get_users():
>     return {
>         "data": [...],
>         "total": len(users)  # 可能返回 float: 5.0
>     }
> 
> 问题:
> - Python 不知道 TypeScript 的类型定义
> - Python 返回 5.0（float），TypeScript 期望 5（int）
> - 没有运行时验证，这个错误会被忽略
> ```
>
> **致命缺陷 3：API 契约**
>
> ```
> 场景: 第三方 API 集成
> 
> 你的代码假设:
> response.user.email 是 string
> 
> API 文档说:
> response.user.email 是 string
> 
> 但 API 实际返回:
> response.user.email 是 null（用户未设置邮箱）
> 
> 如果没有运行时验证:
> - 你的代码会崩溃
> - 或者产生意外行为
> - 错误难以追踪（发生在生产环境）
> ```
>
> **正确的设计**:
>
> ```
> 类型系统的分工:
> 
> TypeScript 类型:
> - 编译时类型检查
> - IDE 自动补全
> - 开发体验优化
> 
> JSON Schema:
> - 运行时数据验证
> - 跨语言契约定义
> - API 文档生成
> 
> 两者配合:
> 1. 用 TypeScript 类型指导开发
> 2. 用 JSON Schema 验证运行时数据
> 3. 保持两者同步（工具辅助）
> ```
>
> </details>

---

## 第一幕：失控的边缘 (Out of Control)

### 没有宪法法庭的世界

想象一下，如果项目没有 Schema 验证：

```markdown
场景: API 请求处理

请求:
POST /api/users
{
  "name": "Alice",
  "age": "25",       // 字符串，应该是数字
  "email": "invalid" // 无效邮箱格式
}

处理代码:
function createUser(data: CreateUserDTO) {
  // TypeScript 类型期望 age 是 number
  // 但运行时 age 是 "25"（字符串）
  
  const age = data.age + 1;  // "251" 而不是 26
  // 后续逻辑错误...
}

数据库:
INSERT INTO users (name, age, email)
VALUES ('Alice', '251', 'invalid');  // 数据污染

[1 个月后]

报表系统:
"用户平均年龄: 251 岁"

问题:
- 没有入口验证
- 错误数据进入系统
- 污染扩散到下游
```

**问题本质**: 没有验证的数据，就是"定时炸弹"。

### 三层验证架构

`Schema 验证层` 的三层关卡：

```
┌─────────────────────────────────────────────────────────────┐
│                    宪法法庭的三层关卡                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────┐               │
│  │ 第一层: 入口验证 (Input Validation)     │               │
│  │                                         │               │
│  │ 检查点:                                 │               │
│  │ • API 请求参数                          │               │
│  │ • 命令行参数                            │               │
│  │ • 配置文件                              │               │
│  │ • 外部服务响应                          │               │
│  │                                         │               │
│  │ 验证器:                                 │               │
│  │ • JSON Schema                          │               │
│  │ • Zod / Joi / Yup                      │               │
│  │ • 自定义验证函数                        │               │
│  │                                         │               │
│  │ 行为: 验证失败 → 拒绝请求               │               │
│  └─────────────────────────────────────────┘               │
│       │                                                     │
│       ▼ (验证通过)                                           │
│  ┌─────────────────────────────────────────┐               │
│  │ 第二层: 中间验证 (Intermediate Valid)   │               │
│  │                                         │               │
│  │ 检查点:                                 │               │
│  │ • 阶段间数据传递                        │               │
│  │ • Agent 间上下文传递                    │               │
│  │ • Skill 间参数传递                      │               │
│  │                                         │               │
│  │ 验证器:                                 │               │
│  │ • 内部 Schema (context-schema.json)    │               │
│  │ • TypeScript 类型守卫                   │               │
│  │                                         │               │
│  │ 行为: 验证失败 → 中止流程 + 错误报告     │               │
│  └─────────────────────────────────────────┘               │
│       │                                                     │
│       ▼ (验证通过)                                           │
│  ┌─────────────────────────────────────────┐               │
│  │ 第三层: 输出验证 (Output Validation)    │               │
│  │                                         │               │
│  │ 检查点:                                 │               │
│  │ • API 响应                              │               │
│  │ • 生成文件                              │               │
│  │ • 任务 JSON                             │               │
│  │                                         │               │
│  │ 验证器:                                 │               │
│  │ • Response Schema                      │               │
│  │ • task-schema.json                     │               │
│  │ • plan-json-schema.json                │               │
│  │                                         │               │
│  │ 行为: 验证失败 → 回滚 + 警告             │               │
│  └─────────────────────────────────────────┘               │
│       │                                                     │
│       ▼ (全部通过)                                           │
│  输出: 合法数据                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 第二幕：思维脉络 (The Neural Link)

### 2.1 执行层次

**四层执行架构**:

```mermaid
graph TB
    subgraph "Layer 1: CLI Entry"
        A1[ccw cli -p "..."]
        A2[Parameter Parsing]
        A3[Input Validation]
    end
    
    subgraph "Layer 2: Skill Orchestration"
        B1[workflow-plan]
        B2[Phase Execution]
        B3[Phase-to-Phase Validation]
    end
    
    subgraph "Layer 3: Agent Execution"
        C1[action-planning-agent]
        C2[Tool Invocation]
        C3[Tool Output Validation]
    end
    
    subgraph "Layer 4: Persistence"
        D1[SQLite Write]
        D2[File System Write]
        D3[Output Validation]
    end
    
    A1 --> A2 --> A3
    A3 --> B1 --> B2 --> B3
    B3 --> C1 --> C2 --> C3
    C3 --> D1 --> D2 --> D3
```

### 2.2 Schema 层次结构

**CCW 的 Schema 家族**:

```
plan-json-schema.json (宪法)
├── task-schema.json (条款)
│   ├── step-schema.json (细则)
│   └── dependency-schema.json (关系)
├── context-schema.json (背景)
│   └── focus_paths: string[]
└── output-schema.json (结论)
    ├── files_modified: string[]
    └── tests_passed: boolean
```

### 2.3 类型同步机制

**TypeScript 类型 ↔ JSON Schema 同步**:

```javascript
// 方案 1: 从 TypeScript 生成 Schema
// 使用 typescript-json-schema 或 ts-json-schema-generator

// TypeScript 定义
interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  dependencies: string[];
}

// 自动生成的 Schema
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "title": { "type": "string" },
    "status": { 
      "type": "string",
      "enum": ["pending", "in_progress", "completed"]
    },
    "dependencies": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["id", "title", "status"]
}

// 方案 2: 从 Schema 生成 TypeScript
// 使用 json-schema-to-typescript

// 方案 3: 使用 Zod 统一
import { z } from "zod";

const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed']),
  dependencies: z.array(z.string())
});

type Task = z.infer<typeof TaskSchema>;  // 自动生成 TypeScript 类型
```

---

## 第三幕：社交网络 (The Social Network)

### 验证器选型

| 验证器 | 优点 | 缺点 | 适用场景 |
|--------|------|------|----------|
| **JSON Schema** | 标准化、跨语言 | 冗长、表达力有限 | API 契约 |
| **Zod** | TypeScript 友好 | 仅 JS/TS | Node.js 后端 |
| **Joi** | 功能丰富 | 仅 JS/TS | Express 验证 |
| **Pydantic** | Python 原生 | 仅 Python | FastAPI 后端 |

### 验证点分布

```yaml
CCW 中的验证点:

CLI 层:
  - cli-tools.json: 工具配置验证
  - 参数解析: --tool, --mode 验证

Skill 层:
  - context-package.json: 上下文结构验证
  - planning-notes.md: 格式验证（可选）

Agent 层:
  - 输入参数: 任务参数验证
  - 输出结果: 结果结构验证

Output 层:
  - IMPL_PLAN.md: 结构验证
  - IMPL-*.json: 任务 Schema 验证
  - TODO_LIST.md: 格式验证（可选）
```

---

## 第四幕：造物主的私语 (The Creator's Secret)

### 秘密一：类型漂移的根源

```markdown
问题: TypeScript 类型与 JSON Schema 不一致

根源分析:

1. 更新不同步
   - 开发者更新了 TypeScript 类型
   - 忘记更新 JSON Schema
   - 或者更新了 Schema，忘记更新类型

2. 没有强制同步机制
   - 两者是独立文件
   - 没有工具检查一致性
   - 依赖人工维护

3. 不同的表达力
   - TypeScript 支持 readonly, optional, union
   - JSON Schema 有不同的表达方式
   - 转换可能丢失信息

示例:

// TypeScript
interface Config {
  timeout: number;  // seconds
  retries?: number;
}

// JSON Schema (过时)
{
  "timeout": { "type": "integer" },  // 应该是 number
  "retries": { "type": "integer" }   // 应该是 optional
}
```

### 秘密二：跨边界类型丢失

```markdown
问题: Python 返回的 int 在 TypeScript 中变成 float

根源分析:

1. JSON 类型系统
   - JSON 只有 number，没有 int/float 区分
   - Python 的 int 序列化为 JSON number
   - TypeScript 反序列化时无法区分

2. BigInt 问题
   - Python 支持任意精度整数
   - JSON 不支持 BigInt
   - 大整数会丢失精度

3. 日期问题
   - Python datetime 序列化为字符串
   - TypeScript Date 需要手动解析
   - 格式可能不一致

解决方案:
1. 使用字符串表示大整数
2. 使用 ISO 8601 格式表示日期
3. Schema 中明确类型约束
```

---

## 第五幕：进化的插槽 (The Upgrade)

### 插槽一：自动类型同步

```yaml
# 当前: 手动维护
sync: manual

# 可以扩展
sync:
  source: typescript  # 从 TypeScript 生成 Schema
  output: json-schema
  hooks:
    - pre-commit: validate-sync  # 提交前验证同步
    - ci: check-schema-drift    # CI 中检查漂移
```

### 插槽二：严格模式

```yaml
# 当前: 宽松验证
strictness: loose

# 可以扩展
strictness:
  input: strict   # 严格验证输入
  output: strict  # 严格验证输出
  internal: loose # 内部传递可以宽松
```

### 插槽三：自定义验证器

```yaml
# 当前: 标准 JSON Schema
validators: default

# 可以扩展
validators:
  - name: email-format
    pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
  - name: task-id-format
    pattern: "^IMPL-[0-9]+$"
  - name: semantic-version
    pattern: "^[0-9]+\\.[0-9]+\\.[0-9]+$"
```

---

## 6. 事故复盘档案 #42

> *时间: 2024-05-12 08:27:43 UTC*
> *影响: 任务 JSON 解析失败，工作流无法执行*

### 案情还原

**场景**: 更新了任务 Schema，但没有更新 TypeScript 类型。

```markdown
更新前 (TypeScript):
interface Task {
  id: string;
  title: string;
  assignee?: string;
}

更新后 (JSON Schema):
{
  "properties": {
    "id": { "type": "string" },
    "title": { "type": "string" },
    "assignees": {  // 改为复数！
      "type": "array",
      "items": { "type": "string" }
    }
  }
}

后果:
1. workflow-plan 生成任务时使用 assignees (数组)
2. TypeScript 代码期望 assignee (字符串)
3. 运行时: task.assignee = undefined
4. 后续逻辑失败: "无法获取任务的负责人"
```

**根本原因**:
- Schema 更新没有同步到 TypeScript
- 没有强制一致性检查
- 依赖人工维护

### 修复措施

1. **类型同步工具**: 使用 ts-json-schema-generator 自动生成 Schema
2. **CI 检查**: 添加 Schema-Types 一致性检查
3. **版本化 Schema**: Schema 变更需要版本更新和迁移

> **教训**:
> *"类型系统是城市的法律。法律和现实不一致，城市就会混乱。"*

### 幽灵旁白：类型的幽灵

此事故揭示了一个更深层的问题：

```
类型的"幽灵"现象:

TypeScript 类型:
- 存在于编译时
- 帮助开发者编写正确代码
- 编译后消失

JSON Schema:
- 存在于运行时
- 验证实际数据
- 永远存在

两者的断层:
- TypeScript 类型可以被"绕过"（any, @ts-ignore）
- JSON Schema 可以被"跳过"（验证失败后继续）
- 人工维护的同步不可靠

幽灵:
- 当两者不一致时
- 编译通过，运行时崩溃
- 或者运行时验证失败，但开发者不知道为什么
- 错误信息指向"不存在的问题"（类型说没问题，Schema 说有问题）
```

**幽灵的低语**: 类型系统是"信任的桥梁"。TypeScript 信任开发者会写正确的代码，Schema 信任数据会是正确的格式。当这两份信任出现断层时，桥梁就会断裂...

---

## 附录

### A. Schema 文件索引

| 文件 | 用途 | 位置 |
|------|------|------|
| `plan-json-schema.json` | 计划结构 | `.ccw/workflows/cli-templates/schemas/` |
| `task-schema.json` | 任务结构 | `.ccw/workflows/cli-templates/schemas/` |
| `context-schema.json` | 上下文结构 | `.ccw/workflows/cli-templates/schemas/` |
| `cli-tools.schema.json` | CLI 工具配置 | `~/.claude/` |

### B. 验证最佳实践

```markdown
1. 入口验证
   - 验证所有外部输入
   - 失败时返回清晰的错误信息
   - 不信任任何外部数据

2. 中间验证
   - 验证阶段间传递的数据
   - 使用 TypeScript 类型守卫
   - 开发模式下严格，生产模式下可放宽

3. 输出验证
   - 验证最终输出格式
   - 生成可追溯的验证日志
   - 失败时回滚
```

### C. 下一章

[Chapter 43: 系统稳定性报告 — Part XI-B MEU 漂移与幽灵追踪](./43-stability-report.md) - Part XI-B 完成总结

---

*版本: 2.0.0*
*会话: ANL-ccw-architecture-audit-2025-02-17*
*风格: "小说化" Part XI-B Chapter 42*
*最后更新: Round 1 - Schema Validation Layer*
