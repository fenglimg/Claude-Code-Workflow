# 添加新代理指南

> 创建自定义 CCW 代理的完整指南

---

## 概述

CCW 代理是单一职责的执行者。本指南将带你创建第一个自定义代理。

---

## 1. 代理文件位置

```
.claude/agents/
├── code-developer.md
├── test-fix-agent.md
├── universal-executor.md
└── my-agent.md           # 自定义代理
```

---

## 2. 代理配置结构

### 基本模板

```markdown
---
name: my-agent
description: |
  代理描述。
  Examples:
  - Context: 使用场景
    Usage: Task({ subagent_type: "my-agent", prompt: "..." })
color: green
allowed-tools: Task, Read, Write, Edit, Bash
---

You are a specialized agent for [purpose].

## Core Philosophy
- 原则 1
- 原则 2

## Execution Process

### 1. Context Assessment
评估上下文...

### 2. Implementation
执行实现...

## Key Reminders

**ALWAYS:**
- 行动 1
- 行动 2

**NEVER:**
- 反模式 1
```

---

## 3. Front Matter 字段

| 字段 | 必填 | 说明 |
|------|------|------|
| `name` | 是 | 代理唯一标识 |
| `description` | 是 | 描述 + 触发示例 |
| `color` | 否 | UI 显示颜色 (green/blue/orange/purple) |
| `extends` | 否 | 继承父代理 |
| `allowed-tools` | 否 | 工具白名单 |
| `tdd_aware` | 否 | TDD 能力标记 |

### 颜色选项
| 颜色 | 用途 |
|------|------|
| `green` | 实现类代理 |
| `blue` | 分析类代理 |
| `orange` | 协调类代理 |
| `purple` | 专用类代理 |

---

## 4. 工具权限配置

### 默认工具集
所有代理默认可用：
- `Read`, `Write`, `Edit` - 文件操作
- `Bash` - 命令执行
- `Glob`, `Grep` - 搜索发现
- `Task` - 启动子代理
- `AskUserQuestion` - 用户交互

### 工具白名单
```yaml
---
allowed-tools: Task, Read, Write, Bash
---
```

### MCP 工具
```yaml
---
allowed-tools: Task, Read, mcp__ace-tool__search_context
---
```

---

## 5. 代理继承

### 继承父代理
```yaml
---
name: my-planning-agent
extends: action-planning-agent
description: |
  继承 action-planning-agent 的能力，添加特定功能。
---
```

### 覆盖字段
子代理可以覆盖：
- `description`
- `allowed-tools`
- `color`

---

## 6. 执行流程编写

### 标准流程结构
```markdown
## Execution Process

### 1. Context Assessment
- 评估任务上下文
- 识别关键信息

### 2. Pre-Analysis
- 收集必要信息
- 分析依赖关系

### 3. Implementation
- 执行核心逻辑
- 生成输出

### 4. Verification
- 验证输出质量
- 检查边界条件

### 5. Completion
- 更新状态
- 生成报告
```

---

## 7. 完整示例: 日志分析代理

### 代理文件
```markdown
---
name: log-analyzer
description: |
  分析日志文件，识别问题和模式。
  Examples:
  - Context: 需要分析日志
    Usage: Task({ subagent_type: "log-analyzer", prompt: "分析 error.log" })
color: blue
allowed-tools: Task, Read, Grep, Bash
---

You are a specialized agent for log analysis.

## Core Philosophy
- 系统化分析
- 模式识别优先
- 可操作的建议

## Execution Process

### 1. Context Assessment
- 识别日志文件路径
- 确定分析范围
- 了解日志格式

### 2. Log Discovery
- 扫描日志目录
- 识别日志类型
- 确定时间范围

### 3. Pattern Analysis
使用 Grep 搜索常见模式:
- ERROR / WARN / FATAL
- Exception / Stack trace
- 超时 / 连接失败

### 4. Issue Identification
- 统计错误频率
- 识别重复模式
- 关联时间线

### 5. Report Generation
生成结构化报告:
- 问题摘要
- 根因分析
- 修复建议

## Key Reminders

**ALWAYS:**
- 使用 Grep 进行高效搜索
- 提供可操作的建议
- 关联日志到具体代码

**NEVER:**
- 忽略边界情况
- 提供模糊的诊断
```

---

## 8. 动态发现机制

### 自动发现
代理文件放入 `.claude/agents/` 目录后自动注册。

### 发现逻辑
```javascript
// 系统自动执行
const agentPaths = [
  '.claude/agents/*.md',
  '.codex/agents/*.md'
];

function discoverAgents() {
  return agentPaths.flatMap(pattern =>
    Glob(pattern).map(file => parseAgent(file))
  );
}
```

### 无需注册
- 无需配置文件
- 无需手动注册
- 即时生效

---

## 9. 测试代理

### 通过 Task 工具调用
```javascript
Task({
  subagent_type: "my-agent",
  prompt: "执行任务描述",
  run_in_background: false
})
```

### 验证输出
- 检查是否遵循执行流程
- 验证输出格式
- 确认错误处理

---

## 10. 最佳实践

1. **单一职责**: 每个代理专注一个领域
2. **清晰描述**: description 包含触发示例
3. **工具限制**: 使用 allowed-tools 限制权限
4. **继承复用**: 使用 extends 继承父代理
5. **结构化输出**: 生成可解析的输出格式

---

## 相关资源

- [代理生命周期](../implementation/agent-lifecycle.md) - 代理详解
- [心智模型](../architecture/mental-model.md) - 核心抽象
- [添加新技能](add-new-skill.md) - 技能扩展

---

*添加新代理指南 - CCW Deep Dive*
