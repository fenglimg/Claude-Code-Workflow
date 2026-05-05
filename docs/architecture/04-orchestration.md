# 编排系统：Chain / Flow / Loop / Queue

> **层级**: L3 — 核心模块 | **更新**: 2026-05-03

## 四种编排机制对比

| 维度 | Chain | Flow | Loop | Queue |
|------|-------|------|------|-------|
| **模式** | 状态机 + DAG | DAG 拓扑排序 | 迭代序列 | 确定性状态机 |
| **节点类型** | Step/Decision/Delegate | PromptTemplate | CLI Step | Task |
| **决策方式** | LLM 决策路由 | 预定义 DAG | 成功条件表达式 | 状态转换规则 |
| **变量系统** | ChainVariable + Preload | {{variable}} 插值 | 步骤参数 | 队列上下文 |
| **跨模块** | DelegateNode 跨链 | 固定拓扑 | 无 | 多队列并行 |
| **适用场景** | 渐进式 Skill 加载 | 复杂工作流管道 | 自动化重复执行 | 后台任务调度 |
| **核心文件** | `chain-loader.ts` | `flow-executor.ts` | `loop-manager.ts` | `queue-scheduler-service.ts` |

---

## 1. Chain Loader — 渐进式 Skill 链

### 类型系统

```
ChainNode = StepNode | DecisionNode | DelegateNode

StepNode:
  type: 'step'
  content_ref?: '@phases/01-xxx.md'  ← 相对 skill 目录解析
  content_inline?: '直接文本'        ← 支持内嵌 @path 引用
  content_files?: ['@a.md', '@b.md'] ← 多文件拼接
  next: string | null                ← 下一节点 ID

DecisionNode:
  type: 'decision'
  prompt: 'LLM 决策提示'
  choices: [{ label, description, next }]
  default: '默认选项 ID'

DelegateNode:
  type: 'delegate'
  chain: '→target_chain_id'          ← 跨链委托
  variables: { ... }                 ← 变量作用域传递
```

### 9 个生命周期命令

```
list       — 列出可用 chains（含 triggers/entries）
inspect    — 展示 chain 节点拓扑图
start      — 启动 chain session（解析 preload，初始化变量）
next       — 读取当前节点（active 幂等，completed 推进）
done       — 完成当前节点并推进（decision 需 choice 参数）
status     — 查询 session 状态（变量 + preload 信息）
content    — 获取所有已加载内容
complete   — 标记 session 完成
visualize  — 实时执行进度可视化（chain 嵌套）
```

### 核心状态机

```
advanceToNext() (L440-L731):
  1. 判断当前节点类型
  2. StepNode → 加载内容 → 自动标记完成 → 推进到 next
  3. DecisionNode → 等待 LLM 决策 → 根据 choice 推进
  4. DelegateNode → 压入 chain_stack → 启动子链
     - 子链完成 → 弹出 stack → 恢复父链
     - 变量作用域隔离（子链变量不污染父链）
  5. next === null → chain 完成
  6. next === '→chain_id' → 跨链路由（findChainAcrossSkills()）
```

### 预加载系统

```
resolvePreloadSource() (L1071-L1107):
  支持 3 种源:
    @path/file.md     → 文件系统读取
    @~/path           → 用户目录解析
    memory:MEMORY.md   → 记忆系统查找

  错误策略: required=false → 缺失警告不中断
           required=true  → 缺失报错中止
```

### 隐式依赖风险

```
- @path/file.md 引用 → 文件改名导致内容缺失（运行时才发现）
- findChainAcrossSkills() → chain_id 字符串匹配，改名即断
- chain_stack → JSON 文件查找 fail → 委托静默失败
```

---

## 2. Flow Executor — DAG 管道执行

### Kahn 拓扑排序

```
topologicalSort() (L491-L536):
  1. 构建邻接表 (DAGNode: incoming[] + outgoing[])
  2. 计算入度
  3. 入度为 0 的节点入队
  4. 循环: 出队 → 加入结果 → 减少下游入度 → 入度为 0 入队
  5. 结果长度 ≠ 节点总数 → 存在环，报错
```

### 执行流程

```
executeFlowById():
  → buildDAG()       — 构建 DAG 邻接表
  → topologicalSort() — Kahn 算法排序
  → getReadyNodes()  — 获取可并行执行的节点
  → executeNode()     — 逐节点执行
    → NodeRunner.run()
      → runPromptTemplate()  — 统一提示模板执行
        → assembleInstruction() — CLI 指令组装
        → executeCliTool()      — CLI 执行
        → cliSessionMux         — 会话复用
      → persistState()     — status.json
      → broadcastStateUpdate() — WebSocket
```

### 变量插值

```
interpolate() (L99-L163):
  语法: {{variable}} 和 [variable_name]
  支持: 嵌套访问 {{result.output}}, {{prevResult.exitCode}}
  行为: 未解析占位符保留原样（不报错）
  风险: 变量改名导致静默插值失败
```

### 节点生命周期

```
executeNode() (L681-L752):
  onError 策略:
    - continue: 记录错误，继续下一个
    - pause: 暂停等待人工干预
    - fail: 标记失败，停止 pipeline
```

---

## 3. Loop Manager — 迭代序列执行

### 核心循环

```
startLoop():
  → LoopStateManager.createState()
  → runNextStep() (异步非阻塞)
    → 检查终止条件 (shouldTerminate)
    → 获取当前步骤配置
    → 执行 CLI 步骤
    → 更新状态
    → setImmediate(runNextStep)  ← 避免阻塞事件循环
```

### Sandbox 条件评估

```
evaluateSuccessCondition() (L225-L302):
  安全措施:
    - 白名单正则匹配允许的表达式
    - 阻止的模式: require, import, process, fs, child_process
    - 受限 Proxy 上下文（只读变量访问）
  风险: 需要评估是否升级到 vm2/isolated-vm
```

### 错误策略

```
handleError() (L332-L364):
  pause:    暂停循环，等待人工处理
  retry:    重试当前步骤（有限次数）
  fail_fast: 立即标记失败
```

---

## 4. Queue Scheduler — 后台任务调度

### 状态机

```
VALID_TRANSITIONS:
  idle      → running
  running   → paused  | stopping
  paused    → running | stopping
  stopping  → done    | failed
  done      → (终态)
  failed    → (终态)
```

### 3 层会话池

```
Session Pool:
  maxConcurrent = 2
  resumeKey affinity  — 相同 key 复用会话
  idle reuse          — 空闲会话优先分配
  new session         — 按需创建新会话
```

### 关键文件

| 文件 | 职责 |
|------|------|
| `chain-loader.ts` | Chain 执行引擎 + 9 生命周期命令 |
| `chain-types.ts` | Chain 类型定义 |
| `flow-executor.ts` | DAG Flow 执行引擎 |
| `loop-manager.ts` | Loop 管理器 |
| `loop-state-manager.ts` | Loop 状态持久化 |
| `loop-task-manager.ts` | Loop 任务管理 |
| `queue-scheduler-service.ts` | Queue 状态机调度 |
| `orchestrator-routes.ts` | Flow 控制端点 |
| `chain-visualizer.ts` | Chain 拓扑可视化 |
